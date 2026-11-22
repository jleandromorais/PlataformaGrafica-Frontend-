/** Siglas explicadas no ponto de uso (spec SPEC_FLUXO_UNICO, seção 5). A lógica é pura (`utils/siglas.ts`) e os
 * nomes vêm do `utils/glossario.ts`. A dica abre ao passar o mouse, ao focar com o teclado (Tab) e ao tocar;
 * Esc fecha; o leitor de tela lê a dica pelo `aria-describedby`. Primeira vez na tela: "RET (Recuperação de
 * Encargos de Transporte)"; nas seguintes, só "RET" sublinhada. Não use dentro de tabela densa. */
import { createContext, useContext, useEffect, useId, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { useLocation } from "react-router-dom";
import type { Sigla as SiglaChave } from "../../utils/glossario";
import { partirPorSiglas, reivindicarSigla, siglaNoPrimeiroUso } from "../../utils/siglas";

const VistasContext = createContext<Map<SiglaChave, string> | null>(null);

/** Zera o "primeiro uso" a cada tela (rota). Fica no Layout, em volta do conteúdo. */
export function SiglasDaTela({ children }: { children: ReactNode }) {
  const { pathname } = useLocation();
  const [estado, setEstado] = useState(() => ({ pathname, vistas: new Map<SiglaChave, string>() }));
  // Tela nova (rota diferente): recomeça a contagem antes de desenhar os filhos.
  if (estado.pathname !== pathname) setEstado({ pathname, vistas: new Map() });
  const vistas = estado.pathname === pathname ? estado.vistas : new Map<SiglaChave, string>();
  return <VistasContext.Provider value={vistas}>{children}</VistasContext.Provider>;
}

const MARGEM = 8;

export function Sigla({ s, expandir = true }: { s: SiglaChave; expandir?: boolean }) {
  const id = useId();
  const vistas = useContext(VistasContext);
  const primeira = expandir && vistas ? reivindicarSigla(vistas, s, id) : false;
  const { extenso, dica } = siglaNoPrimeiroUso(s, primeira);

  // Ao montar de novo (StrictMode) ou trocar de sigla, devolve o "primeiro uso" quando a instância sai.
  useEffect(() => {
    if (primeira && vistas && !vistas.has(s)) vistas.set(s, id);
    return () => { if (vistas?.get(s) === id) vistas.delete(s); };
  }, [vistas, s, id, primeira]);

  const [aberta, setAberta] = useState(false);
  const [pos, setPos] = useState<{ left: number; top: number } | null>(null);
  const alvo = useRef<HTMLElement>(null);
  const balao = useRef<HTMLSpanElement>(null);

  // Posição fixa, presa à janela: a dica nunca é cortada por uma área rolável nem estoura a tela do celular.
  useLayoutEffect(() => {
    if (!aberta || !alvo.current || !balao.current) return;
    const a = alvo.current.getBoundingClientRect();
    const larg = balao.current.offsetWidth;
    const alt = balao.current.offsetHeight;
    const left = Math.max(MARGEM, Math.min(a.left, window.innerWidth - larg - MARGEM));
    const embaixo = a.bottom + 4;
    const top = embaixo + alt + MARGEM > window.innerHeight ? Math.max(MARGEM, a.top - alt - 4) : embaixo;
    setPos({ left, top });
  }, [aberta]);

  const abrir = () => setAberta(true);
  const fechar = () => { setAberta(false); setPos(null); };
  const idDica = `${id}-dica`;

  return (
    <>
      <abbr
        ref={alvo}
        tabIndex={0}
        aria-describedby={idDica}
        onMouseEnter={abrir} onMouseLeave={fechar}
        onFocus={abrir} onBlur={fechar}
        onClick={() => (aberta ? fechar() : abrir())}
        onKeyDown={(e) => { if (e.key === "Escape" && aberta) { e.stopPropagation(); fechar(); } }}
        className="cursor-help rounded-sm no-underline underline decoration-dotted decoration-zinc-500 underline-offset-[3px] hover:decoration-zinc-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-400"
      >
        {s}
      </abbr>
      {extenso && <> ({extenso})</>}
      {createPortal(
      <span
        ref={balao}
        id={idDica}
        role="tooltip"
        style={{ left: pos?.left ?? 0, top: pos?.top ?? 0 }}
        className={`pointer-events-none fixed z-[100] w-max max-w-[min(20rem,calc(100vw-16px))] rounded-lg border border-white/10 bg-panel px-3 py-2 text-left text-xs font-normal leading-relaxed text-zinc-200 shadow-xl ${aberta && pos ? "visible" : "invisible"}`}
      >
        {dica}
      </span>,
      document.body)}
    </>
  );
}

/** Um texto corrido com as siglas explicadas. Só para texto de tela, nunca para dado ou tabela. */
export function ComSiglas({ children }: { children: string }) {
  return (
    <>
      {partirPorSiglas(children).map((p, i) =>
        typeof p === "string" ? p : <Sigla key={i} s={p.sigla} expandir={p.expandir} />,
      )}
    </>
  );
}
