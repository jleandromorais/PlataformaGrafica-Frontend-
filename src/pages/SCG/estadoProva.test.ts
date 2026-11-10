import { describe, expect, it } from "vitest";
import { ORIENTACAO_SCG, estadoDaProvaSCG, linkDoModulo } from "./estadoProva";
import { seloDaOrigem } from "../../utils/origemDoValor";
import type { ProvaRealSCG } from "../../types";

const base: ProvaRealSCG = {
  periodo: "Fev/2026", gravado: true, cgr: 100, cgf: 60, rpv: 40, ret: 10, rp: -5,
  rpv_calculado: 40, scg_calculado: 45, scg_gravado: 45, diferenca: 0, confere: true,
  origens: {
    cgr: { tem_itens: true, valor_das_notas: 100, confere: true },
    cgf: { tem_resumo: true, valor_calculado: 60, confere: true },
    ret: { tem_itens: true, valor_calculado: 10, confere: true },
    rp: { tem_itens: false, valor_calculado: null, confere: false },
  },
  data_atualizacao: "2026-03-01 10:00",
};

describe("estadoDaProvaSCG", () => {
  it("confere quando a soma refeita bate com o gravado", () => {
    expect(estadoDaProvaSCG(base)).toBe("confere");
  });
  it("diverge quando o gravado é diferente", () => {
    expect(estadoDaProvaSCG({ ...base, confere: false, diferenca: 3 })).toBe("diverge");
  });
  it("sem SCG gravado, o mês ainda não foi gravado", () => {
    expect(estadoDaProvaSCG({ ...base, gravado: false, scg_gravado: null, diferenca: null, confere: false })).toBe("nao_gravado");
    expect(estadoDaProvaSCG({ ...base, scg_gravado: null })).toBe("nao_gravado");
  });
  it("diz o que fazer quando não confere", () => {
    expect(ORIENTACAO_SCG.diverge).toContain("salve de novo");
  });
});

describe("seloDaOrigem", () => {
  it("sem itens não dá para provar; com itens, confere ou não", () => {
    expect(seloDaOrigem(false, false)).toBe("sem_itens");
    expect(seloDaOrigem(false, true)).toBe("sem_itens");
    expect(seloDaOrigem(true, true)).toBe("confere");
    expect(seloDaOrigem(true, false)).toBe("diverge");
  });
});

describe("linkDoModulo", () => {
  it("leva a tela do módulo para o mesmo mês", () => {
    expect(linkDoModulo("/ret", "Fev/2026")).toBe("/ret?periodo=Fev%2F2026");
  });
});
