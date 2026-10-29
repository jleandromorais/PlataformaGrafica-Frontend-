import { dicaDe } from "../../utils/glossario";
import { NavLink } from "react-router-dom";
import { X, LogOut, Moon, Sun } from "lucide-react";
import { useTema } from "../../utils/tema";
import { moduleColor } from "../../theme";
import { useAuth } from "../../auth/AuthContext";
import { GRUPOS_DO_MENU, MODULOS } from "./modulos";

export function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <div className="flex items-center gap-2.5">
      <img src="/arpe-simbolo.png" alt="" aria-hidden className={`shrink-0 ${compact ? "h-8 w-8" : "h-10 w-10"}`} />
      <div className="flex flex-col">
        <span className="text-[0.95rem] font-bold leading-tight text-white">
          Conta Gráfica <span className="font-extrabold">ARPE</span>
        </span>
        {!compact && (
          <span className="mt-0.5 text-[0.68rem] leading-tight text-zinc-500">Agência de Regulação de Pernambuco</span>
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
  const { usuario, sair } = useAuth();
  const { tema, alternar } = useTema();
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
        className={`fixed inset-y-0 left-0 z-40 flex w-[16.5rem] shrink-0 flex-col border-r border-white/[0.06] bg-rail text-zinc-300
          transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]
          lg:static lg:z-auto lg:translate-x-0
          ${aberto ? "translate-x-0 shadow-[8px_0_32px_rgba(16,39,89,0.2)]" : "-translate-x-full"}`}
      >
        {/* Faixa com as três cores do símbolo da ARPE */}
        <div className="flex h-1 shrink-0" aria-hidden>
          <span className="flex-1 bg-arpe-amarelo" /><span className="flex-1 bg-arpe-vermelho" /><span className="flex-1 bg-arpe-verde" />
        </div>
        <div className="flex h-16 items-center justify-between border-b border-white/[0.06] px-5 lg:h-20 lg:px-5">
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

        <nav aria-label="Módulos" className="flex-1 overflow-y-auto px-3 py-4">
          {GRUPOS_DO_MENU.map((g, gi) => (
            <div key={g.titulo ?? gi} className={gi > 0 ? "mt-4" : ""}>
              {g.titulo && (
                <div className="mb-1.5 flex items-center gap-2 px-3">
                  <span className="text-xs font-semibold text-zinc-500">
                    {g.titulo}
                  </span>
                  <span className="h-px flex-1 bg-white/[0.06]" aria-hidden />
                </div>
              )}
              <ul className="space-y-0.5">
                {g.itens.map((key) => {
                  const { to, icon: Icon, nome, sigla } = MODULOS[key];
                  return (
                  <li key={to}>
                    <NavLink
                      to={to}
                      end={to === "/"}
                      title={sigla ? dicaDe(sigla) : undefined}
                      onClick={onFechar}
                      className={({ isActive }) =>
                        `group relative flex items-start gap-3 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors duration-150 ${
                          isActive
                            ? "bg-white/[0.07] text-white"
                            : "text-zinc-400 hover:bg-white/[0.03] hover:text-zinc-200"
                        }`
                      }
                    >
                      {({ isActive }) => (
                        <>
                          <Icon
                            size={16}
                            className={`mt-0.5 shrink-0 transition-colors duration-150 ${
                              isActive ? moduleColor[key] : "text-zinc-600 group-hover:text-zinc-400"
                            }`}
                          />
                          {sigla ? (
                            <span className="min-w-0 leading-tight">
                              <span className="block font-semibold">{sigla}</span>
                              <span className={`block text-[0.72rem] font-normal ${isActive ? "text-zinc-300" : "text-zinc-500 group-hover:text-zinc-400"}`}>
                                {nome}
                              </span>
                            </span>
                          ) : (
                            <span className="min-w-0 leading-tight">{nome}</span>
                          )}
                          {isActive && (
                            <span className="ml-auto mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-sky-400" aria-hidden />
                          )}
                        </>
                      )}
                    </NavLink>
                  </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>

        <div className="space-y-2 border-t border-white/[0.06] p-4">
          <button
            type="button"
            onClick={alternar}
            aria-pressed={tema === "escuro"}
            className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-zinc-400 transition-colors hover:bg-white/[0.04] hover:text-white"
          >
            {tema === "escuro" ? <Sun size={16} aria-hidden /> : <Moon size={16} aria-hidden />}
            {tema === "escuro" ? "Usar tema claro" : "Usar tema escuro"}
          </button>
          {usuario && (
            <div className="flex items-center gap-2.5 rounded-lg bg-white/[0.03] px-3 py-2.5">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-marinho text-xs font-semibold uppercase text-paper">
                {usuario.nome.trim().charAt(0)}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-medium text-zinc-200">{usuario.nome}</p>
                <p className="truncate text-[0.68rem] text-zinc-500">{usuario.email}</p>
              </div>
              <button
                type="button"
                onClick={sair}
                aria-label="Sair"
                title="Sair"
                className="rounded-md p-1.5 text-zinc-500 transition-colors hover:bg-white/[0.06] hover:text-white"
              >
                <LogOut size={15} />
              </button>
            </div>
          )}
        </div>
      </aside>
    </>
  );
}
