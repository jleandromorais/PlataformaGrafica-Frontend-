/** Texto e tom da linha-atalho do passo 6 (SCG), que não tem bloco recolhido. Função pura: o estado
 * (situação, próximo passo, meses divergentes) vem do Painel; aqui não há regra nova. */
export type TomDoAtalho = "normal" | "atencao" | "proximo";

export function atalhoDoSCG(e: { situacao: "ok" | "atencao" | "falta"; ehProximo: boolean; mesesDivergentes: string[] }): { texto: string; tom: TomDoAtalho } {
  if (e.ehProximo) return { texto: "Passo 6 · SCG: é o próximo passo, grave na tela SCG", tom: "proximo" };
  if (e.mesesDivergentes.length) {
    const m = e.mesesDivergentes.map((x) => x.split("/")[0]);
    const lista = m.length === 1 ? m[0] : `${m.slice(0, -1).join(", ")} e ${m[m.length - 1]}`;
    return { texto: `Passo 6 · SCG: diverge dos módulos em ${lista}`, tom: "atencao" };
  }
  if (e.situacao === "falta") return { texto: "Passo 6 · SCG: ainda não gravado", tom: "normal" };
  return { texto: "Passo 6 · SCG: gravado na tela SCG", tom: "normal" };
}
