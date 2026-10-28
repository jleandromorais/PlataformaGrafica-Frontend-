import { describe, expect, it } from "vitest";
import { deslocaPeriodo, lerPeriodo, mesesDoPRDoCivil } from "./periodos";
import { linkDoCiclo } from "./periodoNaUrl";

describe("lerPeriodo", () => {
  it("lê Mmm/AAAA", () => {
    expect(lerPeriodo("Mai/2026")).toEqual({ mes: 4, ano: 2026 });
    expect(lerPeriodo("Jan/2000")).toEqual({ mes: 0, ano: 2000 });
  });

  it.each([["Xyz/99"], ["mai/2026"], ["Mai/26"], ["Mai/1999"], [""], [null], [undefined]])("%s → null", (texto) => {
    expect(lerPeriodo(texto)).toBeNull();
  });
});

describe("deslocaPeriodo", () => {
  it("vira o ano nos dois sentidos", () => {
    expect(deslocaPeriodo("Nov/2026", 2)).toBe("Jan/2027");
    expect(deslocaPeriodo("Jan/2027", -2)).toBe("Nov/2026");
  });
});

describe("mesesDoPRDoCivil (contrato-de-enderecos.md)", () => {
  it.each([
    ["Mar/2026", ["Mai/2026", "Jun/2026", "Jul/2026"]],
    ["Jun/2026", ["Ago/2026", "Set/2026", "Out/2026"]],
    ["Set/2026", ["Nov/2026", "Dez/2026", "Jan/2027"]],
    ["Dez/2026", ["Fev/2027", "Mar/2027", "Abr/2027"]],
  ])("trimestre civil que termina em %s → PR de %j", (ultimo, esperado) => {
    expect(mesesDoPRDoCivil(ultimo)).toEqual(esperado);
  });
});

describe("linkDoCiclo", () => {
  it("leva o período e o trimestre do Painel", () => {
    expect(linkDoCiclo("/cgf", "Abr/2026", { chave: "periodo", valor: "Mai/2026" }))
      .toBe("/cgf?periodo=Mai%2F2026&de=ciclo&ciclo=Abr%2F2026");
  });

  it("sem período (RET) só leva a volta ao Painel", () => {
    expect(linkDoCiclo("/ret", "Abr/2026")).toBe("/ret?de=ciclo&ciclo=Abr%2F2026");
  });
});
