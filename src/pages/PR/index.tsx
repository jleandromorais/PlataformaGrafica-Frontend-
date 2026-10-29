import { useEffect, useMemo, useState } from "react";
import { ArrowRight, ChevronLeft, ChevronRight, FileText, RefreshCw, Save } from "lucide-react";
import { Button } from "../../components/ui/Button";
import { Alert } from "../../components/ui/Alert";
import { brl, num } from "../../utils/format";
import { apurarPR, gerarMinutaNotaTecnica, getPR, salvarPR } from "../../api";
import { salvarArquivo } from "../../utils/download";
import { mensagemDeErro } from "../../api/client";
import { useManterPeriodoNaUrl, usePeriodoDaUrl } from "../../utils/periodoNaUrl";
import type { PRApuracao } from "../../types";
import { PageHeader } from "../../components/layout/PageHeader";

const PANEL = "rounded-xl border border-white/[0.07] bg-panel";
const MESES = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
// PR segue o trimestre do PMPV (Nov–Jan …), não o civil. O ano é o do último
// mês (Nov/25–Jan/26 = "Nov - Jan/2026"), como o módulo PR sempre gravou.
const TRIMESTRES = [
  { label: "Nov - Jan", inicio: 10 },
  { label: "Fev - Abr", inicio: 1 },
  { label: "Mai - Jul", inicio: 4 },
  { label: "Ago - Out", inicio: 7 },
];

const cor = (v: number) => (v > 0 ? "text-emerald-300" : v < 0 ? "text-red-300" : "text-zinc-300");
const tarifa = (v: number) => num(v, 4);

function mesesDoPR(tri: number, ano: number): string[] {
  const { inicio } = TRIMESTRES[tri];
  return [0, 1, 2].map((i) => {
    const idx = (inicio + i) % 12;
    return `${MESES[idx]}/${idx >= 10 && inicio === 10 ? ano - 1 : ano}`;
  });
}

function trimestreAtual(): number {
  const m = new Date().getMonth();
  return TRIMESTRES.findIndex((t) => [0, 1, 2].some((i) => (t.inicio + i) % 12 === m));
}

function Linha({ rotulo, valor, destaque }: { rotulo: string; valor: string; destaque?: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4 py-1.5">
      <span className="text-sm text-zinc-400">{rotulo}</span>
      <span className={`whitespace-nowrap tabular-nums ${destaque ?? "text-zinc-100"}`}>{valor}</span>
    </div>
  );
}

