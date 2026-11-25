import { describe, expect, it } from "vitest";
import { avisoDePastaDeOutroTrimestre } from "./pastaOutroTrimestre";
import { mapaDoTrimestre } from "./pastaCiclo";

const JUL_SET = ["Jul/2026", "Ago/2026", "Set/2026"];

describe("avisoDePastaDeOutroTrimestre", () => {
  it("pasta de outubro com o trimestre Jul–Set aberto: diz o que houve, o que fazer e leva ao trimestre certo", () => {
    const a = avisoDePastaDeOutroTrimestre(JUL_SET, ["Out/2026"])!;
    expect(a.titulo).toBe("Esta pasta é de Out/2026 e o trimestre aberto é Jul a Set/2026.");
    expect(a.passo).toBe("Abra o trimestre Out a Dez/2026 ou traga a pasta de Jul a Set/2026.");
    expect(a.trimestre).toEqual({ ano: 2026, tri: 3, rotulo: "Out a Dez/2026" });
  });
  it("vários meses, fora de ordem: faixa do primeiro ao último", () => {
    const a = avisoDePastaDeOutroTrimestre(JUL_SET, ["Dez/2026", "Out/2026", "Nov/2026"])!;
    expect(a.titulo).toContain("Out a Dez/2026");
  });
  it("pasta que tem algum mês do trimestre aberto: sem aviso", () => {
    expect(avisoDePastaDeOutroTrimestre(JUL_SET, ["Set/2026", "Out/2026"])).toBeNull();
  });
  it("pasta sem mês reconhecido: sem aviso (outro aviso já cobre)", () => {
    expect(avisoDePastaDeOutroTrimestre(JUL_SET, [])).toBeNull();
  });
});

describe("mapaDoTrimestre.mesesDaPasta", () => {
  it("lista os meses que o sistema reconheceu na pasta, sem repetir", () => {
    const m = mapaDoTrimestre(["10 out-26 NFs/TAG/a.xml", "10 out-26 NFs/TAG/b.xml", "11 nov-26 NFs/TAG/c.xml"], JUL_SET);
    expect([...m.mesesDaPasta].sort()).toEqual(["Nov/2026", "Out/2026"]);
  });
});
