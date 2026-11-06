/** .zip da pasta do ciclo, lido NO NAVEGADOR (nada é enviado): escolher um arquivo só
 * não faz o Chrome mostrar aviso de permissão, ao contrário do seletor de pasta.
 * Para o mapa bastam os nomes; cada arquivo só é descompactado quando o Processar
 * vai enviá-lo (mesmo { raiz, caminho → arquivo } da pasta arrastada). */
import { unzipSync } from "fflate";
import type { ArquivoDaPastaCiclo, PastaLida } from "./pasta";

/** Um arquivo do zip: caminho como o resto do sistema usa (sem a raiz) e nome dentro do zip. */
export interface EntradaZip { caminho: string; noZip: string }

/** Parte pura: dos nomes do zip para a raiz e os caminhos sem ela. Pula pastas e lixo do
 * Mac (__MACOSX, .DS_Store). Se tudo está dentro de uma pasta só (zip de "SCG-26"), ela é
 * a raiz; senão, a raiz é o nome do .zip. */
export function estruturaDoZip(nomes: string[], nomeDoZip: string): { raiz: string; entradas: EntradaZip[] } {
  const arquivos = nomes
    .map((n) => n.replace(/\\/g, "/"))
    .filter((n) => !n.endsWith("/") && !n.startsWith("__MACOSX/") && !n.split("/").pop()!.startsWith(".DS_Store"));
  const primeiras = new Set(arquivos.map((n) => (n.includes("/") ? n.split("/")[0] : "")));
  const umaPasta = primeiras.size === 1 && !primeiras.has("");
  const raiz = umaPasta ? [...primeiras][0] : nomeDoZip.replace(/\.zip$/i, "");
  const entradas = arquivos
    .map((noZip) => ({ noZip, caminho: umaPasta ? noZip.split("/").slice(1).join("/") : noZip }))
    .sort((a, b) => a.caminho.localeCompare(b.caminho));
  return { raiz, entradas };
}

export const ehZip = (f: File) => /\.zip$/i.test(f.name);

const bytes = async (f: File) => new Uint8Array(await f.arrayBuffer());

/** Lista o zip (sem descompactar nada). Zip inválido → erro com o próximo passo. */
export async function lerZipDaPasta(zip: File): Promise<PastaLida> {
  const nomes: string[] = [];
  try {
    unzipSync(await bytes(zip), { filter: (f) => { nomes.push(f.name); return false; } });
  } catch {
    throw new Error(`Não consegui abrir “${zip.name}”: o arquivo não é um .zip válido ou está corrompido. `
      + "Compacte a pasta de novo (botão direito › Enviar para › Pasta compactada) e escolha outra vez.");
  }
  const { raiz, entradas } = estruturaDoZip(nomes, zip.name);
  const abrir = abridorEmLote(zip);
  return { raiz, arquivos: new Map(entradas.map((e): [string, ArquivoDaPastaCiclo] => [e.caminho, { getFile: () => abrir(e.noZip) }])) };
}

/** O Processar pede os arquivos de uma etapa-mês todos juntos: junta os pedidos do mesmo
 * instante e descompacta só esses, numa passada pelo zip (o zip não fica na memória). */
function abridorEmLote(zip: File) {
  let pedidos: Map<string, { ok: (f: File) => void; falha: (e: unknown) => void }[]> | null = null;
  const descompactar = async (lote: NonNullable<typeof pedidos>) => {
    try {
      const saida = unzipSync(await bytes(zip), { filter: (f) => lote.has(f.name) });
      lote.forEach((espera, nome) => {
        const dados = saida[nome];
        const arquivo = dados ? new File([dados as Uint8Array<ArrayBuffer>], nome.split("/").pop()!) : null;
        espera.forEach((p) => (arquivo ? p.ok(arquivo) : p.falha(new Error(`“${nome}” não está mais no zip ${zip.name}.`))));
      });
    } catch (e) {
      const erro = new Error(`Não consegui descompactar arquivos de “${zip.name}”. Escolha o .zip de novo e tente outra vez.`, { cause: e });
      lote.forEach((espera) => espera.forEach((p) => p.falha(erro)));
    }
  };
  return (nome: string) => new Promise<File>((ok, falha) => {
    if (!pedidos) {
      pedidos = new Map();
      const lote = pedidos;
      setTimeout(() => { pedidos = null; descompactar(lote); }, 0);
    }
    pedidos.set(nome, [...(pedidos.get(nome) ?? []), { ok, falha }]);
  });
}
