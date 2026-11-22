/** Avisos rápidos no canto da tela (toast da HeroUI), para dizer "deu certo" depois de gravar ou carregar.
 * São um extra: o aviso de dentro da tela continua lá. O <Toast.Provider> fica no App.tsx. */
import { createElement } from "react";
import { toast } from "@heroui/react";

// Um pouco mais que o padrão (4 s): a descrição costuma ter uma frase inteira.
const TEMPO = 6000;

export function avisarSucesso(titulo: string, descricao?: string) {
  return toast.success(titulo, { description: descricao, timeout: TEMPO });
}

/** Monta a descrição do toast: um texto só fica como está; vários viram lista com marcador
 * (nunca junte linhas numa frase só: o toast mostraria tudo num item só). */
function descricaoEmLista(detalhes?: string | string[]) {
  const itens = typeof detalhes === "string" ? [detalhes] : (detalhes ?? []).filter(Boolean);
  if (itens.length <= 1) return itens[0];
  const maximo = 6; // lista enorme não cabe no canto da tela
  const mostrados = itens.slice(0, maximo);
  const resto = itens.length - mostrados.length;
  return createElement(
    "ul",
    { className: "list-disc space-y-0.5 pl-4" },
    ...mostrados.map((t, i) => createElement("li", { key: i }, t)),
    resto > 0 ? createElement("li", { key: "resto" }, `e mais ${resto}…`) : null,
  );
}

/** Deu certo, mas falta algo ou há diferença: amarelo, para o analista olhar a tela.
 * `descricao` pode ser um texto ou uma lista. */
export function avisarAtencao(titulo: string, descricao?: string | string[], acao?: AcaoDoAviso) {
  return toast.warning(titulo, {
    description: descricaoEmLista(descricao), timeout: TEMPO,
    ...(acao ? { actionProps: { children: acao.rotulo, onPress: acao.aoClicar } } : {}),
  });
}

/** Botão dentro do aviso (ex.: "Ver diferenças"). */
export interface AcaoDoAviso { rotulo: string; aoClicar: () => void }

/** Fecha um aviso que ainda está na tela (ex.: o "em andamento" de uma conferência que foi cancelada). */
export function fecharAviso(id: string) {
  toast.close(id);
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

/** Aviso "em andamento" (com rodinha) que fica aberto até `concluirAviso` trocar pelo resultado.
 *  Serve para envios que demoram (ex.: subir uma planilha): a pessoa vê na hora que o arquivo foi. */
export function avisarEnviando(titulo: string, descricao?: string): string {
  return toast(titulo, { description: descricao, isLoading: true, timeout: 0 });
}

/** Troca o aviso "em andamento" pelo resultado, no mesmo lugar da tela. */
export function concluirAviso(
  id: string, tipo: "success" | "warning" | "danger", titulo: string, detalhes?: string | string[],
) {
  const itens = typeof detalhes === "string" ? [detalhes] : (detalhes ?? []).filter(Boolean);
  const description = itens.length <= 1
    ? itens[0]
    : createElement("ul", { className: "list-disc space-y-0.5 pl-4" },
        ...itens.slice(0, 6).map((t, i) => createElement("li", { key: i }, t)));
  return toast.update(id, titulo, {
    description, variant: tipo, isLoading: false, timeout: tipo === "danger" ? TEMPO_ERRO : TEMPO,
  });
}
