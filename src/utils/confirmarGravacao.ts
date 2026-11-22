/** Regras da janela "Gravar ...?" das telas que gravam (SCG, SR, PR, PV, PMPV e o card do SR no Painel).
 * Módulo puro: só decide quando a janela aparece e escreve o texto; quem desenha é
 * `components/ui/ConfirmarGravacao.tsx`. Spec: docs/specs/SPEC_FLUXO_UNICO.md, seção 4 ("Decisão A").
 *
 * Regra: a janela abre quando a gravação SUBSTITUI um valor já gravado ou quando há DIVERGÊNCIA a
 * avisar. Sem uma coisa nem outra (primeira gravação, tudo conferido) ela não abre: janela vazia
 * ensina a clicar sem ler. A janela da Decisão A só protege o que o analista acabou de ler; a
 * aprovação do SR, do PR e do PV que vêm à frente (Decisão B) continua sendo um bloco do Painel. */

export type Afetado = "SR" | "PR" | "PV";
export type TelaDeGravacao = "scg" | "sr" | "pr" | "pv" | "pmpv";

/** Gravar CGR, CGF, RET, RP ou SCG recalcula o SCG do mês e deixa SR, PR e PV à frente por aprovar. */
export const AFETADOS_DOS_MODULOS: Afetado[] = ["SR", "PR", "PV"];

/** O que cada gravação deixa desatualizado à frente (a cascata SR → PR → PV). O PV é o fim da linha. */
export const AFETADOS_DA_TELA: Record<TelaDeGravacao, Afetado[]> = {
  scg: AFETADOS_DOS_MODULOS,
  sr: ["PR", "PV"],
  pr: ["PV"],
  pv: [],
  pmpv: ["PV"],
};

export function precisaJanela({ substitui, diverge }: { substitui: boolean; diverge: boolean }): boolean {
  return substitui || diverge;
}

/** ["SR", "PR", "PV"] vira "o SR, o PR e o PV". */
export function listaDeAfetados(afetados: Afetado[]): string {
  const com = afetados.map((a) => `o ${a}`);
  return com.length <= 1 ? com.join("") : `${com.slice(0, -1).join(", ")} e ${com[com.length - 1]}`;
}

/** Frase da janela quando a gravação afeta o que vem à frente; sem nada afetado, null. */
export function textoDepoisDeGravar(afetados: Afetado[]): string | null {
  if (afetados.length === 0) return null;
  return `Depois de gravar, você vai aprovar ${listaDeAfetados(afetados)} no Painel. Nada à frente é gravado sem isso.`;
}

/** "Gravar o SCG de Mar/2026?", ou "Gravar com divergências?" quando há. */
export function tituloDaJanela(oque: string, diverge: boolean): string {
  return diverge ? "Gravar com divergências?" : `Gravar ${oque}?`;
}

export function rotuloDaAcao(rotulo: string, diverge: boolean): string {
  return diverge ? "Gravar com divergências" : rotulo;
}
