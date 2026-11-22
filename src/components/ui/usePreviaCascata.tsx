/** Gancho para as telas que gravam (SCG, SR, PR, PMPV, Auditoria, Processar...): guarda a cascata que a
 * gravação devolveu e entrega a LINHA pronta para pôr na tela. A prévia com "Aprovar em sequência" não aparece
 * mais aqui: ela mora num lugar só, o bloco "Aguardando sua aprovação" do Painel do Ciclo
 * (SPEC_FLUXO_UNICO, decisão 4). Uso:
 *   const { previa, mostrarCascata } = usePreviaCascata();
 *   depois de gravar:  mostrarCascata(r.cascata);
 *   no JSX:            {previa}
 * Resposta sem `cascata` (back antigo) ou sem nada desatualizado: não aparece nada. */
import { useCallback, useEffect, useState } from "react";
import { AlertTriangle } from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import type { Cascata } from "../../types";
import { ROTA_INICIAL } from "../../router/rotas";
import { EVENTO_CASCATA_APROVADA, ID_APROVACAO, cascataTemParaAprovar, linkDeAprovacao } from "../../utils/aprovacao";
import { classesDoBotao } from "./estilosBotao";
import { avisarAtencao } from "./avisos";
import { irParaSecao } from "./useIrParaSecao";

/** Já estando no Painel, basta rolar até o bloco (o Painel o refaz sozinho depois de gravar). Fora dele, navega. */
function useIrParaAprovacao() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const noPainel = pathname === ROTA_INICIAL;
  const revisar = useCallback((c: Cascata) => {
    if (noPainel) {
      // Dá tempo de o bloco aparecer: o Painel busca a prévia de novo depois de gravar.
      window.setTimeout(() => irParaSecao(ID_APROVACAO), 400);
      return;
    }
    navigate(linkDeAprovacao(c));
  }, [navigate, noPainel]);
  return { revisar, noPainel };
}

export function usePreviaCascata(className = "") {
  const [cascata, setCascata] = useState<Cascata | null>(null);
  const { revisar, noPainel } = useIrParaAprovacao();
  // Aprovada no bloco do Painel: a linha desta tela já não vale.
  useEffect(() => {
    const limpar = () => setCascata(null);
    window.addEventListener(EVENTO_CASCATA_APROVADA, limpar);
    return () => window.removeEventListener(EVENTO_CASCATA_APROVADA, limpar);
  }, []);

  /** Guarda a cascata (só se houver algo para aprovar); null/undefined limpa. Avisa também num toast. */
  const mostrarCascata = useCallback((c: Cascata | null | undefined) => {
    const temAlgo = !!c && cascataTemParaAprovar(c);
    setCascata(temAlgo ? c : null);
    if (temAlgo) {
      avisarAtencao("O SR, o PR e o PV ficaram desatualizados",
        "O que você gravou já vale; o que vem à frente só muda depois da sua aprovação no Painel.",
        { rotulo: "Revisar e aprovar", aoClicar: () => revisar(c) });
    }
  }, [revisar]);

  const previa = cascata ? (
    <div role="status" className={`flex flex-wrap items-center gap-3 rounded-lg border border-amber-500/25 bg-amber-500/[0.06] px-4 py-2.5 text-sm text-zinc-200 ${className}`}>
      <AlertTriangle size={16} className="shrink-0 text-amber-400" aria-hidden />
      <p className="min-w-0 flex-1">
        <b className="text-amber-400">O SR, o PR e o PV ficaram desatualizados.</b>{" "}
        O que você gravou já vale. O que vem à frente só muda depois da sua aprovação, no Painel do Ciclo.
      </p>
      {noPainel ? (
        <button type="button" onClick={() => revisar(cascata)} className={classesDoBotao("warning", "sm")}>Revisar e aprovar</button>
      ) : (
        <Link to={linkDeAprovacao(cascata)} className={classesDoBotao("warning", "sm")}>Revisar e aprovar no Painel</Link>
      )}
    </div>
  ) : null;
  return { previa, mostrarCascata };
}
