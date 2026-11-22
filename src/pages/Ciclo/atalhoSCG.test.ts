import { describe, expect, it } from "vitest";
import { atalhoDoSCG } from "./atalhoSCG";

describe("atalhoDoSCG: a linha do passo 6 entre os blocos recolhidos", () => {
  it("pronto: só lembra onde se grava", () => {
    const a = atalhoDoSCG({ situacao: "ok", ehProximo: false, mesesDivergentes: [] });
    expect(a.texto).toBe("Passo 6 · SCG: gravado na tela SCG");
    expect(a.tom).toBe("normal");
  });
  it("faltando mas não é o próximo: continua neutro", () => {
    const a = atalhoDoSCG({ situacao: "falta", ehProximo: false, mesesDivergentes: [] });
    expect(a.tom).toBe("normal");
    expect(a.texto).toBe("Passo 6 · SCG: ainda não gravado");
  });
  it("divergente: diz os meses e chama atenção", () => {
    const a = atalhoDoSCG({ situacao: "atencao", ehProximo: false, mesesDivergentes: ["Ago/2026", "Set/2026"] });
    expect(a.texto).toBe("Passo 6 · SCG: diverge dos módulos em Ago e Set");
    expect(a.tom).toBe("atencao");
  });
  it("é o próximo passo: destaca", () => {
    const a = atalhoDoSCG({ situacao: "falta", ehProximo: true, mesesDivergentes: [] });
    expect(a.tom).toBe("proximo");
    expect(a.texto).toBe("Passo 6 · SCG: é o próximo passo, grave na tela SCG");
  });
});
