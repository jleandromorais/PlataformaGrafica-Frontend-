import { describe, expect, it } from "vitest";
import { GLOSSARIO, dicaDe, type Sigla } from "./glossario";
import { partirPorSiglas, reivindicarSigla, siglaNoPrimeiroUso } from "./siglas";

const ESPERADAS: Sigla[] = ["PMPV", "CGR", "CGF", "RPV", "RET", "RP", "SCG", "SR", "PR", "PV", "VP", "VF", "SELIC", "MB", "TOP", "PFP", "EAT", "EC"];

describe("glossário: fonte única das siglas", () => {
  it("tem todas as siglas do app, cada uma com nome e uma dica", () => {
    for (const s of ESPERADAS) {
      expect(GLOSSARIO[s].nome, s).toBeTruthy();
      expect(dicaDe(s), s).toContain(GLOSSARIO[s].nome);
    }
  });
  it("a dica de um termo sem fórmula usa a definição", () => {
    expect(dicaDe("MB")).toBe("MB — Margem de distribuição. A parte da tarifa que é ganho da Copergás. É anual e definida pelo regulador.");
    expect(dicaDe("CGF")).toContain("CGF = PMPV × VF");
  });
});

describe("partirPorSiglas", () => {
  it("separa o texto em pedaços, preservando tudo", () => {
    const p = partirPorSiglas("Falta o SCG de Jul e o RET.");
    expect(p).toEqual(["Falta o ", { sigla: "SCG", expandir: true }, " de Jul e o ", { sigla: "RET", expandir: true }, "."]);
  });
  it("não pega sigla dentro de outra palavra, e prefere a mais longa", () => {
    expect(partirPorSiglas("RPV e PMPV, não TOPNREC nem PVC")).toEqual([
      { sigla: "RPV", expandir: true }, " e ", { sigla: "PMPV", expandir: true }, ", não TOPNREC nem PVC",
    ]);
  });
  it("texto sem sigla volta inteiro", () => {
    expect(partirPorSiglas("Nada aqui.")).toEqual(["Nada aqui."]);
  });
  it("em fórmula (= + − × ÷) a sigla vale, mas não expande o nome por extenso", () => {
    const p = partirPorSiglas("PV = PMPV + PR");
    expect(p.filter((x) => typeof x !== "string").every((x) => typeof x !== "string" && !x.expandir)).toBe(true);
    expect(p.filter((x) => typeof x !== "string")).toHaveLength(3);
  });
  it("sigla que já vem com o nome ('PV — Preço de Venda', 'SR (Saldo...)') não expande de novo", () => {
    expect(partirPorSiglas("PV — Preço de Venda")[0]).toEqual({ sigla: "PV", expandir: false });
    expect(partirPorSiglas("SR (Saldo Remanescente)")[0]).toEqual({ sigla: "SR", expandir: false });
  });
});

describe("primeiro uso por tela", () => {
  it("a primeira ocorrência traz o nome por extenso; as outras, só a sigla; a dica é sempre a mesma", () => {
    const vistas = new Map<Sigla, string>();
    expect(reivindicarSigla(vistas, "RET", "a")).toBe(true);
    expect(reivindicarSigla(vistas, "RET", "b")).toBe(false);
    expect(reivindicarSigla(vistas, "RET", "a")).toBe(true); // a mesma instância, ao renderizar de novo, continua a primeira
    expect(reivindicarSigla(vistas, "SR", "b")).toBe(true);

    const primeira = siglaNoPrimeiroUso("RET", true);
    expect(primeira.extenso).toBe("Recuperação de Encargos de Transporte");
    expect(siglaNoPrimeiroUso("RET", false).extenso).toBeNull();
    expect(primeira.dica).toBe(dicaDe("RET"));
  });
});
