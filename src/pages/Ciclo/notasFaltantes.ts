/** Notas que a comparação achou só na planilha e a escolha do analista antes de gravar a Auditoria CGR.
 * Só decide o que mostrar e o que enviar: quem soma no CGR e guarda a decisão é o back-end. */
import type { DecisaoDeFaltantes, NotaFaltante } from "../../api";
import type { AuditoriaComparacao, AuditoriaHistoricoLinha, NotaSoNaPlanilha, PendenciaNota } from "../../types";
import { brl } from "../../utils/format";
import { parearMesmoValor } from "../Auditoria/comparacaoResumo";
import { podeIncluirNota } from "../Auditoria/incluirNota";

export type Decisao = DecisaoDeFaltantes["decisao"];

export interface FaltantesDoMes {
  /** Notas só na planilha que não têm par (mesmo valor) entre as notas lidas. */
  notas: NotaSoNaPlanilha[];
  /** Os pedidos de inclusão, na ordem de `notas`; só existe se TODAS têm CGR, empresa e número. */
  paraIncluir: NotaFaltante[] | null;
}

const numero = (v: unknown) => (typeof v === "number" && Number.isFinite(v) ? v : undefined);

/** As notas que faltam na pasta. Nota que só parece a mesma (mesmo valor, número escrito de outro jeito) não conta. */
export function faltantesDoMes(c: AuditoriaComparacao | null | undefined): FaltantesDoMes {
  if (!c) return { notas: [], paraIncluir: null };
  const notas = parearMesmoValor(c.notas_apenas_auditoria, c.notas_apenas_planilha).restoPlanilha as NotaSoNaPlanilha[];
  return {
    notas,
    paraIncluir: notas.length && notas.every(podeIncluirNota) ? notas.map((n) => ({
      empresa: (n.empresa ?? n.supridor)!, numero: n.numero!, cgr_liquido: n.cgr_planilha!,
      valor_total: numero(n.valor_planilha), volume_total: numero(n.dados_linha?.["Vol m³"]), linha_excel: numero(n.linha_excel),
    })) : null,
  };
}

/** "TAG, nota 4539 (R$ 1.000,00)". */
export function rotuloDaNota(n: NotaSoNaPlanilha): string {
  const cgr = numero(n.cgr_planilha);
  return `${n.empresa ?? n.supridor ?? "Sem empresa"}, nota ${n.numero ?? "sem número"}${cgr !== undefined ? ` (${brl(cgr)})` : ""}`;
}

/** O motivo de incluir a nota à mão precisa de pelo menos 5 letras (a mesma regra do back e do "Incluir esta nota"). */
export const motivoValido = (motivo: string) => motivo.trim().length >= 5;

/** Pode gravar? Sem nota faltante, sim. Com nota faltante, só depois de escolher (incluir exige CGR em todas e o motivo). */
export function podeGravarComFaltantes(f: FaltantesDoMes, decisao: Decisao | null, motivo = ""): boolean {
  if (!f.notas.length) return true;
  return decisao === "seguir_sem" || (decisao === "incluir" && f.paraIncluir !== null && motivoValido(motivo));
}

/** O que vai junto no pedido de gravar (undefined = nada faltando ou nada escolhido). */
export function decisaoParaEnviar(f: FaltantesDoMes, decisao: Decisao | null, motivo = ""): DecisaoDeFaltantes | undefined {
  if (!f.notas.length || !decisao || !podeGravarComFaltantes(f, decisao, motivo)) return undefined;
  const faltantes = f.paraIncluir ?? f.notas.map((n) => ({ empresa: n.empresa ?? n.supridor ?? "", numero: n.numero ?? "", cgr_liquido: numero(n.cgr_planilha) ?? 0 }));
  return { faltantes, decisao, ...(decisao === "incluir" ? { motivo: motivo.trim() } : {}) };
}

/** Linha do aviso persistente de um mês gravado com nota faltante. */
export function textoDaPendencia(periodo: string, p: PendenciaNota): string {
  const nota = `${p.empresa}, nota ${p.numero} (${brl(p.cgr_liquido)})`;
  return p.decisao === "incluida"
    ? `${periodo}: a nota ${nota} entrou no CGR, mas só chega depois do período. Confira e regularize quando ela chegar.`
    : `${periodo}: gravado sem a nota ${nota}, que está só na planilha. O CGR não a inclui.`;
}

/** As pendências dos meses do trimestre, para o aviso que fica no cartão da Auditoria CGR. */
export function pendenciasDosMeses(auditoria: AuditoriaHistoricoLinha[], meses: string[]): string[] {
  return meses.flatMap((m) => (auditoria.find((h) => h.periodo === m)?.pendencias ?? []).map((p) => textoDaPendencia(m, p)));
}
