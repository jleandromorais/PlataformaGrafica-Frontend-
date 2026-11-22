import { describe, expect, it } from "vitest";
import { calcularProximoPasso, type ChavePasso, type EntradaPasso, type SituacaoPasso } from "./proximoPasso";
import {
  ID_APROVACAO, ID_ENTREGAS, ID_PASTA, ID_PR, ID_PROCESSAR, ID_PV, ID_SR, blocoDoProximoPasso, dataBR, idDoPasso, type EntradaBloco,
} from "./blocoProximoPasso";

const ORDEM: ChavePasso[] = ["pmpv", "auditoria", "cgf", "ret", "rp", "scg", "sr", "pr", "pv", "tarifa"];

/** Monta a entrada como o Painel faz: passos na ordem, o próximo e os bloqueios saem de calcularProximoPasso. */
function entrada(s: Partial<Record<ChavePasso, SituacaoPasso>>, extra: Partial<EntradaBloco> = {}, pmpvNovoPronto = true): EntradaBloco {
  const passos: EntradaPasso[] = ORDEM.map((chave) => ({
    chave, situacao: s[chave] ?? "ok", soLink: chave === "tarifa" || undefined,
    mesesQueFaltam: s[chave] === "falta" ? ["Ago/2026", "Set/2026"] : undefined,
  }));
  const r = calcularProximoPasso({ passos, pmpvNovoPronto, rotuloPmpvNovo: "Nov a Jan/2027" });
  return {
    erro: false, proximo: r.proximo, bloqueios: r.bloqueios, passos,
    temPasta: true, temArquivos: true, nomePasta: "SCG-26", aguardandoAprovacao: false, selic: null,
    rotulos: { apurado: "Jul a Set/2026", ciclo: "Nov/2026 a Jan/2027", pmpvPendente: "Fev a Abr" },
    linkDe: (d) => `/destino/${d}`,
    ...extra,
  };
}

