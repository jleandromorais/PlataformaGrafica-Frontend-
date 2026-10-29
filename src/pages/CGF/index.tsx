import { useEffect, useRef, useState } from "react";
import { Loader2, Play, Save, Zap } from "lucide-react";
import { Alert } from "../../components/ui/Alert";
import { ListaProblemas } from "../../components/ui/ListaProblemas";
import { SeletorArquivos } from "../../components/ui/SeletorArquivos";
import { SeletorMes } from "../../components/ui/SeletorMes";
import { calcularCGFRs, getHistoricoCGF, getPMPVMensal, processarCGF, salvarCGF } from "../../api";
import { mensagemDeErro } from "../../api/client";
import { arredondarTarifa, brl, num } from "../../utils/format";
import { MESES_ABREV, anoValido } from "../../utils/periodos";
import { useManterPeriodoNaUrl, usePeriodoDaUrl } from "../../utils/periodoNaUrl";
import type { CGFColunas, CGFHistoricoLinha, CGFProcessarResponse } from "../../types";
import { PageHeader } from "../../components/layout/PageHeader";

const PANEL = "rounded-xl border border-white/[0.07] bg-panel";
const INPUT = "rounded-lg border border-white/[0.07] bg-white/[0.03] px-3 py-2 text-sm text-zinc-100 tabular-nums placeholder-zinc-600 transition-colors focus:border-transparent focus:outline-none focus:ring-1 focus:ring-sky-500/50";

const COLUNAS_PADRAO: CGFColunas = {
  col_fat_volume: "Volume Faturado",
  col_fat_consumo: "Produto",
  val_fat_consumo: "consumo proprio",
  col_canc_volume: "Volume Canc/Deneg",
  col_dev_volume: "Volume Devolução",
};

// Mesma regra do backend (ServicosCGF.tipo_do_nome em servicos_cgf.py): mantenha as listas iguais.
// Ordem importa: faturada/complementar é testada antes de cancelada.
const PALAVRAS_FATURADA = ["faturada", "complementar"];
const PALAVRAS_CANCELADA = ["canc", "deneg", "rejeitad"]; // cobre "NF canc.rejeitadas.deneg"
const PALAVRAS_DEVOLUCAO = ["devolu", "devolv"];
const DICA_NOME = "O nome precisa conter faturada, complementar, cancelada, denegada, rejeitada, devolução ou devolvida. Renomeie o arquivo.";

/** O tipo da planilha vem do nome do arquivo. */
function tipoDoArquivo(nome: string): { texto: string; cls: string; reconhecido: boolean } {
  const n = nome.toLowerCase();
  const tem = (palavras: string[]) => palavras.some((p) => n.includes(p));
  if (tem(PALAVRAS_FATURADA)) return { texto: "Faturada", cls: "border-emerald-500/25 bg-emerald-500/10 text-emerald-300", reconhecido: true };
  if (tem(PALAVRAS_CANCELADA)) return { texto: "Canceladas", cls: "border-zinc-500/25 bg-white/[0.04] text-zinc-300", reconhecido: true };
  if (tem(PALAVRAS_DEVOLUCAO)) return { texto: "Devoluções", cls: "border-amber-500/25 bg-amber-500/10 text-amber-300", reconhecido: true };
  return { texto: "Não reconhecido", cls: "border-red-500/30 bg-red-500/10 text-red-300", reconhecido: false };
}

const MARCA_GRAVIDADE = {
  erro: { simbolo: "✕", cls: "text-red-300" },
  aviso: { simbolo: "⚠", cls: "text-amber-300" },
} as const;

const m3 = (v: number) => `${num(v, 4)} m³`;

