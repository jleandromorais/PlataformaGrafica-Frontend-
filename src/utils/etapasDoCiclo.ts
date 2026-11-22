/** A lista única de etapas do ciclo. Menu, cabeçalho das telas, Painel do Ciclo e "Como funciona"
 * leem daqui: ninguém mais numera nem ordena nada. Módulo puro (sem React nem react-router),
 * para poder ser testado. O estado de cada passo (pronto, falta, bloqueado) NÃO mora aqui:
 * continua no Painel e em `pages/Ciclo/proximoPasso.ts`. */

export type ChaveNumerada = "pmpv" | "auditoria" | "cgf" | "ret" | "rp" | "scg" | "sr" | "pr" | "pv";
export type ChaveEtapa = ChaveNumerada | "rpv" | "tarifa" | "entregas";

/** Chave da tela no menu (`MODULOS`). Escrita à mão porque o RP mora em "conciliacao". */
export type ModuloDaEtapa =
  | "pmpv" | "auditoria" | "cgf" | "ret" | "conciliacao" | "scg" | "sr" | "pr" | "pv" | "rpv" | "excel";

export type FaseDoCiclo = "Preparar" | "Processar a pasta" | "Trimestre" | "Fechar";
export const FASES_DO_CICLO: FaseDoCiclo[] = ["Preparar", "Processar a pasta", "Trimestre", "Fechar"];

export interface EtapaDoCiclo {
  chave: ChaveEtapa;
  /** 1 a 9 nos passos; null no que não é passo do analista (RPV, Tarifa média, Entregas). */
  numero: number | null;
  nome: string;
  sigla?: string;
  /** Tela da etapa (consulta ou trabalho). Os links do Painel acrescentam o período. */
  rota: string;
  tipo: "passo" | "automatico" | "fechar";
  /** Tela correspondente no menu; null quando a etapa não tem tela própria (Tarifa média fecha no PMPV). */
  modulo: ModuloDaEtapa | null;
  /** Onde o analista trabalha: no Painel do Ciclo ou na própria tela. */
  ondeSeTrabalha: "painel" | "tela";
  /** Tela de consulta cujo valor é lido e gravado pelo Painel (o cabeçalho diz "Ler e gravar no Painel"). */
  gravaNoPainel?: boolean;
  fase: FaseDoCiclo | null;
}

const e = (chave: ChaveEtapa, numero: number | null, nome: string, rota: string, tipo: EtapaDoCiclo["tipo"],
  modulo: ModuloDaEtapa | null, ondeSeTrabalha: EtapaDoCiclo["ondeSeTrabalha"], fase: FaseDoCiclo | null,
  extra: Partial<Pick<EtapaDoCiclo, "sigla" | "gravaNoPainel">> = {}): EtapaDoCiclo =>
  ({ chave, numero, nome, rota, tipo, modulo, ondeSeTrabalha, fase, ...extra });

export const ETAPAS_DO_CICLO: EtapaDoCiclo[] = [
  e("pmpv", 1, "PMPV dos meses apurados", "/pmpv", "passo", "pmpv", "tela", "Preparar", { sigla: "PMPV" }),
  e("auditoria", 2, "Auditoria CGR", "/auditoria", "passo", "auditoria", "painel", "Processar a pasta", { gravaNoPainel: true }),
  e("cgf", 3, "CGF", "/cgf", "passo", "cgf", "painel", "Processar a pasta", { sigla: "CGF", gravaNoPainel: true }),
  e("ret", 4, "RET", "/ret", "passo", "ret", "painel", "Processar a pasta", { sigla: "RET", gravaNoPainel: true }),
  e("rp", 5, "RP", "/conciliacao", "passo", "conciliacao", "painel", "Processar a pasta", { sigla: "RP", gravaNoPainel: true }),
  e("scg", 6, "SCG", "/scg", "passo", "scg", "tela", "Trimestre", { sigla: "SCG" }),
  e("sr", 7, "SR (Saldo Remanescente)", "/sr", "passo", "sr", "painel", "Trimestre", { sigla: "SR" }),
  e("pr", 8, "PR", "/pr", "passo", "pr", "tela", "Trimestre", { sigla: "PR" }),
  e("pv", 9, "PV", "/pv", "passo", "pv", "tela", "Trimestre", { sigla: "PV" }),
  e("rpv", null, "RPV", "/rpv", "automatico", "rpv", "tela", null, { sigla: "RPV" }),
  e("tarifa", null, "Tarifa média", "/pmpv", "fechar", null, "tela", "Fechar"),
  e("entregas", null, "Entregas (minuta da NT, relatório e Excel Final)", "/excel-final", "fechar", "excel", "painel", "Fechar"),
];

export const ETAPAS_NUMERADAS = ETAPAS_DO_CICLO.filter((x) => x.numero !== null);
export const TOTAL_DE_PASSOS = ETAPAS_NUMERADAS.length;

export const etapaDaChave = (chave: ChaveEtapa): EtapaDoCiclo => ETAPAS_DO_CICLO.find((x) => x.chave === chave)!;
export const numeroDaEtapa = (chave: ChaveEtapa) => etapaDaChave(chave).numero;
export const rotaDaEtapa = (chave: ChaveEtapa) => etapaDaChave(chave).rota;

/** Etapa de uma tela do menu (a chave de `MODULOS`); undefined em Painel, Como funciona e Visão geral. */
export const etapaDoModulo = (modulo: string): EtapaDoCiclo | undefined => ETAPAS_DO_CICLO.find((x) => x.modulo === modulo);
export const numeroDoModulo = (modulo: string): number | null => etapaDoModulo(modulo)?.numero ?? null;

/** Etiqueta do cabeçalho: "Passo 4 de 9", "Calculado sozinho" ou "Entrega". */
export function rotuloDaEtapa(chave: ChaveEtapa): string {
  const x = etapaDaChave(chave);
  if (x.numero !== null) return `Passo ${x.numero} de ${TOTAL_DE_PASSOS}`;
  return x.tipo === "automatico" ? "Calculado sozinho" : x.chave === "entregas" ? "Entrega" : "Fechamento";
}
