/** Aviso geral no topo do Painel do Ciclo e do Dashboard: há trimestre com SR, PR ou PV desatualizado
 * (GET /cascata/pendente)? Mostra quantos e abre a prévia para aprovar ali mesmo. Se o servidor for antigo
 * (sem a rota) ou nada estiver pendente, não aparece. Não grava nada sozinho. */
import { useEffect, useRef, useState } from "react";
import { AlertTriangle } from "lucide-react";
import { cascataPendente } from "../../api";
import type { Cascata } from "../../types";
import { Button } from "./Button";
import { PreviaCascata } from "./PreviaCascata";

export function AvisoCascataPendente({ className = "", aoMudar }: {
  className?: string;
  /** Diz à página se há algo esperando aprovação (o bloco "Próximo passo" do Painel usa). */
  aoMudar?: (pendente: boolean) => void;
}) {
  const [pendente, setPendente] = useState<Cascata | null>(null);
  const [aberto, setAberto] = useState(false);
  const avisar = useRef(aoMudar);
  useEffect(() => { avisar.current = aoMudar; });

  useEffect(() => {
    let vivo = true;
    cascataPendente()
      .then((c) => {
        if (!vivo) return;
        const p = c.desatualizado || c.pendencias.length > 0 ? c : null;
        setPendente(p);
        avisar.current?.(!!p);
      })
      .catch(() => { /* sem a rota (back antigo) ou fora do ar: o aviso é um extra, não atrapalha a tela */ });
    return () => { vivo = false; };
  }, []);

  if (!pendente) return null;
  if (aberto) {
    return <PreviaCascata cascata={pendente} className={className} aoFechar={() => setAberto(false)} aoAplicar={() => { setPendente(null); aoMudar?.(false); }} />;
  }
  const n = pendente.trimestres.length;
  return (
    <div role="status" className={`flex flex-wrap items-center gap-3 rounded-lg border border-amber-500/20 bg-amber-500/[0.06] px-4 py-2.5 text-sm text-zinc-200 ${className}`}>
      <AlertTriangle size={16} className="shrink-0 text-amber-400" aria-hidden />
      <p className="min-w-0 flex-1">
        <b className="text-amber-400">{n === 1 ? "1 trimestre" : `${n} trimestres`} com SR, PR ou PV desatualizado.</b>{" "}
        O valor gravado não acompanhou a última mudança. Nada será gravado sem a sua aprovação.
      </p>
      <Button variant="warning" size="sm" onClick={() => setAberto(true)}>Ver e aprovar</Button>
    </div>
  );
}
