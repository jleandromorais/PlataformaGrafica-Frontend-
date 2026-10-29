import { describe, expect, it } from "vitest";
import {
  arquivosDaCelula, classificar, envioDaPastaDoMes, mapaDoTrimestre, mesDoTexto, tipoPlanilhaCGF,
  type ArquivoClassificado,
} from "./pastaCiclo";

// Estrutura real da pasta do ciclo (SCG-26). Só nomes de pastas e planilhas; os
// PDFs/XML de empresas viram nomes genéricos.
const RPV = "RPV - Recuperação do Preço de Venda";
const CGF = `${RPV}/CGF`;
const CGR = `${RPV}/CGR`;
const RP = "RP - Recuperação de Penalidades";
const RET = "RET - Recuperação de Encargos de Transporte";
const JAN_MAR = ["Jan/2026", "Fev/2026", "Mar/2026"];

const cls = (caminho: string) => classificar(caminho, 2026);
const celula = (mapa: ReturnType<typeof mapaDoTrimestre>, etapa: string, periodo: string) =>
  mapa.celulas.find((c) => c.etapa === etapa && c.periodo === periodo)!;

describe("mesDoTexto", () => {
  it.each([
    ["01 jan-26 Notas Fiscais", 0, 2026],
    ["jan26", 0, 2026],
    ["EAT jan26", 0, 2026],
    ["total mensal 01-2026", 0, 2026],
    ["56. Agosto 2026", 7, 2026],
    ["02 fev -26", 1, 2026],
    ["Março 2026", 2, 2026],
    ["NF Faturadas 01.26", 0, 2026],
    ["06 jun", 5, null],
  ])("%s → mês %i, ano %s", (texto, mes, ano) => {
    expect(mesDoTexto(texto)).toEqual({ mes, ano });
  });

  it.each([
    ["RET-jan-mar-26"], // intervalo = pasta de trimestre
    ["jan a mar"],
    ["OneDrive_1_14-07-2026"], // data de download, não é julho (regressão)
    ["Notas"],
  ])("%s → sem mês", (texto) => {
    expect(mesDoTexto(texto)).toBeNull();
  });
});

describe("tipoPlanilhaCGF (mesmas palavras do backend)", () => {
  it.each([
    ["NF Faturadas e complementares 01.26.xlsx", "faturada"],
    ["NF Faturada.Complementar 06.2026.xlsx", "faturada"],
    ["NF Canceladas e denegadas 01.26.xlsx", "cancelada"],
    ["NF Canc.Deneg.Rej. 06.2026.xlsx", "cancelada"],
    ["NF Devolvidas 01.26.xlsx", "devolucao"],
    ["NF DEVOLUÇÃO 03.26.xlsx", "devolucao"],
    ["Relatório Finan 02.26.xlsx", null],
  ])("%s → %s", (nome, tipo) => {
    expect(tipoPlanilhaCGF(nome)).toBe(tipo);
  });
});

describe("classificar: CGF pelo nome da planilha", () => {
  it("planilha na pasta do mês", () => {
    const a = cls(`${CGF}/total mensal 01-2026/NF Faturadas e complementares 01.26.xlsx`);
    expect(a).toMatchObject({ etapa: "cgf", tipoCGF: "faturada", periodo: "Jan/2026", avisos: [] });
  });

  it("planilha direto na pasta escolhida: o mês vem do nome do arquivo", () => {
    expect(cls("NF Faturadas 01.26.xlsx")).toMatchObject({ etapa: "cgf", periodo: "Jan/2026", avisos: [] });
  });

  it("cópia com (1) no nome", () => {
    expect(cls(`${CGF}/total mensal 04-2026/NF FATURADAS 04.2026 (1).xlsx`)).toMatchObject({
      etapa: "cgf", tipoCGF: "faturada", periodo: "Abr/2026",
    });
  });

  it("planilha de NF dentro da pasta do CGR vira CGF com aviso", () => {
    const a = cls(`${CGR}/NF Faturadas 04.26.xlsx`);
    expect(a).toMatchObject({ etapa: "cgf", periodo: "Abr/2026" });
    expect(a!.avisos.join()).toContain("Está na pasta “CGR”");
  });
});

