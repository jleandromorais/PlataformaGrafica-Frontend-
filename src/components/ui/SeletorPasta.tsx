import { useEffect, useRef } from "react";
import { FolderOpen } from "lucide-react";

/** Botão grande para escolher uma pasta inteira (com subpastas). */
export function SeletorPasta({ onEscolher, titulo, detalhe, desabilitado }: {
  onEscolher: (arquivos: FileList) => void;
  titulo: string;
  detalhe: string;
  desabilitado?: boolean;
}) {
  const input = useRef<HTMLInputElement>(null);

  // Atributo que permite escolher uma pasta (não existe nos tipos do React).
  useEffect(() => input.current?.setAttribute("webkitdirectory", ""), []);

  return (
    <>
      <input
        ref={input} type="file" multiple className="hidden"
        onChange={(e) => { if (e.target.files?.length) onEscolher(e.target.files); e.target.value = ""; }}
      />
      <button
        type="button" disabled={desabilitado} onClick={() => input.current?.click()}
        className="flex w-full flex-col items-center gap-2 rounded-xl border-2 border-dashed border-white/[0.1] px-5 py-6 text-center transition-colors hover:border-sky-500/40 hover:bg-white/[0.02] disabled:opacity-50"
      >
        <FolderOpen size={20} className="text-zinc-500" />
        <span className="text-sm font-medium text-zinc-200">{titulo}</span>
        <span className="text-xs text-zinc-500">{detalhe}</span>
      </button>
    </>
  );
}
