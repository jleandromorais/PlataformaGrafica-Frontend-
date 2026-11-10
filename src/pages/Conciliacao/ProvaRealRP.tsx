/** "Prova real" do RP de um mês: a conta aberta ((despesas − receitas) × (1 − PIS/COFINS)) com o
 * RP gravado ao lado, a lista de todas as notas do mês e o alerta de notas repetidas.
 * Só lê: quem refaz a conta é o backend (GET /conciliacao/prova-real). A busca fica na
 * página (useProvaRealDoMes). */
import { useState, type Ref } from "react";
import { Link } from "react-router-dom";
import { Card } from "@heroui/react";
import { AlertTriangle, ArrowUpRight, ClipboardCheck } from "lucide-react";
import { Conferencia } from "../../components/ui/Conferencia";
import { EsqueletoBlocos } from "../../components/ui/EsqueletoBlocos";
import { CARD_PAINEL } from "../../components/ui/estilosCard";
import { Fechamento } from "../../components/ui/Fechamento";
import type { EstadoProva } from "../../components/ui/useProvaRealDoMes";
import { brl, dataHora, num } from "../../utils/format";
import { contabil } from "../Auditoria/formatoProva";
import type { ProvaRealRP } from "../../types";
import {
  ORIENTACAO_RP, ORIENTACAO_REPETIDA, ROTULO_LADO, estadoDaProvaRP, filtrarItens, itemNaoLido, qtdNaoLidos, textoDuplicada, textoNaoLidos, textoQtdRepetidas,
  type FiltroItens,
} from "./estadoProva";

const COR_TIPO: Record<string, string> = {
  PFP: "border-sky-500/25 bg-sky-500/10 text-sky-300",
  TOP: "border-emerald-500/25 bg-emerald-500/10 text-emerald-300",
};

