import { describe, expect, it } from "vitest";
import {
  arquivosParaEnvio, avisoDaSoltura, lerPastaSolta, pastaDoSeletor, tipoDaSoltura,
  type Entrada, type EntradaArquivo, type EntradaPasta,
} from "./soltarPasta";
import { abrirArquivo } from "./pasta";

// Entradas de mentira, no formato do webkitGetAsEntry (nada de dado real).
const arquivo = (name: string): EntradaArquivo => ({
  name, isFile: true, isDirectory: false,
  file: (ok) => ok(new File(["x"], name)),
});
/** `lote`: quantos itens o readEntries devolve por chamada (o Chrome entrega ~100). */
const pasta = (name: string, filhos: Entrada[], lote = 2): EntradaPasta => ({
  name, isFile: false, isDirectory: true,
  createReader: () => {
    let i = 0;
    return { readEntries: (ok) => { const parte = filhos.slice(i, i + lote); i += lote; ok(parte); } };
  },
});

describe("tipoDaSoltura", () => {
  it("uma pasta só", () => expect(tipoDaSoltura([pasta("SCG-26", [])])).toBe("pasta"));
  it("arquivos soltos", () => expect(tipoDaSoltura([arquivo("a.xml"), arquivo("b.pdf")])).toBe("arquivos"));
  it("mais de uma pasta", () => expect(tipoDaSoltura([pasta("A", []), pasta("B", [])])).toBe("varias"));
  it("pasta junto com arquivo", () => expect(tipoDaSoltura([pasta("A", []), arquivo("b.pdf")])).toBe("varias"));
  it("nada", () => expect(tipoDaSoltura([])).toBe("nada"));
  it("um .zip só serve", () => expect(tipoDaSoltura([arquivo("SCG-26.ZIP")])).toBe("zip"));
  it("dois .zip são arquivos soltos", () => expect(tipoDaSoltura([arquivo("a.zip"), arquivo("b.zip")])).toBe("arquivos"));
});

describe("lerPastaSolta", () => {
  it("lê subpastas inteiras (readEntries em lotes) com caminho sem a raiz", async () => {
    const raiz = pasta("SCG-26", [
      pasta("07 jul-26", [
        pasta("Petrobras", [arquivo("n1.xml"), arquivo("n2.xml"), arquivo("n3.pdf")]),
        arquivo("planilha.xlsx"),
      ]),
      arquivo("leia.txt"),
    ]);
    const lida = await lerPastaSolta(raiz);
    expect(lida.raiz).toBe("SCG-26");
    expect([...lida.arquivos.keys()]).toEqual([
      "07 jul-26/Petrobras/n1.xml", "07 jul-26/Petrobras/n2.xml", "07 jul-26/Petrobras/n3.pdf",
      "07 jul-26/planilha.xlsx", "leia.txt",
    ]);
    const f = await abrirArquivo(lida.arquivos.get("leia.txt")!);
    expect(f.name).toBe("leia.txt");
  });

  it("pasta vazia", async () => {
    expect((await lerPastaSolta(pasta("Vazia", []))).arquivos.size).toBe(0);
  });
});

describe("pastaDoSeletor", () => {
  // File do seletor de pasta: o navegador preenche webkitRelativePath com a raiz na frente.
  const doSeletor = (caminho: string) => {
    const f = new File(["x"], caminho.split("/").pop()!);
    Object.defineProperty(f, "webkitRelativePath", { value: caminho });
    return f;
  };

  it("tira a raiz do caminho e ordena como a pasta solta", async () => {
    const lida = pastaDoSeletor([
      doSeletor("SCG-26/leia.txt"),
      doSeletor("SCG-26/07 jul-26/Petrobras/n2.xml"),
      doSeletor("SCG-26/07 jul-26/Petrobras/n1.xml"),
    ]);
    expect(lida.raiz).toBe("SCG-26");
    expect([...lida.arquivos.keys()]).toEqual(["07 jul-26/Petrobras/n1.xml", "07 jul-26/Petrobras/n2.xml", "leia.txt"]);
    expect((await abrirArquivo(lida.arquivos.get("leia.txt")!)).name).toBe("leia.txt");
  });

  it("serve para a lista de envio (só XML e PDF)", async () => {
    const lida = pastaDoSeletor([doSeletor("Jul/TAG/A.XML"), doSeletor("Jul/TAG/b.pdf"), doSeletor("Jul/TAG/c.zip")]);
    expect((await arquivosParaEnvio(lida, ["xml", "pdf"])).map((e) => e.caminho)).toEqual(["TAG/A.XML", "TAG/b.pdf"]);
  });

  it("lista vazia", () => {
    expect(pastaDoSeletor([])).toEqual({ raiz: "", arquivos: new Map() });
  });
});

describe("arquivosParaEnvio", () => {
  it("filtra pelas extensões e abre os arquivos", async () => {
    const lida = await lerPastaSolta(pasta("Jul", [pasta("TAG", [arquivo("A.XML"), arquivo("b.pdf"), arquivo("c.zip")])]));
    const envio = await arquivosParaEnvio(lida, ["xml", "pdf"]);
    expect(envio.map((e) => e.caminho)).toEqual(["TAG/A.XML", "TAG/b.pdf"]);
    expect(envio[0].arquivo).toBeInstanceOf(File);
  });
});

describe("avisoDaSoltura", () => {
  it("cita a pasta esperada", () => {
    expect(avisoDaSoltura("arquivos", "SCG-26").texto).toContain("SCG-26");
    expect(avisoDaSoltura("varias", "de Jul/2026").titulo).toBe("Solte uma pasta só");
  });
});
