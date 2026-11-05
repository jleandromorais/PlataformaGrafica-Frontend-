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

// ── Pasta que o navegador lembra (Chrome/Edge) ───────────────────────────────
// Com o input comum, recarregar a página perde o acesso aos arquivos. Com o
// showDirectoryPicker, o navegador entrega uma "chave" da pasta que pode ser guardada
// (utils/lembrar) e reaberta depois, com a permissão da pessoa. Os tipos não estão no TS.

type Permissao = "granted" | "denied" | "prompt";
export interface ChavePasta {
  kind: "directory";
  name: string;
  values(): AsyncIterable<ChavePasta | { kind: "file"; name: string; getFile(): Promise<File> }>;
  queryPermission(o: { mode: "read" }): Promise<Permissao>;
  requestPermission(o: { mode: "read" }): Promise<Permissao>;
}

/** Arquivos da pasta: caminho sem a pasta raiz → File (como o input com webkitdirectory). */
export interface PastaLida { raiz: string; arquivos: Map<string, File> }

export const navegadorLembraPasta = typeof window !== "undefined" && "showDirectoryPicker" in window;

async function lerChave(chave: ChavePasta, prefixo = "", saida = new Map<string, File>()) {
  const filhos: Promise<unknown>[] = [];
  for await (const item of chave.values()) {
    const caminho = prefixo + item.name;
    filhos.push(item.kind === "file"
      ? item.getFile().then((f) => { saida.set(caminho, f); })
      : lerChave(item, `${caminho}/`, saida));
  }
  await Promise.all(filhos);
  return saida;
}

/** Lê todos os arquivos da pasta (é a parte demorada: pastas grandes têm milhares). */
export async function lerPastaDaChave(chave: ChavePasta): Promise<PastaLida> {
  return { raiz: chave.name, arquivos: await lerChave(chave) };
}

/** Abre o seletor de pasta e devolve só a chave (rápido); null se a pessoa cancelar. */
export async function escolherChavePasta(): Promise<ChavePasta | null> {
  try {
    const picker = (window as unknown as { showDirectoryPicker(o: { mode: "read" }): Promise<ChavePasta> }).showDirectoryPicker;
    return await picker({ mode: "read" });
  } catch (e) {
    if (e instanceof DOMException && e.name === "AbortError") return null;
    throw e;
  }
}

/** Relê uma pasta guardada. `pedir`: pode mostrar o aviso de permissão do navegador
 * (só funciona logo após um clique). Sem permissão → null. */
export async function reabrirPasta(chave: ChavePasta, pedir: boolean): Promise<PastaLida | null> {
  let permissao = await chave.queryPermission({ mode: "read" });
  if (permissao === "prompt" && pedir) permissao = await chave.requestPermission({ mode: "read" });
  if (permissao !== "granted") return null;
  return lerPastaDaChave(chave);
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
