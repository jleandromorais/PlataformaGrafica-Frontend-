import type { ButtonHTMLAttributes, ReactNode } from "react";

type Variant = "primary" | "success" | "danger" | "ghost" | "warning" | "purple";
type Size = "sm" | "md" | "lg";

const variants: Record<Variant, string> = {
  primary: "border border-sky-500/25 bg-sky-500/10 hover:bg-sky-500/15 text-sky-400",
  success: "border border-emerald-500/25 bg-emerald-500/10 hover:bg-emerald-500/15 text-emerald-400",
  danger:  "border border-red-500/25 bg-red-500/10 hover:bg-red-500/15 text-red-400",
  ghost:   "border border-white/[0.07] bg-white/[0.03] hover:bg-white/[0.06] text-zinc-300",
  warning: "border border-amber-500/25 bg-amber-500/10 hover:bg-amber-500/15 text-amber-400",
  purple:  "border border-violet-500/25 bg-violet-500/10 hover:bg-violet-500/15 text-violet-400",
};

const sizes: Record<Size, string> = {
  sm: "px-3 py-1.5 text-xs",
  md: "px-4 py-2 text-sm",
  lg: "px-6 py-3 text-base",
};

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  icon?: ReactNode;
  children: ReactNode;
}

export function Button({
  variant = "primary",
  size = "md",
  loading = false,
  icon,
  children,
  className = "",
  disabled,
  ...rest
}: Props) {
  return (
    <button
      {...rest}
      disabled={disabled || loading}
      className={`
        inline-flex items-center gap-2 rounded-lg font-semibold
        transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed
        ${variants[variant]} ${sizes[size]} ${className}
      `}
    >
      {loading ? (
        <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
      ) : icon}
      {children}
    </button>
  );
}
