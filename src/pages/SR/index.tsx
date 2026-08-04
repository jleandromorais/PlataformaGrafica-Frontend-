import { useEffect, useMemo, useState } from "react";
import { Activity, Download, RefreshCw, Save, Trash2, Zap } from "lucide-react";
import { Card } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { Input, Select } from "../../components/ui/Input";
import { Alert } from "../../components/ui/Alert";
import { brl, num } from "../../utils/format";
import { colorForValue } from "../../theme";
import {
  buscarTrimestreSR,
  calcularTrimestreSR,
  carregarTrimestreSR,
  listarSessoesSR,
  salvarTrimestreSR,
} from "../../api";
import type { SRLinhaCalculada, SRSessaoPMPV } from "../../types";

const MESES_ABREVS = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

function linhaVazia(mes: string): SRLinhaCalculada {
  return {
    mes,
    vp: 0,
    vf: 0,
    pr: 0,
    selic_mensal: 0,
    sr_anterior: 0,
    diferenca: 0,
    sr_parcela: 0,
    sr_selic: 0,
    total: 0,
  };
}

/** Replica TelaSR._get_trimestre_labels: monta "Mes/Ano" avançando o ano
 * quando o mês seguinte "volta" no calendário (ex.: Nov, Dez, Jan). */
function labelsTrimestre(meses: string[], anoBase: number): string[] {
  const resultado: string[] = [];
  let anoAtual = anoBase;
  meses.forEach((mes, i) => {
    const idx = MESES_ABREVS.indexOf(mes);
    if (i > 0) {
      const idxAnt = MESES_ABREVS.indexOf(meses[i - 1]);
      if (idx < idxAnt) anoAtual += 1;
    }
    resultado.push(`${mes}/${anoAtual}`);
  });
  return resultado;
}

function calcularLocal(linhas: SRLinhaCalculada[]): { linhas: SRLinhaCalculada[]; total: number } {
  let total = 0;
  const calculadas = linhas.map((l) => {
    const diferenca = l.vp - l.vf;
    const sr_parcela = diferenca * l.pr;
    const sr_selic = sr_parcela * (1 + l.selic_mensal / 100) + l.sr_anterior;
    total += sr_selic;
    return { ...l, diferenca, sr_parcela, sr_selic, total: sr_selic };
  });
  return { linhas: calculadas, total };
}

