import { useEffect, useState } from "react";
import { Outlet } from "react-router-dom";
import { Menu } from "lucide-react";
import { Sidebar, Brand } from "./Sidebar";
import { SiglasDaTela } from "../ui/Sigla";

export function Layout() {
  const [menuAberto, setMenuAberto] = useState(false);

  useEffect(() => {
    if (!menuAberto) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setMenuAberto(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [menuAberto]);

  // Só o <main> rola. Se algo (scrollIntoView, focus) rolar a PÁGINA, o app inteiro sobe e sobra um vazio preto embaixo:
  // trava a rolagem da página e devolve ao topo se ela se mexer.
  useEffect(() => {
    const html = document.documentElement;
    const anterior = html.style.overflow;
    html.style.overflow = "hidden";
    const voltar = () => { if (window.scrollY !== 0 || window.scrollX !== 0) window.scrollTo(0, 0); };
    window.addEventListener("scroll", voltar);
    voltar();
    return () => { html.style.overflow = anterior; window.removeEventListener("scroll", voltar); };
  }, []);

  return (
    // h-screen + overflow-clip: a rolagem acontece só dentro do <main>. Não é overflow-hidden de
    // propósito: um contêiner "hidden" ainda pode ser rolado por código (focus() ou
    // scrollIntoView() num elemento fora da tela), e aí a barra lateral e o conteúdo subiam
    // juntos, deixando um vazio embaixo. O "clip" corta igual, mas nunca rola.
    <div className="flex h-screen w-full overflow-clip bg-canvas">
      <Sidebar aberto={menuAberto} onFechar={() => setMenuAberto(false)} />

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-14 shrink-0 items-center gap-3 border-b border-white/[0.06] bg-rail px-4 lg:hidden">
          <button
            type="button"
            onClick={() => setMenuAberto(true)}
            aria-label="Abrir menu"
            aria-expanded={menuAberto}
            className="-ml-1 rounded-lg p-2 text-zinc-400 transition-colors hover:bg-white/[0.05] hover:text-white"
          >
            <Menu size={20} />
          </button>
          <Brand compact />
        </header>

        <main className="min-h-0 flex-1 overflow-y-auto">
          <SiglasDaTela>
            <Outlet />
          </SiglasDaTela>
        </main>
      </div>
    </div>
  );
}
