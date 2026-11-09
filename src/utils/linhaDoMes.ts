/** Classe do <tr> do histórico clicável: fundo azul na linha aberta, mãozinha e hover nas clicáveis. */
export const linhaDoMes = (ativo: boolean, clicavel: boolean) =>
  `transition-colors ${ativo ? "bg-sky-500/[0.10]" : clicavel ? "cursor-pointer hover:bg-white/[0.03]" : ""}`;
