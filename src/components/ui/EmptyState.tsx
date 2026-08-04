import type { ReactNode } from "react";
import { Inbox } from "lucide-react";

interface EmptyStateProps {
  icon?: ReactNode;
  label: string;
  hint?: string;
  className?: string;
}

export function EmptyState({ icon, label, hint, className = "" }: EmptyStateProps) {
  return (
    <div className={`flex flex-col items-center justify-center gap-2 py-8 text-center ${className}`}>
      <span className="text-slate-600">{icon ?? <Inbox size={28} />}</span>
      <p className="text-sm text-slate-500">{label}</p>
      {hint && <p className="text-xs text-slate-600">{hint}</p>}
    </div>
  );
}
