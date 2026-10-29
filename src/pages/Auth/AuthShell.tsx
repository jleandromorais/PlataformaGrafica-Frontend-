import type { ReactNode } from "react";

export function AuthShell({ titulo, subtitulo, children, rodape }: {
  titulo: string;
  subtitulo: string;
  children: ReactNode;
  rodape: ReactNode;
}) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-canvas px-4 py-10">
      <div className="w-full max-w-[26rem]">
        <div className="mb-8 flex flex-col items-center gap-4">
          {/* O "ARPE" do logo é marinho: no tema escuro o logo vai sobre uma placa clara. */}
          <span className="rounded-2xl dark:bg-white dark:px-6 dark:py-4">
            <img src="/arpe-logo.png" alt="ARPE — Agência de Regulação de Pernambuco" className="h-28 w-auto" />
          </span>
          <p className="text-lg font-bold text-white">Conta Gráfica <span className="font-extrabold">ARPE</span></p>
        </div>
        <div className="rounded-xl border border-white/[0.08] bg-panel p-7 shadow-[0_1px_2px_rgba(16,39,89,0.06),0_8px_24px_-12px_rgba(16,39,89,0.12)]">
          <h1 className="text-xl font-semibold text-white">{titulo}</h1>
          <p className="mt-1 text-sm text-zinc-500">{subtitulo}</p>
          <div className="mt-6">{children}</div>
        </div>
        <p className="mt-5 text-center text-sm text-zinc-500">{rodape}</p>
      </div>
    </div>
  );
}
