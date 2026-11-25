import { describe, expect, it } from "vitest";
import { chaveDoPRDoMes, lerPRDigitado, mesesDaChave, motivoDoPRValido, problemaDoPRDigitado, textoDoPRManual } from "./prManual";

describe("lerPRDigitado", () => {
  it.each([["-0,0321", -0.0321], ["−0,0321", -0.0321], ["0,0321", 0.0321], ["-0.0321", -0.0321], [" -0,03214 ", -0.0321], ["-1.234,5678", -1234.5678]])(
    "%s → %s", (texto, esperado) => { expect(lerPRDigitado(texto)).toBe(esperado); });
  it.each(["", "abc", "1,2,3", "--1", "-"])("%j não é número", (t) => { expect(lerPRDigitado(t)).toBeNull(); });
});

describe("problemaDoPRDigitado", () => {
  it("campo vazio ainda não é problema", () => { expect(problemaDoPRDigitado("")).toBeNull(); });
  it("texto que não é número", () => { expect(problemaDoPRDigitado("x")).toMatch(/número/); });
  it("zero", () => { expect(problemaDoPRDigitado("0,0000")).toMatch(/zero/); });
  it("valor absurdo", () => { expect(problemaDoPRDigitado("50")).toMatch(/errado/); });
  it("valor bom, inclusive negativo", () => { expect(problemaDoPRDigitado("-0,0321")).toBeNull(); });
});

describe("chaveDoPRDoMes", () => {
  it.each([
    ["Mai/2026", "Mai - Jul/2026"], ["Jun/2026", "Mai - Jul/2026"], ["Jul/2026", "Mai - Jul/2026"],
    ["Abr/2026", "Fev - Abr/2026"], ["Fev/2026", "Fev - Abr/2026"], ["Out/2026", "Ago - Out/2026"],
    ["Nov/2026", "Nov - Jan/2027"], ["Dez/2026", "Nov - Jan/2027"], ["Jan/2027", "Nov - Jan/2027"], ["Jan/2026", "Nov - Jan/2026"],
  ])("%s → %s", (mes, chave) => { expect(chaveDoPRDoMes(mes)).toBe(chave); });
  it("mês inválido", () => { expect(chaveDoPRDoMes("xx")).toBeNull(); });
  it("meses do SR que dividem o mesmo PR", () => {
    expect(mesesDaChave(["Abr/2026", "Mai/2026", "Jun/2026"], "Mai - Jul/2026")).toEqual(["Mai/2026", "Jun/2026"]);
  });
});

describe("textos", () => {
  it("motivo precisa de 5 letras", () => {
    expect(motivoDoPRValido(" abc ")).toBe(false);
    expect(motivoDoPRValido("valor oficial")).toBe(true);
  });
  it("linha do PR manual", () => {
    const t = textoDoPRManual({ pr: -0.0321, pr_motivo: "valor da NT", pr_usuario: "Ana", pr_data: "2026-11-25 14:02" });
    expect(t).toContain("PR manual");
    expect(t).toContain("0,0321");
    expect(t).toContain("valor da NT");
    expect(t).toContain("25/11 14:02");
    expect(t).toContain("Ana");
  });
});
