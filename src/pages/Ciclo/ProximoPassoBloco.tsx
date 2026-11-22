/** O bloco "Próximo passo" do topo do Painel do Ciclo: UM título, UM texto, UM botão.
 * O que mostrar vem de `blocoDoProximoPasso` (módulo puro e testado); aqui só se desenha
 * e se leva o botão ao lugar certo. Depois de carregar, é o primeiro bloco de ação da página. */
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { Alert } from "../../components/ui/Alert";
import { Button } from "../../components/ui/Button";
import { classesDoBotao } from "../../components/ui/estilosBotao";
import { ComSiglas } from "../../components/ui/Sigla";
import { Skeleton } from "../../components/ui/Skeleton";
import type { AcaoDoBloco, BlocoProximoPasso, CasoDoBloco } from "./blocoProximoPasso";

/** Borda da esquerda por situação: azul = faça isto; verde = pronto; vermelho = deu erro; cinza = espere. */
const BORDA: Record<CasoDoBloco, string> = {
  erro: "border-l-red-400", pronto: "border-l-emerald-400", bloqueado: "border-l-zinc-500",
  aprovar: "border-l-amber-400", pasta: "border-l-sky-400", "pasta-de-novo": "border-l-amber-400", processar: "border-l-sky-400",
  pmpv: "border-l-sky-400", scg: "border-l-amber-400", sr: "border-l-sky-400", "pr-pv": "border-l-sky-400",
};

export function ProximoPassoBloco({ bloco, detalheDoErro, onAcao, onVerMotivo }: {
  /** null = ainda carregando: mostra o esqueleto, sem botão. */
  bloco: BlocoProximoPasso | null;
  /** Mensagem técnica da carga que falhou; só aparece no caso "erro". */
  detalheDoErro?: string | null;
  onAcao: (a: AcaoDoBloco) => void;
  onVerMotivo: (b: BlocoProximoPasso) => void;
}) {
  const moldura = "rounded-xl border border-white/[0.07] border-l-4 bg-panel p-5 sm:p-6";
  if (!bloco) {
    return (
      <section role="status" aria-label="Próximo passo" className={`${moldura} border-l-zinc-600`}>
        <span className="sr-only">Vendo qual é o próximo passo…</span>
        <Skeleton className="h-3 w-40" />
        <Skeleton className="mt-3 h-6 w-2/3" />
        <Skeleton className="mt-3 h-4 w-full max-w-xl" />
        <Skeleton className="mt-5 h-11 w-56" />
      </section>
    );
  }
  const { acao } = bloco;
  return (
    <section id="proximo-passo" aria-labelledby="proximo-passo-titulo" role={bloco.caso === "erro" ? "alert" : undefined}
      className={`${moldura} ${BORDA[bloco.caso]}`}>
      <p className="text-xs font-semibold text-zinc-400">
        Próximo passo{bloco.passo && <span className="tabular-nums"> · {bloco.passo.toLowerCase()}</span>}
      </p>
      <h2 id="proximo-passo-titulo" className="mt-1 text-xl font-semibold text-white"><ComSiglas>{bloco.titulo}</ComSiglas></h2>
      {bloco.etapa && <p className="mt-0.5 text-xs text-zinc-500">{bloco.etapa}</p>}
      <p className="mt-2 max-w-2xl text-sm leading-relaxed text-zinc-300"><ComSiglas>{bloco.texto}</ComSiglas></p>
      {bloco.caso === "erro" && detalheDoErro && <Alert variant="error" className="mt-3 max-w-2xl">{detalheDoErro}</Alert>}

      {(acao || bloco.depois.length > 0 || bloco.verMotivo) && (
        <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-3">
          {acao && (acao.tipo === "link" ? (
            <Link to={acao.alvo} className={classesDoBotao("solid", "lg", "w-full sm:w-auto")}>
              {acao.rotulo}<ArrowRight size={16} aria-hidden />
            </Link>
          ) : (
            <Button variant="solid" size="lg" className="w-full sm:w-auto" onClick={() => onAcao(acao)}>
              {acao.rotulo}<ArrowRight size={16} aria-hidden />
            </Button>
          ))}
          {bloco.depois.length > 0 && <p className="text-sm text-zinc-400">Depois: {bloco.depois.join(", ")}</p>}
          {bloco.verMotivo && (
            <button type="button" onClick={() => onVerMotivo(bloco)}
              className="min-h-9 rounded-lg px-1 text-sm font-medium text-sky-300 hover:text-sky-200 sm:ml-auto">
              Ver motivo ›
            </button>
          )}
        </div>
      )}
    </section>
  );
}
