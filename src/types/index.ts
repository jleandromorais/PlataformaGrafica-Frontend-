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

// ─── PR ──────────────────────────────────────────────────────────────────────
export interface PRResultado {
  periodo: string;
  saldo_a_recuperar: number;
  volume_prospectivo: number;
  parcela_recuperacao: number;
}

// ─── SR ──────────────────────────────────────────────────────────────────────
export interface SRResultado {
  periodo: string;
  sr_por_mes: { mes: string; valor: number }[];
  sr_total: number;
}

// ─── DASHBOARD ───────────────────────────────────────────────────────────────
export interface DashboardData {
  periodo_apuracao: string;
  periodo_recuperacao: string;
  versao_cg: string;
  saldo_a_recuperar: number;
  saldo_cg_atualizado: number;
  saldo_remanescente: number;
  scg: number;
  rpv: number;
  ret: number;
  rp: number;
  sr_total: number;
  sr_por_mes: { mes: string; valor: number }[];
  parcela_recuperacao: number;
  volume_prospectivo: number;
  historico_parcela: { periodo: string; valor: number }[];
}
