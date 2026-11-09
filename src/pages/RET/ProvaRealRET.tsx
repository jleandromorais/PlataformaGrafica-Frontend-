/** "Prova real" do RET de um mês: a conta aberta (EAT × (1 − PIS/COFINS) + EC) com o RET gravado
 * ao lado, a tabela por empresa e o selo "confere". Só lê: quem refaz a conta é o backend
 * (GET /ret/prova-real). A busca fica na página (useProvaRealDoMes). */
import type { Ref } from "react";
import { Link } from "react-router-dom";
import { Card } from "@heroui/react";
import { ArrowUpRight, ClipboardCheck } from "lucide-react";
import { Conferencia } from "../../components/ui/Conferencia";
import { EsqueletoBlocos } from "../../components/ui/EsqueletoBlocos";
import { CARD_PAINEL } from "../../components/ui/estilosCard";
import { Fechamento } from "../../components/ui/Fechamento";
import type { EstadoProva } from "../../components/ui/useProvaRealDoMes";
import { brl, dataHora, num } from "../../utils/format";
import { contabil } from "../Auditoria/formatoProva";
import type { ProvaRealRET } from "../../types";
import { ORIENTACAO_RET, estadoDaProvaRET, textoForaDoRET } from "./estadoProva";

const COR_TIPO: Record<string, string> = {
  EAT: "border-sky-500/25 bg-sky-500/10 text-sky-300",
  EC: "border-emerald-500/25 bg-emerald-500/10 text-emerald-300",
};

