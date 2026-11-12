import { useCallback, useEffect, useRef, useState } from "react";
import { AlertTriangle, CheckCircle2, Loader2, Save } from "lucide-react";
import { Alert } from "../../components/ui/Alert";
import { SeletorMes } from "../../components/ui/SeletorMes";
import { getHistoricoSCG, getProvaRealSCG, getSCGComparacao, salvarSCG } from "../../api";
import { mensagemDeErro } from "../../api/client";
import { brl, brlEntrada, num, parseBRL } from "../../utils/format";
import { textoPRAutomatico } from "../../utils/prAutomatico";
import { MESES_ABREV, anoValido } from "../../utils/periodos";
import { useManterPeriodoNaUrl, usePeriodoDaUrl } from "../../utils/periodoNaUrl";
import type { SCGComparacao, SCGHistoricoLinha, SCGValores } from "../../types";
import { tituloDe } from "../../utils/glossario";
import { dicaDe, type Sigla } from "../../utils/glossario";
import { PageHeader } from "../../components/layout/PageHeader";
import { Skeleton } from "../../components/ui/Skeleton";
import { LinhasEsqueleto } from "../../components/ui/EsqueletoTabela";
import { Paginacao } from "../../components/ui/Paginacao";
import { usePaginacao } from "../../utils/paginacao";
import { CardFormula } from "../../components/ui/CardFormula";
import { PeriodoClicavel } from "../../components/ui/PeriodoClicavel";
import { useProvaRealDoMes } from "../../components/ui/useProvaRealDoMes";
import { linhaDoMes } from "../../utils/linhaDoMes";
import { rolarAteCardSeEscondido } from "../../utils/rolagem";
import { KpisSCG } from "./KpisSCG";
import { ProvaRealSCG } from "./ProvaRealSCG";

const PANEL = "rounded-xl border border-white/[0.07] bg-panel";
const TOLERANCIA = 0.01; // diferenças de centavo por arredondamento não contam

/** Busca da prova real: a chave é "Fev/2026#versão" (a versão sobe ao salvar, para buscar de novo).
 * Função estável do módulo, como pede o hook. */
const buscarProvaDoMes = (chave: string) => getProvaRealSCG(chave.split("#")[0]);

type Campo = "cgr" | "cgf" | "ret" | "rp";
type Fonte = "modulos" | "gravado" | "manual";

