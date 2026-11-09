import { Skeleton as SkeletonHeroUI } from "@heroui/react";

/** "Esqueleto": bloco cinza com brilho passando, no lugar do conteúdo que ainda está
 * carregando. É o Skeleton da HeroUI v3 (mesma animação "shimmer", que o sistema desliga
 * para quem pediu menos movimento), só com as cores do projeto: cinza claro no tema claro,
 * cinza escuro no escuro. Tamanho e forma vêm de `className` (ex.: "h-3 w-2/5").
 * Leitores de tela ignoram o bloco; quem usa avisa "Carregando…" em texto (sr-only).
 * Para listas, tabelas, cards e provas reais, use os esqueletos prontos (EsqueletoLista,
 * LinhasEsqueleto, EsqueletoBlocos, EsqueletoKpi) em vez de montar um novo por tela. */
export function Skeleton({ className = "" }: { className?: string }) {
  return (
    <SkeletonHeroUI
      aria-hidden
      animationType="shimmer"
      className={`rounded-lg bg-neutral-200/90 after:via-[rgb(255_255_255/0.55)] dark:bg-neutral-800/90 dark:after:via-[rgb(255_255_255/0.06)] ${className}`}
    />
  );
}
