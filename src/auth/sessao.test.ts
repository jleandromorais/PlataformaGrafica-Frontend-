import { AxiosError, AxiosHeaders } from "axios";
import { describe, expect, it } from "vitest";
import { deveApagarToken } from "./sessao";

const comStatus = (status: number) =>
  new AxiosError("x", "ERR", undefined, undefined, { status, statusText: "", headers: {}, config: { headers: new AxiosHeaders() }, data: {} });

describe("deveApagarToken (BG2)", () => {
  it("401: token vencido ou inválido, apaga", () => {
    expect(deveApagarToken(comStatus(401))).toBe(true);
  });
  it("sem resposta (internet caiu), 500 ou 503: mantém o token", () => {
    expect(deveApagarToken(new AxiosError("Network Error", "ERR_NETWORK"))).toBe(false);
    expect(deveApagarToken(comStatus(500))).toBe(false);
    expect(deveApagarToken(comStatus(503))).toBe(false);
  });
  it("erro que não é da API: mantém", () => {
    expect(deveApagarToken(new Error("x"))).toBe(false);
  });
});
