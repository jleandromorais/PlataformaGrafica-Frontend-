import { api } from "./client";
import type {
  PMPVSessao, PMPVResultado,
  CGFResumo, AuditoriaResultado,
  ConciliaResultado, RETResultado,
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
export const calcularPMPV = (payload: PMPVSessao) =>
  api.post<PMPVResultado>("/pmpv/calcular", payload).then((r) => r.data);

export const salvarPMPV = (payload: PMPVSessao) =>
  api.post<void>("/pmpv/salvar", payload).then((r) => r.data);

export const getPMPVMensal = (periodo: string) =>
  api.get<{ pmpv: number; vp: number }>(`/pmpv/mensal/${periodo}`).then((r) => r.data);

// ─── CGF ─────────────────────────────────────────────────────────────────────
export const processarCGF = (formData: FormData) =>
  api.post<CGFResumo>("/cgf/processar", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  }).then((r) => r.data);

export const getCGFResumos = () =>
  api.get<CGFResumo[]>("/cgf/resumos").then((r) => r.data);

// ─── AUDITORIA ───────────────────────────────────────────────────────────────
export const processarAuditoria = (formData: FormData) =>
  api.post<AuditoriaResultado>("/auditoria/processar", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  }).then((r) => r.data);

export const salvarAuditoria = (resultado: AuditoriaResultado) =>
  api.post<void>("/auditoria/salvar", resultado).then((r) => r.data);

// ─── CONCILIAÇÃO ─────────────────────────────────────────────────────────────
export const processarConcilia = (formData: FormData) =>
  api.post<ConciliaResultado>("/conciliacao/processar", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  }).then((r) => r.data);

export const salvarConcilia = (resultado: ConciliaResultado) =>
  api.post<void>("/conciliacao/salvar", resultado).then((r) => r.data);

// ─── RET ─────────────────────────────────────────────────────────────────────
export const processarRET = (formData: FormData) =>
  api.post<RETResultado>("/ret/processar", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  }).then((r) => r.data);

export const salvarRET = (resultado: RETResultado) =>
  api.post<void>("/ret/salvar", resultado).then((r) => r.data);

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
