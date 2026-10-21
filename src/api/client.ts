import axios from "axios";

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? "http://localhost:8080/api",
  timeout: 30000,
  headers: { "Content-Type": "application/json" },
});

/** Erro de validação do FastAPI/Pydantic: `detail` vem como lista. */
interface ErroValidacao { loc?: (string | number)[]; msg?: string; type?: string }

const NOMES_CAMPOS: Record<string, string> = {
  email: "E-mail", senha: "Senha", confirmar_senha: "Repita a senha", nome: "Nome",
  arquivo: "Arquivo", periodos: "Meses do trimestre",
};

/** Tipos de erro do Pydantic em pt-BR (o `msg` original vem em inglês). */
const TIPOS_VALIDACAO: Record<string, string> = {
  missing: "obrigatório",
  string_type: "precisa ser texto",
  string_too_short: "curto demais",
  string_too_long: "longo demais",
  int_parsing: "precisa ser um número inteiro",
  float_parsing: "precisa ser um número",
  json_invalid: "dados enviados em formato inválido",
};

function textoValidacao(itens: unknown[]): string {
  return itens
    .map((item) => {
      if (typeof item === "string") return item;
      if (!item || typeof item !== "object") return "valor inválido";
      const e = item as ErroValidacao;
      // Campo = último nome conhecido no caminho (ignora "body" e índices de lista).
      const campo = [...(e.loc ?? [])].reverse().find((x) => typeof x === "string" && x in NOMES_CAMPOS);
      const msg = (e.type && TIPOS_VALIDACAO[e.type]) ?? "valor inválido";
      return campo ? `${NOMES_CAMPOS[campo as string]}: ${msg}` : msg;
    })
    .join("\n");
}

/** Linha técnica curta para debug: "(HTTP 422 · POST /pmpv/importar-memoria)". */
function linhaTecnica(erro: { config?: { method?: string; url?: string } }, status?: number): string {
  const metodo = (erro.config?.method ?? "").toUpperCase();
  const rota = (erro.config?.url ?? "").split(/[?#]/)[0]; // sem query: pode ter dados do usuário
  const onde = [metodo, rota].filter(Boolean).join(" ");
  const qual = status ? `HTTP ${status}` : "sem resposta do servidor";
  return `(${[qual, onde].filter(Boolean).join(" · ")})`;
}

/** Mensagem para mostrar ao usuário a partir de um erro da API.
 *
 * Diz o que aconteceu e o que fazer; o motivo real do backend (`detail`) vem
 * primeiro quando existe. A última linha traz status e rota, para debug.
 */
export function mensagemDeErro(erro: unknown, padrao: string): string {
  if (axios.isCancel(erro)) return ""; // cancelada pela própria tela: nada a mostrar
  if (!axios.isAxiosError(erro)) return padrao;

  const status = erro.response?.status;
  const tecnico = linhaTecnica(erro, status);
  if (!erro.response) {
    const texto = erro.code === "ECONNABORTED" || erro.code === "ETIMEDOUT"
      ? "O servidor demorou demais para responder. Tente de novo; se for um arquivo grande, aguarde um pouco mais."
      : "Não foi possível falar com o servidor. Confira sua internet e se o backend está no ar.";
    return `${texto}\n${tecnico}`;
  }

  const detail = (erro.response.data as { detail?: unknown } | undefined)?.detail;
  let texto: string;
  if (typeof detail === "string" && detail.trim()) texto = detail;
  else if (Array.isArray(detail) && detail.length) texto = `Confira os dados enviados:\n${textoValidacao(detail)}`;
  else if (status === 401) texto = erro.config?.url?.startsWith("/auth/") ? padrao : "Sua sessão expirou. Entre novamente.";
  else if (status === 403) texto = "Você não tem permissão para esta ação.";
  else if (status === 404) texto = `${padrao} O recurso não foi encontrado no servidor.`;
  else if (status === 413) texto = "O arquivo é grande demais para o servidor. Envie um arquivo menor.";
  else if (status && status >= 500) texto = `${padrao} Erro interno no servidor: tente de novo; se repetir, avise o suporte com a linha abaixo.`;
  else texto = padrao;
  return `${texto}\n${tecnico}`;
}

api.interceptors.response.use(
  (res) => res,
  (err) => {
    console.error("[API Error]", err.config?.method?.toUpperCase(), err.config?.url, err.response?.status, err.response?.data ?? err.message);
    return Promise.reject(err);
  }
);
