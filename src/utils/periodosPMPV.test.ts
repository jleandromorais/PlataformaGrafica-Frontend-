import { describe, expect, it } from "vitest";
import { linkDoPMPV, trimestreDoPMPVNaUrl, trimestreFiscalDoMes } from "./periodos";

describe("PMPV pelo Painel do Ciclo", () => {
  it.each([
    ["Ago/2026", "Ago - Out", 2026], ["Out/2026", "Ago - Out", 2026], ["Nov/2026", "Nov - Jan", 2026],
    ["Jan/2027", "Nov - Jan", 2026], ["Fev/2027", "Fev - Abr", 2027], ["Abr/2026", "Fev - Abr", 2026],
    ["Mai/2026", "Mai - Jul", 2026], ["Jul/2026", "Mai - Jul", 2026],
  ])("%s está no trimestre do ciclo %s (ano %i)", (mes, tri, ano) => {
    expect(trimestreFiscalDoMes(mes)).toEqual({ trimestre: tri, ano });
  });

  it("mês inválido → null", () => expect(trimestreFiscalDoMes("xx")).toBeNull());

  it("o PMPV do trimestre novo (Ago a Out) é diferente do apurado (Abr a Jun)", () => {
    const novo = linkDoPMPV("Abr/2026", "Ago/2026");
    const apurado = linkDoPMPV("Abr/2026", "Abr/2026");
    expect(novo).toBe("/pmpv?trimestre=Ago+-+Out&ano=2026&de=ciclo&ciclo=Abr%2F2026");
    expect(apurado).not.toBe(novo);
    expect(new URLSearchParams(novo.split("?")[1]).get("trimestre")).toBe("Ago - Out");
  });

  it("a tela lê de volta o que o link escreveu", () => {
    const params = new URLSearchParams(linkDoPMPV("Out/2026", "Fev/2027").split("?")[1]);
    expect(trimestreDoPMPVNaUrl(params, ["Nov - Jan", "Fev - Abr"])).toEqual({ trimestre: "Fev - Abr", ano: 2027 });
  });

  it("pedido que a API não conhece ou ano inválido é ignorado", () => {
    expect(trimestreDoPMPVNaUrl(new URLSearchParams("trimestre=Xyz&ano=2026"), ["Fev - Abr"])).toBeNull();
    expect(trimestreDoPMPVNaUrl(new URLSearchParams("trimestre=Fev - Abr&ano=abc"), ["Fev - Abr"])).toBeNull();
    expect(trimestreDoPMPVNaUrl(new URLSearchParams(""), ["Fev - Abr"])).toBeNull();
  });
});