export function ProvaRealRP({ periodo, estado, cardRef, className = "" }: {
  periodo: string | null;
  estado: EstadoProva<ProvaRealRP>;
  /** Para a página rolar até o card ao escolher um mês na tabela (telas estreitas). */
  cardRef?: Ref<HTMLElement>;
  className?: string;
}) {
  const { dados: d, erro, carregando, atualizando } = estado;
  const [filtro, setFiltro] = useState<FiltroItens>("todas");
  const situacao = d && !erro ? estadoDaProvaRP(d) : null;
  const taxa = d ? `${num(d.taxa * 100, 2)}%` : "";
  const repetidas = d && !erro ? d.possiveis_duplicadas : [];
  const itens = d ? filtrarItens(d.itens, filtro) : [];
  const naoLidos = d && !erro ? qtdNaoLidos(d) : 0;

  const FILTROS: { chave: FiltroItens; rotulo: string }[] = d ? [
    { chave: "todas", rotulo: `Todas (${d.itens.length})` },
    { chave: "repetidas", rotulo: `Só repetidas (${filtrarItens(d.itens, "repetidas").length})` },
    { chave: "receitas", rotulo: `Receitas (${filtrarItens(d.itens, "receitas").length})` },
    { chave: "despesas", rotulo: `Despesas (${filtrarItens(d.itens, "despesas").length})` },
  ] : [];

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
          {d && !erro && d.rp_gravado !== null && d.data_atualizacao && (
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
        {/* Nota repetida: o que o usuário mais precisa ver, por isso fica no topo e em âmbar. */}
        {repetidas.length > 0 && d && (
          <div role="alert" className="mt-4 rounded-lg border border-amber-400/40 bg-amber-400/[0.08] px-4 py-3 text-sm text-amber-200">
            <p className="flex items-center gap-2 font-semibold">
              <AlertTriangle size={16} className="shrink-0" aria-hidden /> {textoQtdRepetidas(repetidas.length)} neste mês
            </p>
            <ul className="mt-1.5 list-disc space-y-0.5 pl-6">
              {repetidas.map((r) => <li key={`${r.tipo}-${r.numero}`}>{textoDuplicada(r, d.itens)}</li>)}
            </ul>
            <p className="mt-2 text-xs">{ORIENTACAO_REPETIDA}</p>
          </div>
        )}

        {!periodo && <p className="mt-6 text-sm text-zinc-500">Nenhum mês gravado ainda. Processe o RP de um mês no Painel do Ciclo.</p>}
        {periodo && erro && <p role="alert" className="mt-4 text-sm text-red-300">{erro}</p>}
        {carregando && <EsqueletoBlocos blocos={["h-48", "h-40"]} texto="Montando a prova real…" />}

        {d && situacao && (situacao === "nao_gravado" || situacao === "so_total") && (
          <p className="mt-4 text-sm text-amber-200">
            {situacao === "so_total" && d.rp_gravado !== null && <>O RP gravado de {d.periodo} é <b className="tabular-nums">{brl(d.rp_gravado)}</b>. </>}
            {ORIENTACAO_RP[situacao]}
          </p>
        )}

        {d && !erro && d.tem_itens && d.rp_gravado !== null && (
          <div className="mt-4 space-y-4">
            <Fechamento titulo="A conta do mês"
              linhas={[
                { rotulo: `Receitas (${num(d.receitas.qtd)} notas), valor das notas`, valor: contabil(d.receitas.bruto) },
                { rotulo: `= Receitas líquidas (× 1 − ${taxa})`, valor: contabil(d.receitas.liquido), tipo: "total" },
                { rotulo: `Despesas (${num(d.despesas.qtd)} notas), valor das notas`, valor: contabil(d.despesas.bruto) },
                { rotulo: `= Despesas líquidas (× 1 − ${taxa})`, valor: contabil(d.despesas.liquido), tipo: "total" },
                ...(d.ja_no_ret.qtd > 0 ? [{ rotulo: `Já no RET (${num(d.ja_no_ret.qtd)} notas): valem 0 no RP`, valor: contabil(d.ja_no_ret.bruto), tipo: "info" as const }] : []),
                { rotulo: "= RP calculado (despesas líquidas − receitas líquidas)", valor: d.rp_calculado === null ? "—" : contabil(d.rp_calculado), tipo: "total" },
                { rotulo: "RP gravado", valor: contabil(d.rp_gravado) },
              ]}
              resultado={d.diferenca !== null ? {
                rotulo: "Diferença", confere: d.confere,
                texto: d.confere ? "confere" : <>não confere: {contabil(d.diferenca)}</>,
              } : undefined} />

            {/* Não confere por PDF não lido: a causa mais provável vem antes da explicação genérica. */}
            {situacao === "diverge" && naoLidos > 0 && (
              <p className="text-sm text-amber-200">{textoNaoLidos(naoLidos)}</p>
            )}
            <p className={`text-sm ${situacao === "confere" && repetidas.length === 0 ? "text-emerald-300" : "text-amber-200"}`}>
              {situacao && ORIENTACAO_RP[situacao]}
            </p>

            {/* Todas as notas do mês, para achar de onde vem cada valor (e as repetidas). */}
            <div>
              <h3 className="text-[0.7rem] font-semibold uppercase tracking-wide text-zinc-400">Notas do mês</h3>
              <div className="mt-2 flex flex-wrap gap-2" role="group" aria-label="Filtrar as notas">
                {FILTROS.map((f) => (
                  <button key={f.chave} type="button" aria-pressed={filtro === f.chave} onClick={() => setFiltro(f.chave)}
                    className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-400 ${
                      filtro === f.chave
                        ? "border-sky-500/40 bg-white/[0.08] text-sky-300"
                        : "border-white/[0.07] bg-white/[0.02] text-zinc-400 hover:border-white/[0.14] hover:text-zinc-200"}`}>
                    {f.rotulo}
                  </button>
                ))}
              </div>
              {/* Lista com rolagem própria (são cerca de 30 notas); focável pelo teclado. */}
              <div tabIndex={0} role="region" aria-label={`Notas de ${d.periodo}`}
                className="mt-2 max-h-96 overflow-auto rounded-lg border border-white/[0.07] focus-visible:outline-2 focus-visible:outline-sky-400">
                <table className="w-full min-w-[34rem] text-sm tabular-nums">
                  <caption className="sr-only">Notas de penalidade de {d.periodo}, do maior valor ao menor</caption>
                  <thead className="sticky top-0 bg-panel text-[0.7rem] text-zinc-400">
                    <tr className="border-b border-white/[0.07]">
                      <th scope="col" className="px-3 py-2 text-left font-semibold">Nota</th>
                      <th scope="col" className="px-2 py-2 text-left font-semibold">Tipo</th>
                      <th scope="col" className="px-2 py-2 text-left font-semibold">Lado</th>
                      <th scope="col" className="px-2 py-2 text-right font-semibold">Valor</th>
                      <th scope="col" className="px-3 py-2 text-right font-semibold">Líquido</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.05]">
                    {itens.map((i, idx) => (
                      <tr key={`${i.arquivo}-${idx}`} className={i.repetida || itemNaoLido(i) ? "bg-amber-400/[0.08]" : ""}>
                        <th scope="row" className="max-w-[16rem] px-3 py-2 text-left font-medium text-zinc-100" title={i.arquivo}>
                          <span className="block truncate">{i.nome}</span>
                          {i.repetida && (
                            <span className="mt-0.5 inline-flex items-center gap-1 rounded-full border border-amber-400/40 bg-amber-400/10 px-1.5 py-0.5 text-[0.65rem] font-semibold text-amber-200">
                              <AlertTriangle size={10} aria-hidden /> repetida
                            </span>
                          )}
                          {itemNaoLido(i) && (
                            <span className="mt-0.5 inline-flex items-center gap-1 rounded-full border border-amber-400/40 bg-amber-400/10 px-1.5 py-0.5 text-[0.65rem] font-semibold text-amber-200">
                              <AlertTriangle size={10} aria-hidden /> PDF não lido (valor 0)
                            </span>
                          )}
                        </th>
                        <td className="px-2 py-2">
                          <span className={`rounded-full border px-2 py-0.5 text-[0.7rem] font-semibold ${COR_TIPO[i.tipo] ?? "border-white/[0.1] bg-white/[0.04] text-zinc-400"}`}>
                            {i.tipo === "OUTRA" ? "outra" : i.tipo}
                          </span>
                        </td>
                        <td className="px-2 py-2 text-zinc-300">{ROTULO_LADO[i.lado]}</td>
                        <td className="px-2 py-2 text-right text-zinc-200">{brl(i.valor)}</td>
                        <td className={`px-3 py-2 text-right font-semibold ${i.lado === "ja_no_ret" ? "text-zinc-500" : "text-zinc-100"}`}>{brl(i.liquido)}</td>
                      </tr>
                    ))}
                    {itens.length === 0 && <tr><td colSpan={5} className="px-3 py-6 text-center text-zinc-500">Nenhuma nota neste filtro.</td></tr>}
                  </tbody>
                </table>
              </div>
            </div>
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
