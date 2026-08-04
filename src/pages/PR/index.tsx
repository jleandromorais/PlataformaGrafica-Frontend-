import { useEffect, useMemo, useState } from "react";
import { Lightbulb, RefreshCw, Save, Trash2, Zap } from "lucide-react";
import { Card } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { Input, Select } from "../../components/ui/Input";
import { Alert } from "../../components/ui/Alert";
import { EmptyState } from "../../components/ui/EmptyState";
import { Table } from "../../components/ui/Table";
import { brl, m3 } from "../../utils/format";
import { colorForValue } from "../../theme";
import {
  buscarTrimestralPR,
  getTrimestresFiscais,
  listarPeriodosPR,
  listarSrAnterioresPR,
  salvarPR,
} from "../../api";
import type { PRMesDecomposicao, PRSrAnterior } from "../../types";

const MESES_ABREVS = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

const SR_ANTERIOR_LABELS = [
  "2º SR anterior (ex: Nov/25–Jan/26)",
  "1º SR anterior — mês 1 (ex: Fev/26)",
  "1º SR anterior — mês 2 (ex: Mar/26)",
  "SR adicional",
];

/** Replica TelaPR._get_periodos_trimestre: Nov/Dez pertencem ao ano anterior
 * do trimestre fiscal. */
function periodosTrimestre(trimestre: { meses: string[] } | undefined, ano: number): string[] {
  if (!trimestre) return [];
  return trimestre.meses.map((mes) => {
    const idx = MESES_ABREVS.indexOf(mes);
    const anoMes = idx === 10 || idx === 11 ? ano - 1 : ano;
    return `${mes}/${anoMes}`;
  });
}

function calcularPrLocal(scg: number, sr: number, vp: number): number {
  if (vp === 0) return 0;
  return (scg + sr) / vp;
}

function corPr(pr: number, vp: number): string {
  if (vp === 0) return "text-amber-400";
  return colorForValue(pr);
}

