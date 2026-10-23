import { useEffect, useMemo, useRef, useState } from "react";
import { Download, FileSpreadsheet, FolderOpen, Loader2, Play, Save, X } from "lucide-react";
import { Alert } from "../../components/ui/Alert";
import { ListaProblemas } from "../../components/ui/ListaProblemas";
import { SeletorMes } from "../../components/ui/SeletorMes";
import { baixarRelatorioAuditoria, getHistoricoAuditoria, processarAuditoria, salvarAuditoria, type ArquivoDaPasta } from "../../api";
import { mensagemDeErro } from "../../api/client";
import { brl, num } from "../../utils/format";
import { salvarArquivo } from "../../utils/download";
import { carregarNaMemoria } from "../../utils/pasta";
import { ComparacaoPlanilha } from "./ComparacaoPlanilha";
import { MESES_ABREV, anoValido } from "../../utils/periodos";
import type { AuditoriaHistoricoLinha, AuditoriaResultado } from "../../types";

const PANEL = "rounded-2xl border border-white/[0.07] bg-gradient-to-b from-white/[0.025] to-transparent bg-panel";
const LABEL = "text-[0.7rem] font-semibold uppercase tracking-[0.08em] text-zinc-400";
const BOTAO_SEC = "flex items-center justify-center gap-2 rounded-xl border border-white/[0.07] bg-white/[0.03] px-4 py-2.5 text-sm font-semibold text-zinc-200 transition-colors hover:bg-white/[0.06] disabled:opacity-40";
const LIMITE_NOTAS = 50;

interface Empresa { nome: string; xml: number; pdf: number }

/** Separa a pasta escolhida em raiz + empresas com os XML/PDF de cada uma.
 *
 * Igual ao `descer_pasta_unica` do backend: se tudo está numa única subpasta que tem
 * outras subpastas (ex.: "02 fev -26 Notas Fiscais/02 fev-26 - NF/Brava/..."), desce
 * nela, e as empresas são as subpastas do nível de baixo. O caminho enviado não muda. */
function lerPasta(lista: FileList): { raiz: string; arquivos: ArquivoDaPasta[]; empresas: Empresa[]; nivel: number } {
  let raiz = "";
  const candidatos: { arquivo: File; partes: string[]; ext: string }[] = [];
  Array.from(lista).forEach((f) => {
    const partes = (f.webkitRelativePath || f.name).split("/");
    raiz = partes[0];
    const ext = f.name.toLowerCase().split(".").pop() ?? "";
    if (partes.length >= 3 && (ext === "xml" || ext === "pdf")) candidatos.push({ arquivo: f, partes, ext });
  });

  let nivel = 1; // índice da pasta da empresa em `partes`
  while (
    candidatos.length &&
    candidatos.every((c) => c.partes.length > nivel + 1 && c.partes[nivel] === candidatos[0].partes[nivel]) &&
    candidatos.some((c) => c.partes.length > nivel + 2)
  ) nivel += 1;

  const arquivos: ArquivoDaPasta[] = [];
  const contagem = new Map<string, Empresa>();
  candidatos.forEach(({ arquivo, partes, ext }) => {
    if (partes.length < nivel + 2) return; // solto acima das pastas de empresa: o backend ignora
    arquivos.push({ arquivo, caminho: partes.slice(1).join("/") });
    const nome = partes[nivel];
    const e = contagem.get(nome) ?? { nome, xml: 0, pdf: 0 };
    if (ext === "xml") e.xml += 1; else e.pdf += 1;
    contagem.set(nome, e);
  });
  return { raiz, arquivos, empresas: [...contagem.values()].sort((a, b) => a.nome.localeCompare(b.nome)), nivel };
}

