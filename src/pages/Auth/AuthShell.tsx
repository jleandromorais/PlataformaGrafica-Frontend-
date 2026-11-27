import type { ReactNode } from "react";

/*
 * Moldura das telas de login e cadastro.
 * Uma marca só no topo (Equilibrium ARPE). A ARPE assina no rodapé, com o símbolo oficial
 * e o nome escrito em texto: o logo empilhado (public/arpe-logo*.png) ficava ilegível em
 * tamanho pequeno e competia com a marca do produto.
 * Os PNGs dos símbolos têm margem transparente; o object-cover recorta essa sobra para o
 * espaçamento seguir o desenho, não a caixa da imagem.
 */
export function AuthShell({ titulo, subtitulo, children, rodape }: {
  titulo: string;
  subtitulo: string;
  children: ReactNode;
  rodape: ReactNode;
}) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-canvas px-4 py-10">
      <div className="w-full max-w-[26rem]">
        <header className="mb-8 flex flex-col items-center text-center">
          <img src="/equilibrium-simbolo.png" alt="" aria-hidden className="h-16 w-24 object-cover" />
          <p className="mt-4 text-2xl font-bold tracking-tight text-white">
            Equilibrium <span className="font-extrabold">ARPE</span>
          </p>
          <p className="mt-1 text-sm text-zinc-500">Conta Gráfica do gás natural</p>
        </header>

        <div className="sem-hover rounded-xl border border-white/[0.08] bg-panel p-7 shadow-[0_1px_2px_rgba(16,39,89,0.06),0_8px_24px_-12px_rgba(16,39,89,0.12)]">
          <h1 className="text-xl font-semibold text-white">{titulo}</h1>
          <p className="mt-1 text-sm text-zinc-500">{subtitulo}</p>
          <div className="mt-6">{children}</div>
        </div>
        <p className="mt-5 text-center text-sm text-zinc-500">{rodape}</p>

        <footer className="mt-10 flex items-center justify-center gap-3 border-t border-white/[0.07] pt-6">
          <img src="/arpe-simbolo.png" alt="" aria-hidden className="h-6 w-11 shrink-0 object-cover" />
          <p className="text-xs leading-snug text-zinc-500">
            Uma plataforma da <span className="font-semibold text-zinc-300">ARPE</span>
            <br />
            Agência de Regulação de Pernambuco
          </p>
        </footer>
      </div>
    </div>
  );
}
