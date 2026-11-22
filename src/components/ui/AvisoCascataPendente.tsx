/** Aviso geral na Visão geral: há trimestre com SR, PR ou PV desatualizado (GET /cascata/pendente)?
 * Mostra quantos e leva ao Painel do Ciclo, onde se aprova. A prévia com "Aprovar em sequência" não é
 * desenhada aqui (spec do Fluxo único, decisão 4). Se o servidor for antigo (sem a rota) ou nada
 * estiver pendente, não aparece. Não grava nada. */
import { useEffect, useState } from "react";
import { AlertTriangle } from "lucide-react";
import { Link } from "react-router-dom";
import { cascataPendente } from "../../api";
import type { Cascata } from "../../types";
import { linkDeAprovacao } from "../../utils/aprovacao";
import { classesDoBotao } from "./estilosBotao";

export function AvisoCascataPendente({ className = "" }: { className?: string }) {
  const [pendente, setPendente] = useState<Cascata | null>(null);

  useEffect(() => {
    let vivo = true;
    cascataPendente()
      .then((c) => { if (vivo) setPendente(c.desatualizado || c.pendencias.length > 0 ? c : null); })
      .catch(() => { /* sem a rota (back antigo) ou fora do ar: o aviso é um extra, não atrapalha a tela */ });
    return () => { vivo = false; };
  }, []);

  if (!pendente) return null;
  const n = pendente.trimestres.length;
  return (
    <div role="status" className={`flex flex-wrap items-center gap-3 rounded-lg border border-amber-500/20 bg-amber-500/[0.06] px-4 py-2.5 text-sm text-zinc-200 ${className}`}>
      <AlertTriangle size={16} className="shrink-0 text-amber-400" aria-hidden />
      <p className="min-w-0 flex-1">
        <b className="text-amber-400">{n === 1 ? "1 trimestre" : `${n} trimestres`} com SR, PR ou PV desatualizado.</b>{" "}
        O valor gravado não acompanhou a última mudança. Nada será gravado sem a sua aprovação, no Painel do Ciclo.
      </p>
      <Link to={linkDeAprovacao(pendente)} className={classesDoBotao("warning", "sm")}>Revisar e aprovar no Painel</Link>
    </div>
  );
}
