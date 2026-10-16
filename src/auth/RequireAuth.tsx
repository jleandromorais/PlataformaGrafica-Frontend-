import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "./AuthContext";

export function RequireAuth() {
  const { usuario, carregando } = useAuth();
  const local = useLocation();

  if (carregando) {
    return <div className="flex h-screen items-center justify-center bg-canvas text-sm text-zinc-500">Carregando…</div>;
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
