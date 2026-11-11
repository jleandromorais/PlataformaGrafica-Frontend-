/** Arruma o resultado da comparação com a planilha para a tela ficar fácil de ler.
 * Só reorganiza e resume o que o back-end mandou: nenhum valor é recalculado para gravar. */
import type { AuditoriaComparacao, AuditoriaDivergencia } from "../../types";
import { brl } from "../../utils/format";

export const TOL = 1; // R$ — abaixo disso é arredondamento

type Nota = Record<string, unknown>;

const valor = (v: unknown) => (typeof v === "number" && Number.isFinite(v) ? v : undefined);
/** CGR da nota: na auditoria vem em `cgr_liquido`, na planilha em `cgr_planilha`. */
export const cgrDaNota = (n: Nota) => valor(n.cgr_liquido) ?? valor(n.cgr_planilha);
const empresaDa = (n: Nota) => String(n.empresa ?? n.supridor ?? "Sem empresa");

export interface Pareamento {
  pares: { auditoria: Nota; planilha: Nota }[];
  restoAuditoria: Nota[];
  restoPlanilha: Nota[];
}

/** Junta a nota que veio só nos arquivos com a que está só na planilha quando o CGR é o mesmo
 * (diferença de até R$ 1): quase sempre é a mesma nota, com número ou empresa lidos de outro jeito.
 * Cada nota entra em um par só; nota sem valor ou de R$ 0 não é pareada (não dá para dizer). */
export function parearMesmoValor(soAuditoria: Nota[], soPlanilha: Nota[]): Pareamento {
  const usadas = new Set<number>();
  const pares: Pareamento["pares"] = [];
  const restoAuditoria: Nota[] = [];
  for (const a of soAuditoria) {
    const va = valor(a.cgr_liquido);
    let melhor = -1;
    let menorDif = Infinity;
    if (va !== undefined && Math.abs(va) > TOL) {
      soPlanilha.forEach((p, i) => {
        const vp = valor(p.cgr_planilha);
        if (usadas.has(i) || vp === undefined) return;
        const dif = Math.abs(va - vp);
        if (dif <= TOL && dif < menorDif) { melhor = i; menorDif = dif; }
      });
    }
    if (melhor >= 0) {
      usadas.add(melhor);
      pares.push({ auditoria: a, planilha: soPlanilha[melhor] });
    } else {
      restoAuditoria.push(a);
    }
  }
  return { pares, restoAuditoria, restoPlanilha: soPlanilha.filter((_, i) => !usadas.has(i)) };
}

/** A nota diverge no CGR (vermelho) ou só no volume/alíquota, com o CGR igual (âmbar). */
export const cgrDifere = (d: AuditoriaDivergencia) => Math.abs(d.diferenca_cgr) > TOL;

/** Separa o veredito do back ("CGR confere…"/"CGR DIVERGENTE…", que vira o resumo do topo)
 * dos avisos de leitura (OCR, nota casada pelo valor…), que vão para a lista do fim. */
export function separarAvisos(avisos: string[]): { veredito: string | null; leitura: string[] } {
  const ehVeredito = (a: string) => a.startsWith("CGR confere") || a.startsWith("CGR DIVERGENTE");
  return { veredito: avisos.find(ehVeredito) ?? null, leitura: avisos.filter((a) => !ehVeredito(a)) };
}

const notas = (n: number) => (n === 1 ? "1 nota" : `${n} notas`);

/** Agrupa por empresa: "TAG: 1 nota está na planilha e não veio nos arquivos (R$ 1.000,00)". */
function porEmpresa(lista: Nota[], umaNota: string, variasNotas: string): string[] {
  const grupos = new Map<string, Nota[]>();
  lista.forEach((n) => grupos.set(empresaDa(n), [...(grupos.get(empresaDa(n)) ?? []), n]));
  return [...grupos].map(([empresa, ns]) => {
    const valores = ns.map(cgrDaNota).filter((v): v is number => v !== undefined);
    const soma = valores.length ? ` (${brl(valores.reduce((s, v) => s + v, 0))})` : "";
    return `${empresa}: ${notas(ns.length)} ${ns.length === 1 ? umaNota : variasNotas}${soma}.`;
  });
}