describe("blocoDoProximoPasso, uma linha por situação da tabela da spec", () => {
  it("há cascata para aprovar: manda aprovar, antes de qualquer passo", () => {
    const b = blocoDoProximoPasso(entrada({ ret: "falta" }, { aguardandoAprovacao: true }));
    expect(b.caso).toBe("aprovar");
    expect(b.titulo).toBe("Aprove o SR, o PR e o PV");
    expect(b.texto).toContain("Nada é gravado sem a sua aprovação");
    expect(b.acao).toEqual({ tipo: "rolar", rotulo: "Revisar e aprovar", alvo: ID_APROVACAO });
  });

  it("passo 2 a 5 sem pasta: pede a pasta do ano e rola até a área de soltar", () => {
    const b = blocoDoProximoPasso(entrada({ ret: "falta", rp: "falta" }, { temPasta: false, temArquivos: false }));
    expect(b.caso).toBe("pasta");
    expect(b.titulo).toBe("Traga a pasta do ano");
    expect(b.texto).toContain("só os nomes dos arquivos");
    expect(b.texto).toContain("Jul a Set/2026");
    expect(b.acao).toEqual({ tipo: "rolar", rotulo: "Trazer a pasta SCG-26", alvo: ID_PASTA });
    expect(b.passo).toBe("Passo 4 de 9");
  });

  it("passo 2 a 5, pasta lembrada sem arquivos: pede a pasta de novo e explica o limite do navegador", () => {
    const b = blocoDoProximoPasso(entrada({ ret: "falta" }, { temPasta: true, temArquivos: false }));
    expect(b.caso).toBe("pasta-de-novo");
    expect(b.titulo).toBe("Traga a pasta de novo");
    expect(b.texto).toContain("Lembrei a pasta SCG-26");
    expect(b.texto).toContain("o navegador não guarda os arquivos depois de recarregar");
    expect(b.acao).toEqual({ tipo: "rolar", rotulo: "Trazer a pasta de novo", alvo: ID_PASTA });
  });

  it("passo 2 a 5 com arquivos: processa o passo, diz o que falta e que o analista confere antes de gravar", () => {
    const b = blocoDoProximoPasso(entrada({ ret: "falta" }));
    expect(b.caso).toBe("processar");
    expect(b.titulo).toBe("Processe RET");
    expect(b.texto).toBe("Falta Ago e Set. Você confere o resultado antes de gravar.");
    expect(b.acao).toEqual({ tipo: "abrir-processar", rotulo: "Processar Jul a Set/2026", alvo: ID_PROCESSAR });
  });

  it("passo 2 a 5 com ponto para conferir (nada faltando): não inventa meses", () => {
    const b = blocoDoProximoPasso(entrada({ cgf: "atencao" }));
    expect(b.caso).toBe("processar");
    expect(b.texto).toBe("Há ponto para conferir em Jul a Set/2026. Você confere o resultado antes de gravar.");
  });

  it("passo 1: PMPV do trimestre do ciclo que falta, com link para ele", () => {
    const b = blocoDoProximoPasso(entrada({ pmpv: "falta" }));
    expect(b.caso).toBe("pmpv");
    expect(b.titulo).toBe("Calcule o PMPV de Fev a Abr");
    expect(b.texto).toBe("O CGF usa o PMPV. Falta Ago e Set.");
    expect(b.acao).toEqual({ tipo: "link", rotulo: "Abrir o PMPV de Fev a Abr", alvo: "/destino/pmpv" });
    expect(b.passo).toBe("Passo 1 de 9");
  });

  it("passo 6 divergente: confira o SCG e abre a tela", () => {
    const b = blocoDoProximoPasso(entrada({ scg: "atencao" }));
    expect(b.caso).toBe("scg");
    expect(b.titulo).toBe("Confira o SCG de Jul a Set/2026");
    expect(b.texto).toBe("Os módulos e o valor gravado não batem.");
    expect(b.acao).toEqual({ tipo: "link", rotulo: "Abrir o SCG", alvo: "/destino/scg" });
  });

  it("passo 6 sem gravar: diz que falta gravar, não que não batem", () => {
    const b = blocoDoProximoPasso(entrada({ scg: "falta" }));
    expect(b.caso).toBe("scg");
    expect(b.titulo).toBe("Grave o SCG de Ago e Set");
    expect(b.texto).not.toContain("não batem");
  });

  it("passo 7: calcular o SR rola até o card", () => {
    const b = blocoDoProximoPasso(entrada({ sr: "falta" }));
    expect(b.caso).toBe("sr");
    expect(b.titulo).toBe("Calcule o SR de Jul a Set/2026");
    expect(b.texto).toBe("Usa o VP, o VF, o PR e a SELIC do Banco Central.");
    expect(b.acao).toEqual({ tipo: "rolar", rotulo: "Calcular o SR", alvo: ID_SR });
  });

  it("passos 8 e 9: o PR e o PV se gravam no cartão do Painel, e o botão rola até ele", () => {
    const pr = blocoDoProximoPasso(entrada({ pr: "falta" }));
    expect(pr.caso).toBe("pr-pv");
    expect(pr.titulo).toBe("Confira e grave o PR de Nov/2026 a Jan/2027");
    expect(pr.texto).toBe("Nada é gravado sem a sua confirmação.");
    expect(pr.acao).toEqual({ tipo: "rolar", rotulo: "Conferir e gravar o PR", alvo: ID_PR });
    const pv = blocoDoProximoPasso(entrada({ pv: "atencao" }));
    expect(pv.titulo).toBe("Confira e grave o PV de Nov/2026 a Jan/2027");
    expect(pv.acao).toEqual({ tipo: "rolar", rotulo: "Conferir e gravar o PV", alvo: ID_PV });
  });

  it("tudo o que resta está bloqueado: nada a fazer, com o motivo e o link do bloqueio", () => {
    const b = blocoDoProximoPasso(entrada({ pr: "falta", pv: "falta" }, {}, false));
    expect(b.caso).toBe("bloqueado");
    // O título não contradiz o botão: há uma ação (abrir o PMPV), então o título a nomeia.
    expect(b.titulo).toBe("Calcule o PMPV de Nov/2026 a Jan/2027");
    expect(b.titulo).not.toBe("Nada a fazer agora");
    expect(b.texto).toBe("Falta o PMPV do trimestre novo (Nov a Jan/2027).");
    expect(b.acao).toEqual({ tipo: "link", rotulo: "Abrir o PMPV do trimestre novo", alvo: "/destino/pmpv_novo" });
  });

  it("bloqueio que não é o PMPV novo, mas tem botão: 'Falta um passo anterior', nunca 'Nada a fazer'", () => {
    const base = entrada({ sr: "falta" }, { selic: { fechada: false, fecha_em: "2026-09-30" } });
    const b = blocoDoProximoPasso({ ...base, proximo: null, bloqueios: { sr: { motivo: "falta o SCG de Ago", destino: "scg" } } });
    expect(b.caso).toBe("bloqueado");
    expect(b.titulo).toBe("Falta um passo anterior");
    expect(b.acao?.alvo).toBe("/destino/scg");
  });

  it("SELIC aberta: diz quando fecha (dd/mm) e ainda mostra o primeiro bloqueio", () => {
    const b = blocoDoProximoPasso(entrada({ sr: "falta", pr: "falta", pv: "falta" }, { selic: { fechada: false, fecha_em: "2026-09-30" } }, false));
    expect(b.caso).toBe("bloqueado");
    expect(b.titulo).toBe("Calcule o PMPV de Nov/2026 a Jan/2027");
    expect(b.texto).toContain("A SELIC de Jul a Set/2026 fecha em 30/09.");
    expect(b.texto).toContain("falta o PMPV do trimestre novo");
    expect(b.acao?.tipo).toBe("link");
  });

  it("SELIC aberta sem mais nenhum bloqueio: nada a fazer, sem botão", () => {
    const b = blocoDoProximoPasso(entrada({ sr: "falta", pr: "falta", pv: "falta" }, { selic: { fechada: false, fecha_em: "2026-09-30" } }));
    expect(b.caso).toBe("bloqueado");
    expect(b.titulo).toBe("Nada a fazer agora"); // sem ação possível, o título é fiel
    expect(b.texto).toBe("A SELIC de Jul a Set/2026 fecha em 30/09.");
    expect(b.acao).toBeNull();
  });

  it("SELIC fechada (ou desconhecida) não atrapalha o SR", () => {
    expect(blocoDoProximoPasso(entrada({ sr: "falta" }, { selic: { fechada: true, fecha_em: "2026-09-30" } })).caso).toBe("sr");
    expect(blocoDoProximoPasso(entrada({ sr: "falta" }, { selic: null })).caso).toBe("sr");
  });

  it("tudo pronto: trimestre completo, vai para as entregas", () => {
    const b = blocoDoProximoPasso(entrada({}));
    expect(b.caso).toBe("pronto");
    expect(b.titulo).toBe("Trimestre completo");
    expect(b.texto).toBe("Falta só baixar as entregas.");
    expect(b.acao).toEqual({ tipo: "rolar", rotulo: "Ir para as entregas", alvo: ID_ENTREGAS });
    expect(b.passo).toBeNull();
  });

  it("o back apontar a tarifa média como próxima não esconde passo pendente nem inventa passo", () => {
    expect(blocoDoProximoPasso(entrada({}, { proximo: "tarifa" })).caso).toBe("pronto");
    expect(blocoDoProximoPasso(entrada({ pr: "falta", pv: "falta" }, { proximo: "tarifa" }, false)).caso).toBe("bloqueado");
  });

  it("erro ao carregar: não chuta passo, oferece tentar de novo", () => {
    const b = blocoDoProximoPasso(entrada({ ret: "falta" }, { erro: true }));
    expect(b.caso).toBe("erro");
    expect(b.titulo).toBe("Não consegui ver a situação do trimestre");
    expect(b.acao).toEqual({ tipo: "recarregar", rotulo: "Tentar de novo", alvo: "" });
    expect(b.depois).toEqual([]);
  });

  it("back antigo (sem situação, sem SELIC): o cálculo local manda e o bloco é o mesmo", () => {
    const a = blocoDoProximoPasso(entrada({ ret: "falta" }, { selic: null }));
    const b = blocoDoProximoPasso(entrada({ ret: "falta" }, { selic: undefined }));
    expect(a).toEqual(b);
    expect(a.caso).toBe("processar");
  });

  it("'Depois' lista até 3 passos pendentes seguintes, só os nomes, sem o próximo nem os prontos", () => {
    const b = blocoDoProximoPasso(entrada({ ret: "falta", rp: "falta", scg: "falta", sr: "falta", pr: "falta" }));
    expect(b.depois).toEqual(["RP", "SCG", "SR"]);
    expect(blocoDoProximoPasso(entrada({ pv: "falta" })).depois).toEqual([]);
  });

  it("'Ver motivo' leva ao passo na lista; nos casos sem passo, não existe", () => {
    expect(blocoDoProximoPasso(entrada({ ret: "falta" })).verMotivo).toBe("ret");
    expect(blocoDoProximoPasso(entrada({})).verMotivo).toBeNull();
    expect(blocoDoProximoPasso(entrada({ ret: "falta" }, { aguardandoAprovacao: true })).verMotivo).toBeNull();
  });
});

describe("pequenos auxiliares", () => {
  it("dataBR: AAAA-MM-DD vira dd/mm; o que não é data fica como veio", () => {
    expect(dataBR("2026-09-30")).toBe("30/09");
    expect(dataBR("30 de setembro")).toBe("30 de setembro");
    expect(dataBR(null)).toBe("");
  });

  it("idDoPasso: um id por passo da lista", () => {
    expect(idDoPasso("ret")).toBe("passo-ret");
  });
});
