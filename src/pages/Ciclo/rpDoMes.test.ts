import { describe, expect, it } from "vitest";
import type { ConciliaHistoricoLinha } from "../../types";
import { brl } from "../../utils/format";
import { alertaDoRP, valorDoRP } from "./rpDoMes";

const linha = (p: Partial<ConciliaHistoricoLinha>): ConciliaHistoricoLinha => ({
  periodo: "Out/2026", qtd_itens: 2, total_receitas: 68620.61, total_despesas: 425.32,
  rp_dos_itens: -61887.23, rp_gravado: -61887.23, data_atualizacao: "2026-11-25 14:02", periodo_valido: true, ...p,
});

describe("RP do mês no Painel", () => {
  it("RP gravado batendo com os itens: valor normal, sem ⚠", () => {
    expect(valorDoRP(linha({}))).toBe(brl(-61887.23));
    expect(alertaDoRP(linha({}))).toBeNull();
  });

  it("Out/2026 gravado 0 com penalidades: o valor aparece e vem escrito que é suspeito", () => {
    const l = linha({ rp_gravado: 0 });
    expect(valorDoRP(l)).toBe(`${brl(0)}, gravado zerado`);
    expect(valorDoRP(l)).toContain("0,00");
    expect(alertaDoRP(l)).toBe("RP gravado zerado com 2 itens de penalidade a conciliar: confira o RP.");
  });

  it("gravado 0 com itens que somam 0 (valor não lido): continua suspeito", () => {
    const l = linha({ qtd_itens: 1, total_receitas: 0, total_despesas: 0, rp_dos_itens: 0, rp_gravado: 0 });
    expect(alertaDoRP(l)).toBe("RP gravado zerado com 1 item de penalidade a conciliar: confira o RP.");
  });

  it("gravado diferente da soma dos itens (sem ser zero): o aviso antigo", () => {
    expect(alertaDoRP(linha({ rp_gravado: -61000 }))).toBe("O RP gravado difere da soma dos itens.");
    expect(alertaDoRP(linha({ rp_gravado: -61887.73 }))).toBeNull(); // dentro de R$ 1
  });
});
