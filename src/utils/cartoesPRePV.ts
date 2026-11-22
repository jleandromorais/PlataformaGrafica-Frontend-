/** Regras puras dos cartões do PR e do PV no Painel (as mesmas das telas /pr e /pv antes de virarem consulta).
 * As chaves gravadas NÃO mudam: PR usa o ano do ÚLTIMO mês ("Nov - Jan/2027"), PV o do 1º ("Nov - Jan/2026"). */
import { faixaDosMeses } from "./rotulos";

/** 1º mês do trimestre do ciclo → o nome que o PMPV, o PR e o PV gravam. */
export const FISCAIS: Record<string, string> = { Nov: "Nov - Jan", Fev: "Fev - Abr", Mai: "Mai - Jul", Ago: "Ago - Out" };

/** `mesesPR`: os 3 meses do trimestre do ciclo, ex.: ["Nov/2026", "Dez/2026", "Jan/2027"]. */
const rotuloFiscal = (mesesPR: string[]) => FISCAIS[mesesPR[0].split("/")[0]];

export function chaveDoPR(mesesPR: string[]): string {
  return `${rotuloFiscal(mesesPR)}/${mesesPR[mesesPR.length - 1].split("/")[1]}`;
}

export function chaveDoPV(mesesPR: string[]): { trimestre: string; ano: number; chave: string } {
  const ano = Number(mesesPR[0].split("/")[1]);
  const trimestre = rotuloFiscal(mesesPR);
  return { trimestre, ano, chave: `${trimestre}/${ano}` };
}

const TOL_TARIFA = 5e-5; // PR e PV têm 4 casas: abaixo de meio décimo-milésimo é a mesma conta

/** Gravar o PR troca um PR já gravado por outro valor? (a janela de confirmação abre) */
export const prSubstitui = (gravado: number | null, novo: number) => gravado !== null && Math.abs(gravado - novo) > 1e-9;

/** Gravar o PV troca um PV já gravado por outro valor? */
export const pvSubstitui = (gravado: number | null, novo: number) => gravado !== null && Math.abs(gravado - novo) > TOL_TARIFA;

/** "PR de Nov/2026 a Jan/2027", "PV de Fev a Abr/2026". */
export const rotuloDoCartao = (passo: "pr" | "pv", mesesPR: string[]) => `${passo.toUpperCase()} de ${faixaDosMeses(mesesPR)}`;
