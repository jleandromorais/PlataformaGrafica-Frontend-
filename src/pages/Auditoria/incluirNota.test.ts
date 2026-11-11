import { describe, expect, it } from "vitest";
import { pedidoDeInclusao, podeIncluirNota } from "./incluirNota";
import type { NotaSoNaPlanilha } from "../../types";

// Valores fictícios.
const nota: NotaSoNaPlanilha = {
  empresa: "Empresa X", supridor: "EMPRESA X", numero: "123", numero_normalizado: "123",
  linha_excel: 10, periodo_linha: "Jul/2026", cgr_planilha: 1000, valor_planilha: 1200,
  dados_linha: { "Vol m³": 100 },
};

describe("podeIncluirNota", () => {
  it("aceita a nota do modelo por nota, com CGR da planilha", () => {
    expect(podeIncluirNota(nota)).toBe(true);
  });
  it("recusa nota sem CGR da planilha (outros modelos)", () => {
    expect(podeIncluirNota({ ...nota, cgr_planilha: undefined })).toBe(false);
  });
  it("recusa nota sem número", () => {
    expect(podeIncluirNota({ ...nota, numero: "" })).toBe(false);
  });
});

describe("pedidoDeInclusao", () => {
  it("monta o pedido com os números da planilha e o motivo sem espaços", () => {
    expect(pedidoDeInclusao(nota, "  fornecedor não mandou ")).toEqual({
      empresa: "Empresa X", numero: "123", cgr_liquido: 1000, valor_total: 1200,
      volume_total: 100, linha_excel: 10, motivo: "fornecedor não mandou",
    });
  });
  it("sem motivo não monta o pedido", () => {
    expect(pedidoDeInclusao(nota, "   ")).toBeNull();
  });
  it("usa o supridor quando falta a empresa e ignora volume que não é número", () => {
    const p = pedidoDeInclusao({ ...nota, empresa: undefined, dados_linha: { "Vol m³": "—" } }, "ok");
    expect(p?.empresa).toBe("EMPRESA X");
    expect(p?.volume_total).toBeUndefined();
  });
});
