import { PieChart } from "lucide-react";
import { StatCard } from "../../components/ui/Card";
import { brl } from "../../utils/format";

export default function RPVPage() {
  const cgr = 3982585;
  const cgf = 5172827.66;
  const rpv = cgr - cgf;
  return (
    <div className="min-h-screen bg-[#050505] px-6 py-8 sm:px-10">
      <div className="mx-auto flex w-full max-w-[1600px] flex-col gap-6">
        <div>
          <div className="flex items-center gap-3">
            <span
              className="flex h-9 w-9 items-center justify-center rounded-xl"
              style={{ backgroundColor: "#818cf817", color: "#818cf8" }}
            >
              <PieChart size={16} />
            </span>
            <h1 className="text-[1.75rem] font-bold tracking-tight text-white">RPV</h1>
          </div>
          <p className="mt-1 ml-12 text-sm text-zinc-500">Recuperação do Preço de Venda — RPV = CGR − CGF</p>
        </div>

        <div className="rounded-2xl border border-white/[0.07] bg-gradient-to-b from-white/[0.025] to-transparent bg-[#0d0d0f] p-7 flex flex-wrap gap-8 items-center justify-center">
          <div className="text-center">
            <p className="text-[0.7rem] font-semibold uppercase tracking-[0.08em] text-zinc-500 mb-1">CGR (Auditoria)</p>
            <p className="text-xl font-bold tabular-nums text-sky-400">{brl(cgr)}</p>
          </div>
          <span className="text-3xl font-bold text-zinc-600">−</span>
          <div className="text-center">
            <p className="text-[0.7rem] font-semibold uppercase tracking-[0.08em] text-zinc-500 mb-1">CGF (Volume Faturado)</p>
            <p className="text-xl font-bold tabular-nums text-emerald-400">{brl(cgf)}</p>
          </div>
          <span className="text-3xl font-bold text-zinc-600">=</span>
          <div className="text-center">
            <p className="text-[0.7rem] font-semibold uppercase tracking-[0.08em] text-zinc-500 mb-1">RPV</p>
            <p className={`text-2xl font-bold tabular-nums ${rpv < 0 ? "text-red-400" : "text-violet-400"}`}>{brl(rpv)}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          <StatCard label="CGR" value={brl(cgr)} color="text-sky-400" />
          <StatCard label="CGF" value={brl(cgf)} color="text-emerald-400" />
          <StatCard label="RPV = CGR − CGF" value={brl(rpv)} color={rpv < 0 ? "text-red-400" : "text-violet-400"} />
        </div>
      </div>
    </div>
  );
}
