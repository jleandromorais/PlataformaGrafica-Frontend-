/** Aprovação da cascata (SR, PR e PV à frente) num lugar só: o bloco "Aguardando sua aprovação" do Painel.
 * As telas que gravam não mostram mais a prévia: mostram uma linha com o link daqui. Módulo puro.
 * Spec: docs/specs/SPEC_FLUXO_UNICO.md, seção 4 (Decisão B). */
import type { Cascata } from "../types";
import { ROTA_INICIAL } from "../router/rotas";
import { MESES_ABREV, deslocaPeriodo, lerPeriodo, trimestreFiscalDoMes } from "./periodos";

/** Id do bloco no Painel: os botões "Revisar e aprovar" rolam até ele. */
export const ID_APROVACAO = "aguardando-aprovacao";

/** Disparado no `window` quando o analista aprova a cascata: as linhas "ficaram desatualizados" das telas somem. */
export const EVENTO_CASCATA_APROVADA = "cascata:aprovada";

/** 1º mês do trimestre CIVIL do Painel que aprova este item da cascata, ou null se o mês não for válido.
 * A partir do SR ou do PR o mês-guia já está no trimestre civil apurado. A partir do PV ele está no
 * trimestre do ciclo (Nov a Jan, ...), que o trimestre civil define 4 meses antes do 1º mês dele. */
function trimestreDoPainelDoItem(aPartirDe: Cascata["a_partir_de"], guia: string): string | null {
  const p = lerPeriodo(guia);
  if (!p) return null;
  if (aPartirDe === "pv") {
    const t = trimestreFiscalDoMes(guia);
    return t ? deslocaPeriodo(`${t.trimestre.slice(0, 3)}/${t.ano}`, -4) : null;
  }
  return `${MESES_ABREV[p.mes - (p.mes % 3)]}/${p.ano}`;
}

/** Trimestre do Painel (1º mês civil, "Jul/2026") do primeiro trimestre da cascata. */
export function trimestreDoPainelDaCascata(c: Cascata): string | null {
  const primeiro = c.trimestres[0];
  return primeiro ? trimestreDoPainelDoItem(c.a_partir_de, primeiro.periodo) : null;
}

/** Endereço do Painel já no trimestre certo e pedindo para rolar até o bloco de aprovação. */
export function linkDeAprovacao(c: Cascata): string {
  const tri = trimestreDoPainelDaCascata(c);
  const p = new URLSearchParams();
  if (tri) p.set("trimestre", tri);
  p.set("aprovar", "1");
  return `${ROTA_INICIAL}?${p}`;
}

/** Há algo diferente do gravado para o analista aprovar? (pendência sozinha não é "para aprovar"). */
export function cascataTemParaAprovar(c: Cascata | null | undefined): boolean {
  return !!c && c.desatualizado;
}

/** Do aviso geral (GET /cascata/pendente), só os trimestres que NÃO são o do Painel aberto.
 * O mês-guia de um mesmo trimestre pode variar (Jul ou Ago), por isso compara pelo trimestre civil. */
export function outrosTrimestres(geral: Cascata | null | undefined, doPainel: Cascata | null | undefined): Cascata | null {
  if (!geral) return null;
  const jaNoPainel = new Set((doPainel?.trimestres ?? []).map((t) => trimestreDoPainelDoItem(doPainel!.a_partir_de, t.periodo)));
  const outros = geral.trimestres.filter((t) => !jaNoPainel.has(trimestreDoPainelDoItem(geral.a_partir_de, t.periodo)));
  if (outros.length === 0) return null;
  return { ...geral, periodos: outros.map((t) => t.periodo), trimestres: outros, desatualizado: outros.some((t) => t.desatualizado) };
}
