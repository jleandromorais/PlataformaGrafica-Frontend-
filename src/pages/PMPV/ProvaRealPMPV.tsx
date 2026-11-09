/** "Prova real" de uma sessão salva do PMPV: a conta refeita com as linhas gravadas (por mês e
 * por empresa) e comparada com o resultado gravado, com o selo "confere" em cada passo.
 * Só lê: quem refaz a conta é o backend (GET /pmpv/prova-real). A busca fica na página
 * (useProvaRealDoMes). A Conta Gráfica aparece como foi gravada (vem do PR), sem recalcular. */
import type { Ref } from "react";
import { Link } from "react-router-dom";
import { Card } from "@heroui/react";
import { ArrowUpRight, ClipboardCheck } from "lucide-react";
import { Conferencia } from "../../components/ui/Conferencia";
import { EsqueletoBlocos } from "../../components/ui/EsqueletoBlocos";
import { CARD_PAINEL } from "../../components/ui/estilosCard";
import { Fechamento } from "../../components/ui/Fechamento";
import type { EstadoProva } from "../../components/ui/useProvaRealDoMes";
import { MENOS, brl, num } from "../../utils/format";
import type { ProvaRealPMPV } from "../../types";

// Só para o selo de cada passo: as mesmas tolerâncias do backend (servicos_pmpv.TOL_PROVA_REAL_*).
const TOL_PMPV = 0.0001; // R$/m³ (o PMPV é gravado com 4 casas)
const TOL_RS = 1;        // R$ (custo total)
const TOL_M3 = 1;        // m³ (volume prospectivo)

const m3 = (v: number) => `${num(v, 2)} m³`;
const tarifa = (v: number) => brl(v, 4);

/** Resultado de um passo (faixa de diferença) ou nada quando não há o que comparar. */
function resultado(rotulo: string, dif: number | null, tol: number, fmt: (v: number) => string) {
  if (dif === null) return undefined;
  const ok = Math.abs(dif) <= tol;
  return { rotulo, confere: ok, texto: ok ? "confere" : <>não confere: {dif < 0 ? `${MENOS}${fmt(-dif)}` : fmt(dif)}</> };
}