export default function CGFPage() {
  const hoje = new Date();
  // "Fazer agora" do Painel do Ciclo abre no mês certo (?periodo=Mai/2026).
  const daUrl = usePeriodoDaUrl("periodo");
  const [mes, setMes] = useState(MESES_ABREV[daUrl?.mes ?? hoje.getMonth()]);
  const [ano, setAno] = useState(daUrl?.ano ?? hoje.getFullYear());
  useManterPeriodoNaUrl("periodo", `${mes}/${ano}`);
  const periodo = `${mes}/${ano}`;

  const [arquivos, setArquivos] = useState<File[]>([]);
  const [colunas, setColunas] = useState<CGFColunas>(COLUNAS_PADRAO);
  const [resultado, setResultado] = useState<CGFProcessarResponse | null>(null);
  const [pmpv, setPmpv] = useState<number | null>(null);
  const [pmpvTexto, setPmpvTexto] = useState("");
  const [carregandoPmpv, setCarregandoPmpv] = useState(true); // a busca inicial roda ao abrir
  const [historico, setHistorico] = useState<CGFHistoricoLinha[]>([]);
  const [ocupado, setOcupado] = useState<null | "processar" | "salvar">(null);
  const [erro, setErro] = useState<string | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);
  const [sucesso, setSucesso] = useState<string | null>(null);
  const ultimaBuscaPmpv = useRef(0);
  const [calculo, setCalculo] = useState<{ chave: string; cgfRs: number | null } | null>(null);
  const ultimoCalculo = useRef(0);

  const buscarPmpv = (p: string) => {
    const busca = ++ultimaBuscaPmpv.current;
    const aplicar = (v: number) => {
      if (busca !== ultimaBuscaPmpv.current) return;
      setPmpv(v);
      setPmpvTexto(v > 0 ? String(v).replace(".", ",") : "");
      setCarregandoPmpv(false);
    };
    getPMPVMensal(p)
      .then((r) => aplicar(arredondarTarifa(r.pmpv || 0)))
      .catch(() => aplicar(0));
  };

  const editarPmpv = (texto: string) => {
    ultimaBuscaPmpv.current++; // digitação manual vence uma busca em andamento
    setCarregandoPmpv(false);
    setPmpvTexto(texto);
    const n = Number(texto.replace(",", "."));
    setPmpv(Number.isFinite(n) && n > 0 ? n : 0);
  };

  useEffect(() => {
    getHistoricoCGF().then(setHistorico).catch((e) => setErro(mensagemDeErro(e, "Não foi possível carregar o histórico do CGF.")));
    buscarPmpv(periodo);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps -- só na abertura

  // CGF em R$ vem do back (volume final × PMPV); aqui só pedimos e mostramos.
  const volumeFinal = resultado?.volume_final ?? null;
  useEffect(() => {
    if (volumeFinal === null || !pmpv || !anoValido(ano)) return;
    const chamada = ++ultimoCalculo.current;
    const chave = `${mes}/${ano}|${volumeFinal}|${pmpv}`;
    calcularCGFRs(`${mes}/${ano}`, volumeFinal, pmpv)
      .then((r) => chamada === ultimoCalculo.current && setCalculo({ chave, cgfRs: r.cgf_rs }))
      .catch((e) => chamada === ultimoCalculo.current && setErro(mensagemDeErro(e, "Não foi possível calcular o CGF em R$.")));
  }, [mes, ano, volumeFinal, pmpv]);

  const mudarPeriodo = (m: string, a: number) => {
    setMes(m);
    setAno(a);
    setSucesso(null);
    setPmpv(null);
    setPmpvTexto("");
    if (anoValido(a)) {
      setCarregandoPmpv(true);
      buscarPmpv(`${m}/${a}`);
    }
  };

  const processar = async () => {
    setErro(null);
    setAviso(null);
    setSucesso(null);
    setOcupado("processar");
    try {
      const r = await processarCGF(arquivos, colunas);
      setResultado(r);
      if (r.periodo_detectado && r.periodo_detectado !== periodo) {
        const [m, a] = r.periodo_detectado.split("/");
        mudarPeriodo(m, Number(a));
        setAviso(`Período ajustado para ${r.periodo_detectado}, detectado pelo nome dos arquivos. Confira antes de salvar.`);
      }
    } catch (e) {
      setErro(mensagemDeErro(e, "Não foi possível processar as planilhas."));
    } finally {
      setOcupado(null);
    }
  };

  const salvar = async () => {
    if (!resultado || !pmpv || (resultado.problemas ?? []).some((p) => p.gravidade === "erro")) return;
    setErro(null);
    setSucesso(null);
    setOcupado("salvar");
    try {
      const { volume_faturado, volume_canceladas, volume_devolucoes, volume_consumo_proprio, volume_final } = resultado;
      const r = await salvarCGF({ periodo, pmpv, volume_faturado, volume_canceladas, volume_devolucoes, volume_consumo_proprio, volume_final });
      setSucesso(`CGF de ${periodo} salvo: ${brl(r.cgf_rs)}. RPV do mês agora é ${brl(r.rpv)}.`);
      getHistoricoCGF().then(setHistorico);
    } catch (e) {
      setErro(mensagemDeErro(e, "Não foi possível salvar o CGF."));
    } finally {
      setOcupado(null);
    }
  };

  const chaveAtual = resultado && pmpv ? `${periodo}|${resultado.volume_final}|${pmpv}` : null;
  const cgfRs = chaveAtual && calculo?.chave === chaveAtual ? calculo.cgfRs : null;
  const tipos = arquivos.map((a) => tipoDoArquivo(a.name));
  const semFaturada = arquivos.length > 0 && !tipos.some((t) => t.texto === "Faturada");
  const naoReconhecidos = tipos.filter((t) => !t.reconhecido).length;
  const problemas = resultado?.problemas ?? [];
  const comErro = problemas.some((p) => p.gravidade === "erro");
  /** Pior problema de um arquivo depois de processar (erro > aviso), para marcar o chip. */
  const piorDoArquivo = (nome: string) => {
    const doArquivo = problemas.filter((p) => p.arquivo === nome);
    return doArquivo.find((p) => p.gravidade === "erro") ?? doArquivo.find((p) => p.gravidade === "aviso");
  };

  return (
    <div className="px-4 py-6 sm:px-8 lg:px-10 lg:py-8">
      <div className="mx-auto flex max-w-[1400px] flex-col gap-6">
        <PageHeader modulo="cgf" formula="Volume final = faturado (sem consumo próprio) − devoluções · CGF em R$ = volume final × PMPV do mês" />

        {erro && <Alert variant="error">{erro}</Alert>}
        {aviso && <Alert variant="warning">{aviso}</Alert>}
        {sucesso && <Alert variant="success">{sucesso}</Alert>}
        <ListaProblemas problemas={problemas} />

        <section className={`${PANEL} p-5 sm:p-6`}>
          <SeletorMes
            mes={mes}
            ano={ano}
            onChange={(m, a) => {
              // Os volumes processados são do mês anterior: sem limpar, dava para
              // salvar a planilha de um mês no outro (Jun/2026 gravado com os dados de Mai).
              if (m !== mes || a !== ano) setResultado(null);
              mudarPeriodo(m, a);
            }}
          />
        </section>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
          <div className="flex flex-col gap-6 xl:col-span-5">
            <section className={`${PANEL} p-5 sm:p-6`}>
              <h2 className="text-base font-semibold text-white">Planilhas de NF do mês</h2>
              <p className="mb-4 mt-0.5 text-sm text-zinc-400">
                O tipo vem do nome do arquivo: “faturada/complementar”, “cancelada/denegada/rejeitada”, “devolução/devolvida”.
              </p>
              <SeletorArquivos
                arquivos={arquivos}
                onChange={(a) => { setArquivos(a); setResultado(null); }}
                accept=".xlsx,.xls,.xlsm,.csv"
                titulo="Escolher planilhas (.xlsx, .xls, .csv)"
                desabilitado={ocupado !== null}
                etiqueta={(a) => {
                  const t = tipoDoArquivo(a.name);
                  const p = piorDoArquivo(a.name);
                  const marca = p && p.gravidade !== "info" ? MARCA_GRAVIDADE[p.gravidade] : null;
                  return (
                    <span className="flex shrink-0 items-center gap-1.5">
                      {marca && <span className={`text-xs font-bold ${marca.cls}`} title={p?.mensagem} aria-label={p?.mensagem}>{marca.simbolo}</span>}
                      <span className={`rounded-full border px-2 py-0.5 text-[0.7rem] font-semibold ${t.cls}`} title={t.reconhecido ? undefined : DICA_NOME}>
                        {t.texto}
                      </span>
                    </span>
                  );
                }}
              />
              {semFaturada && <p className="mt-3 text-xs text-amber-300">Nenhuma planilha de NF faturada na lista: o volume final vai dar zero.</p>}
              {naoReconhecidos > 0 && (
                <p className="mt-3 text-xs text-red-300">
                  {naoReconhecidos === 1 ? "1 arquivo não será lido" : `${naoReconhecidos} arquivos não serão lidos`} (nome sem tipo). {DICA_NOME}
                </p>
              )}
              <details className="mt-4 text-sm">
                <summary className="cursor-pointer text-zinc-400 hover:text-zinc-200">Colunas das planilhas</summary>
                <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {([
                    ["col_fat_volume", "Volume faturado"],
                    ["col_fat_consumo", "Coluna do consumo próprio"],
                    ["val_fat_consumo", "Texto do consumo próprio"],
                    ["col_canc_volume", "Volume canceladas"],
                    ["col_dev_volume", "Volume devoluções"],
                  ] as [keyof CGFColunas, string][]).map(([k, rotulo]) => (
                    <label key={k} className="flex flex-col gap-1">
                      <span className="text-xs text-zinc-500">{rotulo}</span>
                      <input value={colunas[k]} onChange={(e) => setColunas({ ...colunas, [k]: e.target.value })} className={INPUT} />
                    </label>
                  ))}
                </div>
              </details>
              <button
                type="button" onClick={processar} disabled={!arquivos.length || ocupado !== null}
                className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-marinho py-3 text-sm font-semibold text-paper transition-colors hover:bg-marinho-claro disabled:cursor-not-allowed disabled:bg-white/[0.06] disabled:text-zinc-400 disabled:shadow-none"
              >
                {ocupado === "processar" ? <Loader2 size={16} className="animate-spin" /> : <Play size={16} />}
                {ocupado === "processar" ? "Processando…" : "Processar planilhas"}
              </button>
              {!arquivos.length && ocupado === null && <p className="mt-2 text-center text-xs text-zinc-400">Escolha as planilhas acima para liberar o processamento.</p>}
            </section>
          </div>

          <div className="flex flex-col gap-6 xl:col-span-7">

            <section className={`${PANEL} p-5 sm:p-6`}>
              <h2 className="text-base font-semibold text-sky-300">CGF em R$ <span className="text-zinc-500">—</span> Volume × PMPV</h2>
              <div className="mt-4 flex flex-wrap items-center gap-3">
                <label htmlFor="cgf-pmpv" className="text-sm text-zinc-400">PMPV (R$/m³):</label>
                <input
                  id="cgf-pmpv" inputMode="decimal" value={pmpvTexto} placeholder="0,0000"
                  onChange={(e) => editarPmpv(e.target.value)}
                  className={`${INPUT} w-40`}
                />
                <button
                  type="button" onClick={() => { setCarregandoPmpv(true); buscarPmpv(periodo); }} disabled={carregandoPmpv || !anoValido(ano)}
                  className="flex items-center gap-2 rounded-lg bg-marinho px-4 py-2 text-sm font-semibold text-paper transition-colors hover:bg-marinho-claro disabled:cursor-not-allowed disabled:bg-white/[0.06] disabled:text-zinc-400 disabled:shadow-none"
                >
                  {carregandoPmpv ? <Loader2 size={15} className="animate-spin" /> : <Zap size={15} />}
                  Carregar do banco
                </button>
              </div>
              <p className="mt-5 text-2xl font-bold tracking-tight text-emerald-300">
                CGF em R$: <span className="tabular-nums">{cgfRs !== null ? brl(cgfRs) : "—"}</span>
              </p>
              {pmpv === 0 && !carregandoPmpv && (
                <p className="mt-2 text-xs text-amber-300">Sem PMPV para {periodo}: digite o valor ou salve o PMPV do mês no módulo PMPV.</p>
              )}
              {pmpv !== null && pmpv > 0 && !resultado && (
                <p className="mt-2 text-xs text-zinc-500">Processe as planilhas para calcular o volume final.</p>
              )}
            </section>

            <section className={`${PANEL} overflow-hidden`}>
              <div className="border-b border-white/[0.07] px-5 py-4 sm:px-6">
                <h2 className="text-base font-semibold text-white">Volumes de {periodo}</h2>
              </div>
              {!resultado ? (
                <p className="px-6 py-10 text-center text-sm text-zinc-500">Escolha as planilhas e clique em Processar.</p>
              ) : (
                <dl className="divide-y divide-white/[0.05] text-sm">
                  {[
                    { k: "(+) Faturado", v: resultado.volume_faturado, nota: "já sem o consumo próprio" },
                    { k: "Consumo próprio", v: resultado.volume_consumo_proprio, nota: "informativo: já retirado do faturado", fraco: true },
                    { k: "Canceladas / denegadas", v: resultado.volume_canceladas, nota: "informativo: não entra no volume final", fraco: true },
                    { k: "(−) Devoluções", v: resultado.volume_devolucoes },
                  ].map((l) => (
                    <div key={l.k} className="flex items-baseline justify-between gap-4 px-5 py-3 sm:px-6">
                      <dt className={l.fraco ? "text-zinc-500" : "text-zinc-300"}>
                        {l.k}
                        {l.nota && <span className="ml-2 text-xs text-zinc-500">{l.nota}</span>}
                      </dt>
                      <dd className={`tabular-nums ${l.fraco ? "text-zinc-500" : "text-zinc-200"}`}>{m3(l.v)}</dd>
                    </div>
                  ))}
                  <div className="flex items-baseline justify-between gap-4 bg-white/[0.02] px-5 py-3.5 sm:px-6">
                    <dt className="font-semibold text-white">Volume final</dt>
                    <dd className="text-lg font-bold tabular-nums text-sky-300">{m3(resultado.volume_final)}</dd>
                  </div>
                  <div className="flex flex-wrap items-center justify-between gap-4 bg-white/[0.02] px-5 py-4 sm:px-6">
                    <p className="text-sm text-zinc-400">
                      {comErro
                        ? <span className="text-red-300">Corrija os problemas acima e processe de novo para poder salvar.</span>
                        : cgfRs !== null ? <>CGF de {periodo}: <span className="font-semibold text-emerald-300">{brl(cgfRs)}</span></> : "Informe o PMPV para poder salvar."}
                    </p>
                    <button
                      type="button" onClick={salvar} disabled={cgfRs === null || comErro || ocupado !== null}
                      title={comErro ? "Corrija os problemas acima e processe de novo." : undefined}
                      className="flex items-center gap-2 rounded-xl bg-marinho px-5 py-2.5 text-sm font-semibold text-paper transition-colors hover:bg-marinho-claro disabled:cursor-not-allowed disabled:bg-white/[0.06] disabled:text-zinc-400 disabled:shadow-none"
                    >
                      {ocupado === "salvar" ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                      Salvar CGF de {periodo}
                    </button>
                  </div>
                </dl>
              )}
            </section>

            {resultado && (
              <details className={`${PANEL} p-5 text-sm sm:p-6`}>
                <summary className="cursor-pointer font-medium text-zinc-300 hover:text-white">Detalhes do processamento</summary>
                <pre className="mt-3 max-h-80 overflow-auto whitespace-pre-wrap font-mono text-xs leading-relaxed text-zinc-400">{resultado.logs.join("\n")}</pre>
              </details>
            )}
          </div>
        </div>

        <section className={`${PANEL} overflow-hidden`}>
          <div className="border-b border-white/[0.07] px-5 py-4 sm:px-6">
            <h2 className="text-base font-semibold text-white">Histórico gravado</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[52rem] text-sm">
              <thead className="bg-white/[0.03] text-[0.7rem] text-zinc-400">
                <tr>
                  {["Período", "Faturado (m³)", "Devoluções (m³)", "Volume final (m³)", "CGF (R$)", "Atualizado"].map((h, i) => (
                    <th key={h} className={`px-4 py-3 font-semibold ${i ? "text-right" : "text-left"}`}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.05]">
                {historico.map((h) => (
                  <tr key={h.periodo} className={h.periodo === periodo ? "bg-sky-500/[0.06]" : ""}>
                    <td className="px-4 py-2.5 font-medium text-zinc-200">{h.periodo}{!h.periodo_valido && <span className="ml-2 rounded-full border border-red-500/30 bg-red-500/10 px-1.5 py-0.5 text-[0.65rem] font-semibold text-red-300" title="Período gravado com nome inválido: corrija ou apague no banco">inválido</span>}</td>
                    <td className="px-4 py-2.5 text-right tabular-nums text-zinc-300">{num(h.volume_faturado, 2)}</td>
                    <td className={`px-4 py-2.5 text-right tabular-nums ${h.volume_devolucoes ? "text-zinc-300" : "text-amber-300"}`}
                      title={h.volume_devolucoes ? undefined : "Sem devoluções: confira se o arquivo de devolvidas foi lido"}>
                      {num(h.volume_devolucoes, 2)}
                    </td>
                    <td className="px-4 py-2.5 text-right tabular-nums text-zinc-200">{num(h.volume_final, 2)}</td>
                    <td className="px-4 py-2.5 text-right font-semibold tabular-nums text-emerald-300">{brl(h.cgf_rs)}</td>
                    <td className="px-4 py-2.5 text-right tabular-nums text-zinc-500">{h.data_atualizacao}</td>
                  </tr>
                ))}
                {historico.length === 0 && (
                  <tr><td colSpan={6} className="px-4 py-8 text-center text-zinc-500">Nenhum CGF gravado.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
}
