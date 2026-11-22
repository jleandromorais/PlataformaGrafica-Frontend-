import { ROTA_INICIAL } from "../router/rotas";

/** Abreviações de mês usadas nos períodos "Mmm/AAAA" (iguais às do backend). */
export const MESES_ABREV = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

export const anoValido = (ano: number) => ano >= 2000 && ano <= 2100;

/** "Mai/2026" → { mes: 4, ano: 2026 }; qualquer outra coisa → null. */
export function lerPeriodo(texto: string | null | undefined): { mes: number; ano: number } | null {
  const m = /^([A-Z][a-z]{2})\/(\d{4})$/.exec(texto ?? "");
  const mes = m ? MESES_ABREV.indexOf(m[1]) : -1;
  return m && mes >= 0 && anoValido(Number(m[2])) ? { mes, ano: Number(m[2]) } : null;
}

/** O período `n` meses depois de "Mmm/AAAA" (antes, se `n` < 0). */
export function deslocaPeriodo(p: string, n: number): string {
  const [m, a] = p.split("/");
  const t = Number(a) * 12 + MESES_ABREV.indexOf(m) + n;
  return `${MESES_ABREV[t % 12]}/${Math.floor(t / 12)}`;
}

/** Endereço do Painel do Ciclo, no trimestre `ciclo` (1º mês, "Abr/2026") quando for um período válido. */
export function linkDoPainel(ciclo: string | null | undefined): string {
  return lerPeriodo(ciclo) ? `${ROTA_INICIAL}?trimestre=${encodeURIComponent(ciclo!)}` : ROTA_INICIAL;
}

/** Os 3 meses de um trimestre fiscal pelo 1º mês: ("Nov", 2025) → ["Nov/2025", "Dez/2025", "Jan/2026"]. */
export function mesesDoTrimestre(primeiroMes: string, ano: number): string[] {
  return [0, 1, 2].map((n) => deslocaPeriodo(`${primeiroMes}/${ano}`, n));
}

/** Os meses de um trimestre do SR pela chave "Jan/2026_Mar/2026" (o SR é gravado mês a mês); null se a chave não é essa. */
export function mesesDoSR(chave: string | null): string[] | null {
  const [ini, fim] = (chave ?? "").split("_");
  if (!lerPeriodo(ini) || !lerPeriodo(fim)) return null;
  const meses = [ini];
  for (let p = deslocaPeriodo(ini, 1); p !== fim && meses.length < 12; p = deslocaPeriodo(p, 1)) meses.push(p);
  return [...meses, fim];
}

/** Onde a trilha do PV de um trimestre ("Fev - Abr/2026") pode estar guardada: na chave do trimestre ou no 1º mês dele ("Fev/2026"). */
export function chavesDoPV(chave: string | null): string[] | null {
  const m = /^([A-Z][a-z]{2}) - [A-Z][a-z]{2}\/(\d{4})$/.exec(chave ?? "");
  return m ? [chave!, `${m[1]}/${m[2]}`] : null;
}

/** Os 3 meses do PR que o trimestre civil apurado define: começam 2 meses depois
 * do fim dele (Abr–Jun/26 → Ago, Set, Out/26; Out–Dez/26 → Fev, Mar, Abr/27). */
export const mesesDoPRDoCivil = (ultimoMesCivil: string) => [2, 3, 4].map((n) => deslocaPeriodo(ultimoMesCivil, n));

const INICIOS_FISCAIS = [1, 4, 7, 10]; // Fev, Mai, Ago, Nov (crescente)

/** Trimestre do ciclo (Nov–Jan, Fev–Abr, Mai–Jul, Ago–Out) que contém o mês "Mmm/AAAA".
 * `ano` é o do 1º mês do trimestre (Jan/2027 → "Nov - Jan", ano 2026), como o PMPV guarda. */
export function trimestreFiscalDoMes(periodo: string): { trimestre: string; ano: number } | null {
  const p = lerPeriodo(periodo);
  if (!p) return null;
  const inicio = [...INICIOS_FISCAIS].reverse().find((i) => i <= p.mes);
  const ano = inicio === undefined ? p.ano - 1 : p.ano;
  const m0 = inicio ?? 10;
  return { trimestre: `${MESES_ABREV[m0]} - ${MESES_ABREV[(m0 + 2) % 12]}`, ano };
}

/** Endereço do PMPV aberto no trimestre do ciclo que contém `mes`. O PMPV escolhe o
 * trimestre por `?trimestre=Ago - Out&ano=2026`; `?ciclo=` só serve à volta ao Painel. */
export function linkDoPMPV(cicloInicio: string, mes: string) {
  const t = trimestreFiscalDoMes(mes);
  const p = new URLSearchParams();
  if (t) { p.set("trimestre", t.trimestre); p.set("ano", String(t.ano)); }
  p.set("de", "ciclo");
  p.set("ciclo", cicloInicio);
  return `/pmpv?${p}`;
}

/** Trimestre pedido na URL do PMPV, se existe entre os `rotulos` da API e o ano é válido; senão null. */
export function trimestreDoPMPVNaUrl(params: URLSearchParams, rotulos: string[]): { trimestre: string; ano: number } | null {
  const trimestre = params.get("trimestre");
  const ano = Number(params.get("ano"));
  return trimestre && rotulos.includes(trimestre) && Number.isInteger(ano) && anoValido(ano) ? { trimestre, ano } : null;
}
