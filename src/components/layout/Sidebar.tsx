import { NavLink } from "react-router-dom";
import {
  LayoutDashboard, Calculator, BarChart2, FileSearch,
  FileText, Zap, TrendingUp, DollarSign, PieChart, Activity, Layers,
} from "lucide-react";

const nav = [
  { to: "/",           icon: LayoutDashboard, label: "Dashboard",    color: "text-sky-400" },
  { to: "/pmpv",       icon: Calculator,      label: "PMPV",         color: "text-blue-400" },
  { to: "/cgf",        icon: BarChart2,       label: "CGF",          color: "text-emerald-400" },
  { to: "/auditoria",  icon: FileSearch,      label: "Auditoria",    color: "text-violet-400" },
  { to: "/conciliacao",icon: FileText,        label: "Conciliação",  color: "text-orange-400" },
  { to: "/ret",        icon: Zap,             label: "RET",          color: "text-yellow-400" },
  { to: "/pr",         icon: TrendingUp,      label: "PR",           color: "text-pink-400" },
  { to: "/pv",         icon: DollarSign,      label: "PV",           color: "text-teal-400" },
  { to: "/rpv",        icon: PieChart,        label: "RPV",          color: "text-indigo-400" },
  { to: "/scg",        icon: Layers,          label: "SCG",          color: "text-red-400" },
  { to: "/sr",         icon: Activity,        label: "SR",           color: "text-cyan-400" },
];

export function Sidebar() {
  return (
    <aside className="w-[260px] h-full bg-[#0a0a0b] border-r border-white/[0.06] flex flex-col shrink-0 text-zinc-300 font-sans z-10 relative">
      {/* LOGO AREA */}
      <div className="h-20 flex items-center px-6 border-b border-white/[0.06]">
        <div className="flex items-center gap-3 w-full">
          <div className="w-9 h-9 rounded-xl bg-sky-500/15 flex items-center justify-center ring-1 ring-sky-500/20">
            <span className="text-sky-400 font-bold text-sm tracking-wide">CG</span>
          </div>
          <div className="flex flex-col">
            <span className="text-white font-semibold text-sm tracking-wide leading-tight">Conta Gráfica</span>
            <span className="text-zinc-600 text-[10px] font-bold tracking-widest uppercase mt-0.5">ARPE Plataforma</span>
          </div>
        </div>
      </div>

      {/* NAVIGATION */}
      <nav className="flex-1 px-3 py-6 space-y-0.5 overflow-y-auto" style={{ scrollbarWidth: 'none' }}>
        {nav.map(({ to, icon: Icon, label, color }) => (
          <NavLink
            key={to}
            to={to}
            end={to === "/"}
            className={({ isActive }) => `
              group relative flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors duration-150
              ${isActive
                ? "bg-white/[0.06] text-white"
                : "text-zinc-500 hover:bg-white/[0.03] hover:text-zinc-300"}
            `}
          >
            {({ isActive }) => (
              <>
                <Icon
                  size={16}
                  className={`shrink-0 transition-opacity duration-150 ${isActive ? color : "text-zinc-600 group-hover:text-zinc-400"}`}
                />

                <span className="truncate">{label}</span>

                {isActive && (
                  <span className="absolute right-3 w-1.5 h-1.5 rounded-full bg-sky-400" />
                )}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* FOOTER */}
      <div className="p-4 border-t border-white/[0.06]">
        <div className="flex items-center justify-between px-3 py-2.5 rounded-lg bg-white/[0.03]">
          <div className="flex items-center gap-2.5">
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            <span className="text-xs text-zinc-400 font-medium">Sistema Online</span>
          </div>
          <span className="text-[10px] font-bold text-zinc-600 tracking-wider">v1.0</span>
        </div>
      </div>
    </aside>
  );
}