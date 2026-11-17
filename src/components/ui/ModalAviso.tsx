import type { ReactNode, RefObject } from "react";
import { AlertTriangle, Info, XCircle } from "lucide-react";
import { Modal } from "./Modal";
import { Texto } from "./Alert";
import { Button } from "./Button";

export type VarianteAviso = "info" | "atencao" | "erro";

// Mesmo cartão em todas as variantes; só o ícone (e a cor dele) muda.
const ICONE: Record<VarianteAviso, ReactNode> = {
  info: <Info size={20} />,
  atencao: <AlertTriangle size={20} className="text-amber-300" />,
  erro: <XCircle size={20} className="text-red-300" />,
};

/** Aviso que pede uma decisão: cartão centralizado, ícone no topo, título, texto,
 * botão principal de largura total e "Cancelar"/"Fechar" embaixo. Texto em string
 * aceita o "Detalhes técnicos" recolhido do mensagemDeErro, como no <Alert>. */
export function ModalAviso({
  aberto, onFechar, variante = "info", icone, titulo, children, acao, rotuloFechar = "Fechar", voltarFoco,
}: {
  aberto: boolean;
  onFechar: () => void;
  variante?: VarianteAviso;
  icone?: ReactNode;          // troca o ícone da variante (ex.: escudo, disquete)
  titulo: string;
  children: ReactNode;
  acao?: { rotulo: string; onClick: () => void };
  rotuloFechar?: string;
  voltarFoco?: RefObject<HTMLElement | null>;
}) {
  return (
    <Modal aberto={aberto} onFechar={onFechar} icone={icone ?? ICONE[variante]} titulo={titulo} voltarFoco={voltarFoco}
      rodape={<>
        {acao && (
          <Button variant="solid" data-foco-inicial onClick={acao.onClick} className="w-full">
            {acao.rotulo}
          </Button>
        )}
        <button type="button" onClick={onFechar} data-foco-inicial={acao ? undefined : true}
          className="w-full rounded-xl px-4 py-2.5 text-sm font-medium text-zinc-400 hover:bg-white/[0.04] hover:text-white">
          {rotuloFechar}
        </button>
      </>}>
      {typeof children === "string" ? <div><Texto texto={children} /></div> : children}
    </Modal>
  );
}
