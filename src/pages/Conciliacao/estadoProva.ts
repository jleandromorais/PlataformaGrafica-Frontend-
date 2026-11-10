/** Funções puras da prova real do RP: em que situação está o mês, o que fazer, o filtro da lista
 * de notas e o texto das notas repetidas. Só classificam e escrevem o que o backend devolveu:
 * nada aqui calcula o RP. */
import type { ProvaRealDuplicadaRP, ProvaRealItemRP, ProvaRealRP } from "../../types";
import { brl } from "../../utils/format";

export type EstadoProvaRP = "nao_gravado" | "so_total" | "confere" | "diverge";

export function estadoDaProvaRP(d: ProvaRealRP): EstadoProvaRP {
  if (d.rp_gravado === null) return "nao_gravado";
  if (!d.tem_itens) return "so_total";
  return d.confere ? "confere" : "diverge";
}

/** Frase curta para quem sabe pouco: o que a situação quer dizer e o que fazer. */
export const ORIENTACAO_RP: Record<EstadoProvaRP, string> = {
  confere: "Está certo: o RP gravado é igual à conta refeita com as notas do mês.",
  diverge: "O RP gravado é diferente da conta refeita com as notas. Reprocesse o RP do mês no Painel do Ciclo para regravar.",
  so_total: "Este mês foi gravado só com o total, sem as notas. Por isso não dá para refazer a conta. Para ter a prova real, processe os PDFs do mês no Painel do Ciclo.",
  nao_gravado: "Este mês ainda não foi gravado. Processe os PDFs do mês no Painel do Ciclo.",
};

export type FiltroItens = "todas" | "repetidas" | "receitas" | "despesas";

/** Notas que entram na lista para cada filtro (a ordem do backend, do maior valor ao menor, é mantida). */
export function filtrarItens(itens: ProvaRealItemRP[], filtro: FiltroItens): ProvaRealItemRP[] {
  switch (filtro) {
    case "repetidas": return itens.filter((i) => i.repetida);
    case "receitas": return itens.filter((i) => i.lado === "receita");
    case "despesas": return itens.filter((i) => i.lado === "despesa");
    default: return itens;
  }
}

export const ROTULO_LADO: Record<ProvaRealItemRP["lado"], string> = {
  receita: "Receita",
  despesa: "Despesa",
  ja_no_ret: "Já no RET",
};

/** "NDTOPNREC 03901 aparece 2 vezes (R$ 22.908,01 e R$ 22.908,01)": cada valor vem das notas
 * repetidas da lista; se faltarem, usa o total somado. */
export function textoDuplicada(dup: ProvaRealDuplicadaRP, itens: ProvaRealItemRP[]): string {
  const valores = itens.filter((i) => i.repetida && i.tipo === dup.tipo && i.numero === dup.numero).map((i) => brl(i.valor));
  const quando = dup.qtd === 2 ? "2 vezes" : `${dup.qtd} vezes`;
  const soma = valores.length === dup.qtd && valores.length > 1
    ? ` (${valores.slice(0, -1).join(", ")} e ${valores[valores.length - 1]})`
    : ` (soma ${brl(dup.valor_total)})`;
  return `${dup.tipo} ${dup.numero} aparece ${quando}${soma}.`;
}

/** O que o analista deve fazer quando há nota repetida. */
export const ORIENTACAO_REPETIDA =
  "Provável: a versão original e a “Atualizada em…” da mesma nota foram contadas juntas. Confira se uma delas é a versão antiga: a versão antiga deve ficar numa pasta “Substituídos”, que o RP não lê.";

/** "1 nota repetida" / "N notas repetidas". */
export function textoQtdRepetidas(qtd: number): string {
  return `${qtd} ${qtd === 1 ? "nota repetida" : "notas repetidas"}`;
}

/** PDF que o leitor nao conseguiu ler: ficou com status REVISAR e valor 0. Se o analista digitou o
 * valor a mao ao gravar, ele entrou no RP gravado mas o item ficou com 0. */
export function itemNaoLido(i: ProvaRealItemRP): boolean {
  return i.status === "REVISAR" && Math.abs(i.valor) < 0.005;
}

export function qtdNaoLidos(d: ProvaRealRP): number {
  return d.itens.filter(itemNaoLido).length;
}

/** Situacao completa do mes, na ordem do que mais precisa de atencao. */
export type SituacaoRP = EstadoProvaRP | "repetida" | "diverge_nao_lido";

export function situacaoDaProvaRP(d: ProvaRealRP): SituacaoRP {
  const base = estadoDaProvaRP(d);
  if (base === "nao_gravado" || base === "so_total") return base;
  if (d.possiveis_duplicadas.length > 0) return "repetida";
  if (base === "diverge" && qtdNaoLidos(d) > 0) return "diverge_nao_lido";
  return base;
}

/** Frase para o "nao confere" quando ha PDFs nao lidos: vem ANTES da explicacao generica. */
export function textoNaoLidos(qtd: number): string {
  const sujeito = qtd === 1 ? "1 PDF não foi lido e ficou" : `${qtd} PDFs não foram lidos e ficaram`;
  return `${sujeito} com valor 0. Se o valor foi digitado à mão ao gravar, ele está no RP gravado mas não aparece nos itens: por isso a diferença. Confira ${qtd === 1 ? "esse PDF" : "esses PDFs"}.`;
}
