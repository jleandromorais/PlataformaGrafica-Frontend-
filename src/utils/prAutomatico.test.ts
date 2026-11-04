import { describe, expect, it } from "vitest";
import { textoPRAutomatico } from "./prAutomatico";

const MESES = ["Nov/2026", "Dez/2026", "Jan/2027"];

describe("textoPRAutomatico", () => {
  it("mostra o antes e o depois do PR e do PV", () => {
    const r = textoPRAutomatico({ meses_pr: MESES, atualizado: true, pr_antes: 0, pr: -0.0071, pv_antes: null, pv: 2.4382, pendencias: [] });
    expect(r?.ok).toBe(true);
    expect(r?.texto).toContain("PR de Nov/2026 a Jan/2027 atualizado");
    expect(r?.texto).toMatch(/0,0000 → −?-?0,0071/);
    expect(r?.texto).toContain("PV: — → 2,4382");
  });

  it("com pendência, avisa que não gravou e diz o motivo", () => {
    const r = textoPRAutomatico({ meses_pr: MESES, atualizado: false, pr_antes: null, pr: null, pv_antes: null, pv: null,
      pendencias: ["Sem SCG gravado para Ago/2026."] });
    expect(r).toEqual({ ok: false, texto: "PR de Nov/2026 a Jan/2027 não foi atualizado: Sem SCG gravado para Ago/2026." });
  });

  it("PR gravado sem PV também pede atenção", () => {
    const r = textoPRAutomatico({ meses_pr: MESES, atualizado: true, pr_antes: null, pr: -0.0071, pv_antes: null, pv: null,
      pendencias: ["PV não atualizado: falta o PMPV de Nov/2026."] });
    expect(r?.ok).toBe(false);
    expect(r?.texto).toContain("falta o PMPV");
  });

  it("sem resposta do backend não mostra nada", () => {
    expect(textoPRAutomatico(null)).toBeNull();
  });
});
