import { describe, expect, it } from "vitest";
import { passoSelecionado } from "./passoSelecionado";

const CHAVES = ["pmpv", "auditoria", "cgf", "ret", "rp", "scg", "sr", "pr", "pv"] as const;
const C = [...CHAVES];

describe("passoSelecionado", () => {
  it("abre no próximo passo quando o analista não escolheu", () => {
    expect(passoSelecionado(null, "sr", C)).toBe("sr");
  });
  it("a escolha do analista vale mais que o próximo passo", () => {
    expect(passoSelecionado("cgf", "sr", C)).toBe("cgf");
  });
  it("sem próximo passo, mostra o último (tudo pronto)", () => {
    expect(passoSelecionado(null, null, C)).toBe("pv");
  });
  it("escolha que não existe na lista é ignorada", () => {
    expect(passoSelecionado("tarifa", "pr", C)).toBe("pr");
  });
  it("lista vazia (ainda carregando) não escolhe nada", () => {
    expect(passoSelecionado(null, "pr", [])).toBeNull();
  });
});
