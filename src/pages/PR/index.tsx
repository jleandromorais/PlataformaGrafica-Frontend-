import { TrendingUp } from "lucide-react";
import { StatCard } from "../../components/ui/Card";
import { brl, num } from "../../utils/format";

const MOCK = { periodo: "Mai/25 - Jul/25", saldo_a_recuperar: 4171444.04, volume_prospectivo: 142876000, parcela_recuperacao: 0.0292 };

export default function PRPage() {
  const d = MOCK;
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-3">
        <TrendingUp size={22} className="text-pink-400" />
        <h1 className="text-xl font-bold text-white">PR — Parcela de Recuperação</h1>
      </div>
      <p className="text-slate-400 text-sm">Período de Recuperação: <span className="text-slate-200 font-medium">{d.periodo}</span></p>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard label="Saldo a Recuperar" value={brl(d.saldo_a_recuperar)} color="text-emerald-400" />
        <StatCard label="Volume Prospectivo" value={`${num(d.volume_prospectivo)} m³`} color="text-blue-400" />
        <StatCard label="Parcela de Recuperação" value={`R$ ${d.parcela_recuperacao.toFixed(4)} /m³`} color="text-yellow-400" sub="PR = Saldo ÷ Volume" />
      </div>
    </div>
  );
}
