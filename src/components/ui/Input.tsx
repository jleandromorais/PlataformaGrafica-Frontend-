import type { InputHTMLAttributes, ReactNode } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: ReactNode;
}

export function Input({ label, error, icon, className = "", ...rest }: InputProps) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && <label className="text-[0.7rem] font-semibold uppercase tracking-[0.08em] text-zinc-500">{label}</label>}
      <div className="relative">
        {icon && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500">{icon}</span>
        )}
        <input
          {...rest}
          className={`
            w-full bg-white/[0.03] border border-white/[0.07] rounded-lg
            text-zinc-100 placeholder-zinc-600 text-sm
            px-3 py-2 ${icon ? "pl-9" : ""}
            focus:outline-none focus:ring-1 focus:ring-sky-500/50 focus:border-transparent
            transition-colors
            ${error ? "border-red-500/50" : ""}
            ${className}
          `}
        />
      </div>
      {error && <span className="text-xs text-red-400">{error}</span>}
    </div>
  );
}

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  options: { value: string; label: string }[];
}

export function Select({ label, options, className = "", ...rest }: SelectProps) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && <label className="text-[0.7rem] font-semibold uppercase tracking-[0.08em] text-zinc-500">{label}</label>}
      <select
        {...rest}
        className={`
          w-full bg-white/[0.03] border border-white/[0.07] rounded-lg
          text-zinc-100 text-sm px-3 py-2
          focus:outline-none focus:ring-1 focus:ring-sky-500/50
          ${className}
        `}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value} className="bg-[#0d0d0f] text-zinc-100">{o.label}</option>
        ))}
      </select>
    </div>
  );
}
