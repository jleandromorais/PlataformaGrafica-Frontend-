/** Texto do toast e da linha "✓ Jul · ✓ Ago · ✗ Set" depois que o servidor ABRIU a planilha
 * (POST /auditoria/planilha/conferir). Função pura, para testar sem tela. */
import type { ConferirPlanilhaResponse } from "../../types";

export type DesfechoDaConferencia = "pronta" | "parcial" | "erro";

export interface ResultadoDaConferencia {
  desfecho: DesfechoDaConferencia;
  titulo: string;
  descricao: string;
  /** Um item por mês pedido, na ordem do trimestre: `tem` false = a planilha não tem aba desse mês. */
  meses: { periodo: string; curto: string; tem: boolean }[];
}

const curto = (periodo: string) => periodo.split("/")[0];

/** ["Jul/2026", "Ago/2026", "Set/2026"] vira "Jul, Ago e Set/2026" (com o ano de cada um se mudar no meio). */
export function listaDeMeses(periodos: string[]): string {
  if (periodos.length === 0) return "";
  const anos = new Set(periodos.map((p) => p.split("/")[1]));
  if (anos.size > 1) return juntar(periodos);
  const nomes = periodos.map(curto);
  const ano = periodos[0].split("/")[1];
  return `${juntar(nomes)}/${ano}`;
}

function juntar(itens: string[]): string {
  return itens.length > 1 ? `${itens.slice(0, -1).join(", ")} e ${itens[itens.length - 1]}` : itens[0];
}

const MODELOS: Record<string, string> = {
  por_nota: "modelo por nota",
  por_supridor: "modelo por supridor",
  generico: "modelo genérico",
};

/** Monta o resultado a partir da resposta do servidor e dos meses do trimestre aberto. */
export function resultadoDaConferencia(r: ConferirPlanilhaResponse, pedidos: string[]): ResultadoDaConferencia {
  if (!r.ok) {
    return {
      desfecho: "erro",
      titulo: "Não consegui abrir esta planilha",
      descricao: r.aviso ?? "Confira se é a planilha da Conta Gráfica (.xlsx) e escolha outra.",
      meses: pedidos.map((p) => ({ periodo: p, curto: curto(p), tem: false })),
    };
  }
  const tem = (p: string) => r.meses.find((m) => m.periodo === p)?.tem ?? false;
  const meses = pedidos.map((p) => ({ periodo: p, curto: curto(p), tem: tem(p) }));
  const com = meses.filter((m) => m.tem).map((m) => m.periodo);
  const sem = meses.filter((m) => !m.tem).map((m) => m.periodo);
  const modelo = r.modelo ? MODELOS[r.modelo] ?? r.modelo_rotulo ?? r.modelo : null;

  if (sem.length === 0) {
    return {
      desfecho: "pronta",
      titulo: "Planilha pronta para comparar",
      descricao: `Achei ${listaDeMeses(com)}${modelo ? ` (${modelo})` : ""}.`,
      meses,
    };
  }
  if (com.length === 0) {
    return {
      desfecho: "parcial",
      titulo: `Planilha lida, mas faltam ${listaDeMeses(sem)}`,
      descricao: "Não dá para comparar nenhum mês. Confira se é a planilha deste trimestre.",
      meses,
    };
  }
  return {
    desfecho: "parcial",
    titulo: `Planilha lida, mas falta ${listaDeMeses(sem)}`,
    descricao: `Dá para comparar ${juntar(com.map(curto))}.`,
    meses,
  };
}
