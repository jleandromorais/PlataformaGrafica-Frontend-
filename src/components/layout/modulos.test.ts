import { describe, expect, it } from "vitest";
import { GRUPOS_DO_MENU, MODULOS, type ChaveModulo } from "./modulos";
import { ROTA_INICIAL, ROTA_VISAO_GERAL } from "../../router/rotas";

const noMenu = GRUPOS_DO_MENU.flatMap((g) => g.itens);

describe("menu e rotas", () => {
  it("o Painel do Ciclo é a página inicial e o primeiro item do menu", () => {
    expect(MODULOS.ciclo.to).toBe(ROTA_INICIAL);
    expect(GRUPOS_DO_MENU[0].itens[0]).toBe("ciclo");
  });

  it("o Dashboard vira Visão geral, em /visao-geral, e ninguém mais usa a raiz", () => {
    expect(MODULOS.dashboard.to).toBe(ROTA_VISAO_GERAL);
    expect(MODULOS.dashboard.nome).toBe("Visão geral");
    expect(Object.values(MODULOS).some((m) => m.to === "/")).toBe(false);
  });

  it("todo módulo aparece uma vez só no menu, e o menu não tem item solto", () => {
    expect([...noMenu].sort()).toEqual((Object.keys(MODULOS) as ChaveModulo[]).sort());
    expect(new Set(noMenu).size).toBe(noMenu.length);
  });

  it("segue a ordem de uso: início, passos do trimestre, consulta e entrega", () => {
    expect(GRUPOS_DO_MENU.map((g) => g.titulo)).toEqual(["Início", "Passos do trimestre", "Consulta e entrega"]);
    expect(GRUPOS_DO_MENU[0].itens).toEqual(["ciclo", "comofunciona"]);
    expect(GRUPOS_DO_MENU[1].itens).toEqual(["pmpv", "auditoria", "cgf", "ret", "conciliacao", "scg", "sr", "pr", "pv"]);
    expect(GRUPOS_DO_MENU[2].itens).toEqual(["dashboard", "rpv", "excel"]);
  });
});

describe("textos das telas de consulta", () => {
  const consulta: ChaveModulo[] = ["auditoria", "cgf", "rpv", "ret", "conciliacao", "dashboard", "sr", "pr", "pv"];

  it.each(consulta)("%s não diz que lê arquivo nem que salva", (k) => {
    const texto = MODULOS[k].proposito ?? "";
    expect(texto).not.toBe("");
    expect(texto).not.toMatch(/\b(leia|salve)\b/i);
  });

  it.each(["auditoria", "cgf", "ret", "conciliacao", "sr", "pr", "pv"] as ChaveModulo[])("%s manda gravar pelo Painel do Ciclo", (k) => {
    expect(MODULOS[k].proposito).toMatch(/Painel do Ciclo/);
  });

  it("o RPV diz que se calcula sozinho", () => {
    expect(MODULOS.rpv.proposito).toMatch(/sozinho/);
  });
});