describe("classificar: ignorados", () => {
  it.each([
    [`${CGF}/total mensal 02-2026/Relatório Finan 02.26.xlsx`], // Excel que não é NF (regressão)
    [`${CGF}/total mensal 04-2026/substituídas/NF FATURADAS 04.2026.xlsx`], // versão antiga (regressão)
    [`${RP}/TOP/02 - fev26 TOP Não Recup/Substituídos/x.pdf`],
    [`${CGF}/total mensal 01-2026/~$NF Faturadas e complementares 01.26.xlsx`], // temporário do Office
    [`${CGF}/total mensal 04-2026/2026.05.12 Email, solicitando atualização de dados.pdf`],
    [`${CGR}/01 jan-26 Notas Fiscais/leiame.txt`],
    ["Outros/x.pdf"],
  ])("%s → null", (caminho) => {
    expect(cls(caminho)).toBeNull();
  });
});

describe("classificar: etapa, categoria e avisos", () => {
  it("NFs dentro do RP são notas de compra, não penalidade (regressão)", () => {
    const a = cls(`${RP}/abr-26/07 jul-26 NFs.zip`);
    expect(a).toMatchObject({ etapa: "auditoria", periodo: "Jul/2026", zip: true });
    expect(a!.avisos.join()).toContain(`Está na pasta “${RP}”`);
    expect(a!.avisos.join()).toContain("Está dentro de “abr-26”, mas parece ser de Jul/2026.");
  });

  it("penalidades dentro da pasta do CGR geram aviso (regressão)", () => {
    const a = cls(`${CGR}/56. Agosto 2026/Penalidades/x.pdf`);
    expect(a).toMatchObject({ etapa: "conciliacao", categoria: "despesa", periodo: "Ago/2026" });
    expect(a!.avisos.join()).toContain("Está na pasta “CGR”");
  });

  it("data de download do OneDrive não muda o mês do RET (regressão)", () => {
    const a = cls(`${RET}/RET-jan-mar-26/EAT 06 jun26/OneDrive_1_14-07-2026/x.pdf`);
    expect(a).toMatchObject({ etapa: "ret", periodo: "Jun/2026" });
  });

  it("TOP é receita, inclusive dentro da pasta de despesa", () => {
    expect(cls(`${RP}/TOP/02 - fev26 TOP Não Recup/x.pdf`)).toMatchObject({
      etapa: "conciliacao", categoria: "receita", periodo: "Fev/2026",
    });
    expect(cls(`${RP}/fev-26/(penalidade) 02 fev-26 Penalidade Falha de Programação (Despesa)/02 - fev26 TOP Não Recup/x.pdf`))
      .toMatchObject({ categoria: "receita", periodo: "Fev/2026" });
  });

  it("pasta sem ano usa o ano do trimestre e avisa", () => {
    const a = cls(`${RP}/06 jun/Receita/a.pdf`);
    expect(a!.periodo).toBe("Jun/2026");
    expect(a!.avisos).toContain("“06 jun” não tem o ano no nome; considerei 2026.");
  });

  it("pasta sem ano pega o ano da pasta acima, sem aviso de ano", () => {
    const a = cls(`${RP}/Jan-26/06 jun/Receita/a.pdf`);
    expect(a!.periodo).toBe("Jun/2026");
    expect(a!.avisos.join()).not.toContain("não tem o ano");
    expect(a!.avisos.join()).toContain("Está dentro de “Jan-26”");
  });

  it("pasta sem mês avisa e agrupa pela pasta da etapa", () => {
    const a = cls(`${CGR}/09 -nf/Empresa A/a.xml`);
    expect(a).toMatchObject({ etapa: "auditoria", periodo: null, conjunto: `${CGR}/09 -nf` });
    expect(a!.avisos).toContain("Não achei o mês no nome da pasta.");
  });
});

