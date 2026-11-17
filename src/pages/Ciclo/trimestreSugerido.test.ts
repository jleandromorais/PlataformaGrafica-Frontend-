import { describe, expect, it } from "vitest";
import { trimestreSugerido } from "./trimestreSugerido";

// Datas no meio do mês (evita fuso e virada de dia).
const em = (ano: number, mes: number) => trimestreSugerido(new Date(ano, mes, 15));

describe("trimestreSugerido", () => {
  it("janeiro e março caem em Out–Dez do ano anterior", () => {
    expect(em(2027, 0)).toEqual({ ano: 2026, tri: 3 });
    expect(em(2027, 2)).toEqual({ ano: 2026, tri: 3 });
  });
  it("abril sugere Jan–Mar do mesmo ano", () => {
    expect(em(2026, 3)).toEqual({ ano: 2026, tri: 0 });
  });
  it("julho sugere Abr–Jun", () => {
    expect(em(2026, 6)).toEqual({ ano: 2026, tri: 1 });
  });
  it("outubro sugere Jul–Set", () => {
    expect(em(2026, 9)).toEqual({ ano: 2026, tri: 2 });
  });
  it("dezembro ainda sugere Jul–Set (Out–Dez não terminou)", () => {
    expect(em(2026, 11)).toEqual({ ano: 2026, tri: 2 });
  });
});
