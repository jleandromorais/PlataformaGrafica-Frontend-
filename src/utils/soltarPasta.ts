/** Pasta ARRASTADA para a página. Diferente do showDirectoryPicker, soltar uma pasta não
 * faz o Chrome mostrar o aviso "Permitir que este site veja e copie arquivos?": quem
 * arrasta já está dando acesso. Lê pelo webkitGetAsEntry (Chrome, Edge, Firefox, Safari)
 * e monta o mesmo { raiz, caminho relativo → arquivo } do seletor de pasta.
 *
 * Os tipos abaixo são o mínimo que se usa das entradas do navegador, para os testes
 * poderem passar entradas de mentira. */
import type { ArquivoDaPasta } from "../api";
import { abrirArquivo, type ArquivoDaPastaCiclo, type ChavePasta, type PastaLida } from "./pasta";

export interface Entrada { name: string; isFile: boolean; isDirectory: boolean }
export interface EntradaArquivo extends Entrada {
  file(ok: (f: File) => void, falha?: (e: unknown) => void): void;
}
export interface EntradaPasta extends Entrada {
  createReader(): { readEntries(ok: (lista: Entrada[]) => void, falha?: (e: unknown) => void): void };
}

/** O que foi solto: uma pasta (o esperado), um .zip só (também serve), arquivos soltos,
 * várias coisas, ou nada legível. */
export type TipoSoltura = "pasta" | "zip" | "arquivos" | "varias" | "nada";

export function tipoDaSoltura(entradas: Entrada[]): TipoSoltura {
  const pastas = entradas.filter((e) => e.isDirectory).length;
  if (!entradas.length) return "nada";
  if (pastas === 1 && entradas.length === 1) return "pasta";
  if (pastas === 0 && entradas.length === 1 && /\.zip$/i.test(entradas[0].name)) return "zip";
  if (pastas === 0) return "arquivos";
  return "varias";
}

/** Título e texto do aviso quando a soltura não é uma pasta só. */
export function avisoDaSoltura(tipo: Exclude<TipoSoltura, "pasta" | "zip">, pasta: string): { titulo: string; texto: string } {
  if (tipo === "arquivos") {
    return {
      titulo: "Solte a pasta, não os arquivos",
      texto: `Você soltou arquivos avulsos. Arraste a pasta ${pasta} inteira (a que contém as subpastas), ou um .zip só dela, `
        + "e não os arquivos de dentro.",
    };
  }
  if (tipo === "varias") {
    return {
      titulo: "Solte uma pasta só",
      texto: `Você soltou mais de um item de uma vez. Arraste só a pasta ${pasta} (ou um .zip dela): o sistema lê as subpastas sozinho.`,
    };
  }
  return {
    titulo: "Não consegui ler o que foi solto",
    texto: `O navegador não entregou nenhuma pasta. Arraste a pasta ${pasta} do Explorador de Arquivos para cá, `
      + "ou escolha o .zip da pasta.",
  };
}

export interface Soltura {
  tipo: TipoSoltura;
  pasta?: EntradaPasta;
  zip?: File;
  /** Chave da pasta para reabrir depois de recarregar (só Chrome/Edge); null se não houver. */
  chave: Promise<ChavePasta | null>;
}

/** Pega o que foi solto. Precisa ser chamada DENTRO do evento drop, sem await antes:
 * depois que o evento termina, o navegador esvazia o dataTransfer. */
