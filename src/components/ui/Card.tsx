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
    <div className={`rounded-2xl border border-white/[0.07] bg-gradient-to-b from-white/[0.025] to-transparent bg-[#0d0d0f] overflow-hidden ${className}`}>
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

interface StatCardProps {
  label: string;
  value: string;
  sub?: string;
  color?: string;
  icon?: ReactNode;
}

export function StatCard({ label, value, sub, color = "text-white", icon }: StatCardProps) {
  return (
    <div className="rounded-2xl border border-white/[0.07] bg-gradient-to-b from-white/[0.025] to-transparent bg-[#0d0d0f] p-5 flex flex-col gap-1">
      <div className="flex items-center justify-between">
        <span className="text-[0.7rem] font-semibold uppercase tracking-[0.08em] text-zinc-500">{label}</span>
        {icon && <span className="text-zinc-600">{icon}</span>}
      </div>
      <span className={`text-2xl font-bold tabular-nums ${color}`}>{value}</span>
      {sub && <span className="text-xs text-zinc-600">{sub}</span>}
    </div>
  );
}
