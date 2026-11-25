/** Lógica do passo final "Gravar o mês de <Mês/Ano>" (depois de conferir o mês, no Comparar ou no Auditar).
 * Só decide o que mostrar e o que enviar: quem soma no CGR e grava é o back-end. Sem JSX, para testar. */
import type { AuditoriaComparacao, AuditoriaHistoricoLinha } from "../../types";
import { brl } from "../../utils/format";
import type { AuditoriaDoMes } from "./auditoriaDoMes";
import type { Decisao, FaltantesDoMes } from "./notasFaltantes";

/** Id do bloco "Gravar o mês": os botões "Grave o mês antes de incluir" levam até ele. */
export const ID_GRAVAR_MES = "gravar-o-mes";

/** Motivo já preenchido quando o mês é regravado e as notas digitadas voltam junto (o analista pode editar). */
export const MOTIVO_REINCLUSAO = "Reincluída ao regravar o mês (nota digitada antes)";

const CENTAVO = 0.005;

/** nunca = mês sem notas gravadas; igual = o gravado já é o que foi conferido; substitui = gravar troca o que existe;
 * vazio = nenhuma nota lida, não há o que gravar. */
export type EstadoDaGravacao = "vazio" | "nunca" | "igual" | "substitui";

/** O mês tem notas gravadas? (O back recusa "Incluir esta nota" quando não tem.) */
export const mesJaGravado = (linha: AuditoriaHistoricoLinha | null | undefined): boolean => (linha?.qtd_notas ?? 0) > 0;

export function estadoDaGravacao(i: { cgrCalculado: number; qtdNotas: number; linha: AuditoriaHistoricoLinha | null | undefined }): EstadoDaGravacao {
  if (i.qtdNotas === 0) return "vazio";
  const l = i.linha;
  if (!l || !mesJaGravado(l)) return "nunca";
  // As notas digitadas não vêm dos arquivos: ficam de fora da comparação "gravado = conferido".
  const semDigitadas = l.cgr_gravado - (l.cgr_digitadas ?? 0);
  const mesmasNotas = l.qtd_notas - (l.qtd_digitadas ?? 0) === i.qtdNotas;
  return mesmasNotas && Math.abs(i.cgrCalculado - semDigitadas) < CENTAVO ? "igual" : "substitui";
}

/** Divergência do mês: notas ou empresas diferentes do gravado, PDF não lido ou empresa gravada que sai do mês. */
export function divergenciaDoMes(res: AuditoriaDoMes) {
  const d = res.diferencas;
  const apagadas = d?.tem_notas_gravadas ? d.por_empresa.filter((e) => e.processado === 0 && e.gravado !== 0) : [];
  const temDiferenca = !!d && (d.resumo.length > 0 || d.notas.length > 0);
  return { apagadas, temDiferenca, divergencia: temDiferenca || !!res.naoLidos || apagadas.length > 0 };
}

/** Notas digitadas ("Incluir esta nota") do mês gravado, e se voltam na regravação. null = não há nenhuma. */
export function digitadasDoMes(linha: AuditoriaHistoricoLinha | null | undefined, decisao: Decisao | null, faltantes: FaltantesDoMes) {
  const qtd = linha?.qtd_digitadas ?? 0;
  if (qtd === 0) return null;
  return { qtd, cgr: linha?.cgr_digitadas ?? 0, reincluidas: decisao === "incluir" && faltantes.paraIncluir !== null };
}

/** Regravar um mês com notas digitadas: já começa em "incluir no cálculo" (as notas voltam), se a planilha traz todas. */
export function decisaoInicial(linha: AuditoriaHistoricoLinha | null | undefined, faltantes: FaltantesDoMes): Decisao | null {
  return (linha?.qtd_digitadas ?? 0) > 0 && faltantes.paraIncluir ? "incluir" : null;
}

/** Notas lidas dos arquivos menos a 1ª fonte da planilha (a mesma conta do quadro da comparação). null = sem planilha para comparar. */
export function diferencaParaPlanilha(c: AuditoriaComparacao | null | undefined): number | null {
  if (!c) return null;
  const ref = (c.fontes_cgr ?? []).find((f) => f.valor !== null)?.valor ?? null;
  return ref === null ? null : (c.cgr_auditoria ?? 0) - ref;
}

/** "2026-11-25 14:02" -> "25/11 14:02"; texto fora do formato volta como veio. */
export function dataDaGravacao(dataHora: string | null | undefined): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}:\d{2})/.exec(dataHora ?? "");
  return m ? `${m[3]}/${m[2]} ${m[4]}` : (dataHora ?? "");
}

/** A frase de situação do mês, no alto do bloco. */
export function textoDoEstado(estado: EstadoDaGravacao, periodo: string, linha: AuditoriaHistoricoLinha | null | undefined, cgrCalculado: number, comPendencia = false): string {
  if (estado === "vazio") return `Nenhuma nota de ${periodo} foi lida: não há o que gravar.`;
  if (estado === "nunca") return `${periodo} ainda não foi gravado.`;
  const quando = linha?.data_atualizacao ? ` em ${dataDaGravacao(linha.data_atualizacao)}` : "";
  // Com divergência ou nota faltando na conferência, "não há nada a mudar" seria falso: o que está gravado ainda pode precisar de decisão.
  if (estado === "igual" && comPendencia) return `${periodo} já foi gravado${quando} com as mesmas notas que você conferiu, mas a conferência tem pendências (veja acima).`;
  return estado === "igual"
    ? `${periodo} já foi gravado${quando} e é igual ao que você conferiu. Não há nada a mudar.`
    : `${periodo} já foi gravado${quando} com ${brl(linha?.cgr_gravado ?? 0)}. Gravar troca por ${brl(cgrCalculado)}.`;
}

export function rotuloDoBotao(estado: EstadoDaGravacao, periodo: string, linha: AuditoriaHistoricoLinha | null | undefined, gravando: boolean): string {
  if (gravando) return `Gravando ${periodo}…`;
  if (estado === "igual") return `Regravar ${periodo}`;
  if (estado === "substitui") return `Gravar ${periodo} (substitui ${brl(linha?.cgr_gravado ?? 0)})`;
  return `Gravar o mês de ${periodo}`;
}

export function tituloDaConfirmacao(estado: EstadoDaGravacao, periodo: string, divergencia: boolean): string {
  if (divergencia) return `Gravar o CGR de ${periodo} com divergências?`;
  return estado === "nunca" ? `Gravar o CGR de ${periodo}?` : `Substituir o CGR de ${periodo}?`;
}
