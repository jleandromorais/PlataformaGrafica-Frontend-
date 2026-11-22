/** Bloco de trabalho subordinado a um passo do Painel: recolhido por padrão e aberto sozinho
 * quando o próximo passo é um dos dele. Usa <details>, então abre e fecha pelo teclado e o
 * `irParaSecao` (rolar até o bloco) abre o que estiver fechado. O conteúdo fica montado mesmo
 * recolhido: nada do que o analista já fez (pasta, prévia, planilha) se perde ao fechar. */
import { useState, type ReactNode } from "react";
import { ChevronRight } from "lucide-react";

export function SubpassoRecolhivel({ id, titulo, passos, icone, abrirPorPadrao, children }: {
  id: string;
  titulo: string;
  /** Os passos a que o bloco pertence, ex.: "passos 2 a 5", "opcional, passo 2". */
  passos: string;
  icone: ReactNode;
  /** true quando o próximo passo é um dos deste bloco. */
  abrirPorPadrao: boolean;
  children: ReactNode;
}) {
  const [aberto, setAberto] = useState(abrirPorPadrao);
  // Só abre sozinho (o próximo passo mudou para cá); nunca fecha o que o analista abriu.
  const [anterior, setAnterior] = useState(abrirPorPadrao);
  if (anterior !== abrirPorPadrao) {
    setAnterior(abrirPorPadrao);
    if (abrirPorPadrao) setAberto(true);
  }

  return (
    <details id={id} open={aberto} onToggle={(e) => setAberto(e.currentTarget.open)} className="group scroll-mt-4">
      <summary className="flex min-h-12 cursor-pointer list-none items-center gap-3 rounded-xl border border-white/[0.07] bg-panel px-5 py-3 text-sm font-semibold text-zinc-100 hover:bg-white/[0.03] group-open:rounded-b-none group-open:border-b-0 [&::-webkit-details-marker]:hidden">
        <ChevronRight size={16} className="shrink-0 text-zinc-500 transition-transform group-open:rotate-90" aria-hidden />
        <span className="text-zinc-400" aria-hidden>{icone}</span>
        <span>{titulo}</span>
        <span className="text-xs font-normal text-zinc-500">({passos})</span>
        <span className="ml-auto hidden text-xs font-normal text-zinc-500 group-open:hidden sm:inline">Abrir</span>
      </summary>
      <div className="rounded-b-xl border border-t-0 border-white/[0.07] bg-panel p-3 sm:p-4">{children}</div>
    </details>
  );
}
