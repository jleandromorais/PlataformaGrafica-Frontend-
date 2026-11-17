import type { SCGComparacao, SCGValores } from "../../types";

/** Mesma tolerância do back (scg.py): centavos de arredondamento não contam. */
const TOLERANCIA = 0.01;

const ROTULOS: Record<keyof SCGValores, string> = {
  cgr: "CGR", cgf: "CGF", rpv: "RPV", ret: "RET", rp: "RP", scg: "SCG",
};

export interface LinhaDivergente {
  campo: keyof SCGValores;
  rotulo: string;
  modulos: number;
  gravado: number | null;
  diferenca: number | null; // soma dos módulos − gravado
}

/** O que mostrar no aviso: o SCG sempre (é o número que importa) e, além dele, cada campo que difere.
 * Sem valor gravado, só o SCG, com `gravado` nulo. Nunca escolhe qual valor vale. */
export function linhasDivergentes(c: SCGComparacao): LinhaDivergente[] {
  const campos = Object.keys(ROTULOS) as (keyof SCGValores)[];
  return campos
    .map((campo) => {
      const modulos = c.modulos[campo];
      const gravado = c.gravado ? c.gravado[campo] : null;
      return { campo, rotulo: ROTULOS[campo], modulos, gravado, diferenca: gravado === null ? null : modulos - gravado };
    })
    .filter((l) => l.campo === "scg" || (l.diferenca !== null && Math.abs(l.diferenca) > TOLERANCIA));
}
