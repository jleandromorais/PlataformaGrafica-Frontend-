/** Funções puras do SR no Painel do Ciclo: só decidem o que é "divergência" e montam os textos.
 * Nada aqui calcula o SR (quem calcula é o backend, em POST /sr/trimestre/proposta). */
import type { SRPropostaLinha, SRProposta } from "../types";

/** Campos que a tela compara com o gravado, com a tolerância de cada um (o gravado vem arredondado). */
const COMPARADOS: { campo: keyof NonNullable<SRPropostaLinha["gravado"]>; rotulo: string; tol: number }[] = [
  { campo: "vp", rotulo: "VP", tol: 0.5 },
  { campo: "vf", rotulo: "VF", tol: 0.5 },
  { campo: "pr", rotulo: "PR", tol: 0.00005 },
  { campo: "selic_mensal", rotulo: "SELIC", tol: 0.00005 },
  { campo: "sr_anterior", rotulo: "SR anterior", tol: 0.005 },
  { campo: "sr_selic", rotulo: "SR do mês", tol: 0.005 },
];

/** Campos do mês que diferem do gravado (lista vazia: igual, ou nada gravado ainda). */
export function camposDiferentes(l: SRPropostaLinha): (typeof COMPARADOS)[number]["campo"][] {
  const g = l.gravado;
  if (!g) return [];
  return COMPARADOS.filter(({ campo, tol }) => Math.abs((l[campo] as number) - g[campo]) > tol).map((c) => c.campo);
}

/** Por que o mês tem divergência (lista vazia: sem divergência): os alertas do back e, se
 * nenhum deles já disse, que difere do gravado. */
export function motivosDoMes(l: SRPropostaLinha): string[] {
  const motivos = l.alertas.map((a) => a.mensagem);
  const rotulos = COMPARADOS.filter((c) => camposDiferentes(l).includes(c.campo)).map((c) => c.rotulo);
  if (rotulos.length && !l.alertas.some((a) => a.codigo === "difere_gravado")) {
    motivos.push(`difere do gravado em ${rotulos.join(", ")}`);
  }
  return motivos;
}

/** Meses com divergência: qualquer alerta OU diferença do gravado. */
export function mesesDivergentes(p: SRProposta): string[] {
  return p.linhas.filter((l) => motivosDoMes(l).length > 0).map((l) => l.mes);
}

/** "Ago - Out/2025" → "PR Ago–Out/2025"; sem chave, "". */
export function rotuloDoPR(chave: string): string {
  const c = chave.trim();
  return c ? `PR ${c.replace(/\s*-\s*/, "–")}` : "";
}

/** ["Jan/2026", "Fev/2026", "Mar/2026"] → "Jan a Mar". */
export function faixaDoTrimestre(labels: string[]): string {
  if (labels.length === 0) return "";
  return `${labels[0].split("/")[0]} a ${labels[labels.length - 1].split("/")[0]}`;
}

/** Frase do aviso amarelo antes de gravar (mesmo padrão do Processar). */
export function tituloDaDivergencia(n: number): string {
  return `Há divergência em ${n === 1 ? "1 mês" : `${n} meses`}.`;
}
