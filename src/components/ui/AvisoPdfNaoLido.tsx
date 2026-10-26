import { Alert } from "./Alert";

interface Props {
  /** Quantos PDFs ficaram sem valor. */
  quantidade: number;
  /** O backend consegue ler PDF de imagem (OCR)? */
  ocrDisponivel: boolean;
  /** O que o usuário pode fazer agora, na tela (ex.: "Digite o valor nos campos amarelos"). */
  oQueFazer: string;
}

/** Aviso amigável para PDF que não deu para ler: diz o porquê e o que fazer, sem jargão. */
export function AvisoPdfNaoLido({ quantidade, ocrDisponivel, oQueFazer }: Props) {
  if (quantidade <= 0) return null;
  const arquivos = quantidade === 1 ? "1 PDF" : `${quantidade} PDFs`;
  return (
    <Alert variant="warning">
      <span>
        {ocrDisponivel ? (
          <>
            <strong>Não consegui ler o valor de {arquivos}.</strong> Pode ser um arquivo diferente do esperado ou com a
            imagem ruim. {oQueFazer}
          </>
        ) : (
          <>
            <strong>{arquivos} {quantidade === 1 ? "é uma imagem" : "são imagens"} (documento escaneado)</strong> e este
            computador ainda não tem o leitor de imagens (OCR), então o valor não foi lido. {oQueFazer} Para o sistema ler
            sozinho da próxima vez, peça para instalar o <em>Tesseract OCR</em> no computador onde o sistema roda.
          </>
        )}
      </span>
    </Alert>
  );
}