export function ProvaRealPMPV({ rotuloSessao, estado, cardRef, className = "" }: {
  /** Nome da sessão escolhida (ex.: "PMPV_Ago_Out_2026"), ou null se nada foi aberto. */
  rotuloSessao: string | null;
  estado: EstadoProva<ProvaRealPMPV>;
  /** Para a página rolar até o card ao escolher uma sessão na tabela (telas estreitas). */
  cardRef?: Ref<HTMLElement>;
  className?: string;
}) {
  const { dados: d, erro, carregando, atualizando } = estado;
  const aberta = rotuloSessao !== null;

  return (
    <Card<"section"> render={(props) => <section {...props} />} ref={cardRef}
      aria-labelledby="prova-real-titulo" aria-busy={carregando || atualizando}
      className={`${CARD_PAINEL} scroll-mt-6 ${className}`}>
      <Card.Header className="flex-row flex-wrap items-start justify-between gap-2">
        <div>
          <Card.Title<"h2"> render={(props) => <h2 {...props} />} id="prova-real-titulo"
            className="flex items-center gap-2 text-base font-semibold text-white">
            <ClipboardCheck size={16} className="text-emerald-300" aria-hidden /> Prova real{aberta && <> · {d?.nome ?? rotuloSessao}</>}
          </Card.Title>
          {d && !erro && d.data_criacao && (
            <Card.Description className="mt-0.5 text-xs text-zinc-500">sessão nº {d.sessao_id} · salva em {d.data_criacao}</Card.Description>
          )}
        </div>
        {d && !erro && d.tem_linhas && d.tem_resultado && (
          <Conferencia confere={d.confere}
            className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${d.confere ? "bg-emerald-400/10" : "bg-red-400/10"}`}>
            {d.confere ? "Confere com o gravado" : "Não confere"}
          </Conferencia>
        )}
      </Card.Header>

      {/* Ao trocar de sessão, o conteúdo da anterior fica esmaecido até chegar o novo (não pisca). */}
      <Card.Content className={`gap-0 transition-opacity ${atualizando ? "opacity-50" : ""}`}>
        {!aberta && <p className="mt-6 text-sm text-zinc-500">Nenhuma sessão salva ainda. Calcule e salve o PMPV de um trimestre acima.</p>}
        {aberta && erro && <p role="alert" className="mt-4 text-sm text-red-300">{erro}</p>}
        {carregando && <EsqueletoBlocos blocos={["h-48", "h-48", "h-40"]} texto="Montando a prova real…" />}

        {d && !erro && !d.tem_linhas && (
          <p className="mt-4 text-sm text-amber-200">
            A sessão {d.nome} não tem nenhuma linha com volume: sem volume não há o que somar para refazer a conta.
            {d.pmpv_gravado !== null && <> O PMPV gravado é {tarifa(d.pmpv_gravado)}.</>}
          </p>
        )}

        {d && !erro && d.tem_linhas && (
          <div className="mt-4 space-y-5">
            {!d.tem_resultado && (
              <p className="text-sm text-amber-200">
                Esta sessão não tem resultado gravado (PMPV, preço final, VP): abaixo está só a conta refeita com as linhas, sem comparação.
              </p>
            )}

            {/* A conta, mês a mês e empresa por empresa: preço × volume = custo. */}
            {d.meses.map((m) => (
              <div key={m.mes}>
                <h3 className="text-[0.7rem] font-semibold uppercase tracking-wide text-zinc-400">Mês {m.mes}</h3>
                <div className="mt-2 overflow-x-auto">
                  <table className="w-full min-w-[44rem] text-sm tabular-nums">
                    <caption className="sr-only">Empresas do mês {m.mes} da sessão {d.nome}: preço, volume e custo</caption>
                    <thead className="text-[0.7rem] text-zinc-400">
                      <tr className="border-b border-white/[0.07]">
                        <th scope="col" className="py-2 pr-3 text-left font-semibold">Empresa</th>
                        <th scope="col" className="px-2 py-2 text-right font-semibold">Molécula</th>
                        <th scope="col" className="px-2 py-2 text-right font-semibold">Transporte</th>
                        <th scope="col" className="px-2 py-2 text-right font-semibold">Logística</th>
                        <th scope="col" className="px-2 py-2 text-right font-semibold">Preço (R$/m³)</th>
                        <th scope="col" className="px-2 py-2 text-right font-semibold">Volume (m³)</th>
                        <th scope="col" className="py-2 pl-2 text-right font-semibold">Custo (R$)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/[0.05]">
                      {m.empresas.map((e) => (
                        <tr key={e.empresa}>
                          <th scope="row" className="py-2 pr-3 text-left font-medium text-zinc-100">{e.empresa}</th>
                          <td className="px-2 py-2 text-right text-zinc-400">{num(e.molecula, 4)}</td>
                          <td className="px-2 py-2 text-right text-zinc-400">{num(e.transporte, 4)}</td>
                          <td className="px-2 py-2 text-right text-zinc-400">{num(e.logistica, 4)}</td>
                          <td className="px-2 py-2 text-right text-zinc-200">{num(e.preco, 4)}</td>
                          <td className="px-2 py-2 text-right text-zinc-300">{num(e.volume, 2)}</td>
                          <td className="py-2 pl-2 text-right font-semibold text-zinc-100">{brl(e.custo)}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="border-t border-white/[0.12] font-semibold">
                        <th scope="row" colSpan={5} className="py-2 pr-3 text-left text-zinc-200">
                          Subtotal do mês <span className="ml-2 font-normal text-zinc-400">PMPV do mês: {tarifa(m.pmpv_do_mes)}</span>
                        </th>
                        <td className="px-2 py-2 text-right text-zinc-200">{num(m.volume, 2)}</td>
                        <td className="py-2 pl-2 text-right text-sky-200">{brl(m.custo)}</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            ))}

            {/* O fechamento: cada passo da conta, calculado contra o gravado. */}
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <Fechamento titulo="1. PMPV do trimestre"
                linhas={[
                  { rotulo: "Σ custo (preço × volume)", valor: d.custo_total_calculado === null ? "—" : brl(d.custo_total_calculado) },
                  { rotulo: "(÷) Σ volume", valor: d.volume_total === null ? "—" : m3(d.volume_total) },
                  { rotulo: "= PMPV calculado", valor: d.pmpv_calculado === null ? "—" : tarifa(d.pmpv_calculado), tipo: "total" },
                  { rotulo: "PMPV gravado", valor: d.pmpv_gravado === null ? "—" : tarifa(d.pmpv_gravado) },
                ]}
                resultado={resultado("Diferença do PMPV", d.diferenca_pmpv, TOL_PMPV, tarifa)} />

              <Fechamento titulo="2. Preço final"
                linhas={[
                  { rotulo: "PMPV calculado", valor: d.pmpv_calculado === null ? "—" : tarifa(d.pmpv_calculado) },
                  { rotulo: "(+) Conta Gráfica (do PR, como gravada)", valor: d.conta_grafica === null ? "—" : tarifa(d.conta_grafica) },
                  { rotulo: "= Preço final calculado", valor: d.preco_final_calculado === null ? "—" : tarifa(d.preco_final_calculado), tipo: "total" },
                  { rotulo: "Preço final gravado", valor: d.preco_final_gravado === null ? "—" : tarifa(d.preco_final_gravado) },
                ]}
                resultado={resultado("Diferença do preço final", d.diferenca_preco_final, TOL_PMPV, tarifa)} />

              <Fechamento titulo="3. Volume prospectivo (VP)"
                linhas={[
                  { rotulo: "Σ volume das linhas", valor: d.volume_total === null ? "—" : m3(d.volume_total), tipo: "total" },
                  { rotulo: "VP gravado", valor: d.vp_gravado === null ? "—" : m3(d.vp_gravado) },
                ]}
                resultado={resultado("Diferença do VP", d.diferenca_vp, TOL_M3, m3)} />

              <Fechamento titulo="4. Custo total"
                linhas={[
                  { rotulo: "Σ custo das linhas", valor: d.custo_total_calculado === null ? "—" : brl(d.custo_total_calculado), tipo: "total" },
                  { rotulo: "Custo total gravado", valor: d.custo_total_gravado === null ? "—" : brl(d.custo_total_gravado) },
                ]}
                resultado={resultado("Diferença do custo", d.diferenca_custo, TOL_RS, brl)} />
            </div>

            <p className="text-xs text-zinc-500">
              A Conta Gráfica não é recalculada aqui: é o PR do trimestre, gravado na tela PR.
            </p>

            {d.tem_resultado && !d.confere && (
              <p className="text-xs text-amber-200">
                Algum passo não bate com o gravado. Isso acontece quando a sessão foi gravada com outra regra ou o resultado foi alterado à mão.
                Calcule e salve o trimestre de novo para gerar uma sessão nova.
              </p>
            )}
          </div>
        )}
      </Card.Content>

      {aberta && (
        <Card.Footer className="mt-auto pt-4">
          <Link to="/pr" className="inline-flex items-center gap-1.5 rounded text-xs font-semibold text-sky-300 hover:text-sky-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-400">
            Ver a Conta Gráfica (PR) do trimestre <ArrowUpRight size={13} aria-hidden />
          </Link>
        </Card.Footer>
      )}
    </Card>
  );
}
