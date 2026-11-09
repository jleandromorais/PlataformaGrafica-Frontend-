import { Navigate, Outlet, useLocation } from "react-router-dom";
import { Skeleton } from "../components/ui/Skeleton";
import { useAuth } from "./AuthContext";

export function RequireAuth() {
  const { usuario, carregando } = useAuth();
  const local = useLocation();

  if (carregando) {
    // Confirmando a sessão: esqueleto no formato da tela (menu lateral + conteúdo), não um texto solto.
    return (
      <div role="status" className="flex h-screen bg-canvas">
        <span className="sr-only">Carregando…</span>
        <div className="hidden w-64 shrink-0 space-y-3 border-r border-white/[0.07] bg-rail p-5 lg:block">
          <Skeleton className="h-8 w-32" />
          {[0, 1, 2, 3, 4, 5].map((i) => <Skeleton key={i} className="h-8 w-full" />)}
        </div>
        <div className="flex-1 space-y-6 p-8">
          <Skeleton className="h-10 w-72" />
          <div className="grid grid-cols-2 gap-4 xl:grid-cols-3">
            {[0, 1, 2].map((i) => <Skeleton key={i} className="h-28 w-full rounded-xl" />)}
          </div>
          <Skeleton className="h-64 w-full rounded-xl" />
        </div>
      </div>
    );
  }
  if (!usuario) return <Navigate to="/login" replace state={{ de: local.pathname }} />;
  return <Outlet />;
}

/** Telas de login/cadastro: quem já está logado vai direto para o app. */
export function SomenteVisitante() {
  const { usuario, carregando } = useAuth();
  if (carregando) return null;
  if (usuario) return <Navigate to="/" replace />;
  return <Outlet />;
}
