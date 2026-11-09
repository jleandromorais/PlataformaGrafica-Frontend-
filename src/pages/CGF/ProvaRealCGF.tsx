/** "Prova real" do CGF de um mês: a conta aberta (volumes e depois volume × PMPV), com o gravado
 * ao lado do calculado e o selo "confere". Só lê: quem refaz a conta é o backend
 * (GET /cgf/prova-real). A busca fica na página (useProvaRealDoMes). */
import type { Ref } from "react";
import { Link } from "react-router-dom";
import { Card } from "@heroui/react";
import { ArrowUpRight, ClipboardCheck } from "lucide-react";
import { Conferencia } from "../../components/ui/Conferencia";
import { CARD_PAINEL } from "../../components/ui/estilosCard";
import { Fechamento } from "../../components/ui/Fechamento";
import { Skeleton } from "../../components/ui/Skeleton";
import type { EstadoProva } from "../../components/ui/useProvaRealDoMes";
import { brl, dataHora, MENOS, num } from "../../utils/format";
import { contabil } from "../Auditoria/formatoProva";
import type { ProvaRealCGF } from "../../types";

const m3 = (v: number) => `${num(v, 4)} m³`;
/** Diferença de volume com sinal explícito (zero sem sinal). */
const dif = (v: number) => (v > 0 ? `+${num(v, 4)} m³` : v < 0 ? `${MENOS}${num(-v, 4)} m³` : m3(0));

export function ProvaRealCGF({ periodo, estado, cardRef, className = "" }: {
  periodo: string | null;
  estado: EstadoProva<ProvaRealCGF>;
  /** Para a página rolar até o card ao escolher um mês na tabela (telas estreitas). */
  cardRef?: Ref<HTMLElement>;
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
            <ClipboardCheck size={16} className="text-emerald-300" aria-hidden /> Prova real{periodo && <> · {periodo}</>}
          </Card.Title>
          {d && d.tem_resumo && !erro && d.data_atualizacao && (
            <Card.Description className="mt-0.5 text-xs text-zinc-500">gravado em {dataHora(d.data_atualizacao)}</Card.Description>
          )}
        </div>
        {d && d.tem_resumo && !erro && (
          <Conferencia confere={d.confere}
            className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${d.confere ? "bg-emerald-400/10" : "bg-red-400/10"}`}>
            {d.confere ? "Confere com o gravado" : "Não confere"}
          </Conferencia>
        )}
      </Card.Header>

      {/* Ao trocar de mês, o conteúdo do mês anterior fica esmaecido até chegar o novo (não pisca). */}
      <Card.Content className={`gap-0 transition-opacity ${atualizando ? "opacity-50" : ""}`}>
        {!periodo && <p className="mt-6 text-sm text-zinc-500">Nenhum mês gravado ainda. Grave o CGF de um mês no Painel do Ciclo.</p>}
        {periodo && erro && <p role="alert" className="mt-4 text-sm text-red-300">{erro}</p>}
        {carregando && <EsqueletoProva />}

        {d && !erro && !d.tem_resumo && (
          <p className="mt-4 text-sm text-amber-200">
            {d.cgf_gravado !== null
              ? <>{d.periodo} tem o CGF gravado ({brl(d.cgf_gravado)}), mas só com o total: não há os volumes (faturado, devoluções) para abrir a conta.</>
              : <>{d.periodo} ainda não tem CGF gravado.</>}
            {" "}Processe as planilhas de NF do mês no Painel do Ciclo para ter a prova real.
          </p>
        )}

        {d && !erro && d.tem_resumo && (
          <div className="mt-4 space-y-4">
            <Fechamento titulo="1. Volume final (m³)"
              linhas={[
                { rotulo: "(+) Faturado", valor: m3(d.volume_faturado) },
                { rotulo: "(−) Devoluções", valor: m3(d.volume_devolucoes), cor: d.volume_devolucoes ? "text-red-300" : undefined },
                { rotulo: "= Volume final calculado", valor: m3(d.volume_final_calculado), tipo: "total" },
                { rotulo: "Volume final gravado", valor: d.volume_final_gravado === null ? "—" : m3(d.volume_final_gravado) },
                { rotulo: "Consumo próprio (já fora do faturado)", valor: m3(d.volume_consumo_proprio), tipo: "info" },
                { rotulo: "Canceladas (não entram)", valor: m3(d.volume_canceladas), tipo: "info" },
              ]}
              resultado={d.diferenca_volume !== null ? {
                rotulo: "Diferença de volume", confere: d.volume_confere,
                texto: d.volume_confere ? "confere" : <>não confere: {dif(d.diferenca_volume)}</>,
              } : undefined} />

            {d.pmpv === null ? (
              <p className="rounded-lg border border-amber-400/30 bg-amber-400/[0.06] px-4 py-3 text-sm text-amber-200">
                Falta o PMPV de {d.periodo}: sem ele não dá para provar o CGF em R$.{" "}
                <Link to="/pmpv" className="inline-flex items-center gap-1 rounded font-semibold underline underline-offset-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-400">
                  Abrir o PMPV <ArrowUpRight size={13} aria-hidden />
                </Link>
              </p>
            ) : (
              <Fechamento titulo="2. CGF em R$"
                linhas={[
                  { rotulo: "Volume final calculado", valor: m3(d.volume_final_calculado) },
                  { rotulo: "(×) PMPV do mês", valor: `${brl(d.pmpv, 4)}/m³` },
                  { rotulo: "= CGF calculado", valor: d.cgf_calculado === null ? "—" : contabil(d.cgf_calculado), tipo: "total" },
                  { rotulo: "CGF gravado", valor: d.cgf_gravado === null ? "—" : contabil(d.cgf_gravado) },
                ]}
                resultado={d.diferenca_cgf !== null ? {
                  rotulo: "Diferença do CGF", confere: d.cgf_confere,
                  texto: d.cgf_confere ? "confere" : <>não confere: {contabil(d.diferenca_cgf)}</>,
                } : undefined} />
            )}

            {!d.confere && d.pmpv !== null && (
              <p className="text-xs text-amber-200">
                O CGF gravado não bate com a conta refeita. Isso acontece quando o mês foi gravado com outro PMPV ou o total foi
                alterado à mão. Grave o mês de novo no Painel do Ciclo para conferir onde está a diferença.
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

function EsqueletoProva() {
  return (
    <div role="status" className="mt-4 space-y-3">
      <span className="sr-only">Montando a prova real…</span>
      <Skeleton className="h-40 w-full" />
      <Skeleton className="h-28 w-full" />
    </div>
  );
}
