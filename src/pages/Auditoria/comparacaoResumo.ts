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


/** Agrupa por empresa: "Falta 1 nota da TAG na pasta (R$ 1.000,00). Ela está na planilha." */
function porEmpresa(lista: Nota[], frase: (empresa: string, qtd: number, soma: string) => string): ItemResumo[] {
  const grupos = new Map<string, Nota[]>();
  lista.forEach((n) => grupos.set(empresaDa(n), [...(grupos.get(empresaDa(n)) ?? []), n]));
  return [...grupos].map(([empresa, ns]) => {
    const valores = ns.map(cgrDaNota).filter((v): v is number => v !== undefined);
    const soma = valores.length ? ` (${brl(valores.reduce((s, v) => s + v, 0))})` : "";
    return { texto: frase(empresa, ns.length, soma), gravidade: "dinheiro" as const };
  });
}

/** `dinheiro`: o valor não fecha (vermelho). `conferir`: vale olhar, mas não muda o total (âmbar). */
export interface ItemResumo {
  texto: string;
  gravidade: "dinheiro" | "conferir";
}

export interface Resumo {
  confere: boolean;
  frase: string;
  itens: ItemResumo[];
}

const nota = (n: number) => (n === 1 ? "1 nota" : `${n} notas`);

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

  const itens: ItemResumo[] = [
    ...porEmpresa(p.restoPlanilha, (e, n, soma) =>
      `${n === 1 ? "Falta 1 nota" : `Faltam ${n} notas`} da ${e} na pasta${soma}. ${n === 1 ? "Ela está" : "Elas estão"} na planilha.`),
    ...porEmpresa(p.restoAuditoria, (e, n, soma) =>
      `${nota(n)} da ${e} ${n === 1 ? "veio" : "vieram"} na pasta${soma} e ${n === 1 ? "não está" : "não estão"} na planilha.`),
    ...(p.pares.length ? [{
      texto: `${nota(p.pares.length)} ${p.pares.length === 1 ? "parece" : "parecem"} ser a mesma dos dois lados, com número ou empresa escritos de outro jeito. O valor é o mesmo.`,
      gravidade: "conferir" as const,
    }] : []),
    ...(divCgr.length ? [{
      texto: `${nota(divCgr.length)} com valor diferente da planilha (${brl(divCgr.reduce((s, d) => s + d.diferenca_cgr, 0))} no total).`,
      gravidade: "dinheiro" as const,
    }] : []),
    ...(soVolume.length ? [{
      texto: `${nota(soVolume.length)} com o mesmo valor nos dois lados; só o volume ou a alíquota foi escrito diferente. Não muda o total.`,
      gravidade: "conferir" as const,
    }] : []),
    ...supridores.map((e) => ({ texto: `${e.empresa}: diferença de ${brl(e.diferenca)}.`, gravidade: "dinheiro" as const })),
  ];

  // Quanto da diferença as notas listadas explicam (notas de um lado só + diferenças por nota).
  if (c.tipo === "por_nota" && ref && Math.abs(dif) > TOL) {
    const soma = (l: Nota[]) => l.reduce((s, n) => s + (cgrDaNota(n) ?? 0), 0);
    const explicado = soma(p.restoAuditoria) - soma(p.restoPlanilha)
      + divCgr.reduce((s, d) => s + d.diferenca_cgr, 0)
      + p.pares.reduce((s, par) => s + (cgrDaNota(par.auditoria) ?? 0) - (cgrDaNota(par.planilha) ?? 0), 0);
    const falta = dif - explicado;
    if (Math.abs(falta) > 2 * TOL) itens.push({
      texto: `${brl(falta)} não se explicam pelas notas. Costuma ser arredondamento ou nota lançada em outro mês. Veja por supridor.`,
      gravidade: "dinheiro",
    });
  }

  const confere = !divergeTotal && itens.length === 0;

  let frase: string;
  if (ref && Math.abs(dif) > TOL) {
    frase = `As notas somam ${brl(Math.abs(dif))} a ${dif < 0 ? "menos" : "mais"} que a planilha${fontes.length > 1 ? ` (${ref.rotulo})` : ""}.`;
  } else if (confere && c.tipo === "por_supridor") {
    frase = `Tudo confere: ${c.por_empresa.length === 1 ? "o supridor bate" : `os ${c.por_empresa.length} supridores batem`} com a planilha.`;
  } else if (confere) {
    frase = `Tudo confere: ${c.qtd_em_ambas === 1 ? "a nota bate" : `as ${c.qtd_em_ambas} notas batem`} com a planilha.`;
  } else if (ref) {
    frase = "O total das notas confere com a planilha, mas há notas para conferir.";
  } else {
    frase = veredito ?? "Há notas para conferir.";
  }
  return { confere, frase, itens };
}
