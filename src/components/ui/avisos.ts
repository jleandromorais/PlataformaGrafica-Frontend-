/** Avisos rápidos no canto da tela (toast da HeroUI), para dizer "deu certo" depois de gravar ou carregar.
 * São um extra: o aviso de dentro da tela continua lá. O <Toast.Provider> fica no App.tsx. */
import { createElement } from "react";
import { toast } from "@heroui/react";

// Um pouco mais que o padrão (4 s): a descrição costuma ter uma frase inteira.
const TEMPO = 6000;

export function avisarSucesso(titulo: string, descricao?: string) {
  return toast.success(titulo, { description: descricao, timeout: TEMPO });
}

/** Deu certo, mas falta algo ou há diferença: amarelo, para o analista olhar a tela. */
export function avisarAtencao(titulo: string, descricao?: string) {
  return toast.warning(titulo, { description: descricao, timeout: TEMPO });
}

// Erro fica mais tempo: o analista precisa ler o que veio errado antes de sumir.
const TEMPO_ERRO = 12000;

/** Erro em vermelho. `detalhes` pode ser um texto ou uma lista (cada item vira uma linha com marcador). */
export function avisarErro(titulo: string, detalhes?: string | string[]) {
  const itens = typeof detalhes === "string" ? [detalhes] : (detalhes ?? []).filter(Boolean);
  const maximo = 6; // lista enorme não cabe no canto da tela
  const mostrados = itens.slice(0, maximo);
  const resto = itens.length - mostrados.length;
  const description = itens.length
    ? createElement(
        "ul",
        { className: "list-disc space-y-0.5 pl-4" },
        ...mostrados.map((t, i) => createElement("li", { key: i }, t)),
        resto > 0 ? createElement("li", { key: "resto" }, `e mais ${resto}…`) : null,
      )
    : undefined;
  return toast.danger(titulo, { description, timeout: TEMPO_ERRO });
}

/** "Jul a Set/2026" (ou "Jan/2026 a Mar/2026" se mudar o ano) para o título do aviso. */
export function faixaDosMeses(meses: string[]): string {
  if (!meses.length) return "";
  const primeiro = meses[0];
  const ultimo = meses[meses.length - 1];
  if (meses.length === 1) return primeiro;
  const [m1, a1] = primeiro.split("/");
  return a1 === ultimo.split("/")[1] ? `${m1} a ${ultimo}` : `${primeiro} a ${ultimo}`;
}