export default function SRPage() {
  const anoAtual = new Date().getFullYear();
  const [ano, setAno] = useState(anoAtual);
  const [meses, setMeses] = useState(["Jan", "Fev", "Mar"]);
  const [linhas, setLinhas] = useState<SRLinhaCalculada[]>(() =>
    labelsTrimestre(["Jan", "Fev", "Mar"], anoAtual).map(linhaVazia)
  );
  const [total, setTotal] = useState(0);

  const [sessoes, setSessoes] = useState<SRSessaoPMPV[]>([]);
  const [sessaoId, setSessaoId] = useState<number | null>(null);
  const [carregandoSessoes, setCarregandoSessoes] = useState(false);
  const [carregandoBanco, setCarregandoBanco] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);

  const labelsAtuais = useMemo(() => labelsTrimestre(meses, ano), [meses, ano]);
  const trimestreLabel = useMemo(
    () => (labelsAtuais.length ? `${labelsAtuais[0]}_${labelsAtuais[labelsAtuais.length - 1]}` : ""),
    [labelsAtuais]
  );

  const carregarSessoes = async () => {
    setCarregandoSessoes(true);
    setErro(null);
    try {
      const dados = await listarSessoesSR();
      setSessoes(dados);
      if (dados.length && sessaoId === null) setSessaoId(dados[0].id);
    } catch {
      setErro("Não foi possível carregar as sessões do PMPV.");
    } finally {
      setCarregandoSessoes(false);
    }
  };

  useEffect(() => {
    carregarSessoes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const aplicarTrimestre = () => {
    const labels = labelsTrimestre(meses, ano);
    setLinhas(labels.map(linhaVazia));
    setTotal(0);
    setAviso(null);
  };

  const recalcularLocal = (novasLinhas: SRLinhaCalculada[]) => {
    const resultado = calcularLocal(novasLinhas);
    setLinhas(resultado.linhas);
    setTotal(resultado.total);
  };

  const atualizarCampo = (idx: number, campo: keyof SRLinhaCalculada, valor: string) => {
    const next = [...linhas];
    next[idx] = { ...next[idx], [campo]: parseFloat(valor.replace(",", ".")) || 0 };
    recalcularLocal(next);
  };

  const calcularNoBackend = async () => {
    setErro(null);
    try {
      const resultado = await calcularTrimestreSR(
        linhas.map(({ mes, vp, vf, pr, selic_mensal, sr_anterior }) => ({
          mes,
          vp,
          vf,
          pr,
          selic_mensal,
          sr_anterior,
        }))
      );
      setLinhas(resultado.linhas);
      setTotal(resultado.total);
    } catch {
      setErro("Falha ao calcular SR no servidor. Usando cálculo local.");
      recalcularLocal(linhas);
    }
  };

  const carregarDoBanco = async () => {
    if (sessaoId === null) return;
    setCarregandoBanco(true);
    setErro(null);
    try {
      const dados = await carregarTrimestreSR(sessaoId, labelsAtuais);
      const novasLinhas = linhas.map((l, i) => ({
        ...l,
        vp: dados[i]?.vp ?? l.vp,
        vf: dados[i]?.vf ?? l.vf,
        pr: dados[i]?.pr ?? l.pr,
      }));
      recalcularLocal(novasLinhas);
    } catch {
      setErro("Não foi possível carregar VP/VF/PR do banco para este trimestre.");
    } finally {
      setCarregandoBanco(false);
    }
  };

  const salvar = async () => {
    if (linhas.every((l) => l.vp === 0 && l.vf === 0)) {
      setAviso("Preencha os dados do trimestre antes de salvar.");
      return;
    }
    setSalvando(true);
    setErro(null);
    setAviso(null);
    try {
      await salvarTrimestreSR(labelsAtuais, labelsAtuais[labelsAtuais.length - 1], linhas);
      setAviso(`SR trimestral salvo. Total = ${brl(total)}`);
    } catch {
      setErro("Falha ao salvar o SR trimestral no banco.");
    } finally {
      setSalvando(false);
    }
  };

  const carregarTrimestreSalvo = async () => {
    setErro(null);
    try {
      const salvo = await buscarTrimestreSR(trimestreLabel);
      if (!salvo.length) {
        setAviso("Nenhum SR salvo para este trimestre ainda.");
        return;
      }
      const novasLinhas = labelsAtuais.map((label, i) => {
        const s = salvo[i] as Record<string, number> | undefined;
        return s ? { ...linhaVazia(label), ...s, mes: label } : linhaVazia(label);
      });
      recalcularLocal(novasLinhas);
    } catch {
      setAviso("Nenhum SR salvo para este trimestre ainda.");
    }
  };

  const limpar = () => {
    aplicarTrimestre();
  };

  return (
    <div className="min-h-screen bg-[#050505] px-6 py-8 sm:px-10">
      <div className="mx-auto flex w-full max-w-[1600px] flex-col gap-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span
            className="flex h-9 w-9 items-center justify-center rounded-xl"
            style={{ backgroundColor: "#22d3ee17", color: "#22d3ee" }}
          >
            <Activity size={16} />
          </span>
          <div>
            <h1 className="text-[1.75rem] font-bold tracking-tight text-white">SR</h1>
            <p className="text-sm text-zinc-500 mt-0.5">
              Saldo Remanescente Trimestral — SR = (VP − VF) × PR × (1 + SELIC) + SR anterior
            </p>
          </div>
        </div>
      </div>

      {erro && <Alert variant="error">{erro}</Alert>}
      {aviso && <Alert variant="info">{aviso}</Alert>}

      <Card title="Carregar VP e VF do banco">
        <div className="flex flex-wrap items-end gap-3">
          <div className="min-w-[280px] flex-1">
            <Select
              label="Sessão PMPV"
              value={sessaoId ?? ""}
              onChange={(e) => setSessaoId(Number(e.target.value))}
              options={
                sessoes.length
                  ? sessoes.map((s) => ({
                      value: String(s.id),
                      label: `${s.nome}  —  VP: ${num(s.vp)} m³  [${s.data_criacao?.slice(0, 10) ?? ""}]`,
                    }))
                  : [{ value: "", label: "(nenhuma sessão)" }]
              }
            />
          </div>
          <Button
            variant="success"
            icon={<Zap size={14} />}
            loading={carregandoBanco}
            disabled={sessaoId === null}
            onClick={carregarDoBanco}
          >
            Carregar VP/VF
          </Button>
          <Button
            variant="ghost"
            icon={<RefreshCw size={14} />}
            loading={carregandoSessoes}
            onClick={carregarSessoes}
          >
            Recarregar sessões
          </Button>
        </div>

        <div className="mt-4 flex flex-wrap items-end gap-3 border-t border-white/[0.07] pt-4">
          <Input
            label="Ano"
            type="number"
            value={ano}
            onChange={(e) => setAno(Number(e.target.value))}
            className="w-24"
          />
          {[0, 1, 2].map((i) => (
            <Select
              key={i}
              label={`Mês ${i + 1}`}
              value={meses[i]}
              onChange={(e) => {
                const next = [...meses];
                next[i] = e.target.value;
                setMeses(next);
              }}
              options={MESES_ABREVS.map((m) => ({ value: m, label: m }))}
            />
          ))}
          <Button variant="ghost" onClick={aplicarTrimestre}>
            Aplicar trimestre
          </Button>
          <Button variant="ghost" onClick={carregarTrimestreSalvo}>
            Abrir trimestre salvo
          </Button>
        </div>
      </Card>

      <div className="space-y-3">
        {linhas.map((linha, idx) => (
          <Card key={linha.mes} title={linha.mes}>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-6 items-end">
              <Input
                label="VP (m³)"
                type="number"
                step="0.01"
                value={linha.vp || ""}
                onChange={(e) => atualizarCampo(idx, "vp", e.target.value)}
              />
              <Input
                label="VF (m³)"
                type="number"
                step="0.01"
                value={linha.vf || ""}
                onChange={(e) => atualizarCampo(idx, "vf", e.target.value)}
              />
              <Input
                label="PR (R$/m³)"
                type="number"
                step="0.0001"
                value={linha.pr || ""}
                onChange={(e) => atualizarCampo(idx, "pr", e.target.value)}
              />
              <Input
                label="SELIC mensal (%)"
                type="number"
                step="0.0001"
                value={linha.selic_mensal || ""}
                onChange={(e) => atualizarCampo(idx, "selic_mensal", e.target.value)}
              />
              <Input
                label="SR anterior (R$)"
                type="number"
                step="0.01"
                value={linha.sr_anterior || ""}
                onChange={(e) => atualizarCampo(idx, "sr_anterior", e.target.value)}
              />
              <div className="flex flex-col gap-1">
                <span className="text-[0.7rem] font-semibold text-zinc-500 uppercase tracking-[0.08em]">
                  SR parcela
                </span>
                <span className={`text-sm font-bold ${colorForValue(linha.sr_selic)}`}>
                  {brl(linha.sr_selic)}
                </span>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <Card className="border border-cyan-500/20">
        <div className="flex flex-wrap items-center gap-4">
          <span className="text-sm text-zinc-400">SR TOTAL =</span>
          <span className={`text-3xl font-extrabold ${colorForValue(total)}`}>{brl(total)}</span>
          <span className="text-xs text-zinc-600">
            {linhas.map((l) => `${l.mes}: ${brl(l.sr_selic)}`).join("   |   ")}
          </span>
        </div>
      </Card>

      <div className="flex flex-wrap gap-3">
        <Button variant="success" icon={<Zap size={16} />} onClick={calcularNoBackend}>
          Calcular SR
        </Button>
        <Button variant="purple" icon={<Save size={16} />} loading={salvando} onClick={salvar}>
          Salvar no BD
        </Button>
        <Button variant="ghost" icon={<Download size={16} />} disabled title="Requer fluxo de Excel Final (Módulo 9) — pendente">
          Excel Final (Módulo 9)
        </Button>
        <Button variant="ghost" icon={<Trash2 size={16} />} onClick={limpar}>
          Limpar
        </Button>
      </div>
      </div>
    </div>
  );
}
