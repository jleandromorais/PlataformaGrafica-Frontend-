import { describe, expect, it } from "vitest";
import { avisosDeDivergenciaDoPV, chaveDoPR, chaveDoPV, prSubstitui, pvSubstitui, rotuloDoCartao } from "./cartoesPRePV";

describe("chaves gravadas do PR e do PV (não mudam)", () => {
  it("PR usa o ano do ÚLTIMO mês, PV o do 1º", () => {
    const meses = ["Nov/2026", "Dez/2026", "Jan/2027"];
    expect(chaveDoPR(meses)).toBe("Nov - Jan/2027");
    expect(chaveDoPV(meses)).toEqual({ trimestre: "Nov - Jan", ano: 2026, chave: "Nov - Jan/2026" });
  });

  it("trimestre que não cruza o ano tem o mesmo ano nos dois", () => {
    const meses = ["Fev/2027", "Mar/2027", "Abr/2027"];
    expect(chaveDoPR(meses)).toBe("Fev - Abr/2027");
    expect(chaveDoPV(meses).chave).toBe("Fev - Abr/2027");
  });

  it("os 4 trimestres do ciclo", () => {
    expect(chaveDoPR(["Mai/2026", "Jun/2026", "Jul/2026"])).toBe("Mai - Jul/2026");
    expect(chaveDoPR(["Ago/2026", "Set/2026", "Out/2026"])).toBe("Ago - Out/2026");
  });
});

describe("quando gravar substitui um valor já gravado", () => {
  it("PR: nada gravado ainda não substitui; igual não substitui; diferente substitui", () => {
    expect(prSubstitui(null, -0.0295)).toBe(false);
    expect(prSubstitui(-0.0295, -0.0295)).toBe(false);
    expect(prSubstitui(-0.0295, -0.0296)).toBe(true);
  });

  it("PV: tolera meio décimo-milésimo (4 casas)", () => {
    expect(pvSubstitui(null, 2.1)).toBe(false);
    expect(pvSubstitui(2.1, 2.10003)).toBe(false);
    expect(pvSubstitui(2.1, 2.1002)).toBe(true);
  });
});

describe("rótulo do cartão", () => {
  it("diz o passo e a faixa dos meses reais", () => {
    expect(rotuloDoCartao("pr", ["Nov/2026", "Dez/2026", "Jan/2027"])).toBe("PR de Nov/2026 a Jan/2027");
    expect(rotuloDoCartao("pv", ["Fev/2026", "Mar/2026", "Abr/2026"])).toBe("PV de Fev a Abr/2026");
  });
});

describe("avisosDeDivergenciaDoPV: o aviso de rotina não é divergência", () => {
  const rotina = "O PV salvo (2,1000) difere do atual pelos módulos (2,2000): PMPV ou PR mudaram depois. Confira e salve de novo para atualizar.";
  const real = "O PMPV está diferente entre os meses (Nov/2026 = 2,1, Dez/2026 = 2,2). Usei o de Nov/2026; confira.";

  it("só o aviso 'PV salvo difere', com a troca já mostrada na janela: nenhuma divergência", () => {
    expect(avisosDeDivergenciaDoPV([rotina], true)).toEqual([]);
  });
  it("aviso real continua divergência, mesmo ao lado do de rotina", () => {
    expect(avisosDeDivergenciaDoPV([rotina, real], true)).toEqual([real]);
  });
  it("na dúvida, diverge: o aviso de rotina sem troca visível (substitui falso) não é descartado", () => {
    expect(avisosDeDivergenciaDoPV([rotina], false)).toEqual([rotina]);
  });
  it("texto desconhecido do servidor é divergência", () => {
    expect(avisosDeDivergenciaDoPV(["PR de Nov - Jan/2026 não foi salvo: rode o módulo PR."], true)).toHaveLength(1);
  });
});