export default function PRPage() {
  const hoje = new Date();
  // "Fazer agora" do Painel do Ciclo abre no trimestre do PR (?trimestre=Ago/2026, 1º mês).
  const daUrl = usePeriodoDaUrl("trimestre");
  const triUrl = daUrl ? TRIMESTRES.findIndex((t) => t.inicio === daUrl.mes) : -1;
  // Ano do último mês: Nov/2026 a Jan/2027 é o "Nov - Jan/2027".
  const anoUrl = daUrl && triUrl >= 0 ? daUrl.ano + (daUrl.mes === 10 ? 1 : 0) : null;
  const [ano, setAno] = useState(anoUrl ?? (hoje.getMonth() >= 10 ? hoje.getFullYear() + 1 : hoje.getFullYear()));
  const [tri, setTri] = useState(triUrl >= 0 ? triUrl : trimestreAtual());
  const meses = useMemo(() => mesesDoPR(tri, ano), [tri, ano]);
  useManterPeriodoNaUrl("trimestre", meses[0]);
  const chave = `${TRIMESTRES[tri].label}/${ano}`;

  const [dados, setDados] = useState<PRApuracao | null>(null);
  const [prSalvo, setPrSalvo] = useState<number | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [gerandoNT, setGerandoNT] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [sucesso, setSucesso] = useState<string | null>(null);

  const buscar = (mesesPR: string[], chavePR: string) =>
    Promise.all([apurarPR(mesesPR), getPR(chavePR).then((r) => r.pr).catch(() => null)]);

  const aplicar = ([apuracao, salvo]: [PRApuracao, number | null]) => {
    setDados(apuracao);
    setPrSalvo(salvo);
    setErro(null);
    setCarregando(false);
  };
  const falhar = (e: unknown) => {
    setDados(null);
    setErro(mensagemDeErro(e, "Não foi possível calcular o PR deste trimestre."));
    setCarregando(false);
  };

  useEffect(() => {
    buscar(meses, chave).then(aplicar).catch(falhar);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chave]);

  const irPara = (novoAno: number, novoTri: number) => {
    if (novoAno === ano && novoTri === tri) return;
    setCarregando(true);
    setErro(null);
    setSucesso(null);
    setAno(novoAno);
    setTri(novoTri);
  };

  const recarregar = () => {
    setCarregando(true);
    setErro(null);
    setSucesso(null);
    buscar(meses, chave).then(aplicar).catch(falhar);
  };

  const salvar = async () => {
    if (!dados) return;
    setSalvando(true);
    setErro(null);
    setSucesso(null);
    try {
      const r = await salvarPR(chave, dados.scg_selic, dados.sr, dados.vp);
      setPrSalvo(r.pr);
      setSucesso(`PR de ${meses[0]} a ${meses[2]} salvo: ${tarifa(r.pr)} R$/m³.`);
    } catch (e) {
      setErro(mensagemDeErro(e, "Não foi possível salvar o PR."));
    } finally {
      setSalvando(false);
    }
  };

  const gerarNT = async () => {
    if (!dados) return;
    setGerandoNT(true);
    setErro(null);
    try {
      const mp = dados.meses_pr;
      salvarArquivo(await gerarMinutaNotaTecnica(dados.meses_apurados[2]),
        `Minuta_NT_Repasse_${mp[0].replace("/", "-")}_a_${mp[2].replace("/", "-")}.docx`);
    } catch (e) {
      setErro(mensagemDeErro(e, "Não foi possível gerar a minuta da Nota Técnica."));
    } finally {
      setGerandoNT(false);
    }
  };

  const apurados = dados?.meses_apurados ?? [];
  const difereDoSalvo = dados && prSalvo !== null && Math.abs(prSalvo - dados.pr) > 1e-9;

  return (
    <div className="px-4 py-6 sm:px-8 lg:px-10 lg:py-8">
      <div className="mx-auto flex max-w-[1400px] flex-col gap-6">
        <PageHeader modulo="pr" formula="PR = (SCG com SELIC + SR com SELIC do trimestre apurado) ÷ VP do trimestre do PR, em 4 casas" />

        {erro && <Alert variant="error">{erro}</Alert>}
        {sucesso && <Alert variant="success">{sucesso}</Alert>}

        <section className={`${PANEL} flex flex-wrap items-center gap-4 p-5 sm:p-6`}>
          <div className="flex items-center gap-1">
            <button type="button" aria-label="Ano anterior" onClick={() => irPara(ano - 1, tri)}
              className="rounded-md p-1.5 text-zinc-400 hover:bg-white/[0.05] hover:text-white">
              <ChevronLeft size={16} />
            </button>
            <span className="w-14 text-center text-lg font-semibold tabular-nums text-white">{ano}</span>
            <button type="button" aria-label="Próximo ano" onClick={() => irPara(ano + 1, tri)}
              className="rounded-md p-1.5 text-zinc-400 hover:bg-white/[0.05] hover:text-white">
              <ChevronRight size={16} />
            </button>
          </div>
          <div role="radiogroup" aria-label="Trimestre do PR" className="flex flex-wrap gap-1 rounded-lg bg-white/[0.03] p-1">
            {TRIMESTRES.map((t, i) => (
              <button key={t.label} type="button" role="radio" aria-checked={tri === i} onClick={() => irPara(ano, i)}
                className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                  tri === i ? "bg-pink-500/20 text-pink-200" : "text-zinc-400 hover:text-zinc-100"}`}>
                {t.label.replace(" - ", " – ")}
              </button>
            ))}
          </div>
          <div className="ml-auto">
            <Button variant="ghost" icon={<RefreshCw size={14} />} loading={carregando} onClick={recarregar}>
              Recalcular
            </Button>
          </div>
          {apurados.length > 0 && (
            <p className="flex w-full flex-wrap items-center gap-2 text-sm text-zinc-400">
              Usa o SCG e o SR de <b className="text-zinc-200">{apurados[0]} a {apurados[2]}</b>
              <ArrowRight size={14} />
              PR de <b className="text-zinc-200">{meses[0]} a {meses[2]}</b>
            </p>
          )}
        </section>

        {dados && dados.pendencias.length > 0 && (
          <Alert variant="warning">
            <ul className="space-y-1">
              {dados.pendencias.map((p) => <li key={p}>{p}</li>)}
            </ul>
          </Alert>
        )}

        {dados && (
          <div className={`grid gap-6 2xl:grid-cols-[minmax(0,1fr)_22rem] ${carregando ? "opacity-50" : ""}`}>
            <section className={`${PANEL} overflow-hidden`}>
              <div className="border-b border-white/[0.07] px-5 py-4">
                <h2 className="text-base font-semibold text-white">Saldo a recuperar ({apurados[0]} a {apurados[2]})</h2>
                <p className="mt-0.5 text-sm text-zinc-500">SCG da tela SCG; SELIC e SR do SR salvo do trimestre</p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[36rem] text-sm">
                  <thead className="bg-white/[0.03] text-[0.7rem] text-zinc-400">
                    <tr>
                      <th className="px-4 py-3 text-left font-semibold">Mês</th>
                      <th className="px-3 py-3 text-right font-semibold">SCG</th>
                      <th className="px-3 py-3 text-right font-semibold">SELIC acum. (%)</th>
                      <th className="px-3 py-3 text-right font-semibold">SCG com SELIC</th>
                      <th className="px-4 py-3 text-right font-semibold">SR com SELIC</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.05]">
                    {dados.meses.map((m) => (
                      <tr key={m.periodo}>
                        <td className="px-4 py-2.5 font-semibold text-zinc-100">{m.periodo}</td>
                        <td className={`px-3 py-2.5 text-right tabular-nums ${cor(m.scg)}`}>{brl(m.scg)}</td>
                        <td className="px-3 py-2.5 text-right tabular-nums text-zinc-300">{num(m.selic, 6)}</td>
                        <td className={`whitespace-nowrap px-3 py-2.5 text-right tabular-nums ${cor(m.scg_selic)}`}>{brl(m.scg_selic)}</td>
                        <td className={`whitespace-nowrap px-4 py-2.5 text-right tabular-nums ${cor(m.sr)}`}>{brl(m.sr)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="border-t border-white/[0.1] bg-white/[0.02] font-semibold">
                    <tr>
                      <td colSpan={3} className="px-4 py-3 text-right text-xs text-zinc-400">Totais</td>
                      <td className={`whitespace-nowrap px-3 py-3 text-right tabular-nums ${cor(dados.scg_selic)}`}>{brl(dados.scg_selic)}</td>
                      <td className={`whitespace-nowrap px-4 py-3 text-right tabular-nums ${cor(dados.sr)}`}>{brl(dados.sr)}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </section>

            <section className={`${PANEL} p-5`}>
              <h2 className="mb-2 text-base font-semibold text-white">PR de {meses[0]} a {meses[2]}</h2>
              <Linha rotulo="SCG com SELIC" valor={brl(dados.scg_selic)} destaque={cor(dados.scg_selic)} />
              <Linha rotulo="+ SR com SELIC" valor={brl(dados.sr)} destaque={cor(dados.sr)} />
              <div className="my-1 border-t border-white/[0.07]" />
              <Linha rotulo="Saldo total a recuperar" valor={brl(dados.saldo_total)} destaque={`font-semibold ${cor(dados.saldo_total)}`} />
              <Linha rotulo="÷ VP (m³)" valor={num(dados.vp)} />
              <p className="pb-1 text-right text-[0.7rem] text-zinc-500">
                {dados.meses_pr.map((p, i) => `${p.split("/")[0]} ${num(dados.vps[i])}`).join(" + ")}
              </p>
              <div className="mt-2 rounded-xl bg-white/[0.03] p-4">
                <Linha rotulo="PR (R$/m³)" valor={tarifa(dados.pr)} destaque={`text-2xl font-bold ${cor(dados.pr)}`} />
                <Linha rotulo="PMPV" valor={tarifa(dados.pmpv)} />
                <Linha rotulo="PV = PMPV + PR" valor={tarifa(dados.pv)} destaque="font-semibold text-white" />
              </div>
              {prSalvo !== null && (
                <p className={`mt-3 text-xs ${difereDoSalvo ? "text-amber-300" : "text-zinc-500"}`}>
                  PR salvo: {tarifa(prSalvo)}{difereDoSalvo ? " — diferente do calculado; salve para atualizar." : " (igual ao calculado)."}
                </p>
              )}
              <Button className="mt-4 w-full" variant="solid" icon={<Save size={16} />} loading={salvando}
                disabled={carregando || !dados.vp} onClick={salvar}>
                Salvar PR
              </Button>
              <Button className="mt-2 w-full" variant="ghost" icon={<FileText size={16} />} loading={gerandoNT}
                disabled={carregando || !dados.vp} onClick={gerarNT}>
                Gerar minuta da Nota Técnica
              </Button>
              <p className="mt-1 text-center text-[0.7rem] text-zinc-500">
                Word com os Quadros 5 a 8 e o Anexo A; os trechos do analista vêm destacados em amarelo.
              </p>
            </section>
          </div>
        )}
      </div>
    </div>
  );
}
