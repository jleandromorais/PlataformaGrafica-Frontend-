/** Notas incluídas à mão ("digitadas") no "Processar a pasta" do Painel. Elas não vêm nos arquivos:
 * a comparação com o gravado as desconta e a gravação as mantém (o back recebe `manter_digitadas`).
 * Vale para qualquer quantidade, sinal, empresa ou mês: tudo vem do histórico e do /diferencas.
 * Sem JSX, para testar. */
import type { AuditoriaDiferencas, AuditoriaHistoricoLinha } from "../../types";
import { brl } from "../../utils/format";

export interface DigitadasDoMes { qtd: number; cgr: number }

/** As digitadas gravadas no mês, pelo histórico. null = o mês não tem nenhuma. */
export function digitadasDaLinha(linha: AuditoriaHistoricoLinha | null | undefined): DigitadasDoMes | null {
  const qtd = linha?.qtd_digitadas ?? 0;
  return qtd > 0 ? { qtd, cgr: linha?.cgr_digitadas ?? 0 } : null;
}

/** O gravado que dá para comparar com a pasta: sem as digitadas (elas não vêm nos arquivos). */
export function gravadoDaPasta(gravado: number | null, dig: DigitadasDoMes | null): number | null {
  return gravado === null ? null : gravado - (dig?.cgr ?? 0);
}

/** As digitadas que continuam ao gravar e as que a pasta agora traz (a nota real substitui a digitada).
 * Com o /diferencas novo, ele diz quais chegaram; sem ele (back antigo ou falhou), vale o histórico. */
export function digitadasAoGravar(dig: DigitadasDoMes | null, d: AuditoriaDiferencas | undefined) {
  if (!dig) return { qtd: 0, cgr: 0, chegaram: [] as string[] };
  const lista = d?.digitadas;
  if (!lista) return { ...dig, chegaram: [] as string[] };
  return {
    qtd: d?.qtd_digitadas ?? lista.filter((n) => !n.chegou_na_pasta).length,
    cgr: d?.cgr_digitadas ?? 0,
    chegaram: lista.filter((n) => n.chegou_na_pasta).map((n) => `${n.tipo} ${n.numero} de ${n.empresa}`),
  };
}

/** Há diferença de verdade entre a pasta e o gravado (sem as digitadas)? O /diferencas vem sempre que o
 * mês tem digitada, então "veio a resposta" não basta para acusar divergência. */
export function temDiferenca(d: AuditoriaDiferencas | undefined): boolean {
  return !!d && (d.notas.length > 0 || d.por_empresa.length > 0);
}

/** Linha de detalhe da célula: quanto das notas à mão entra no valor a gravar. "" = nenhuma. */
export function textoDasMantidas(m: { qtd: number; cgr: number }): string {
  if (!m.qtd) return "";
  return m.qtd === 1
    ? `inclui 1 nota incluída à mão (${brl(m.cgr)}), mantida ao gravar`
    : `inclui ${m.qtd} notas incluídas à mão (${brl(m.cgr)}), mantidas ao gravar`;
}

/** Aviso para cada digitada que agora veio na pasta. */
export function avisosDasQueChegaram(chegaram: string[]): string[] {
  return chegaram.map((n) => `A nota ${n}, incluída à mão antes, veio na pasta: ao gravar, a da pasta substitui a digitada (não conta duas vezes).`);
}
