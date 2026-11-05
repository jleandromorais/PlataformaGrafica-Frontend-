/** "Esqueleto": bloco cinza com brilho passando, no lugar do conteúdo que ainda está
 * carregando. Tamanho e forma vêm de `className` (ex.: "h-3 w-2/5"). Leitores de tela
 * ignoram o bloco; quem usa avisa "Carregando…" em texto (sr-only). */
export function Skeleton({ className = "" }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={`animate-shine rounded-lg bg-neutral-200/90 bg-linear-to-r from-transparent via-[rgb(255_255_255/0.55)] to-transparent bg-size-[200%_100%] bg-no-repeat dark:bg-neutral-800/90 dark:via-[rgb(255_255_255/0.06)] ${className}`}
    />
  );
}
