import { useEffect, useMemo, useState } from "react";
import { Activity, AlertTriangle, ChevronLeft, ChevronRight, RefreshCw, Save } from "lucide-react";
import { Button } from "../../components/ui/Button";
import { Alert } from "../../components/ui/Alert";
import { brl, num, parseBRL } from "../../utils/format";
import { buscarTrimestreSR, calcularTrimestreSR, carregarTrimestreSR, salvarTrimestreSR } from "../../api";
import { mensagemDeErro } from "../../api/client";
import type { SRLinhaCalculada, SROrigemPR } from "../../types";
import { dicaDe, tituloDe } from "../../utils/glossario";

const PANEL = "rounded-2xl border border-white/[0.07] bg-gradient-to-b from-white/[0.025] to-transparent bg-panel";
const MESES = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
// SR segue o trimestre civil (Jan–Mar …), não o do PMPV/PR (Nov–Jan …).
const TRIMESTRES = ["Jan – Mar", "Abr – Jun", "Jul – Set", "Out – Dez"];

const cor = (v: number) => (v > 0 ? "text-emerald-300" : v < 0 ? "text-red-300" : "text-zinc-300");

type Campo = "vp" | "vf" | "pr" | "selic_mensal" | "sr_anterior";

function linhaVazia(mes: string): SRLinhaCalculada {
  return { mes, vp: 0, vf: 0, pr: 0, selic_mensal: 0, sr_anterior: 0, diferenca: 0, sr_parcela: 0, sr_selic: 0, total: 0 };
}

/** Prévia enquanto digita; o valor que vale é o do backend ao salvar. */
function calcularLocal(linhas: SRLinhaCalculada[]): SRLinhaCalculada[] {
  return linhas.map((l) => {
    const diferenca = l.vp - l.vf;
    const sr_parcela = diferenca * l.pr;
    const sr_selic = sr_parcela * (1 + l.selic_mensal / 100) + l.sr_anterior;
    return { ...l, diferenca, sr_parcela, sr_selic, total: sr_selic };
  });
}

/** Trimestre do PMPV (Nov–Jan, Fev–Abr, Mai–Jul, Ago–Out) que contém o mês. */
function trimestrePMPV(mes: string): string {
  const [m, a] = mes.split("/");
  const idx = MESES.indexOf(m);
  const inicio = (idx - ((idx + 2) % 3) + 12) % 12;
  const anoIni = inicio > idx ? Number(a) - 1 : Number(a);
  const fim = (inicio + 2) % 12;
  return `${MESES[inicio]}/${anoIni} – ${MESES[fim]}/${fim < inicio ? anoIni + 1 : anoIni}`;
}

/** Número em pt-BR: mostra formatado e, ao focar, deixa editar o texto cru. */
function CampoNumero({ valor, casas, onChange, rotulo, alerta }: {
  valor: number; casas: number; onChange: (v: number) => void; rotulo: string; alerta?: boolean;
}) {
  const [texto, setTexto] = useState<string | null>(null);
  return (
    <input
      aria-label={rotulo}
      inputMode="decimal"
      value={texto ?? (valor ? num(valor, casas) : "")}
      placeholder="—"
      onFocus={() => setTexto(valor ? String(valor).replace(".", ",") : "")}
      onChange={(e) => setTexto(e.target.value)}
      onBlur={() => {
        onChange(parseBRL(texto ?? "") ?? 0);
        setTexto(null);
      }}
      className={`w-full rounded-md border bg-white/[0.03] px-2.5 py-1.5 text-right text-sm tabular-nums text-zinc-100
        placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-sky-500/50
        ${alerta ? "border-amber-400/40" : "border-white/[0.07]"}`}
    />
  );
}

interface Carregado {
  linhas: SRLinhaCalculada[];
  origemPR: Record<string, SROrigemPR>;
  fonte: "salvo" | "banco";
}

