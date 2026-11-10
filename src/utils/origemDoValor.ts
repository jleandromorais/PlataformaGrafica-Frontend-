/** Selo de uma origem numa prova real: sem itens para provar, confere ou não confere. */
export type SeloOrigem = "confere" | "diverge" | "sem_itens";

export function seloDaOrigem(temItens: boolean, confere: boolean): SeloOrigem {
  return !temItens ? "sem_itens" : confere ? "confere" : "diverge";
}
