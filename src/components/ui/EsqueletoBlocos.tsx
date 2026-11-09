import { Skeleton } from "./Skeleton";

/** Esqueleto genérico de card: uma pilha de blocos, cada um com a altura que o conteúdo real
 * terá (ex.: ["h-40", "h-28"] para dois quadros de conta). Usado na prova real das telas. */
export function EsqueletoBlocos({ blocos, texto = "Carregando…", className = "" }: {
  /** Altura de cada bloco (classe do Tailwind, ex.: "h-24"). */
  blocos: string[];
  /** Lido pelo leitor de tela; não aparece na tela. */
  texto?: string;
  className?: string;
}) {
  return (
    <div role="status" className={`mt-4 space-y-3 ${className}`}>
      <span className="sr-only">{texto}</span>
      {blocos.map((h, i) => <Skeleton key={i} className={`${h} w-full`} />)}
    </div>
  );
}

/** Esqueleto de um card de número (rótulo, valor grande e variação) no tamanho do real. */
export function EsqueletoKpi({ className = "" }: { className?: string }) {
  return (
    <div className={`rounded-xl border border-white/[0.07] bg-panel p-5 sm:p-6 ${className}`} aria-hidden>
      <Skeleton className="h-3 w-24 rounded" />
      <Skeleton className="mt-4 h-7 w-44" />
      <Skeleton className="mt-3 h-3 w-24 rounded" />
    </div>
  );
}
