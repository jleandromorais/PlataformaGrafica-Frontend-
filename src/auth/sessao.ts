/** Regras da sessão, sem React, para testar. */
import axios from "axios";

/** Ao abrir o site com um token guardado e o `/auth/me` falhar: só um 401 (token vencido ou inválido)
 * apaga o token. Falha de rede ou servidor reiniciando NÃO desconecta: a pessoa tenta de novo. */
export function deveApagarToken(erro: unknown): boolean {
  return axios.isAxiosError(erro) && erro.response?.status === 401;
}
