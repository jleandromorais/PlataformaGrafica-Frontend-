import { api } from "./client";

export interface Usuario {
  id: number;
  nome: string;
  email: string;
}

interface Sessao {
  access_token: string;
  usuario: Usuario;
}

export interface CadastroPayload {
  nome: string;
  email: string;
  senha: string;
  confirmar_senha: string;
}

export const authApi = {
  login: (email: string, senha: string) =>
    api.post<Sessao>("/auth/login", { email, senha }).then((r) => r.data),
  cadastro: (dados: CadastroPayload) =>
    api.post<Sessao>("/auth/cadastro", dados).then((r) => r.data),
  me: () => api.get<Usuario>("/auth/me").then((r) => r.data),
};
