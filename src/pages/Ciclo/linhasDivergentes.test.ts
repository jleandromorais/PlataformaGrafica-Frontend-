import { describe, expect, it } from "vitest";
import { linhasDivergentes } from "./linhasDivergentes";
import type { SCGComparacao } from "../../types";

// Valores fictícios.
const base = { cgr: 100, cgf: 40, rpv: 60, ret: 10, rp: 5, scg: 75 };

describe("linhasDivergentes", () => {
  it("mostra o SCG e os campos que diferem, com a diferença", () => {
    const c: SCGComparacao = { periodo: "Jul/2026", modulos: { ...base, rp: 15, scg: 85 }, gravado: base };
    const l = linhasDivergentes(c);
    expect(l.map((x) => x.campo)).toEqual(["rp", "scg"]);
    expect(l[1]).toMatchObject({ modulos: 85, gravado: 75, diferenca: 10 });
  });
  it("ignora diferença de centavo, mas sempre traz o SCG", () => {
    const c: SCGComparacao = { periodo: "Jul/2026", modulos: { ...base, ret: 10.004 }, gravado: base };
    expect(linhasDivergentes(c).map((x) => x.campo)).toEqual(["scg"]);
  });
  it("sem gravado: só o SCG, sem diferença", () => {
    const c: SCGComparacao = { periodo: "Jul/2026", modulos: base, gravado: null };
    expect(linhasDivergentes(c)).toEqual([{ campo: "scg", rotulo: "SCG", modulos: 75, gravado: null, diferenca: null }]);
  });
});