export function pegarSoltura(dt: DataTransfer): Soltura {
  const itens = Array.from(dt.items).filter((i) => i.kind === "file");
  const entradas = itens.map((i) => i.webkitGetAsEntry()).filter((e): e is FileSystemEntry => !!e);
  const tipo = tipoDaSoltura(entradas);
  let chave: Promise<ChavePasta | null> = Promise.resolve(null);
  if (tipo === "pasta") {
    const item = itens[0] as DataTransferItem & { getAsFileSystemHandle?: () => Promise<{ kind: string } | null> };
    try {
      if (item.getAsFileSystemHandle) {
        chave = item.getAsFileSystemHandle()
          .then((h) => (h?.kind === "directory" ? (h as unknown as ChavePasta) : null))
          .catch(() => null);
      }
    } catch {
      // sem chave: a pasta funciona, só não é lembrada depois de recarregar
    }
  }
  return {
    tipo, chave,
    pasta: tipo === "pasta" ? (entradas[0] as unknown as EntradaPasta) : undefined,
    zip: tipo === "zip" ? itens[0].getAsFile() ?? undefined : undefined,
  };
}

/** readEntries devolve no máximo ~100 por vez: chama até vir vazio. */
function lerFilhos(pasta: EntradaPasta): Promise<Entrada[]> {
  const leitor = pasta.createReader();
  const todos: Entrada[] = [];
  return new Promise((ok, falha) => {
    const proximo = () => leitor.readEntries((lote) => {
      if (!lote.length) return ok(todos);
      todos.push(...lote);
      proximo();
    }, falha);
    proximo();
  });
}

/** Alça que abre o arquivo só na hora de enviar (como no seletor do Chrome): listar
 * milhares de arquivos em OneDrive/rede abrindo cada um levava minutos. */
const alca = (e: EntradaArquivo): ArquivoDaPastaCiclo => ({
  getFile: () => new Promise<File>((ok, falha) => e.file(ok, falha)),
});

async function lerEntrada(pasta: EntradaPasta, prefixo: string, saida: Map<string, ArquivoDaPastaCiclo>) {
  const filhos = await lerFilhos(pasta);
  await Promise.all(filhos.map((f) => {
    const caminho = prefixo + f.name;
    if (f.isDirectory) return lerEntrada(f as EntradaPasta, `${caminho}/`, saida);
    if (f.isFile) saida.set(caminho, alca(f as EntradaArquivo));
    return undefined;
  }));
}

/** Lê a pasta solta inteira: raiz = nome da pasta; caminhos SEM a raiz, como o seletor. */
export async function lerPastaSolta(pasta: EntradaPasta): Promise<PastaLida> {
  const arquivos = new Map<string, ArquivoDaPastaCiclo>();
  await lerEntrada(pasta, "", arquivos);
  // Mesma ordem em qualquer navegador (readEntries não garante ordem).
  return { raiz: pasta.name, arquivos: new Map([...arquivos].sort(([a], [b]) => a.localeCompare(b))) };
}

/** Pasta escolhida no seletor do sistema (<input webkitdirectory>): mesmo formato da pasta
 * solta. Cada File traz o caminho em webkitRelativePath ("SCG-26/07 jul-26/a.xml"); a raiz
 * sai do caminho. Lista vazia (pasta sem arquivos) → raiz "" e nenhum arquivo. */
export function pastaDoSeletor(lista: ArrayLike<File>): PastaLida {
  let raiz = "";
  const arquivos = new Map<string, ArquivoDaPastaCiclo>();
  Array.from(lista).forEach((f) => {
    const partes = (f.webkitRelativePath || f.name).split("/");
    if (partes.length > 1) raiz = partes[0];
    arquivos.set(partes.length > 1 ? partes.slice(1).join("/") : f.name, f);
  });
  return { raiz, arquivos: new Map([...arquivos].sort(([a], [b]) => a.localeCompare(b))) };
}

/** Da pasta lida para a lista de envio (ex.: Auditoria), só com as extensões pedidas
 * (sem ponto, minúsculas). Abre cada arquivo, como o seletor comum já entrega. */
export async function arquivosParaEnvio(pasta: PastaLida, extensoes: string[]): Promise<ArquivoDaPasta[]> {
  const escolhidos = [...pasta.arquivos].filter(([c]) => extensoes.includes(c.toLowerCase().split(".").pop() ?? ""));
  return Promise.all(escolhidos.map(async ([caminho, a]) => ({ arquivo: await abrirArquivo(a), caminho })));
}
