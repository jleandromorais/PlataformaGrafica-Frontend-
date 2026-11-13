/** Cards de destaque (KPIs) do topo das telas da Conta Gráfica: HeroUI Card + hover (`card-hover`).
 * É o ÚNICO card de número do projeto (o Dashboard e as 7 telas usam este). */
import type { ReactNode } from "react";
import { Card } from "@heroui/react";
import { CARD_KPI } from "./estilosCard";
import { Skeleton } from "./Skeleton";

/** Faixa com os cards de destaque: 2 colunas em telas pequenas, 4 em xl. Esmaece ao trocar de mês.
 * `auto-rows-fr` + `h-full` no card deixam todos os cards da fileira com a mesma altura. */
export function GradeKpis({ titulo, carregando, atualizando, cinco = false, tres = false, children }: {
  titulo: string; carregando: boolean; atualizando: boolean;
  /** 5 cards em xl (em vez de 4). */
  cinco?: boolean;
  /** 6 cards do Dashboard: 1 coluna no celular, 2 em sm e 3 em xl. */
  tres?: boolean;
  children: ReactNode;
}) {
  const colunas = tres
    ? "grid-cols-1 sm:grid-cols-2 xl:grid-cols-3"
    : cinco ? "grid-cols-2 xl:grid-cols-5" : "grid-cols-2 xl:grid-cols-4";
  return (
    <section aria-labelledby="kpis-titulo" aria-busy={carregando || atualizando}
      className={`grid auto-rows-fr items-stretch gap-4 transition-opacity ${colunas} ${atualizando ? "opacity-50" : ""}`}>
      <h2 id="kpis-titulo" className="sr-only">{titulo}</h2>
      {children}
    </section>
  );
}

/** Um card de destaque em 3 áreas de altura previsível: cabeçalho (chip + rótulo), valor grande e
 * rodapé (detalhe) ancorado embaixo. Assim o número fica na mesma linha em todos os cards da fileira.
 *
 * - `rotulo`: texto curto do cabeçalho ("CGR do mês"). Com `sigla`, o cabeçalho mostra a sigla em
 *   destaque e o `nome` completo numa linha menor que corta com "…" (o nome inteiro fica no `title`).
 * - `detalhe`: linha de baixo. Aceita texto ou JSX (ex.: a seta de tendência do Dashboard).
 * - `cor`: cor CSS do chip do ícone (ex.: "var(--chart-azul)"), para ligar o card à legenda dos
 *   gráficos. Sem ela, o chip fica no azul padrão. */
export function Kpi({ icone, rotulo, sigla, nome, valor, detalhe, carregando, cor }: {
  icone: ReactNode; rotulo?: ReactNode; sigla?: string; nome?: string;
  valor: ReactNode; detalhe: ReactNode; carregando: boolean; cor?: string;
}) {
  // color-mix tinge o fundo do chip com 14% da cor do gráfico, sem precisar de uma 2ª variável.
  const estiloChip = cor
    ? { color: cor, backgroundColor: `color-mix(in srgb, ${cor} 14%, transparent)` }
    : undefined;

  return (
    <Card className={`${CARD_KPI} h-full`}>
      <Card.Header className="flex-row items-center gap-2.5">
        <span className={`flex size-7 shrink-0 items-center justify-center rounded-md ${cor ? "" : "bg-sky-500/10 text-sky-300"}`}
          style={estiloChip}>
          {icone}
        </span>
        {sigla ? (
          <span className="min-w-0 flex-1">
            <Card.Title className="text-sm font-semibold leading-5 text-white">{sigla}</Card.Title>
            <Card.Description className="truncate text-xs leading-4 text-zinc-500" title={nome}>{nome}</Card.Description>
          </span>
        ) : (
          <Card.Title className="min-w-0 text-xs font-semibold leading-4 text-zinc-400">{rotulo}</Card.Title>
        )}
      </Card.Header>

      {/* Valor: fica colado no cabeçalho (mesma linha em todos os cards) e, por ser flex-1,
          empurra o rodapé para o pé do card mesmo quando o detalhe do vizinho tem 2 linhas. */}
      <Card.Content className="mt-3 gap-0">
        {carregando
          ? <Skeleton className="h-7 w-3/4 sm:h-8" />
          : <p className="truncate text-xl font-semibold leading-7 tabular-nums text-white sm:text-2xl sm:leading-8">{valor}</p>}
      </Card.Content>

      <Card.Footer className="mt-1 min-h-4">
        {carregando ? (
          <>
            <Skeleton className="h-3 w-1/2 rounded" />
            <span className="sr-only">Carregando…</span>
          </>
        ) : (
          <p className="min-w-0 text-xs leading-4 tabular-nums text-zinc-500">{detalhe}</p>
        )}
      </Card.Footer>
    </Card>
  );
}
