import { describe, expect, it } from "vitest";
import {
  ID_CARTAO, linkParaGravarNoPainel, linkParaGravarPR, linkParaGravarPV, primeiroMesCivilDoCiclo, secaoPedidaNaUrl,
} from "./gravarNoPainel";

describe("o trimestre civil do Painel que grava o PR e o PV", () => {
  it("é o que está 4 meses antes do 1º mês do trimestre do ciclo", () => {
    expect(primeiroMesCivilDoCiclo("Nov/2026")).toBe("Jul/2026"); // Nov–Jan define-se com Jul–Set
    expect(primeiroMesCivilDoCiclo("Fev/2026")).toBe("Out/2025"); // cruza o ano
    expect(primeiroMesCivilDoCiclo("Mai/2026")).toBe("Jan/2026");
    expect(primeiroMesCivilDoCiclo("Ago/2026")).toBe("Abr/2026");
  });

  it("mês inválido não vira trimestre", () => {
    expect(primeiroMesCivilDoCiclo("Teste")).toBeNull();
    expect(primeiroMesCivilDoCiclo(null)).toBeNull();
  });
});

describe("links 'Gravar no Painel'", () => {
  it("SR: o Painel no trimestre civil e o cartão do SR", () => {
    expect(linkParaGravarNoPainel("sr", "Jul/2026")).toBe("/ciclo?trimestre=Jul%2F2026&abrir=sr");
  });

  it("PR e PV: partem do trimestre do ciclo e caem no trimestre civil que os define", () => {
    expect(linkParaGravarPR("Nov/2026")).toBe("/ciclo?trimestre=Jul%2F2026&abrir=pr");
    expect(linkParaGravarPV("Fev/2026")).toBe("/ciclo?trimestre=Out%2F2025&abrir=pv");
  });

  it("sem período válido, abre o Painel e o cartão no trimestre sugerido", () => {
    expect(linkParaGravarNoPainel("pr", null)).toBe("/ciclo?abrir=pr");
    expect(linkParaGravarPR("???")).toBe("/ciclo?abrir=pr");
  });
});

describe("seção pedida na URL do Painel", () => {
  it("aceita só os cartões que existem", () => {
    expect(secaoPedidaNaUrl("sr")).toBe(ID_CARTAO.sr);
    expect(secaoPedidaNaUrl("pr")).toBe(ID_CARTAO.pr);
    expect(secaoPedidaNaUrl("pv")).toBe(ID_CARTAO.pv);
    expect(secaoPedidaNaUrl("entregas")).toBeNull();
    expect(secaoPedidaNaUrl(null)).toBeNull();
  });

  it("os ids dos cartões são distintos", () => {
    expect(new Set(Object.values(ID_CARTAO)).size).toBe(3);
  });
});
