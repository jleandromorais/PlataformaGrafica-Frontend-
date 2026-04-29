import { Activity } from "lucide-react";
import { Card, StatCard } from "../../components/ui/Card";
import { brl } from "../../utils/format";

const MOCK = {
  periodo: "Jan/25 - Mar/25",
  sr_total: 188859.12,
  sr_por_mes: [
    { mes: "Janeiro/25", sr: 126264.56, cgr: 1200000, cgf: 1100000, rpv: 100000 },
    { mes: "Fevereiro/25", sr: 21115.75, cgr: 980000, cgf: 960000, rpv: 20000 },
    { mes: "Março/25", sr: 41478.81, cgr: 1050000, cgf: 1010000, rpv: 40000 },
  ],
};

export default function SRPage() {
  const d = MOCK;
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-3">
        <Activity size={22} className="text-cyan-400" />
        <h1 className="text-xl font-bold text-white">SR — Saldo Remanescente</h1>
      </div>
      <StatCard label="SR Total" value={brl(d.sr_total)} color="text-cyan-400" sub={d.periodo} />
      <Card title="Breakdown por Mês">
        <div className="space-y-3">
          {d.sr_por_mes.map((m) => (
            <div key={m.mes} className="flex items-center justify-between border-b border-slate-700 pb-3">
              <span className="text-slate-300 font-medium w-32">{m.mes}</span>
              <span className="text-xs text-slate-500">CGR: <span className="text-blue-400">{brl(m.cgr)}</span></span>
              <span className="text-xs text-slate-500">CGF: <span className="text-emerald-400">{brl(m.cgf)}</span></span>
              <span className="text-xs text-slate-500">RPV: <span className="text-violet-400">{brl(m.rpv)}</span></span>
              <span className="font-bold text-cyan-400">{brl(m.sr)}</span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
