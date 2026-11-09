/** Bloco de fechamento de uma prova real: as linhas da conta e, no pé, a faixa com o resultado
 * (confere / não confere + diferença), em ícone + texto + cor (nunca só a cor). Só mostra. */
import type { ReactNode } from "react";
import { Conferencia } from "./Conferencia";

export interface LinhaFechamento {
  rotulo: ReactNode;
  valor: ReactNode;
  /** "total": linha do resultado da conta (com filete e negrito); "info": só informativa (apagada). */
  tipo?: "normal" | "total" | "info";
  /** Cor do valor (classe do Tailwind). */
  cor?: string;
}

export function Fechamento({ titulo, linhas, resultado, className = "" }: {
  titulo?: ReactNode;
  linhas: LinhaFechamento[];
  resultado?: { rotulo: ReactNode; confere: boolean; texto: ReactNode };
  className?: string;
}) {
  return (
    <div className={`overflow-hidden rounded-lg border border-white/[0.07] bg-white/[0.02] text-sm tabular-nums ${className}`}>
      {titulo && <p className="border-b border-white/[0.06] px-4 py-2 text-[0.7rem] font-semibold uppercase tracking-wide text-zinc-400">{titulo}</p>}
      <dl className="space-y-1.5 px-4 py-3">
        {linhas.map((l, i) => (
          <div key={i} className={`flex justify-between gap-4 ${l.tipo === "total" ? "border-t border-white/[0.08] pt-1.5" : ""}`}>
            <dt className={l.tipo === "total" ? "font-semibold text-zinc-200" : l.tipo === "info" ? "text-zinc-500" : "text-zinc-400"}>{l.rotulo}</dt>
            <dd className={`text-right ${l.cor ?? (l.tipo === "total" ? "font-semibold text-sky-200" : l.tipo === "info" ? "text-zinc-500" : "text-zinc-200")}`}>{l.valor}</dd>
          </div>
        ))}
      </dl>
      {resultado && (
        <dl className={`flex items-center justify-between gap-4 border-t px-4 py-3 ${resultado.confere
          ? "border-emerald-400/20 bg-emerald-400/[0.06]"
          : "border-red-400/30 bg-red-400/[0.08]"}`}>
          <dt className="font-semibold text-zinc-100">{resultado.rotulo}</dt>
          <dd><Conferencia confere={resultado.confere} className="text-base font-semibold">{resultado.texto}</Conferencia></dd>
        </dl>
      )}
    </div>
  );
}
