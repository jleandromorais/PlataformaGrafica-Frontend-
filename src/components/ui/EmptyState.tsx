import type { ReactNode } from "react";
import { Inbox } from "lucide-react";

interface EmptyStateProps {
  icon?: ReactNode;
  label: string;
  hint?: string;
  /** Ação possível a partir daqui (ex.: um link para onde se resolve). */
  acao?: ReactNode;
  className?: string;
}

export function EmptyState({ icon, label, hint, acao, className = "" }: EmptyStateProps) {
  return (
    <div className={`flex flex-col items-center justify-center gap-2 py-8 text-center ${className}`}>
      <span className="text-zinc-700">{icon ?? <Inbox size={28} />}</span>
      <p className="text-sm text-zinc-500">{label}</p>
      {hint && <p className="text-xs text-zinc-600">{hint}</p>}
      {acao && <div className="mt-2">{acao}</div>}
    </div>
  );
}
