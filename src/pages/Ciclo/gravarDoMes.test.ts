import { describe, expect, it } from "vitest";
import type { AuditoriaComparacao, AuditoriaHistoricoLinha } from "../../types";
import type { AuditoriaDoMes } from "./auditoriaDoMes";
import {
  dataDaGravacao, decisaoInicial, diferencaParaPlanilha, digitadasDoMes, divergenciaDoMes, estadoDaGravacao, mesJaGravado,
  MOTIVO_REINCLUSAO, rotuloDoBotao, textoDoEstado, tituloDaConfirmacao,
} from "./gravarDoMes";
import { faltantesDoMes } from "./notasFaltantes";

const linha = (p: Partial<AuditoriaHistoricoLinha> = {}): AuditoriaHistoricoLinha => ({
  periodo: "Out/2026", qtd_notas: 80, cgr_gravado: 1000, data_atualizacao: "2026-11-25 14:02", periodo_valido: true, ...p,
});
const comparacao = (soPlanilha: Record<string, unknown>[]) =>
  ({ notas_apenas_planilha: soPlanilha, notas_apenas_auditoria: [] } as unknown as AuditoriaComparacao);
const ESTORNO = { empresa: "TAG", numero: "550499", cgr_planilha: -481319.89, valor_planilha: -530380.04, linha_excel: 114 };

describe("mesJaGravado / estadoDaGravacao", () => {
  it("sem linha ou sem notas gravadas: nunca gravado", () => {
    expect(mesJaGravado(undefined)).toBe(false);
    expect(mesJaGravado(linha({ qtd_notas: 0 }))).toBe(false);
    expect(estadoDaGravacao({ cgrCalculado: 1000, qtdNotas: 80, linha: undefined })).toBe("nunca");
    expect(estadoDaGravacao({ cgrCalculado: 1000, qtdNotas: 80, linha: linha({ qtd_notas: 0 }) })).toBe("nunca");
  });
  it("nenhuma nota lida: vazio, mesmo com mês gravado", () => {
    expect(estadoDaGravacao({ cgrCalculado: 0, qtdNotas: 0, linha: linha() })).toBe("vazio");
  });
  it("gravado igual ao conferido: igual", () => {
    expect(estadoDaGravacao({ cgrCalculado: 1000, qtdNotas: 80, linha: linha() })).toBe("igual");
  });
  it("valor ou nº de notas diferente: substitui", () => {
    expect(estadoDaGravacao({ cgrCalculado: 1200, qtdNotas: 80, linha: linha() })).toBe("substitui");
    expect(estadoDaGravacao({ cgrCalculado: 1000, qtdNotas: 79, linha: linha() })).toBe("substitui");
  });
  it("nota digitada não conta na comparação com os arquivos", () => {
    const l = linha({ qtd_notas: 81, cgr_gravado: 1000 - 481319.89, qtd_digitadas: 1, cgr_digitadas: -481319.89 });
    expect(estadoDaGravacao({ cgrCalculado: 1000 + 0, qtdNotas: 80, linha: l })).toBe("igual");
  });
});

describe("divergenciaDoMes", () => {
  const res = (p: Partial<AuditoriaDoMes>) => ({ naoLidos: 0, ...p } as unknown as AuditoriaDoMes);
  it("sem diferenças, sem PDF não lido: não diverge", () => {
    expect(divergenciaDoMes(res({})).divergencia).toBe(false);
  });
  it("PDF não lido diverge", () => {
    expect(divergenciaDoMes(res({ naoLidos: 2 })).divergencia).toBe(true);
  });
  it("empresa gravada que não veio na pasta é apagada e diverge", () => {
    const d = { tem_notas_gravadas: true, resumo: [], notas: [], por_empresa: [{ empresa: "GALP", gravado: 500, processado: 0, diferenca: -500 }] };
    const r = divergenciaDoMes(res({ diferencas: d as never }));
    expect(r.apagadas.map((e) => e.empresa)).toEqual(["GALP"]);
    expect(r.divergencia).toBe(true);
  });
});

