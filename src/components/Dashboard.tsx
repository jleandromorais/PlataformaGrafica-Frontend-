import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  ResponsiveContainer,
} from "recharts";
import { TrendingUp, TrendingDown, BarChart3, Layers } from "lucide-react";
import { mockDashboard } from "../data/mockDashboard";
import { MetricCard } from "./MetricCard";

function brl(value: number, decimals = 2): string {
  return value.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

function num(value: number): string {
  return value.toLocaleString("pt-BR");
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const val: number = payload[0].value;
    return (
      <div className="bg-[#1e293b] border border-slate-600 rounded-lg px-3 py-2 text-sm shadow-xl">
        <p className="text-slate-400 mb-1">{label}</p>
        <p className={`font-bold ${val >= 0 ? "text-emerald-400" : "text-red-400"}`}>
          R$ {val.toFixed(4)}
        </p>
      </div>
    );
  }
  return null;
};

export function Dashboard() {
  const d = mockDashboard;

  return (
    <div className="min-h-screen bg-[#0f172a] text-slate-100 p-6 space-y-6">

      {/* HEADER */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="bg-[#1e3a5f] rounded-lg px-3 py-1">
              <span className="text-[#38bdf8] font-bold text-sm tracking-wide">ARPE</span>
            </div>
            <h1 className="text-2xl font-bold text-white">Conta Gráfica</h1>
            <span className="text-slate-400 text-lg">— Tarifa de Gás Canalizado</span>
          </div>
          <p className="text-slate-500 text-sm mt-1">
            Período de Apuração: <span className="text-slate-300 font-medium">{d.periodo_apuracao}</span>
            &nbsp;·&nbsp;
            Período de Recuperação: <span className="text-slate-300 font-medium">{d.periodo_recuperacao}</span>
          </p>
        </div>
        <div className="bg-yellow-400 text-black font-bold text-lg px-5 py-2 rounded-xl shadow">
          {d.versao_cg}
        </div>
      </div>

      {/* CARDS — LINHA 1 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">

        <MetricCard
          title="Saldo a Recuperar"
          subtitle={d.periodo_apuracao}
          value={brl(d.saldo_a_recuperar)}
          valueColor="text-emerald-400"
          bg="bg-[#0f3460]"
        >
          <div className="space-y-1 text-xs text-slate-400">
            <div className="flex justify-between">
              <span>SCG Atualizado</span>
              <span className="text-slate-300">{brl(d.saldo_cg_atualizado)}</span>
            </div>
            <div className="flex justify-between">
              <span>Saldo Remanescente</span>
              <span className="text-slate-300">{brl(d.saldo_remanescente)}</span>
            </div>
          </div>
        </MetricCard>

        <MetricCard
          title="SCG — Saldo Conta Gráfica"
          subtitle={d.periodo_apuracao}
          value={brl(d.scg)}
          valueColor="text-blue-400"
          bg="bg-[#1e293b]"
        >
          <div className="space-y-1 text-xs">
            <div className="flex justify-between">
              <span className="flex items-center gap-1 text-slate-400">
                <TrendingDown size={11} className="text-red-400" /> RPV
              </span>
              <span className="text-red-400">{brl(d.rpv)}</span>
            </div>
            <div className="flex justify-between">
              <span className="flex items-center gap-1 text-slate-400">
                <TrendingUp size={11} className="text-emerald-400" /> RET
              </span>
              <span className="text-emerald-400">{brl(d.ret)}</span>
            </div>
            <div className="flex justify-between">
              <span className="flex items-center gap-1 text-slate-400">
                <Layers size={11} className="text-blue-400" /> RP
              </span>
              <span className="text-slate-300">{brl(d.rp)}</span>
            </div>
          </div>
        </MetricCard>

        <MetricCard
          title="Saldo Remanescente (SR)"
          subtitle={d.periodo_apuracao}
          value={brl(d.sr_total)}
          valueColor="text-violet-400"
          bg="bg-[#1e293b]"
        >
          <div className="space-y-1 text-xs text-slate-400">
            {d.sr_por_mes.map((item) => (
              <div key={item.mes} className="flex justify-between">
                <span>{item.mes}</span>
                <span className="text-slate-300">{brl(item.valor)}</span>
              </div>
            ))}
          </div>
        </MetricCard>

        <MetricCard
          title="Parcela de Recuperação"
          subtitle={d.periodo_recuperacao}
          value={`R$ ${d.parcela_recuperacao.toFixed(4)} /m³`}
          valueColor="text-yellow-400"
          bg="bg-[#1e293b]"
        >
          <div className="space-y-1 text-xs text-slate-400">
            <div className="flex justify-between">
              <span>Saldo a Recuperar</span>
              <span className="text-slate-300">{brl(d.saldo_a_recuperar)}</span>
            </div>
            <div className="flex justify-between">
              <span>Volume Prospectivo</span>
              <span className="text-slate-300">{num(d.volume_prospectivo)} m³</span>
            </div>
          </div>
        </MetricCard>
      </div>

      {/* GRÁFICO */}
      <div className="bg-[#1e293b] rounded-xl p-5 shadow-lg">
        <div className="flex items-center gap-2 mb-4">
          <BarChart3 size={18} className="text-blue-400" />
          <h2 className="font-semibold text-slate-200">
            Parcela de Recuperação (R$/m³) — Histórico
          </h2>
        </div>
        <ResponsiveContainer width="100%" height={260}>
          <LineChart data={d.historico_parcela} margin={{ top: 8, right: 24, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
            <XAxis
              dataKey="periodo"
              tick={{ fill: "#94a3b8", fontSize: 11 }}
              axisLine={{ stroke: "#475569" }}
              tickLine={false}
            />
            <YAxis
              tick={{ fill: "#94a3b8", fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v) => v.toFixed(2)}
            />
            <Tooltip content={<CustomTooltip />} />
            <ReferenceLine y={0} stroke="#475569" strokeDasharray="4 2" />
            <Line
              type="monotone"
              dataKey="valor"
              stroke="#38bdf8"
              strokeWidth={2}
              dot={{ r: 4, fill: "#38bdf8", strokeWidth: 0 }}
              activeDot={{ r: 6, fill: "#facc15" }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* FOOTER */}
      <p className="text-center text-xs text-slate-600 pb-2">
        ARPE · Plataforma Conta Gráfica · {new Date().getFullYear()}
      </p>
    </div>
  );
}
