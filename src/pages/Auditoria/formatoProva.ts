/** Formatos de exibição da prova real (só mostram números; não calculam o CGR). */
import { MENOS, brl, num } from "../../utils/format";
import type { ProvaRealAuditoria } from "../../types";

/** Espaço que não quebra linha: "R$ 101,38 mi" fica sempre junto. */
const NBSP = " ";

/** Valor negativo entre parênteses, como nas planilhas de contabilidade. */
export const contabil = (v: number) => (v < 0 ? `(${brl(-v)})` : brl(v));

/** Valor grande resumido com 2 casas: 101377948.44 → "R$ 101,38 mi". Abaixo de 1 milhão, valor cheio. */
export function brlResumido(v: number) {
  const abs = Math.abs(v);
  const sinal = v < 0 ? MENOS : "";
  if (abs >= 1_000_000_000) return `${sinal}R$${NBSP}${num(abs / 1_000_000_000, 2)}${NBSP}bi`;
  if (abs >= 1_000_000) return `${sinal}R$${NBSP}${num(abs / 1_000_000, 2)}${NBSP}mi`;
  return brl(v);
}

/** Fatia de cada empresa no CGR das notas do mês (0 a 1), para a barra e o "%". */
export function participacao(cgrEmpresa: number, d: ProvaRealAuditoria) {
  return d.cgr_das_notas > 0 ? Math.max(0, cgrEmpresa / d.cgr_das_notas) : 0;
}

/** Fatia em texto: 0.4523 → "45,2%". */
export const textoParticipacao = (fatia: number) => `${num(fatia * 100, 1)}%`;
