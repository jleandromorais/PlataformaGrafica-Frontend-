/** Qual passo o painel da direita mostra. O analista escolhe na trilha; sem escolha, abre o próximo passo
 * (e, sem próximo, o último). Função pura: o Painel só guarda a escolha. */
import type { ChavePasso } from "./proximoPasso";

/** Passos 2 a 5: o trabalho deles é um só, "Processar a pasta". */
export const PASSOS_DA_PASTA: ChavePasso[] = ["auditoria", "cgf", "ret", "rp"];

export function passoSelecionado(escolhido: ChavePasso | null, proximo: ChavePasso | null, chaves: ChavePasso[]): ChavePasso | null {
  if (escolhido && chaves.includes(escolhido)) return escolhido;
  if (proximo && chaves.includes(proximo)) return proximo;
  return chaves.length ? chaves[chaves.length - 1] : null;
}
