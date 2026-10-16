import axios from "axios";
import { api } from "./client";
import type {
  PMPVCalculoRequest, PMPVResultado, PMPVSalvarRequest, PMPVImportarResponse,
  RPVValores, RPVHistoricoLinha, SCGComparacao, SCGHistoricoLinha,
  CGFCalcularRsResponse, CGFColunas, CGFHistoricoLinha, CGFProcessarResponse, CGFVolumes, AuditoriaResultado, AuditoriaItem, AuditoriaHistoricoLinha,
  ConciliaResultado, ConciliaItem, ConciliaHistoricoLinha, RETResultado, RETDocumento, RETHistoricoLinha,
  SCGPeriodo, PRResultado, PRTrimestralResultado, PRSrAnterior, DashboardResponse,
  SRSessaoPMPV, SRLinhaEntrada, SRLinhaCalculada, SRTrimestreCalculo,
  PVResultado, PVPeriodo,
} from "../types";

// ─── DASHBOARD ───────────────────────────────────────────────────────────────
export const getDashboard = (ano?: string) =>
  api
    .get<DashboardResponse>("/dashboard", { params: ano ? { ano } : {} })
    .then((r) => r.data);

// ─── CONFIG ──────────────────────────────────────────────────────────────────
export const getTrimestresCivis = () =>
  api
    .get<{ label: string; meses: string[] }[]>("/config/trimestres-civis")
    .then((r) => r.data);

export const getTrimestresFiscais = () =>
  api
    .get<{ label: string; meses: string[] }[]>("/config/trimestres-fiscais")
    .then((r) => r.data);

// ─── PMPV ────────────────────────────────────────────────────────────────────
export const calcularPMPV = (payload: PMPVCalculoRequest) =>
  api.post<PMPVResultado>("/pmpv/calcular", payload).then((r) => r.data);

/** Salva sessão + PMPV mensal de cada período + trimestre ativo (igual ao desktop). */
export const salvarPMPV = (payload: PMPVSalvarRequest) =>
  api.post<{ sessao_id: number }>("/pmpv/salvar", payload).then((r) => r.data);

export const getPMPVMensal = (periodo: string) =>
  api.get<{ pmpv: number }>(`/pmpv/mensal/${periodo}`).then((r) => r.data);

export const getTrimestreAtivo = () =>
  api.get<{ meses: string[] }>("/pmpv/trimestre-ativo").then((r) => r.data.meses);

export const importarMemoriaPMPV = (arquivo: File, periodos: string[]) => {
  const form = new FormData();
  form.append("arquivo", arquivo);
  form.append("periodos", periodos.join(","));
  return api
    .post<PMPVImportarResponse>("/pmpv/importar-memoria", form, {
      headers: { "Content-Type": "multipart/form-data" },
      timeout: 120000, // planilhas grandes
    })
    .then((r) => r.data);
};

// ─── RPV ─────────────────────────────────────────────────────────────────────
/** CGR/CGF/RPV gravados no período, ou null se o período ainda não existe. */
export const getRPV = (periodo: string) =>
  api
    .get<RPVValores>("/rpv", { params: { periodo } })
    .then((r) => r.data)
    .catch((e) => {
      if (axios.isAxiosError(e) && e.response?.status === 404) return null;
      throw e;
    });

export const salvarRPV = (periodo: string, cgr: number, cgf: number) =>
  api.post<{ rpv: number }>("/rpv/salvar", { periodo, cgr, cgf }).then((r) => r.data);

export const getHistoricoRPV = () =>
  api.get<RPVHistoricoLinha[]>("/rpv/historico").then((r) => r.data);

// ─── CGF ─────────────────────────────────────────────────────────────────────
/** Calcula volumes a partir das planilhas de NF. Não grava nada. */
export const processarCGF = (arquivos: File[], colunas: CGFColunas) => {
  const form = new FormData();
  arquivos.forEach((a) => form.append("arquivos", a, a.name)); // o tipo vem do NOME do arquivo
  Object.entries(colunas).forEach(([k, v]) => form.append(k, v));
  return api
    .post<CGFProcessarResponse>("/cgf/processar", form, {
      headers: { "Content-Type": "multipart/form-data" },
      timeout: 180000,
    })
    .then((r) => r.data);
};

