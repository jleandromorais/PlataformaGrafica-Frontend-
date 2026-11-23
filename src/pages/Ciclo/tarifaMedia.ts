/** Texto do cartão "Tarifa média" do Painel do Ciclo. Só leitura: a tarifa e a MB vêm prontas do back
 * (GET /tarifa/media) e aqui só viram palavras. O front nunca soma PV + MB e nunca escolhe o ano que vale. */
import { num } from "../../utils/format";
import type { TarifaMedia } from "../../types";

/** "Nov - Jan/2025" vira "Nov–Jan" (o ano sai: a linha de cada ano diz o dele). */
export const faixaDaChave = (chave: string): string => chave.split("/")[0].replace(/\s*-\s*/, "–");

const ORIGEM_DA_MB: Record<TarifaMedia["margens"][number]["origem"], string> = {
  salva: "salva",
  padrao: "padrão do sistema, ainda não salva",
  ausente: "sem valor",
};

export interface LinhaDaTarifa {
  ano: number;
  /** "PV gravado de Nov–Jan (2,0944) + MB de 2025, salva" */
  origem: string;
  /** A MB em número ("0,5410"), ou null quando não existe. */
  mb: string | null;
  /** A tarifa que o back calculou ("2,6354"), ou null quando falta o PV ou a MB. */
  tarifa: string | null;
}

export interface TarifaMediaDescrita {
  linhas: LinhaDaTarifa[];
  cruzaAno: boolean;
  /** Por que alguma tarifa não saiu ("Grave o PV primeiro."), do back. */
  motivo: string | null;
  /** Aviso do back (MBs diferentes entre os anos, PV gravado diferente do calculado...). */
  aviso: string | null;
}

const frase = (t: string | null) => {
  const limpo = (t ?? "").trim();
  if (!limpo) return null;
  const maiuscula = limpo[0].toUpperCase() + limpo.slice(1);
  return /[.!?]$/.test(maiuscula) ? maiuscula : `${maiuscula}.`;
};

/** Uma linha por ano da resposta (duas quando o trimestre cruza o ano), sem escolher qual vale. */
export function descreverTarifaMedia(t: TarifaMedia): TarifaMediaDescrita {
  const faixa = faixaDaChave(t.chave_pv);
  const pv = t.pv_gravado === null ? `PV de ${faixa} ainda não gravado` : `PV gravado de ${faixa} (${num(t.pv_gravado, 4)})`;
  const anos = t.tarifas.length ? t.tarifas : t.margens.map((m) => ({ ano: m.ano, mb: m.mb, tarifa_media: null }));
  const linhas = anos.map((a): LinhaDaTarifa => {
    const origemMb = t.margens.find((m) => m.ano === a.ano)?.origem ?? "ausente";
    const mb = a.mb === null ? `MB de ${a.ano}: ${ORIGEM_DA_MB.ausente}` : `MB de ${a.ano}, ${ORIGEM_DA_MB[origemMb]}`;
    return {
      ano: a.ano,
      origem: `${pv} + ${mb}`,
      mb: a.mb === null ? null : num(a.mb, 4),
      tarifa: a.tarifa_media === null ? null : num(a.tarifa_media, 4),
    };
  });
  return { linhas, cruzaAno: t.cruza_ano, motivo: frase(t.motivo), aviso: frase(t.aviso) };
}