export interface Resumo {
  confere: boolean;
  frase: string;
  itens: string[];
}

/** A frase do topo (veredito e diferença) e as causas, em linguagem simples. */
export function resumoDaComparacao(c: AuditoriaComparacao, p: Pareamento, veredito: string | null): Resumo {
  const aud = c.cgr_auditoria ?? 0;
  const fontes = (c.fontes_cgr ?? []).filter((f): f is { rotulo: string; valor: number } => f.valor !== null);
  const ref = fontes[0];
  const dif = ref ? aud - ref.valor : 0;
  const divergeTotal = fontes.some((f) => Math.abs(aud - f.valor) > TOL);
  const divCgr = c.divergencias_valor.filter(cgrDifere);
  const soVolume = c.divergencias_valor.filter((d) => !cgrDifere(d));
  const supridores = c.tipo === "por_supridor" ? c.por_empresa.filter((e) => !e.confere) : [];

  const itens = [
    ...porEmpresa(p.restoPlanilha, "está na planilha e não veio nos arquivos", "estão na planilha e não vieram nos arquivos"),
    ...porEmpresa(p.restoAuditoria, "veio nos arquivos e não está na planilha", "vieram nos arquivos e não estão na planilha"),
    ...(p.pares.length ? [`${notas(p.pares.length)} ${p.pares.length === 1 ? "parece estar" : "parecem estar"} nos dois lados com número ou empresa lidos de outro jeito (o valor é o mesmo).`] : []),
    ...(divCgr.length ? [`${notas(divCgr.length)} com CGR diferente da planilha (${brl(divCgr.reduce((s, d) => s + d.diferenca_cgr, 0))} no total).`] : []),
    ...(soVolume.length ? [`${notas(soVolume.length)} só com volume ou alíquota diferente; o CGR é igual e não muda o total.`] : []),
    ...supridores.map((e) => `${e.empresa}: diferença de ${brl(e.diferenca)}.`),
  ];

  // Quanto da diferença as notas listadas explicam (notas de um lado só + diferenças por nota).
  if (c.tipo === "por_nota" && ref && Math.abs(dif) > TOL) {
    const soma = (l: Nota[]) => l.reduce((s, n) => s + (cgrDaNota(n) ?? 0), 0);
    const explicado = soma(p.restoAuditoria) - soma(p.restoPlanilha)
      + divCgr.reduce((s, d) => s + d.diferenca_cgr, 0)
      + p.pares.reduce((s, par) => s + (cgrDaNota(par.auditoria) ?? 0) - (cgrDaNota(par.planilha) ?? 0), 0);
    const falta = dif - explicado;
    if (Math.abs(falta) > 2 * TOL) itens.push(`${brl(falta)} da diferença não aparece nas notas listadas: veja a conferência por supridor.`);
  }

  const confere = !divergeTotal && itens.length === 0;

  let frase: string;
  if (ref && Math.abs(dif) > TOL) {
    frase = `O CGR das notas está ${brl(Math.abs(dif))} ${dif < 0 ? "abaixo" : "acima"} da planilha${fontes.length > 1 ? ` (${ref.rotulo})` : ""}.`;
  } else if (confere && c.tipo === "por_supridor") {
    frase = `Tudo confere: ${c.por_empresa.length === 1 ? "o supridor bate" : `os ${c.por_empresa.length} supridores batem`} com a planilha.`;
  } else if (confere) {
    frase = `Tudo confere: ${c.qtd_em_ambas === 1 ? "a nota bate" : `as ${c.qtd_em_ambas} notas batem`} com a planilha.`;
  } else if (ref) {
    frase = "O CGR das notas confere com a planilha, mas há notas para conferir.";
  } else {
    frase = veredito ?? "Há notas para conferir.";
  }
  return { confere, frase, itens };
}
