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
    <aside className="w-56 min-h-screen bg-[#0f172a] border-r border-slate-800 flex flex-col shrink-0">
      {/* LOGO */}
      <div className="px-5 py-5 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-sky-500 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-xs">CG</span>
          </div>
          <div>
            <p className="text-white font-bold text-sm leading-none">Conta Gráfica</p>
            <p className="text-slate-500 text-xs mt-0.5">ARPE · Plataforma</p>
          </div>
        </div>
      </div>

      {/* NAV */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {nav.map(({ to, icon: Icon, label, color }) => (
          <NavLink
            key={to}
            to={to}
            end={to === "/"}
            className={({ isActive }) => `
              flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium
              transition-colors duration-150
              ${isActive
                ? "bg-slate-700 text-white"
                : "text-slate-400 hover:bg-slate-800 hover:text-slate-200"}
            `}
          >
            <Icon size={16} className={color} />
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="px-5 py-4 border-t border-slate-800">
        <p className="text-xs text-slate-600">v1.0.0 · {new Date().getFullYear()}</p>
      </div>
    </aside>
  );
}
