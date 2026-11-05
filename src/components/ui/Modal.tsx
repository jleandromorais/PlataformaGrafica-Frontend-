import { useEffect, useRef, type ReactNode } from "react";
import { X } from "lucide-react";

/** Janela no centro da tela, com fundo escurecido. Usa o <dialog> do navegador:
 * Esc fecha e o foco fica preso dentro dela sem código extra. */
export function Modal({ aberto, onFechar, icone, titulo, children, rodape }: {
  aberto: boolean;
  onFechar: () => void;
  icone?: ReactNode;
  titulo: string;
  children: ReactNode;
  rodape?: ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const d = ref.current;
    if (aberto && !d?.open) d?.showModal();
    if (!aberto && d?.open) d.close();
  }, [aberto]);

  return (
    <dialog
      ref={ref}
      onClose={onFechar}
      // Clique no fundo escuro (fora da caixa) fecha.
      onClick={(e) => { if (e.target === e.currentTarget) onFechar(); }}
      className="m-auto w-[calc(100%-2rem)] max-w-[400px] rounded-2xl border border-white/[0.08] bg-panel p-0 text-zinc-300 shadow-2xl backdrop:bg-black/60 backdrop:backdrop-blur-[2px]"
    >
      <div className="relative p-6">
        <button type="button" onClick={onFechar} aria-label="Fechar"
          className="absolute right-3 top-3 rounded-lg p-1.5 text-zinc-500 transition-colors hover:bg-white/[0.05] hover:text-white">
          <X size={16} />
        </button>
        {icone && (
          <span className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-primaria-hover text-sky-300" aria-hidden>
            {icone}
          </span>
        )}
        <h2 className="pr-8 text-base font-semibold text-white">{titulo}</h2>
        <div className="mt-2 space-y-2 text-sm leading-relaxed text-zinc-400">{children}</div>
        {rodape && <div className="mt-6 flex flex-col gap-2">{rodape}</div>}
      </div>
    </dialog>
  );
}
