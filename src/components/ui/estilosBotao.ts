/** Visual dos botões (um lugar só). Button.tsx e os links com cara de botão usam daqui. */

export type Variant = "solid" | "primary" | "success" | "danger" | "ghost" | "warning" | "purple";
export type Size = "sm" | "md" | "lg";

// solid: a ação principal da tela. Desabilitado fica cinza, sem azul, para não parecer clicável.
const variants: Record<Variant, string> = {
  solid: "border border-transparent bg-marinho text-paper hover:bg-marinho-claro disabled:bg-white/[0.06] disabled:text-zinc-400 disabled:shadow-none",
  primary: "border border-sky-500/25 bg-sky-500/10 hover:bg-sky-500/15 text-sky-400",
  success: "border border-emerald-500/25 bg-emerald-500/10 hover:bg-emerald-500/15 text-emerald-400",
  danger:  "border border-red-500/25 bg-red-500/10 hover:bg-red-500/15 text-red-400",
  ghost:   "border border-white/[0.07] bg-white/[0.03] hover:bg-white/[0.06] text-zinc-300",
  warning: "border border-amber-500/25 bg-amber-500/10 hover:bg-amber-500/15 text-amber-400",
  purple:  "border border-violet-500/25 bg-violet-500/10 hover:bg-violet-500/15 text-violet-400",
};

// min-h: alvo de toque confortável (1rem = 18px neste site: 2,5rem = 45px, 2,25rem = 40px).
const sizes: Record<Size, string> = {
  sm: "min-h-9 px-3 py-1.5 text-xs",
  md: "min-h-10 px-4 py-2 text-sm",
  lg: "min-h-11 px-6 py-3 text-base",
};

/** Classes do botão, para quem precisa de um link (<Link>) com a mesma cara de botão.
 * O botão sobe 1px no hover e afunda no clique (só sem "menos movimento"; veja index.css). */
export function classesDoBotao(variant: Variant = "primary", size: Size = "md", extra = ""): string {
  return `btn-passo inline-flex items-center justify-center gap-2 rounded-lg font-semibold transition-[color,background-color,border-color,transform] duration-150 ${variants[variant]} ${sizes[size]} ${extra}`.trim();
}
