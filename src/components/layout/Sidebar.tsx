import { NavLink } from "react-router-dom";
import {
  LayoutDashboard, Calculator, BarChart2, FileSearch,
  FileText, Zap, TrendingUp, DollarSign, PieChart, Activity, Layers, X, FileSpreadsheet,
  type LucideIcon,
} from "lucide-react";
import { moduleColor } from "../../theme";

type Item = { to: string; icon: LucideIcon; label: string; key: string };
type Grupo = { titulo?: string; itens: Item[] };

const grupos: Grupo[] = [
  {
    itens: [
      { to: "/",     icon: LayoutDashboard, label: "Dashboard", key: "dashboard" },
      { to: "/pmpv", icon: Calculator,      label: "PMPV",      key: "pmpv" },
    ],
  },
  {
    titulo: "Conta Gráfica",
    itens: [
      { to: "/auditoria",   icon: FileSearch, label: "Auditoria CGR",       key: "auditoria" },
      { to: "/cgf",         icon: BarChart2,  label: "CGF — Volume Faturado", key: "cgf" },
      { to: "/rpv",         icon: PieChart,   label: "RPV",                 key: "rpv" },
      { to: "/ret",         icon: Zap,        label: "RET — Encargos",      key: "ret" },
      { to: "/conciliacao", icon: FileText,   label: "RP — Conciliação",    key: "conciliacao" },
      { to: "/scg",         icon: Layers,     label: "SCG — Consolidação",  key: "scg" },
      { to: "/sr",          icon: Activity,   label: "SR — Saldo Regulatório", key: "sr" },
    ],
  },
  {
    titulo: "Módulo 3 · Consolidação",
    itens: [
      { to: "/pr", icon: TrendingUp, label: "PR — Preço Regulatório", key: "pr" },
      { to: "/pv", icon: DollarSign, label: "PV Final",               key: "pv" },
    ],
  },
  {
    titulo: "Exportação",
    itens: [
      { to: "/excel-final", icon: FileSpreadsheet, label: "Excel Final Consolidado", key: "excel" },
    ],
  },
];

export function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <div className="flex items-center gap-3">
      <div className={`flex shrink-0 items-center justify-center rounded-xl bg-sky-500/15 ring-1 ring-sky-500/25 ${compact ? "h-8 w-8" : "h-9 w-9"}`}>
        <span className="text-[0.8rem] font-bold tracking-wide text-sky-400">CG</span>
      </div>
      <div className="flex flex-col">
        <span className="text-sm font-semibold leading-tight text-white">Conta Gráfica</span>
        {!compact && (
          <span className="mt-0.5 text-[0.7rem] font-medium tracking-wide text-zinc-500">ARPE Plataforma</span>
        )}
      </div>
    </div>
  );
}

interface SidebarProps {
  aberto: boolean;
  onFechar: () => void;
}

export function Sidebar({ aberto, onFechar }: SidebarProps) {
  return (
    <>
      {/* Véu da gaveta no mobile */}
      <div
        onClick={onFechar}
        aria-hidden
        className={`fixed inset-0 z-30 bg-black/60 backdrop-blur-[2px] transition-opacity duration-200 lg:hidden ${
          aberto ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      />

      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-[260px] shrink-0 flex-col border-r border-white/[0.06] bg-rail text-zinc-300
          transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]
          lg:static lg:z-auto lg:translate-x-0
          ${aberto ? "translate-x-0 shadow-[8px_0_32px_rgba(0,0,0,0.5)]" : "-translate-x-full"}`}
      >
        <div className="flex h-16 items-center justify-between border-b border-white/[0.06] px-5 lg:h-20 lg:px-6">
          <Brand />
          <button
            type="button"
            onClick={onFechar}
            aria-label="Fechar menu"
            className="rounded-lg p-1.5 text-zinc-500 transition-colors hover:bg-white/[0.05] hover:text-white lg:hidden"
          >
            <X size={18} />
          </button>
        </div>

        <nav aria-label="Módulos" className="flex-1 overflow-y-auto px-3 py-5">
          {grupos.map((g, gi) => (
            <div key={g.titulo ?? gi} className={gi > 0 ? "mt-5" : ""}>
              {g.titulo && (
                <div className="mb-1.5 flex items-center gap-2 px-3">
                  <span className="text-[0.65rem] font-semibold uppercase tracking-[0.12em] text-zinc-500">
                    {g.titulo}
                  </span>
                  <span className="h-px flex-1 bg-white/[0.06]" aria-hidden />
                </div>
              )}
              <ul className="space-y-0.5">
                {g.itens.map(({ to, icon: Icon, label, key }) => (
                  <li key={to}>
                    <NavLink
                      to={to}
                      end={to === "/"}
                      onClick={onFechar}
                      className={({ isActive }) =>
                        `group relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors duration-150 ${
                          isActive
                            ? "bg-white/[0.06] text-white"
                            : "text-zinc-400 hover:bg-white/[0.03] hover:text-zinc-200"
                        }`
                      }
                    >
                      {({ isActive }) => (
                        <>
                          <Icon
                            size={16}
                            className={`shrink-0 transition-colors duration-150 ${
                              isActive ? moduleColor[key] : "text-zinc-600 group-hover:text-zinc-400"
                            }`}
                          />
                          <span className="truncate">{label}</span>
                          {isActive && (
                            <span className="ml-auto h-1.5 w-1.5 rounded-full bg-sky-400" aria-hidden />
                          )}
                        </>
                      )}
                    </NavLink>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>

        <div className="border-t border-white/[0.06] p-4">
          <div className="flex items-center justify-between rounded-lg bg-white/[0.03] px-3 py-2.5">
            <div className="flex items-center gap-2.5">
              <span className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_0_3px_rgba(16,185,129,0.15)]" />
              <span className="text-xs font-medium text-zinc-400">Sistema online</span>
            </div>
            <span className="text-[0.7rem] font-medium tabular-nums text-zinc-600">v1.0</span>
          </div>
        </div>
      </aside>
    </>
  );
}
