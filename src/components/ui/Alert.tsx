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
  children: ReactNode;
  className?: string;
}

export function Alert({ variant = "info", children, className = "" }: AlertProps) {
  const { role, Icon } = variantMap[variant];
  const s = semantic[role];
  return (
    <div
      role={variant === "error" ? "alert" : "status"}
      className={`flex items-start gap-2 rounded-lg border ${s.border} ${s.bg} px-4 py-2 text-sm ${s.text} ${className}`}
    >
      <Icon size={16} className="mt-0.5 shrink-0" />
      {typeof children === "string" ? <Texto texto={children} /> : <span>{children}</span>}
    </div>
  );
}

/** Texto com quebras de linha; o que vier depois de SEPARADOR_DETALHE fica
 * recolhido em "Detalhes técnicos" (só interessa ao suporte). */
function Texto({ texto }: { texto: string }) {
  const [principal, tecnico] = texto.split(SEPARADOR_DETALHE);
  return (
    <span className="min-w-0 whitespace-pre-line">
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
