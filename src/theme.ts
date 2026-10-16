/**
 * Paleta semântica única do front-end. Ver SPEC_DESIGN_SYSTEM.md §3.1/§5.
 *
 * Regra: cor comunica o PAPEL do dado, não o "gosto" da página. Um mesmo
 * tom (ex. emerald) deve sempre significar a mesma coisa em qualquer tela —
 * nunca "positivo aqui" e "nome do módulo CGF" ali.
 */

export const semantic = {
  positive: { text: "text-emerald-400", border: "border-emerald-500/40", bg: "bg-emerald-500/10" },
  negative: { text: "text-red-400", border: "border-red-500/40", bg: "bg-red-500/10" },
  neutral: { text: "text-amber-400", border: "border-amber-500/40", bg: "bg-amber-500/10" },
  info: { text: "text-sky-400", border: "border-sky-500/40", bg: "bg-sky-500/10" },
  action: { text: "text-white", border: "border-blue-600", bg: "bg-blue-600" },
} as const;

export type SemanticRole = keyof typeof semantic;

/** Retorna o papel semântico (positive/negative/neutral) para um valor numérico. */
export function roleForValue(value: number): "positive" | "negative" | "neutral" {
  if (value > 0) return "positive";
  if (value < 0) return "negative";
  return "neutral";
}

export function colorForValue(value: number): string {
  return semantic[roleForValue(value)].text;
}

/**
 * Cor de identidade de cada módulo — usada só na Sidebar e em títulos de
 * página (ícone + heading). NÃO usar para indicar positivo/negativo/aviso
 * dentro do conteúdo da página; isso é sempre `semantic`.
 */
export const moduleColor: Record<string, string> = {
  dashboard: "text-sky-400",
  pmpv: "text-blue-400",
  cgf: "text-emerald-400",
  auditoria: "text-violet-400",
  conciliacao: "text-orange-400",
  ret: "text-yellow-400",
  pr: "text-pink-400",
  pv: "text-teal-400",
  rpv: "text-indigo-400",
  scg: "text-red-400",
  sr: "text-cyan-400",
  excel: "text-emerald-400",
};
