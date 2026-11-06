import { useRef, useState, type DragEvent, type ReactNode } from "react";
import { FolderDown } from "lucide-react";
import { pegarSoltura, type Soltura } from "../../utils/soltarPasta";

/** Área tracejada para ARRASTAR a pasta: não dispara o aviso de permissão do Chrome.
 * `children` fica dentro da área (ex.: o botão "Escolher pasta", para quem não arrasta). */
export function AreaSoltarPasta({ texto, onSoltar, desabilitado, children }: {
  texto: string;
  onSoltar: (s: Soltura) => void;
  desabilitado?: boolean;
  children?: ReactNode;
}) {
  const [sobre, setSobre] = useState(false);
  const dentro = useRef(0); // dragenter/dragleave disparam também nos filhos: conta os níveis

  // Sempre segura o arquivo arrastado (senão o navegador sai da página para abri-lo);
  // ocupada, só não aceita.
  const temArquivo = (e: DragEvent) => e.dataTransfer.types.includes("Files");

  return (
    <div
      onDragEnter={(e) => {
        if (!temArquivo(e)) return;
        e.preventDefault();
        dentro.current++;
        if (!desabilitado) setSobre(true);
      }}
      onDragOver={(e) => { if (!temArquivo(e)) return; e.preventDefault(); e.dataTransfer.dropEffect = desabilitado ? "none" : "copy"; }}
      onDragLeave={() => { dentro.current = Math.max(0, dentro.current - 1); if (!dentro.current) setSobre(false); }}
      onDrop={(e) => {
        dentro.current = 0;
        setSobre(false);
        if (!temArquivo(e)) return;
        e.preventDefault();
        if (!desabilitado) onSoltar(pegarSoltura(e.dataTransfer)); // síncrono: depois do evento o navegador esvazia o dataTransfer
      }}
      className={`flex flex-col items-center gap-3 rounded-xl border-2 border-dashed px-5 py-6 text-center transition-colors ${
        sobre ? "border-sky-400/70 bg-sky-500/10" : "border-white/[0.1]"} ${desabilitado ? "opacity-50" : ""}`}
    >
      <FolderDown size={22} className={sobre ? "text-sky-300" : "text-zinc-500"} aria-hidden />
      <p className="text-sm font-medium text-zinc-200">{sobre ? "Solte a pasta para ler" : texto}</p>
      {children}
    </div>
  );
}
