/** A planilha oficial escolhida no Painel vale só para o trimestre em que foi escolhida.
 * Sem isso, o relatório trimestral saía comparado com a planilha de outro trimestre. */
export interface PlanilhaEscolhida<T> {
  arquivo: T;
  /** Primeiro mês do trimestre civil (ex.: "Jul/2026"). */
  trimestre: string;
}

/** `null` (ou nenhum arquivo) = a escolha foi desfeita. */
export function escolherPlanilha<T>(arquivo: T | null, trimestre: string): PlanilhaEscolhida<T> | null {
  return arquivo ? { arquivo, trimestre } : null;
}

export function planilhaDoTrimestre<T>(escolhida: PlanilhaEscolhida<T> | null, trimestre: string): T | null {
  return escolhida && escolhida.trimestre === trimestre ? escolhida.arquivo : null;
}
