import type { ReactNode } from "react";
import { AlertTriangle, CheckCircle2, Info, XCircle } from "lucide-react";
import { semantic } from "../../theme";

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
      <span>{children}</span>
    </div>
  );
}
