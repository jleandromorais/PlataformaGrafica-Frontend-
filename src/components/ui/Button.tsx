import type { ButtonHTMLAttributes, ReactNode } from "react";
import { classesDoBotao, type Size, type Variant } from "./estilosBotao";

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
      className={classesDoBotao(variant, size, `disabled:cursor-not-allowed ${variant === "solid" ? "" : "disabled:opacity-50"} ${className}`)}
    >
      {loading ? (
        <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
      ) : icon}
      {children}
    </button>
  );
}