export default function AuditoriaPage() {
  const hoje = new Date();
  const [mes, setMes] = useState(MESES_ABREV[hoje.getMonth()]);
  const [ano, setAno] = useState(hoje.getFullYear());
  const periodo = `${mes}/${ano}`;

  const [pasta, setPasta] = useState<ReturnType<typeof lerPasta> | null>(null);
  const [selecionadas, setSelecionadas] = useState<Set<string>>(new Set());
  const [modo, setModo] = useState<"XML" | "PDF">("XML");
  const [planilha, setPlanilha] = useState<File | null>(null);
  const [resultado, setResultado] = useState<AuditoriaResultado | null>(null);
  const [verTodas, setVerTodas] = useState(false);
  const [historico, setHistorico] = useState<AuditoriaHistoricoLinha[]>([]);
  const [ocupado, setOcupado] = useState<null | "processar" | "salvar" | "relatorio">(null);
  const [erro, setErro] = useState<string | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);
  const [sucesso, setSucesso] = useState<string | null>(null);
  const inputPasta = useRef<HTMLInputElement>(null);
  const inputPlanilha = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Atributo que permite escolher uma pasta inteira (não existe nos tipos do React).
    inputPasta.current?.setAttribute("webkitdirectory", "");
    getHistoricoAuditoria().then(setHistorico).catch((e) => setErro(mensagemDeErro(e, "Não foi possível carregar o histórico da Auditoria CGR.")));
  }, []);

  const escolherPasta = (lista: FileList | null) => {
    if (!lista?.length) return;
    const p = lerPasta(lista);
    setPasta(p);
    setSelecionadas(new Set(p.empresas.map((e) => e.nome)));
    setResultado(null);
    setErro(p.empresas.length ? null : "Nenhuma subpasta de empresa com XML ou PDF nesta pasta. Escolha a pasta “pai”, que tem uma subpasta por empresa.");
  };

  const enviados = useMemo(
    () => (pasta ? pasta.arquivos.filter((a) => selecionadas.has(a.caminho.split("/")[pasta.nivel - 1])) : []),
    [pasta, selecionadas],
  );
  const qtdPdf = enviados.filter((a) => a.caminho.toLowerCase().endsWith(".pdf")).length;

  const processar = async () => {
    if (!pasta) return;
    setErro(null);
    setAviso(null);
    setSucesso(null);
    setOcupado("processar");
    try {
      const lidos = await carregarNaMemoria(enviados);
      const r = await processarAuditoria({
        arquivos: lidos, pastaRaiz: pasta.raiz, empresas: [...selecionadas], modo, periodo, planilha,
      });
      setResultado(r);
      setVerTodas(false);
      if (r.periodo_detectado && r.periodo_detectado !== periodo) {
        const [m, a] = r.periodo_detectado.split("/");
        setMes(m);
        setAno(Number(a));
        setAviso(`Período ajustado para ${r.periodo_detectado}, detectado pelo nome da pasta. Confira antes de salvar.`);
      }
    } catch (e) {
      setErro(e instanceof Error && !("isAxiosError" in e) ? e.message : mensagemDeErro(e, "Não foi possível auditar a pasta."));
    } finally {
      setOcupado(null);
    }
  };

  const salvar = async () => {
    if (!resultado) return;
    setErro(null);
    setSucesso(null);
    setOcupado("salvar");
    try {
      const r = await salvarAuditoria(periodo, resultado.itens);
      setSucesso(`CGR de ${periodo} salvo: ${brl(r.cgr_liquido)} (${r.qtd_itens} notas). RPV do mês agora é ${brl(r.rpv)}.`);
      getHistoricoAuditoria().then(setHistorico);
    } catch (e) {
      setErro(mensagemDeErro(e, "Não foi possível salvar a auditoria."));
    } finally {
      setOcupado(null);
    }
  };

  const relatorio = async () => {
    if (!resultado) return;
    setErro(null);
    setOcupado("relatorio");
    try {
      const blob = await baixarRelatorioAuditoria(periodo, resultado.itens, planilha);
      salvarArquivo(blob, `Auditoria_${periodo.replace("/", "-")}.xlsx`);
    } catch (e) {
      setErro(mensagemDeErro(e, "Não foi possível gerar o relatório da Auditoria."));
    } finally {
      setOcupado(null);
    }
  };

  const t = resultado?.totais;
  const notas = resultado ? (verTodas ? resultado.itens : resultado.itens.slice(0, LIMITE_NOTAS)) : [];
  const problemas = resultado?.problemas ?? [];
  // Arquivos de nota que não viraram nota (XML/PDF): a conta lidos × auditadas fecha com eles.
  const arquivosComProblema = problemas.filter((p) => p.arquivo && p.codigo !== "planilha_comparacao_ilegivel").length;

  return (
    <div className="px-4 py-6 sm:px-8 lg:px-10 lg:py-8">
      <div className="mx-auto flex max-w-[1500px] flex-col gap-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white sm:text-[1.75rem]">Auditoria CGR</h1>
          <p className="mt-1 text-sm text-zinc-400">
            CGR = Σ compra sem tributos das NF-e e dos CT-e de gasoduto (TAG, Mastergás). Devoluções subtraem; frete de outras transportadoras fica fora.
          </p>
        </div>

        {erro && <Alert variant="error">{erro}</Alert>}
        {aviso && <Alert variant="warning">{aviso}</Alert>}
        {sucesso && <Alert variant="success">{sucesso}</Alert>}
        <ListaProblemas problemas={problemas} />

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
          {/* Entrada */}
          <section className={`${PANEL} flex flex-col gap-5 p-5 sm:p-6 xl:col-span-5`}>
            <div>
              <h2 className="text-base font-semibold text-white">Notas fiscais do mês</h2>
              <p className="mt-0.5 text-sm text-zinc-400">Escolha a pasta “pai”: uma subpasta por empresa, com os XML e/ou PDF.</p>
            </div>
            <input ref={inputPasta} type="file" multiple className="hidden" onChange={(e) => { escolherPasta(e.target.files); e.target.value = ""; }} />
            <button type="button" disabled={ocupado !== null} onClick={() => inputPasta.current?.click()}
              className="flex w-full flex-col items-center gap-2 rounded-xl border-2 border-dashed border-white/[0.1] px-5 py-6 text-center transition-colors hover:border-sky-500/40 hover:bg-white/[0.02] disabled:opacity-50">
              <FolderOpen size={20} className="text-zinc-500" />
              <span className="text-sm font-medium text-zinc-200">{pasta ? `Pasta: ${pasta.raiz}` : "Escolher pasta"}</span>
              <span className="text-xs text-zinc-500">{pasta ? `${pasta.arquivos.length} arquivos XML/PDF em ${pasta.empresas.length} empresas` : "O navegador pede confirmação para ler a pasta"}</span>
            </button>

            {pasta && pasta.empresas.length > 0 && (
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <p className={LABEL}>Empresas ({selecionadas.size}/{pasta.empresas.length})</p>
                  <button type="button" className="text-xs text-sky-300 hover:text-sky-200"
                    onClick={() => setSelecionadas(selecionadas.size === pasta.empresas.length ? new Set() : new Set(pasta.empresas.map((e) => e.nome)))}>
                    {selecionadas.size === pasta.empresas.length ? "Desmarcar todas" : "Marcar todas"}
                  </button>
                </div>
                <ul className="max-h-60 space-y-1 overflow-y-auto pr-1">
                  {pasta.empresas.map((e) => (
                    <li key={e.nome}>
                      <label className="flex cursor-pointer items-center gap-3 rounded-lg px-2 py-1.5 text-sm hover:bg-white/[0.03]">
                        <input type="checkbox" checked={selecionadas.has(e.nome)} className="accent-sky-500"
                          onChange={() => {
                            const n = new Set(selecionadas);
                            if (n.has(e.nome)) n.delete(e.nome); else n.add(e.nome);
                            setSelecionadas(n);
                          }} />
                        <span className="flex-1 text-zinc-200">{e.nome}</span>
                        <span className="text-xs tabular-nums text-zinc-500">{e.xml} XML · {e.pdf} PDF</span>
                      </label>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div>
              <p className={`${LABEL} mb-2`}>Ler as notas de</p>
              <div role="radiogroup" className="inline-flex rounded-lg border border-white/[0.07] bg-white/[0.02] p-0.5">
                {([["XML", "XML (e PDFs sem XML)"], ["PDF", "Somente PDF"]] as const).map(([v, txt]) => (
                  <button key={v} type="button" role="radio" aria-checked={modo === v} onClick={() => setModo(v)}
                    className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${modo === v ? "bg-white/[0.1] text-white" : "text-zinc-400 hover:text-zinc-200"}`}>
                    {txt}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className={`${LABEL} mb-2`}>Comparar com a planilha da Conta Gráfica (opcional)</p>
              <input ref={inputPlanilha} type="file" accept=".xlsx,.xls" className="hidden"
                onChange={(e) => { setPlanilha(e.target.files?.[0] ?? null); e.target.value = ""; }} />
              {planilha ? (
                <div className="flex items-center gap-2 rounded-lg border border-white/[0.05] bg-white/[0.015] px-3 py-2 text-sm">
                  <FileSpreadsheet size={14} className="text-emerald-400" />
                  <span className="min-w-0 flex-1 truncate text-zinc-200">{planilha.name}</span>
                  <button type="button" onClick={() => setPlanilha(null)} aria-label="Remover planilha" className="text-zinc-500 hover:text-red-400"><X size={14} /></button>
                </div>
              ) : (
                <button type="button" onClick={() => inputPlanilha.current?.click()} className={`${BOTAO_SEC} w-full`}>
                  <FileSpreadsheet size={15} /> Escolher planilha (.xlsx)
                </button>
              )}
            </div>

            <button type="button" onClick={processar} disabled={!enviados.length || ocupado !== null}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-sky-600 py-3 text-sm font-semibold text-white shadow-[0_4px_14px_-4px_rgba(14,165,233,0.5)] transition-colors hover:bg-sky-500 disabled:opacity-50">
              {ocupado === "processar" ? <Loader2 size={16} className="animate-spin" /> : <Play size={16} />}
              {ocupado === "processar" ? `Auditando ${enviados.length} arquivos…` : "Executar auditoria"}
            </button>
            {ocupado === "processar" && qtdPdf > 20 && (
              <p className="-mt-2 text-xs text-zinc-500">Ler {qtdPdf} PDFs leva alguns minutos (cerca de 1 min a cada 90). Não feche a página.</p>
            )}
          </section>

          {/* Resultado */}
          <div className="flex flex-col gap-6 xl:col-span-7">
            <section className={`${PANEL} p-5 sm:p-6`}>
              <SeletorMes mes={mes} ano={ano} onChange={(m, a) => { setMes(m); setAno(a); }} />
            </section>

            <section className={`${PANEL} p-5 sm:p-6`}>
              {!t ? (
                <p className="py-6 text-center text-sm text-zinc-500">Escolha a pasta e execute a auditoria.</p>
              ) : (
                <>
                  <div className="flex flex-wrap items-end justify-between gap-4">
                    <div>
                      <p className={LABEL}>CGR líquido de {periodo}</p>
                      <p className="mt-1 text-3xl font-bold tracking-tight tabular-nums text-sky-300">{brl(t.cgr_liquido)}</p>
                      <p className="mt-1 text-xs text-zinc-500">
                        {t.qtd_nfe} NF-e · {t.qtd_cte} CT-e · {t.qtd_devolucoes} devoluções · lidos {resultado!.qtd_xml_lidos} XML e {resultado!.qtd_pdf_lidos} PDF
                        {" "}· {resultado!.itens.length} notas auditadas
                        {arquivosComProblema > 0 && <span className="text-amber-300"> · {arquivosComProblema} {arquivosComProblema === 1 ? "arquivo" : "arquivos"} com problema (ver lista acima)</span>}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <button type="button" onClick={relatorio} disabled={ocupado !== null} className={BOTAO_SEC}>
                        {ocupado === "relatorio" ? <Loader2 size={15} className="animate-spin" /> : <Download size={15} />} Relatório Excel
                      </button>
                      <button type="button" onClick={salvar} disabled={ocupado !== null || !anoValido(ano)}
                        className="flex items-center gap-2 rounded-xl bg-sky-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-sky-500 disabled:opacity-40">
                        {ocupado === "salvar" ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />} Salvar CGR de {periodo}
                      </button>
                    </div>
                  </div>
                  <div className="mt-5 overflow-x-auto">
                    <table className="w-full min-w-[36rem] text-sm">
                      <thead className="text-[0.7rem] uppercase tracking-[0.08em] text-zinc-400">
                        <tr className="border-b border-white/[0.07]">
                          {["Empresa", "NF-e", "CT-e", "Valor das notas", "CGR líquido"].map((h, i) => (
                            <th key={h} className={`py-2 font-semibold ${i ? "text-right" : "text-left"}`}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/[0.05]">
                        {t.por_empresa.map((e) => (
                          <tr key={e.empresa}>
                            <td className="py-2 text-zinc-200">
                              {e.empresa}
                              {e.frete_fora_do_cgr > 0 && <span className="ml-2 text-xs text-zinc-500">frete fora do CGR: {brl(e.frete_fora_do_cgr)}</span>}
                            </td>
                            <td className="py-2 text-right tabular-nums text-zinc-400">{e.qtd_nfe}</td>
                            <td className="py-2 text-right tabular-nums text-zinc-400">{e.qtd_cte}</td>
                            <td className="py-2 text-right tabular-nums text-zinc-300">{brl(e.valor_total)}</td>
                            <td className="py-2 text-right font-semibold tabular-nums text-zinc-100">{brl(e.cgr_liquido)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </section>

            {resultado && (resultado.comparacao ? (
              <ComparacaoPlanilha comparacao={resultado.comparacao} className={`${PANEL} p-5 sm:p-6`} />
            ) : (
              <p className="text-sm text-zinc-500">{resultado.aviso_comparacao}</p>
            ))}
          </div>
        </div>

        {resultado && (
          <section className={`${PANEL} overflow-hidden`}>
            <div className="border-b border-white/[0.07] px-5 py-4 sm:px-6">
              <h2 className="text-base font-semibold text-white">Notas auditadas ({resultado.itens.length})</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[56rem] text-sm">
                <thead className="bg-white/[0.03] text-[0.7rem] uppercase tracking-[0.08em] text-zinc-400">
                  <tr>
                    {["Empresa", "Tipo", "Número", "Valor", "ICMS", "CGR líquido", "Origem"].map((h, i) => (
                      <th key={h} className={`px-4 py-3 font-semibold ${i >= 3 && i <= 5 ? "text-right" : "text-left"}`}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.05]">
                  {notas.map((n, i) => (
                    <tr key={`${n.caminho}-${i}`} className={n.devolucao ? "bg-red-500/[0.04]" : ""}>
                      <td className="px-4 py-2 text-zinc-200">{n.empresa}</td>
                      <td className="px-4 py-2 text-zinc-400">{n.tipo}</td>
                      <td className="px-4 py-2 font-mono text-xs text-zinc-300">{n.numero}</td>
                      <td className="px-4 py-2 text-right tabular-nums text-zinc-300">{brl(n.valor_total)}</td>
                      <td className="px-4 py-2 text-right tabular-nums text-zinc-400">{num(n.icms_taxa * 100, 2)}%</td>
                      <td className={`px-4 py-2 text-right font-semibold tabular-nums ${!n.integra_cgr ? "text-zinc-600" : n.cgr_liquido < 0 ? "text-red-300" : "text-zinc-100"}`}>
                        {n.integra_cgr ? brl(n.cgr_liquido) : "fora (frete)"}
                      </td>
                      <td className="px-4 py-2 text-xs text-zinc-500">{n.status === "OCR" ? "PDF" : "XML"}{n.devolucao && " · devolução"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {resultado.itens.length > LIMITE_NOTAS && (
              <button type="button" onClick={() => setVerTodas(!verTodas)} className="w-full border-t border-white/[0.07] py-3 text-sm text-sky-300 hover:bg-white/[0.02]">
                {verTodas ? "Mostrar menos" : `Mostrar todas as ${resultado.itens.length} notas`}
              </button>
            )}
          </section>
        )}

        <section className={`${PANEL} overflow-hidden`}>
          <div className="border-b border-white/[0.07] px-5 py-4 sm:px-6">
            <h2 className="text-base font-semibold text-white">Meses auditados</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[32rem] text-sm">
              <thead className="bg-white/[0.03] text-[0.7rem] uppercase tracking-[0.08em] text-zinc-400">
                <tr>
                  {["Período", "Notas gravadas", "CGR gravado", "Atualizado"].map((h, i) => (
                    <th key={h} className={`px-4 py-3 font-semibold ${i ? "text-right" : "text-left"}`}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.05]">
                {historico.map((h) => (
                  <tr key={h.periodo}>
                    <td className="px-4 py-2.5 font-medium text-zinc-200">{h.periodo}{!h.periodo_valido && <span className="ml-2 rounded-full border border-red-500/30 bg-red-500/10 px-1.5 py-0.5 text-[0.65rem] font-semibold text-red-300" title="Período gravado com nome inválido: corrija ou apague no banco">inválido</span>}</td>
                    <td className="px-4 py-2.5 text-right tabular-nums text-zinc-300">{h.qtd_notas}</td>
                    <td className="px-4 py-2.5 text-right font-semibold tabular-nums text-zinc-100">{brl(h.cgr_gravado)}</td>
                    <td className="px-4 py-2.5 text-right tabular-nums text-zinc-500">{h.data_atualizacao}</td>
                  </tr>
                ))}
                {historico.length === 0 && <tr><td colSpan={4} className="px-4 py-8 text-center text-zinc-500">Nenhum mês auditado.</td></tr>}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
}
