/** Em que situação está a prova real do RET de um mês, e o que o analista deve fazer.
 * Só classifica o que o backend devolveu: nada aqui calcula o RET. */
import type { ProvaRealRET } from "../../types";

export type EstadoProvaRET = "nao_gravado" | "so_total" | "confere" | "diverge";

export function estadoDaProvaRET(d: ProvaRealRET): EstadoProvaRET {
  if (d.ret_gravado === null) return "nao_gravado";
  if (!d.tem_itens) return "so_total";
  return d.confere ? "confere" : "diverge";
}

/** Frase curta para quem sabe pouco: o que a situação quer dizer e o que fazer. */
export const ORIENTACAO_RET: Record<EstadoProvaRET, string> = {
  confere: "Está certo: o RET gravado é igual à conta refeita com os documentos do mês.",
  diverge: "O RET gravado é diferente da conta refeita com os documentos. Reprocesse o RET do mês no Painel do Ciclo para regravar.",
  so_total: "Este mês foi gravado só com o total, sem os documentos. Por isso não dá para refazer a conta. Para ter a prova real, processe os PDFs do mês no Painel do Ciclo.",
  nao_gravado: "Este mês ainda não foi gravado. Processe os PDFs do mês no Painel do Ciclo.",
};

/** "1 documento fora do RET" / "N documentos fora do RET". */
export function textoForaDoRET(qtd: number): string {
  return `${qtd} ${qtd === 1 ? "documento fora" : "documentos fora"} do RET`;
}
