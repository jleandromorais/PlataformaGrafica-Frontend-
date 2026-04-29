import { PieChart } from "lucide-react";
import { StatCard } from "../../components/ui/Card";
import { brl } from "../../utils/format";

export default function RPVPage() {
  const cgr = 3982585;
  const cgf = 5172827.66;
  const rpv = cgr - cgf;
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-3">
        <PieChart size={22} className="text-indigo-400" />
        <h1 className="text-xl font-bold text-white">RPV — Recuperação do Preço de Venda</h1>
      </div>
      <div className="bg-[#1e1b4b] rounded-xl p-6 flex flex-wrap gap-8 items-center">
        <div className="text-center">
          <p className="text-xs text-slate-400 mb-1">CGR (Auditoria)</p>
          <p className="text-xl font-bold text-blue-400">{brl(cgr)}</p>
        </div>
        <span className="text-3xl font-bold text-red-400">−</span>
        <div className="text-center">
          <p className="text-xs text-slate-400 mb-1">CGF (Volume Faturado)</p>
          <p className="text-xl font-bold text-emerald-400">{brl(cgf)}</p>
        </div>
        <span className="text-3xl font-bold text-yellow-400">=</span>
        <div className="text-center">
          <p className="text-xs text-slate-400 mb-1">RPV</p>
          <p className="text-2xl font-bold text-violet-400">{brl(rpv)}</p>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-4">
        <StatCard label="CGR" value={brl(cgr)} color="text-blue-400" />
        <StatCard label="CGF" value={brl(cgf)} color="text-emerald-400" />
        <StatCard label="RPV = CGR − CGF" value={brl(rpv)} color="text-violet-400" />
      </div>
    </div>
  );
}
