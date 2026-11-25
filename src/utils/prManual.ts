/** PR digitado à mão (POST /pr/manual): regras puras da célula "PR (R$/m³)" do SR. Quem soma, arredonda e grava
 * é o back; aqui só se lê o que o analista digitou, se escolhe a chave do trimestre da tarifa e se escreve o texto. */
import { brl } from "./format";
import { lerPeriodo, MESES_ABREV } from "./periodos";

/** Mínimo de letras do motivo (a mesma regra do back). */
export const MOTIVO_MINIMO = 5;
export const motivoDoPRValido = (motivo: string) => motivo.trim().length >= MOTIVO_MINIMO;

/** Acima disso o PR é quase certamente erro de digitação (a mesma trava do back). */
export const LIMITE_PR = 5;

/** O que o analista digitou ("-0,0321", "−0,0321", "0.0321") → número com 4 casas; null se não dá para ler. */
export function lerPRDigitado(texto: string): number | null {
  const limpo = texto.trim().replace(/\s/g, "").replace(/[−–]/g, "-").replace(/\./g, (_m, _i, s: string) => (s.includes(",") ? "" : "."))
    .replace(",", ".");
  if (!/^-?\d+(\.\d+)?$/.test(limpo)) return null;
  const n = Math.round(Number(limpo) * 1e4) / 1e4;
  return Number.isFinite(n) ? n : null;
}

/** Por que o valor digitado não serve (null = serve). Texto simples, para mostrar embaixo do campo. */
export function problemaDoPRDigitado(texto: string): string | null {
  if (!texto.trim()) return null; // campo vazio: ainda não digitou
  const n = lerPRDigitado(texto);
  if (n === null) return "Digite o PR como número, por exemplo -0,0321.";
  if (n === 0) return "O PR não pode ser zero. Para voltar ao estimado, use “Usar o estimado”.";
  if (Math.abs(n) > LIMITE_PR) return "Esse PR parece errado: ele costuma ser de centavos por m³. Confira o valor.";
  return null;
}

/** "Nov - Jan/2027" etc.: a chave do trimestre da TARIFA que contém o mês, com o ano do ÚLTIMO mês (como o PR grava). */
export function chaveDoPRDoMes(mes: string): string | null {
  const p = lerPeriodo(mes);
  if (!p) return null;
  const inicio = [10, 7, 4, 1].find((i) => i <= p.mes) ?? 10;       // Nov, Ago, Mai, Fev (do fim para o começo)
  const anoInicio = [10, 7, 4, 1].some((i) => i <= p.mes) ? p.ano : p.ano - 1;
  const ultimo = (inicio + 2) % 12;
  const anoFim = ultimo < inicio ? anoInicio + 1 : anoInicio;
  return `${MESES_ABREV[inicio]} - ${MESES_ABREV[ultimo]}/${anoFim}`;
}

/** "PR manual · −0,0321 · motivo · 25/11 14:02" (a linha que fica na célula depois de gravado). */
export function textoDoPRManual(l: { pr: number; pr_motivo?: string; pr_usuario?: string; pr_data?: string }): string {
  const data = /^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}:\d{2})/.exec(l.pr_data ?? "");
  return ["PR manual", brl(l.pr, 4), l.pr_motivo || null, data ? `${data[3]}/${data[2]} ${data[4]}` : null, l.pr_usuario || null]
    .filter(Boolean).join(" · ");
}

/** Meses do trimestre aberto que usam a mesma chave de PR (um PR vale para os 3 meses da tarifa). */
export const mesesDaChave = (meses: string[], chave: string) => meses.filter((m) => chaveDoPRDoMes(m) === chave);

/** O mês é o 1º da tabela com a sua chave de PR? Só ele leva o campo "Informar PR" (Mai e Jun dividem um PR). */
export const primeiroMesDaChave = (meses: string[], mes: string) => {
  const chave = chaveDoPRDoMes(mes);
  return chave !== null && mesesDaChave(meses, chave)[0] === mes;
};
