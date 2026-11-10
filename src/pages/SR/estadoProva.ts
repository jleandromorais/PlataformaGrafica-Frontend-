/** Funções puras da prova real do SR: em que situação está o trimestre, o que as fontes dizem
 * hoje e o que fazer. Só classificam e escrevem o que o backend devolveu: nada aqui calcula o SR. */
import type { ProvaRealLinhaSR, ProvaRealSR } from "../../types";

export type EstadoProvaSR = "nao_gravado" | "confere" | "diverge";

export function estadoDaProvaSR(d: ProvaRealSR): EstadoProvaSR {
  if (!d.gravado || d.linhas.length === 0) return "nao_gravado";
  return d.conta_confere ? "confere" : "diverge";
}

/** Frase curta para quem sabe pouco: o que a situação quer dizer e o que fazer. */
export const ORIENTACAO_SR: Record<EstadoProvaSR, string> = {
  confere: "Está certo: o SR gravado é igual à conta refeita mês a mês com os valores gravados.",
  diverge: "O SR gravado é diferente da conta refeita com os valores gravados. Recalcule e grave de novo no Painel do Ciclo (card SR).",
  nao_gravado: "Este trimestre ainda não tem SR gravado. Calcule e grave no Painel do Ciclo (card SR) ou use o formulário abaixo.",
};

export type EstadoFontes = "sem_dados" | "indisponiveis" | "desatualizadas" | "em_dia";

/** As fontes (PMPV, CGF, módulo PR e Banco Central) ainda dão o que está gravado? */
export function estadoDasFontes(d: ProvaRealSR): EstadoFontes {
  if (!d.gravado || d.linhas.length === 0) return "sem_dados";
  if (!d.fontes_disponiveis) return "indisponiveis";
  return d.linhas.some((l) => (l.fontes?.diferem.length ?? 0) > 0) ? "desatualizadas" : "em_dia";
}

export const ROTULO_FONTE: Record<string, string> = {
  vp: "VP (do PMPV)",
  vf: "VF (do CGF)",
  pr: "PR (do módulo PR)",
  selic_mensal: "SELIC (do Banco Central)",
};

export interface CampoDesatualizado {
  campo: string;
  rotulo: string;
  gravado: number;
  hoje: number | null;   // null: a fonte não respondeu (ex.: SELIC do Banco Central)
}

/** Campos do mês em que a fonte de hoje difere do gravado. */
export function camposDesatualizados(l: ProvaRealLinhaSR): CampoDesatualizado[] {
  const f = l.fontes;
  if (!f) return [];
  return f.diferem
    .filter((c): c is "vp" | "vf" | "pr" | "selic_mensal" => c in ROTULO_FONTE && c in f)
    .map((c) => ({ campo: c, rotulo: ROTULO_FONTE[c], gravado: l[c], hoje: f[c] }));
}

export const AVISO_DESATUALIZADO =
  "Se algum diferir, o SR gravado ficou desatualizado: recalcule no Painel do Ciclo (card SR).";

/** "Jan/2026_Mar/2026" → "Jan/2026 a Mar/2026". */
export function rotuloDoTrimestre(chave: string): string {
  return chave.replace("_", " a ");
}

const MESES = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

/** "Jan/2026_Mar/2026" → { ano: 2026, tri: 0 } (trimestre civil que o formulário entende); outra coisa → null. */
export function trimestreDoFormulario(chave: string): { ano: number; tri: number } | null {
  const [m, a] = chave.split("_")[0].split("/");
  const idx = MESES.indexOf(m);
  const ano = Number(a);
  if (idx < 0 || idx % 3 !== 0 || !Number.isInteger(ano)) return null;
  return { ano, tri: idx / 3 };
}
