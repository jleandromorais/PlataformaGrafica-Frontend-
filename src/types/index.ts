// ─── PMPV ────────────────────────────────────────────────────────────────────
/** Linha de uma empresa no PMPV. `volume` é o QDC em m³/dia (como no
 * desktop); o volume do mês é QDC × dias, calculado pelo backend. */
export interface EmpresaLinha {
  empresa: string;
  molecula: number;
  transporte: number;
  logistica: number;
  volume: number;
}

/** Entrada do cálculo — mesmo formato que tela_pmpv.py envia a RegrasPMPV. */
export interface PMPVLinhaCalculo extends EmpresaLinha {
  campos_vazios: string[];
}

export interface PMPVCalculoRequest {
  dados_extraidos: Record<string, PMPVLinhaCalculo[]>; // "Mês 1" | "Mês 2" | "Mês 3"
  valor_cg: number;
  dias_config: Record<string, number>;
  lista_meses: string[];
  idx_start: number;
}

export interface PMPVResultado {
  pmpv: number;
  preco_final: number;
  conta_grafica: number;
  volume_total: number;
  custo_total: number;
  vp_mensal: number;
  vp_por_mes: Record<string, number>; // chave = nome do mês ("Fevereiro")
  vf_total: number;
  avisos: string[];
}

export interface PMPVSalvarRequest {
  nome: string;
  dados_por_mes: Record<string, EmpresaLinha[]>; // chave = nome do mês
  resultado: PMPVResultado;
  periodos: string[];
}

export interface PMPVImportarResponse {
  meses: Record<string, EmpresaLinha[]>; // chave = período ("Fev/2026")
  erros: string[];
  meses_encontrados?: string[]; // meses que a planilha tem, ex.: ["Nov/2025", "Dez/2025", "Jan/2026"]
}

export interface PMPVHistoricoLinha {
  id: number;
  nome: string;
  data_criacao: string | null; // "21/10/2026 14:30"
  pmpv: number;
  conta_grafica: number;
  preco_final: number;
  vp: number;
}

// ─── RPV ─────────────────────────────────────────────────────────────────────
export interface RPVValores {
  cgr: number;
  cgf: number;
  rpv: number;
}

export interface RPVHistoricoLinha extends RPVValores {
  periodo: string;
  data_atualizacao: string;
}

// ─── CGF ─────────────────────────────────────────────────────────────────────
export interface CGFVolumes {
  volume_faturado: number;        // já sem consumo próprio
  volume_canceladas: number;      // informativo: não entra no volume final
  volume_devolucoes: number;
  volume_consumo_proprio: number; // informativo: já retirado do faturado
  volume_final: number;           // faturado − devoluções
}

export interface CGFCalcularRsResponse {
  periodo: string;
  pmpv: number;               // 0 quando não há PMPV
  pmpv_origem: "manual" | "banco" | "ausente";
  volume_final: number;
  cgf_rs: number | null;      // null sem PMPV
}

/** Problema num arquivo enviado (CGF, Auditoria). Ver SPEC_ERROS.md §3. */
export interface ProblemaArquivo {
  arquivo: string;                       // nome ou caminho relativo; "" quando é do envio como um todo
  empresa?: string | null;               // Auditoria
  gravidade: "erro" | "aviso" | "info";
  codigo: string;                        // estável: ex. "tipo_nao_reconhecido", "coluna_ausente"
  mensagem: string;
  tecnico?: string | null;               // ex.: "colunas encontradas: Data, Produto"
}

export interface CGFProcessarResponse extends CGFVolumes {
  periodo_detectado: string;
  arquivos_ignorados: string[];
  problemas: ProblemaArquivo[];
  logs: string[];
}

export interface CGFHistoricoLinha extends CGFVolumes {
  periodo: string;
  cgf_rs: number;
  data_atualizacao: string;
  periodo_valido: boolean;
}

/** Colunas das planilhas de NF (mesmos padrões da tela desktop). */
export interface CGFColunas {
  col_fat_volume: string;
  col_fat_consumo: string;
  val_fat_consumo: string;
  col_canc_volume: string;
  col_dev_volume: string;
}

// ─── AUDITORIA ───────────────────────────────────────────────────────────────
export interface AuditoriaItem {
  empresa: string;
  tipo: "NF-e" | "CT-e" | string;
  numero: string;
  valor_total: number;
  icms: number;        // R$
  icms_taxa: number;   // decimal (0.12 = 12%)
  pis: number;
  cofins: number;
  volume: number;
  status: string;      // "OK" (XML) | "OCR" (PDF)
  volume_total: number;
  caminho: string;     // relativo à pasta enviada — define se é devolução
  cgr_liquido: number; // negativo nas devoluções
  integra_cgr: boolean;
  devolucao: boolean;
}

export interface AuditoriaEmpresa {
  empresa: string;
  qtd_nfe: number;
  qtd_cte: number;
  valor_total: number;
  cgr_liquido: number;
  frete_fora_do_cgr: number;
}

export interface AuditoriaComparacao {
  periodo: string;
  qtd_em_ambas: number;
  notas_apenas_auditoria: Record<string, unknown>[];
  notas_apenas_planilha: Record<string, unknown>[];
  abas_planilha: string[];
  abas_do_periodo: string[];
  avisos: string[];
}

