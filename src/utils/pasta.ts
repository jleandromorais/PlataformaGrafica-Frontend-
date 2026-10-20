import type { ArquivoDaPasta } from "../api";

/** Arquivos de uma pasta escolhida no navegador (input com webkitdirectory),
 * com o caminho relativo SEM a pasta raiz. `extensoes` sem ponto, minúsculas. */
export function lerPasta(lista: FileList, extensoes: string[]): { raiz: string; arquivos: ArquivoDaPasta[] } {
  let raiz = "";
  const arquivos: ArquivoDaPasta[] = [];
  Array.from(lista).forEach((f) => {
    const partes = (f.webkitRelativePath || f.name).split("/");
    raiz = partes.length > 1 ? partes[0] : raiz;
    const ext = f.name.toLowerCase().split(".").pop() ?? "";
    if (!extensoes.includes(ext)) return;
    arquivos.push({ arquivo: f, caminho: partes.length > 1 ? partes.slice(1).join("/") : f.name });
  });
  return { raiz, arquivos };
}

/** Copia cada arquivo para a memória antes do envio. Pasta em rede/OneDrive pode falhar
 * na leitura (o Chrome só avisa na hora do upload, como "Network Error"); aqui o erro
 * aponta o arquivo e há novas tentativas para oscilações. */
export async function carregarNaMemoria(
  arquivos: ArquivoDaPasta[],
  progresso?: (feitos: number, total: number) => void,
): Promise<ArquivoDaPasta[]> {
  const saida: ArquivoDaPasta[] = [];
  for (let i = 0; i < arquivos.length; i++) {
    const { arquivo, caminho } = arquivos[i];
    let dados: ArrayBuffer | null = null;
    for (let tentativa = 1; tentativa <= 3 && !dados; tentativa++) {
      try {
        dados = await arquivo.arrayBuffer();
      } catch {
        if (tentativa < 3) await new Promise((r) => setTimeout(r, 500 * tentativa));
      }
    }
    if (!dados) {
      throw new Error(
        `Não consegui ler o arquivo "${caminho}". Se a pasta está em rede ou no OneDrive, copie-a para o disco local (ex.: C:\\Notas), escolha a pasta de novo e tente outra vez.`,
      );
    }
    saida.push({ arquivo: new File([dados], arquivo.name, { type: arquivo.type }), caminho });
    progresso?.(i + 1, arquivos.length);
  }
  return saida;
}
