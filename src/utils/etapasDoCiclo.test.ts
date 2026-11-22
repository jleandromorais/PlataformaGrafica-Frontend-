import { describe, expect, it } from "vitest";
import {
  ETAPAS_DO_CICLO, ETAPAS_NUMERADAS, FASES_DO_CICLO, TOTAL_DE_PASSOS, etapaDaChave, etapaDoModulo, numeroDaEtapa,
  numeroDoModulo, rotaDaEtapa, rotuloDaEtapa, type ChaveEtapa,
} from "./etapasDoCiclo";
import { linkDoPainel } from "./periodos";
import { GRUPOS_DO_MENU, MODULOS } from "../components/layout/modulos";
import type { ChavePasso } from "../pages/Ciclo/proximoPasso";

const CHAVES_DOS_PASSOS = ["pmpv", "auditoria", "cgf", "ret", "rp", "scg", "sr", "pr", "pv"];

describe("lista única de etapas", () => {
  it("tem 9 passos numerados, de 1 a 9, na ordem do ciclo", () => {
    expect(ETAPAS_NUMERADAS.map((e) => e.chave)).toEqual(CHAVES_DOS_PASSOS);
    expect(ETAPAS_NUMERADAS.map((e) => e.numero)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9]);
    expect(TOTAL_DE_PASSOS).toBe(9);
  });

  it("RPV, Tarifa média e Entregas ficam sem número", () => {
    for (const c of ["rpv", "tarifa", "entregas"] as const) expect(etapaDaChave(c).numero).toBeNull();
    expect(ETAPAS_DO_CICLO).toHaveLength(12);
  });

  it("chaves únicas, rotas começando com / e cada ChavePasso do Painel existe", () => {
    const chaves = ETAPAS_DO_CICLO.map((e) => e.chave);
    expect(new Set(chaves).size).toBe(chaves.length);
    for (const e of ETAPAS_DO_CICLO) expect(e.rota.startsWith("/")).toBe(true);
    const doPainel: Record<ChavePasso, true> = {
      pmpv: true, auditoria: true, cgf: true, ret: true, rp: true, scg: true, sr: true, pr: true, pv: true, tarifa: true,
    };
    for (const c of Object.keys(doPainel)) expect(chaves).toContain(c as ChaveEtapa);
  });

  it("agrupa os passos em 4 fases, sem repetir nem pular", () => {
    expect(FASES_DO_CICLO).toEqual(["Preparar", "Processar a pasta", "Trimestre", "Fechar"]);
    const porFase = FASES_DO_CICLO.map((f) => ETAPAS_DO_CICLO.filter((e) => e.fase === f).map((e) => e.chave));
    expect(porFase).toEqual([["pmpv"], ["auditoria", "cgf", "ret", "rp"], ["scg", "sr", "pr", "pv"], ["tarifa", "entregas"]]);
    expect(etapaDaChave("rpv").fase).toBeNull();
  });

  it("rótulo do cabeçalho: Passo N de 9, Calculado sozinho, Entrega", () => {
    expect(rotuloDaEtapa("ret")).toBe("Passo 4 de 9");
    expect(rotuloDaEtapa("pmpv")).toBe("Passo 1 de 9");
    expect(rotuloDaEtapa("rpv")).toBe("Calculado sozinho");
    expect(rotuloDaEtapa("entregas")).toBe("Entrega");
  });

  it("o RET é o 4 em toda parte: lista, módulo e rota", () => {
    expect(numeroDaEtapa("ret")).toBe(4);
    expect(numeroDoModulo("ret")).toBe(4);
    expect(etapaDoModulo("ret")?.chave).toBe("ret");
    expect(rotaDaEtapa("ret")).toBe("/ret");
    // o RP mora no módulo "conciliacao"
    expect(numeroDoModulo("conciliacao")).toBe(5);
    expect(etapaDoModulo("conciliacao")?.chave).toBe("rp");
  });

  it("telas fora da lista não têm etapa nem número", () => {
    for (const k of ["ciclo", "comofunciona", "dashboard"]) {
      expect(etapaDoModulo(k)).toBeUndefined();
      expect(numeroDoModulo(k)).toBeNull();
    }
  });

  it("só as quatro telas de leitura mandam gravar pelo Painel", () => {
    expect(ETAPAS_DO_CICLO.filter((e) => e.gravaNoPainel).map((e) => e.chave)).toEqual(["auditoria", "cgf", "ret", "rp"]);
  });
});

describe("consistência com o menu e os módulos", () => {
  it("o menu 'Passos do trimestre' é a lista numerada, na mesma ordem", () => {
    const passos = GRUPOS_DO_MENU.find((g) => g.titulo === "Passos do trimestre")!.itens;
    expect(passos).toEqual(ETAPAS_NUMERADAS.map((e) => e.modulo));
    ETAPAS_NUMERADAS.forEach((_, i) => expect(numeroDoModulo(passos[i])).toBe(i + 1));
  });

  it("a rota de cada módulo é a da etapa (uma fonte só)", () => {
    for (const e of ETAPAS_DO_CICLO) {
      if (e.modulo) expect(MODULOS[e.modulo].to).toBe(e.rota);
    }
  });

  it("RPV e Excel Final estão em 'Consulta e entrega', sem número de passo", () => {
    const consulta = GRUPOS_DO_MENU.find((g) => g.titulo === "Consulta e entrega")!.itens;
    expect(consulta).toEqual(["dashboard", "rpv", "excel"]);
    expect(numeroDoModulo("rpv")).toBeNull();
    expect(numeroDoModulo("excel")).toBeNull();
  });
});

describe("volta ao Painel pelo cabeçalho", () => {
  it("leva o trimestre do Painel quando a tela veio dele", () => {
    expect(linkDoPainel("Abr/2026")).toBe("/ciclo?trimestre=Abr%2F2026");
  });
  it("sem trimestre válido, abre o Painel puro", () => {
    expect(linkDoPainel(null)).toBe("/ciclo");
    expect(linkDoPainel("lixo")).toBe("/ciclo");
  });
});
