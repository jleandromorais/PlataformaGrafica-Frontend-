import { api } from "./client";
import type {
  PMPVSessao, PMPVResultado,
  CGFResumo, AuditoriaResultado,
  ConciliaResultado, RETResultado,
  SCGPeriodo, PRResultado, SRResultado, DashboardData,
} from "../types";

// ─── DASHBOARD ───────────────────────────────────────────────────────────────
export const getDashboard = (periodo: string) =>
  api.get<DashboardData>(`/dashboard/${periodo}`).then((r) => r.data);

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
export const getSCGPeriodos = () =>
  api.get<SCGPeriodo[]>("/scg/periodos").then((r) => r.data);

export const calcularSCG = (periodo: string) =>
  api.post<SCGPeriodo>(`/scg/calcular/${periodo}`).then((r) => r.data);

export const salvarSCGManual = (payload: Partial<SCGPeriodo>) =>
  api.post<SCGPeriodo>("/scg/manual", payload).then((r) => r.data);

// ─── PR ──────────────────────────────────────────────────────────────────────
export const getPR = (periodo: string) =>
  api.get<PRResultado>(`/pr/${periodo}`).then((r) => r.data);

// ─── SR ──────────────────────────────────────────────────────────────────────
export const getSR = (periodo: string) =>
  api.get<SRResultado>(`/sr/${periodo}`).then((r) => r.data);
