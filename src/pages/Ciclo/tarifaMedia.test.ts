import { describe, expect, it } from "vitest";
import type { TarifaMedia } from "../../types";
import { descreverTarifaMedia, faixaDaChave } from "./tarifaMedia";

const base: TarifaMedia = {
  trimestre: "Fev/2026_Abr/2026", chave_pv: "Fev - Abr/2026", pv_gravado: 2.0944,
  margens: [{ ano: 2026, mb: 0.541, origem: "salva" }], tarifas: [{ ano: 2026, mb: 0.541, tarifa_media: 2.6354 }],
  cruza_ano: false, aviso: null, motivo: null,
};

describe("faixaDaChave", () => {
  it("tira o ano e usa travessão", () => {
    expect(faixaDaChave("Nov - Jan/2025")).toBe("Nov–Jan");
  });
});

describe("descreverTarifaMedia", () => {
  it("um ano: diz de onde vem cada parte, com a tarifa que o back mandou", () => {
    const d = descreverTarifaMedia(base);
    expect(d.cruzaAno).toBe(false);
    expect(d.linhas).toEqual([{ ano: 2026, origem: "PV gravado de Fev–Abr (2,0944) + MB 0,5410", mb: "0,5410", tarifa: "2,6354" }]);
    expect(d.motivo).toBeNull();
  });

  it("trimestre que cruza o ano: uma linha por ano, sem escolher", () => {
    const d = descreverTarifaMedia({
      ...base, chave_pv: "Nov - Jan/2025", cruza_ano: true,
      margens: [{ ano: 2025, mb: 0.52, origem: "salva" }, { ano: 2026, mb: 0.541, origem: "padrao" }],
      tarifas: [{ ano: 2025, mb: 0.52, tarifa_media: 2.6144 }, { ano: 2026, mb: 0.541, tarifa_media: 2.6354 }],
      aviso: "O trimestre cruza o ano e as MBs são diferentes: o analista precisa confirmar.",
    });
    expect(d.cruzaAno).toBe(true);
    expect(d.linhas.map((l) => l.ano)).toEqual([2025, 2026]);
    expect(d.linhas[0].origem).toBe("PV gravado de Nov–Jan (2,0944) + MB 0,5200");
    expect(d.linhas[1].origem).toBe("PV gravado de Nov–Jan (2,0944) + MB 0,5410");
    expect(d.linhas.map((l) => l.origem).join(" ")).not.toMatch(/sugerida|não confirmada|ainda não salva/);
    expect(d.aviso).toBe("O trimestre cruza o ano e as MBs são diferentes: o analista precisa confirmar.");
  });

  it("sem PV: diz que não está gravado, sem tarifa, e mostra o motivo do back com ponto final", () => {
    const d = descreverTarifaMedia({ ...base, pv_gravado: null, tarifas: [{ ano: 2026, mb: 0.541, tarifa_media: null }], motivo: "grave o PV primeiro" });
    expect(d.linhas[0]).toEqual({ ano: 2026, origem: "PV de Fev–Abr ainda não gravado + MB 0,5410", mb: "0,5410", tarifa: null });
    expect(d.motivo).toBe("Grave o PV primeiro.");
  });

  it("sem MB: a linha diz que falta e não inventa tarifa", () => {
    const d = descreverTarifaMedia({
      ...base, margens: [{ ano: 2026, mb: null, origem: "ausente" }], tarifas: [{ ano: 2026, mb: null, tarifa_media: null }],
      motivo: "informe a MB de 2026 (margem de distribuição) no PMPV", aviso: "Falta a MB de 2026.",
    });
    expect(d.linhas[0]).toEqual({ ano: 2026, origem: "PV gravado de Fev–Abr (2,0944) + MB de 2026: sem valor", mb: null, tarifa: null });
    expect(d.motivo).toBe("Informe a MB de 2026 (margem de distribuição) no PMPV.");
    expect(d.aviso).toBe("Falta a MB de 2026.");
  });

  it("sem lista de tarifas, usa as margens para montar as linhas", () => {
    const d = descreverTarifaMedia({ ...base, tarifas: [] });
    expect(d.linhas).toHaveLength(1);
    expect(d.linhas[0].tarifa).toBeNull();
  });
});
