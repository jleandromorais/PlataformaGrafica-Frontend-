import { describe, expect, it } from "vitest";
import { trimestresDoCicloTocados } from "./trimestresDoCicloTocados";

const tres = (a: string, b: string, c: string, ano = 2026) => [`${a}/${ano}`, `${b}/${ano}`, `${c}/${ano}`];

describe("trimestresDoCicloTocados (todo trimestre civil toca dois do ciclo)", () => {
  it("Jan a Mar: Nov a Jan (cobre Jan) e Fev a Abr (cobre Fev, Mar)", () => {
    const r = trimestresDoCicloTocados(tres("Jan", "Fev", "Mar"), [0, 0, 0]);
    expect(r.map((t) => t.rotulo)).toEqual(["Nov/2025 a Jan/2026", "Fev a Abr/2026"]);
    expect(r.map((t) => t.mesesCobertos)).toEqual([["Jan/2026"], ["Fev/2026", "Mar/2026"]]);
  });

  it("Abr a Jun: Fev a Abr (cobre Abr) e Mai a Jul (cobre Mai, Jun)", () => {
    const r = trimestresDoCicloTocados(tres("Abr", "Mai", "Jun"), [0, 0, 0]);
    expect(r.map((t) => t.rotulo)).toEqual(["Fev a Abr/2026", "Mai a Jul/2026"]);
    expect(r.map((t) => t.mesesCobertos)).toEqual([["Abr/2026"], ["Mai/2026", "Jun/2026"]]);
  });

  it("Jul a Set: Mai a Jul (cobre Jul) e Ago a Out (cobre Ago, Set)", () => {
    const r = trimestresDoCicloTocados(tres("Jul", "Ago", "Set"), [0, 0, 0]);
    expect(r.map((t) => t.rotulo)).toEqual(["Mai a Jul/2026", "Ago a Out/2026"]);
    expect(r.map((t) => t.mesesCobertos)).toEqual([["Jul/2026"], ["Ago/2026", "Set/2026"]]);
  });

  it("Out a Dez: Ago a Out (cobre Out) e Nov a Jan, que cruza o ano (cobre Nov, Dez)", () => {
    const r = trimestresDoCicloTocados(tres("Out", "Nov", "Dez"), [0, 0, 0]);
    expect(r.map((t) => t.rotulo)).toEqual(["Ago a Out/2026", "Nov/2026 a Jan/2027"]);
    expect(r.map((t) => t.mesesCobertos)).toEqual([["Out/2026"], ["Nov/2026", "Dez/2026"]]);
  });

  it("guarda a chave do PMPV (trimestre e ano do 1º mês), sem mudar o formato gravado", () => {
    const r = trimestresDoCicloTocados(tres("Jan", "Fev", "Mar"), [0, 0, 0]);
    expect(r.map((t) => [t.trimestre, t.ano])).toEqual([["Nov - Jan", 2025], ["Fev - Abr", 2026]]);
  });

  it("cada trimestre do ciclo só fica pronto quando todos os meses que ele cobre têm PMPV", () => {
    const r = trimestresDoCicloTocados(tres("Abr", "Mai", "Jun"), [2.0944, 2.1, 0]);
    expect(r[0]).toMatchObject({ pronto: true, mesesQueFaltam: [] });
    expect(r[1]).toMatchObject({ pronto: false, mesesQueFaltam: ["Jun/2026"] });
    expect(r[1].valores).toEqual([{ mes: "Mai/2026", pmpv: 2.1 }, { mes: "Jun/2026", pmpv: 0 }]);
  });

  it("tudo salvo: os dois prontos; nada salvo: os dois faltando", () => {
    expect(trimestresDoCicloTocados(tres("Jul", "Ago", "Set"), [1, 1, 1]).every((t) => t.pronto)).toBe(true);
    expect(trimestresDoCicloTocados(tres("Jul", "Ago", "Set"), [0, 0, 0]).some((t) => t.pronto)).toBe(false);
  });

  it("um mês sem valor na lista conta como faltando", () => {
    const r = trimestresDoCicloTocados(tres("Jul", "Ago", "Set"), [1]);
    expect(r[1].mesesQueFaltam).toEqual(["Ago/2026", "Set/2026"]);
  });
});
