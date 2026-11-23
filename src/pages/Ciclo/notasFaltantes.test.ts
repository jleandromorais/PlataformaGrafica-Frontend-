import { describe, expect, it } from "vitest";
import { decisaoParaEnviar, faltantesDoMes, pendenciasDosMeses, podeGravarComFaltantes, textoDaPendencia } from "./notasFaltantes";
import type { AuditoriaComparacao, AuditoriaHistoricoLinha } from "../../types";

// Valores fictícios.
const comparacao = (soPlanilha: Record<string, unknown>[], soAuditoria: Record<string, unknown>[] = []) =>
  ({ notas_apenas_planilha: soPlanilha, notas_apenas_auditoria: soAuditoria } as unknown as AuditoriaComparacao);
const TAG = { empresa: "TAG", numero: "4539", cgr_planilha: 5000, valor_planilha: 6000, linha_excel: 12, dados_linha: { "Vol m³": 300 } };

describe("faltantesDoMes", () => {
  it("sem comparação ou sem nota só na planilha: nada falta", () => {
    expect(faltantesDoMes(null).notas).toEqual([]);
    expect(faltantesDoMes(comparacao([])).notas).toEqual([]);
  });
  it("monta o pedido com os números da planilha", () => {
    const f = faltantesDoMes(comparacao([TAG]));
    expect(f.notas).toHaveLength(1);
    expect(f.paraIncluir).toEqual([{ empresa: "TAG", numero: "4539", cgr_liquido: 5000, valor_total: 6000, volume_total: 300, linha_excel: 12 }]);
  });
  it("nota com o mesmo valor de uma nota lida é a mesma, escrita de outro jeito: não falta", () => {
    const f = faltantesDoMes(comparacao([TAG], [{ empresa: "TAG", numero: "04539", cgr_liquido: 5000.4 }]));
    expect(f.notas).toEqual([]);
  });
  it("sem CGR na planilha não dá para incluir: só seguir sem", () => {
    const f = faltantesDoMes(comparacao([{ ...TAG, cgr_planilha: undefined }]));
    expect(f.notas).toHaveLength(1);
    expect(f.paraIncluir).toBeNull();
    expect(podeGravarComFaltantes(f, "incluir", "motivo válido")).toBe(false);
    expect(podeGravarComFaltantes(f, "seguir_sem")).toBe(true);
  });
});

describe("podeGravarComFaltantes / decisaoParaEnviar", () => {
  const f = faltantesDoMes(comparacao([TAG]));
  it("com nota faltante só grava depois de escolher", () => {
    expect(podeGravarComFaltantes(f, null)).toBe(false);
    expect(podeGravarComFaltantes(f, "incluir", "o fornecedor não mandou")).toBe(true);
    expect(podeGravarComFaltantes(f, "seguir_sem")).toBe(true);
  });
  it("incluir pede o motivo (mínimo 5 letras)", () => {
    expect(podeGravarComFaltantes(f, "incluir")).toBe(false);
    expect(podeGravarComFaltantes(f, "incluir", "  ab ")).toBe(false);
  });
  it("sem nota faltante grava direto e não envia decisão", () => {
    const vazio = faltantesDoMes(comparacao([]));
    expect(podeGravarComFaltantes(vazio, null)).toBe(true);
    expect(decisaoParaEnviar(vazio, "incluir")).toBeUndefined();
  });
  it("envia as notas e a escolha", () => {
    expect(decisaoParaEnviar(f, "seguir_sem")).toEqual({ faltantes: f.paraIncluir, decisao: "seguir_sem" });
    expect(decisaoParaEnviar(f, "incluir", " chega depois do período ")).toEqual({ faltantes: f.paraIncluir, decisao: "incluir", motivo: "chega depois do período" });
    expect(decisaoParaEnviar(f, "incluir", "")).toBeUndefined();
    expect(decisaoParaEnviar(f, null)).toBeUndefined();
  });
});

describe("avisos persistentes", () => {
  const p = { empresa: "TAG", numero: "4539", cgr_liquido: 5000 };
  it("diz o que foi decidido", () => {
    expect(textoDaPendencia("Jul/2026", { ...p, decisao: "incluida", motivo: "" })).toContain("só chega depois do período");
    expect(textoDaPendencia("Jul/2026", { ...p, decisao: "sem_a_nota", motivo: "" })).toContain("gravado sem a nota");
  });
  it("junta só os meses do trimestre", () => {
    const hist = [
      { periodo: "Jul/2026", pendencias: [{ ...p, decisao: "sem_a_nota", motivo: "" }] },
      { periodo: "Out/2026", pendencias: [{ ...p, decisao: "sem_a_nota", motivo: "" }] },
      { periodo: "Ago/2026" },
    ] as unknown as AuditoriaHistoricoLinha[];
    expect(pendenciasDosMeses(hist, ["Jul/2026", "Ago/2026", "Set/2026"])).toHaveLength(1);
  });
});
