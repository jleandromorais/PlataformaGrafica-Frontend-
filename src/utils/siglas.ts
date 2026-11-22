/** Siglas no ponto de uso (spec SPEC_FLUXO_UNICO, seção 5): lógica pura. Os nomes e as fórmulas vêm do
 * `glossario.ts` (fonte única); o desenho está em `components/ui/Sigla.tsx`. */
import { GLOSSARIO, dicaDe, type Sigla } from "./glossario";

export type Pedaco = string | { sigla: Sigla; expandir: boolean };

const SIGLAS = (Object.keys(GLOSSARIO) as Sigla[]).sort((a, b) => b.length - a.length); // PMPV antes de PV
const LETRA_OU_NUMERO = String.raw`\p{L}\p{N}_`;
const PADRAO = new RegExp(`(?<![${LETRA_OU_NUMERO}])(${SIGLAS.join("|")})(?![${LETRA_OU_NUMERO}])`, "gu");
const OPERADOR = /[=+−×÷]/;

/** Parte um texto corrido em pedaços de texto e siglas. `expandir` diz se a sigla PODE ganhar o nome por
 * extenso: não em fórmula ("PV = PMPV + PR") nem quando o nome já vem escrito ao lado. */
export function partirPorSiglas(texto: string): Pedaco[] {
  const saida: Pedaco[] = [];
  let fim = 0;
  for (const m of texto.matchAll(PADRAO)) {
    const ini = m.index;
    const depois = texto.slice(ini + m[0].length);
    const antesTrim = texto.slice(0, ini).trimEnd();
    const depoisTrim = depois.trimStart();
    const emFormula = OPERADOR.test(antesTrim.slice(-1)) || OPERADOR.test(depoisTrim.charAt(0));
    const jaTemNome = /^\s*(—|\()/.test(depois);
    if (ini > fim) saida.push(texto.slice(fim, ini));
    saida.push({ sigla: m[0] as Sigla, expandir: !emFormula && !jaTemNome });
    fim = ini + m[0].length;
  }
  if (fim < texto.length) saida.push(texto.slice(fim));
  return saida;
}

/** Quem é o "primeiro uso" da sigla na tela: o primeiro a pedir fica com o nome por extenso, até sair da tela.
 * Mesmo dono pedindo de novo (re-render) continua sendo o primeiro. */
export function reivindicarSigla(vistas: Map<Sigla, string>, sigla: Sigla, dono: string): boolean {
  if (!vistas.has(sigla)) vistas.set(sigla, dono);
  return vistas.get(sigla) === dono;
}

/** O que mostrar: primeira vez na tela, "RET (Recuperação de Encargos de Transporte)"; depois, só "RET".
 * A dica (nome e fórmula) é a mesma nas duas. */
export function siglaNoPrimeiroUso(sigla: Sigla, primeira: boolean): { sigla: Sigla; extenso: string | null; dica: string } {
  return { sigla, extenso: primeira ? GLOSSARIO[sigla].nome : null, dica: dicaDe(sigla) };
}
