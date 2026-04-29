import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ReferenceLine, ResponsiveContainer,
} from "recharts";
import { TrendingUp, TrendingDown, BarChart3, Layers } from "lucide-react";
import { StatCard } from "../../components/ui/Card";
import { brl, num } from "../../utils/format";
import { mockDashboard } from "../../data/mockDashboard";

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  const val: number = payload[0].value;
  return (
    <div className="bg-[#1e293b] border border-slate-600 rounded-lg px-3 py-2 text-sm shadow-xl">
      <p className="text-slate-400 mb-1">{label}</p>
      <p className={`font-bold ${val >= 0 ? "text-emerald-400" : "text-red-400"}`}>
        R$ {val.toFixed(4)}
      </p>
    </div>
  );
};

export default function DashboardPage() {
  const d = mockDashboard;
  return (
    <div className="p-6 space-y-6">
      {/* HEADER */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="bg-[#1e3a5f] rounded-lg px-3 py-1">
              <span className="text-sky-400 font-bold text-sm tracking-wide">ARPE</span>
            </div>
            <h1 className="text-2xl font-bold text-white">Conta Gráfica</h1>
            <span className="text-slate-400">— Tarifa de Gás Canalizado</span>
          </div>
          <p className="text-slate-500 text-sm mt-1">
            Apuração: <span className="text-slate-300 font-medium">{d.periodo_apuracao}</span>
            &nbsp;·&nbsp;
            Recuperação: <span className="text-slate-300 font-medium">{d.periodo_recuperacao}</span>
          </p>
        </div>
        <div className="bg-yellow-400 text-black font-bold text-lg px-5 py-2 rounded-xl shadow">
          {d.versao_cg}
        </div>
      </div>

      {/* STAT CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[#0f3460] rounded-xl p-5 shadow-lg space-y-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">Saldo a Recuperar</p>
            <p className="text-xs text-slate-500">{d.periodo_apuracao}</p>
          </div>
          <p className="text-2xl font-bold text-emerald-400">{brl(d.saldo_a_recuperar)}</p>
          <div className="space-y-1 text-xs text-slate-400">
            <div className="flex justify-between"><span>SCG Atualizado</span><span className="text-slate-300">{brl(d.saldo_cg_atualizado)}</span></div>
            <div className="flex justify-between"><span>Saldo Remanescente</span><span className="text-slate-300">{brl(d.saldo_remanescente)}</span></div>
          </div>
        </div>

        <div className="bg-[#1e293b] rounded-xl p-5 shadow-lg space-y-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">SCG</p>
            <p className="text-xs text-slate-500">{d.periodo_apuracao}</p>
          </div>
          <p className="text-2xl font-bold text-blue-400">{brl(d.scg)}</p>
          <div className="space-y-1 text-xs">
            <div className="flex justify-between"><span className="flex items-center gap-1 text-slate-400"><TrendingDown size={11} className="text-red-400"/>RPV</span><span className="text-red-400">{brl(d.rpv)}</span></div>
            <div className="flex justify-between"><span className="flex items-center gap-1 text-slate-400"><TrendingUp size={11} className="text-emerald-400"/>RET</span><span className="text-emerald-400">{brl(d.ret)}</span></div>
            <div className="flex justify-between"><span className="flex items-center gap-1 text-slate-400"><Layers size={11} className="text-blue-400"/>RP</span><span className="text-slate-300">{brl(d.rp)}</span></div>
          </div>
        </div>

        <div className="bg-[#1e293b] rounded-xl p-5 shadow-lg space-y-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">Saldo Remanescente (SR)</p>
            <p className="text-xs text-slate-500">{d.periodo_apuracao}</p>
          </div>
          <p className="text-2xl font-bold text-violet-400">{brl(d.sr_total)}</p>
          <div className="space-y-1 text-xs text-slate-400">
            {d.sr_por_mes.map((m) => (
              <div key={m.mes} className="flex justify-between">
                <span>{m.mes}</span><span className="text-slate-300">{brl(m.valor)}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-[#1e293b] rounded-xl p-5 shadow-lg space-y-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">Parcela de Recuperação</p>
            <p className="text-xs text-slate-500">{d.periodo_recuperacao}</p>
          </div>
          <p className="text-2xl font-bold text-yellow-400">R$ {d.parcela_recuperacao.toFixed(4)} /m³</p>
          <div className="space-y-1 text-xs text-slate-400">
            <div className="flex justify-between"><span>Saldo a Recuperar</span><span className="text-slate-300">{brl(d.saldo_a_recuperar)}</span></div>
            <div className="flex justify-between"><span>Vol. Prospectivo</span><span className="text-slate-300">{num(d.volume_prospectivo)} m³</span></div>
          </div>
        </div>
      </div>

      {/* GRÁFICO */}
      <div className="bg-[#1e293b] rounded-xl p-5 shadow-lg">
        <div className="flex items-center gap-2 mb-4">
          <BarChart3 size={18} className="text-blue-400" />
          <h2 className="font-semibold text-slate-200">Parcela de Recuperação (R$/m³) — Histórico</h2>
        </div>
        <ResponsiveContainer width="100%" height={260}>
          <LineChart data={d.historico_parcela} margin={{ top: 8, right: 24, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
            <XAxis dataKey="periodo" tick={{ fill: "#94a3b8", fontSize: 11 }} axisLine={{ stroke: "#475569" }} tickLine={false} />
            <YAxis tick={{ fill: "#94a3b8", fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => v.toFixed(2)} />
            <Tooltip content={<CustomTooltip />} />
            <ReferenceLine y={0} stroke="#475569" strokeDasharray="4 2" />
            <Line type="monotone" dataKey="valor" stroke="#38bdf8" strokeWidth={2} dot={{ r: 4, fill: "#38bdf8", strokeWidth: 0 }} activeDot={{ r: 6, fill: "#facc15" }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