/** Grava CGF em R$ (volume final × PMPV) e o resumo. Exige PMPV > 0. */
export const salvarCGF = (payload: CGFVolumes & { periodo: string; pmpv: number }) =>
  api.post<{ cgf_rs: number; rpv: number }>("/cgf/salvar", payload).then((r) => r.data);

/** CGF em R$ = volume final × PMPV. Sem `pmpv`, o back usa o PMPV salvo do mês. Não grava. */
export const calcularCGFRs = (periodo: string, volume_final: number, pmpv?: number) =>
  api.post<CGFCalcularRsResponse>("/cgf/calcular-rs", { periodo, volume_final, pmpv: pmpv ?? null }).then((r) => r.data);

export const getHistoricoCGF = () =>
  api.get<CGFHistoricoLinha[]>("/cgf/historico").then((r) => r.data);

// ─── AUDITORIA ───────────────────────────────────────────────────────────────
/** Arquivo da pasta escolhida + caminho relativo SEM a pasta raiz ("EMPRESA/sub/x.xml"). */
export interface ArquivoDaPasta { arquivo: File; caminho: string }

/** Audita a pasta enviada (uma subpasta por empresa). Não grava nada. */
export const processarAuditoria = (opts: {
  arquivos: ArquivoDaPasta[];
  pastaRaiz: string;
  empresas: string[];
  modo: "XML" | "PDF";
  periodo: string;
  planilha: File | null;
}) => {
  const form = new FormData();
  opts.arquivos.forEach(({ arquivo, caminho }) => form.append("arquivos", arquivo, caminho));
  form.append("pasta_raiz", opts.pastaRaiz);
  form.append("empresas", JSON.stringify(opts.empresas));
  form.append("modo", opts.modo);
  form.append("periodo", opts.periodo);
  if (opts.planilha) form.append("planilha", opts.planilha);
  return api
    .post<AuditoriaResultado>("/auditoria/processar", form, {
      headers: { "Content-Type": "multipart/form-data" },
      timeout: 20 * 60 * 1000, // PDFs são lentos: uma pasta grande leva minutos
    })
    .then((r) => r.data);
};

/** Grava o CGR (recalculado no servidor) e os itens do período. */
export const salvarAuditoria = (periodo: string, itens: AuditoriaItem[]) =>
  api.post<{ cgr_liquido: number; rpv: number; qtd_itens: number }>("/auditoria/salvar", { periodo, itens }).then((r) => r.data);

/** Relatório Excel da auditoria (com as abas de comparação se houver planilha). */
export const baixarRelatorioAuditoria = (periodo: string, itens: AuditoriaItem[], planilha: File | null) => {
  const form = new FormData();
  form.append("itens", JSON.stringify(itens));
  form.append("periodo", periodo);
  if (planilha) form.append("planilha", planilha);
  return api
    .post<Blob>("/auditoria/relatorio", form, { responseType: "blob", timeout: 5 * 60 * 1000 })
    .then((r) => r.data);
};

export const getHistoricoAuditoria = () =>
  api.get<AuditoriaHistoricoLinha[]>("/auditoria/historico").then((r) => r.data);

// ─── CONCILIAÇÃO (RP) ────────────────────────────────────────────────────────
/** Lê os PDFs das pastas de receitas e despesas. Não grava nada. */
export const processarConcilia = (receitas: ArquivoDaPasta[], despesas: ArquivoDaPasta[]) => {
  const form = new FormData();
  receitas.forEach(({ arquivo, caminho }) => form.append("receitas", arquivo, caminho));
  despesas.forEach(({ arquivo, caminho }) => form.append("despesas", arquivo, caminho));
  return api
    .post<ConciliaResultado>("/conciliacao/processar", form, {
      headers: { "Content-Type": "multipart/form-data" },
      timeout: 15 * 60 * 1000,
    })
    .then((r) => r.data);
};