const CAMPOS: { chave: Campo; nome: string; origem: string }[] = [
  { chave: "cgr", nome: tituloDe("CGR"), origem: "Auditoria: NF-e + CT-e de gasoduto" },
  { chave: "cgf", nome: tituloDe("CGF"), origem: "Tela CGF (PMPV × volume faturado)" },
  { chave: "ret", nome: tituloDe("RET"), origem: "Encargos (EAT + EC)" },
  { chave: "rp", nome: tituloDe("RP"), origem: "Penalidades (Conciliação)" },
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
  // "Fazer agora" do Painel do Ciclo abre no mês certo (?periodo=Mai/2026).
  const daUrl = usePeriodoDaUrl("periodo");
  const [mes, setMes] = useState(MESES_ABREV[daUrl?.mes ?? hoje.getMonth()]);
  const [ano, setAno] = useState(daUrl?.ano ?? hoje.getFullYear());
  useManterPeriodoNaUrl("periodo", `${mes}/${ano}`);
  const periodo = `${mes}/${ano}`;

  const [comp, setComp] = useState<SCGComparacao | null>(null);
  const [fonte, setFonte] = useState<Record<Campo, Fonte>>({ cgr: "gravado", cgf: "gravado", ret: "gravado", rp: "gravado" });
  const [manual, setManual] = useState<Record<Campo, string>>({ cgr: "", cgf: "", ret: "", rp: "" });
  const [historico, setHistorico] = useState<SCGHistoricoLinha[]>([]);
  const pag = usePaginacao(historico, { focoIndice: historico.findIndex((h) => h.periodo === periodo) });
  // Com paginação, um mês divergente pode estar em outra página: a lista abaixo do título mostra todos.
  const mesesDivergentes = historico.filter((h) => h.diverge);
  const [historicoCarregado, setHistoricoCarregado] = useState(false); // até a 1ª resposta, a tabela mostra o esqueleto
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [sucesso, setSucesso] = useState<string | null>(null);
  const [avisoPR, setAvisoPR] = useState<string | null>(null); // PR/PV não regravados ao salvar
  const ultimaBusca = useRef(0);

  // Prova real do mês que está na tela (o mesmo do formulário): KPIs, fórmula preenchida e card.
  const [versaoProva, setVersaoProva] = useState(0); // sobe ao salvar: a prova real do mesmo mês é buscada de novo
  const prova = useProvaRealDoMes(anoValido(ano) ? `${periodo}#${versaoProva}` : null, buscarProvaDoMes, periodo);
  const dProva = prova.dados && !prova.erro && prova.dados.gravado && prova.dados.scg_gravado !== null ? prova.dados : null;
  const provaRef = useRef<HTMLElement>(null);

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
    setAvisoPR(null);
    if (!anoValido(a)) return;
    setCarregando(true);
    buscar(`${m}/${a}`);
  };

  /** Clique no histórico: o mês passa a ser o da tela (formulário e prova real) e a vista vai até a prova real. */
  const abrirDoHistorico = (p: string) => {
    const [m, a] = p.split("/");
    mudarPeriodo(m, Number(a));
    rolarAteCardSeEscondido(provaRef.current);
  };

  // Abre no mês do endereço (Painel do Ciclo) ou no mais recente que já tem SCG gravado.
  useEffect(() => {
    getHistoricoSCG()
      .then((h) => {
        setHistorico(h);
        const [m, a] = (daUrl ? periodo : h[0]?.periodo ?? periodo).split("/");
        mudarPeriodo(m, Number(a));
      })
      .catch((e) => {
        setErro(mensagemDeErro(e, "Não foi possível carregar o histórico do SCG."));
        setCarregando(false);
      })
      .finally(() => setHistoricoCarregado(true));
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
  const camposDiferem = !!comp?.gravado && validos && CAMPOS.some(({ chave }) => difere(v[chave], comp.gravado![chave]));
  // A tabela mostra o SCG refeito na leitura, mas a coluna "scg" gravada pode estar velha (0 ou outro valor).
  // A prova real traz essa coluna crua: se ela difere do que seria salvo, salvar corrige. Só vale com a
  // prova do mês que está na tela (não a do mês anterior, que fica visível enquanto o novo carrega).
  const provaDoMes = prova.dados && !prova.erro && !prova.carregando && !prova.atualizando && prova.dados.periodo === periodo ? prova.dados : null;
  const gravadoDesatualizado = !!comp?.gravado && validos && !!provaDoMes?.gravado
    && (provaDoMes.scg_gravado === null || difere(provaDoMes.scg_gravado, scg));
  const alterado = !!comp && validos && (!comp.gravado || camposDiferem || gravadoDesatualizado);

  const salvar = async () => {
    if (!validos) return setErro("Corrija os valores digitados antes de salvar.");
    setErro(null);
    setSucesso(null);
    setAvisoPR(null);
    setSalvando(true);
    try {
      const r = await salvarSCG({ periodo, ...v });
      // O backend regrava o PR e o PV do trimestre que usa este mês.
      const pr = textoPRAutomatico(r.pr_automatico);
      setSucesso(`SCG de ${periodo} salvo: ${brl(r.scg)}.${pr?.ok ? ` ${pr.texto}` : ""}`);
      if (pr && !pr.ok) setAvisoPR(pr.texto);
      buscar(periodo);
      carregarHistorico();
      setVersaoProva((n) => n + 1);
    } catch (e) {
      setErro(mensagemDeErro(e, "Não foi possível salvar o SCG."));
    } finally {
      setSalvando(false);
    }
  };

  // Enquanto o mês carrega, os valores viram esqueleto: a tabela mantém a forma e não mostra números do mês anterior.
  const celula = (vals: SCGValores | null | undefined, c: keyof SCGValores) =>
    carregando ? <Skeleton className="ml-auto h-4 w-28 rounded" /> : vals ? <span className={`tabular-nums ${cor(vals[c])}`}>{brl(vals[c])}</span> : <span className="text-zinc-600">—</span>;

  return (
    <div className="px-4 py-6 sm:px-8 lg:px-10 lg:py-8">
      <div className="mx-auto flex max-w-[1500px] flex-col gap-6">
        <PageHeader modulo="scg" />

        {erro && <Alert variant="error">{erro}</Alert>}
        {sucesso && <Alert variant="success">{sucesso}</Alert>}
        {avisoPR && <Alert variant="warning">{avisoPR}</Alert>}

        <section className={`${PANEL} p-5 sm:p-6`}>
          <SeletorMes
            mes={mes} ano={ano} onChange={mudarPeriodo}
            status={carregando ? (
              <span role="status" className="block py-0.5">
                <span className="sr-only">Carregando {periodo}…</span>
                <Skeleton className="h-4 w-56 rounded" />
              </span>
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

        <KpisSCG periodo={anoValido(ano) ? periodo : null} estado={prova} />

        {/* Fórmula (vinho) à esquerda, acompanhando a rolagem em xl; prova real do mês à direita. */}
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
          <CardFormula className="xl:sticky xl:top-6 xl:col-span-5 xl:self-start 2xl:col-span-4"
            descricao="Como o SCG do mês é calculado."
            tituloAplicada={dProva ? `Com os números de ${dProva.periodo}` : undefined}
            aplicada={dProva && dProva.scg_gravado !== null ? [
              `RPV = ${num(dProva.cgr, 2)} − ${num(dProva.cgf, 2)} = ${num(dProva.rpv_calculado, 2)}`,
              `SCG = ${num(dProva.rpv_calculado, 2)} + ${num(dProva.ret, 2)} + ${num(dProva.rp, 2)} = ${brl(dProva.scg_calculado)}`,
            ] : undefined}
            atualizando={prova.atualizando}
            formula={[
              "SCG = RPV + RET + RP",
              "RPV = CGR − CGF",
            ]}
            termos={[
              { termo: "SCG", explicacao: "Saldo da Conta Gráfica: o saldo do mês, em reais." },
              { termo: "RPV", explicacao: "Recuperação de Preço de Venda: o custo realizado (CGR) menos o faturado (CGF)." },
              { termo: "RET", explicacao: "Recuperação de Encargos de Transporte, gravado na tela RET." },
              { termo: "RP", explicacao: "Recuperação das Penalidades, gravado na tela RP (Conciliação)." },
              { termo: "CGR e CGF", explicacao: "Custo do gás realizado (Auditoria CGR) e custo do gás faturado (tela CGF)." },
            ]}
            regras={[
              "Os quatro valores vêm dos módulos. Aqui você pode usar o dos módulos, o já gravado ou digitar.",
              "Quando o gravado e os módulos diferem, a prova real mostra qual deles está desatualizado.",
              "O SCG gravado de cada mês alimenta o PR e o Excel Final.",
            ]}
          />
          <ProvaRealSCG periodo={anoValido(ano) ? periodo : null} estado={prova} cardRef={provaRef} className="xl:col-span-7 2xl:col-span-8" />
        </div>

        <section className={`${PANEL} overflow-hidden ${carregando ? "opacity-60" : ""}`}>
          <div className="border-b border-white/[0.07] px-5 py-4 sm:px-6">
            <h2 className="text-base font-semibold text-white">Valores de {periodo}</h2>
            <p className="mt-0.5 text-sm text-zinc-400">
              "Dos módulos" é a soma dos itens de Auditoria e Conciliação. "Gravado" é o que está na consolidação.
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[56rem] text-sm">
              <thead className="bg-white/[0.03] text-[0.7rem] text-zinc-400">
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
                            className={`w-44 rounded-lg border bg-white/[0.03] px-3 py-1.5 text-right text-sm text-zinc-100 tabular-nums ${
                              escolhido === null ? "border-red-500/50" : "border-white/[0.07]"
                            }`}
                          />
                        ) : carregando ? (
                          <Skeleton className="ml-auto h-4 w-28 rounded" />
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
                      {carregando ? <Skeleton className="ml-auto h-5 w-32 rounded" /> : validos ? brl(k === "rpv" ? rpv : scg) : "—"}
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
              ) : comp.gravado && !camposDiferem ? (
                <>SCG gravado desatualizado: a coluna gravada está {provaDoMes?.scg_gravado == null ? "vazia" : <>em <span className="font-medium text-zinc-200">{brl(provaDoMes.scg_gravado)}</span></>}, mas a soma dá <span className="font-medium text-zinc-200">{brl(scg)}</span>. Salvar corrige.</>
              ) : comp.gravado ? (
                <>O SCG gravado passa de <span className="font-medium text-zinc-200">{brl(comp.gravado.scg)}</span> para <span className="font-medium text-zinc-200">{brl(scg)}</span>.</>
              ) : (
                <>Primeiro SCG de {periodo}.</>
              )}
            </p>
            <button
              type="button" onClick={salvar} disabled={!alterado || salvando || carregando}
              className="flex items-center gap-2 rounded-xl bg-marinho px-5 py-2.5 text-sm font-semibold text-paper transition-colors hover:bg-marinho-claro disabled:cursor-not-allowed disabled:bg-white/[0.06] disabled:text-zinc-400 disabled:shadow-none"
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
              <AlertTriangle size={12} className="mr-1 inline text-amber-300" />marca os meses em que os módulos e o gravado não batem. Clique num mês para ver a prova real e abri-lo no formulário.
            </p>
            {mesesDivergentes.length > 0 && (
              <p className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-amber-300">
                <span>{mesesDivergentes.length === 1 ? "1 mês diverge:" : `${mesesDivergentes.length} meses divergem:`}</span>
                {mesesDivergentes.map((h) => {
                  const [m, a] = h.periodo.split("/");
                  return (
                    <button key={h.periodo} type="button" onClick={() => mudarPeriodo(m, Number(a))}
                      className="font-medium underline decoration-amber-300/40 underline-offset-2 hover:text-amber-200">
                      {h.periodo}
                    </button>
                  );
                })}
              </p>
            )}
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[52rem] text-sm">
              <thead className="bg-white/[0.03] text-[0.7rem] text-zinc-400">
                <tr>
                  {["Período", "CGR", "CGF", "RPV", "RET", "RP", "SCG"].map((h, i) => (
                    <th key={h} scope="col" title={i ? dicaDe(h as Sigla) : undefined} className={`px-4 py-3 font-semibold ${i ? "text-right" : "border-l-[3px] border-l-transparent text-left"}`}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.05]">
                {!historicoCarregado && <LinhasEsqueleto colunas={7} texto="Carregando o histórico…" />}
                {pag.itensDaPagina.map((h) => {
                  const ativo = h.periodo === periodo;
                  return (
                    <tr key={h.periodo} aria-current={ativo ? "true" : undefined}
                      onClick={() => abrirDoHistorico(h.periodo)}
                      className={linhaDoMes(ativo, true)}>
                      <PeriodoClicavel periodo={h.periodo} valido ativo={ativo} onAbrir={abrirDoHistorico}
                        extra={h.diverge ? <AlertTriangle size={13} className="ml-1.5 inline text-amber-300" aria-label="Diverge dos módulos" /> : undefined} />
                      {(["cgr", "cgf", "rpv", "ret", "rp"] as const).map((k) => (
                        <td key={k} className="px-4 py-2.5 text-right tabular-nums text-zinc-300">{brl(h[k])}</td>
                      ))}
                      <td className={`px-4 py-2.5 text-right font-semibold tabular-nums ${cor(h.scg)}`}>{brl(h.scg)}</td>
                    </tr>
                  );
                })}
                {historicoCarregado && historico.length === 0 && (
                  <tr><td colSpan={7} className="px-4 py-8 text-center text-zinc-500">Nenhum período gravado.</td></tr>
                )}
              </tbody>
            </table>
          </div>
          <Paginacao {...pag} onMudar={pag.setPagina} rotulo={["mês", "meses"]} />
        </section>
      </div>
    </div>
  );
}
