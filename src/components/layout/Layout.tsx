import { useEffect, useState } from "react";
import { Link, Outlet, useSearchParams } from "react-router-dom";
import { ArrowLeft, Menu } from "lucide-react";
import { Sidebar, Brand } from "./Sidebar";
import { deslocaPeriodo, lerPeriodo } from "../../utils/periodos";

/** Tela aberta pelo "Fazer agora" do Painel do Ciclo: volta ao mesmo trimestre. */
function VoltarAoPainel() {
  const [params] = useSearchParams();
  const ciclo = params.get("ciclo");
  if (params.get("de") !== "ciclo" || !ciclo || !lerPeriodo(ciclo)) return null;
  return (
    <div className="border-b border-white/[0.06] bg-sky-500/[0.06] px-4 py-2 sm:px-8 lg:px-10">
      <Link to={`/ciclo?trimestre=${encodeURIComponent(ciclo)}`}
        className="inline-flex items-center gap-1.5 text-sm font-medium text-sky-200 hover:text-white">
        <ArrowLeft size={14} /> Voltar ao Painel do Ciclo ({ciclo} a {deslocaPeriodo(ciclo, 2)})
      </Link>
    </div>
  );
}

export function Layout() {
  const [menuAberto, setMenuAberto] = useState(false);

  useEffect(() => {
    if (!menuAberto) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setMenuAberto(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [menuAberto]);

  return (
    // h-screen + overflow-hidden: a rolagem acontece só dentro do <main>.
    <div className="flex h-screen w-full overflow-hidden bg-canvas">
      <Sidebar aberto={menuAberto} onFechar={() => setMenuAberto(false)} />

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-14 shrink-0 items-center gap-3 border-b border-white/[0.06] bg-rail px-4 lg:hidden">
          <button
            type="button"
            onClick={() => setMenuAberto(true)}
            aria-label="Abrir menu"
            aria-expanded={menuAberto}
            className="-ml-1 rounded-lg p-2 text-zinc-400 transition-colors hover:bg-white/[0.05] hover:text-white"
          >
            <Menu size={20} />
          </button>
          <Brand compact />
        </header>

        <main className="min-h-0 flex-1 overflow-y-auto">
          <VoltarAoPainel />
          <Outlet />
        </main>
      </div>
    </div>
  );
}
