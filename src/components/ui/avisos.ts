/** Avisos rápidos no canto da tela (toast da HeroUI), para dizer "deu certo" depois de gravar.
 * São um extra: o aviso de dentro da tela continua lá. O <Toast.Provider> fica no App.tsx. */
import { toast } from "@heroui/react";

// Um pouco mais que o padrão (4 s): a descrição costuma ter uma frase inteira.
const TEMPO = 6000;

export function avisarSucesso(titulo: string, descricao?: string) {
  return toast.success(titulo, { description: descricao, timeout: TEMPO });
}

export function avisarErro(titulo: string, descricao?: string) {
  return toast.danger(titulo, { description: descricao, timeout: TEMPO });
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