/** Abre o SR já salvo do trimestre; sem ele (ou com `doBanco`), traz VP/VF/PR do banco. */
async function buscarTrimestre(labels: string[], doBanco = false): Promise<Carregado> {
  const salvo = doBanco ? [] : await buscarTrimestreSR(`${labels[0]}_${labels[2]}`).catch(() => []);
  if (salvo.length) {
    const linhas = labels.map((mes, i) => ({ ...linhaVazia(mes), ...(salvo[i] as Partial<SRLinhaCalculada>), mes }));
    return { linhas: calcularLocal(linhas), origemPR: {}, fonte: "salvo" };
  }
  const dados = await carregarTrimestreSR(0, labels);
  return {
    linhas: calcularLocal(labels.map((mes, i) => ({ ...linhaVazia(mes), ...(dados[i] ?? {}), mes }))),
    origemPR: Object.fromEntries(dados.map((d) => [d.mes, d.pr_origem])),
    fonte: "banco",
  };
}

export default function SRPage() {
  const hoje = new Date();
  const [ano, setAno] = useState(hoje.getFullYear());
  const [tri, setTri] = useState(Math.floor(hoje.getMonth() / 3));
  const labels = useMemo(() => [0, 1, 2].map((i) => `${MESES[tri * 3 + i]}/${ano}`), [ano, tri]);
  const trimestreLabel = `${labels[0]}_${labels[2]}`;

  const [linhas, setLinhas] = useState<SRLinhaCalculada[]>(() => labels.map(linhaVazia));
  const [origemPR, setOrigemPR] = useState<Record<string, SROrigemPR>>({});
  const [fonte, setFonte] = useState<"salvo" | "banco" | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [sucesso, setSucesso] = useState<string | null>(null);

  const total = linhas.reduce((s, l) => s + l.sr_selic, 0);

  const aplicar = (r: Carregado) => {
    setLinhas(r.linhas);
    setOrigemPR(r.origemPR);
    setFonte(r.fonte);
    setCarregando(false);
  };
  const falhar = (e: unknown) => {
    setLinhas(labels.map(linhaVazia));
    setFonte(null);
    setErro(mensagemDeErro(e, "Não foi possível carregar VP/VF/PR do banco para este trimestre."));
    setCarregando(false);
  };

  useEffect(() => {
    buscarTrimestre(labels).then(aplicar).catch(falhar);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trimestreLabel]);

  const irPara = (novoAno: number, novoTri: number) => {
    if (novoAno === ano && novoTri === tri) return;
    setCarregando(true);
    setErro(null);
    setSucesso(null);
    setAno(novoAno);
    setTri(novoTri);
  };

  const recarregarDoBanco = () => {
    setCarregando(true);
    setErro(null);
    setSucesso(null);
    buscarTrimestre(labels, true).then(aplicar).catch(falhar);
  };

  const atualizar = (idx: number, campo: Campo, valor: number) => {
    const next = linhas.map((l, i) => (i === idx ? { ...l, [campo]: valor } : l));
    setLinhas(calcularLocal(next));
    if (campo === "pr") setOrigemPR({ ...origemPR, [linhas[idx].mes]: "salvo" });
    setSucesso(null);
  };

  const salvar = async () => {
    setErro(null);
    setSucesso(null);
    setSalvando(true);
    try {
      const calc = await calcularTrimestreSR(
        linhas.map(({ mes, vp, vf, pr, selic_mensal, sr_anterior }) => ({ mes, vp, vf, pr, selic_mensal, sr_anterior }))
      );
      setLinhas(calc.linhas);
      await salvarTrimestreSR(labels, labels[2], calc.linhas);
      setFonte("salvo");
      setSucesso(`SR de ${TRIMESTRES[tri]}/${ano} salvo. Total = ${brl(calc.total)}.`);
    } catch (e) {
      setErro(mensagemDeErro(e, "Não foi possível salvar o SR do trimestre."));
    } finally {
      setSalvando(false);
    }
  };

  const semVP = linhas.filter((l) => !l.vp);
  const prEstimado = linhas.filter((l) => origemPR[l.mes] === "estimado");
  const semPR = linhas.filter((l) => l.vp && !l.pr);
  // SR anterior igual ao SR do próprio mês = conta o mês duas vezes (erro comum
  // ao copiar a linha "Saldo Remanescente (SELIC)" da planilha para cá).
  const srDuplicado = linhas.filter((l) => {
    const doMes = l.sr_parcela * (1 + l.selic_mensal / 100);
    return l.sr_anterior !== 0 && Math.abs(l.sr_anterior - doMes) <= 0.02 * Math.abs(doMes);
  });
  const pendencias = semVP.length + prEstimado.length + semPR.length + srDuplicado.length;

  const limparSrDuplicado = () => {
    const meses = new Set(srDuplicado.map((l) => l.mes));
    setLinhas(calcularLocal(linhas.map((l) => (meses.has(l.mes) ? { ...l, sr_anterior: 0 } : l))));
    setSucesso(null);
  };

  return (
    <div className="px-4 py-6 sm:px-8 lg:px-10 lg:py-8">
      <div className="mx-auto flex max-w-[1400px] flex-col gap-6">
        <div className="flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-cyan-400/10 text-cyan-300">
            <Activity size={16} />
          </span>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white sm:text-[1.75rem]">{tituloDe("SR")}</h1>
            <p className="mt-0.5 text-sm text-zinc-400">SR = (VP − VF) × PR × (1 + SELIC) + SR anterior, mês a mês no trimestre</p>
          </div>
        </div>

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
          <div role="radiogroup" aria-label="Trimestre" className="flex flex-wrap gap-1 rounded-lg bg-white/[0.03] p-1">
            {TRIMESTRES.map((t, i) => (
              <button key={t} type="button" role="radio" aria-checked={tri === i} onClick={() => irPara(ano, i)}
                className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                  tri === i ? "bg-sky-500/20 text-sky-200" : "text-zinc-400 hover:text-zinc-100"}`}>
                {i + 1}º · {t}
              </button>
            ))}
          </div>
          <div className="ml-auto flex items-center gap-3">
            {fonte && (
              <span className="text-xs text-zinc-500">
                {fonte === "salvo" ? "Mostrando o SR salvo deste trimestre" : "VP/VF/PR trazidos do banco (ainda não salvo)"}
              </span>
            )}
            <Button variant="ghost" icon={<RefreshCw size={14} />} loading={carregando} onClick={recarregarDoBanco}>
              Recarregar do banco
            </Button>
          </div>
        </section>

        {pendencias > 0 && (
          <Alert variant="warning">
            <ul className="space-y-1">
              {semVP.map((l) => (
                <li key={`vp-${l.mes}`}>
                  <b>{l.mes}</b> sem VP: salve o PMPV de <b>{trimestrePMPV(l.mes)}</b> na tela PMPV ou digite o volume contratado.
                </li>
              ))}
              {prEstimado.map((l) => (
                <li key={`pr-${l.mes}`}>
                  <b>{l.mes}</b>: PR <b>estimado</b> por (SCG + SR) ÷ VP, porque não há PR salvo. Confira na tela PR antes de salvar.
                </li>
              ))}
              {semPR.map((l) => (
                <li key={`sempr-${l.mes}`}><b>{l.mes}</b> sem PR.</li>
              ))}
              {srDuplicado.length > 0 && (
                <li>
                  <b>{srDuplicado.map((l) => l.mes).join(", ")}</b>: o "SR trim. anterior" é o próprio SR do mês, então ele está
                  sendo somado duas vezes. Esse campo é só para saldo de um trimestre <b>anterior</b>.
                  <button type="button" onClick={limparSrDuplicado}
                    className="ml-2 rounded-md border border-amber-300/40 px-2 py-0.5 text-xs font-semibold text-amber-200 hover:bg-amber-300/10">
                    Apagar SR trim. anterior {srDuplicado.length > 1 ? "desses meses" : "desse mês"}
                  </button>
                </li>
              )}
            </ul>
          </Alert>
        )}

        <section className={`${PANEL} overflow-hidden`}>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[54rem] text-sm">
              <thead className="bg-white/[0.03] text-[0.7rem] uppercase tracking-[0.08em] text-zinc-400">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold">Mês</th>
                  <th className="px-2 py-3 text-right font-semibold" title={dicaDe("VP")}>VP (m³)</th>
                  <th className="px-2 py-3 text-right font-semibold" title={dicaDe("VF")}>VF (m³)</th>
                  <th className="px-2 py-3 text-right font-semibold">VP − VF</th>
                  <th className="px-2 py-3 text-right font-semibold" title="Parcela de Recuperação (PR) do trimestre em que o mês está, em R$/m³. PR = (SCG com SELIC + SR com SELIC do trimestre apurado) ÷ VP do trimestre do PR">
                    PR (R$/m³)
                  </th>
                  <th className="px-2 py-3 text-right font-semibold">SELIC (%)</th>
                  <th className="px-2 py-3 text-right font-semibold" title="Saldo remanescente de um trimestre anterior, somado ao SR do mês. Vazio se não houver.">
                    SR trim. anterior
                  </th>
                  <th className="sticky right-0 bg-panel shadow-[-8px_0_8px_-8px_rgba(0,0,0,0.6)] px-4 py-3 text-right font-semibold">SR do mês</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.05]">
                {linhas.map((l, idx) => {
                  const estimado = origemPR[l.mes] === "estimado";
                  return (
                    <tr key={l.mes} className={carregando ? "opacity-50" : ""}>
                      <td className="px-4 py-2.5 font-semibold text-zinc-100">
                        <span className="flex items-center gap-1.5">
                          {l.mes}
                          {(!l.vp || estimado || !l.pr) && <AlertTriangle size={13} className="text-amber-300" aria-label="Pendência" />}
                        </span>
                      </td>
                      <td className="w-36 px-2 py-2">
                        <CampoNumero rotulo={`VP de ${l.mes}`} valor={l.vp} casas={0} alerta={!l.vp} onChange={(v) => atualizar(idx, "vp", v)} />
                      </td>
                      <td className="w-40 px-2 py-2">
                        <CampoNumero rotulo={`VF de ${l.mes}`} valor={l.vf} casas={2} onChange={(v) => atualizar(idx, "vf", v)} />
                      </td>
                      <td className={`px-3 py-2 whitespace-nowrap text-right tabular-nums ${cor(l.diferenca)}`}>{num(l.diferenca)}</td>
                      <td className="w-28 px-2 py-2">
                        <CampoNumero rotulo={`PR de ${l.mes}`} valor={l.pr} casas={4} alerta={estimado || !l.pr} onChange={(v) => atualizar(idx, "pr", v)} />
                        {estimado && <span className="mt-0.5 block text-right text-[0.7rem] text-amber-300">estimado</span>}
                      </td>
                      <td className="w-24 px-2 py-2">
                        <CampoNumero rotulo={`SELIC de ${l.mes}`} valor={l.selic_mensal} casas={6} onChange={(v) => atualizar(idx, "selic_mensal", v)} />
                      </td>
                      <td className="w-32 px-2 py-2">
                        <CampoNumero rotulo={`SR anterior de ${l.mes}`} valor={l.sr_anterior} casas={2} onChange={(v) => atualizar(idx, "sr_anterior", v)} />
                      </td>
                      <td className="sticky right-0 bg-panel shadow-[-8px_0_8px_-8px_rgba(0,0,0,0.6)] px-4 py-2 text-right">
                        <span className={`block whitespace-nowrap font-semibold tabular-nums ${cor(l.sr_selic)}`}>{brl(l.sr_selic)}</span>
                        <span className="block whitespace-nowrap text-[0.7rem] tabular-nums text-zinc-500">sem SELIC {brl(l.sr_parcela)}</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot className="border-t border-white/[0.1] bg-white/[0.02]">
                <tr>
                  <td colSpan={7} className="px-4 py-3 text-right text-sm font-semibold uppercase tracking-[0.08em] text-zinc-400">
                    SR do trimestre
                  </td>
                  <td className={`sticky right-0 bg-panel shadow-[-8px_0_8px_-8px_rgba(0,0,0,0.6)] px-4 py-3 whitespace-nowrap text-right text-lg font-bold tabular-nums ${cor(total)}`}>{brl(total)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
          <p className="border-t border-white/[0.05] px-4 py-3 text-xs text-zinc-500">
            SR do mês = (VP − VF) × PR × (1 + SELIC) + SR trim. anterior. SELIC em % acumulada do mês até a data da apuração. PR = Parcela de Recuperação: (SCG com SELIC + SR com SELIC do trimestre apurado) ÷ VP do trimestre do PR.
          </p>
        </section>

        <div className="flex flex-wrap items-center gap-3">
          <Button variant="purple" icon={<Save size={16} />} loading={salvando} disabled={carregando} onClick={salvar}>
            Salvar SR do trimestre
          </Button>
          {pendencias > 0 && <span className="text-xs text-amber-300">Há {pendencias} pendência(s) acima.</span>}
        </div>
      </div>
    </div>
  );
}
