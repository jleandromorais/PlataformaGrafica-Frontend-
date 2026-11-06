import { Skeleton } from "./Skeleton";

/** Esqueleto de lista (modelo: demo "List" do Skeleton da HeroUI): cada item tem um
 * quadrado de ícone e duas linhas de texto. Fica no lugar da lista enquanto a API
 * responde, com o mesmo tamanho aproximado, para a tela não "pular". */
export function EsqueletoLista({
  linhas = 3,
  icone = true,
  texto = "Carregando…",
  className = "",
}: {
  linhas?: number;
  icone?: boolean;
  /** Lido pelo leitor de tela; não aparece na tela. */
  texto?: string;
  className?: string;
}) {
  return (
    <div role="status" className={`w-full space-y-4 ${className}`}>
      <span className="sr-only">{texto}</span>
      {Array.from({ length: linhas }).map((_, i) => (
        <div key={i} className="flex items-center gap-3">
          {icone && <Skeleton className="h-10 w-10 shrink-0" />}
          <div className="flex-1 space-y-2">
            <Skeleton className="h-3 w-full rounded" />
            <Skeleton className="h-3 w-4/5 rounded" />
          </div>
        </div>
      ))}
    </div>
  );
}