export default function PRPage() {
  const anoAtual = new Date().getFullYear();
  const mesAtual = new Date().getMonth(); // 0-based

  const [trimestres, setTrimestres] = useState<{ label: string; meses: string[] }[]>([]);
  const [trimestreLabel, setTrimestreLabel] = useState("");
  const [ano, setAno] = useState(anoAtual);

  const [scg, setScg] = useState(0);
  const [srAtual, setSrAtual] = useState(0);
  const [srAnteriores, setSrAnteriores] = useState([0, 0, 0, 0]);
  const [vp, setVp] = useState(0);
  const [meses, setMeses] = useState<PRMesDecomposicao[]>([]);
  const [prCalculado, setPrCalculado] = useState<number | null>(null);
  const [mesesSemVp, setMesesSemVp] = useState<string[]>([]);

  const [historico, setHistorico] = useState<string[]>([]);
  const [carregando, setCarregando] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);

  const trimestreAtual = trimestres.find((t) => t.label === trimestreLabel);
  const periodos = useMemo(() => periodosTrimestre(trimestreAtual, ano), [trimestreAtual, ano]);

  const somaSr = srAtual + srAnteriores.reduce((s, v) => s + v, 0);
  const saldoTotal = scg + somaSr;
  const prTempoReal = calcularPrLocal(scg, somaSr, vp);
  const prExibido = prCalculado ?? prTempoReal;

  useEffect(() => {
    getTrimestresFiscais()
      .then((dados) => {
        setTrimestres(dados);
        const idxMes = mesAtual;
        const padrao = dados.find((t) => {
          const idxs = t.meses.map((m) => MESES_ABREVS.indexOf(m));
          return idxs.includes(idxMes);
        });
        setTrimestreLabel(padrao?.label ?? dados[0]?.label ?? "");
      })
      .catch(() => setErro("Não foi possível carregar os trimestres fiscais."));
    carregarHistorico();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const carregarHistorico = async () => {
    try {
      const periodos = await listarPeriodosPR();
      setHistorico(periodos);
    } catch {
      setErro("Não foi possível carregar o histórico de PR.");
    }
  };

  const limparCampos = () => {
    setScg(0);
    setSrAtual(0);
    setSrAnteriores([0, 0, 0, 0]);
    setVp(0);
    setMeses([]);
    setPrCalculado(null);
    setMesesSemVp([]);
    setAviso(null);
  };

  const carregarTrimestre = async () => {
    if (!periodos.length) return;
    setCarregando(true);
    setErro(null);
    setAviso(null);
    try {
      const [dados, srAnterioresBanco] = await Promise.all([
        buscarTrimestralPR(periodos),
        listarSrAnterioresPR(),
      ]);

      setScg(dados.scg);
      setVp(dados.vp);
      setSrAtual(dados.sr);
      setMeses(dados.meses);
      setPrCalculado(dados.pr);
      setMesesSemVp(dados.meses_sem_vp);

      const disponiveis = srAnterioresBanco.filter(
        (r: PRSrAnterior) => !periodos.includes(r.periodo)
      );
      const proximos = [0, 1, 2, 3].map((i) => disponiveis[i]?.sr ?? 0);
      setSrAnteriores(proximos);

      if (dados.scg === 0 && dados.sr === 0 && dados.vp === 0) {
        setAviso(
          "Nenhum valor encontrado no banco para os meses selecionados. Execute SCG e SR e salve no banco primeiro."
        );
      } else if (dados.meses_sem_vp.length) {
        setAviso(
          `Os meses a seguir não têm VP cadastrado: ${dados.meses_sem_vp.join(", ")}. A parcela foi calculada usando o VP total do trimestre como fallback.`
        );
      }
    } catch {
      setErro("Falha ao carregar o trimestre do banco.");
    } finally {
      setCarregando(false);
    }
  };

  const salvar = async () => {
    if (scg === 0 && somaSr === 0 && vp === 0) {
      setAviso("Preencha ao menos um dos valores antes de salvar.");
      return;
    }
    setSalvando(true);
    setErro(null);
    setAviso(null);
    try {
      const periodo = `${trimestreLabel}/${ano}`;
      const resultado = await salvarPR(periodo, scg, somaSr, vp);
      setPrCalculado(resultado.pr);
      await carregarHistorico();
      setAviso(`PR salvo para ${periodo}. PR = R$ ${resultado.pr.toFixed(4)}`);
    } catch {
      setErro("Falha ao salvar o PR no banco.");
    } finally {
      setSalvando(false);
    }
  };

  const atualizarSrAnterior = (idx: number, valor: string) => {
    const next = [...srAnteriores];
    next[idx] = parseFloat(valor.replace(",", ".")) || 0;
    setSrAnteriores(next);
    setPrCalculado(null);
  };

  return (
    <div className="min-h-screen bg-[#050505] px-6 py-8 sm:px-10">
      <div className="mx-auto flex w-full max-w-[1600px] flex-col gap-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span
            className="flex h-9 w-9 items-center justify-center rounded-xl"
            style={{ backgroundColor: "#f472b617", color: "#f472b6" }}
          >
            <Lightbulb size={16} />
          </span>
          <div>
            <h1 className="text-[1.75rem] font-bold tracking-tight text-white">PR</h1>
            <p className="text-sm text-zinc-500 mt-0.5">Parcela de Recuperação — PR = (SCG + ΣSR) / VP</p>
          </div>
        </div>
      </div>

      {erro && <Alert variant="error">{erro}</Alert>}
      {aviso && <Alert variant="info">{aviso}</Alert>}

      <Card title="Trimestre">
        <div className="flex flex-wrap items-end gap-3">
          <Select
            label="Trimestre"
            value={trimestreLabel}
            onChange={(e) => setTrimestreLabel(e.target.value)}
            options={trimestres.map((t) => ({ value: t.label, label: t.label }))}
          />
          <Input
            label="Ano"
            type="number"
            value={ano}
            onChange={(e) => setAno(Number(e.target.value))}
            className="w-24"
          />
          <Button variant="success" icon={<Zap size={14} />} loading={carregando} onClick={carregarTrimestre}>
            Carregar Trimestre do Banco
          </Button>
          <Button variant="ghost" icon={<Trash2 size={14} />} onClick={limparCampos}>
            Limpar
          </Button>
        </div>
        {periodos.length > 0 && (
          <p className="mt-2 text-xs text-zinc-600">Meses: {periodos.join(", ")}</p>
        )}
      </Card>

      <Card title="SCG — Saldo da Conta Gráfica (com SELIC)">
        <Input
          label="SCG (R$)"
          type="number"
          step="0.01"
          value={scg || ""}
          onChange={(e) => {
            setScg(parseFloat(e.target.value) || 0);
            setPrCalculado(null);
          }}
          className="w-64"
        />
      </Card>

      <Card title="ΣSR — Saldos Remanescentes (atual + anteriores)">
        <div className="space-y-3">
          <Input
            label="SR atual (trimestre em cálculo) R$"
            type="number"
            step="0.01"
            value={srAtual || ""}
            onChange={(e) => {
              setSrAtual(parseFloat(e.target.value) || 0);
              setPrCalculado(null);
            }}
            className="w-64"
          />
          {SR_ANTERIOR_LABELS.map((label, idx) => (
            <Input
              key={label}
              label={`${label} R$`}
              type="number"
              step="0.01"
              value={srAnteriores[idx] || ""}
              onChange={(e) => atualizarSrAnterior(idx, e.target.value)}
              className="w-64"
            />
          ))}
        </div>
        <p className={`mt-3 text-right text-sm font-bold ${colorForValue(saldoTotal)}`}>
          Saldo Total a Recuperar: {brl(saldoTotal)}
        </p>
      </Card>

      <Card title="VP — Volume Prospectivo Contratado">
        <Input
          label="VP (m³)"
          type="number"
          step="0.01"
          value={vp || ""}
          onChange={(e) => {
            setVp(parseFloat(e.target.value) || 0);
            setPrCalculado(null);
          }}
          className="w-64"
        />
      </Card>

      <Card className="border border-amber-500/20">
        <div className="flex flex-wrap items-center gap-4">
          <span className="text-sm text-zinc-400">PR = (SCG + ΣSR) / VP =</span>
          <span className={`text-3xl font-extrabold ${corPr(prExibido, vp)}`}>
            R$ {prExibido.toFixed(4)}
          </span>
          {vp === 0 && <span className="text-xs text-amber-400">⚠ VP = 0 → PR = 0</span>}
        </div>
      </Card>

      <div className="flex flex-wrap gap-3">
        <Button variant="purple" icon={<Save size={16} />} loading={salvando} onClick={salvar}>
          Salvar PR no banco
        </Button>
        <Button
          variant="ghost"
          icon={<Save size={16} />}
          disabled
          title="Requer fluxo de Excel Final (Módulo 9) — pendente"
        >
          Excel Final (Módulo 9)
        </Button>
        <Button variant="ghost" icon={<RefreshCw size={16} />} onClick={carregarHistorico}>
          Atualizar histórico
        </Button>
      </div>

      {meses.length > 0 && (
        <Card title="Decomposição Trimestral" subtitle="PR = Σ (SCG_m + SR_m) / VP_m">
          <Table<PRMesDecomposicao>
            columns={[
              {
                key: "periodo",
                header: "Período",
                render: (m) => (
                  <>
                    {m.periodo}
                    {m.vp_sem_dado && (
                      <span className="ml-1 text-amber-400" title="VP sem dado, usado fallback">
                        ⚠
                      </span>
                    )}
                  </>
                ),
              },
              { key: "scg", header: "SCG (R$)", align: "right", render: (m) => brl(m.scg) },
              { key: "sr", header: "SR (R$)", align: "right", render: (m) => brl(m.sr) },
              { key: "vp", header: "VP (m³)", align: "right", render: (m) => m3(m.vp) },
              {
                key: "parcela_pr",
                header: "Parcela PR",
                align: "right",
                render: (m) => <span className="text-amber-300">R$ {m.parcela_pr.toFixed(4)}</span>,
              },
            ]}
            data={meses}
            footer={[
              { colIndex: 0, colSpan: 4, align: "right", content: "PR TRIMESTRAL" },
              {
                colIndex: 4,
                align: "right",
                content: <span className="text-amber-300">R$ {(prCalculado ?? 0).toFixed(4)}</span>,
              },
            ]}
          />
          {mesesSemVp.length > 0 && (
            <p className="mt-2 text-xs text-amber-400">
              Meses sem VP cadastrado: {mesesSemVp.join(", ")} (fallback aplicado).
            </p>
          )}
        </Card>
      )}

      <Card title="Histórico de PR por período">
        {historico.length === 0 ? (
          <EmptyState label="Nenhum período salvo ainda." />
        ) : (
          <div className="flex flex-wrap gap-2">
            {historico.map((p) => (
              <span
                key={p}
                className="rounded-lg border border-white/[0.07] bg-white/[0.03] px-3 py-1 text-xs text-zinc-300"
              >
                {p}
              </span>
            ))}
          </div>
        )}
      </Card>
      </div>
    </div>
  );
}
