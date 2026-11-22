import type { ReactNode } from "react";
import { AlertTriangle, CheckCircle2, CircleDashed } from "lucide-react";
import type { Situacao } from "../../utils/pastaCiclo";

/** Ícone de cada situação (pronto, atenção, falta), o mesmo no mapa da pasta e nos passos. */
export const ICONE: Record<Situacao, ReactNode> = {
  ok: <CheckCircle2 size={18} className="text-emerald-400" aria-label="Pronto" />,
  atencao: <AlertTriangle size={18} className="text-amber-300" aria-label="Precisa de atenção" />,
  falta: <CircleDashed size={18} className="text-zinc-500" aria-label="Falta" />,
};
