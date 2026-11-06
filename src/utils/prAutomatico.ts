import type { PRAutomatico, PVAutomatico } from "../types";
import { num } from "./format";

const tarifa = (v: number | null) => (v === null ? "—" : num(v, 4));

/** Frase para a tela depois de salvar o SCG ou o SR: o que aconteceu com o PR e o
 * PV do trimestre. `ok` false = algo não foi gravado e pede atenção. */
export function textoPRAutomatico(p: PRAutomatico | null | undefined): { texto: string; ok: boolean } | null {
  if (!p) return null;
  const faixa = p.meses_pr.length ? `${p.meses_pr[0]} a ${p.meses_pr[2]}` : "";
  if (!p.atualizado) {
    return {
      ok: false,
      texto: faixa
        ? `PR de ${faixa} não foi atualizado: ${p.pendencias.join(" ")}`
        : p.pendencias.join(" "),
    };
  }
  const pr = `PR de ${faixa} atualizado: ${tarifa(p.pr_antes)} → ${tarifa(p.pr)} R$/m³.`;
  if (p.pv === null) return { ok: false, texto: `${pr} ${p.pendencias.join(" ")}` };
  return { ok: true, texto: `${pr} PV: ${tarifa(p.pv_antes)} → ${tarifa(p.pv)} R$/m³.` };
}

/** Frase depois de salvar o PMPV ou o PR: o que aconteceu com o PV do trimestre.
 * As pendências do backend já dizem "PV não atualizado: falta …". */
export function textoPVAutomatico(p: PVAutomatico | null | undefined): { texto: string; ok: boolean } | null {
  if (!p) return null;
  if (!p.atualizado) return { ok: false, texto: p.pendencias.join(" ") };
  return { ok: true, texto: `PV de ${p.trimestre} atualizado: ${tarifa(p.pv_antes)} → ${tarifa(p.pv)} R$/m³.` };
}
