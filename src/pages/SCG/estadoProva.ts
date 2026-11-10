/** Funções puras da prova real do SCG: em que situação está o mês e o que fazer.
 * Só classificam o que o backend devolveu: nada aqui calcula o SCG. */
import type { ProvaRealSCG } from "../../types";

export type EstadoProvaSCG = "nao_gravado" | "confere" | "diverge";

export function estadoDaProvaSCG(d: ProvaRealSCG): EstadoProvaSCG {
  if (!d.gravado || d.scg_gravado === null) return "nao_gravado";
  return d.confere ? "confere" : "diverge";
}

/** Frase curta para quem sabe pouco: o que a situação quer dizer e o que fazer. */
export const ORIENTACAO_SCG: Record<EstadoProvaSCG, string> = {
  confere: "Está certo: o SCG gravado é igual à soma refeita com CGR, CGF, RET e RP.",
  diverge: "O SCG gravado é diferente da soma refeita. Veja abaixo de onde vêm os números e, na tabela “Valores”, escolha o que vale e salve de novo.",
  nao_gravado: "Este mês ainda não tem SCG gravado. Use a tabela “Valores” mais abaixo (módulos ou digitado) e salve.",
};

/** Mês da prova real → endereço da tela de um módulo no mesmo mês. */
export function linkDoModulo(rota: string, periodo: string): string {
  return `${rota}?periodo=${encodeURIComponent(periodo)}`;
}
