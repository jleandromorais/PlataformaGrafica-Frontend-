import { describe, expect, it } from "vitest";
import {
  AFETADOS_DA_TELA, listaDeAfetados, precisaJanela, rotuloDaAcao, textoDepoisDeGravar, tituloDaJanela,
} from "./confirmarGravacao";

describe("precisaJanela: quando a gravação pede confirmação", () => {
  it("substitui um valor já gravado: pede", () => {
    expect(precisaJanela({ substitui: true, diverge: false })).toBe(true);
  });
  it("há divergência a avisar: pede, mesmo sem nada a substituir", () => {
    expect(precisaJanela({ substitui: false, diverge: true })).toBe(true);
  });
  it("as duas coisas: pede", () => {
    expect(precisaJanela({ substitui: true, diverge: true })).toBe(true);
  });
  it("nada a substituir e nada a avisar: não abre janela vazia", () => {
    expect(precisaJanela({ substitui: false, diverge: false })).toBe(false);
  });
});

describe("textoDepoisDeGravar: só quando a gravação afeta o que vem à frente", () => {
  it("SCG afeta SR, PR e PV", () => {
    expect(textoDepoisDeGravar(AFETADOS_DA_TELA.scg)).toBe(
      "Depois de gravar, você vai aprovar o SR, o PR e o PV no Painel. Nada à frente é gravado sem isso.");
  });
  it("SR afeta PR e PV", () => {
    expect(textoDepoisDeGravar(AFETADOS_DA_TELA.sr)).toBe(
      "Depois de gravar, você vai aprovar o PR e o PV no Painel. Nada à frente é gravado sem isso.");
  });
  it("PR e PMPV afetam só o PV", () => {
    expect(textoDepoisDeGravar(AFETADOS_DA_TELA.pr)).toContain("aprovar o PV no Painel");
    expect(textoDepoisDeGravar(AFETADOS_DA_TELA.pmpv)).toContain("aprovar o PV no Painel");
  });
  it("PV não afeta nada à frente: sem texto", () => {
    expect(AFETADOS_DA_TELA.pv).toEqual([]);
    expect(textoDepoisDeGravar(AFETADOS_DA_TELA.pv)).toBeNull();
  });
});

describe("listaDeAfetados", () => {
  it("um, dois e três itens", () => {
    expect(listaDeAfetados(["PV"])).toBe("o PV");
    expect(listaDeAfetados(["PR", "PV"])).toBe("o PR e o PV");
    expect(listaDeAfetados(["SR", "PR", "PV"])).toBe("o SR, o PR e o PV");
    expect(listaDeAfetados([])).toBe("");
  });
});

describe("textos da janela", () => {
  it("título: 'Gravar {o quê}?' ou, com divergência, 'Gravar com divergências?'", () => {
    expect(tituloDaJanela("o SCG de Mar/2026", false)).toBe("Gravar o SCG de Mar/2026?");
    expect(tituloDaJanela("o SCG de Mar/2026", true)).toBe("Gravar com divergências?");
  });
  it("botão: o rótulo da ação, ou 'Gravar com divergências'", () => {
    expect(rotuloDaAcao("Gravar o SCG", false)).toBe("Gravar o SCG");
    expect(rotuloDaAcao("Gravar o SCG", true)).toBe("Gravar com divergências");
  });
});
