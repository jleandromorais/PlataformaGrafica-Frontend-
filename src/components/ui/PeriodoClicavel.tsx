/** Primeira célula (`<td>`) da tabela de histórico clicável das telas da Conta Gráfica.
 * O botão deixa a linha acessível pelo teclado (Tab + Enter) e por leitor de tela. A linha
 * aberta ganha a faixa azul à esquerda (borda da célula: as outras têm a mesma borda
 * transparente, para o texto não "pular") e o selo neutro "em exibição". Período gravado com
 * nome inválido não é clicável. A cor de fundo e o clique da linha ficam no <tr> da tela. */
import { SeloEmExibicao } from "./SeloEmExibicao";

export function PeriodoClicavel({ periodo, valido, ativo, onAbrir }: {
  periodo: string; valido: boolean; ativo: boolean; onAbrir: (periodo: string) => void;
}) {
  return (
    <td className={`border-l-[3px] px-4 py-2.5 font-medium ${ativo ? "border-l-sky-400 text-white" : "border-l-transparent text-zinc-200"}`}>
      {valido ? (
        <button type="button" onClick={(e) => { e.stopPropagation(); onAbrir(periodo); }}
          aria-label={`Ver a prova real de ${periodo}`}
          className="rounded text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-400">
          {periodo}
        </button>
      ) : (
        <>
          {periodo}
          <span className="ml-2 rounded-full border border-red-500/30 bg-red-500/10 px-1.5 py-0.5 text-[0.65rem] font-semibold text-red-300" title="Período gravado com nome inválido: corrija ou apague no banco">inválido</span>
        </>
      )}
      {ativo && <SeloEmExibicao />}
    </td>
  );
}
