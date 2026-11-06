import { Skeleton } from "./Skeleton";

/** Linhas de esqueleto para pôr dentro do <tbody> enquanto a tabela carrega.
 * O cabeçalho real continua na tela; só as linhas viram blocos com brilho.
 * A 1ª coluna (período/nome) fica à esquerda; as outras (valores) à direita,
 * como nas tabelas do projeto. */
export function LinhasEsqueleto({
  colunas,
  linhas = 3,
  texto = "Carregando…",
  altura = "h-4",
}: {
  colunas: number;
  linhas?: number;
  /** Lido pelo leitor de tela; não aparece na tela. Vazio: não anuncia nada. */
  texto?: string;
  /** Altura de cada bloco (ex.: "h-8" quando as linhas reais têm campos de digitar). */
  altura?: string;
}) {
  return (
    <>
      {Array.from({ length: linhas }).map((_, i) => (
        <tr key={i}>
          {Array.from({ length: colunas }).map((_, c) => (
            <td key={c} className="px-4 py-3">
              {/* O aviso para leitor de tela vai uma vez só, na primeira célula (texto vazio = quem chama já avisa). */}
              {i === 0 && c === 0 && texto && <span role="status" className="sr-only">{texto}</span>}
              <Skeleton className={`${altura} rounded ${c === 0 ? "w-20" : "ml-auto w-24"}`} />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}
