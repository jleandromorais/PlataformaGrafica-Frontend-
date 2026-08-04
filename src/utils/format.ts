export function brl(value: number, decimals = 2): string {
  return value.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
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
