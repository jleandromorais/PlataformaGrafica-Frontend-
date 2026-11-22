/** Onde se grava o SR, o PR e o PV: nos cartões do Painel do Ciclo (spec do Fluxo único, fase 5).
 * As telas /sr, /pr e /pv são de consulta e levam até o cartão certo, no trimestre certo.
 * Módulo puro: só monta endereços e valida o que veio na URL. */
import { ROTA_INICIAL } from "../router/rotas";
import { deslocaPeriodo, lerPeriodo } from "./periodos";

export type PassoDeGravar = "sr" | "pr" | "pv";

/** Ids dos cartões no Painel (`irParaSecao` rola até eles e abre o que estiver recolhido). */
export const ID_CARTAO: Record<PassoDeGravar, string> = {
  sr: "sr-do-trimestre",
  pr: "pr-do-trimestre",
  pv: "pv-do-trimestre",
};

/** 1º mês do trimestre CIVIL que define o PR e o PV do trimestre do ciclo que começa em `primeiroMesDoCiclo`
 * (Nov/2026 → Jul/2026: o Nov–Jan se define com o Jul–Set). null se o mês não for válido. */
export function primeiroMesCivilDoCiclo(primeiroMesDoCiclo: string | null | undefined): string | null {
  return lerPeriodo(primeiroMesDoCiclo) ? deslocaPeriodo(primeiroMesDoCiclo!, -4) : null;
}

/** Painel no trimestre civil `primeiroMesCivil` ("Jul/2026"), pedindo para abrir o cartão do passo. */
export function linkParaGravarNoPainel(passo: PassoDeGravar, primeiroMesCivil: string | null | undefined): string {
  const p = new URLSearchParams();
  if (lerPeriodo(primeiroMesCivil)) p.set("trimestre", primeiroMesCivil!);
  p.set("abrir", passo);
  return `${ROTA_INICIAL}?${p}`;
}

/** Da tela PR: parte do 1º mês do trimestre do ciclo. */
export const linkParaGravarPR = (primeiroMesDoCiclo: string | null | undefined) =>
  linkParaGravarNoPainel("pr", primeiroMesCivilDoCiclo(primeiroMesDoCiclo));

/** Da tela PV: parte do 1º mês do trimestre do ciclo. */
export const linkParaGravarPV = (primeiroMesDoCiclo: string | null | undefined) =>
  linkParaGravarNoPainel("pv", primeiroMesCivilDoCiclo(primeiroMesDoCiclo));

/** `?abrir=pr` na URL do Painel → id do cartão; qualquer outra coisa → null. */
export function secaoPedidaNaUrl(valor: string | null | undefined): string | null {
  return valor && Object.prototype.hasOwnProperty.call(ID_CARTAO, valor) ? ID_CARTAO[valor as PassoDeGravar] : null;
}
