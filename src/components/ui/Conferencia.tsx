import { Check, X } from "lucide-react";

/** Resultado de uma conferência (auditoria × planilha): ícone + texto + cor,
 * para a cor nunca ser o único sinal. Sem `children`, mostra "confere".
 * `quebrar`: para frases longas (avisos); valores ficam numa linha só. */
export function Conferencia({ confere, children, quebrar = false, className = "" }: {
  confere: boolean;
  children?: React.ReactNode;
  quebrar?: boolean;
  className?: string;
}) {
  const Icone = confere ? Check : X;
  return (
    <span className={`inline-flex gap-1 ${quebrar ? "items-start" : "items-center whitespace-nowrap"} ${confere ? "text-emerald-300" : "text-red-300"} ${className}`}>
      <Icone size={13} strokeWidth={2.5} aria-hidden className={`shrink-0 ${quebrar ? "mt-0.5" : ""}`} />
      {children ?? (confere ? "confere" : "diverge")}
    </span>
  );
}
