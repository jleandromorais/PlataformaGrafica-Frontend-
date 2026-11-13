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
  /** Margem regulatória do ano (R$/m³). Quando vem, o back devolve também a tarifa média. */
  margem_regulatoria?: number | null;
}

/** Margem regulatória de um ano: a salva pelo analista vale mais que o padrão do sistema. */
export interface PMPVMargem {
  ano: number;
  margem: number | null;
  origem: "salva" | "padrao" | "ausente";
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
  /** Só vêm quando o cálculo foi pedido com margem. Não vão para a sessão salva. */
  margem_regulatoria?: number;
  tarifa_media?: number;      // = preco_final (PV) + margem, calculada no back
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

/** GET /pmpv/sessao-do-trimestre: o que já foi salvo para os 3 meses (a tela preenche a tabela com isto). */
export interface PMPVSessaoDoTrimestre {
  encontrada: boolean;
  sessao_id: number | null;
  nome: string | null;
  data_criacao: string | null; // "21/10/2026 14:30"
  pmpv: number | null;
  conta_grafica: number | null;
  preco_final: number | null;
  meses: Record<string, EmpresaLinha[]>; // "Mai/2026" → empresas; `volume` = QDC (m³/dia)
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
  erros?: string[];           // frases de erro do back (etapa, mês, valores); vazio = tudo certo
  periodo: string;
  pmpv: number;               // 0 quando não há PMPV
  pmpv_origem: "manual" | "banco" | "ausente";
  volume_final: number;
  cgf_rs: number | null;      // null sem PMPV
}

/** Problema num arquivo enviado (CGF, Auditoria). Ver docs/specs/SPEC_ERROS.md §3. */
export interface ProblemaArquivo {
  arquivo: string;                       // nome ou caminho relativo; "" quando é do envio como um todo
  empresa?: string | null;               // Auditoria
  gravidade: "erro" | "aviso" | "info";
  codigo: string;                        // estável: ex. "tipo_nao_reconhecido", "coluna_ausente"
  mensagem: string;
  tecnico?: string | null;               // ex.: "colunas encontradas: Data, Produto"
}

export interface CGFProcessarResponse extends CGFVolumes {
  erros?: string[];           // frases de erro do back (etapa, mês, valores); vazio = tudo certo
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
  // Modelo Alexandre: comparação valor a valor
  modelo: string;                       // "alexandre" | "apuracao" | "nt" | "generico"
  modelo_rotulo: string;                // nome para mostrar
  tipo: "por_nota" | "por_supridor" | "generico";   // define o layout da tela
  fontes_cgr: { rotulo: string; valor: number | null }[];   // CGR da planilha, a comparar com o das notas
  notas_mes_na_planilha: boolean;
  cgr_auditoria: number | null;
  cgr_planilha_notas: number | null;
  cgr_planilha_conta_grafica: number | null;
  divergencias_valor: AuditoriaDivergencia[];
  por_empresa: AuditoriaConferenciaEmpresa[];
}

export interface AuditoriaDivergencia {
  empresa: string;
  tipo: string;
  numero: string;
  linha_excel: number;
  motivos: string[];
  cgr_auditoria: number;
  cgr_planilha: number;
  diferenca_cgr: number;
  valor_auditoria: number;
  valor_planilha: number;
  volume_auditoria: number;
  volume_planilha: number;
  aliquota_auditoria: string;
  aliquota_planilha: string;
  explicacao?: string;   // o que diverge, com os dois lados
}

export interface AuditoriaConferenciaEmpresa {
  empresa: string;
  qtd_auditoria: number;
  qtd_planilha: number;
  cgr_auditoria: number;
  cgr_planilha: number;
  diferenca: number;
  confere: boolean;
  // Modelo NT: comparação por supridor, com o porquê de cada diferença
  volume_auditoria?: number;
  volume_planilha?: number;
  diferenca_volume?: number;
  explicacoes?: string[];
}

export interface AuditoriaResultado {
  erros?: string[];           // frases de erro do back (etapa, mês, valores); vazio = tudo certo
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

/** Onde o processado difere das notas gravadas no mês (POST /auditoria/diferencas). */
export interface AuditoriaDiferencas {
  erros?: string[];           // frases de erro do back (etapa, mês, valores); vazio = tudo certo
  tem_notas_gravadas: boolean;
  cgr_gravado_notas: number;
  cgr_processado: number;
  diferenca: number;
  por_empresa: { empresa: string; gravado: number; processado: number; diferenca: number }[];
  notas: {
    empresa: string; tipo: string; numero: string;
    situacao: "so_no_gravado" | "so_no_processado" | "valor_diferente";
    gravado: number; processado: number; diferenca: number; ocr: boolean;
  }[];
  qtd_notas_diferentes: number;
  resumo: string[];
}

export interface AuditoriaHistoricoLinha {
  periodo: string;
  qtd_notas: number;
  cgr_gravado: number;
  data_atualizacao: string;
  periodo_valido: boolean;
}

/** Uma empresa na prova real do CGR (GET /auditoria/prova-real). */
export interface ProvaRealEmpresa {
  empresa: string;
  qtd_nfe: number;
  qtd_cte: number;
  qtd_devolucoes: number;
  compras: number;            // CGR das notas de compra (positivo)
  devolucoes: number;         // CGR das devoluções (negativo)
  frete_fora_do_cgr: number;  // valor dos CT-e de frete comum (não entra)
  cgr: number;                // compras + devoluções
}

/** A conta do CGR gravado de um mês, aberta por empresa, com o selo "confere". */
/** Aviso "Possível duplicata": notas do mesmo grupo com o mesmo valor (prova real de RP, RET e Auditoria). */
export interface PossivelDuplicataValor {
  grupo: string;      // "Receita", "EAT · Empresa X", "NF-e · Empresa Y"
  valor: number;      // o valor que se repete
  qtd: number;
  notas: string[];    // nome/número de cada nota
  ids?: number[];     // id gravado de cada nota (mesma ordem de `notas`): é o que "Tirar do cálculo" envia
}

export interface ProvaRealAuditoria {
  erros?: string[];           // frases de erro do back (etapa, mês, valores); vazio = tudo certo
  periodo: string;
  qtd_notas: number;
  por_empresa: ProvaRealEmpresa[];
  compras: number;
  devolucoes: number;
  frete_fora_do_cgr: number;
  cgr_das_notas: number;
  cgr_gravado: number | null;
  diferenca: number | null;
  confere: boolean;
  possiveis_duplicatas_valor?: PossivelDuplicataValor[];
  notas_digitadas?: NotaDigitadaAuditoria[];   // back antigo não manda
  data_atualizacao: string;
}

/** Nota incluída à mão a partir da planilha ("Incluir esta nota"), gravada no mês com o motivo. */
export interface NotaDigitadaAuditoria {
  id: number;
  empresa: string;
  tipo: string;
  numero: string;
  cgr_liquido: number;
  motivo: string;
}

/** Nota que está na planilha e não veio nos arquivos (item de `notas_apenas_planilha`).
 * Só o modelo "por_nota" traz `cgr_planilha`; nos outros, a nota não pode ser incluída. */
export interface NotaSoNaPlanilha {
  empresa?: string;
  supridor?: string;
  numero?: string;
  numero_normalizado?: string;
  linha_excel?: number;
  periodo_linha?: string;
  cgr_planilha?: number;
  valor_planilha?: number;
  dados_linha?: Record<string, unknown>;
}

/** PV gravado de um trimestre fiscal: uma linha do histórico da tela PV (GET /pv/historico). */
export interface PVHistoricoTrimestre {
  chave: string;      // "Fev - Abr/2026"
  trimestre: string;  // "Fev - Abr"
  ano: number;        // ano do 1º mês
  pmpv: number; pr: number; pv: number;
  data_atualizacao: string;
}

/** A conta do PV gravado do trimestre e se ele ainda bate com os módulos (GET /pv/prova-real). */
export interface ProvaRealPV {
  chave: string;
  periodos: string[];
  tem_salvo: boolean;               // false: o trimestre ainda não tem PV gravado
  pmpv_gravado: number | null; pr_gravado: number | null; pv_gravado: number | null;
  pv_da_soma: number | null;        // PMPV gravado + PR gravado
  diferenca_conta: number | null;
  conta_confere: boolean;           // PV gravado = PMPV gravado + PR gravado
  pmpv_atual: number; pr_atual: number; pv_atual: number;   // os dos módulos hoje
  pmpv_confere: boolean;            // o PMPV gravado no PV é o de hoje
  pr_confere: boolean;              // o PR gravado no PV é o de hoje
  confere: boolean;
  data_atualizacao: string;
  avisos: string[];
}

/** Uma empresa na prova real do PMPV: preço = molécula + transporte + logística. */
export interface ProvaRealEmpresaPMPV {
  empresa: string; molecula: number; transporte: number; logistica: number;
  preco: number;   // R$/m³
  volume: number;  // m³
  custo: number;   // preço × volume (R$)
}

export interface ProvaRealMesPMPV {
  mes: number;     // 1, 2 ou 3 do trimestre
  empresas: ProvaRealEmpresaPMPV[];
  volume: number; custo: number; pmpv_do_mes: number;
}

/** A conta do PMPV de uma sessão salva, refeita com as linhas gravadas (GET /pmpv/prova-real). */
export interface ProvaRealPMPV {
  sessao_id: number; nome: string; data_criacao: string | null;
  tem_linhas: boolean;       // false: sessão sem linhas com volume
  tem_resultado: boolean;    // false: sessão sem resultado gravado
  meses: ProvaRealMesPMPV[];
  custo_total_calculado: number | null; custo_total_gravado: number | null; diferenca_custo: number | null;
  volume_total: number | null; vp_gravado: number | null; diferenca_vp: number | null;   // Σ volume = VP da sessão
  pmpv_calculado: number | null; pmpv_gravado: number | null; diferenca_pmpv: number | null; // Σ(preço×volume) ÷ Σ volume
  conta_grafica: number | null;       // a gravada (vem do PR); não é recalculada
  preco_final_calculado: number | null; preco_final_gravado: number | null; diferenca_preco_final: number | null;
  confere: boolean;
}

/** A conta do CGF gravado de um mês, aberta (GET /cgf/prova-real). */
export interface ProvaRealCGF {
  erros?: string[];           // frases de erro do back (etapa, mês, valores); vazio = tudo certo
  periodo: string;
  tem_resumo: boolean;                // false: mês gravado só com o total, sem o resumo de volumes
  volume_faturado: number;
  volume_canceladas: number;          // informativo: não entra no volume final
  volume_devolucoes: number;
  volume_consumo_proprio: number;     // informativo: já retirado do faturado
  volume_final_calculado: number;     // faturado − devoluções
  volume_final_gravado: number | null;
  diferenca_volume: number | null;
  volume_confere: boolean;
  pmpv: number | null;                // PMPV do mês (R$/m³); null sem PMPV gravado
  cgf_calculado: number | null;       // volume final × PMPV
  cgf_gravado: number | null;
  diferenca_cgf: number | null;
  cgf_confere: boolean;
  confere: boolean;                   // volume e CGF conferem
  data_atualizacao: string;
}

/** A conta do RPV gravado de um mês e de onde vêm CGR e CGF (GET /rpv/prova-real). */
export interface ProvaRealRPV {
  erros?: string[];           // frases de erro do back (etapa, mês, valores); vazio = tudo certo
  periodo: string;
  gravado: boolean;                   // false: nada gravado neste mês
  cgr: number;
  cgf: number;
  rpv_calculado: number;              // CGR − CGF
  rpv_gravado: number | null;
  diferenca: number | null;
  confere: boolean;
  origem_cgr: { tem_notas: boolean; valor_das_notas: number | null; confere: boolean };
  origem_cgf: { tem_resumo: boolean; valor_calculado: number | null; confere: boolean };
  data_atualizacao: string;
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
  ocr_disponivel: boolean;   // false: PDF de imagem não é lido neste computador
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
  ocr_disponivel: boolean;   // false: PDF de imagem não é lido neste computador
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

/** PR e PV do trimestre regravados pelo backend ao salvar o SCG ou o SR. */
export interface PRAutomatico {
  meses_pr: string[];
  atualizado: boolean;      // false = nada gravado; ver `pendencias`
  pr_antes: number | null;
  pr: number | null;
  pv_antes: number | null;
  pv: number | null;
  pendencias: string[];
}

/** PV de um trimestre do ciclo regravado pelo backend ao salvar o PMPV ou o PR. */
export interface PVAutomatico {
  trimestre: string;        // "Nov - Jan/2026" (ano do 1º mês); "" se deu erro inesperado
  atualizado: boolean;      // false = nada gravado; ver `pendencias`
  pv_antes: number | null;
  pv: number | null;
  pendencias: string[];
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
// PV = PMPV + PR. Ver docs/specs/SPEC_PV.md.
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
// PR = (SCG + ΣSR) / VP. Ver docs/specs/SPEC_PR.md.
export interface PRResultado {
  periodo?: string;
  scg: number;
  sr: number;
  vp: number;
  pr: number;
}

/** PR da Nota Técnica (POST /pr/apurar): SCG e SR com SELIC do trimestre
 * civil apurado ÷ VP do trimestre do PR, arredondado a 4 casas. */
export interface PRApuracaoMes {
  periodo: string;
  scg: number;
  selic: number; // % acumulada até o fim do trimestre (a mesma do SR)
  scg_selic: number;
  sr: number; // SR do mês já com SELIC
}

export interface PRApuracao {
  meses_pr: string[];
  meses_apurados: string[];
  meses: PRApuracaoMes[];
  vps: number[];
  scg_selic: number;
  sr: number;
  saldo_total: number;
  vp: number;
  pr: number;
  pmpv: number;
  pv: number;
  pendencias: string[];
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

export type SROrigemPR = "salvo" | "estimado" | "ausente";

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

/** SELIC acumulada de cada mês até o fim do trimestre civil, do Banco Central. */
export interface SRSelic {
  disponivel: boolean; // false: o trimestre ainda não fechou
  valores: Record<string, number>; // {"Jan/2026": 3.411174, ...}
  fecha_em: string; // aaaa-mm-dd
  fonte: string;
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
  /** As mesmas contas mês a mês, em ordem cronológica (back antigo não manda). */
  meses?: { periodo: string; empresas: DashEmpresa[] }[];
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

// ─── SR NO PAINEL DO CICLO (proposta: POST /sr/trimestre/proposta) ──────────
/** Aviso de um mês da proposta. Códigos: sem_vp, pr_ausente, pr_estimado, vf_ausente,
 * selic_indisponivel, selic_zero_gravada, difere_gravado. */
export interface SRPropostaAlerta {
  codigo: string;
  mensagem: string;
}

/** O que está gravado hoje para o mês (null na linha quando ainda não há SR gravado). */
export interface SRPropostaGravado {
  vp: number; vf: number; pr: number; selic_mensal: number; sr_selic: number; sr_anterior: number;
}

export interface SRPropostaLinha {
  mes: string;                               // "Jan/2026"
  vp: number; vf: number; pr: number;
  pr_origem: "salvo" | "estimado" | "ausente";
  pr_chave: string;                          // trimestre do PR usado, ex.: "Ago - Out/2025"
  selic_mensal: number; sr_anterior: number;
  diferenca: number; sr_parcela: number; sr_selic: number; total: number;
  gravado: SRPropostaGravado | null;
  alertas: SRPropostaAlerta[];
}

export interface SRProposta {
  labels_meses: string[];
  linhas: SRPropostaLinha[];
  total: number;
  total_gravado: number | null;
  diferenca_total: number | null;
  selic: { disponivel: boolean; fecha_em: string; fonte: string; mensagem: string };
  bloqueios: string[];                       // o que impede de gravar (lista vazia: pode gravar)
  pode_gravar: boolean;
}

// ─── RET: PROVA REAL (GET /ret/prova-real) ──────────────────────────────────
/** Uma empresa na prova real do RET, por tipo de encargo. */
export interface ProvaRealEmpresaRET {
  empresa: string;
  tipo_encargo: "EAT" | "EC";
  qtd: number;
  valor: number;
}

/** A conta do RET gravado de um mês, refeita com os documentos gravados: EAT × (1 − PIS/COFINS) + EC. */
export interface ProvaRealRET {
  erros?: string[];           // frases de erro do back (etapa, mês, valores); vazio = tudo certo
  periodo: string;
  tem_itens: boolean;          // false: mês gravado só com o total, sem os documentos
  qtd_documentos: number;
  qtd_eat: number;
  qtd_ec: number;
  qtd_outros: number;          // documentos de outras pastas (penalidades, TOP, outros): ficam fora do RET
  eat_bruto: number;
  pis_cofins_rate: number;     // 0.0925
  eat_liquido: number;
  ec: number;
  ret_calculado: number | null;
  ret_gravado: number | null;
  diferenca: number | null;
  confere: boolean;
  por_empresa: ProvaRealEmpresaRET[];
  possiveis_duplicatas_valor?: PossivelDuplicataValor[];
  data_atualizacao: string;
}

// ─── RP: PROVA REAL (GET /conciliacao/prova-real) ───────────────────────────
/** Uma nota de penalidade na prova real do RP. `liquido` já tem o desconto do PIS/COFINS. */
export interface ProvaRealItemRP {
  arquivo: string;
  nome: string;                                  // nome curto da nota
  lado: "receita" | "despesa" | "ja_no_ret";     // "ja_no_ret": já contada no RET, vale 0 no RP
  tipo: "PFP" | "TOP" | "OUTRA";
  numero: string;
  valor: number;
  liquido: number;
  status: string;
  repetida: boolean;                             // o mesmo número aparece mais de uma vez no mês
  possivel_duplicata?: boolean;                  // está num grupo de notas com o mesmo valor
}

/** Uma nota que aparece mais de uma vez no mês (provável versão original + atualizada). */
export interface ProvaRealDuplicadaRP {
  tipo: string;
  numero: string;
  qtd: number;
  valor_total: number;
  liquido_total: number;
  arquivos: string[];
}

/** A conta do RP gravado de um mês, refeita com as notas gravadas: (despesas − receitas) × (1 − PIS/COFINS). */
export interface ProvaRealRP {
  erros?: string[];           // frases de erro do back (etapa, mês, valores); vazio = tudo certo
  periodo: string;
  tem_itens: boolean;            // false: mês gravado só com o total, sem as notas
  qtd_itens: number;
  taxa: number;                  // 0.0925
  receitas: { qtd: number; bruto: number; liquido: number };
  despesas: { qtd: number; bruto: number; liquido: number };
  ja_no_ret: { qtd: number; bruto: number };
  rp_calculado: number | null;
  rp_gravado: number | null;
  diferenca: number | null;
  confere: boolean;
  itens: ProvaRealItemRP[];      // do maior valor ao menor
  possiveis_duplicadas: ProvaRealDuplicadaRP[];
  possiveis_duplicatas_valor?: PossivelDuplicataValor[];
  data_atualizacao: string;
}

// ─── SCG: PROVA REAL (GET /scg/prova-real) ──────────────────────────────────
/** A conta do SCG gravado de um mês (CGR − CGF = RPV; RPV + RET + RP = SCG) e de onde vêm os 4 valores. */
export interface ProvaRealSCG {
  periodo: string;
  gravado: boolean;
  cgr: number; cgf: number; rpv: number; ret: number; rp: number;
  rpv_calculado: number;
  scg_calculado: number;
  scg_gravado: number | null;
  diferenca: number | null;
  confere: boolean;
  origens: {
    cgr: { tem_itens: boolean; valor_das_notas: number | null; confere: boolean };
    cgf: { tem_resumo: boolean; valor_calculado: number | null; confere: boolean };
    ret: { tem_itens: boolean; valor_calculado: number | null; confere: boolean };
    rp: { tem_itens: boolean; valor_calculado: number | null; confere: boolean };
  };
  data_atualizacao: string;
}

// ─── SR: HISTÓRICO E PROVA REAL (GET /sr/historico, GET /sr/prova-real) ─────
/** Um trimestre com SR gravado. `trimestre` é a chave, ex.: "Jan/2026_Mar/2026". */
export interface SRHistoricoTrimestre {
  trimestre: string;
  labels_meses: string[];
  total: number;
  qtd_meses: number;
  data_atualizacao: string;
}

/** O que as fontes (PMPV, CGF, módulo PR, Banco Central) dão hoje para um mês, e o que difere do gravado. */
export interface ProvaRealFontesSR {
  vp: number; vf: number; pr: number;
  selic_mensal: number | null;   // null: o Banco Central não deu a SELIC (fora do ar ou trimestre aberto)
  diferem: string[];   // nomes dos campos que diferem: "vp", "vf", "pr", "selic_mensal"
}

export interface ProvaRealLinhaSR {
  mes: string;
  vp: number; vf: number; pr: number; selic_mensal: number; sr_anterior: number;
  diferenca: number; sr_parcela: number;
  sr_selic_recalculado: number;
  sr_selic_gravado: number;
  conta_confere: boolean;
  fontes: ProvaRealFontesSR | null;   // null: fontes indisponíveis
}

export interface ProvaRealSR {
  trimestre: string;
  labels_meses: string[];
  gravado: boolean;
  linhas: ProvaRealLinhaSR[];
  total_gravado: number;
  total_recalculado: number;
  conta_confere: boolean;
  fontes_disponiveis: boolean;
  alertas: { codigo: string; mensagem: string }[];
  data_atualizacao: string;
}
