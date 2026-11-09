/** Cards de destaque (KPIs) do topo das telas da Conta Gráfica: HeroUI Card + hover (`card-hover`). */
import type { ReactNode } from "react";
import { Card } from "@heroui/react";
import { CARD_KPI } from "./estilosCard";
import { Skeleton } from "./Skeleton";

/** Faixa com os cards de destaque: 2 colunas em telas pequenas, 4 em xl. Esmaece ao trocar de mês. */
export function GradeKpis({ titulo, carregando, atualizando, children }: {
  titulo: string; carregando: boolean; atualizando: boolean; children: ReactNode;
}) {
  return (
    <section aria-labelledby="kpis-titulo" aria-busy={carregando || atualizando}
      className={`grid grid-cols-2 gap-4 transition-opacity xl:grid-cols-4 ${atualizando ? "opacity-50" : ""}`}>
      <h2 id="kpis-titulo" className="sr-only">{titulo}</h2>
      {children}
    </section>
  );
}

/** Um card de destaque: rótulo pequeno, valor grande e uma linha de detalhe. */
export function Kpi({ icone, rotulo, valor, detalhe, carregando }: {
  icone: ReactNode; rotulo: string; valor: ReactNode; detalhe: ReactNode; carregando: boolean;
}) {
  return (
    <Card className={CARD_KPI}>
      <Card.Header className="flex-row items-center gap-2">
        <span className="flex size-7 items-center justify-center rounded-md bg-sky-500/10 text-sky-300">{icone}</span>
        <Card.Title className="text-xs font-semibold text-zinc-400">{rotulo}</Card.Title>
      </Card.Header>
      <Card.Content className="mt-3 gap-1">
        {carregando ? (
          <>
            <Skeleton className="h-7 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
            <span className="sr-only">Carregando…</span>
          </>
        ) : (
          <>
            <p className="truncate text-xl font-semibold tabular-nums text-white sm:text-2xl">{valor}</p>
            <p className="text-xs tabular-nums text-zinc-500">{detalhe}</p>
          </>
        )}
      </Card.Content>
    </Card>
  );
}
