import { useEffect, useState } from "react";
import { Download, Loader2, Play, Save } from "lucide-react";
import { Alert } from "../../components/ui/Alert";
import { AvisoPdfNaoLido } from "../../components/ui/AvisoPdfNaoLido";
import { SeletorMes } from "../../components/ui/SeletorMes";
import { SeletorPasta } from "../../components/ui/SeletorPasta";
import {
  baixarRelatorioConcilia, getHistoricoConcilia, processarConcilia, salvarConcilia, type ArquivoDaPasta,
} from "../../api";
import { mensagemDeErro } from "../../api/client";
import { brl, brlEntrada, parseBRL } from "../../utils/format";
import { salvarArquivo } from "../../utils/download";
import { lerPasta } from "../../utils/pasta";
import { MESES_ABREV, anoValido } from "../../utils/periodos";
import { useManterPeriodoNaUrl, usePeriodoDaUrl } from "../../utils/periodoNaUrl";
import type { ConciliaHistoricoLinha, ConciliaItem } from "../../types";
import { tituloDe } from "../../utils/glossario";

const PANEL = "rounded-2xl border border-white/[0.07] bg-gradient-to-b from-white/[0.025] to-transparent bg-panel";
const LABEL = "text-[0.7rem] font-semibold uppercase tracking-[0.08em] text-zinc-400";
const BOTAO_SEC = "flex items-center justify-center gap-2 rounded-xl border border-white/[0.07] bg-white/[0.03] px-4 py-2.5 text-sm font-semibold text-zinc-200 transition-colors hover:bg-white/[0.06] disabled:opacity-40";

type Pasta = { raiz: string; arquivos: ArquivoDaPasta[] };

/** Padrão RP: mesmo desconto de PIS/COFINS (9,25%) que o backend e a planilha "Conta Gráfica". */
const FATOR_PIS_COFINS = 1 - 0.0925;

/** TOP não recuperável (mesma regra do backend: "top" como palavra, não "Desktop"). Sempre receita. */
const ehTop = (it: ConciliaItem) => /(^|[^a-z])top([^a-z]|$)/i.test(it.caminho);

/** Despesa que já foi contada no RET: o backend zera o valor para não contar de novo no RP. */
const JA_NO_RET = "JA_NO_RET";

