import { describe, expect, it } from "vitest";
import type { Cascata, CascataTrimestre } from "../types";
import { cascataTemParaAprovar, linkDeAprovacao, outrosTrimestres, trimestreDoPainelDaCascata } from "./aprovacao";

const item = (periodo: string, extra: Partial<CascataTrimestre> = {}): CascataTrimestre => ({
  periodo, trimestre_sr: null, sr_antes: null, sr_novo: null, meses_pr: [], chave_pr: "", pr_antes: null, pr_novo: null,
  chave_pv: "", pv_antes: null, pv_novo: null, desatualizado: true, pendencias: [], ...extra,
});
const cascata = (aPartirDe: Cascata["a_partir_de"], trimestres: CascataTrimestre[], extra: Partial<Cascata> = {}): Cascata => ({
  periodos: trimestres.map((t) => t.periodo), a_partir_de: aPartirDe, desatualizado: trimestres.some((t) => t.desatualizado),
  trimestres, pendencias: [], ...extra,
});

describe("trimestreDoPainelDaCascata: em que trimestre do Painel se aprova", () => {
  it("a partir do SR ou do PR, o mês-guia está no trimestre civil apurado", () => {
    expect(trimestreDoPainelDaCascata(cascata("sr", [item("Ago/2026")]))).toBe("Jul/2026");
    expect(trimestreDoPainelDaCascata(cascata("pr", [item("Mar/2026")]))).toBe("Jan/2026");
    expect(trimestreDoPainelDaCascata(cascata("sr", [item("Dez/2026")]))).toBe("Out/2026");
  });
  it("a partir do PV, o mês-guia está no trimestre do ciclo: o Painel é o civil que o define (4 meses antes)", () => {
    expect(trimestreDoPainelDaCascata(cascata("pv", [item("Dez/2026")]))).toBe("Jul/2026");   // Nov a Jan
    expect(trimestreDoPainelDaCascata(cascata("pv", [item("Abr/2026")]))).toBe("Out/2025");   // Fev a Abr
    expect(trimestreDoPainelDaCascata(cascata("pv", [item("Jul/2026")]))).toBe("Jan/2026");   // Mai a Jul
    expect(trimestreDoPainelDaCascata(cascata("pv", [item("Set/2026")]))).toBe("Abr/2026");   // Ago a Out
  });
  it("sem trimestre ou mês inválido: null", () => {
    expect(trimestreDoPainelDaCascata(cascata("sr", []))).toBeNull();
    expect(trimestreDoPainelDaCascata(cascata("sr", [item("xx")]))).toBeNull();
  });
});

describe("linkDeAprovacao", () => {
  it("abre o Painel no trimestre e pede o bloco de aprovação", () => {
    expect(linkDeAprovacao(cascata("sr", [item("Ago/2026")]))).toBe("/ciclo?trimestre=Jul%2F2026&aprovar=1");
  });
  it("sem trimestre conhecido, só pede a aprovação", () => {
    expect(linkDeAprovacao(cascata("sr", []))).toBe("/ciclo?aprovar=1");
  });
});

describe("cascataTemParaAprovar", () => {
  it("só conta quando algo difere do gravado", () => {
    expect(cascataTemParaAprovar(cascata("sr", [item("Jul/2026")]))).toBe(true);
    expect(cascataTemParaAprovar(cascata("sr", [item("Jul/2026", { desatualizado: false })]))).toBe(false);
    expect(cascataTemParaAprovar(null)).toBe(false);
  });
});

describe("outrosTrimestres: pendências de trimestres que não são o aberto", () => {
  it("tira os trimestres que já estão no bloco do trimestre aberto", () => {
    const aberto = cascata("sr", [item("Jul/2026")]);
    const geral = cascata("sr", [item("Jan/2026"), item("Jul/2026")]);
    const outros = outrosTrimestres(geral, aberto);
    expect(outros?.trimestres.map((t) => t.periodo)).toEqual(["Jan/2026"]);
    expect(outros?.periodos).toEqual(["Jan/2026"]);
  });
  it("o mês-guia pode ser outro mês do mesmo trimestre (Ago em vez de Jul): continua sendo o mesmo", () => {
    const aberto = cascata("sr", [item("Jul/2026")]);
    expect(outrosTrimestres(cascata("sr", [item("Ago/2026")]), aberto)).toBeNull();
  });
  it("nada de outro trimestre: null", () => {
    const aberto = cascata("sr", [item("Jul/2026")]);
    expect(outrosTrimestres(cascata("sr", [item("Jul/2026")]), aberto)).toBeNull();
    expect(outrosTrimestres(null, aberto)).toBeNull();
  });
  it("o trimestre aberto sem prévia: todos são 'outros'", () => {
    const outros = outrosTrimestres(cascata("sr", [item("Jan/2026")]), null);
    expect(outros?.trimestres).toHaveLength(1);
  });
});
