/** Sinal de menos tipográfico (U+2212). Diferente do hífen, o navegador não
 * quebra a linha entre ele e o número: "−R$ 1.212,80" nunca vira "−" sozinho. */
export const MENOS = "\u2212";

/** Troca o hífen inicial gerado pelo toLocaleString pelo sinal de menos. */
function comMenos(texto: string): string {
  return texto.startsWith("-") ? MENOS + texto.slice(1) : texto;
}

export function brl(value: number, decimals = 2): string {
  return comMenos(value.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }));
}

/** Lê valores digitados em real: "R$ 1.234,56", "1234,56", "1234.56",
 * "1.234.567". Mesma regra de Src/common/formatting.parse_brl, exceto que
 * vários pontos sem vírgula são separadores de milhar (lá virava 0).
 * Retorna null quando o texto não é um número. */
export function parseBRL(texto: string): number | null {
  let t = texto.replace(/R\$|\s|\/m³|m³/g, "");
  if (!t) return null;
  const negativo = t.startsWith("-") || t.startsWith(MENOS);
  t = t.replace(/^[-+\u2212]/, "");
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
  return comMenos(value.toLocaleString("pt-BR", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }));
}

export function pct(value: number): string {
  return `${comMenos((value * 100).toFixed(2).replace(".", ","))}%`;
}

/** Data/hora do banco ("2026-10-23 12:34", ISO com "T" ou só a data) em
 * pt-BR: "23/10/2026 12:34". Texto que não é data volta como veio. */
export function dataHora(texto: string | null | undefined): string {
  if (!texto) return "—";
  const m = /^(\d{4})-(\d{2})-(\d{2})(?:[T ](\d{2}):(\d{2}))?/.exec(texto);
  if (!m) return texto;
  const [, ano, mes, dia, h, min] = m;
  return h ? `${dia}/${mes}/${ano} ${h}:${min}` : `${dia}/${mes}/${ano}`;
}

export function m3(value: number): string {
  return `${num(value)} m³`;
}

/** Formato compacto em pt-BR para eixos e deltas (ex: "R$ 5,9 mi", "−R$ 120 mil").
 * Espaços inseparáveis: o valor nunca quebra de linha. */
export function brlCompact(value: number): string {
  const sinal = value < 0 ? MENOS : "";
  const abs = Math.abs(value);
  if (abs >= 1_000_000_000) return `${sinal}R$\u00a0${(abs / 1_000_000_000).toFixed(1).replace(".", ",")}\u00a0bi`;
  if (abs >= 1_000_000) return `${sinal}R$\u00a0${(abs / 1_000_000).toFixed(1).replace(".", ",")}\u00a0mi`;
  if (abs >= 1_000) return `${sinal}R$\u00a0${(abs / 1_000).toFixed(0)}\u00a0mil`;
  return `${sinal}R$\u00a0${abs.toFixed(0)}`;
}
