import { useEffect, useState } from "react";
import { Loader2, Play, Save } from "lucide-react";
import { Alert } from "../../components/ui/Alert";
import { SeletorPasta } from "../../components/ui/SeletorPasta";
import { getHistoricoRET, processarRET, salvarRET, type ArquivoDaPasta } from "../../api";
import { mensagemDeErro } from "../../api/client";
import { brl, num } from "../../utils/format";
import { lerPasta } from "../../utils/pasta";
import type { RETHistoricoLinha, RETResultado } from "../../types";

const PANEL = "rounded-2xl border border-white/[0.07] bg-gradient-to-b from-white/[0.025] to-transparent bg-panel";

const COR_TIPO: Record<string, string> = {
  EAT: "border-sky-500/25 bg-sky-500/10 text-sky-300",
  EC: "border-emerald-500/25 bg-emerald-500/10 text-emerald-300",
};

export default function RETPage() {
  const [pasta, setPasta] = useState<{ raiz: string; arquivos: ArquivoDaPasta[] } | null>(null);
  const [resultado, setResultado] = useState<RETResultado | null>(null);
  const [historico, setHistorico] = useState<RETHistoricoLinha[]>([]);
  const [ocupado, setOcupado] = useState<null | "processar" | "salvar">(null);
  const [erro, setErro] = useState<string | null>(null);
  const [sucesso, setSucesso] = useState<string | null>(null);

  useEffect(() => {
    getHistoricoRET().then(setHistorico).catch((e) => setErro(mensagemDeErro(e, "Não foi possível carregar o histórico do RET.")));
  }, []);

  const processar = async () => {
    if (!pasta) return;
    setErro(null);
    setSucesso(null);
    setOcupado("processar");
    try {
      setResultado(await processarRET(pasta.arquivos, pasta.raiz));
    } catch (e) {
      setErro(mensagemDeErro(e, "Não foi possível ler os PDFs de encargos de transporte."));
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
      const salvos = await salvarRET(resultado.documentos, resultado.periodo_detectado);
      setSucesso(`RET salvo: ${salvos.map((s) => `${s.periodo} ${brl(s.ret)}`).join(" · ")}.`);
      getHistoricoRET().then(setHistorico);
    } catch (e) {
      setErro(mensagemDeErro(e, "Não foi possível salvar o RET."));
    } finally {
      setOcupado(null);
    }
  };

  const semMes = resultado?.meses.some((m) => !/^[A-Z][a-z]{2}\/\d{4}$/.test(m.periodo));
  const semValor = resultado?.documentos.filter((d) => !d.valor_total) ?? [];
  const pct = resultado ? num(resultado.pis_cofins_rate * 100, 2) : "9,25";

  return (
    <div className="px-4 py-6 sm:px-8 lg:px-10 lg:py-8">
      <div className="mx-auto flex max-w-[1400px] flex-col gap-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white sm:text-[1.75rem]">RET</h1>
          <p className="mt-1 text-sm text-zinc-400">
            Encargos de transporte, por mês: RET = Σ EAT × (1 − {pct}% PIS/COFINS) + Σ EC
          </p>
        </div>

        {erro && <Alert variant="error">{erro}</Alert>}
        {sucesso && <Alert variant="success">{sucesso}</Alert>}

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
          <section className={`${PANEL} flex flex-col gap-4 p-5 sm:p-6 xl:col-span-4`}>
            <div>
              <h2 className="text-base font-semibold text-white">PDFs de encargos</h2>
              <p className="mt-0.5 text-sm text-zinc-400">
                Escolha a pasta do RET (pode ser a do trimestre). O tipo vem das pastas “EAT” e “EC”; o mês, do nome das pastas (ex.: “EAT fev26”).
              </p>
            </div>
            <SeletorPasta
              desabilitado={ocupado !== null}
              titulo={pasta ? `Pasta: ${pasta.raiz}` : "Escolher pasta"}
              detalhe={pasta ? `${pasta.arquivos.length} PDFs` : "Pastas “Notas Fiscais” e notas fiscais avulsas são ignoradas"}
              onEscolher={(lista) => {
                const p = lerPasta(lista, ["pdf"]);
                setPasta(p);
                setResultado(null);
                setErro(p.arquivos.length ? null : "Nenhum PDF nesta pasta.");
              }}
            />
            <button type="button" onClick={processar} disabled={!pasta?.arquivos.length || ocupado !== null}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-sky-600 py-3 text-sm font-semibold text-white shadow-[0_4px_14px_-4px_rgba(14,165,233,0.5)] transition-colors hover:bg-sky-500 disabled:opacity-50">
              {ocupado === "processar" ? <Loader2 size={16} className="animate-spin" /> : <Play size={16} />}
              {ocupado === "processar" ? `Lendo ${pasta?.arquivos.length} PDFs…` : "Processar PDFs"}
            </button>
          </section>

          <section className={`${PANEL} overflow-hidden xl:col-span-8`}>
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.07] px-5 py-4 sm:px-6">
              <div>
                <h2 className="text-base font-semibold text-white">RET por mês</h2>
                {resultado && (
                  <p className="mt-0.5 text-sm text-zinc-400">
                    {resultado.qtd_lidos} PDFs lidos · {resultado.qtd_ignorados} ignorados (notas fiscais)
                  </p>
                )}
              </div>
              {resultado && (
                <button type="button" onClick={salvar} disabled={ocupado !== null || semMes}
                  title={semMes ? "Há documentos sem mês no caminho" : undefined}
                  className="flex items-center gap-2 rounded-xl bg-sky-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-sky-500 disabled:opacity-40">
                  {ocupado === "salvar" ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
                  Salvar {resultado.meses.length > 1 ? `os ${resultado.meses.length} meses` : resultado.meses[0]?.periodo}
                </button>
              )}
            </div>
            {!resultado ? (
              <p className="px-6 py-10 text-center text-sm text-zinc-500">Escolha a pasta e clique em Processar.</p>
            ) : (
              <>
                {resultado.meses.length > 1 && (
                  <p className="border-b border-white/[0.05] bg-sky-500/[0.05] px-5 py-2.5 text-sm text-sky-200 sm:px-6">
                    A pasta tem {resultado.meses.length} meses: cada um é salvo com o seu RET.
                  </p>
                )}
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[40rem] text-sm">
                    <thead className="bg-white/[0.03] text-[0.7rem] uppercase tracking-[0.08em] text-zinc-400">
                      <tr>
                        {["Mês", "Documentos", "Σ EAT (bruto)", "Σ EC", "RET"].map((h, i) => (
                          <th key={h} className={`px-5 py-3 font-semibold ${i ? "text-right" : "text-left"}`}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/[0.05]">
                      {resultado.meses.map((m) => (
                        <tr key={m.periodo}>
                          <td className="px-5 py-3 font-medium text-zinc-200">
                            {m.periodo}
                            {m.qtd_outros > 0 && <span className="ml-2 text-xs text-zinc-500">{m.qtd_outros} fora de EAT/EC</span>}
                          </td>
                          <td className="px-5 py-3 text-right tabular-nums text-zinc-400">{m.qtd_documentos}</td>
                          <td className="px-5 py-3 text-right tabular-nums text-zinc-300">{brl(m.eat_bruto)}</td>
                          <td className="px-5 py-3 text-right tabular-nums text-zinc-300">{brl(m.ec_docs_total)}</td>
                          <td className="px-5 py-3 text-right text-base font-bold tabular-nums text-emerald-300">{brl(m.ret)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {semMes && (
                  <p className="border-t border-white/[0.05] px-5 py-3 text-sm text-amber-300 sm:px-6">
                    Alguns PDFs estão em pastas sem mês no nome. Renomeie a pasta (ex.: “EAT mar26”) e processe de novo.
                  </p>
                )}
              </>
            )}
          </section>
        </div>

        {resultado && (
          <section className={`${PANEL} overflow-hidden`}>
            <div className="border-b border-white/[0.07] px-5 py-4 sm:px-6">
              <h2 className="text-base font-semibold text-white">Documentos ({resultado.documentos.length})</h2>
              {semValor.length > 0 && (
                <p className="mt-0.5 text-sm text-amber-300">{semValor.length} PDF(s) sem valor extraído: confira se são realmente de encargos.</p>
              )}
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[56rem] text-sm">
                <thead className="bg-white/[0.03] text-[0.7rem] uppercase tracking-[0.08em] text-zinc-400">
                  <tr>
                    {["Mês", "Tipo", "Empresa", "Nota", "Nº", "Vencimento", "Valor", "Arquivo"].map((h) => (
                      <th key={h} className={`px-4 py-3 font-semibold ${h === "Valor" ? "text-right" : "text-left"}`}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.05]">
                  {resultado.documentos.map((d, i) => (
                    <tr key={`${d.caminho}-${i}`} className={!d.valor_total ? "bg-amber-500/[0.04]" : ""}>
                      <td className="px-4 py-2 text-zinc-400">{d.mes_ref || "—"}</td>
                      <td className="px-4 py-2">
                        <span className={`rounded-full border px-2 py-0.5 text-[0.7rem] font-semibold ${COR_TIPO[d.tipo_encargo] ?? "border-white/[0.1] bg-white/[0.04] text-zinc-400"}`}>
                          {d.tipo_encargo}
                        </span>
                      </td>
                      <td className="px-4 py-2 text-zinc-300">{d.empresa}</td>
                      <td className="px-4 py-2 text-zinc-400">{d.nota_tipo}</td>
                      <td className="px-4 py-2 font-mono text-xs text-zinc-300">{d.numero_nd}</td>
                      <td className="px-4 py-2 tabular-nums text-zinc-400">{d.data_vencimento}</td>
                      <td className="px-4 py-2 text-right font-semibold tabular-nums text-zinc-100">{d.valor_total ? brl(d.valor_total) : "sem valor"}</td>
                      <td className="max-w-[16rem] truncate px-4 py-2 text-xs text-zinc-500" title={d.caminho}>{d.arquivo}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        <section className={`${PANEL} overflow-hidden`}>
          <div className="border-b border-white/[0.07] px-5 py-4 sm:px-6">
            <h2 className="text-base font-semibold text-white">RET gravado</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[32rem] text-sm">
              <thead className="bg-white/[0.03] text-[0.7rem] uppercase tracking-[0.08em] text-zinc-400">
                <tr>
                  {["Período", "Documentos", "RET gravado", "Atualizado"].map((h, i) => (
                    <th key={h} className={`px-4 py-3 font-semibold ${i ? "text-right" : "text-left"}`}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.05]">
                {historico.map((h) => (
                  <tr key={h.periodo}>
                    <td className="px-4 py-2.5 font-medium text-zinc-200">{h.periodo}{!h.periodo_valido && <span className="ml-2 rounded-full border border-red-500/30 bg-red-500/10 px-1.5 py-0.5 text-[0.65rem] font-semibold text-red-300" title="Período gravado com nome inválido: corrija ou apague no banco">inválido</span>}</td>
                    <td className="px-4 py-2.5 text-right tabular-nums text-zinc-300">{h.qtd_documentos}</td>
                    <td className="px-4 py-2.5 text-right font-semibold tabular-nums text-zinc-100">{brl(h.ret_gravado)}</td>
                    <td className="px-4 py-2.5 text-right tabular-nums text-zinc-500">{h.data_atualizacao}</td>
                  </tr>
                ))}
                {historico.length === 0 && <tr><td colSpan={4} className="px-4 py-8 text-center text-zinc-500">Nenhum RET gravado.</td></tr>}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
}
