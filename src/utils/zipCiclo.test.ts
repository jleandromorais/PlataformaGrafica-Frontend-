import { describe, expect, it } from "vitest";
import { strToU8, zipSync } from "fflate";
import { estruturaDoZip, lerZipDaPasta } from "./zipCiclo";
import { abrirArquivo } from "./pasta";

describe("estruturaDoZip", () => {
  it("zip de uma pasta só: ela vira a raiz e sai dos caminhos", () => {
    const { raiz, entradas } = estruturaDoZip([
      "SCG-26/", "SCG-26/07 jul-26/", "SCG-26/07 jul-26/TAG/n1.xml", "SCG-26/07 jul-26/TAG/n1.pdf",
      "__MACOSX/SCG-26/._n1.xml", "SCG-26/.DS_Store",
    ], "qualquer.zip");
    expect(raiz).toBe("SCG-26");
    expect(entradas).toEqual([
      { caminho: "07 jul-26/TAG/n1.pdf", noZip: "SCG-26/07 jul-26/TAG/n1.pdf" },
      { caminho: "07 jul-26/TAG/n1.xml", noZip: "SCG-26/07 jul-26/TAG/n1.xml" },
    ]);
  });

  it("zip com várias pastas na raiz: a raiz é o nome do .zip", () => {
    const { raiz, entradas } = estruturaDoZip(["07 jul-26/a.xml", "08 ago-26/b.xml"], "SCG-26.ZIP");
    expect(raiz).toBe("SCG-26");
    expect(entradas.map((e) => e.caminho)).toEqual(["07 jul-26/a.xml", "08 ago-26/b.xml"]);
  });

  it("arquivo solto na raiz do zip também mantém o nome do .zip como raiz", () => {
    expect(estruturaDoZip(["SCG-26/a.xml", "leia.txt"], "pasta.zip").raiz).toBe("pasta");
  });

  it("barra invertida (zip do Windows antigo) vira /", () => {
    expect(estruturaDoZip(["SCG-26\\jul\\a.xml"], "x.zip").entradas[0].caminho).toBe("jul/a.xml");
  });

  it("zip vazio", () => expect(estruturaDoZip(["SCG-26/"], "x.zip").entradas).toEqual([]));
});

describe("lerZipDaPasta", () => {
  it("lista sem descompactar e abre cada arquivo na hora de enviar", async () => {
    const dados = zipSync({ "SCG-26/jul/TAG/n1.xml": strToU8("<nfe/>"), "SCG-26/jul/TAG/n2.xml": strToU8("<cte/>") });
    const lida = await lerZipDaPasta(new File([dados], "SCG-26.zip"));
    expect(lida.raiz).toBe("SCG-26");
    expect([...lida.arquivos.keys()]).toEqual(["jul/TAG/n1.xml", "jul/TAG/n2.xml"]);
    const [a, b] = await Promise.all([...lida.arquivos.values()].map(abrirArquivo));
    expect(a.name).toBe("n1.xml");
    expect(await b.text()).toBe("<cte/>");
  });

  it("arquivo que não é zip dá erro com o próximo passo", async () => {
    await expect(lerZipDaPasta(new File(["não sou zip"], "x.zip"))).rejects.toThrow(/Compacte a pasta de novo/);
  });
});