describe("mapaDoTrimestre", () => {
  // Planilhas reais do CGF de Jan a Abr/2026 na SCG-26.
  const cgfReal = [
    `${CGF}/total mensal 01-2026/NF Canceladas e denegadas 01.26.xlsx`,
    `${CGF}/total mensal 01-2026/NF Devolvidas 01.26.xlsx`,
    `${CGF}/total mensal 01-2026/NF Faturadas e complementares 01.26.xlsx`,
    `${CGF}/total mensal 02-2026/NF Canceladas e Denegadas 02.26.xlsx`,
    `${CGF}/total mensal 02-2026/NF Devolvidas 02.26.xlsx`,
    `${CGF}/total mensal 02-2026/NF Faturadas e complementar 02.26.xlsx`,
    `${CGF}/total mensal 02-2026/Relatório Finan 02.26.xlsx`,
    `${CGF}/total mensal 03-2026/NF CANCELADAS E DENEGADAS 03.26.xlsx`,
    `${CGF}/total mensal 03-2026/NF DEVOLUÇÃO 03.26.xlsx`,
    `${CGF}/total mensal 03-2026/NF FATURADAS 03.26.xlsx`,
    `${CGF}/total mensal 04-2026 CGR.zip`,
    `${CGF}/total mensal 04-2026/2026.05.12 Email, solicitando atualização de dados.pdf`,
    `${CGF}/total mensal 04-2026/NF CANCELADAS E DENEGADAS 04.2026 (1).xlsx`,
    `${CGF}/total mensal 04-2026/NF DEVOLUÇÃO 04.2026 (1).xlsx`,
    `${CGF}/total mensal 04-2026/NF FATURADAS 04.2026 (1).xlsx`,
    `${CGF}/total mensal 04-2026/substituídas/NF CANCELADAS E DENEGADAS 04.2026.xlsx`,
    `${CGF}/total mensal 04-2026/substituídas/NF DEVOLUÇÃO 04.2026.xlsx`,
    `${CGF}/total mensal 04-2026/substituídas/NF FATURADAS 04.2026.xlsx`,
  ];

  it("SCG-26 real: CGF de Jan a Mar/2026 com 3 planilhas cada (regressão)", () => {
    const mapa = mapaDoTrimestre(cgfReal, JAN_MAR);
    for (const periodo of JAN_MAR) {
      expect(celula(mapa, "cgf", periodo)).toMatchObject({ situacao: "ok", arquivos: 3, avisos: [], notas: [] });
    }
    // Abr/2026: 3 planilhas + o .zip solto ficam fora do trimestre.
    expect(mapa.ignorados).toBe(4);
  });

  it("CGF sem devoluções pede atenção", () => {
    const mapa = mapaDoTrimestre(cgfReal.filter((c) => !c.includes("Devolvidas 02")), JAN_MAR);
    const c = celula(mapa, "cgf", "Fev/2026");
    expect(c.situacao).toBe("atencao");
    expect(c.avisos).toContain("Falta a planilha de devoluções: sem ela o VF fica maior.");
  });

  it("CGF sem faturadas pede atenção", () => {
    const mapa = mapaDoTrimestre(cgfReal.filter((c) => !c.includes("FATURADAS 03")), JAN_MAR);
    expect(celula(mapa, "cgf", "Mar/2026").avisos).toContain(
      "Falta a planilha de NF faturadas: é dela que sai o volume faturado.",
    );
  });

  it("CGF sem canceladas fica ok, só com nota", () => {
    const mapa = mapaDoTrimestre(cgfReal.filter((c) => !c.includes("denegadas 01")), JAN_MAR);
    const c = celula(mapa, "cgf", "Jan/2026");
    expect(c.situacao).toBe("ok");
    expect(c.notas).toContain("Sem planilha de canceladas (só informativa: não muda o VF).");
  });

  it("RP: .zip igual à pasta é ignorado e falta de despesa pede atenção", () => {
    const receita = `${RP}/Jan-26/Receita-01 jan-26 Penalidade Falha de Programação (Receita)`;
    const mapa = mapaDoTrimestre([`${receita}.zip`, `${receita}/x.pdf`, `${receita}/y.pdf`], JAN_MAR);
    const c = celula(mapa, "conciliacao", "Jan/2026");
    expect(c).toMatchObject({ situacao: "atencao", arquivos: 2 });
    expect(c.notas).toContain("Havia um .zip igual à pasta; usei a pasta.");
    expect(c.avisos).toContain("Não achei a pasta de despesas deste mês.");
  });

  it("RP com receita e despesa fica ok", () => {
    const mapa = mapaDoTrimestre([
      `${RP}/Jan-26/Receita-01 jan-26 Penalidade Falha de Programação (Receita)/x.pdf`,
      `${RP}/Jan-26/Penalidade-01 jan-26 Penalidade Falha de Programação (Despesa)/y.pdf`,
    ], JAN_MAR);
    expect(celula(mapa, "conciliacao", "Jan/2026").situacao).toBe("ok");
  });

  it(".zip solto conta como arquivo e avisa que será extraído", () => {
    const mapa = mapaDoTrimestre([`${CGF}/total mensal 04-2026 CGR.zip`], ["Abr/2026", "Mai/2026", "Jun/2026"]);
    const c = celula(mapa, "cgf", "Abr/2026");
    expect(c).toMatchObject({ situacao: "atencao", arquivos: 1 });
    expect(c.avisos).toContain("1 arquivo(s) .zip: o sistema vai extrair antes de processar.");
  });

  it("etapa sem arquivo no mês fica como falta", () => {
    const mapa = mapaDoTrimestre(cgfReal, JAN_MAR);
    expect(celula(mapa, "ret", "Jan/2026")).toMatchObject({ situacao: "falta", arquivos: 0 });
  });

  it("conta arquivos sem etapa e lista pastas sem mês uma vez só", () => {
    const mapa = mapaDoTrimestre([
      "Outros/x.pdf",
      `${CGR}/09 -nf/Empresa A/a.xml`,
      `${CGR}/09 -nf/Empresa B/b.xml`,
    ], JAN_MAR);
    expect(mapa.semEtapa).toBe(1);
    expect(mapa.semMes).toEqual([`${CGR}/09 -nf`]);
    expect(mapa.ignorados).toBe(2);
  });
});

