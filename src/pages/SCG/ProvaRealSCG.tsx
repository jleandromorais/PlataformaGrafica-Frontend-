/** "Prova real" do SCG de um mês: a soma refeita (CGR − CGF = RPV; RPV + RET + RP = SCG) contra o
 * SCG gravado e, abaixo, de onde vêm CGR, CGF, RET e RP, cada um com o seu selo e o link para a
 * tela que o grava. Só lê: quem refaz as contas é o backend (GET /scg/prova-real). */
import type { Ref } from "react";
import { Card } from "@heroui/react";
import { ClipboardCheck } from "lucide-react";
import { Conferencia } from "../../components/ui/Conferencia";
import { EsqueletoBlocos } from "../../components/ui/EsqueletoBlocos";
import { CARD_PAINEL } from "../../components/ui/estilosCard";
import { Fechamento } from "../../components/ui/Fechamento";
import { OrigemDoValor } from "../../components/ui/OrigemDoValor";
import type { EstadoProva } from "../../components/ui/useProvaRealDoMes";
import { dataHora } from "../../utils/format";
import { seloDaOrigem } from "../../utils/origemDoValor";
import { contabil } from "../Auditoria/formatoProva";
import type { ProvaRealSCG } from "../../types";
import { ORIENTACAO_SCG, estadoDaProvaSCG, linkDoModulo } from "./estadoProva";

export function ProvaRealSCG({ periodo, estado, cardRef, className = "" }: {
  periodo: string | null;
  estado: EstadoProva<ProvaRealSCG>;
  /** Para a página rolar até o card ao escolher um mês na tabela (telas estreitas). */
  cardRef?: Ref<HTMLElement>;
  className?: string;
}) {
  const { dados: d, erro, carregando, atualizando } = estado;
  const situacao = d && !erro ? estadoDaProvaSCG(d) : null;

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

      {/* Ao trocar de mês, o conteúdo do mês anterior fica esmaecido até chegar o novo (não pisca). */}
      <Card.Content className={`gap-0 transition-opacity ${atualizando ? "opacity-50" : ""}`}>
        {!periodo && <p className="mt-6 text-sm text-zinc-500">Nenhum mês escolhido.</p>}
        {periodo && erro && <p role="alert" className="mt-4 text-sm text-red-300">{erro}</p>}
        {carregando && <EsqueletoBlocos blocos={["h-48", "h-36"]} texto="Montando a prova real…" />}

        {d && situacao === "nao_gravado" && <p className="mt-4 text-sm text-amber-200">{ORIENTACAO_SCG.nao_gravado}</p>}

        {d && !erro && situacao !== null && situacao !== "nao_gravado" && d.scg_gravado !== null && (
          <div className="mt-4 space-y-4">
            <Fechamento titulo="A conta do mês"
              linhas={[
                { rotulo: "CGR (custo realizado)", valor: contabil(d.cgr) },
                { rotulo: "(−) CGF (faturado)", valor: contabil(d.cgf) },
                { rotulo: "= RPV calculado", valor: contabil(d.rpv_calculado), tipo: "total" },
                { rotulo: "(+) RET (encargos de transporte)", valor: contabil(d.ret) },
                { rotulo: "(+) RP (penalidades)", valor: contabil(d.rp) },
                { rotulo: "= SCG calculado", valor: contabil(d.scg_calculado), tipo: "total" },
                { rotulo: "SCG gravado", valor: contabil(d.scg_gravado) },
              ]}
              resultado={d.diferenca !== null ? {
                rotulo: "Diferença", confere: d.confere,
                texto: d.confere ? "confere" : <>não confere: {contabil(d.diferenca)}</>,
              } : undefined} />

            <p className={`text-sm ${situacao === "confere" ? "text-emerald-300" : "text-amber-200"}`}>{ORIENTACAO_SCG[situacao]}</p>

            <div>
              <h3 className="text-[0.7rem] font-semibold uppercase tracking-wide text-zinc-400">De onde vêm os números</h3>
              <ul className="mt-2 divide-y divide-white/[0.05] rounded-lg border border-white/[0.07] bg-white/[0.02] text-sm">
                <OrigemDoValor titulo="CGR" valor={contabil(d.cgr)} selo={seloDaOrigem(d.origens.cgr.tem_itens, d.origens.cgr.confere)}
                  textos={{ confere: "confere com as notas", diverge: "não confere com as notas", sem_itens: "sem notas para provar" }}
                  detalhe={d.origens.cgr.valor_das_notas !== null ? `soma das notas: ${contabil(d.origens.cgr.valor_das_notas)}` : "gravado só com o total"}
                  link={{ para: linkDoModulo("/auditoria", d.periodo), texto: "Abrir na Auditoria CGR" }} />
                <OrigemDoValor titulo="CGF" valor={contabil(d.cgf)} selo={seloDaOrigem(d.origens.cgf.tem_resumo, d.origens.cgf.confere)}
                  textos={{ confere: "confere com volume × PMPV", diverge: "não confere com volume × PMPV", sem_itens: "sem volumes para provar" }}
                  detalhe={d.origens.cgf.valor_calculado !== null ? `volume × PMPV: ${contabil(d.origens.cgf.valor_calculado)}` : "gravado só com o total"}
                  link={{ para: linkDoModulo("/cgf", d.periodo), texto: "Abrir no CGF" }} />
                <OrigemDoValor titulo="RET" valor={contabil(d.ret)} selo={seloDaOrigem(d.origens.ret.tem_itens, d.origens.ret.confere)}
                  textos={{ confere: "confere com os documentos", diverge: "não confere com os documentos", sem_itens: "sem documentos para provar" }}
                  detalhe={d.origens.ret.valor_calculado !== null ? `conta dos documentos: ${contabil(d.origens.ret.valor_calculado)}` : "gravado só com o total"}
                  link={{ para: linkDoModulo("/ret", d.periodo), texto: "Abrir no RET" }} />
                <OrigemDoValor titulo="RP" valor={contabil(d.rp)} selo={seloDaOrigem(d.origens.rp.tem_itens, d.origens.rp.confere)}
                  textos={{ confere: "confere com as notas", diverge: "não confere com as notas", sem_itens: "sem notas para provar" }}
                  detalhe={d.origens.rp.valor_calculado !== null ? `conta das notas: ${contabil(d.origens.rp.valor_calculado)}` : "gravado só com o total"}
                  link={{ para: linkDoModulo("/conciliacao", d.periodo), texto: "Abrir no RP" }} />
              </ul>
            </div>
          </div>
        )}
      </Card.Content>
    </Card>
  );
}
