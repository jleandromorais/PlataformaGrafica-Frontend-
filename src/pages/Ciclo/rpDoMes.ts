/** Cartão do RP no Painel do Ciclo: o valor gravado de cada mês e o ⚠ quando ele não é confiável.
 * O histórico do RP (GET /conciliacao/historico) só traz mês que tem itens de penalidade, e devolve 0 também
 * quando o RP nem foi gravado. Então um RP 0 no Painel sempre tem penalidade a conciliar: é suspeito, nunca um
 * "R$ 0,00" normal. Não recalcula nada: só lê o que veio. Sem JSX, para testar. */
import type { ConciliaHistoricoLinha } from "../../types";
import { brl } from "../../utils/format";

/** A mesma tolerância do back (TOL_RP_ITENS em servicos_ciclo.py). */
const TOL_RP_ITENS = 1;

const zerado = (l: ConciliaHistoricoLinha) => Math.abs(l.rp_gravado) < 0.005;
const itens = (qtd: number) => (qtd === 1 ? "1 item" : `${qtd} itens`);

/** Texto do valor no chip do mês: o zero suspeito vem escrito, não só na cor. */
export function valorDoRP(l: ConciliaHistoricoLinha): string {
  return zerado(l) ? `${brl(0)}, gravado zerado` : brl(l.rp_gravado);
}

/** Motivo do ⚠ do mês (o mesmo texto do back), ou null quando o RP gravado é confiável. */
export function alertaDoRP(l: ConciliaHistoricoLinha): string | null {
  if (zerado(l)) return `RP gravado zerado com ${itens(l.qtd_itens)} de penalidade a conciliar: confira o RP.`;
  return Math.abs(l.rp_dos_itens - l.rp_gravado) > TOL_RP_ITENS ? "O RP gravado difere da soma dos itens." : null;
}
