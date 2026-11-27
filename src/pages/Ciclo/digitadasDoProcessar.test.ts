import { describe, expect, it } from "vitest";
import type { AuditoriaDiferencas, AuditoriaHistoricoLinha } from "../../types";
import {
  avisosDasQueChegaram, digitadasAoGravar, digitadasDaLinha, gravadoDaPasta, temDiferenca, textoDasMantidas,
} from "./digitadasDoProcessar";

const linha = (qtd: number, cgr: number) =>
  ({ periodo: "Out/2026", qtd_notas: 100, qtd_digitadas: qtd, cgr_digitadas: cgr, cgr_gravado: 85510773.54 }) as AuditoriaHistoricoLinha;

const dif = (extra: Partial<AuditoriaDiferencas> = {}): AuditoriaDiferencas => ({
  tem_notas_gravadas: true, cgr_gravado_notas: 0, cgr_processado: 0, diferenca: 0, por_empresa: [], notas: [],
  qtd_notas_diferentes: 0, resumo: [], ...extra,
});

describe("digitadas no Processar a pasta", () => {
  it("mês sem digitada: nada muda", () => {
    expect(digitadasDaLinha(linha(0, 0))).toBeNull();
    expect(digitadasDaLinha(undefined)).toBeNull();
    expect(gravadoDaPasta(1000, null)).toBe(1000);
    expect(digitadasAoGravar(null, dif())).toEqual({ qtd: 0, cgr: 0, chegaram: [] });
    expect(textoDasMantidas({ qtd: 0, cgr: 0 })).toBe("");
  });

  it("o gravado comparável desconta todas as digitadas (sinais mistos)", () => {
    const d = digitadasDaLinha(linha(3, -481319.89 + 25000.1 - 1500.55));
    expect(d?.qtd).toBe(3);
    expect(gravadoDaPasta(85510773.54, d)).toBeCloseTo(85510773.54 + 481319.89 - 25000.1 + 1500.55, 2);
    expect(gravadoDaPasta(null, d)).toBeNull();
  });

  it("sem /diferencas novo, vale o histórico", () => {
    expect(digitadasAoGravar({ qtd: 2, cgr: -10 }, undefined)).toEqual({ qtd: 2, cgr: -10, chegaram: [] });
    expect(digitadasAoGravar({ qtd: 2, cgr: -10 }, dif())).toEqual({ qtd: 2, cgr: -10, chegaram: [] });
  });

  it("a digitada que veio na pasta sai da conta e vira aviso", () => {
    const d = dif({
      qtd_digitadas: 1, cgr_digitadas: -481319.89,
      digitadas: [
        { empresa: "TAG", tipo: "CT-e", numero: "Estorno ND 550499", cgr_liquido: -481319.89, motivo: "", chegou_na_pasta: false },
        { empresa: "PETROBRAS", tipo: "NF-e", numero: "123", cgr_liquido: 900, motivo: "", chegou_na_pasta: true },
      ],
    });
    const m = digitadasAoGravar({ qtd: 2, cgr: -481319.89 + 900 }, d);
    expect(m).toEqual({ qtd: 1, cgr: -481319.89, chegaram: ["NF-e 123 de PETROBRAS"] });
    const [aviso] = avisosDasQueChegaram(m.chegaram);
    expect(aviso).toContain("NF-e 123 de PETROBRAS");
    expect(aviso).toContain("não conta duas vezes");
  });

  it("resposta sem nota nem empresa diferente não é divergência", () => {
    expect(temDiferenca(undefined)).toBe(false);
    expect(temDiferenca(dif({ resumo: ["1 nota incluída à mão ..."] }))).toBe(false);
    expect(temDiferenca(dif({ por_empresa: [{ empresa: "TAG", gravado: 1, processado: 2, diferenca: 1 }] }))).toBe(true);
  });

  it("texto no singular e no plural", () => {
    expect(textoDasMantidas({ qtd: 1, cgr: -481319.89 })).toMatch(/^inclui 1 nota incluída à mão \(.*\), mantida ao gravar$/);
    expect(textoDasMantidas({ qtd: 3, cgr: 10 })).toMatch(/^inclui 3 notas incluídas à mão \(.*\), mantidas ao gravar$/);
  });
});
