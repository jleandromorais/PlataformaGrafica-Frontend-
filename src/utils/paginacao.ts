import { useMemo, useState } from "react";

export type ItemPagina = number | "reticencias";

/** Números a mostrar na paginação: 1 … (vizinhas da atual) … última. */
export function paginasVisiveis(pagina: number, totalPaginas: number): ItemPagina[] {
  if (totalPaginas <= 1) return [1];
  const itens: ItemPagina[] = [1];
  const inicio = Math.max(2, pagina - 1);
  const fim = Math.min(totalPaginas - 1, pagina + 1);
  if (inicio > 2) itens.push("reticencias");
  for (let p = inicio; p <= fim; p++) itens.push(p);
  if (fim < totalPaginas - 1) itens.push("reticencias");
  itens.push(totalPaginas);
  return itens;
}

interface OpcoesPaginacao {
  /** Itens por página (padrão 12 = um ano de meses). */
  porPagina?: number;
  /** Índice do item em destaque (ex.: período aberto); a paginação pula para a página dele. -1 = nenhum. */
  focoIndice?: number;
}

const paginaDoIndice = (indice: number, porPagina: number) => Math.floor(indice / porPagina) + 1;

/** Fatia em páginas uma lista que já veio inteira da API. */
export function usePaginacao<T>(itens: T[], { porPagina = 12, focoIndice = -1 }: OpcoesPaginacao = {}) {
  const [pagina, setPagina] = useState(() => (focoIndice >= 0 ? paginaDoIndice(focoIndice, porPagina) : 1));
  const [focoAnterior, setFocoAnterior] = useState(focoIndice);

  // Mudou o item em destaque (outro período aberto, ou o histórico chegou): vai para a página dele.
  if (focoIndice !== focoAnterior) {
    setFocoAnterior(focoIndice);
    if (focoIndice >= 0) setPagina(paginaDoIndice(focoIndice, porPagina));
  }

  const total = itens.length;
  const totalPaginas = Math.max(1, Math.ceil(total / porPagina));
  const atual = Math.min(pagina, totalPaginas); // lista encolheu: fica na última página válida

  const itensDaPagina = useMemo(
    () => itens.slice((atual - 1) * porPagina, atual * porPagina),
    [itens, atual, porPagina],
  );

  return { pagina: atual, setPagina, totalPaginas, total, porPagina, itensDaPagina };
}
