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