describe("notas digitadas ao regravar", () => {
  const f = faltantesDoMes(comparacao([ESTORNO]));
  it("sem digitadas: nada a avisar e nenhuma decisão inicial", () => {
    expect(digitadasDoMes(linha(), null, f)).toBeNull();
    expect(decisaoInicial(linha(), f)).toBeNull();
  });
  it("com digitadas e a planilha trazendo a nota: começa em incluir (reincluir por padrão)", () => {
    const l = linha({ qtd_digitadas: 1, cgr_digitadas: -481319.89 });
    expect(decisaoInicial(l, f)).toBe("incluir");
    expect(MOTIVO_REINCLUSAO.length).toBeGreaterThanOrEqual(5);
    expect(digitadasDoMes(l, "incluir", f)).toEqual({ qtd: 1, cgr: -481319.89, reincluidas: true });
  });
  it("com digitadas e sem decisão de incluir: elas somem", () => {
    const l = linha({ qtd_digitadas: 1, cgr_digitadas: -481319.89 });
    expect(digitadasDoMes(l, "seguir_sem", f)?.reincluidas).toBe(false);
    expect(digitadasDoMes(l, null, faltantesDoMes(null))?.reincluidas).toBe(false);
    expect(decisaoInicial(l, faltantesDoMes(null))).toBeNull(); // sem planilha não dá para reincluir
  });
});

describe("diferencaParaPlanilha", () => {
  it("notas menos a 1ª fonte com valor; sem planilha, null", () => {
    const c = { cgr_auditoria: 100, fontes_cgr: [{ rotulo: "a", valor: null }, { rotulo: "b", valor: 130 }] } as unknown as AuditoriaComparacao;
    expect(diferencaParaPlanilha(c)).toBe(-30);
    expect(diferencaParaPlanilha(null)).toBeNull();
    expect(diferencaParaPlanilha({ cgr_auditoria: 1, fontes_cgr: [] } as unknown as AuditoriaComparacao)).toBeNull();
  });
});

describe("textos", () => {
  it("data da gravação", () => {
    expect(dataDaGravacao("2026-11-25 14:02")).toBe("25/11 14:02");
    expect(dataDaGravacao("")).toBe("");
  });
  it("frase do estado", () => {
    expect(textoDoEstado("nunca", "Out/2026", undefined, 0)).toBe("Out/2026 ainda não foi gravado.");
    expect(textoDoEstado("igual", "Out/2026", linha(), 1000)).toContain("já foi gravado em 25/11 14:02");
    expect(textoDoEstado("igual", "Out/2026", linha(), 1000, true)).not.toContain("nada a mudar");
    expect(textoDoEstado("substitui", "Out/2026", linha(), 1200)).toContain("Gravar troca por");
    expect(textoDoEstado("vazio", "Out/2026", undefined, 0)).toContain("não há o que gravar");
  });
  it("botão e confirmação", () => {
    expect(rotuloDoBotao("nunca", "Out/2026", undefined, false)).toBe("Gravar o mês de Out/2026");
    expect(rotuloDoBotao("igual", "Out/2026", linha(), false)).toBe("Regravar Out/2026");
    expect(rotuloDoBotao("substitui", "Out/2026", linha(), false)).toMatch(/^Gravar Out\/2026 \(substitui R\$/);
    expect(rotuloDoBotao("nunca", "Out/2026", undefined, true)).toBe("Gravando Out/2026…");
    expect(tituloDaConfirmacao("nunca", "Out/2026", false)).toBe("Gravar o CGR de Out/2026?");
    expect(tituloDaConfirmacao("substitui", "Out/2026", false)).toBe("Substituir o CGR de Out/2026?");
    expect(tituloDaConfirmacao("nunca", "Out/2026", true)).toBe("Gravar o CGR de Out/2026 com divergências?");
  });
});
