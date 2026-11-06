import { describe, expect, it } from "vitest";
import { paginasVisiveis, textoResumo } from "./paginacao";

const MESES = ["mês", "meses"] as const;

describe("textoResumo", () => {
  it("um item só: singular, sem intervalo", () => {
    expect(textoResumo(1, 8, 1, MESES)).toBe("Mostrando 1 de 1 mês");
    expect(textoResumo(1, 8, 1, ["sessão", "sessões"])).toBe("Mostrando 1 de 1 sessão");
  });

  it("intervalo no plural", () => {
    expect(textoResumo(1, 8, 23, MESES)).toBe("Mostrando 1–8 de 23 meses");
    expect(textoResumo(3, 8, 23, MESES)).toBe("Mostrando 17–23 de 23 meses");
    expect(textoResumo(1, 8, 5, ["sessão", "sessões"])).toBe("Mostrando 1–5 de 5 sessões");
  });

  it("página com um item só: sem intervalo (9 itens, 8 por página → pág. 2)", () => {
    expect(textoResumo(2, 8, 9, MESES)).toBe("Mostrando 9 de 9 meses");
  });
});

describe("paginasVisiveis", () => {
  it("uma página só", () => {
    expect(paginasVisiveis(1, 1)).toEqual([1]);
  });

  it("poucas páginas, sem reticências", () => {
    expect(paginasVisiveis(1, 2)).toEqual([1, 2]);
    expect(paginasVisiveis(2, 3)).toEqual([1, 2, 3]);
    expect(paginasVisiveis(1, 3)).toEqual([1, 2, 3]);
  });

  it("início, meio e fim de muitas páginas", () => {
    expect(paginasVisiveis(1, 12)).toEqual([1, 2, "reticencias", 12]);
    expect(paginasVisiveis(6, 12)).toEqual([1, "reticencias", 5, 6, 7, "reticencias", 12]);
    expect(paginasVisiveis(12, 12)).toEqual([1, "reticencias", 11, 12]);
  });

  it("não repete número nem põe reticências entre vizinhas", () => {
    expect(paginasVisiveis(3, 5)).toEqual([1, 2, 3, 4, 5]);
    expect(paginasVisiveis(4, 6)).toEqual([1, "reticencias", 3, 4, 5, 6]);
  });
});
