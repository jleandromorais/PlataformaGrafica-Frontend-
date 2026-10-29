import type { ReactNode } from "react";
import { MESES_ABREV, anoValido } from "../../utils/periodos";

const LABEL = "text-xs font-semibold text-zinc-400";

/** Escolha de mês (Jan…Dez) + ano, no formato de período "Mmm/AAAA". */
export function SeletorMes({ mes, ano, onChange, status }: {
  mes: string;
  ano: number;
  onChange: (mes: string, ano: number) => void;
  /** Texto à direita (ex.: "Valores carregados do banco"). */
  status?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-end gap-x-6 gap-y-4">
      <div>
        <p className={`${LABEL} mb-2`}>Mês</p>
        <div className="flex flex-wrap gap-1.5">
          {MESES_ABREV.map((m) => (
            <button
              key={m} type="button" onClick={() => onChange(m, ano)} aria-pressed={mes === m}
              className={`w-12 rounded-lg py-2 text-xs font-semibold transition-colors ${
                mes === m ? "border border-sky-500/40 bg-white/[0.08] text-sky-300"
                  : "border border-white/[0.07] bg-white/[0.02] text-zinc-400 hover:text-zinc-200"
              }`}
            >
              {m}
            </button>
          ))}
        </div>
      </div>
      <div>
        <label htmlFor="seletor-ano" className={`${LABEL} mb-2 block`}>Ano</label>
        <input
          id="seletor-ano" type="number" value={ano}
          onChange={(e) => onChange(mes, Number(e.target.value))}
          aria-invalid={!anoValido(ano)}
          className={`w-24 rounded-lg border bg-white/[0.03] px-3 py-2 text-sm text-zinc-100 tabular-nums transition-colors focus:border-transparent focus:outline-none focus:ring-1 focus:ring-sky-500/50 ${
            anoValido(ano) ? "border-white/[0.07]" : "border-red-500/50"
          }`}
        />
      </div>
      {status && <div className="pb-2 text-sm text-zinc-400" aria-live="polite">{status}</div>}
    </div>
  );
}
