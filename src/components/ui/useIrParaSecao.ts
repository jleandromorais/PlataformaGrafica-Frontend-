/** "Clicou no problema, foi para o problema": rola até a seção, abre o que estiver fechado (<details>),
 * leva o foco para o título dela e a destaca por ~2 s (classe `realce-secao` no index.css).
 * Usado pelo quadro da comparação com a planilha e pelo toast "Ver diferenças".
 * Quem tem `prefers-reduced-motion` ligado recebe a rolagem sem animação. */
import { useCallback, useId } from "react";

const REALCE_MS = 2000;
/** O Painel do Ciclo escuta este evento e mostra o painel do passo (`detail` = chave do passo). */
export const EVENTO_ABRIR_PAINEL = "ciclo:abrir-painel";

/** Vai até o elemento de id `id`. Devolve false se ele não existe (ainda não foi desenhado). */
export function irParaSecao(id: string): boolean {
  const el = document.getElementById(id);
  if (!el) return false;
  // Seção dentro de um painel escondido (Painel do Ciclo): pede para mostrar o painel e tenta de novo.
  const painel = el.closest<HTMLElement>("[data-painel]");
  if (painel?.hidden) {
    window.dispatchEvent(new CustomEvent(EVENTO_ABRIR_PAINEL, { detail: painel.dataset.painel }));
    window.setTimeout(() => irParaSecao(id), 80);
    return true;
  }
  if (el instanceof HTMLDetailsElement) el.open = true; // o analista pode ter fechado a lista
  const reduzir = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches
    || document.documentElement.dataset.reduceMotion === "true";
  el.scrollIntoView({ behavior: reduzir ? "auto" : "smooth", block: "start" });
  // O foco vai para o título (summary ou cabeçalho), para o leitor de tela anunciar onde chegou.
  const titulo = el.querySelector<HTMLElement>("summary, h2, h3");
  const alvo = titulo ?? el;
  if (!alvo.hasAttribute("tabindex") && alvo.tagName !== "SUMMARY") alvo.setAttribute("tabindex", "-1");
  alvo.focus({ preventScroll: true });
  el.setAttribute("data-realce", "true");
  window.setTimeout(() => el.removeAttribute("data-realce"), REALCE_MS);
  return true;
}

/** Id do quadro inteiro da comparação com a planilha (o toast "Ver diferenças" leva até ele). */
export const ID_QUADRO_COMPARACAO = "quadro-comparacao-planilha";

/** Ids únicos por tela para as seções de um quadro: `idDe("planilha")` vai no elemento, `ir("planilha")` leva até ele. */
export function useIrParaSecao() {
  const uid = useId();
  const idDe = useCallback((secao: string) => `${uid}-${secao}`, [uid]);
  const ir = useCallback((secao: string) => irParaSecao(`${uid}-${secao}`), [uid]);
  return { idDe, ir };
}
