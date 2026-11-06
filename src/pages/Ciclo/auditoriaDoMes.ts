/** Auditoria CGR de UM mês, como a tela da Auditoria faz (modo XML, todas as empresas,
 * sem planilha). Usada pelo Processar do trimestre e pelo "Auditar <mês>" do Painel.
 * Só interpreta a resposta do backend: nenhum valor é calculado aqui. */
import { diferencasAuditoria, processarAuditoria, type ArquivoDaPasta } from "../../api";
import type { AuditoriaDiferencas, AuditoriaResultado } from "../../types";

export interface AuditoriaDoMes {
  r: AuditoriaResultado;
  /** Mensagens dos problemas de gravidade "erro": o mês não pode ser gravado. */
  erros: string[];
  /** O backend leu outro mês no nome da pasta (ex.: "Ago/2026" pedindo "Jul/2026"). */
  outroMes?: string;
  /** PDFs que o OCR não leu: a nota ficou fora do CGR. */
  naoLidos: number;
  /** Demais avisos, agrupados por código ("3× …"). */
  avisos: string[];
  /** Onde difere das notas gravadas (só quando o mês já tem CGR gravado e o valor mudou). */
  diferencas?: AuditoriaDiferencas;
}

/** `sempreComparar`: busca as diferenças sempre que o mês já tem CGR gravado, mesmo com o
 * total igual. Gravar substitui o mês inteiro, então empresas gravadas que não vieram na
 * pasta seriam apagadas, e só a comparação por empresa mostra isso. */
export async function auditarMes(envio: ArquivoDaPasta[], pastaRaiz: string, periodo: string, gravado: number | null,
  sempreComparar = false): Promise<AuditoriaDoMes> {
  const r = await processarAuditoria({ arquivos: envio, pastaRaiz, empresas: [], modo: "XML", periodo, planilha: null });
  const problemas = r.problemas ?? [];
  const erros = problemas.filter((p) => p.gravidade === "erro").map((p) => p.mensagem);
  const outroMes = r.periodo_detectado && r.periodo_detectado !== periodo ? r.periodo_detectado : undefined;
  const naoLidos = problemas.filter((p) => p.codigo === "pdf_ocr_falhou").length;
  const porCodigo = new Map<string, { n: number; mensagem: string }>();
  for (const p of problemas.filter((x) => x.gravidade === "aviso" && x.codigo !== "pdf_ocr_falhou")) {
    const atual = porCodigo.get(p.codigo);
    porCodigo.set(p.codigo, { n: (atual?.n ?? 0) + 1, mensagem: atual?.mensagem ?? p.mensagem });
  }
  const avisos = [...porCodigo.values()].map((a) => (a.n > 1 ? `${a.n}× ${a.mensagem}` : a.mensagem));
  // Diferente do gravado: o backend aponta empresa e nota. Sem isso, só some o detalhe.
  const diferencas = !erros.length && !outroMes && gravado !== null && (sempreComparar || Math.abs(r.totais.cgr_liquido - gravado) > 1)
    ? await diferencasAuditoria(periodo, r.itens).catch(() => undefined) : undefined;
  return { r, erros, outroMes, naoLidos, avisos, diferencas };
}
