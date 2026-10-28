import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { lerPeriodo } from "./periodos";

type Chave = "periodo" | "trimestre";

/** Endereço de uma tela aberta pelo Painel do Ciclo: o período e o trimestre do
 * Painel, para a tela abrir no lugar certo e oferecer a volta (`?de=ciclo`). */
export function linkDoCiclo(rota: string, cicloInicio: string, periodo?: { chave: Chave; valor: string }) {
  const p = new URLSearchParams();
  if (periodo) p.set(periodo.chave, periodo.valor);
  p.set("de", "ciclo");
  p.set("ciclo", cicloInicio);
  return `${rota}?${p}`;
}

/** Período com que a tela abriu (`?periodo=Mai/2026`), ou null se não veio ou é inválido. */
export function usePeriodoDaUrl(chave: Chave) {
  const [params] = useSearchParams();
  const [inicial] = useState(() => lerPeriodo(params.get(chave)));
  return inicial;
}

/** Mantém o endereço igual ao período da tela: recarregar ou compartilhar o link
 * abre no mesmo período. Os outros parâmetros (ex.: `de=ciclo`) ficam. */
export function useManterPeriodoNaUrl(chave: Chave, atual: string) {
  const [params, setParams] = useSearchParams();
  useEffect(() => {
    if (!lerPeriodo(atual) || params.get(chave) === atual) return;
    setParams((p) => { p.set(chave, atual); return p; }, { replace: true });
  }, [atual, chave, params, setParams]);
}
