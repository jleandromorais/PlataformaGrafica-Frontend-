export function brl(value: number, decimals = 2): string {
  return value.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

/** Lê valores digitados em real: "R$ 1.234,56", "1234,56", "1234.56",
 * "1.234.567". Mesma regra de Src/common/formatting.parse_brl, exceto que
 * vários pontos sem vírgula são separadores de milhar (lá virava 0).
 * Retorna null quando o texto não é um número. */
export function parseBRL(texto: string): number | null {
  let t = texto.replace(/R\$|\s|\/m³|m³/g, "");
  if (!t) return null;
  const negativo = t.startsWith("-");
  t = t.replace(/^[-+]/, "");
  if (t.includes(",")) t = t.replace(/\./g, "").replace(",", ".");
  else if ((t.match(/\./g) ?? []).length > 1) t = t.replace(/\./g, "");
  if (!/^\d+(\.\d+)?$/.test(t)) return null;
  const v = parseFloat(t);
  return negativo ? -v : v;
}

/** Número no formato de entrada pt-BR, sem "R$": 1234567.8 → "1.234.567,80". */
export function brlEntrada(value: number): string {
  return value.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

/** PMPV/PR (R$/m³) na precisão dos cálculos: 4 casas (igual ao desktop e
 * ao backend — Src/common/precisao.py). */
export function arredondarTarifa(valor: number): number {
  return Number(valor.toFixed(4));
}

export function num(value: number, decimals = 0): string {
  return value.toLocaleString("pt-BR", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

export function pct(value: number): string {
  return `${(value * 100).toFixed(2)}%`;
}

export function m3(value: number): string {
  return `${num(value)} m³`;
}

/** Formato compacto para eixos de gráfico (ex: "R$ 5,9M", "-R$ 120K"). */
export function brlCompact(value: number): string {
  const sinal = value < 0 ? "-" : "";
  const abs = Math.abs(value);
  if (abs >= 1_000_000) return `${sinal}R$ ${(abs / 1_000_000).toFixed(1).replace(".", ",")}M`;
  if (abs >= 1_000) return `${sinal}R$ ${(abs / 1_000).toFixed(0)}K`;
  return `${sinal}R$ ${abs.toFixed(0)}`;
}
