/** Passo 1 do Painel, um item por trimestre do ciclo que cobre algum mês apurado (Abr a Jun toca
 * Fev a Abr e Mai a Jul). Cada item abre a tela PMPV já no trimestre certo. */
import { Link } from "react-router-dom";
import { num } from "../../utils/format";
import { linkDoPMPV } from "../../utils/periodos";
import { rotuloCurtoDoTrimestre } from "../../utils/rotulos";
import type { TrimestreTocado } from "./trimestresDoCicloTocados";

const mesCurto = (m: string) => m.split("/")[0];

export function DetalheDoPMPV({ trimestres, cicloInicio }: { trimestres: TrimestreTocado[]; cicloInicio: string }) {
  return (
    <ul className="space-y-2.5">
      {trimestres.map((t) => (
        <li key={`${t.trimestre}-${t.ano}`} className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
          <span className="min-w-0 text-zinc-200">
            {t.rotulo} <span className="text-xs text-zinc-500">(cobre {t.mesesCobertos.map(mesCurto).join(", ")})</span>
          </span>
          <span className="flex flex-wrap gap-2">
            {t.valores.map((v) => (
              <span key={v.mes} className={`rounded-md border px-2 py-1 text-xs tabular-nums ${
                v.pmpv ? "border-emerald-400/20 text-zinc-200" : "border-white/[0.07] text-zinc-500"}`}>
                {mesCurto(v.mes)}: {v.pmpv ? num(v.pmpv, 4) : "falta"}
              </span>
            ))}
          </span>
          <Link to={linkDoPMPV(cicloInicio, t.mesesQueFaltam[0] ?? t.mesesCobertos[0])}
            className={`inline-flex min-h-9 items-center rounded-lg px-1 text-sm font-medium ${
              t.pronto ? "text-zinc-400 hover:text-white" : "text-sky-300 hover:text-sky-200"}`}>
            {t.pronto ? "Ver" : `Abrir o PMPV de ${rotuloCurtoDoTrimestre(t.trimestre)}`}
          </Link>
        </li>
      ))}
    </ul>
  );
}
