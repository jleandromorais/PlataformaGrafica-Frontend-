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
      return `• ${campo ? `${NOMES_CAMPOS[campo as string]}: ${msg}` : msg}`;
    })
    .join("\n");
}

/** Separa a mensagem para o usuário dos detalhes técnicos; o <Alert> mostra
 * os detalhes recolhidos em "Detalhes técnicos" (para mandar ao suporte). */
export const SEPARADOR_DETALHE = "\n\u2063";

/** Detalhe técnico curto: "HTTP 422 · POST /pmpv/importar-memoria". */
function linhaTecnica(erro: { config?: { method?: string; url?: string } }, status?: number): string {
  const metodo = (erro.config?.method ?? "").toUpperCase();
  const rota = (erro.config?.url ?? "").split(/[?#]/)[0]; // sem query: pode ter dados do usuário
  const onde = [metodo, rota].filter(Boolean).join(" ");
  const qual = status ? `HTTP ${status}` : "sem resposta do servidor";
  return [qual, onde].filter(Boolean).join(" · ");
}

/** "Não foi possível salvar o PR." + "Sem PMPV…" → "Não foi possível salvar o PR: sem PMPV…". */
function juntar(acao: string, motivo: string): string {
  const a = acao.trim().replace(/[.:]$/, "");
  if (!a) return motivo;
  // Mantém maiúscula de sigla no início do motivo (ex.: "PMPV zerado…").
  const inicio = /^[A-ZÀ-Ú]{2}/.test(motivo) ? motivo : motivo.charAt(0).toLowerCase() + motivo.slice(1);
  return `${a}: ${inicio}`;
}

/** Mensagem para mostrar ao usuário a partir de um erro da API.
 *
 * Sempre no formato "o que não deu certo: por quê e o que fazer". `padrao` é a
 * ação que falhou (ex.: "Não foi possível salvar o PR."); o motivo vem do
 * servidor quando ele explica, senão de uma frase por tipo de falha. Status e
 * rota vão depois de SEPARADOR_DETALHE, fora do texto principal.
 */
export function mensagemDeErro(erro: unknown, padrao: string): string {
  if (axios.isCancel(erro)) return ""; // cancelada pela própria tela: nada a mostrar
  if (!axios.isAxiosError(erro)) return padrao;

  const status = erro.response?.status;
  const detalhe = SEPARADOR_DETALHE + linhaTecnica(erro, status);
  if (!erro.response) {
    const motivo = erro.code === "ECONNABORTED" || erro.code === "ETIMEDOUT"
      ? "o servidor demorou demais para responder. Tente de novo; com arquivos grandes, pode levar alguns minutos."
      : "sem conexão com o servidor. Verifique sua internet e tente de novo. Se a internet estiver normal, "
        + "o sistema pode estar sendo atualizado: aguarde 1 a 2 minutos e tente outra vez.";
    return juntar(padrao, motivo) + detalhe;
  }

  const corpo = erro.response.data as { detail?: unknown; codigo?: string } | undefined;
  const detail = corpo?.detail;
  let motivo: string;
  if (typeof detail === "string" && detail.trim()) motivo = detail.trim();
  else if (Array.isArray(detail) && detail.length) motivo = `alguns campos estão inválidos:\n${textoValidacao(detail)}`;
  else if (status === 401) motivo = "sua sessão expirou. Entre novamente para continuar.";
  else if (status === 403) motivo = "você não tem permissão para fazer isso. Peça acesso a um administrador.";
  else if (status === 404) motivo = "o item pedido não foi encontrado (pode ter sido apagado). Recarregue a página e tente de novo.";
  else if (status === 413) motivo = "o arquivo é grande demais para o servidor. Envie um arquivo menor ou divida em partes.";
  else if (status && status >= 500) motivo = "aconteceu um erro inesperado no servidor. Tente de novo em instantes; "
    + "se continuar, mande um print desta mensagem para o suporte.";
  else motivo = "tente de novo; se continuar, mande um print desta mensagem para o suporte.";
  const codigo = corpo?.codigo ? ` · código ${corpo.codigo}` : "";
  return juntar(padrao, motivo) + detalhe + codigo;
}

api.interceptors.response.use(
  (res) => res,
  (err) => {
    console.error("[API Error]", err.config?.method?.toUpperCase(), err.config?.url, err.response?.status, err.response?.data ?? err.message);
    return Promise.reject(err);
  }
);
