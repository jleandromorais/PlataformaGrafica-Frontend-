import { describe, expect, it } from "vitest";
import { mensagemDeErro, SEPARADOR_DETALHE } from "./client";

const PADRAO = "Não foi possível processar RP — Conciliação (penalidades) de Out/2026.";
const doNavegador = (name: string, message = "x") => Object.assign(new Error(message), { name });

describe("mensagemDeErro: erro que nasce no navegador", () => {
  it("arquivo movido ou alterado depois de carregar a pasta: diz o porquê e o que fazer", () => {
    for (const nome of ["NotFoundError", "NotReadableError"]) {
      const m = mensagemDeErro(doNavegador(nome, "A requested file could not be found"), PADRAO);
      const [texto, tecnico] = m.split(SEPARADOR_DETALHE);
      expect(texto).toMatch(/^Não foi possível processar RP .* de Out\/2026: não consegui abrir um arquivo da pasta/);
      expect(texto).toMatch(/Carregue a pasta de novo/);
      expect(tecnico).toContain(nome);
    }
  });
  it("permissão negada", () => {
    expect(mensagemDeErro(doNavegador("NotAllowedError"), PADRAO)).toMatch(/não deu permissão/);
  });
  it("qualquer outro erro do navegador não some: vai com o detalhe técnico", () => {
    const m = mensagemDeErro(new TypeError("Cannot read properties of undefined (reading 'filter')"), PADRAO);
    expect(m).toMatch(/erro aqui no navegador/);
    expect(m.split(SEPARADOR_DETALHE)[1]).toContain("TypeError: Cannot read properties");
  });
  it("algo que nem é erro: só o texto padrão", () => {
    expect(mensagemDeErro("??", PADRAO)).toBe(PADRAO);
  });
});
