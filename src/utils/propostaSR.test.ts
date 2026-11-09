import { describe, expect, it } from "vitest";
import { camposDiferentes, faixaDoTrimestre, mesesDivergentes, motivosDoMes, rotuloDoPR, tituloDaDivergencia } from "./propostaSR";
import type { SRProposta, SRPropostaLinha } from "../types";

const linha = (extra: Partial<SRPropostaLinha> = {}): SRPropostaLinha => ({
  mes: "Jan/2026", vp: 1000, vf: 900, pr: 0.1234, pr_origem: "salvo", pr_chave: "Ago - Out/2025",
  selic_mensal: 1.1, sr_anterior: 50, diferenca: 100, sr_parcela: 12, sr_selic: 13, total: 63,
  gravado: null, alertas: [], ...extra,
});
const gravadoIgual = { vp: 1000, vf: 900, pr: 0.1234, selic_mensal: 1.1, sr_selic: 13, sr_anterior: 50 };
const proposta = (linhas: SRPropostaLinha[]): SRProposta => ({
  labels_meses: ["Jan/2026", "Fev/2026", "Mar/2026"], linhas, total: 0, total_gravado: null, diferenca_total: null,
  selic: { disponivel: true, fecha_em: "2026-03-31", fonte: "BCB", mensagem: "" }, bloqueios: [], pode_gravar: true,
});

describe("camposDiferentes", () => {
  it("sem nada gravado, não há diferença a mostrar", () => {
    expect(camposDiferentes(linha())).toEqual([]);
  });
  it("igual ao gravado (dentro da tolerância) não diverge", () => {
    expect(camposDiferentes(linha({ gravado: { ...gravadoIgual, vp: 1000.2, sr_selic: 13.001 } }))).toEqual([]);
  });
  it("aponta só as colunas que diferem", () => {
    expect(camposDiferentes(linha({ gravado: { ...gravadoIgual, vf: 800, selic_mensal: 0 } }))).toEqual(["vf", "selic_mensal"]);
  });
});

describe("motivosDoMes e mesesDivergentes", () => {
  it("qualquer alerta é divergência", () => {
    const l = linha({ alertas: [{ codigo: "pr_estimado", mensagem: "PR estimado" }] });
    expect(motivosDoMes(l)).toEqual(["PR estimado"]);
  });
  it("diferença do gravado vira motivo quando o back não avisou", () => {
    const l = linha({ gravado: { ...gravadoIgual, vp: 5 } });
    expect(motivosDoMes(l)).toEqual(["difere do gravado em VP"]);
  });
  it("não repete o motivo quando o back já mandou difere_gravado", () => {
    const l = linha({ gravado: { ...gravadoIgual, vp: 5 }, alertas: [{ codigo: "difere_gravado", mensagem: "VP difere" }] });
    expect(motivosDoMes(l)).toEqual(["VP difere"]);
  });
  it("lista só os meses com divergência", () => {
    const p = proposta([linha({ mes: "Jan/2026" }), linha({ mes: "Fev/2026", alertas: [{ codigo: "sem_vp", mensagem: "sem VP" }] })]);
    expect(mesesDivergentes(p)).toEqual(["Fev/2026"]);
  });
});

describe("textos", () => {
  it("rotula o PR de origem", () => {
    expect(rotuloDoPR("Ago - Out/2025")).toBe("PR Ago–Out/2025");
    expect(rotuloDoPR("")).toBe("");
  });
  it("diz a faixa do trimestre", () => {
    expect(faixaDoTrimestre(["Jan/2026", "Fev/2026", "Mar/2026"])).toBe("Jan a Mar");
  });
  it("concorda no singular e no plural", () => {
    expect(tituloDaDivergencia(1)).toBe("Há divergência em 1 mês.");
    expect(tituloDaDivergencia(2)).toBe("Há divergência em 2 meses.");
  });
});
