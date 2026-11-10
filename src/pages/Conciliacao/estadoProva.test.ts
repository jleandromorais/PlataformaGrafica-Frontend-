import { describe, expect, it } from "vitest";
import {
  ORIENTACAO_RP, estadoDaProvaRP, filtrarItens, itemNaoLido, qtdNaoLidos, situacaoDaProvaRP, textoDuplicada, textoNaoLidos, textoQtdRepetidas,
} from "./estadoProva";
import type { ProvaRealItemRP, ProvaRealRP } from "../../types";

/** O formato de moeda usa espaço que não quebra linha; no teste, espaço comum. */
const semNbsp = (t: string) => t.split(String.fromCharCode(160)).join(" ");

const item = (extra: Partial<ProvaRealItemRP> = {}): ProvaRealItemRP => ({
  arquivo: "a.pdf", nome: "NDPFP03882", lado: "receita", tipo: "PFP", numero: "03882",
  valor: 100, liquido: 90.75, status: "OK", repetida: false, ...extra,
});
const base: ProvaRealRP = {
  periodo: "Fev/2026", tem_itens: true, qtd_itens: 29, taxa: 0.0925,
  receitas: { qtd: 10, bruto: 100, liquido: 90.75 }, despesas: { qtd: 19, bruto: 50, liquido: 45.37 },
  ja_no_ret: { qtd: 0, bruto: 0 }, rp_calculado: -4183559.68, rp_gravado: -4183559.68, diferenca: 0, confere: true,
  itens: [], possiveis_duplicadas: [], data_atualizacao: "2026-03-01 10:00",
};

describe("estadoDaProvaRP", () => {
  it("confere quando a conta refeita bate com o gravado", () => {
    expect(estadoDaProvaRP(base)).toBe("confere");
  });
  it("diverge quando há notas e o gravado é diferente", () => {
    expect(estadoDaProvaRP({ ...base, confere: false, diferenca: 22908.01 })).toBe("diverge");
  });
  it("mês gravado só com o total não tem como provar", () => {
    expect(estadoDaProvaRP({ ...base, tem_itens: false, rp_calculado: null, diferenca: null, confere: false })).toBe("so_total");
  });
  it("sem RP gravado, o mês ainda não foi gravado", () => {
    expect(estadoDaProvaRP({ ...base, rp_gravado: null })).toBe("nao_gravado");
  });
  it("manda reprocessar no Painel do Ciclo quando não confere", () => {
    expect(ORIENTACAO_RP.diverge).toContain("Reprocesse o RP do mês no Painel do Ciclo");
  });
});

describe("filtrarItens", () => {
  const itens = [
    item({ numero: "1" }),
    item({ numero: "2", lado: "despesa", repetida: true }),
    item({ numero: "3", lado: "ja_no_ret", liquido: 0 }),
  ];
  it("todas mantém tudo, na ordem", () => {
    expect(filtrarItens(itens, "todas").map((i) => i.numero)).toEqual(["1", "2", "3"]);
  });
  it("só repetidas", () => {
    expect(filtrarItens(itens, "repetidas").map((i) => i.numero)).toEqual(["2"]);
  });
  it("receitas e despesas deixam de fora o que já está no RET", () => {
    expect(filtrarItens(itens, "receitas").map((i) => i.numero)).toEqual(["1"]);
    expect(filtrarItens(itens, "despesas").map((i) => i.numero)).toEqual(["2"]);
  });
});

describe("textoDuplicada", () => {
  const dup = { tipo: "TOP", numero: "03901", qtd: 2, valor_total: 45816.02, liquido_total: 41578, arquivos: ["a.pdf", "b.pdf"] };
  it("diz quantas vezes e o valor de cada uma", () => {
    const itens = [item({ tipo: "TOP", numero: "03901", valor: 22908.01, repetida: true }), item({ tipo: "TOP", numero: "03901", valor: 22908.01, repetida: true })];
    expect(semNbsp(textoDuplicada(dup, itens))).toBe("TOP 03901 aparece 2 vezes (R$ 22.908,01 e R$ 22.908,01).");
  });
  it("sem os itens na lista, usa a soma", () => {
    expect(semNbsp(textoDuplicada(dup, []))).toBe("TOP 03901 aparece 2 vezes (soma R$ 45.816,02).");
  });
});

describe("textoQtdRepetidas", () => {
  it("concorda no singular e no plural", () => {
    expect(textoQtdRepetidas(1)).toBe("1 nota repetida");
    expect(textoQtdRepetidas(3)).toBe("3 notas repetidas");
  });
});

describe("PDF não lido e situação completa do mês", () => {
  const naoLido = item({ nome: "ND_Penalidade QDC - PETROLINA", status: "REVISAR", valor: 0, liquido: 0 });
  const dup = { tipo: "TOP", numero: "03901", qtd: 2, valor_total: 45816.02, liquido_total: 41578, arquivos: ["a.pdf", "b.pdf"] };

  it("reconhece PDF não lido: REVISAR com valor 0", () => {
    expect(itemNaoLido(naoLido)).toBe(true);
    expect(itemNaoLido(item({ status: "REVISAR", valor: 50 }))).toBe(false);
    expect(itemNaoLido(item({ status: "OK", valor: 0 }))).toBe(false);
    expect(qtdNaoLidos({ ...base, itens: [naoLido, item(), naoLido] })).toBe(2);
  });
  it("confere", () => {
    expect(situacaoDaProvaRP(base)).toBe("confere");
  });
  it("não confere por PDF não lido (valor digitado à mão que não ficou nos itens)", () => {
    expect(situacaoDaProvaRP({ ...base, confere: false, diferenca: 19160.79, itens: [naoLido] })).toBe("diverge_nao_lido");
  });
  it("não confere sem PDF não lido é só diverge", () => {
    expect(situacaoDaProvaRP({ ...base, confere: false, diferenca: 10, itens: [item()] })).toBe("diverge");
  });
  it("nota repetida tem prioridade sobre o resto", () => {
    expect(situacaoDaProvaRP({ ...base, confere: false, diferenca: 22908.01, itens: [naoLido], possiveis_duplicadas: [dup] })).toBe("repetida");
  });
  it("mês só com o total e mês não gravado", () => {
    expect(situacaoDaProvaRP({ ...base, tem_itens: false, rp_calculado: null, diferenca: null, confere: false })).toBe("so_total");
    expect(situacaoDaProvaRP({ ...base, rp_gravado: null })).toBe("nao_gravado");
  });
  it("a frase do PDF não lido concorda no singular e no plural", () => {
    expect(textoNaoLidos(1)).toContain("1 PDF não foi lido e ficou com valor 0");
    expect(textoNaoLidos(2)).toContain("2 PDFs não foram lidos e ficaram com valor 0");
    expect(textoNaoLidos(2)).toContain("por isso a diferença");
  });
});
