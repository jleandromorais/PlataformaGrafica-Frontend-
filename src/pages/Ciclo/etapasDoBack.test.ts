import { describe, expect, it } from "vitest";
import { aplicarEtapasDoBack, etapasDoBack } from "./etapasDoBack";
import type { SituacaoCiclo } from "../../types";
import type { EntradaPasso } from "./proximoPasso";

const CHAVES = ["pmpv", "auditoria", "cgf", "ret", "rp", "scg", "sr", "pr", "pv"] as const;

const etapa = (chave: string, estado: string, extra: Record<string, unknown> = {}) =>
  ({ numero: CHAVES.indexOf(chave as (typeof CHAVES)[number]) + 1, chave, estado, motivo: `motivo ${chave}`, rota: `/${chave}`, ...extra });

const todas = (estados: Record<string, string> = {}, extra: Record<string, Record<string, unknown>> = {}) =>
  CHAVES.map((c) => etapa(c, estados[c] ?? "pronto", extra[c]));

const situacao = (etapas: unknown): SituacaoCiclo => ({ etapas } as SituacaoCiclo);

describe("etapasDoBack: lê o campo etapas do back novo", () => {
  it("traduz pronto, atencao, falta e bloqueado para o que o Painel usa", () => {
    const m = etapasDoBack(situacao(todas({ cgf: "atencao", ret: "falta", pr: "bloqueado" }, { ret: { meses_que_faltam: ["Ago/2026"] } })));
    expect(m?.auditoria?.situacao).toBe("ok");
    expect(m?.cgf?.situacao).toBe("atencao");
    expect(m?.ret).toMatchObject({ situacao: "falta", mesesQueFaltam: ["Ago/2026"] });
    expect(m?.pr?.situacao).toBe("falta"); // o bloqueio mora no Painel; para o passo, "bloqueado" é "não está pronto"
  });

  it("guarda o motivo do back", () => {
    expect(etapasDoBack(situacao(todas()))?.sr?.motivo).toBe("motivo sr");
  });

  it("back antigo (sem o campo) ou vazio: devolve null e o Painel calcula sozinho", () => {
    expect(etapasDoBack(null)).toBeNull();
    expect(etapasDoBack({} as SituacaoCiclo)).toBeNull();
    expect(etapasDoBack(situacao([]))).toBeNull();
  });

  it("lista incompleta, com chave desconhecida ou estado inválido: não confia, devolve null", () => {
    expect(etapasDoBack(situacao(todas().slice(0, 8)))).toBeNull();
    expect(etapasDoBack(situacao([...todas().slice(0, 8), etapa("xyz", "pronto")]))).toBeNull();
    expect(etapasDoBack(situacao(todas({ rp: "talvez" })))).toBeNull();
    expect(etapasDoBack(situacao("texto"))).toBeNull();
  });

  it("meses_que_faltam ausente vira lista vazia", () => {
    expect(etapasDoBack(situacao(todas()))?.pmpv?.mesesQueFaltam).toEqual([]);
  });
});

describe("aplicarEtapasDoBack", () => {
  const local: EntradaPasso[] = [
    { chave: "pmpv", situacao: "ok" }, { chave: "cgf", situacao: "ok" },
    { chave: "ret", situacao: "ok" }, { chave: "tarifa", situacao: "falta", soLink: true },
  ];

  it("troca a situação e os meses que faltam dos passos que o back conhece", () => {
    const m = etapasDoBack(situacao(todas({ ret: "falta" }, { ret: { meses_que_faltam: ["Set/2026"] } })));
    const r = aplicarEtapasDoBack(local, m);
    expect(r.find((p) => p.chave === "ret")).toMatchObject({ situacao: "falta", mesesQueFaltam: ["Set/2026"] });
    expect(r.find((p) => p.chave === "cgf")?.situacao).toBe("ok");
  });

  it("a tarifa média (que o back não tem) continua como o Painel calculou", () => {
    const r = aplicarEtapasDoBack(local, etapasDoBack(situacao(todas())));
    expect(r.find((p) => p.chave === "tarifa")).toEqual({ chave: "tarifa", situacao: "falta", soLink: true });
  });

  it("sem etapas do back, devolve os passos locais sem mudar nada", () => {
    expect(aplicarEtapasDoBack(local, null)).toEqual(local);
  });
});
