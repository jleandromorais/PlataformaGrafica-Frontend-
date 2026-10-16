import axios from "axios";

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? "http://localhost:8080/api",
  timeout: 30000,
  headers: { "Content-Type": "application/json" },
});

/** Mensagem para mostrar ao usuário a partir de um erro da API.
 *
 * O backend devolve `{detail: "..."}` com o motivo real (ex.: "Volume Zero —
 * nenhuma linha com volume preenchido."); sem resposta, o backend está fora.
 */
export function mensagemDeErro(erro: unknown, padrao: string): string {
  if (axios.isAxiosError(erro)) {
    if (!erro.response) return "Não foi possível falar com o servidor. Confira se o backend está no ar.";
    const detail = (erro.response.data as { detail?: unknown } | undefined)?.detail;
    if (typeof detail === "string" && detail.trim()) return detail;
  }
  return padrao;
}

api.interceptors.response.use(
  (res) => res,
  (err) => {
    console.error("[API Error]", err.response?.data ?? err.message);
    return Promise.reject(err);
  }
);
