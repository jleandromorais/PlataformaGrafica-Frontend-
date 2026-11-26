import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { authApi, type CadastroPayload, type Usuario } from "../api/auth";
import { api } from "../api/client";
import { deveApagarToken } from "./sessao";

const CHAVE = "cg_token";

function lerToken(): string | null {
  try {
    return localStorage.getItem(CHAVE);
  } catch {
    return null;
  }
}

function guardarToken(token: string | null) {
  try {
    if (token) localStorage.setItem(CHAVE, token);
    else localStorage.removeItem(CHAVE);
  } catch {
    /* navegador sem storage: a sessão vale só até recarregar */
  }
  if (token) api.defaults.headers.common.Authorization = `Bearer ${token}`;
  else delete api.defaults.headers.common.Authorization;
}

interface AuthCtx {
  usuario: Usuario | null;
  carregando: boolean;
  /** Havia sessão guardada, mas o servidor não respondeu (internet ou servidor reiniciando). */
  semConexao: boolean;
  tentarDeNovo: () => void;
  entrar: (email: string, senha: string) => Promise<void>;
  cadastrar: (dados: CadastroPayload) => Promise<void>;
  sair: () => void;
}

const Ctx = createContext<AuthCtx | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [carregando, setCarregando] = useState(() => lerToken() !== null);

  const sair = useCallback(() => {
    guardarToken(null);
    setUsuario(null);
  }, []);

  const [semConexao, setSemConexao] = useState(false);

  // Restaura a sessão ao abrir o app. Só um 401 apaga o token: sem internet, a pessoa tenta de novo sem relogar.
  const buscarSessao = useCallback(() => {
    const token = lerToken();
    if (!token) return;
    guardarToken(token);
    authApi
      .me()
      .then((u) => { setUsuario(u); setSemConexao(false); })
      .catch((err) => (deveApagarToken(err) ? guardarToken(null) : setSemConexao(true)))
      .finally(() => setCarregando(false));
  }, []);
  useEffect(buscarSessao, [buscarSessao]);
  const restaurar = useCallback(() => {
    setCarregando(true);
    setSemConexao(false);
    buscarSessao();
  }, [buscarSessao]);

  // Token vencido/inválido em qualquer chamada: volta para o login.
  useEffect(() => {
    const id = api.interceptors.response.use(
      (res) => res,
      (err) => {
        const url: string = err.config?.url ?? "";
        if (err.response?.status === 401 && !url.startsWith("/auth/")) sair();
        return Promise.reject(err);
      },
    );
    return () => api.interceptors.response.eject(id);
  }, [sair]);

  const abrirSessao = useCallback((s: { access_token: string; usuario: Usuario }) => {
    guardarToken(s.access_token);
    setUsuario(s.usuario);
  }, []);

  const valor = useMemo<AuthCtx>(
    () => ({
      usuario,
      carregando,
      semConexao,
      tentarDeNovo: restaurar,
      entrar: async (email, senha) => abrirSessao(await authApi.login(email, senha)),
      cadastrar: async (dados) => abrirSessao(await authApi.cadastro(dados)),
      sair,
    }),
    [usuario, carregando, semConexao, restaurar, abrirSessao, sair],
  );

  return <Ctx.Provider value={valor}>{children}</Ctx.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth(): AuthCtx {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useAuth fora do AuthProvider");
  return ctx;
}
