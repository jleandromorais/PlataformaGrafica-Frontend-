import { useCallback, useEffect, useRef, useState } from "react";
import { AlertTriangle, CheckCircle2, Loader2, Save } from "lucide-react";
import { Alert } from "../../components/ui/Alert";
import { SeletorMes } from "../../components/ui/SeletorMes";
import { getHistoricoSCG, getSCGComparacao, salvarSCG } from "../../api";
import { mensagemDeErro } from "../../api/client";
import { brl, brlEntrada, parseBRL } from "../../utils/format";
import { MESES_ABREV, anoValido } from "../../utils/periodos";
import type { SCGComparacao, SCGHistoricoLinha, SCGValores } from "../../types";

const PANEL = "rounded-2xl border border-white/[0.07] bg-gradient-to-b from-white/[0.025] to-transparent bg-panel";
const TOLERANCIA = 0.01; // diferenças de centavo por arredondamento não contam

type Campo = "cgr" | "cgf" | "ret" | "rp";
type Fonte = "modulos" | "gravado" | "manual";

const CAMPOS: { chave: Campo; nome: string; origem: string }[] = [
  { chave: "cgr", nome: "CGR", origem: "Auditoria: NF-e + CT-e de gasoduto" },
  { chave: "cgf", nome: "CGF", origem: "Volume Faturado" },
  { chave: "ret", nome: "RET", origem: "Encargos (EAT + EC)" },
  { chave: "rp", nome: "RP", origem: "Penalidades (Conciliação)" },
];

const cor = (v: number) => (v > 0 ? "text-emerald-300" : v < 0 ? "text-red-300" : "text-zinc-300");
const difere = (a: number, b: number) => Math.abs(a - b) > TOLERANCIA;

