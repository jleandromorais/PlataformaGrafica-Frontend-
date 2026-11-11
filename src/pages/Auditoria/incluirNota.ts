/** Monta o pedido de "Incluir esta nota" a partir de uma nota que só está na planilha.
 * Só repassa os números da planilha: quem grava e recalcula o CGR é o back-end. */
import type { NotaParaIncluir } from "../../api";
import type { NotaSoNaPlanilha } from "../../types";

const numero = (v: unknown) => (typeof v === "number" && Number.isFinite(v) ? v : undefined);

/** A nota pode ser incluída? Precisa do CGR da planilha (só o modelo "por_nota" traz), da empresa e do número. */
export function podeIncluirNota(n: NotaSoNaPlanilha): boolean {
  return numero(n.cgr_planilha) !== undefined && !!(n.empresa ?? n.supridor) && !!n.numero;
}

/** O corpo do pedido, ou null se a nota não pode ser incluída ou o motivo está vazio. */
export function pedidoDeInclusao(n: NotaSoNaPlanilha, motivo: string): NotaParaIncluir | null {
  const texto = motivo.trim();
  if (!podeIncluirNota(n) || !texto) return null;
  return {
    empresa: (n.empresa ?? n.supridor)!,
    numero: n.numero!,
    cgr_liquido: n.cgr_planilha!,
    valor_total: numero(n.valor_planilha),
    volume_total: numero(n.dados_linha?.["Vol m³"]),
    linha_excel: numero(n.linha_excel),
    motivo: texto,
  };
}
