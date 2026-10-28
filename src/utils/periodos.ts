/** Abreviações de mês usadas nos períodos "Mmm/AAAA" (iguais às do backend). */
export const MESES_ABREV = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

export const anoValido = (ano: number) => ano >= 2000 && ano <= 2100;

/** "Mai/2026" → { mes: 4, ano: 2026 }; qualquer outra coisa → null. */
export function lerPeriodo(texto: string | null | undefined): { mes: number; ano: number } | null {
  const m = /^([A-Z][a-z]{2})\/(\d{4})$/.exec(texto ?? "");
  const mes = m ? MESES_ABREV.indexOf(m[1]) : -1;
  return m && mes >= 0 && anoValido(Number(m[2])) ? { mes, ano: Number(m[2]) } : null;
}

/** O período `n` meses depois de "Mmm/AAAA" (antes, se `n` < 0). */
export function deslocaPeriodo(p: string, n: number): string {
  const [m, a] = p.split("/");
  const t = Number(a) * 12 + MESES_ABREV.indexOf(m) + n;
  return `${MESES_ABREV[t % 12]}/${Math.floor(t / 12)}`;
}

/** Os 3 meses do PR que o trimestre civil apurado define: começam 2 meses depois
 * do fim dele (Abr–Jun/26 → Ago, Set, Out/26; Out–Dez/26 → Fev, Mar, Abr/27). */
export const mesesDoPRDoCivil = (ultimoMesCivil: string) => [2, 3, 4].map((n) => deslocaPeriodo(ultimoMesCivil, n));
