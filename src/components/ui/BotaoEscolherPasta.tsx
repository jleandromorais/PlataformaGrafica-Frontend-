import { useEffect, useRef } from "react";
import { FolderOpen } from "lucide-react";

/** Botão "Escolher a pasta": abre o seletor de pasta do sistema (com subpastas), como
 * alternativa a arrastar. O Chrome pode perguntar "Enviar X arquivos para este site?";
 * nada é enviado nessa hora, só os arquivos ficam disponíveis para a página.
 * Lista vazia = a pasta escolhida não tem arquivos (quem chama mostra o aviso). */
export function BotaoEscolherPasta({ onEscolher, desabilitado, rotulo = "Escolher a pasta" }: {
  onEscolher: (arquivos: FileList) => void;
  desabilitado?: boolean;
  rotulo?: string;
}) {
  const input = useRef<HTMLInputElement>(null);

  // Atributo que permite escolher uma pasta (não existe nos tipos do React).
  useEffect(() => input.current?.setAttribute("webkitdirectory", ""), []);

  return (
    <>
      <input
        ref={input} type="file" multiple className="hidden" tabIndex={-1} aria-hidden
        // value = "": deixa escolher a mesma pasta de novo.
        onChange={(e) => { if (e.target.files) onEscolher(e.target.files); e.target.value = ""; }}
      />
      <button type="button" onClick={() => input.current?.click()} disabled={desabilitado}
        className="flex items-center gap-2 rounded-xl border border-sky-500/40 px-4 py-2 text-sm font-semibold text-sky-200 hover:bg-sky-500/10 disabled:opacity-50">
        <FolderOpen size={16} aria-hidden /> {rotulo}
      </button>
    </>
  );
}
