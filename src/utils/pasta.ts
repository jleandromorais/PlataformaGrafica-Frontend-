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

/** Copia cada arquivo para a memória antes do envio. Pasta em rede/OneDrive ou caminho
 * acima de 260 caracteres pode falhar na leitura (o Chrome só avisa na hora do upload,
 * como "Network Error" e derruba o envio todo). Aqui há novas tentativas para oscilações
 * e os arquivos que não abrem são pulados e devolvidos em `falhas`. */
export async function carregarNaMemoria(
  arquivos: ArquivoDaPasta[],
  progresso?: (feitos: number, total: number) => void,
): Promise<{ lidos: ArquivoDaPasta[]; falhas: string[] }> {
  const saida: ArquivoDaPasta[] = [];
  const falhas: string[] = [];
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
    if (dados) saida.push({ arquivo: new File([dados], arquivo.name, { type: arquivo.type }), caminho });
    else falhas.push(caminho);
    progresso?.(i + 1, arquivos.length);
  }
  return { lidos: saida, falhas };
}
