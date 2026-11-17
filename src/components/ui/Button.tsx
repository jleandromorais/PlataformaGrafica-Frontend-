import type { ButtonHTMLAttributes, ReactNode, Ref } from "react";
import { classesDoBotao, type Size, type Variant } from "./estilosBotao";

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  icon?: ReactNode;
  /** Referência ao <button> (no React 19 vem como prop comum). */
  ref?: Ref<HTMLButtonElement>;
  children: ReactNode;
}

export function Button({
  variant = "primary",
  size = "md",
  loading = false,
  icon,
  children,
  ref,
  className = "",
  disabled,
  ...rest
}: Props) {
  return (
    <button
      type="button" // padrão seguro (não envia formulário); quem quiser "submit" passa type e sobrescreve
      {...rest}
      ref={ref}
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
