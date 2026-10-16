import { useRef, useState, type ReactNode } from "react";
import { FileText, Upload, X } from "lucide-react";

/** Área para escolher ou arrastar arquivos, com a lista do que foi escolhido. */
export function SeletorArquivos({ arquivos, onChange, accept, titulo, dica, etiqueta, desabilitado }: {
  arquivos: File[];
  onChange: (arquivos: File[]) => void;
  accept: string;              // ex.: ".xlsx,.xls,.csv"
  titulo: string;
  dica?: string;
  /** Etiqueta por arquivo (ex.: tipo reconhecido pelo nome). */
  etiqueta?: (arquivo: File) => ReactNode;
  desabilitado?: boolean;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [arrastando, setArrastando] = useState(false);

  const adicionar = (novos: FileList | null) => {
    if (!novos?.length) return;
    const porNome = new Map(arquivos.map((a) => [a.name, a]));
    Array.from(novos).forEach((a) => porNome.set(a.name, a)); // mesmo nome substitui
    onChange([...porNome.values()]);
  };

  return (
    <div className="space-y-3">
      <button
        type="button"
        disabled={desabilitado}
        onClick={() => input.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setArrastando(true); }}
        onDragLeave={() => setArrastando(false)}
        onDrop={(e) => { e.preventDefault(); setArrastando(false); adicionar(e.dataTransfer.files); }}
        className={`flex w-full flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed px-5 py-6 text-center transition-colors disabled:opacity-50 ${
          arrastando ? "border-sky-500/60 bg-sky-500/[0.06]" : "border-white/[0.1] hover:border-sky-500/40 hover:bg-white/[0.02]"
        }`}
      >
        <Upload size={20} className="text-zinc-500" />
        <span className="text-sm font-medium text-zinc-200">{titulo}</span>
        <span className="text-xs text-zinc-500">{dica ?? "Clique para escolher ou arraste os arquivos aqui"}</span>
      </button>
      <input
        ref={input} type="file" multiple accept={accept} className="hidden"
        onChange={(e) => { adicionar(e.target.files); e.target.value = ""; }}
      />
      {arquivos.length > 0 && (
        <ul className="space-y-1.5">
          {arquivos.map((a) => (
            <li key={a.name} className="flex items-center gap-2 rounded-lg border border-white/[0.05] bg-white/[0.015] px-3 py-2 text-sm">
              <FileText size={14} className="shrink-0 text-zinc-500" />
              <span className="min-w-0 flex-1 truncate text-zinc-200" title={a.name}>{a.name}</span>
              {etiqueta?.(a)}
              <button
                type="button" disabled={desabilitado}
                onClick={() => onChange(arquivos.filter((x) => x !== a))}
                aria-label={`Remover ${a.name}`}
                className="rounded p-0.5 text-zinc-600 transition-colors hover:bg-red-500/10 hover:text-red-400"
              >
                <X size={14} />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
