import { AlertTriangle, Info, XCircle } from "lucide-react";
import { semantic } from "../../theme";
import type { ProblemaArquivo } from "../../types";

const ORDEM: ProblemaArquivo["gravidade"][] = ["erro", "aviso", "info"];

const ESTILO = {
  erro: { ...semantic.negative, Icon: XCircle, titulo: "Precisa corrigir" },
  aviso: { ...semantic.neutral, Icon: AlertTriangle, titulo: "Confira" },
  info: { ...semantic.info, Icon: Info, titulo: "Para saber" },
} as const;

/** Problemas por arquivo, agrupados por gravidade (erro → aviso → info). Ver SPEC_ERROS.md §3. */
export function ListaProblemas({ problemas, className = "" }: { problemas: ProblemaArquivo[]; className?: string }) {
  if (!problemas.length) return null;
  return (
    <div className={`flex flex-col gap-3 ${className}`}>
      {ORDEM.map((g) => {
        const doGrupo = problemas.filter((p) => p.gravidade === g);
        if (!doGrupo.length) return null;
        const { Icon, titulo, text, border, bg } = ESTILO[g];
        return (
          <div key={g} role={g === "erro" ? "alert" : "status"} className={`rounded-lg border ${border} ${bg} px-4 py-3 text-sm`}>
            <p className={`mb-2 flex items-center gap-2 font-semibold ${text}`}>
              <Icon size={16} className="shrink-0" /> {titulo} ({doGrupo.length})
            </p>
            <ul className="flex flex-col gap-2">
              {doGrupo.map((p, i) => (
                <li key={`${p.codigo}-${p.empresa ?? ""}-${p.arquivo}-${i}`} className="text-zinc-200">
                  {(p.empresa || p.arquivo) && (
                    <span className="font-semibold text-white">
                      {[p.empresa, p.arquivo].filter(Boolean).join(" / ")}:{" "}
                    </span>
                  )}
                  {p.mensagem}
                  {p.tecnico && <span className="mt-0.5 block text-xs text-zinc-500">{p.tecnico}</span>}
                </li>
              ))}
            </ul>
          </div>
        );
      })}
    </div>
  );
}
