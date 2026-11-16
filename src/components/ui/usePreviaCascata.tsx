/** Gancho para as telas que têm "Salvar": guarda a prévia da cascata que o Salvar devolveu e entrega o
 * bloco pronto para pôr na tela. Uso:
 *   const { previa, mostrarCascata } = usePreviaCascata();
 *   depois de salvar:  mostrarCascata(r.cascata);
 *   no JSX:            {previa}
 * Resposta sem `cascata` (back antigo) ou sem nada desatualizado: não aparece nada. */
import { useCallback, useState } from "react";
import type { Cascata } from "../../types";
import { PreviaCascata } from "./PreviaCascata";

export function usePreviaCascata(className = "") {
  const [cascata, setCascata] = useState<Cascata | null>(null);

  /** Guarda a prévia (só se houver algo para aprovar ou pendência); null/undefined limpa. */
  const mostrarCascata = useCallback((c: Cascata | null | undefined) => {
    const temAlgo = !!c && (c.desatualizado || c.pendencias.length > 0 || c.trimestres.some((t) => t.pendencias.length > 0));
    setCascata(temAlgo ? c : null);
  }, []);

  const previa = cascata
    ? <PreviaCascata key={cascata.periodos.join("|")} cascata={cascata} className={className} aoFechar={() => setCascata(null)} />
    : null;
  return { previa, mostrarCascata };
}
