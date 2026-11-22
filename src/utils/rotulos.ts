/** Como a tela escreve um período. Só exibição: as chaves gravadas no banco
 * ("Nov - Jan/2027" no PR, "Nov - Jan/2026" no PV) não passam por aqui e não mudam. */
import { mesesDoTrimestre } from "./periodos";

export type GradeDoTrimestre = "civil" | "ciclo";

/** "Jul a Set/2026"; se mudar o ano, "Nov/2026 a Jan/2027". */
export function faixaDosMeses(meses: string[]): string {
  if (!meses.length) return "";
  const primeiro = meses[0];
  const ultimo = meses[meses.length - 1];
  if (meses.length === 1) return primeiro;
  const [m1, a1] = primeiro.split("/");
  return a1 === ultimo.split("/")[1] ? `${m1} a ${ultimo}` : `${primeiro} a ${ultimo}`;
}

const ETIQUETA: Record<GradeDoTrimestre, string> = { civil: "(civil)", ciclo: "(ciclo)" };

/** Faixa dos meses; com `grade`, leva a etiqueta "(civil)" ou "(ciclo)" (use quando as duas grades aparecem juntas). */
export function rotuloDoPeriodo(meses: string[], grade?: GradeDoTrimestre): string {
  const faixa = faixaDosMeses(meses);
  return grade && faixa ? `${faixa} ${ETIQUETA[grade]}` : faixa;
}

/** Trimestre do ciclo escrito com os meses reais. `ano` é o do 1º mês (como o PMPV e o PV guardam):
 * ("Nov - Jan", 2026) → "Nov/2026 a Jan/2027". Aceita o travessão que as telas usavam. */
export function rotuloDoTrimestreDoCiclo(trimestre: string, ano: number, grade?: GradeDoTrimestre): string {
  const primeiro = /^([A-Z][a-z]{2}) [-–] [A-Z][a-z]{2}$/.exec(trimestre)?.[1];
  if (!primeiro) return trimestre;
  return rotuloDoPeriodo(mesesDoTrimestre(primeiro, ano), grade);
}

/** Nome de trimestre para botão: "Jan – Mar" e "Nov - Jan" viram "Jan a Mar" e "Nov a Jan". */
export const rotuloCurtoDoTrimestre = (nome: string) => nome.replace(/ [-–] /, " a ");