describe("Processar: arquivos de cada etapa-mês", () => {
  const reconhecidos = (caminhos: string[]) =>
    caminhos.map((c) => cls(c)).filter((x): x is ArquivoClassificado => !!x);

  it("CGF de abril: as 3 planilhas, sem as substituídas nem o e-mail em PDF", () => {
    const caminhos = [
      `${CGF}/total mensal 04-2026/2026.05.12 Email, solicitando atualização de dados.pdf`,
      `${CGF}/total mensal 04-2026/NF CANCELADAS E DENEGADAS 04.2026 (1).xlsx`,
      `${CGF}/total mensal 04-2026/NF DEVOLUÇÃO 04.2026 (1).xlsx`,
      `${CGF}/total mensal 04-2026/NF FATURADAS 04.2026 (1).xlsx`,
      `${CGF}/total mensal 04-2026/substituídas/NF FATURADAS 04.2026.xlsx`,
      `${CGF}/total mensal 04-2026.zip`,
    ];
    const { pastas, zipsSoltos, copias } = arquivosDaCelula(reconhecidos(caminhos), "cgf", "Abr/2026");
    expect(pastas.map((a) => a.tipoCGF).sort()).toEqual(["cancelada", "devolucao", "faturada"]);
    expect(zipsSoltos).toEqual([]);
    expect(copias).toBe(1);
  });

  it("zip sem pasta igual ao lado vai para o envio", () => {
    const { pastas, zipsSoltos } = arquivosDaCelula(reconhecidos([`${CGF}/total mensal 04-2026 CGR.zip`]), "cgf", "Abr/2026");
    expect(pastas).toEqual([]);
    expect(zipsSoltos).toHaveLength(1);
  });

  it("RET é enviado a partir da pasta do mês, com a pasta de cima como raiz", () => {
    const a = cls(`${RET}/RET-jan-mar-26/EAT 07 jul26/ND 1 - COPERGAS.pdf`)!;
    expect(envioDaPastaDoMes(a)).toEqual({ caminho: "EAT 07 jul26/ND 1 - COPERGAS.pdf", raiz: "RET-jan-mar-26" });
  });

  it("subpasta dentro da pasta do mês é preservada (ex.: download do OneDrive)", () => {
    const a = cls(`${RET}/RET-jan-mar-26/EAT 06 jun26/OneDrive_1_14-07-2026/x.pdf`)!;
    expect(envioDaPastaDoMes(a)).toEqual({ caminho: "EAT 06 jun26/OneDrive_1_14-07-2026/x.pdf", raiz: "RET-jan-mar-26" });
  });
});
