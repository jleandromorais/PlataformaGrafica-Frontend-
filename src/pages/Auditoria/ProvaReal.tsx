/** "Prova real" do CGR de um mês: a conta aberta com os números gravados, por empresa,
 * e o selo "confere" quando a soma das notas bate com o CGR gravado. Só lê: nada aqui
 * calcula o CGR, quem refaz a soma é o backend. A busca fica na página (useProvaReal). */
import type { Ref } from "react";
import { Link } from "react-router-dom";
import { Card } from "@heroui/react";
import { ArrowUpRight, ClipboardCheck } from "lucide-react";
import { Conferencia } from "../../components/ui/Conferencia";
import { CARD_PAINEL } from "../../components/ui/estilosCard";
import { Skeleton } from "../../components/ui/Skeleton";
import { brl, dataHora, num } from "../../utils/format";
import { contabil, participacao, textoParticipacao } from "./formatoProva";
import type { EstadoProvaReal } from "./useProvaReal";

export function ProvaReal({ periodo, estado, cardRef, className = "" }: {
  periodo: string | null;
  estado: EstadoProvaReal;
  /** Para a página rolar até o card ao escolher um mês na tabela (telas estreitas). */
  cardRef?: Ref<HTMLElement>;
  className?: string;
}) {
  const { dados: d, erro, carregando, atualizando } = estado;
  // A coluna "Devoluções" só aparece se alguma empresa teve devolução no mês (senão seria toda "—").
  const temDevolucoes = !!d && d.por_empresa.some((e) => e.devolucoes);
  // Da maior para a menor participação no CGR (só a ordem de exibição muda).
  const empresas = d ? [...d.por_empresa].sort((a, b) => b.cgr - a.cgr) : [];

  return (
    <Card<"section"> render={(props) => <section {...props} />} ref={cardRef}
      aria-labelledby="prova-real-titulo" aria-busy={carregando || atualizando}
      className={`${CARD_PAINEL} scroll-mt-6 ${className}`}>
      <Card.Header>
        <Card.Title<"h2"> render={(props) => <h2 {...props} />} id="prova-real-titulo"
          className="flex items-center gap-2 text-base font-semibold text-white">
          <ClipboardCheck size={16} className="text-emerald-300" aria-hidden /> Prova real{periodo && <> · {periodo}</>}
        </Card.Title>
        {d && d.qtd_notas > 0 && !erro && (
          <Card.Description className="mt-0.5 text-xs text-zinc-500">
            {num(d.qtd_notas)} notas gravadas{d.data_atualizacao && <> · gravado em {dataHora(d.data_atualizacao)}</>}
          </Card.Description>
        )}
      </Card.Header>

      {/* Ao trocar de mês, o conteúdo do mês anterior fica esmaecido até chegar o novo (não pisca). */}
      <Card.Content className={`gap-0 transition-opacity ${atualizando ? "opacity-50" : ""}`}>
        {!periodo && <p className="mt-6 text-sm text-zinc-500">Nenhum mês auditado ainda. Audite um mês no Painel do Ciclo.</p>}
        {periodo && erro && <p role="alert" className="mt-4 text-sm text-red-300">{erro}</p>}
        {carregando && <EsqueletoProva />}

        {d && !erro && d.qtd_notas === 0 && (
          <p className="mt-4 text-sm text-amber-200">
            {d.cgr_gravado !== null
              ? <>{d.periodo} tem o CGR gravado ({brl(d.cgr_gravado)}), mas sem as notas: foi gravado só com o total. Sem as notas não dá para abrir a conta.</>
              : <>{d.periodo} ainda não foi auditado.</>}
            {" "}Audite o mês no Painel do Ciclo para ter a prova real.
          </p>
        )}

        {d && !erro && d.qtd_notas > 0 && (
          <>
            {/* A conta, empresa por empresa, com a fatia de cada uma no CGR do mês. */}
            <div className="mt-4 overflow-x-auto">
              <table className={`w-full text-sm ${temDevolucoes ? "min-w-[40rem]" : "min-w-[34rem]"}`}>
                <caption className="sr-only">CGR de {d.periodo} por empresa, da maior para a menor participação</caption>
                <thead className="text-[0.7rem] text-zinc-400">
                  <tr className="border-b border-white/[0.07]">
                    <th scope="col" className="py-2 pr-3 text-left font-semibold">Empresa</th>
                    <th scope="col" className="w-[30%] py-2 pr-3 text-left font-semibold">Participação no CGR</th>
                    <th scope="col" className="py-2 pl-3 text-right font-semibold">Compras</th>
                    {temDevolucoes && <th scope="col" className="py-2 pl-3 text-right font-semibold">Devoluções</th>}
                    <th scope="col" className="py-2 pl-3 text-right font-semibold">CGR</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.05] tabular-nums">
                  {empresas.map((e) => {
                    const fatia = participacao(e.cgr, d);
                    return (
                      <tr key={e.empresa}>
                        <th scope="row" className="py-2.5 pr-3 text-left font-normal">
                          <span className="block font-medium text-zinc-100">{e.empresa}</span>
                          <span className="block text-xs text-zinc-500">
                            {num(e.qtd_nfe)} NF-e{e.qtd_cte ? ` · ${num(e.qtd_cte)} CT-e` : ""}
                            {e.frete_fora_do_cgr > 0 && ` · frete fora ${brl(e.frete_fora_do_cgr)}`}
                          </span>
                        </th>
                        <td className="py-2.5 pr-3">
                          {/* Barra simples: o % também vai em texto, a barra é só apoio visual. */}
                          <div className="flex items-center gap-2">
                            <div aria-hidden className="h-2 flex-1 overflow-hidden rounded-full bg-white/[0.06]">
                              <div className="h-full rounded-full bg-sky-400" style={{ width: `${Math.min(100, fatia * 100)}%` }} />
                            </div>
                            <span className="w-12 text-right text-xs text-zinc-300">{textoParticipacao(fatia)}</span>
                          </div>
                        </td>
                        <td className="py-2.5 pl-3 text-right text-zinc-300">{brl(e.compras)}</td>
                        {temDevolucoes && <td className={`py-2.5 pl-3 text-right ${e.devolucoes ? "text-red-300" : "text-zinc-600"}`}>{e.devolucoes ? contabil(e.devolucoes) : "—"}</td>}
                        <td className="py-2.5 pl-3 text-right font-semibold text-zinc-100">{contabil(e.cgr)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* O fechamento: a soma das partes contra o valor gravado. A "Diferença" é o resultado
                da tela, então fica numa faixa própria no pé do bloco, com ícone + texto (não só cor). */}
            <div className="mt-4 overflow-hidden rounded-lg border border-white/[0.07] bg-white/[0.02] text-sm tabular-nums">
              <dl className="space-y-1.5 px-4 py-3">
                <div className="flex justify-between gap-4"><dt className="text-zinc-400">Σ compras sem tributos</dt><dd className="text-zinc-200">{brl(d.compras)}</dd></div>
                <div className="flex justify-between gap-4"><dt className="text-zinc-400">− devoluções</dt><dd className={d.devolucoes ? "text-red-300" : "text-zinc-500"}>{contabil(d.devolucoes)}</dd></div>
                <div className="flex justify-between gap-4 border-t border-white/[0.08] pt-1.5">
                  <dt className="font-semibold text-zinc-200">= CGR das notas</dt><dd className="font-semibold text-sky-200">{contabil(d.cgr_das_notas)}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-zinc-400">CGR gravado</dt>
                  <dd className="text-zinc-200">{d.cgr_gravado === null ? "—" : contabil(d.cgr_gravado)}</dd>
                </div>
              </dl>
              {d.diferenca !== null && (
                <dl className={`flex items-center justify-between gap-4 border-t px-4 py-3 ${d.confere
                  ? "border-emerald-400/20 bg-emerald-400/[0.06]"
                  : "border-red-400/30 bg-red-400/[0.08]"}`}>
                  <dt className="font-semibold text-zinc-100">Diferença</dt>
                  <dd>
                    <Conferencia confere={d.confere} className="text-base font-semibold">
                      {d.confere ? "confere" : <>não confere: {contabil(d.diferenca)}</>}
                    </Conferencia>
                  </dd>
                </dl>
              )}
            </div>

            {d.frete_fora_do_cgr > 0 && (
              <p className="mt-2 text-xs text-zinc-500">Frete de outras transportadoras ({brl(d.frete_fora_do_cgr)}) foi lido, mas não entra no CGR.</p>
            )}
            {!d.confere && (
              <p className="mt-3 text-xs text-amber-200">
                A soma das notas gravadas não bate com o CGR gravado. Isso acontece quando o mês foi gravado com uma regra antiga
                {" "}ou o total foi alterado à mão. Audite o mês de novo no Painel do Ciclo para conferir onde está a diferença.
              </p>
            )}
          </>
        )}
      </Card.Content>

      {periodo && (
        <Card.Footer className="mt-auto pt-4">
          <Link to={`/ciclo?trimestre=${trimestreDe(periodo)}`}
            className="inline-flex items-center gap-1.5 rounded text-xs font-semibold text-sky-300 hover:text-sky-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-400">
            Auditar ou regravar {periodo} no Painel do Ciclo <ArrowUpRight size={13} aria-hidden />
          </Link>
        </Card.Footer>
      )}
    </Card>
  );
}

/** "Ago/2026" → "Jul/2026": o 1º mês do trimestre civil, que é como o Painel do Ciclo abre. */
function trimestreDe(periodo: string) {
  const MESES = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
  const [m, a] = periodo.split("/");
  const i = MESES.indexOf(m);
  return encodeURIComponent(`${MESES[Math.max(0, i - (i % 3))]}/${a}`);
}

function EsqueletoProva() {
  return (
    <div role="status" className="mt-4 space-y-3">
      <span className="sr-only">Montando a prova real…</span>
      {[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-5 w-full" />)}
      <Skeleton className="mt-2 h-24 w-full" />
    </div>
  );
}
