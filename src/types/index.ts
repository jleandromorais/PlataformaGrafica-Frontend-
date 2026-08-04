// ─── PMPV ────────────────────────────────────────────────────────────────────
export interface EmpresaLinha {
  empresa: string;
  molecula: number;
  transporte: number;
  logistica: number;
  volume: number;
}

export interface PMPVResultado {
  pmpv: number;
  preco_final: number;
  vp_mensal: number;
  vp_por_mes: Record<string, number>;
}

export interface PMPVSessao {
  trimestre: string;
  ano: number;
  meses: Record<string, EmpresaLinha[]>;
  conta_grafica: number;
  resultado?: PMPVResultado;
}

// ─── CGF ─────────────────────────────────────────────────────────────────────
export interface CGFResumo {
  periodo: string;
  volume_faturado: number;
  volume_cancelado: number;
  volume_final: number;
  cgf_rs: number;
}

// ─── AUDITORIA ───────────────────────────────────────────────────────────────
export interface AuditoriaItem {
  empresa: string;
  tipo: "NF-e" | "CT-e";
  numero: string;
  valor_total: number;
  icms: number;
  icms_taxa: number;
  pis: number;
  cofins: number;
  volume_total: number;
  cgr_liquido: number;
  metodo: string;
}

export interface AuditoriaResultado {
  cgr_liquido: number;
  valor_total_nfe: number;
  valor_total_cte: number;
  volume_total: number;
  itens: AuditoriaItem[];
  periodo: string;
}

// ─── CONCILIAÇÃO ─────────────────────────────────────────────────────────────
export interface ConciliaItem {
  arquivo: string;
  categoria: string;
  valor: number;
  status: string;
  metodo: string;
}

export interface ConciliaResultado {
  total_receita: number;
  total_despesa: number;
  saldo_rp: number;
  itens: ConciliaItem[];
  periodo: string;
}

// ─── RET ─────────────────────────────────────────────────────────────────────
export interface RETItem {
  tipo_encargo: string;
  empresa: string;
  nota_tipo: string;
  numero_nd: string;
  data_vencimento: string;
  valor_total: number;
  quantidade: number;
  valor_unitario: number;
  arquivo: string;
}

export interface RETResultado {
  eat_bruto: number;
  ret: number;
  pis_cofins_rate: number;
  itens: RETItem[];
  periodo: string;
}

// ─── SCG ─────────────────────────────────────────────────────────────────────
export interface SCGPeriodo {
  periodo: string;
  cgr: number;
  cgf: number;
  rpv: number;
  ret: number;
  rp: number;
  scg: number;
}

// ─── PV ──────────────────────────────────────────────────────────────────────
// PV = PMPV + PR. Ver Front_end/SPEC_PV.md.
export interface PVResultado {
  pmpv: number;
  pr: number;
  pv: number;
}

export interface PVPeriodo {
  periodo: string;
}

// ─── PR ──────────────────────────────────────────────────────────────────────
// PR = (SCG + ΣSR) / VP. Ver Front_end/SPEC_PR.md.
export interface PRResultado {
  periodo?: string;
  scg: number;
  sr: number;
  vp: number;
  pr: number;
}

export interface PRMesDecomposicao {
  periodo: string;
  scg: number;
  sr: number;
  vp: number;
  parcela_pr: number;
  vp_sem_dado: boolean;
}

export interface PRTrimestralResultado {
  scg: number;
  sr: number;
  vp: number;
  pr: number;
  meses: PRMesDecomposicao[];
  meses_sem_vp: string[];
}

export interface PRSrAnterior {
  periodo: string;
  sr: number;
}

// ─── SR ──────────────────────────────────────────────────────────────────────
// SR = (VP − VF) × PR × (1 + SELIC%) + SR anterior, calculado mês a mês
// dentro de um trimestre. Não usa CGR/CGF/RPV.
export interface SRSessaoPMPV {
  id: number;
  nome: string;
  data_criacao: string | null;
  vp: number;
  vf: number;
}

export interface SRLinhaEntrada {
  mes: string; // label "Jan/2026"
  vp: number;
  vf: number;
  pr: number;
  selic_mensal: number;
  sr_anterior: number;
}

export interface SRLinhaCalculada extends SRLinhaEntrada {
  diferenca: number;
  sr_parcela: number;
  sr_selic: number;
  total: number;
}

export interface SRTrimestreCalculo {
  linhas: SRLinhaCalculada[];
  total: number;
}

// ─── DASHBOARD ───────────────────────────────────────────────────────────────
// Modelo real: CGR/RET/CGF/RP/RPV/SCG mensais + PMPV (ver dashboard_resumo.py).
// Não confundir com PR/SR — esses módulos têm páginas próprias.
export interface KpiMensal {
  periodo: string;
  cgr: number;
  ret: number;
  cgf: number;
  rp: number;
  rpv: number;
  scg: number;
  variacao_scg_pct: number | null;
}

export interface SeriePonto {
  periodo: string;
  valor: number;
}

export interface DashboardResponse {
  ano_filtro: string | null;
  ultimo_mes: KpiMensal | null;
  historico: KpiMensal[];
  serie_pmpv: SeriePonto[];
  serie_scg: SeriePonto[];
}