export interface AuditoriaResultado {
  periodo_detectado: string;
  qtd_xml_lidos: number;
  qtd_pdf_lidos: number;
  itens: AuditoriaItem[];
  totais: {
    qtd_nfe: number;
    qtd_cte: number;
    qtd_devolucoes: number;
    valor_total_geral: number;
    icms_cgr: number;
    cgr_liquido: number;
    por_empresa: AuditoriaEmpresa[];
  };
  comparacao: AuditoriaComparacao | null;
  aviso_comparacao: string;
  problemas: ProblemaArquivo[];
}

export interface AuditoriaHistoricoLinha {
  periodo: string;
  qtd_notas: number;
  cgr_gravado: number;
  data_atualizacao: string;
  periodo_valido: boolean;
}

// ─── CONCILIAÇÃO (RP) ────────────────────────────────────────────────────────
export interface ConciliaItem {
  arquivo: string;
  caminho: string;
  categoria: "Receita" | "Despesa" | string;
  valor: number;     // negativo nas notas "cancelado"
  status: string;    // "OK" | "REVISAR" | "ERRO"
  metodo: string;
}

export interface ConciliaResultado {
  itens: ConciliaItem[];
  totais: { total_receitas: number; total_despesas: number; rp: number; qtd_revisar: number };
  logs: string[];
}

export interface ConciliaHistoricoLinha {
  periodo: string;
  qtd_itens: number;
  total_receitas: number;
  total_despesas: number;
  rp_dos_itens: number;
  rp_gravado: number;
  data_atualizacao: string;
  periodo_valido: boolean;
}

// ─── RET ─────────────────────────────────────────────────────────────────────
/** Um PDF de encargo lido pelo backend (RegrasRET). Campos extras do extrator passam adiante. */
export interface RETDocumento {
  arquivo: string;
  caminho: string;        // relativo à pasta enviada: define EAT/EC e o mês
  tipo_encargo: string;   // "EAT" | "EC" | "Penalidades…" | "TOP" | "Outros"
  empresa: string;
  nota_tipo: string;
  numero_nd: string;
  data_vencimento: string;
  valor_total: number;
  mes_ref: string;
  valores_encontrados: unknown[];
  [extra: string]: unknown;
}

export interface RETMes {
  periodo: string;
  qtd_documentos: number;
  eat_bruto: number;
  ec_docs_total: number;
  ret: number;
  qtd_outros: number;
}

export interface RETResultado {
  periodo_detectado: string;
  qtd_lidos: number;
  qtd_ignorados: number;
  pis_cofins_rate: number;
  meses: RETMes[];
  documentos: RETDocumento[];
}

export interface RETHistoricoLinha {
  periodo: string;
  qtd_documentos: number;
  ret_gravado: number;
  data_atualizacao: string;
  periodo_valido: boolean;
}

// ─── SCG ─────────────────────────────────────────────────────────────────────
export interface SCGValores {
  cgr: number;
  cgf: number;
  rpv: number;
  ret: number;
  rp: number;
  scg: number;
}

export interface SCGPeriodo extends SCGValores {
  periodo: string;
}

/** Os dois lados que podem divergir num mês: recalculado dos itens dos
 * módulos × gravado na consolidação (o que o Excel Final usa). */
export interface SCGComparacao {
  periodo: string;
  modulos: SCGValores;
  gravado: SCGValores | null;
}

export interface SCGHistoricoLinha extends SCGPeriodo {
  diverge: boolean;
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

export interface PVTrimestre {
  chave: string; // "Fev - Abr/2026"
  periodos: string[]; // ["Fev/2026", "Mar/2026", "Abr/2026"]
  pmpv: number; // valores atuais dos módulos PMPV e PR
  pr: number;
  pv: number;
  salvo: { pmpv: number; pr: number; pv: number; data: string } | null; // PV já gravado
  avisos: string[];
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
  completo: boolean;      // tem CGR e CGF
  pendencias: string[];   // o que falta lançar no mês
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

// ─── Dashboard: painéis extras ───────────────────────────────────────────────
export interface DashEmpresa {
  empresa: string;
  notas: number;
  nfe: number;
  cte: number;
  valor_total: number;
  icms: number;
  pis_cofins: number;
  cgr_liquido: number;
}
export interface DashEmpresasResponse {
  ano_filtro: string | null;
  empresas: DashEmpresa[];
  total_cgr_liquido: number;
}
export interface DashRetMes {
  periodo: string;
  total: number;
  por_tipo: Record<string, number>;
}
export interface DashRetResponse {
  ano_filtro: string | null;
  tipos: string[];
  meses: DashRetMes[];
  total: number;
}
export interface DashVolumeMes {
  periodo: string;
  volume_faturado: number;
  volume_devolucoes: number;
  volume_canceladas: number;
  volume_consumo_proprio: number;
  volume_final: number;
}
export interface DashVolumesResponse {
  ano_filtro: string | null;
  meses: DashVolumeMes[];
  totais: DashVolumeMes;
}
