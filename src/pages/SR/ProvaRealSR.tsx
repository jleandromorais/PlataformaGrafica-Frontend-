/** "Prova real" do SR de um trimestre gravado: a conta refeita mês a mês com os valores gravados,
 * o selo de cada mês e o que as fontes (PMPV, CGF, módulo PR, Banco Central) dizem hoje.
 * Só lê: quem refaz as contas é o backend (GET /sr/prova-real). */
import type { Ref } from "react";
import { Link } from "react-router-dom";
import { Card } from "@heroui/react";
import { AlertTriangle, ArrowUpRight, ClipboardCheck, RefreshCw } from "lucide-react";
import { Conferencia } from "../../components/ui/Conferencia";
import { EsqueletoBlocos } from "../../components/ui/EsqueletoBlocos";
import { CARD_PAINEL } from "../../components/ui/estilosCard";
import { Fechamento } from "../../components/ui/Fechamento";
import type { EstadoProva } from "../../components/ui/useProvaRealDoMes";
import { brl, dataHora, num } from "../../utils/format";
import { contabil } from "../Auditoria/formatoProva";
import type { ProvaRealSR } from "../../types";
import {
  AVISO_DESATUALIZADO, ORIENTACAO_SR, camposDesatualizados, estadoDaProvaSR, estadoDasFontes, rotuloDoTrimestre,
} from "./estadoProva";

/** Como mostrar o valor de cada campo na linha "gravado × hoje". */
const FORMATO: Record<string, (v: number) => string> = {
  vp: (v) => `${num(v, 2)} m³`,
  vf: (v) => `${num(v, 2)} m³`,
  pr: (v) => brl(v, 4),
  selic_mensal: (v) => `${num(v, 6)}%`,
};

