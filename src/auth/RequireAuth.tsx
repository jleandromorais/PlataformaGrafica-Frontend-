import { Navigate, Outlet, useLocation } from "react-router-dom";
import { Alert } from "../components/ui/Alert";
import { Button } from "../components/ui/Button";
import { Skeleton } from "../components/ui/Skeleton";
import { useAuth } from "./AuthContext";

export function RequireAuth() {
  const { usuario, carregando, semConexao, tentarDeNovo, sair } = useAuth();
  const local = useLocation();

  if (!carregando && !usuario && semConexao) {
    return (
      <div className="flex h-screen items-center justify-center bg-canvas p-4">
        <div className="w-full max-w-md space-y-4">
          <Alert variant="error">
            Sem conexão com o servidor. Verifique sua internet; se ela estiver normal, o sistema pode estar sendo
            atualizado: aguarde 1 a 2 minutos. Você continua conectado.
          </Alert>
          <div className="flex gap-2">
            <Button variant="solid" onClick={tentarDeNovo}>Tentar de novo</Button>
            <Button variant="ghost" onClick={sair}>Entrar com outra conta</Button>
          </div>
        </div>
      </div>
    );
  }

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