function Escolha({ opcoes, valor, onChange, rotulo }: {
  opcoes: { id: Fonte; texto: string }[]; valor: Fonte; onChange: (f: Fonte) => void; rotulo: string;
}) {
  return (
    <div role="radiogroup" aria-label={rotulo} className="inline-flex rounded-lg border border-white/[0.07] bg-white/[0.02] p-0.5">
      {opcoes.map((o) => (
        <button
          key={o.id} type="button" role="radio" aria-checked={valor === o.id} onClick={() => onChange(o.id)}
          className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
            valor === o.id ? "bg-white/[0.1] text-white" : "text-zinc-400 hover:text-zinc-200"
          }`}
        >
          {o.texto}
        </button>
      ))}
    </div>
  );
}

export default function SCGPage() {
  const hoje = new Date();
  const [mes, setMes] = useState(MESES_ABREV[hoje.getMonth()]);
  const [ano, setAno] = useState(hoje.getFullYear());
  const periodo = `${mes}/${ano}`;

  const [comp, setComp] = useState<SCGComparacao | null>(null);
  const [fonte, setFonte] = useState<Record<Campo, Fonte>>({ cgr: "gravado", cgf: "gravado", ret: "gravado", rp: "gravado" });
  const [manual, setManual] = useState<Record<Campo, string>>({ cgr: "", cgf: "", ret: "", rp: "" });
  const [historico, setHistorico] = useState<SCGHistoricoLinha[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [sucesso, setSucesso] = useState<string | null>(null);
  const ultimaBusca = useRef(0);

  const buscar = useCallback((p: string) => {
    const busca = ++ultimaBusca.current;
    getSCGComparacao(p)
      .then((c) => {
        if (busca !== ultimaBusca.current) return;
        setComp(c);
        // Padrão: o que está gravado (é o que o Excel Final usa hoje); período novo usa os módulos.
        const padrao: Fonte = c.gravado ? "gravado" : "modulos";
        setFonte({ cgr: padrao, cgf: padrao, ret: padrao, rp: padrao });
        const base = c.gravado ?? c.modulos;
        setManual({ cgr: brlEntrada(base.cgr), cgf: brlEntrada(base.cgf), ret: brlEntrada(base.ret), rp: brlEntrada(base.rp) });
      })
      .catch((e) => busca === ultimaBusca.current && setErro(mensagemDeErro(e, `Não foi possível carregar ${p}.`)))
      .finally(() => busca === ultimaBusca.current && setCarregando(false));
  }, []);

  const carregarHistorico = useCallback(() => getHistoricoSCG().then(setHistorico), []);

  const mudarPeriodo = (m: string, a: number) => {
    setMes(m);
    setAno(a);
    setErro(null);
    setSucesso(null);
    if (!anoValido(a)) return;
    setCarregando(true);
    buscar(`${m}/${a}`);
  };

  // Abre no período mais recente que já tem SCG gravado.
  useEffect(() => {
    getHistoricoSCG()
      .then((h) => {
        setHistorico(h);
        const [m, a] = (h[0]?.periodo ?? periodo).split("/");
        mudarPeriodo(m, Number(a));
      })
      .catch((e) => {
        setErro(mensagemDeErro(e, "Não foi possível carregar o histórico do SCG."));
        setCarregando(false);
      });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps -- só na abertura

  const valor = (c: Campo): number | null => {
    if (!comp) return null;
    if (fonte[c] === "manual") return parseBRL(manual[c]) ?? (manual[c].trim() ? null : 0);
    return (fonte[c] === "gravado" && comp.gravado ? comp.gravado : comp.modulos)[c];
  };

  const escolhidos = { cgr: valor("cgr"), cgf: valor("cgf"), ret: valor("ret"), rp: valor("rp") };
  const validos = Object.values(escolhidos).every((v) => v !== null);
  const v = escolhidos as Record<Campo, number>;
  const rpv = validos ? v.cgr - v.cgf : 0;
  const scg = validos ? rpv + v.ret + v.rp : 0;
  const divergentes = comp?.gravado ? CAMPOS.filter(({ chave }) => difere(comp.modulos[chave], comp.gravado![chave])) : [];
  const alterado = !!comp && validos && (!comp.gravado || CAMPOS.some(({ chave }) => difere(v[chave], comp.gravado![chave])));

  const salvar = async () => {
    if (!validos) return setErro("Corrija os valores digitados antes de salvar.");
    setErro(null);
    setSucesso(null);
    setSalvando(true);
    try {
      const r = await salvarSCG({ periodo, ...v });
      setSucesso(`SCG de ${periodo} salvo: ${brl(r.scg)}.`);
      buscar(periodo);
      carregarHistorico();
    } catch (e) {
      setErro(mensagemDeErro(e, "Não foi possível salvar o SCG."));
    } finally {
      setSalvando(false);
    }
  };

  const celula = (vals: SCGValores | null | undefined, c: keyof SCGValores) =>
    vals ? <span className={`tabular-nums ${cor(vals[c])}`}>{brl(vals[c])}</span> : <span className="text-zinc-600">—</span>;

  return (
    <div className="px-4 py-6 sm:px-8 lg:px-10 lg:py-8">
      <div className="mx-auto flex max-w-[1400px] flex-col gap-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white sm:text-[1.75rem]">SCG</h1>
          <p className="mt-1 text-sm text-zinc-400">Consolidação mensal: SCG = RPV + RET + RP, com RPV = CGR − CGF</p>
        </div>

        {erro && <Alert variant="error">{erro}</Alert>}
        {sucesso && <Alert variant="success">{sucesso}</Alert>}

        <section className={`${PANEL} p-5 sm:p-6`}>
          <SeletorMes
            mes={mes} ano={ano} onChange={mudarPeriodo}
            status={carregando ? (
              <span className="flex items-center gap-2"><Loader2 size={14} className="animate-spin" /> Carregando {periodo}…</span>
            ) : comp?.gravado ? (
              <><span className="font-medium text-zinc-200">{periodo}</span> tem SCG gravado.</>
            ) : (
              <><span className="font-medium text-zinc-200">{periodo}</span> ainda não tem SCG gravado.</>
            )}
          />
        </section>

        {comp && divergentes.length > 0 && (
          <Alert variant="warning">
            Em {periodo}, {divergentes.map((d) => d.nome).join(" e ")} {divergentes.length > 1 ? "diferem" : "difere"} entre os módulos e o valor gravado.
            Escolha em cada linha qual vale antes de salvar. Hoje o Excel Final usa o gravado.
          </Alert>
        )}

        <section className={`${PANEL} overflow-hidden ${carregando ? "opacity-60" : ""}`}>
          <div className="border-b border-white/[0.07] px-5 py-4 sm:px-6">
            <h2 className="text-base font-semibold text-white">Valores de {periodo}</h2>
            <p className="mt-0.5 text-sm text-zinc-400">
              "Dos módulos" é a soma dos itens de Auditoria e Conciliação. "Gravado" é o que está na consolidação.
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[56rem] text-sm">
              <thead className="bg-white/[0.03] text-[0.7rem] uppercase tracking-[0.08em] text-zinc-400">
                <tr>
                  <th className="px-5 py-3 text-left font-semibold">Valor</th>
                  <th className="px-5 py-3 text-right font-semibold">Dos módulos</th>
                  <th className="px-5 py-3 text-right font-semibold">Gravado</th>
                  <th className="px-5 py-3 text-left font-semibold">Usar</th>
                  <th className="px-5 py-3 text-right font-semibold">Será salvo</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.05]">
                {CAMPOS.map(({ chave, nome, origem }) => {
                  const diverge = !!comp?.gravado && difere(comp.modulos[chave], comp.gravado[chave]);
                  const opcoes: { id: Fonte; texto: string }[] = !comp?.gravado
                    ? [{ id: "modulos", texto: "Módulos" }, { id: "manual", texto: "Digitar" }]
                    : diverge
                      ? [{ id: "modulos", texto: "Módulos" }, { id: "gravado", texto: "Gravado" }, { id: "manual", texto: "Digitar" }]
                      : [{ id: "gravado", texto: "Igual nos dois" }, { id: "manual", texto: "Digitar" }];
                  const atual = opcoes.some((o) => o.id === fonte[chave]) ? fonte[chave] : opcoes[0].id;
                  const escolhido = escolhidos[chave];
                  return (
                    <tr key={chave} className={diverge ? "bg-amber-500/[0.04]" : ""}>
                      <td className="px-5 py-3">
                        <span className="flex items-center gap-2 font-semibold text-zinc-100">
                          {nome}
                          {diverge && <AlertTriangle size={14} className="text-amber-300" aria-label="Diverge" />}
                        </span>
                        <span className="text-xs text-zinc-500">{origem}</span>
                      </td>
                      <td className="px-5 py-3 text-right">{celula(comp?.modulos, chave)}</td>
                      <td className="px-5 py-3 text-right">{celula(comp?.gravado, chave)}</td>
                      <td className="px-5 py-3">
                        <Escolha opcoes={opcoes} valor={atual} rotulo={`Fonte do ${nome}`}
                          onChange={(f) => setFonte({ ...fonte, [chave]: f })} />
                      </td>
                      <td className="px-5 py-3 text-right">
                        {atual === "manual" ? (
                          <input
                            aria-label={`${nome} digitado`} inputMode="decimal" value={manual[chave]}
                            onChange={(e) => setManual({ ...manual, [chave]: e.target.value })}
                            aria-invalid={escolhido === null}
                            className={`w-44 rounded-lg border bg-white/[0.03] px-3 py-1.5 text-right text-sm text-zinc-100 tabular-nums focus:border-transparent focus:outline-none focus:ring-1 focus:ring-sky-500/50 ${
                              escolhido === null ? "border-red-500/50" : "border-white/[0.07]"
                            }`}
                          />
                        ) : (
                          <span className={`font-semibold tabular-nums ${escolhido !== null ? cor(escolhido) : ""}`}>
                            {escolhido !== null ? brl(escolhido) : "—"}
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
                {(["rpv", "scg"] as const).map((k) => (
                  <tr key={k} className="bg-white/[0.02]">
                    <td className="px-5 py-3">
                      <span className="font-semibold text-zinc-100">{k.toUpperCase()}</span>
                      <span className="block text-xs text-zinc-500">{k === "rpv" ? "CGR − CGF" : "RPV + RET + RP"}</span>
                    </td>
                    <td className="px-5 py-3 text-right">{celula(comp?.modulos, k)}</td>
                    <td className="px-5 py-3 text-right">{celula(comp?.gravado, k)}</td>
                    <td className="px-5 py-3 text-xs text-zinc-500">calculado</td>
                    <td className={`px-5 py-3 text-right font-bold tabular-nums ${validos ? cor(k === "rpv" ? rpv : scg) : "text-zinc-600"} ${k === "scg" ? "text-lg" : ""}`}>
                      {validos ? brl(k === "rpv" ? rpv : scg) : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/[0.07] px-5 py-4 sm:px-6">
            <p className="text-sm text-zinc-400">
              {!comp ? "" : !alterado ? (
                <span className="flex items-center gap-1.5"><CheckCircle2 size={14} className="text-emerald-400" /> Nada a salvar: o escolhido é igual ao gravado.</span>
              ) : comp.gravado ? (
                <>O SCG gravado passa de <span className="font-medium text-zinc-200">{brl(comp.gravado.scg)}</span> para <span className="font-medium text-zinc-200">{brl(scg)}</span>.</>
              ) : (
                <>Primeiro SCG de {periodo}.</>
              )}
            </p>
            <button
              type="button" onClick={salvar} disabled={!alterado || salvando || carregando}
              className="flex items-center gap-2 rounded-xl bg-sky-600 px-5 py-2.5 text-sm font-semibold text-white shadow-[0_4px_14px_-4px_rgba(14,165,233,0.5)] transition-colors hover:bg-sky-500 disabled:opacity-40"
            >
              {salvando ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
              Salvar SCG de {periodo}
            </button>
          </div>
        </section>

        <section className={`${PANEL} overflow-hidden`}>
          <div className="border-b border-white/[0.07] px-5 py-4 sm:px-6">
            <h2 className="text-base font-semibold text-white">Histórico gravado</h2>
            <p className="mt-0.5 text-sm text-zinc-400">
              <AlertTriangle size={12} className="mr-1 inline text-amber-300" />marca os meses em que os módulos e o gravado não batem. Clique para abrir.
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[52rem] text-sm">
              <thead className="bg-white/[0.03] text-[0.7rem] uppercase tracking-[0.08em] text-zinc-400">
                <tr>
                  {["Período", "CGR", "CGF", "RPV", "RET", "RP", "SCG"].map((h, i) => (
                    <th key={h} className={`px-4 py-3 font-semibold ${i ? "text-right" : "text-left"}`}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.05]">
                {historico.map((h) => {
                  const [m, a] = h.periodo.split("/");
                  return (
                    <tr key={h.periodo} onClick={() => mudarPeriodo(m, Number(a))}
                      className={`cursor-pointer transition-colors hover:bg-white/[0.03] ${h.periodo === periodo ? "bg-sky-500/[0.06]" : ""}`}>
                      <td className="px-4 py-2.5">
                        <button type="button" onClick={() => mudarPeriodo(m, Number(a))} className="flex items-center gap-1.5 font-medium text-zinc-200 hover:text-sky-300">
                          {h.periodo}
                          {h.diverge && <AlertTriangle size={13} className="text-amber-300" aria-label="Diverge dos módulos" />}
                        </button>
                      </td>
                      {(["cgr", "cgf", "rpv", "ret", "rp"] as const).map((k) => (
                        <td key={k} className="px-4 py-2.5 text-right tabular-nums text-zinc-300">{brl(h[k])}</td>
                      ))}
                      <td className={`px-4 py-2.5 text-right font-semibold tabular-nums ${cor(h.scg)}`}>{brl(h.scg)}</td>
                    </tr>
                  );
                })}
                {historico.length === 0 && (
                  <tr><td colSpan={7} className="px-4 py-8 text-center text-zinc-500">Nenhum período gravado.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
}