/** Grava o RP (despesas − receitas, recalculado no servidor) e os itens. */
export const salvarConcilia = (periodo: string, itens: ConciliaItem[]) =>
  api.post<{ rp: number; qtd_itens: number }>("/conciliacao/salvar", { periodo, itens }).then((r) => r.data);

export const baixarRelatorioConcilia = (periodo: string, itens: ConciliaItem[]) =>
  api.post<Blob>("/conciliacao/relatorio", { periodo, itens }, { responseType: "blob" }).then((r) => r.data);

export const getHistoricoConcilia = () =>
  api.get<ConciliaHistoricoLinha[]>("/conciliacao/historico").then((r) => r.data);

// ─── RET ─────────────────────────────────────────────────────────────────────
/** Lê os PDFs de encargos da pasta enviada. Não grava nada. */
export const processarRET = (arquivos: ArquivoDaPasta[], pastaRaiz: string) => {
  const form = new FormData();
  arquivos.forEach(({ arquivo, caminho }) => form.append("arquivos", arquivo, caminho));
  form.append("pasta_raiz", pastaRaiz);
  return api
    .post<RETResultado>("/ret/processar", form, {
      headers: { "Content-Type": "multipart/form-data" },
      timeout: 15 * 60 * 1000,
    })
    .then((r) => r.data);
};

/** Grava o RET de cada mês (recalculado no servidor) e os documentos. */
export const salvarRET = (documentos: RETDocumento[], periodoPadrao: string) =>
  api
    .post<{ periodo: string; ret: number; qtd_documentos: number }[]>("/ret/salvar", { documentos, periodo_padrao: periodoPadrao })
    .then((r) => r.data);

export const getHistoricoRET = () =>
  api.get<RETHistoricoLinha[]>("/ret/historico").then((r) => r.data);

// ─── SCG ─────────────────────────────────────────────────────────────────────
// `periodo` sempre via query string — path param quebra com a barra do
// formato mês/ano (ex: "Jan/2026").
export const getSCGPeriodos = () =>
  api.get<SCGPeriodo[]>("/scg/periodos").then((r) => r.data);

export const getSCG = (periodo: string) =>
  api.get<SCGPeriodo>("/scg", { params: { periodo } }).then((r) => r.data);

export const calcularSCG = (periodo: string) =>
  api.post<SCGPeriodo>("/scg/calcular", null, { params: { periodo } }).then((r) => r.data);

export const salvarSCGManual = (payload: Partial<SCGPeriodo>) =>
  api.post<SCGPeriodo>("/scg/manual", payload).then((r) => r.data);

export const apagarSCG = (periodo: string) =>
  api.delete<void>("/scg", { params: { periodo } }).then((r) => r.data);

/** Valores dos módulos (itens) × gravados na consolidação para o período. */
export const getSCGComparacao = (periodo: string) =>
  api.get<SCGComparacao>("/scg/comparar", { params: { periodo } }).then((r) => r.data);

/** Grava CGR/CGF/RET/RP escolhidos e recalcula RPV e SCG. */
export const salvarSCG = (payload: { periodo: string; cgr: number; cgf: number; ret: number; rp: number }) =>
  api.post<SCGPeriodo>("/scg/salvar", payload).then((r) => r.data);

export const getHistoricoSCG = () =>
  api.get<SCGHistoricoLinha[]>("/scg/historico").then((r) => r.data);

// ─── EXCEL FINAL ─────────────────────────────────────────────────────────────
/** Meses de Auditoria/RET/Conciliação que entram no Excel Final do período. */
export const getTrimestreExcelFinal = (periodo: string) =>
  api.get<{ periodo: string; meses: string[] }>("/excel-final/trimestre", { params: { periodo } }).then((r) => r.data);

