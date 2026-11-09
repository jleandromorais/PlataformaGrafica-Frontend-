/** Busca a prova real do mês escolhido (GET /auditoria/prova-real) para a página toda:
 * KPIs, fórmula preenchida e card da prova real usam a mesma resposta. A lógica anti-corrida
 * é a de components/ui/useProvaRealDoMes (a mesma das telas CGF e RPV). */
import { getProvaRealAuditoria } from "../../api";
import { useProvaRealDoMes, type EstadoProva } from "../../components/ui/useProvaRealDoMes";
import type { ProvaRealAuditoria } from "../../types";

export type EstadoProvaReal = EstadoProva<ProvaRealAuditoria>;

export function useProvaReal(periodo: string | null): EstadoProvaReal {
  return useProvaRealDoMes(periodo, getProvaRealAuditoria);
}
