import { describe, expect, it } from "vitest";
import { paginasVisiveis } from "./paginacao";

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
