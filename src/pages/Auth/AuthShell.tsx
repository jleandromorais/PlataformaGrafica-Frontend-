import type { ReactNode } from "react";
import { Brand } from "../../components/layout/Sidebar";

export function AuthShell({ titulo, subtitulo, children, rodape }: {
  titulo: string;
  subtitulo: string;
  children: ReactNode;
  rodape: ReactNode;
}) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-canvas px-4 py-10">
      <div className="w-full max-w-[26rem]">
        <div className="mb-8 flex justify-center">
          <Brand />
        </div>
        <div className="rounded-2xl border border-white/[0.06] bg-panel p-7">
          <h1 className="text-xl font-semibold text-white">{titulo}</h1>
          <p className="mt-1 text-sm text-zinc-500">{subtitulo}</p>
          <div className="mt-6">{children}</div>
        </div>
        <p className="mt-5 text-center text-sm text-zinc-500">{rodape}</p>
      </div>
    </div>
  );
}
