import { describe, expect, it } from "vitest";
import { parearMesmoValor, resumoDaComparacao, separarAvisos } from "./comparacaoResumo";
import type { AuditoriaComparacao, AuditoriaDivergencia } from "../../types";

// Valores fictícios.
const soNosArquivos = { empresa: "Empresa A", tipo: "NF-e", numero: "123", cgr_liquido: 1000 };
const soNaPlanilha = { empresa: "EMPRESA A", numero: "123-4", linha_excel: 20, cgr_planilha: 1000.4 };
const outraDaPlanilha = { empresa: "Empresa B", numero: "9", linha_excel: 30, cgr_planilha: 500 };

const so = (t: string) => t.replace(/\s/g, " "); // brl usa espaço fixo entre "R$" e o número

describe("parearMesmoValor", () => {
  it("junta a mesma nota dos dois lados (CGR igual até R$ 1) e tira das listas", () => {
    const r = parearMesmoValor([soNosArquivos], [outraDaPlanilha, soNaPlanilha]);
    expect(r.pares).toEqual([{ auditoria: soNosArquivos, planilha: soNaPlanilha }]);
    expect(r.restoAuditoria).toEqual([]);
    expect(r.restoPlanilha).toEqual([outraDaPlanilha]);
  });

  it("não junta quando a diferença passa de R$ 1", () => {
    const r = parearMesmoValor([soNosArquivos], [{ ...soNaPlanilha, cgr_planilha: 1002 }]);
    expect(r.pares).toEqual([]);
    expect(r.restoAuditoria).toHaveLength(1);
    expect(r.restoPlanilha).toHaveLength(1);
  });

  it("cada nota da planilha entra em um par só", () => {
    const r = parearMesmoValor([soNosArquivos, { ...soNosArquivos, numero: "124" }], [soNaPlanilha]);
    expect(r.pares).toHaveLength(1);
    expect(r.restoAuditoria).toHaveLength(1);
  });

  it("prefere o valor mais próximo", () => {
    const exata = { ...soNaPlanilha, numero: "exata", cgr_planilha: 1000 };
    const r = parearMesmoValor([soNosArquivos], [soNaPlanilha, exata]);
    expect(r.pares[0].planilha).toBe(exata);
  });

  it("não junta notas sem valor ou de R$ 0", () => {
    const r = parearMesmoValor([{ numero: "1", cgr_liquido: 0 }, { numero: "2" }], [{ numero: "3", cgr_planilha: 0 }]);
    expect(r.pares).toEqual([]);
  });
});

describe("separarAvisos", () => {
  it("separa o veredito do CGR dos avisos de leitura", () => {
    const r = separarAvisos(["Empresa A: nota lida por OCR. Confira o PDF.", "CGR DIVERGENTE: auditoria × planilha"]);
    expect(r.veredito).toBe("CGR DIVERGENTE: auditoria × planilha");
    expect(r.leitura).toEqual(["Empresa A: nota lida por OCR. Confira o PDF."]);
  });
});

const base: AuditoriaComparacao = {
  periodo: "Jul/2026", qtd_em_ambas: 10, notas_apenas_auditoria: [], notas_apenas_planilha: [],
  abas_planilha: [], abas_do_periodo: ["Jul"], avisos: [], modelo: "alexandre", modelo_rotulo: "Modelo",
  tipo: "por_nota", fontes_cgr: [{ rotulo: "notas", valor: 10000 }], notas_mes_na_planilha: true,
  cgr_auditoria: 10000, cgr_planilha_notas: 10000, cgr_planilha_conta_grafica: null, divergencias_valor: [], por_empresa: [],
};
const div = (diferenca_cgr: number): AuditoriaDivergencia => ({
  empresa: "Empresa A", tipo: "NF-e", numero: "1", linha_excel: 5, motivos: ["volume"], cgr_auditoria: 100,
  cgr_planilha: 100 - diferenca_cgr, diferenca_cgr, valor_auditoria: 0, valor_planilha: 0, volume_auditoria: -24,
  volume_planilha: -24000, aliquota_auditoria: "", aliquota_planilha: "",
});

describe("resumoDaComparacao", () => {
  it("tudo confere", () => {
    const r = resumoDaComparacao(base, parearMesmoValor([], []), null);
    expect(r.confere).toBe(true);
    expect(r.frase).toBe("Tudo confere: as 10 notas batem com a planilha.");
    expect(r.itens).toEqual([]);
  });

  it("diz quanto está abaixo e qual nota explica", () => {
    const c = { ...base, cgr_auditoria: 9500, notas_apenas_planilha: [outraDaPlanilha] };
    const r = resumoDaComparacao(c, parearMesmoValor([], c.notas_apenas_planilha), null);
    expect(r.confere).toBe(false);
    expect(so(r.frase)).toBe("O CGR das notas está R$ 500,00 abaixo da planilha.");
    expect(r.itens.map(so)).toEqual(["Empresa B: 1 nota está na planilha e não veio nos arquivos (R$ 500,00)."]);
  });

  it("avisa a parte da diferença que as notas não explicam", () => {
    const c = { ...base, cgr_auditoria: 9000, notas_apenas_planilha: [outraDaPlanilha] };
    const r = resumoDaComparacao(c, parearMesmoValor([], c.notas_apenas_planilha), null);
    expect(so(r.itens[1])).toContain("R$ 500,00 da diferença não aparece");
  });

  it("só o volume diferente não é divergência de CGR", () => {
    const c = { ...base, divergencias_valor: [div(0)] };
    const r = resumoDaComparacao(c, parearMesmoValor([], []), null);
    expect(r.confere).toBe(false);
    expect(r.frase).toBe("O CGR das notas confere com a planilha, mas há notas para conferir.");
    expect(r.itens).toEqual(["1 nota só com volume ou alíquota diferente; o CGR é igual e não muda o total."]);
  });

  it("conta a mesma nota dos dois lados", () => {
    const p = parearMesmoValor([soNosArquivos], [soNaPlanilha]);
    const r = resumoDaComparacao({ ...base, notas_apenas_auditoria: [soNosArquivos], notas_apenas_planilha: [soNaPlanilha] }, p, null);
    expect(r.itens[0]).toContain("1 nota parece estar nos dois lados");
  });
});
