import { ReactNode } from "react";

interface CardProps {
  title?: string;
  subtitle?: string;
  children: ReactNode;
  className?: string;
  accent?: string;
}

export function Card({ title, subtitle, children, className = "", accent }: CardProps) {
  return (
    <div className={`bg-[#1e293b] rounded-xl shadow-lg overflow-hidden ${className}`}>
      {accent && <div className={`h-1 ${accent}`} />}
      {(title || subtitle) && (
        <div className="px-5 pt-4 pb-2">
          {title && <h3 className="font-semibold text-slate-100 text-sm uppercase tracking-wider">{title}</h3>}
          {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
        </div>
      )}
      <div className="px-5 pb-5 pt-2">{children}</div>
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
    <div className="bg-[#1e293b] rounded-xl p-4 flex flex-col gap-1 shadow">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">{label}</span>
        {icon && <span className="text-slate-500">{icon}</span>}
      </div>
      <span className={`text-2xl font-bold ${color}`}>{value}</span>
      {sub && <span className="text-xs text-slate-500">{sub}</span>}
    </div>
  );
}
