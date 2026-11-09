/** "Prova real" do PV de um trimestre fiscal: a conta do PV gravado (PMPV + PR) e se ele ainda
 * bate com o PMPV e o PR que os módulos dão hoje. Só lê: quem refaz as contas é o backend
 * (GET /pv/prova-real). A busca fica na página (useProvaRealDoMes). */
import type { Ref } from "react";
import { Card } from "@heroui/react";
import { ClipboardCheck, RefreshCw } from "lucide-react";
import { Conferencia } from "../../components/ui/Conferencia";
import { EsqueletoBlocos } from "../../components/ui/EsqueletoBlocos";
import { CARD_PAINEL } from "../../components/ui/estilosCard";
import { Fechamento } from "../../components/ui/Fechamento";
import type { EstadoProva } from "../../components/ui/useProvaRealDoMes";
import { MENOS, brl, dataHora } from "../../utils/format";
import type { ProvaRealPV } from "../../types";

const tarifa = (v: number) => brl(v, 4);
const dif = (v: number) => (v < 0 ? `${MENOS}${tarifa(-v)}` : tarifa(v));

export function ProvaRealPV({ chave, estado, cardRef, onUsarNoFormulario, className = "" }: {
  /** Trimestre aberto, ex.: "Fev - Abr/2026", ou null se nada foi aberto. */
  chave: string | null;
  estado: EstadoProva<ProvaRealPV>;
  /** Para a página rolar até o card ao escolher um trimestre na tabela (telas estreitas). */
  cardRef?: Ref<HTMLElement>;
  /** Leva este trimestre para o formulário de cima (recarrega do banco: a página avisa o que isso faz). */
  onUsarNoFormulario?: () => void;
  className?: string;
}) {
  const { dados: d, erro, carregando, atualizando } = estado;

  return (
    <Card<"section"> render={(props) => <section {...props} />} ref={cardRef}
      aria-labelledby="prova-real-titulo" aria-busy={carregando || atualizando}
      className={`${CARD_PAINEL} scroll-mt-6 ${className}`}>
      <Card.Header className="flex-row flex-wrap items-start justify-between gap-2">
        <div>
          <Card.Title<"h2"> render={(props) => <h2 {...props} />} id="prova-real-titulo"
            className="flex items-center gap-2 text-base font-semibold text-white">
            <ClipboardCheck size={16} className="text-emerald-300" aria-hidden /> Prova real{chave && <> · {chave}</>}
          </Card.Title>
          {d && d.tem_salvo && !erro && d.data_atualizacao && (
            <Card.Description className="mt-0.5 text-xs text-zinc-500">gravado em {dataHora(d.data_atualizacao)}</Card.Description>
          )}
        </div>
        {d && d.tem_salvo && !erro && (
          <Conferencia confere={d.confere}
            className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${d.confere ? "bg-emerald-400/10" : "bg-red-400/10"}`}>
            {d.confere ? "Confere com os módulos" : "Não confere"}
          </Conferencia>
        )}
      </Card.Header>

      {/* Ao trocar de trimestre, o conteúdo do anterior fica esmaecido até chegar o novo (não pisca). */}
      <Card.Content className={`gap-0 transition-opacity ${atualizando ? "opacity-50" : ""}`}>
        {!chave && <p className="mt-6 text-sm text-zinc-500">Nenhum trimestre gravado ainda. Salve o PV de um trimestre acima.</p>}
        {chave && erro && <p role="alert" className="mt-4 text-sm text-red-300">{erro}</p>}
        {carregando && <EsqueletoBlocos blocos={["h-36", "h-32"]} texto="Montando a prova real…" />}

        {d && !erro && !d.tem_salvo && (
          <p className="mt-4 text-sm text-amber-200">
            Este trimestre ainda não tem PV gravado. O que os módulos dão hoje é PV {tarifa(d.pv_atual)}
            {" "}(PMPV {tarifa(d.pmpv_atual)} + PR {tarifa(d.pr_atual)}). Salve o PV do trimestre para gravá-lo.
          </p>
        )}

        {d && !erro && d.tem_salvo && (
          <div className="mt-4 space-y-4">
            <Fechamento titulo="1. A conta do PV gravado (R$/m³)"
              linhas={[
                { rotulo: "PMPV gravado", valor: d.pmpv_gravado === null ? "—" : tarifa(d.pmpv_gravado) },
                { rotulo: "(+) PR gravado", valor: d.pr_gravado === null ? "—" : tarifa(d.pr_gravado) },
                { rotulo: "= PV da soma", valor: d.pv_da_soma === null ? "—" : tarifa(d.pv_da_soma), tipo: "total" },
                { rotulo: "PV gravado", valor: d.pv_gravado === null ? "—" : tarifa(d.pv_gravado) },
              ]}
              resultado={d.diferenca_conta !== null ? {
                rotulo: "Diferença da conta", confere: d.conta_confere,
                texto: d.conta_confere ? "confere" : <>não confere: {dif(d.diferenca_conta)}</>,
              } : undefined} />

            {/* O gravado ao lado do que os módulos PMPV e PR dão hoje. */}
            <div>
              <h3 className="text-[0.7rem] font-semibold uppercase tracking-wide text-zinc-400">2. Ainda bate com os módulos hoje?</h3>
              <div className="mt-2 overflow-x-auto rounded-lg border border-white/[0.07] bg-white/[0.02]">
                <table className="w-full min-w-[28rem] text-sm tabular-nums">
                  <caption className="sr-only">PMPV, PR e PV gravados ao lado dos valores atuais dos módulos</caption>
                  <thead className="text-[0.7rem] text-zinc-400">
                    <tr className="border-b border-white/[0.07]">
                      <th scope="col" className="px-4 py-2 text-left font-semibold">Valor</th>
                      <th scope="col" className="px-4 py-2 text-right font-semibold">Gravado no PV</th>
                      <th scope="col" className="px-4 py-2 text-right font-semibold">Hoje nos módulos</th>
                      <th scope="col" className="px-4 py-2 text-right font-semibold">Situação</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.05]">
                    <LinhaAtual rotulo="PMPV" gravado={d.pmpv_gravado} atual={d.pmpv_atual} confere={d.pmpv_confere} />
                    <LinhaAtual rotulo="PR" gravado={d.pr_gravado} atual={d.pr_atual} confere={d.pr_confere} />
                    <tr>
                      <th scope="row" className="px-4 py-2 text-left font-semibold text-zinc-200">PV</th>
                      <td className="px-4 py-2 text-right text-zinc-200">{d.pv_gravado === null ? "—" : tarifa(d.pv_gravado)}</td>
                      <td className="px-4 py-2 text-right text-zinc-200">{tarifa(d.pv_atual)}</td>
                      <td className="px-4 py-2 text-right text-zinc-500">PMPV + PR</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {(!d.pmpv_confere || !d.pr_confere) && (
              <div className="rounded-lg border border-amber-400/30 bg-amber-400/[0.06] px-4 py-3 text-sm text-amber-200">
                O PV gravado ficou velho: {[!d.pmpv_confere && "o PMPV", !d.pr_confere && "o PR"].filter(Boolean).join(" e ")} mudou
                depois que ele foi salvo. Salve o PV de novo para atualizá-lo.
              </div>
            )}

            {d.avisos.length > 0 && (
              <ul className="list-disc space-y-0.5 pl-4 text-xs text-amber-200">
                {d.avisos.map((a, i) => <li key={i}>{a}</li>)}
              </ul>
            )}
          </div>
        )}

        {/* Avisos também quando não há PV gravado (o back explica o que falta). */}
        {d && !erro && !d.tem_salvo && d.avisos.length > 0 && (
          <ul className="mt-3 list-disc space-y-0.5 pl-4 text-xs text-amber-200">
            {d.avisos.map((a, i) => <li key={i}>{a}</li>)}
          </ul>
        )}
      </Card.Content>

      {chave && onUsarNoFormulario && (
        <Card.Footer className="mt-auto pt-4">
          <button type="button" onClick={onUsarNoFormulario}
            className="inline-flex items-center gap-1.5 rounded text-xs font-semibold text-sky-300 hover:text-sky-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-400">
            <RefreshCw size={13} aria-hidden /> Carregar {chave} no formulário (recarrega do banco)
          </button>
        </Card.Footer>
      )}
    </Card>
  );
}

function LinhaAtual({ rotulo, gravado, atual, confere }: { rotulo: string; gravado: number | null; atual: number; confere: boolean }) {
  return (
    <tr>
      <th scope="row" className="px-4 py-2 text-left font-semibold text-zinc-200">{rotulo}</th>
      <td className="px-4 py-2 text-right text-zinc-300">{gravado === null ? "—" : tarifa(gravado)}</td>
      <td className="px-4 py-2 text-right text-zinc-300">{tarifa(atual)}</td>
      <td className="px-4 py-2 text-right">
        <Conferencia confere={confere}>{confere ? "igual" : "mudou"}</Conferencia>
      </td>
    </tr>
  );
}
