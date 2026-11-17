/** Qual é o próximo passo do Painel do Ciclo e o que está bloqueado, e por quê.
 * Função pura: recebe o que o Painel já carregou. Quando o back tiver GET /ciclo/situacao,
 * troque só a origem destes dados; a tela continua igual. */

export type ChavePasso =
  | "pmpv" | "auditoria" | "cgf" | "ret" | "rp" | "scg" | "sr" | "pr" | "pv" | "tarifa";

/** Para onde o link do bloqueio leva: um passo do Painel, ou o PMPV do trimestre novo. */
export type DestinoBloqueio = ChavePasso | "pmpv_novo";

export type SituacaoPasso = "ok" | "atencao" | "falta";

export interface EntradaPasso {
  chave: ChavePasso;
  situacao: SituacaoPasso;
  /** Meses que faltam (só para as etapas mensais): entram na frase do bloqueio. */
  mesesQueFaltam?: string[];
  /** Passo que só leva a uma tela (ex.: tarifa média): nunca é "o próximo" nem conta como pronto. */
  soLink?: boolean;
}

export interface EntradaCiclo {
  passos: EntradaPasso[]; // na ordem em que aparecem
  /** PMPV do trimestre novo (o que o PR e o PV usam): true pronto, false faltando, null não sei. */
  pmpvNovoPronto: boolean | null;
  /** Ex.: "Ago a Out/2026", para a frase do bloqueio. */
  rotuloPmpvNovo: string;
}

export interface Bloqueio {
  /** "falta o SCG de Jul, Ago": a tela escreve "Bloqueado: " na frente. */
  motivo: string;
  destino: DestinoBloqueio;
}

export interface ResultadoCiclo {
  proximo: ChavePasso | null;
  /** Só tem chave para os passos bloqueados. */
  bloqueios: Partial<Record<ChavePasso, Bloqueio>>;
}

const lista = (meses?: string[]) => (meses?.length ? ` de ${meses.map((m) => m.split("/")[0]).join(", ")}` : "");

export function calcularProximoPasso(e: EntradaCiclo): ResultadoCiclo {
  const por = new Map(e.passos.map((p) => [p.chave, p]));
  const bloqueios: ResultadoCiclo["bloqueios"] = {};

  const pmpv = por.get("pmpv");
  const scg = por.get("scg");
  const pv = por.get("pv");

  // CGF usa o PMPV dos meses apurados (o Processar já recusa sem ele).
  if (pmpv?.situacao === "falta") bloqueios.cgf = { motivo: `falta o PMPV${lista(pmpv.mesesQueFaltam)}`, destino: "pmpv" };

  // PR e PV usam o SCG do trimestre apurado e o PMPV do trimestre novo.
  for (const c of ["pr", "pv"] as const) {
    if (scg?.situacao === "falta") {
      bloqueios[c] = { motivo: `falta o SCG${lista(scg.mesesQueFaltam)}`, destino: "scg" };
    } else if (e.pmpvNovoPronto === false) {
      bloqueios[c] = { motivo: `falta o PMPV do trimestre novo (${e.rotuloPmpvNovo})`, destino: "pmpv_novo" };
    }
  }

  // A tarifa média só se fecha com o PV gravado.
  if (pv && pv.situacao !== "ok") bloqueios.tarifa = { motivo: "falta gravar o PV do trimestre novo", destino: "pv" };

  const proximo = e.passos.find((p) => !p.soLink && p.situacao !== "ok" && !bloqueios[p.chave])?.chave ?? null;
  return { proximo, bloqueios };
}

/** Chave do passo do back (GET /ciclo/situacao) → passo do Painel. "pasta_scg" não tem um passo só: fica no cálculo local. */
const DO_BACK: Record<string, ChavePasso | undefined> = { pmpv_anterior: "pmpv", sr: "sr", tarifa_media: "tarifa" };

/** Quando o back diz qual é o próximo passo (e o Painel tem esse passo), vale a palavra do back; senão, o cálculo local.
 * "pr_pv" vira o PR (ou o PV, se o PR já está pronto). Aceita texto ou objeto { chave } e ignora o que não conhece. */
export function proximoDoBack(local: ChavePasso | null, deBack: unknown, situacoes: Partial<Record<ChavePasso, SituacaoPasso>>): ChavePasso | null {
  const chave = typeof deBack === "string" ? deBack : (deBack as { chave?: unknown } | null)?.chave;
  if (typeof chave !== "string") return local;
  if (chave === "pr_pv") return situacoes.pr && situacoes.pr !== "ok" ? "pr" : "pv";
  return DO_BACK[chave] ?? local;
}
