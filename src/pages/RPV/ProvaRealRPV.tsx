/** "Prova real" do RPV de um mês: CGR − CGF = RPV (calculado contra o gravado) e de onde vêm
 * o CGR e o CGF, cada um com o seu selo. Só lê: quem refaz as contas é o backend
 * (GET /rpv/prova-real). A busca fica na página (useProvaRealDoMes). */
import type { ReactNode, Ref } from "react";
import { Link } from "react-router-dom";
import { Card } from "@heroui/react";
import { ArrowUpRight, ClipboardCheck, CircleHelp } from "lucide-react";
import { Conferencia } from "../../components/ui/Conferencia";
import { CARD_PAINEL } from "../../components/ui/estilosCard";
import { Fechamento } from "../../components/ui/Fechamento";
import { Skeleton } from "../../components/ui/Skeleton";
import type { EstadoProva } from "../../components/ui/useProvaRealDoMes";
import { brl, dataHora } from "../../utils/format";
import { contabil } from "../Auditoria/formatoProva";
import type { ProvaRealRPV } from "../../types";

export function ProvaRealRPV({ periodo, estado, cardRef, className = "" }: {
  periodo: string | null;
  estado: EstadoProva<ProvaRealRPV>;
  /** Para a página rolar até o card ao escolher um mês na tabela (telas estreitas). */
  cardRef?: Ref<HTMLElement>;
  className?: string;
}) {
  const { dados: d, erro, carregando, atualizando } = estado;
  const periodoUrl = d ? encodeURIComponent(d.periodo) : "";

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
          {d && d.gravado && !erro && d.data_atualizacao && (
            <Card.Description className="mt-0.5 text-xs text-zinc-500">gravado em {dataHora(d.data_atualizacao)}</Card.Description>
          )}
        </div>
        {d && d.gravado && !erro && (
          <Conferencia confere={d.confere}
            className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${d.confere ? "bg-emerald-400/10" : "bg-red-400/10"}`}>
            {d.confere ? "Confere com o gravado" : "Não confere"}
          </Conferencia>
        )}
      </Card.Header>

      {/* Ao trocar de mês, o conteúdo do mês anterior fica esmaecido até chegar o novo (não pisca). */}
      <Card.Content className={`gap-0 transition-opacity ${atualizando ? "opacity-50" : ""}`}>
        {!periodo && <p className="mt-6 text-sm text-zinc-500">Nenhum mês gravado ainda.</p>}
        {periodo && erro && <p role="alert" className="mt-4 text-sm text-red-300">{erro}</p>}
        {carregando && <EsqueletoProva />}

        {d && !erro && !d.gravado && (
          <p className="mt-4 text-sm text-amber-200">
            {d.periodo} ainda não tem RPV gravado. Ele é recalculado sozinho quando o CGR é gravado na
            {" "}<Link to={`/auditoria?periodo=${periodoUrl}`} className="font-semibold underline underline-offset-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-400">Auditoria CGR</Link>
            {" "}e o CGF na tela{" "}
            <Link to={`/cgf?periodo=${periodoUrl}`} className="font-semibold underline underline-offset-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-400">CGF</Link>.
          </p>
        )}

        {d && !erro && d.gravado && (
          <div className="mt-4 space-y-4">
            <Fechamento titulo="A conta do mês"
              linhas={[
                { rotulo: "CGR (custo realizado)", valor: contabil(d.cgr) },
                { rotulo: "(−) CGF (faturado)", valor: contabil(d.cgf) },
                { rotulo: "= RPV calculado", valor: contabil(d.rpv_calculado), tipo: "total" },
                { rotulo: "RPV gravado", valor: d.rpv_gravado === null ? "—" : contabil(d.rpv_gravado) },
              ]}
              resultado={d.diferenca !== null ? {
                rotulo: "Diferença", confere: d.confere,
                texto: d.confere ? "confere" : <>não confere: {contabil(d.diferenca)}</>,
              } : undefined} />

            <div>
              <h3 className="text-[0.7rem] font-semibold uppercase tracking-wide text-zinc-400">De onde vêm os números</h3>
              <ul className="mt-2 divide-y divide-white/[0.05] rounded-lg border border-white/[0.07] bg-white/[0.02] text-sm">
                <Origem titulo="CGR" valor={brl(d.cgr)}
                  selo={!d.origem_cgr.tem_notas
                    ? <SemProva>sem notas para provar</SemProva>
                    : <Conferencia confere={d.origem_cgr.confere}>{d.origem_cgr.confere ? "confere com as notas" : "não confere com as notas"}</Conferencia>}
                  detalhe={d.origem_cgr.tem_notas && d.origem_cgr.valor_das_notas !== null ? `soma das notas: ${contabil(d.origem_cgr.valor_das_notas)}` : "gravado só com o total"}
                  link={{ para: `/auditoria?periodo=${periodoUrl}`, texto: "Abrir na Auditoria CGR" }} />
                <Origem titulo="CGF" valor={brl(d.cgf)}
                  selo={!d.origem_cgf.tem_resumo
                    ? <SemProva>sem volumes para provar</SemProva>
                    : <Conferencia confere={d.origem_cgf.confere}>{d.origem_cgf.confere ? "confere com volume × PMPV" : "não confere com volume × PMPV"}</Conferencia>}
                  detalhe={d.origem_cgf.tem_resumo && d.origem_cgf.valor_calculado !== null ? `volume × PMPV: ${contabil(d.origem_cgf.valor_calculado)}` : "gravado só com o total"}
                  link={{ para: `/cgf?periodo=${periodoUrl}`, texto: "Abrir no CGF" }} />
              </ul>
            </div>

            {!d.confere && (
              <p className="text-xs text-amber-200">
                O RPV gravado não bate com CGR − CGF. Isso acontece quando um dos dois foi alterado depois de gravado o RPV.
                Grave o CGR ou o CGF do mês de novo para o RPV ser recalculado.
              </p>
            )}
          </div>
        )}
      </Card.Content>

      {periodo && (
        <Card.Footer className="mt-auto pt-4">
          <Link to={`/ciclo?trimestre=${trimestreDe(periodo)}`}
            className="inline-flex items-center gap-1.5 rounded text-xs font-semibold text-sky-300 hover:text-sky-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-400">
            Ver {periodo} no Painel do Ciclo <ArrowUpRight size={13} aria-hidden />
          </Link>
        </Card.Footer>
      )}
    </Card>
  );
}

/** Selo neutro para "não há como provar" (nem confere nem diverge). */
function SemProva({ children }: { children: ReactNode }) {
  return <span className="inline-flex items-center gap-1 whitespace-nowrap text-zinc-400"><CircleHelp size={13} aria-hidden className="shrink-0" />{children}</span>;
}

/** Uma origem (CGR ou CGF): valor usado, selo, detalhe e link para a tela que o grava. */
function Origem({ titulo, valor, selo, detalhe, link }: {
  titulo: string; valor: string; selo: ReactNode; detalhe: string; link: { para: string; texto: string };
}) {
  return (
    <li className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 px-4 py-3">
      <div>
        <p className="font-semibold text-zinc-200">{titulo} <span className="ml-1 font-normal tabular-nums text-zinc-300">{valor}</span></p>
        <p className="text-xs tabular-nums text-zinc-500">{detalhe}</p>
      </div>
      <div className="flex flex-col items-end gap-1 text-xs font-medium">
        {selo}
        <Link to={link.para} className="inline-flex items-center gap-1 rounded text-sky-300 hover:text-sky-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-400">
          {link.texto} <ArrowUpRight size={12} aria-hidden />
        </Link>
      </div>
    </li>
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
      <Skeleton className="h-36 w-full" />
      <Skeleton className="h-24 w-full" />
    </div>
  );
}
