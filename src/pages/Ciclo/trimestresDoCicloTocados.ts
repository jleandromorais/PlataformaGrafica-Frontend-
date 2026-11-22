/** Passo 1 do Painel: o PMPV é por trimestre do ciclo (Nov–Jan, Fev–Abr, Mai–Jul, Ago–Out), mas o
 * trimestre apurado é civil. Todo trimestre civil toca DOIS do ciclo (Abr–Jun: Fev–Abr cobre Abr e
 * Mai–Jul cobre Mai e Jun), então "o PMPV do trimestre apurado" nunca foi uma tarefa só.
 * Módulo puro: só agrupa os meses e diz quais já têm PMPV salvo. */
import { trimestreFiscalDoMes } from "../../utils/periodos";
import { rotuloDoTrimestreDoCiclo } from "../../utils/rotulos";

export interface TrimestreTocado {
  /** Como a tela PMPV e o banco chamam o trimestre ("Fev - Abr"). Só chave: a tela mostra `rotulo`. */
  trimestre: string;
  /** Ano do 1º mês do trimestre (Jan/2026 cai em "Nov - Jan" de 2025). */
  ano: number;
  /** "Fev a Abr/2026" ou, se cruza o ano, "Nov/2025 a Jan/2026". */
  rotulo: string;
  /** Só os meses do trimestre apurado que este trimestre do ciclo cobre. */
  mesesCobertos: string[];
  valores: { mes: string; pmpv: number }[];
  mesesQueFaltam: string[];
  pronto: boolean;
}

/** `meses`: os 3 meses civis apurados. `pmpv`: o PMPV de cada um, na mesma ordem (0 ou ausente = não salvo). */
export function trimestresDoCicloTocados(meses: string[], pmpv: number[]): TrimestreTocado[] {
  const grupos = new Map<string, TrimestreTocado>();
  meses.forEach((mes, i) => {
    const t = trimestreFiscalDoMes(mes);
    if (!t) return;
    const chave = `${t.trimestre}|${t.ano}`;
    const g = grupos.get(chave) ?? {
      trimestre: t.trimestre, ano: t.ano, rotulo: rotuloDoTrimestreDoCiclo(t.trimestre, t.ano),
      mesesCobertos: [], valores: [], mesesQueFaltam: [], pronto: true,
    };
    const valor = pmpv[i] > 0 ? pmpv[i] : 0;
    g.mesesCobertos.push(mes);
    g.valores.push({ mes, pmpv: valor });
    if (!valor) { g.mesesQueFaltam.push(mes); g.pronto = false; }
    grupos.set(chave, g);
  });
  return [...grupos.values()];
}
