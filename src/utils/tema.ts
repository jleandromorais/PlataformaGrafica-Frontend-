import { useCallback, useState } from "react";

export type Tema = "claro" | "escuro";

const CHAVE = "cg_tema";

/** Tema já aplicado no <html> pelo script do index.html (antes do React, sem piscar). */
function temaAtual(): Tema {
  return document.documentElement.dataset.theme === "dark" ? "escuro" : "claro";
}

/** Tema claro/escuro: vale para a pessoa neste navegador. Sem escolha salva, segue o sistema. */
export function useTema() {
  const [tema, setTema] = useState<Tema>(temaAtual);

  const alternar = useCallback(() => {
    const novo: Tema = temaAtual() === "escuro" ? "claro" : "escuro";
    document.documentElement.dataset.theme = novo === "escuro" ? "dark" : "light";
    try {
      localStorage.setItem(CHAVE, novo);
    } catch {
      /* navegador sem storage: vale só até recarregar */
    }
    setTema(novo);
  }, []);

  return { tema, alternar };
}
