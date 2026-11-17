import { describe, expect, it } from "vitest";
import { calcularProximoPasso, proximoDoBack, type ChavePasso, type EntradaCiclo, type SituacaoPasso } from "./proximoPasso";

const ORDEM: ChavePasso[] = ["pmpv", "auditoria", "cgf", "ret", "rp", "scg", "sr", "pr", "pv", "tarifa"];

function entrada(s: Partial<Record<ChavePasso, SituacaoPasso>>, extra: Partial<EntradaCiclo> = {}): EntradaCiclo {
  return {
    passos: ORDEM.map((chave) => ({
      chave, situacao: s[chave] ?? "ok",
      soLink: chave === "tarifa" || undefined,
      mesesQueFaltam: s[chave] === "falta" ? ["Jul/2026", "Ago/2026"] : undefined,
    })),
    pmpvNovoPronto: true,
    rotuloPmpvNovo: "Ago a Out/2026",
    ...extra,
  };
}

describe("calcularProximoPasso", () => {
  it("tudo pronto: nenhum próximo", () => {
    expect(calcularProximoPasso(entrada({})).proximo).toBeNull();
  });

  it("o próximo é o primeiro passo que não está pronto", () => {
    expect(calcularProximoPasso(entrada({ ret: "falta", rp: "falta" })).proximo).toBe("ret");
    expect(calcularProximoPasso(entrada({ sr: "atencao" })).proximo).toBe("sr");
  });

  it("CGF fica bloqueado sem o PMPV dos meses apurados, e o próximo passa para o PMPV", () => {
    const r = calcularProximoPasso(entrada({ pmpv: "falta", cgf: "falta" }));
    expect(r.proximo).toBe("pmpv");
    expect(r.bloqueios.cgf).toEqual({ motivo: "falta o PMPV de Jul, Ago", destino: "pmpv" });
  });

  it("PR e PV ficam bloqueados sem o SCG e o próximo pula para o que dá para fazer", () => {
    const r = calcularProximoPasso(entrada({ scg: "falta", pr: "falta", pv: "atencao" }));
    expect(r.bloqueios.pr).toEqual({ motivo: "falta o SCG de Jul, Ago", destino: "scg" });
    expect(r.bloqueios.pv?.destino).toBe("scg");
    expect(r.proximo).toBe("scg");
  });

  it("PR e PV bloqueados sem o PMPV do trimestre novo; o SR segue livre", () => {
    const r = calcularProximoPasso(entrada({ sr: "falta", pr: "falta", pv: "falta" }, { pmpvNovoPronto: false }));
    expect(r.bloqueios.pr).toEqual({ motivo: "falta o PMPV do trimestre novo (Ago a Out/2026)", destino: "pmpv_novo" });
    expect(r.bloqueios.sr).toBeUndefined();
    expect(r.proximo).toBe("sr");
  });

  it("PMPV novo desconhecido (null) não bloqueia", () => {
    const r = calcularProximoPasso(entrada({ pr: "falta" }, { pmpvNovoPronto: null }));
    expect(r.bloqueios.pr).toBeUndefined();
    expect(r.proximo).toBe("pr");
  });

  it("SCG com divergência (atenção) não bloqueia PR, só o 'falta' bloqueia", () => {
    expect(calcularProximoPasso(entrada({ scg: "atencao", pr: "falta" })).bloqueios.pr).toBeUndefined();
  });

  it("tarifa média: bloqueada sem PV gravado e nunca é o próximo", () => {
    const r = calcularProximoPasso(entrada({ pv: "atencao" }));
    expect(r.bloqueios.tarifa?.destino).toBe("pv");
    expect(r.proximo).toBe("pv");
    expect(calcularProximoPasso(entrada({})).bloqueios.tarifa).toBeUndefined();
  });
});

describe("proximoDoBack", () => {
  const sit = { pr: "ok", pv: "falta" } as const;
  it("usa o passo do back quando o Painel o conhece", () => {
    expect(proximoDoBack("rp", "sr", sit)).toBe("sr");
    expect(proximoDoBack("rp", { chave: "pmpv_anterior" }, sit)).toBe("pmpv");
  });
  it("pr_pv vira PR ou PV conforme o que falta", () => {
    expect(proximoDoBack(null, "pr_pv", { pr: "falta" })).toBe("pr");
    expect(proximoDoBack(null, "pr_pv", sit)).toBe("pv");
  });
  it("sem dado, ou passo desconhecido (pasta_scg), mantém o cálculo local", () => {
    expect(proximoDoBack("cgf", undefined, sit)).toBe("cgf");
    expect(proximoDoBack("cgf", "pasta_scg", sit)).toBe("cgf");
  });
});
