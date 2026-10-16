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
