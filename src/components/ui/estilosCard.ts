/** Visuais do Card da HeroUI usados nas telas da Conta Gráfica (um lugar só, para as 7 telas
 * ficarem iguais). As classes do Tailwind ganham das da HeroUI (que ficam na camada "components"). */

/** Painel neutro do projeto: borda fina, fundo do painel, cantos xl e sem sombra. */
export const CARD_PAINEL = "gap-0 rounded-xl border border-white/[0.07] bg-panel p-5 shadow-none sm:p-6";

/** Card da Fórmula em vinho, para chamar a atenção. Cores em src/index.css (--color-vinho-*),
 * com versão clara e escura. */
export const CARD_VINHO = "gap-0 rounded-xl border border-vinho-borda bg-vinho-fundo p-5 shadow-none sm:p-6";

/** Card de destaque (KPI): mesmo painel neutro, mais compacto. `card-hover` liga o hover dos cards pequenos (index.css).
 * Só os cards pequenos de destaque têm hover; painéis grandes (CARD_PAINEL, CARD_VINHO) não. */
export const CARD_KPI = "card-hover gap-0 rounded-xl border border-white/[0.07] bg-panel p-4 shadow-none sm:p-5";
