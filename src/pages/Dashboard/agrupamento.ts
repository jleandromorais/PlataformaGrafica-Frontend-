// ─── Agrupamento Mensal / Trimestral / Anual dos gráficos do Dashboard ──────
export type Agrupamento = "mes" | "trimestre" | "ano";
export type Trimestre = { label: string; meses: string[] };
export type ComMeses<T> = T & { qtd_meses: number };

export const AGRUPAMENTOS: { valor: Agrupamento; rotulo: string; unidade: string }[] = [
  { valor: "mes", rotulo: "Mensal", unidade: "mês" },
  { valor: "trimestre", rotulo: "Trimestral", unidade: "trimestre" },
  { valor: "ano", rotulo: "Anual", unidade: "ano" },
];

/** Grupo de um período "Mmm/AAAA": o próprio mês, o trimestre civil
 *  ("Jan - Mar/2026", como CGF e RET na planilha) ou o ano ("2026"). */
export function grupoDoPeriodo(periodo: string, agrupamento: Agrupamento, trimestres: Trimestre[]) {
  if (agrupamento === "mes") return periodo;
  const [mes, ano] = periodo.split("/");
  if (agrupamento === "ano") return ano;
  const tri = trimestres.find((t) => t.meses.includes(mes));
  return tri ? `${tri.label}/${ano}` : periodo;
}

/** Soma os meses de cada grupo, na ordem em que chegam (a API já manda em ordem cronológica). */
export function agrupar<T extends { periodo: string }>(
  meses: T[], agrupamento: Agrupamento, trimestres: Trimestre[], somar: (a: T, b: T) => T,
): ComMeses<T>[] {
  const grupos = new Map<string, ComMeses<T>>();
  for (const m of meses) {
    const periodo = grupoDoPeriodo(m.periodo, agrupamento, trimestres);
    const atual = grupos.get(periodo);
    grupos.set(periodo, atual
      ? { ...somar(atual, m), periodo, qtd_meses: atual.qtd_meses + 1 }
      : { ...m, periodo, qtd_meses: 1 });
  }
  return [...grupos.values()];
}

export const unidadeDe = (a: Agrupamento) => AGRUPAMENTOS.find((x) => x.valor === a)!.unidade;
export const mesesComDados = (n: number) => `${n} ${n === 1 ? "mês" : "meses"}`;
