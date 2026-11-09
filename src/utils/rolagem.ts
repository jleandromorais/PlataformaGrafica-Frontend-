/** Leva a vista até o card se o topo dele não estiver na tela (telas estreitas, onde a prova
 * real fica acima da tabela). Sem animação para quem pediu menos movimento. */
export function rolarAteCardSeEscondido(card: HTMLElement | null) {
  if (!card) return;
  const { top } = card.getBoundingClientRect();
  const visivel = top >= 0 && top < window.innerHeight - 120; // o topo do card aparece na tela
  if (visivel) return;
  const semAnimacao = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  card.scrollIntoView({ behavior: semAnimacao ? "auto" : "smooth", block: "start" });
}
