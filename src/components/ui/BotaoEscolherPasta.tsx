import { useEffect, useRef } from "react";
import { FolderOpen } from "lucide-react";
import { Button } from "./Button";

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
      <Button variant="primary" onClick={() => input.current?.click()} disabled={desabilitado}>
        <FolderOpen size={16} aria-hidden /> {rotulo}
      </Button>
    </>
  );
}
