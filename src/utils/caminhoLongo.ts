/** Aviso de caminho longo demais na pasta carregada no Painel.
 *
 * No Windows, o Chrome não lê arquivo cujo caminho completo passa de 260 caracteres: o envio
 * falha e o erro só dizia "carregue a pasta de novo". O navegador só conhece o caminho DENTRO
 * da pasta escolhida ("SCG-27/RP/out-26/…"), não o "C:\Users\…\Downloads\" antes dela, que
 * costuma ter 30 a 60 caracteres. Por isso o limite aqui é 200: acima disso, o caminho completo
 * provavelmente passa de 260. Sem JSX, para testar. */

/** Caracteres dentro da pasta a partir dos quais o caminho completo tende a passar de 260. */
export const LIMITE_CAMINHO_NA_PASTA = 200;

export interface AvisoCaminhoLongo {
  qtd: number;
  maior: number;
  /** Nome do arquivo de caminho mais longo, para o analista achar. */
  exemplo: string;
  titulo: string;
  passo: string;
}

export function avisoDeCaminhosLongos(caminhos: string[], limite = LIMITE_CAMINHO_NA_PASTA): AvisoCaminhoLongo | null {
  const longos = caminhos.filter((c) => c.length > limite);
  if (!longos.length) return null;
  const pior = longos.reduce((a, b) => (b.length > a.length ? b : a));
  const qtd = longos.length;
  return {
    qtd,
    maior: pior.length,
    exemplo: pior.split("/").pop() ?? pior,
    titulo: qtd === 1
      ? `1 arquivo tem o caminho longo demais (${pior.length} caracteres só dentro da pasta).`
      : `${qtd} arquivos têm o caminho longo demais (até ${pior.length} caracteres só dentro da pasta).`,
    passo: "No Windows, o navegador não lê arquivo com caminho acima de 260 caracteres, e a etapa falha ao processar. "
      + "Copie a pasta para perto da raiz (ex.: C:\\SCG-27) ou encurte os nomes das subpastas, e carregue a pasta de novo.",
  };
}
