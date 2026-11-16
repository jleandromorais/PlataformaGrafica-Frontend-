import { describe, expect, it } from "vitest";
import { listaDeMeses, resultadoDaConferencia } from "./conferenciaPlanilha";
import type { ConferirPlanilhaResponse } from "../../types";

const MESES = ["Jul/2026", "Ago/2026", "Set/2026"];
const mes = (periodo: string, tem: boolean) => ({ periodo, tem, abas: tem ? ["ABA"] : [], qtd_notas: tem ? 10 : null });
const resp = (tem: boolean[], extra: Partial<ConferirPlanilhaResponse> = {}): ConferirPlanilhaResponse => ({
  ok: true, modelo: "por_nota", modelo_rotulo: "Modelo Alexandre", aviso: null,
  meses: MESES.map((m, i) => mes(m, tem[i])), ...extra,
});

describe("listaDeMeses", () => {
  it("junta com vírgula e 'e', ano no fim", () => {
    expect(listaDeMeses(MESES)).toBe("Jul, Ago e Set/2026");
    expect(listaDeMeses(["Set/2026"])).toBe("Set/2026");
    expect(listaDeMeses(["Jul/2026", "Ago/2026"])).toBe("Jul e Ago/2026");
  });
  it("trimestre que vira o ano mantém o ano de cada mês", () => {
    expect(listaDeMeses(["Nov/2025", "Dez/2025", "Jan/2026"])).toBe("Nov/2025, Dez/2025 e Jan/2026");
  });
});

describe("resultadoDaConferencia", () => {
  it("tem os 3 meses: verde, com o modelo", () => {
    const r = resultadoDaConferencia(resp([true, true, true]), MESES);
    expect(r.desfecho).toBe("pronta");
    expect(r.titulo).toBe("Planilha pronta para comparar");
    expect(r.descricao).toBe("Achei Jul, Ago e Set/2026 (modelo por nota).");
  });

  it("falta um mês: amarelo, diz o que dá para comparar", () => {
    const r = resultadoDaConferencia(resp([true, true, false]), MESES);
    expect(r.desfecho).toBe("parcial");
    expect(r.titulo).toBe("Planilha lida, mas falta Set/2026");
    expect(r.descricao).toBe("Dá para comparar Jul e Ago.");
    expect(r.meses.map((m) => m.tem)).toEqual([true, true, false]);
  });

  it("nenhum mês: amarelo, não dá para comparar", () => {
    const r = resultadoDaConferencia(resp([false, false, false]), MESES);
    expect(r.desfecho).toBe("parcial");
    expect(r.titulo).toBe("Planilha lida, mas faltam Jul, Ago e Set/2026");
  });

  it("mês que o servidor nem citou conta como sem aba", () => {
    const r = resultadoDaConferencia(resp([true, true, true], { meses: [mes("Jul/2026", true)] }), MESES);
    expect(r.meses.map((m) => m.tem)).toEqual([true, false, false]);
  });

  it("não abriu: vermelho com o motivo do servidor", () => {
    const r = resultadoDaConferencia({ ok: false, modelo: null, modelo_rotulo: null, meses: [], aviso: "Arquivo corrompido." }, MESES);
    expect(r.desfecho).toBe("erro");
    expect(r.titulo).toBe("Não consegui abrir esta planilha");
    expect(r.descricao).toBe("Arquivo corrompido.");
  });
});
