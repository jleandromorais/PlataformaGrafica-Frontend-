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
    <aside className="w-[260px] h-full bg-[#0B1120] border-r border-slate-800/80 flex flex-col shrink-0 text-slate-300 font-sans z-10 relative">
      {/* LOGO AREA */}
      <div className="h-20 flex items-center px-6 border-b border-slate-800/80">
        <div className="flex items-center gap-3 w-full">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-sky-500 to-blue-600 flex items-center justify-center shadow-[0_0_16px_rgba(56,189,248,0.25)] ring-1 ring-white/10">
            <span className="text-white font-bold text-sm tracking-wide">CG</span>
          </div>
          <div className="flex flex-col">
            <span className="text-slate-100 font-semibold text-sm tracking-wide leading-tight">Conta Gráfica</span>
            <span className="text-slate-500 text-[10px] font-bold tracking-widest uppercase mt-0.5">ARPE Plataforma</span>
          </div>
        </div>
      </div>

      {/* NAVIGATION */}
      <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto" style={{ scrollbarWidth: 'none' }}>
        {nav.map(({ to, icon: Icon, label, color }) => (
          <NavLink
            key={to}
            to={to}
            end={to === "/"}
            className={({ isActive }) => `
              group relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-300
              ${isActive
                ? "bg-slate-800/60 text-white shadow-sm ring-1 ring-slate-700/50"
                : "text-slate-400 hover:bg-slate-800/30 hover:text-slate-200"}
            `}
          >
            {({ isActive }) => (
              <>
                {/* Icon Wrapper */}
                <div className={`
                  flex items-center justify-center w-8 h-8 rounded-lg transition-colors duration-300
                  ${isActive ? "bg-[#0B1120] ring-1 ring-slate-700/50" : "bg-transparent group-hover:bg-[#0B1120]/50"}
                `}>
                  <Icon 
                    size={16} 
                    className={`${color} transition-all duration-300 
                    ${isActive ? 'opacity-100 scale-100' : 'opacity-50 scale-95 group-hover:opacity-100 group-hover:scale-110'}`} 
                  />
                </div>
                
                <span className="truncate">{label}</span>
                
                {/* Glowing Active Dot */}
                {isActive && (
                  <span className="absolute right-3 w-1.5 h-1.5 rounded-full bg-sky-400 shadow-[0_0_8px_rgba(56,189,248,0.9)]" />
                )}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* FOOTER */}
      <div className="p-6 border-t border-slate-800/80">
        <div className="flex items-center justify-between px-4 py-3 rounded-xl bg-slate-800/30 ring-1 ring-slate-700/30 hover:bg-slate-800/50 transition-colors cursor-default">
          <div className="flex items-center gap-2.5">
            <div className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </div>
            <span className="text-xs text-slate-300 font-medium">Sistema Online</span>
          </div>
          <span className="text-[10px] font-bold text-slate-500 tracking-wider">v1.0</span>
        </div>
      </div>
    </aside>
  );
}