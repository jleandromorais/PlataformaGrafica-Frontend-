import { describe, expect, it } from "vitest";
import { estadoDaProvaRET, ORIENTACAO_RET, textoForaDoRET } from "./estadoProva";
import type { ProvaRealRET } from "../../types";

const base: ProvaRealRET = {
  periodo: "Jan/2026", tem_itens: true, qtd_documentos: 4, qtd_eat: 2, qtd_ec: 2, qtd_outros: 0,
  eat_bruto: 0, pis_cofins_rate: 0.0925, eat_liquido: 0, ec: 1760685.43,
  ret_calculado: 1760685.43, ret_gravado: 1760685.43, diferenca: 0, confere: true, por_empresa: [], data_atualizacao: "2026-02-01 10:00",
};

describe("estadoDaProvaRET", () => {
  it("confere quando a conta refeita bate com o gravado", () => {
    expect(estadoDaProvaRET(base)).toBe("confere");
  });
  it("diverge quando há itens e o gravado é diferente", () => {
    expect(estadoDaProvaRET({ ...base, confere: false, diferenca: 10 })).toBe("diverge");
  });
  it("mês gravado só com o total não tem como provar", () => {
    expect(estadoDaProvaRET({ ...base, tem_itens: false, ret_calculado: null, diferenca: null, confere: false })).toBe("so_total");
  });
  it("sem RET gravado, o mês ainda não foi gravado", () => {
    expect(estadoDaProvaRET({ ...base, ret_gravado: null, confere: false })).toBe("nao_gravado");
    expect(estadoDaProvaRET({ ...base, tem_itens: false, ret_gravado: null })).toBe("nao_gravado");
  });
});

describe("textos", () => {
  it("manda reprocessar no Painel do Ciclo quando não confere", () => {
    expect(ORIENTACAO_RET.diverge).toContain("Painel do Ciclo");
  });
  it("concorda no singular e no plural", () => {
    expect(textoForaDoRET(1)).toBe("1 documento fora do RET");
    expect(textoForaDoRET(3)).toBe("3 documentos fora do RET");
  });
});
