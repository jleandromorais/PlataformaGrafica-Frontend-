import { describe, expect, it } from "vitest";
import { escolherPlanilha, planilhaDoTrimestre } from "./planilhaDoTrimestre";

describe("planilhaDoTrimestre", () => {
  const arquivo = { name: "oficial-jul-set.xlsx" };

  it("vale no trimestre em que foi escolhida", () => {
    const escolhida = escolherPlanilha(arquivo, "Jul/2026");
    expect(planilhaDoTrimestre(escolhida, "Jul/2026")).toBe(arquivo);
  });

  it("não vale em outro trimestre", () => {
    const escolhida = escolherPlanilha(arquivo, "Jul/2026");
    expect(planilhaDoTrimestre(escolhida, "Abr/2026")).toBeNull();
    expect(planilhaDoTrimestre(escolhida, "Jul/2027")).toBeNull();
  });

  it("voltar ao trimestre original não ressuscita uma escolha já descartada", () => {
    expect(planilhaDoTrimestre(escolherPlanilha(null, "Jul/2026"), "Jul/2026")).toBeNull();
  });

  it("sem escolha, não há planilha", () => {
    expect(planilhaDoTrimestre(null, "Jul/2026")).toBeNull();
  });
});
