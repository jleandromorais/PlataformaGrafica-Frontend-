import type { ReactNode } from "react";
import { AlertTriangle, CheckCircle2, Info, XCircle } from "lucide-react";
import { semantic } from "../../theme";
import { SEPARADOR_DETALHE } from "../../api/client";

type AlertVariant = "error" | "success" | "warning" | "info";

const variantMap: Record<AlertVariant, { role: keyof typeof semantic; Icon: typeof Info }> = {
  error: { role: "negative", Icon: XCircle },
  success: { role: "positive", Icon: CheckCircle2 },
  warning: { role: "neutral", Icon: AlertTriangle },
  info: { role: "info", Icon: Info },
};

interface AlertProps {
  variant?: AlertVariant;
  /** Frase curta na cor do aviso; o corpo fica em cinza para o olho ir ao conteúdo. */
  titulo?: string;
  /** Pendências, uma por item. Com 1 item vira frase; com 2 ou mais, lista com marcador. */
  itens?: ReactNode[];
  children?: ReactNode;
  className?: string;
}

/** Aviso em bloco. Só o ícone e o título levam a cor (âmbar, vermelho…); o texto
 * fica em zinc-200, que é claro no tema escuro e escuro no claro. */
export function Alert({ variant = "info", titulo, itens, children, className = "" }: AlertProps) {
  const { role, Icon } = variantMap[variant];
  const s = semantic[role];
  const lista = itens?.filter((i) => i !== null && i !== undefined && i !== false && i !== "") ?? [];
  return (
    <div
      role={variant === "error" ? "alert" : "status"}
      className={`flex items-start gap-2.5 rounded-lg border ${s.border} ${s.bg} px-4 py-2.5 text-sm text-zinc-200 ${className}`}
    >
      <Icon size={16} className={`mt-0.5 shrink-0 ${s.text}`} aria-hidden />
      <div className="min-w-0 flex-1 space-y-1">
        {titulo && <p className={`font-semibold ${s.text}`}>{titulo}</p>}
        {typeof children === "string" ? <Texto texto={children} /> : children}
        {lista.length === 1 && <p>{lista[0]}</p>}
        {lista.length > 1 && (
          <ul className="list-disc space-y-1 pl-4">
            {lista.map((item, i) => <li key={i}>{item}</li>)}
          </ul>
        )}
      </div>
    </div>
  );
}

/** Texto com quebras de linha; o que vier depois de SEPARADOR_DETALHE fica
 * recolhido em "Detalhes técnicos" (só interessa ao suporte). */
export function Texto({ texto }: { texto: string }) {
  const [principal, tecnico] = texto.split(SEPARADOR_DETALHE);
  return (
    <span className="block min-w-0 whitespace-pre-line">
      {principal}
      {tecnico && (
        <details className="mt-1 text-xs opacity-70">
          <summary className="cursor-pointer select-none">Detalhes técnicos</summary>
          <span className="break-all">{tecnico}</span>
        </details>
      )}
    </span>
  );
}