export function ProvaRealRET({ periodo, estado, cardRef, className = "" }: {
  periodo: string | null;
  estado: EstadoProva<ProvaRealRET>;
  /** Para a página rolar até o card ao escolher um mês na tabela (telas estreitas). */
  cardRef?: Ref<HTMLElement>;
  className?: string;
}) {
  const { dados: d, erro, carregando, atualizando } = estado;
  const situacao = d && !erro ? estadoDaProvaRET(d) : null;
  const taxa = d ? `${num(d.pis_cofins_rate * 100, 2)}%` : "";

  return (
    <Card<"section"> render={(props) => <section {...props} />} ref={cardRef}
      aria-labelledby="prova-real-titulo" aria-busy={carregando || atualizando}
      className={`${CARD_PAINEL} scroll-mt-6 ${className}`}>
      <Card.Header className="flex-row flex-wrap items-start justify-between gap-2">
        <div>
          <Card.Title<"h2"> render={(props) => <h2 {...props} />} id="prova-real-titulo"
            className="flex items-center gap-2 text-base font-semibold text-white">
            <ClipboardCheck size={16} className="text-emerald-300" aria-hidden /> Prova real{periodo && <> · {periodo}</>}
          </Card.Title>
          {d && !erro && d.ret_gravado !== null && d.data_atualizacao && (
            <Card.Description className="mt-0.5 text-xs text-zinc-500">gravado em {dataHora(d.data_atualizacao)}</Card.Description>
          )}
        </div>
        {(situacao === "confere" || situacao === "diverge") && (
          <Conferencia confere={situacao === "confere"}
            className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${situacao === "confere" ? "bg-emerald-400/10" : "bg-red-400/10"}`}>
            {situacao === "confere" ? "Confere com o gravado" : "Não confere"}
          </Conferencia>
        )}
      </Card.Header>

      {/* Ao trocar de mês, o conteúdo do mês anterior fica esmaecido até chegar o novo (não pisca). */}
      <Card.Content className={`gap-0 transition-opacity ${atualizando ? "opacity-50" : ""}`}>
        {!periodo && <p className="mt-6 text-sm text-zinc-500">Nenhum mês gravado ainda. Processe o RET de um mês no Painel do Ciclo.</p>}
        {periodo && erro && <p role="alert" className="mt-4 text-sm text-red-300">{erro}</p>}
        {carregando && <EsqueletoBlocos blocos={["h-44", "h-24"]} texto="Montando a prova real…" />}

        {d && situacao && (situacao === "nao_gravado" || situacao === "so_total") && (
          <p className="mt-4 text-sm text-amber-200">
            {situacao === "so_total" && d.ret_gravado !== null && <>O RET gravado de {d.periodo} é <b className="tabular-nums">{brl(d.ret_gravado)}</b>. </>}
            {ORIENTACAO_RET[situacao]}
          </p>
        )}

        {d && !erro && d.tem_itens && d.ret_gravado !== null && (
          <div className="mt-4 space-y-4">
            <Fechamento titulo="A conta do mês"
              linhas={[
                { rotulo: "EAT bruto (soma dos documentos de EAT)", valor: contabil(d.eat_bruto) },
                { rotulo: `(×) 1 − PIS/COFINS de ${taxa}`, valor: num(1 - d.pis_cofins_rate, 4) },
                { rotulo: "= EAT líquido", valor: contabil(d.eat_liquido), tipo: "total" },
                { rotulo: "(+) EC (soma dos documentos de EC)", valor: contabil(d.ec) },
                { rotulo: "= RET calculado", valor: d.ret_calculado === null ? "—" : contabil(d.ret_calculado), tipo: "total" },
                { rotulo: "RET gravado", valor: contabil(d.ret_gravado) },
              ]}
              resultado={d.diferenca !== null ? {
                rotulo: "Diferença", confere: d.confere,
                texto: d.confere ? "confere" : <>não confere: {contabil(d.diferenca)}</>,
              } : undefined} />

            <p className={`text-sm ${situacao === "confere" ? "text-emerald-300" : "text-amber-200"}`}>
              {situacao && ORIENTACAO_RET[situacao]}
            </p>

            {d.por_empresa.length > 0 && (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[30rem] text-sm tabular-nums">
                  <caption className="sr-only">Documentos de {d.periodo} por empresa e por tipo de encargo</caption>
                  <thead className="text-[0.7rem] text-zinc-400">
                    <tr className="border-b border-white/[0.07]">
                      <th scope="col" className="py-2 pr-3 text-left font-semibold">Empresa</th>
                      <th scope="col" className="px-2 py-2 text-left font-semibold">Encargo</th>
                      <th scope="col" className="px-2 py-2 text-right font-semibold">Documentos</th>
                      <th scope="col" className="py-2 pl-2 text-right font-semibold">Valor</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.05]">
                    {d.por_empresa.map((e) => (
                      <tr key={`${e.empresa}-${e.tipo_encargo}`}>
                        <th scope="row" className="py-2 pr-3 text-left font-medium text-zinc-100">{e.empresa}</th>
                        <td className="px-2 py-2">
                          <span className={`rounded-full border px-2 py-0.5 text-[0.7rem] font-semibold ${COR_TIPO[e.tipo_encargo] ?? "border-white/[0.1] bg-white/[0.04] text-zinc-400"}`}>{e.tipo_encargo}</span>
                        </td>
                        <td className="px-2 py-2 text-right text-zinc-300">{num(e.qtd)}</td>
                        <td className="py-2 pl-2 text-right font-semibold text-zinc-100">{brl(e.valor)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {d.qtd_outros > 0 && (
              <p className="text-xs text-zinc-400">
                <b className="font-semibold text-zinc-300">{textoForaDoRET(d.qtd_outros)}</b> (de outras pastas: penalidades, TOP e outros).
                Eles são lidos, mas não entram na conta do RET.
              </p>
            )}
          </div>
        )}
      </Card.Content>

      {periodo && (
        <Card.Footer className="mt-auto pt-4">
          <Link to={`/ciclo?trimestre=${trimestreDe(periodo)}`}
            className="inline-flex items-center gap-1.5 rounded text-xs font-semibold text-sky-300 hover:text-sky-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-400">
            Processar ou regravar {periodo} no Painel do Ciclo <ArrowUpRight size={13} aria-hidden />
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
