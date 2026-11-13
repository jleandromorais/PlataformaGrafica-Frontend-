import { Kpi } from "./KpiCard";
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

/** Esqueleto de um card de número quando nem o rótulo é conhecido ainda. É o próprio `Kpi` em
 * modo `carregando`, com chip e rótulo em cinza: mesma estrutura e alturas do card real, sem pulo.
 * Se o rótulo já for conhecido, prefira `<Kpi carregando rotulo=... />` direto. */
export function EsqueletoKpi({ className = "" }: { className?: string }) {
  return (
    <div className={`h-full ${className}`} aria-hidden>
      <Kpi carregando icone={<Skeleton className="size-4 rounded" />}
        rotulo={<Skeleton className="h-3 w-24 rounded" />} valor={null} detalhe={null} />
    </div>
  );
}
