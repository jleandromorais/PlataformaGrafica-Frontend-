import { describe, expect, it } from "vitest";
import {
  AVISO_DESATUALIZADO, camposDesatualizados, estadoDaProvaSR, estadoDasFontes, rotuloDoTrimestre, trimestreDoFormulario,
} from "./estadoProva";
import type { ProvaRealLinhaSR, ProvaRealSR } from "../../types";

const linha = (extra: Partial<ProvaRealLinhaSR> = {}): ProvaRealLinhaSR => ({
  mes: "Jan/2026", vp: 1000, vf: 900, pr: 0.12, selic_mensal: 3.4, sr_anterior: 0, diferenca: 100, sr_parcela: 12,
  sr_selic_recalculado: 12.4, sr_selic_gravado: 12.4, conta_confere: true,
  fontes: { vp: 1000, vf: 900, pr: 0.12, selic_mensal: 3.4, diferem: [] }, ...extra,
});
const prova = (extra: Partial<ProvaRealSR> = {}): ProvaRealSR => ({
  trimestre: "Jan/2026_Mar/2026", labels_meses: ["Jan/2026", "Fev/2026", "Mar/2026"], gravado: true,
  linhas: [linha()], total_gravado: 12.4, total_recalculado: 12.4, conta_confere: true, fontes_disponiveis: true,
  alertas: [], data_atualizacao: "2026-04-01 10:00", ...extra,
});

describe("estadoDaProvaSR", () => {
  it("confere, diverge e não gravado", () => {
    expect(estadoDaProvaSR(prova())).toBe("confere");
    expect(estadoDaProvaSR(prova({ conta_confere: false }))).toBe("diverge");
    expect(estadoDaProvaSR(prova({ gravado: false, linhas: [] }))).toBe("nao_gravado");
  });
});

describe("estadoDasFontes", () => {
  it("em dia quando nenhum campo difere", () => {
    expect(estadoDasFontes(prova())).toBe("em_dia");
  });
  it("desatualizadas quando alguma fonte difere do gravado", () => {
    const l = linha({ fontes: { vp: 1200, vf: 900, pr: 0.12, selic_mensal: 3.4, diferem: ["vp"] } });
    expect(estadoDasFontes(prova({ linhas: [l] }))).toBe("desatualizadas");
  });
  it("indisponíveis quando o back não conseguiu consultar", () => {
    expect(estadoDasFontes(prova({ fontes_disponiveis: false, linhas: [linha({ fontes: null })] }))).toBe("indisponiveis");
  });
  it("sem dados quando o trimestre não está gravado", () => {
    expect(estadoDasFontes(prova({ gravado: false, linhas: [] }))).toBe("sem_dados");
  });
});

describe("camposDesatualizados", () => {
  it("mostra gravado e hoje de cada campo que difere", () => {
    const l = linha({ fontes: { vp: 1200, vf: 900, pr: 0.15, selic_mensal: 3.4, diferem: ["vp", "pr"] } });
    expect(camposDesatualizados(l)).toEqual([
      { campo: "vp", rotulo: "VP (do PMPV)", gravado: 1000, hoje: 1200 },
      { campo: "pr", rotulo: "PR (do módulo PR)", gravado: 0.12, hoje: 0.15 },
    ]);
  });
  it("sem fontes ou sem diferença, nada a mostrar", () => {
    expect(camposDesatualizados(linha({ fontes: null }))).toEqual([]);
    expect(camposDesatualizados(linha())).toEqual([]);
  });
  it("manda recalcular no Painel do Ciclo", () => {
    expect(AVISO_DESATUALIZADO).toContain("Painel do Ciclo");
  });
});

describe("chave do trimestre", () => {
  it("escreve o trimestre por extenso", () => {
    expect(rotuloDoTrimestre("Jan/2026_Mar/2026")).toBe("Jan/2026 a Mar/2026");
  });
  it("traduz para o trimestre civil do formulário", () => {
    expect(trimestreDoFormulario("Jan/2026_Mar/2026")).toEqual({ ano: 2026, tri: 0 });
    expect(trimestreDoFormulario("Out/2025_Dez/2025")).toEqual({ ano: 2025, tri: 3 });
  });
  it("chave que não começa num trimestre civil não vai para o formulário", () => {
    expect(trimestreDoFormulario("Fev/2026_Abr/2026")).toBeNull();
    expect(trimestreDoFormulario("lixo")).toBeNull();
  });
});
