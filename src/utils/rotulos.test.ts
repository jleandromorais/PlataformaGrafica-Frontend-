import { describe, expect, it } from "vitest";
import {
  faixaDosMeses, rotuloCurtoDoTrimestre, rotuloDoPeriodo, rotuloDoTrimestreDoCiclo,
} from "./rotulos";

describe("faixaDosMeses", () => {
  it("mesmo ano: Jul a Set/2026", () => {
    expect(faixaDosMeses(["Jul/2026", "Ago/2026", "Set/2026"])).toBe("Jul a Set/2026");
  });
  it("anos diferentes: Nov/2026 a Jan/2027", () => {
    expect(faixaDosMeses(["Nov/2026", "Dez/2026", "Jan/2027"])).toBe("Nov/2026 a Jan/2027");
  });
  it("um mês só, ou nenhum", () => {
    expect(faixaDosMeses(["Jul/2026"])).toBe("Jul/2026");
    expect(faixaDosMeses([])).toBe("");
  });
});

describe("os 4 trimestres civis", () => {
  const civis: [string[], string][] = [
    [["Jan/2026", "Fev/2026", "Mar/2026"], "Jan a Mar/2026"],
    [["Abr/2026", "Mai/2026", "Jun/2026"], "Abr a Jun/2026"],
    [["Jul/2026", "Ago/2026", "Set/2026"], "Jul a Set/2026"],
    [["Out/2026", "Nov/2026", "Dez/2026"], "Out a Dez/2026"],
  ];
  it.each(civis)("%j", (meses, esperado) => {
    expect(rotuloDoPeriodo(meses)).toBe(esperado);
    expect(rotuloDoPeriodo(meses, "civil")).toBe(`${esperado} (civil)`);
  });
});

describe("os 4 trimestres do ciclo (ano = o do 1º mês, como o PMPV e o PV guardam)", () => {
  it.each([
    ["Nov - Jan", 2026, "Nov/2026 a Jan/2027"],
    ["Fev - Abr", 2026, "Fev a Abr/2026"],
    ["Mai - Jul", 2026, "Mai a Jul/2026"],
    ["Ago - Out", 2026, "Ago a Out/2026"],
  ])("%s/%i", (tri, ano, esperado) => {
    expect(rotuloDoTrimestreDoCiclo(tri, ano)).toBe(esperado);
    expect(rotuloDoTrimestreDoCiclo(tri, ano, "ciclo")).toBe(`${esperado} (ciclo)`);
  });

  it("aceita o travessão que as telas usavam", () => {
    expect(rotuloDoTrimestreDoCiclo("Nov – Jan", 2025)).toBe("Nov/2025 a Jan/2026");
  });

  it("nome que não é de trimestre volta como veio", () => {
    expect(rotuloDoTrimestreDoCiclo("qualquer", 2026)).toBe("qualquer");
  });
});

describe("rótulo curto dos botões", () => {
  it.each([
    ["Jan – Mar", "Jan a Mar"], ["Abr - Jun", "Abr a Jun"], ["Nov - Jan", "Nov a Jan"], ["Ago a Out", "Ago a Out"],
  ])("%s", (entrada, esperado) => {
    expect(rotuloCurtoDoTrimestre(entrada)).toBe(esperado);
  });
});