/** Gera o Excel Final no servidor e devolve o arquivo. */
export const gerarExcelFinal = (periodo: string) =>
  api
    .post<Blob>("/excel-final/gerar", null, { params: { periodo }, responseType: "blob", timeout: 5 * 60 * 1000 })
    .then((r) => r.data);

/** Períodos com dados gravados: o que o Excel Final geral contém. */
export const getCoberturaExcelFinal = () =>
  api.get<{ anos: string[]; periodos: string[]; total: number }>("/excel-final/cobertura").then((r) => r.data);

/** Excel Final com todos os períodos e anos gravados. */
export const gerarExcelFinalGeral = () =>
  api
    .post<Blob>("/excel-final/gerar-geral", null, { responseType: "blob", timeout: 5 * 60 * 1000 })
    .then((r) => r.data);

// ─── PR ──────────────────────────────────────────────────────────────────────
// PR = (SCG + ΣSR) / VP. Ver Front_end/SPEC_PR.md.
export const getPR = (periodo: string) =>
  api.get<PRResultado>("/pr", { params: { periodo } }).then((r) => r.data);

export const listarPeriodosPR = () =>
  api.get<string[]>("/pr/periodos").then((r) => r.data);

export const listarSrAnterioresPR = () =>
  api.get<PRSrAnterior[]>("/pr/sr-anteriores").then((r) => r.data);

export const buscarTrimestralPR = (periodos: string[]) =>
  api.post<PRTrimestralResultado>("/pr/trimestral", { periodos }).then((r) => r.data);

export const salvarPR = (periodo: string, scg: number, sr: number, vp: number) =>
  api.post<{ pr: number }>("/pr/salvar", { periodo, scg, sr, vp }).then((r) => r.data);

// ─── PV ──────────────────────────────────────────────────────────────────────
// PV = PMPV + PR. Ver Front_end/SPEC_PV.md.
export const listarPeriodosPV = () =>
  api.get<PVPeriodo[]>("/pv/periodos").then((r) => r.data);

export const criarPeriodoPV = (nome: string) =>
  api.post<{ nome: string }>("/pv/periodos", { nome }).then((r) => r.data);

export const getPV = (periodo: string) =>
  api.get<PVResultado>("/pv", { params: { periodo } }).then((r) => r.data);

export const salvarPV = (periodo: string, pmpv: number, pr: number) =>
  api.post<{ pv: number }>("/pv/salvar", { periodo, pmpv, pr }).then((r) => r.data);

// ─── SR ──────────────────────────────────────────────────────────────────────
// SR = (VP − VF) × PR × (1 + SELIC%) + SR anterior — calculado por mês
// dentro de um trimestre. Ver Front_end/SPEC_SR.md.
export const listarSessoesSR = () =>
  api.get<SRSessaoPMPV[]>("/sr/sessoes").then((r) => r.data);

export const carregarTrimestreSR = (sessaoId: number, labelsMeses: string[]) =>
  api
    .post<{ mes: string; vp: number; vf: number; pr: number }[]>("/sr/trimestre/carregar", {
      sessao_id: sessaoId,
      labels_meses: labelsMeses,
    })
    .then((r) => r.data);

export const calcularTrimestreSR = (linhas: SRLinhaEntrada[]) =>
  api
    .post<SRTrimestreCalculo>("/sr/trimestre/calcular", { linhas })
    .then((r) => r.data);

export const salvarTrimestreSR = (
  labelsMeses: string[],
  periodoReferencia: string,
  linhas: SRLinhaCalculada[]
) =>
  api
    .post<{ total: number }>("/sr/trimestre/salvar", {
      labels_meses: labelsMeses,
      periodo_referencia: periodoReferencia,
      linhas,
    })
    .then((r) => r.data);

export const buscarTrimestreSR = (label: string) =>
  api
    .get<Record<string, unknown>[]>("/sr/trimestre", { params: { label } })
    .then((r) => r.data);
