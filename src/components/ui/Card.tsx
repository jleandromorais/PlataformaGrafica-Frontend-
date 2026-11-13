import type { ReactNode } from "react";

interface CardProps {
  title?: string;
  subtitle?: string;
  children: ReactNode;
  className?: string;
  accent?: string;
}

export function Card({ title, subtitle, children, className = "", accent }: CardProps) {
  return (
    <div className={`rounded-xl border border-white/[0.07] bg-panel overflow-hidden ${className}`}>
      {accent && <div className={`h-1 ${accent}`} />}
      {(title || subtitle) && (
        <div className="px-6 py-4 border-b border-white/[0.07]">
          {title && <h3 className="text-base font-semibold text-white">{title}</h3>}
          {subtitle && <p className="mt-0.5 text-sm text-zinc-500">{subtitle}</p>}
        </div>
      )}
      <div className="p-6">{children}</div>
    </div>
  );
}