export function ProvaRealSR({ chave, estado, cardRef, onUsarNoFormulario, className = "" }: {
  /** Trimestre aberto, ex.: "Jan/2026_Mar/2026", ou null se nada foi aberto. */
  chave: string | null;
  estado: EstadoProva<ProvaRealSR>;
  /** Para a página rolar até o card ao escolher um trimestre na tabela (telas estreitas). */
  cardRef?: Ref<HTMLElement>;
  /** Leva este trimestre para o formulário (só quando ele é um trimestre civil que o formulário entende). */
  onUsarNoFormulario?: () => void;
  className?: string;
}) {
  const { dados: d, erro, carregando, atualizando } = estado;
  const situacao = d && !erro ? estadoDaProvaSR(d) : null;
  const fontes = d && !erro ? estadoDasFontes(d) : null;
  const rotulo = chave ? rotuloDoTrimestre(chave) : null;

  return (
    <Card<"section"> render={(props) => <section {...props} />} ref={cardRef}
      aria-labelledby="prova-real-titulo" aria-busy={carregando || atualizando}
      className={`${CARD_PAINEL} scroll-mt-6 ${className}`}>
      <Card.Header className="flex-row flex-wrap items-start justify-between gap-2">
        <div>
          <Card.Title<"h2"> render={(props) => <h2 {...props} />} id="prova-real-titulo"
            className="flex items-center gap-2 text-base font-semibold text-white">
            <ClipboardCheck size={16} className="text-emerald-300" aria-hidden /> Prova real{rotulo && <> · {rotulo}</>}
          </Card.Title>
          {d && !erro && situacao !== "nao_gravado" && d.data_atualizacao && (
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

      {/* Ao trocar de trimestre, o conteúdo do anterior fica esmaecido até chegar o novo (não pisca). */}
      <Card.Content className={`gap-0 transition-opacity ${atualizando ? "opacity-50" : ""}`}>
        {!chave && <p className="mt-6 text-sm text-zinc-500">Nenhum trimestre gravado ainda. Calcule e grave o SR no Painel do Ciclo.</p>}
        {chave && erro && <p role="alert" className="mt-4 text-sm text-red-300">{erro}</p>}
        {carregando && <EsqueletoBlocos blocos={["h-40", "h-24"]} texto="Montando a prova real…" />}

        {d && situacao === "nao_gravado" && !erro && <p className="mt-4 text-sm text-amber-200">{ORIENTACAO_SR.nao_gravado}</p>}

        {d && !erro && situacao !== null && situacao !== "nao_gravado" && (
          <div className="mt-4 space-y-4">
            {/* A conta, mês a mês: recalculada com os valores gravados × o SR gravado. */}
            <div className="overflow-x-auto">
              <table className="w-full min-w-[46rem] text-sm tabular-nums">
                <caption className="sr-only">SR de {rotulo}, mês a mês: conta refeita com os valores gravados contra o SR gravado</caption>
                <thead className="text-[0.7rem] text-zinc-400">
                  <tr className="border-b border-white/[0.07]">
                    <th scope="col" className="py-2 pr-3 text-left font-semibold">Mês</th>
                    <th scope="col" className="px-2 py-2 text-right font-semibold">VP (m³)</th>
                    <th scope="col" className="px-2 py-2 text-right font-semibold">VF (m³)</th>
                    <th scope="col" className="px-2 py-2 text-right font-semibold">VP − VF</th>
                    <th scope="col" className="px-2 py-2 text-right font-semibold">PR (R$/m³)</th>
                    <th scope="col" className="px-2 py-2 text-right font-semibold">SELIC</th>
                    <th scope="col" className="px-2 py-2 text-right font-semibold">SR refeito</th>
                    <th scope="col" className="px-2 py-2 text-right font-semibold">SR gravado</th>
                    <th scope="col" className="py-2 pl-2 text-right font-semibold">Situação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.05]">
                  {d.linhas.map((l) => (
                    <tr key={l.mes}>
                      <th scope="row" className="py-2 pr-3 text-left font-medium text-zinc-100">{l.mes}</th>
                      <td className="px-2 py-2 text-right text-zinc-300">{num(l.vp, 2)}</td>
                      <td className="px-2 py-2 text-right text-zinc-300">{num(l.vf, 2)}</td>
                      <td className="px-2 py-2 text-right text-zinc-300">{num(l.diferenca, 2)}</td>
                      <td className="px-2 py-2 text-right text-zinc-300">{brl(l.pr, 4)}</td>
                      <td className="px-2 py-2 text-right text-zinc-300">{num(l.selic_mensal, 6)}%</td>
                      <td className="px-2 py-2 text-right text-zinc-200">{brl(l.sr_selic_recalculado)}</td>
                      <td className="px-2 py-2 text-right font-semibold text-zinc-100">{brl(l.sr_selic_gravado)}</td>
                      <td className="py-2 pl-2 text-right"><Conferencia confere={l.conta_confere}>{l.conta_confere ? "igual" : "diferente"}</Conferencia></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <Fechamento titulo="Total do trimestre"
              linhas={[
                { rotulo: "= SR refeito (soma dos meses)", valor: contabil(d.total_recalculado), tipo: "total" },
                { rotulo: "SR gravado", valor: contabil(d.total_gravado) },
              ]}
              resultado={{
                rotulo: "Diferença", confere: d.conta_confere,
                texto: d.conta_confere ? "confere" : <>não confere: {contabil(d.total_gravado - d.total_recalculado)}</>,
              }} />

            <p className={`text-sm ${situacao === "confere" ? "text-emerald-300" : "text-amber-200"}`}>{ORIENTACAO_SR[situacao]}</p>

            {/* O que cada fonte dá hoje, comparado com o que ficou gravado no SR. */}
            <div>
              <h3 className="text-[0.7rem] font-semibold uppercase tracking-wide text-zinc-400">O que as fontes dizem hoje</h3>
              {fontes === "indisponiveis" && (
                <p className="mt-2 text-sm text-zinc-400">
                  Não consegui consultar as fontes agora (PMPV, CGF, módulo PR e Banco Central). A conta do gravado continua valendo.
                </p>
              )}
              {fontes === "em_dia" && (
                <p className="mt-2 text-sm text-emerald-300">
                  <Conferencia confere>em dia</Conferencia>
                  <span className="ml-2 text-zinc-300">O VP (do PMPV), o VF (do CGF), o PR (do módulo PR) e a SELIC (do Banco Central) de hoje são iguais aos gravados.</span>
                </p>
              )}
              {fontes === "desatualizadas" && (
                <div className="mt-2 space-y-2">
                  <ul className="space-y-1 rounded-lg border border-amber-400/30 bg-amber-400/[0.06] px-4 py-3 text-sm text-amber-200">
                    {d.linhas.flatMap((l) => camposDesatualizados(l).map((c) => (
                      <li key={`${l.mes}-${c.campo}`} className="flex items-start gap-1.5">
                        <AlertTriangle size={13} className="mt-1 shrink-0" aria-hidden />
                        <span><b>{l.mes}</b>, {c.rotulo}: gravado <b className="tabular-nums">{FORMATO[c.campo](c.gravado)}</b> × hoje <b className="tabular-nums">{c.hoje === null ? "indisponível" : FORMATO[c.campo](c.hoje)}</b></span>
                      </li>
                    )))}
                  </ul>
                  <p className="text-xs text-amber-200">{AVISO_DESATUALIZADO}</p>
                </div>
              )}
            </div>

            {d.alertas.length > 0 && (
              <ul className="list-disc space-y-0.5 pl-4 text-xs text-amber-200">
                {d.alertas.map((a, i) => <li key={i}>{a.mensagem}</li>)}
              </ul>
            )}
          </div>
        )}
      </Card.Content>

      {chave && (
        <Card.Footer className="mt-auto flex-wrap gap-x-5 gap-y-2 pt-4">
          {onUsarNoFormulario && (
            <button type="button" onClick={onUsarNoFormulario}
              className="inline-flex items-center gap-1.5 rounded text-xs font-semibold text-sky-300 hover:text-sky-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-400">
              <RefreshCw size={13} aria-hidden /> Abrir {rotulo} no formulário
            </button>
          )}
          <Link to={`/ciclo?trimestre=${encodeURIComponent(chave.split("_")[0])}`}
            className="inline-flex items-center gap-1.5 rounded text-xs font-semibold text-sky-300 hover:text-sky-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-400">
            Recalcular no Painel do Ciclo (card SR) <ArrowUpRight size={13} aria-hidden />
          </Link>
        </Card.Footer>
      )}
    </Card>
  );
}