export default function ConciliacaoPage() {
  const hoje = new Date();
  // "Fazer agora" do Painel do Ciclo abre no mês certo (?periodo=Mai/2026).
  const daUrl = usePeriodoDaUrl("periodo");
  const [mes, setMes] = useState(MESES_ABREV[daUrl?.mes ?? hoje.getMonth()]);
  const [ano, setAno] = useState(daUrl?.ano ?? hoje.getFullYear());
  useManterPeriodoNaUrl("periodo", `${mes}/${ano}`);
  const periodo = `${mes}/${ano}`;

  const [receitas, setReceitas] = useState<Pasta | null>(null);
  const [despesas, setDespesas] = useState<Pasta | null>(null);
  const [itens, setItens] = useState<ConciliaItem[] | null>(null);
  const [ocrDisponivel, setOcrDisponivel] = useState(true);
  const [editados, setEditados] = useState<Record<number, string>>({});
  const [historico, setHistorico] = useState<ConciliaHistoricoLinha[]>([]);
  const [ocupado, setOcupado] = useState<null | "processar" | "salvar" | "relatorio">(null);
  const [erro, setErro] = useState<string | null>(null);
  const [sucesso, setSucesso] = useState<string | null>(null);

  useEffect(() => {
    getHistoricoConcilia().then(setHistorico).catch((e) => setErro(mensagemDeErro(e, "Não foi possível carregar o histórico da Conciliação (RP).")));
  }, []);

  /** Itens com os valores digitados à mão nos PDFs que não foram lidos. */
  const itensFinais: ConciliaItem[] | null = itens && itens.map((it, i) => {
    if (!(i in editados)) return it;
    const v = parseBRL(editados[i]);
    return v === null ? it : { ...it, valor: v, status: "OK", metodo: "Digitado na web" };
  });
  const invalidos = Object.values(editados).some((t) => t.trim() !== "" && parseBRL(t) === null);
  /** Totais líquidos de PIS/COFINS, como na planilha oficial (os itens ficam com o valor bruto da nota). */
  const soma = (cat: string) =>
    (itensFinais ?? []).filter((i) => i.categoria === cat).reduce((s, i) => s + i.valor, 0) * FATOR_PIS_COFINS;
  const totalRec = soma("Receita");
  const totalTop = (itensFinais ?? []).filter(ehTop).reduce((s, i) => s + i.valor, 0) * FATOR_PIS_COFINS;
  const totalDesp = soma("Despesa");
  const rp = totalDesp - totalRec;
  const pendentes = (itensFinais ?? []).filter((i) => i.status !== "OK" && i.status !== JA_NO_RET).length;

  const processar = async () => {
    setErro(null);
    setSucesso(null);
    setOcupado("processar");
    try {
      const r = await processarConcilia(receitas?.arquivos ?? [], despesas?.arquivos ?? []);
      setItens(r.itens);
      setOcrDisponivel(r.ocr_disponivel);
      setEditados({});
    } catch (e) {
      setErro(mensagemDeErro(e, "Não foi possível ler os PDFs das notas de penalidade."));
    } finally {
      setOcupado(null);
    }
  };

  const salvar = async () => {
    if (!itensFinais) return;
    setErro(null);
    setSucesso(null);
    setOcupado("salvar");
    try {
      const r = await salvarConcilia(periodo, itensFinais);
      setSucesso(`RP de ${periodo} salvo: ${brl(r.rp)} (${r.qtd_itens} PDFs).`);
      getHistoricoConcilia().then(setHistorico);
    } catch (e) {
      setErro(mensagemDeErro(e, "Não foi possível salvar o RP."));
    } finally {
      setOcupado(null);
    }
  };

  const relatorio = async () => {
    if (!itensFinais) return;
    setOcupado("relatorio");
    try {
      salvarArquivo(await baixarRelatorioConcilia(periodo, itensFinais), `Conciliacao_${periodo.replace("/", "-")}.xlsx`);
    } catch (e) {
      setErro(mensagemDeErro(e, "Não foi possível gerar o relatório da Conciliação."));
    } finally {
      setOcupado(null);
    }
  };

  const escolher = (setter: (p: Pasta) => void) => (lista: FileList) => {
    setter(lerPasta(lista, ["pdf", "zip"]));
    setItens(null);
  };

  return (
    <div className="px-4 py-6 sm:px-8 lg:px-10 lg:py-8">
      <div className="mx-auto flex max-w-[1400px] flex-col gap-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white sm:text-[1.75rem]">{tituloDe("RP")}</h1>
          <p className="mt-1 text-sm text-zinc-400">Penalidades: RP = (Σ despesas − Σ receitas) × (1 − 9,25% PIS/COFINS) (linha “Saldo de penalidade” da planilha oficial)</p>
        </div>

        {erro && <Alert variant="error">{erro}</Alert>}
        {sucesso && <Alert variant="success">{sucesso}</Alert>}

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
          <section className={`${PANEL} flex flex-col gap-4 p-5 sm:p-6 xl:col-span-5`}>
            <div>
              <h2 className="text-base font-semibold text-white">Notas de penalidade</h2>
              <p className="mt-0.5 text-sm text-zinc-400">PDFs (e ZIPs com PDFs). TOP não recuperável conta como receita, mesmo na pasta de despesas. Subpastas “Substituídos” ficam de fora.</p>
            </div>
            <div>
              <p className={`${LABEL} mb-2 text-emerald-300`}>Receitas</p>
              <SeletorPasta desabilitado={ocupado !== null} onEscolher={escolher(setReceitas)}
                titulo={receitas ? receitas.raiz : "Escolher pasta de receitas"}
                detalhe={receitas ? `${receitas.arquivos.length} arquivos` : "Opcional"} />
            </div>
            <div>
              <p className={`${LABEL} mb-2 text-red-300`}>Despesas</p>
              <SeletorPasta desabilitado={ocupado !== null} onEscolher={escolher(setDespesas)}
                titulo={despesas ? despesas.raiz : "Escolher pasta de despesas"}
                detalhe={despesas ? `${despesas.arquivos.length} arquivos` : "Opcional"} />
            </div>
            <button type="button" onClick={processar}
              disabled={!(receitas?.arquivos.length || despesas?.arquivos.length) || ocupado !== null}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-sky-600 py-3 text-sm font-semibold text-white shadow-[0_4px_14px_-4px_rgba(14,165,233,0.5)] transition-colors hover:bg-sky-500 disabled:opacity-50">
              {ocupado === "processar" ? <Loader2 size={16} className="animate-spin" /> : <Play size={16} />}
              {ocupado === "processar" ? "Lendo PDFs…" : "Processar e conciliar"}
            </button>
          </section>

          <div className="flex flex-col gap-6 xl:col-span-7">
            <section className={`${PANEL} p-5 sm:p-6`}>
              <SeletorMes mes={mes} ano={ano} onChange={(m, a) => { setMes(m); setAno(a); }} />
            </section>
            <section className={`${PANEL} p-5 sm:p-6`}>
              {!itensFinais ? (
                <p className="py-6 text-center text-sm text-zinc-500">Escolha as pastas e clique em Processar.</p>
              ) : (
                <>
                  <dl className="grid grid-cols-3 gap-3 text-center">
                    {[
                      ["Receitas", totalRec, "text-emerald-300"],
                      ["Despesas", totalDesp, "text-red-300"],
                      ["RP (desp. − rec.)", rp, rp < 0 ? "text-red-300" : "text-sky-300"],
                    ].map(([r, v, c]) => (
                      <div key={r as string} className="rounded-xl border border-white/[0.05] bg-white/[0.015] py-3">
                        <dt className="text-xs text-zinc-400">{r as string}</dt>
                        <dd className={`mt-1 text-lg font-bold tabular-nums ${c}`}>{brl(v as number)}</dd>
                        {r === "Receitas" && (
                          <dd className="mt-1 text-[0.7rem] tabular-nums text-zinc-500">
                            PFP {brl(totalRec - totalTop)} · TOP {brl(totalTop)}
                          </dd>
                        )}
                      </div>
                    ))}
                  </dl>
                  <div className="mt-3">
                    <AvisoPdfNaoLido
                      quantidade={pendentes}
                      ocrDisponivel={ocrDisponivel}
                      oQueFazer="Por enquanto cada um conta R$ 0,00: digite o valor nos campos amarelos da tabela abaixo (o total se atualiza na hora) ou confira o arquivo."
                    />
                  </div>
                  <div className="mt-4 flex flex-wrap justify-end gap-2">
                    <button type="button" onClick={relatorio} disabled={ocupado !== null || invalidos} className={BOTAO_SEC}>
                      {ocupado === "relatorio" ? <Loader2 size={15} className="animate-spin" /> : <Download size={15} />} Relatório Excel
                    </button>
                    <button type="button" onClick={salvar} disabled={ocupado !== null || invalidos || !anoValido(ano)}
                      className="flex items-center gap-2 rounded-xl bg-sky-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-sky-500 disabled:opacity-40">
                      {ocupado === "salvar" ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />} Salvar RP de {periodo}
                    </button>
                  </div>
                </>
              )}
            </section>
          </div>
        </div>

        {itens && (
          <section className={`${PANEL} overflow-hidden`}>
            <div className="border-b border-white/[0.07] px-5 py-4 sm:px-6">
              <h2 className="text-base font-semibold text-white">PDFs ({itens.length})</h2>
              <p className="mt-0.5 text-sm text-zinc-400">Valor bruto de cada nota. Os totais acima já descontam PIS/COFINS.</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[52rem] text-sm">
                <thead className="bg-white/[0.03] text-[0.7rem] uppercase tracking-[0.08em] text-zinc-400">
                  <tr>
                    {["Categoria", "Arquivo", "Status", "Valor", "Leitura"].map((h) => (
                      <th key={h} className={`px-4 py-3 font-semibold ${h === "Valor" ? "text-right" : "text-left"}`}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.05]">
                  {itens.map((it, i) => {
                    const falhou = it.status !== "OK" && it.status !== JA_NO_RET;
                    const texto = editados[i];
                    const invalido = texto !== undefined && texto.trim() !== "" && parseBRL(texto) === null;
                    return (
                      <tr key={`${it.caminho}-${i}`} className={falhou && texto === undefined ? "bg-amber-500/[0.05]" : ""}>
                        <td className={`px-4 py-2 font-medium ${it.categoria === "Receita" ? "text-emerald-300" : "text-red-300"}`}>
                          {it.categoria}{ehTop(it) && <span className="ml-1.5 rounded-full border border-emerald-500/30 px-1.5 py-0.5 text-[0.65rem] font-semibold">TOP</span>}
                        </td>
                        <td className="max-w-[22rem] truncate px-4 py-2 text-zinc-200" title={it.caminho}>{it.arquivo}</td>
                        <td className="px-4 py-2 text-xs">
                          <span className={falhou ? "text-amber-300" : "text-zinc-500"}>{texto !== undefined ? "digitado" : it.status === JA_NO_RET ? "já no RET" : it.status}</span>
                        </td>
                        <td className="px-4 py-2 text-right">
                          {falhou ? (
                            <input
                              aria-label={`Valor de ${it.arquivo}`} inputMode="decimal" placeholder="0,00"
                              value={texto ?? (it.valor ? brlEntrada(it.valor) : "")}
                              onChange={(e) => setEditados({ ...editados, [i]: e.target.value })}
                              aria-invalid={invalido}
                              className={`w-36 rounded-lg border bg-white/[0.03] px-2.5 py-1.5 text-right text-sm tabular-nums text-zinc-100 focus:border-transparent focus:outline-none focus:ring-1 focus:ring-sky-500/50 ${invalido ? "border-red-500/50" : "border-amber-500/30"}`}
                            />
                          ) : (
                            <span className={`font-semibold tabular-nums ${it.valor < 0 ? "text-red-300" : "text-zinc-100"}`}>{brl(it.valor)}</span>
                          )}
                        </td>
                        <td className="max-w-[16rem] truncate px-4 py-2 text-xs text-zinc-500" title={it.metodo}>{it.metodo}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>
        )}

        <section className={`${PANEL} overflow-hidden`}>
          <div className="border-b border-white/[0.07] px-5 py-4 sm:px-6">
            <h2 className="text-base font-semibold text-white">RP gravado</h2>
            <p className="mt-0.5 text-sm text-zinc-400">Quando o RP gravado difere do calculado pelos PDFs gravados, a linha fica destacada.</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[44rem] text-sm">
              <thead className="bg-white/[0.03] text-[0.7rem] uppercase tracking-[0.08em] text-zinc-400">
                <tr>
                  {["Período", "PDFs", "Receitas", "Despesas", "RP dos PDFs", "RP gravado"].map((h, i) => (
                    <th key={h} className={`px-4 py-3 font-semibold ${i ? "text-right" : "text-left"}`}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.05]">
                {historico.map((h) => {
                  const diverge = Math.abs(h.rp_dos_itens - h.rp_gravado) > 0.01;
                  return (
                    <tr key={h.periodo} className={diverge ? "bg-amber-500/[0.05]" : ""}>
                      <td className="px-4 py-2.5 font-medium text-zinc-200">{h.periodo}{!h.periodo_valido && <span className="ml-2 rounded-full border border-red-500/30 bg-red-500/10 px-1.5 py-0.5 text-[0.65rem] font-semibold text-red-300" title="Período gravado com nome inválido: corrija ou apague no banco">inválido</span>}</td>
                      <td className="px-4 py-2.5 text-right tabular-nums text-zinc-400">{h.qtd_itens}</td>
                      <td className="px-4 py-2.5 text-right tabular-nums text-zinc-300">{brl(h.total_receitas)}</td>
                      <td className="px-4 py-2.5 text-right tabular-nums text-zinc-300">{brl(h.total_despesas)}</td>
                      <td className="px-4 py-2.5 text-right tabular-nums text-zinc-300">{brl(h.rp_dos_itens)}</td>
                      <td className={`px-4 py-2.5 text-right font-semibold tabular-nums ${diverge ? "text-amber-300" : "text-zinc-100"}`}>{brl(h.rp_gravado)}</td>
                    </tr>
                  );
                })}
                {historico.length === 0 && <tr><td colSpan={6} className="px-4 py-8 text-center text-zinc-500">Nenhum RP gravado.</td></tr>}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
}
