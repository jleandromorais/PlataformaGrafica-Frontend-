/** Os 9 passos que o back novo devolve em GET /ciclo/situacao (campo `etapas`, aditivo).
 * Quando vêm completos e válidos, o Painel usa o estado deles (uma fonte só, no servidor);
 * quando não vêm (back antigo) ou vêm estranhos, o Painel calcula sozinho, como sempre fez.
 * Módulo puro. Spec: docs/specs/SPEC_FLUXO_UNICO.md, seção 7. */
import { ETAPAS_NUMERADAS } from "../../utils/etapasDoCiclo";
import type { SituacaoCiclo } from "../../types";
import type { ChavePasso, EntradaPasso, SituacaoPasso } from "./proximoPasso";

export interface EtapaDoBack {
  situacao: SituacaoPasso;
  mesesQueFaltam: string[];
  motivo: string;
}

export type EtapasDoBack = Partial<Record<ChavePasso, EtapaDoBack>>;

/** O Painel conhece "ok, atenção, falta"; o "bloqueado" do back (depende de outro passo) é, para o passo, "não está pronto":
 * o motivo do bloqueio e o link continuam sendo montados pelo Painel (`calcularProximoPasso`). */
const SITUACAO: Record<string, SituacaoPasso> = { pronto: "ok", atencao: "atencao", falta: "falta", bloqueado: "falta" };

/** null = não confie: o campo não veio, veio incompleto, com passo desconhecido ou com estado inválido. */
export function etapasDoBack(situacao: SituacaoCiclo | null | undefined): EtapasDoBack | null {
  const lista = situacao?.etapas;
  if (!Array.isArray(lista) || lista.length !== ETAPAS_NUMERADAS.length) return null;
  const esperadas = new Set<string>(ETAPAS_NUMERADAS.map((e) => e.chave));
  const resultado: EtapasDoBack = {};
  for (const e of lista) {
    if (!e || typeof e.chave !== "string" || !esperadas.has(e.chave) || !(e.estado in SITUACAO) || e.chave in resultado) return null;
    resultado[e.chave as ChavePasso] = {
      situacao: SITUACAO[e.estado],
      mesesQueFaltam: Array.isArray(e.meses_que_faltam) ? e.meses_que_faltam : [],
      motivo: typeof e.motivo === "string" ? e.motivo : "",
    };
  }
  return resultado;
}

/** Troca a situação e os meses que faltam dos passos que o back conhece; o resto (tarifa média) fica como o Painel calculou. */
export function aplicarEtapasDoBack<T extends EntradaPasso>(passos: T[], doBack: EtapasDoBack | null): T[] {
  if (!doBack) return passos;
  return passos.map((p) => {
    const e = doBack[p.chave];
    return e ? { ...p, situacao: e.situacao, mesesQueFaltam: e.mesesQueFaltam.length ? e.mesesQueFaltam : undefined } : p;
  });
}
