import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, ChevronRight, Sigma } from "lucide-react";
import { moduleColor } from "../../theme";
import { MODULOS, ORDEM_DO_CICLO, type ChaveModulo } from "./modulos";

interface Props {
  modulo: ChaveModulo;
  /** Título no lugar do nome do módulo (ex.: "Visão geral"). */
  titulo?: string;
  /** Linha abaixo do título; por padrão, o propósito do módulo. */
  descricao?: ReactNode;
  /** Como o valor é calculado: fica numa linha discreta, não no lugar da explicação. */
  formula?: ReactNode;
  /** Controles à direita (ex.: filtro de ano). */
  acoes?: ReactNode;
}

/** Cabeçalho único das telas: o que é, o que fazer aqui e, nas etapas do ciclo,
 * onde esta tela fica na ordem, com atalho para a anterior e a próxima. */
export function PageHeader({ modulo, titulo, descricao, formula, acoes }: Props) {
  const mod = MODULOS[modulo];
  const Icon = mod.icon;
  const nome = titulo ?? (mod.sigla ? `${mod.sigla} — ${mod.nome}` : mod.nome);
  const idx = ORDEM_DO_CICLO.indexOf(modulo);
  const anterior = idx > 0 ? MODULOS[ORDEM_DO_CICLO[idx - 1]] : null;
  const proxima = idx >= 0 && idx < ORDEM_DO_CICLO.length - 1 ? MODULOS[ORDEM_DO_CICLO[idx + 1]] : null;
  const texto = descricao ?? mod.proposito;

  return (
    <header className="flex flex-wrap items-start justify-between gap-x-6 gap-y-4">
      <div className="flex min-w-0 max-w-3xl flex-1 basis-[26rem] items-start gap-3.5">
        <span className={`mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/[0.04] ring-1 ring-white/[0.07] ${moduleColor[modulo]}`}>
          <Icon size={18} />
        </span>
        <div className="min-w-0">
          <h1 className="text-balance text-2xl font-bold tracking-tight text-white sm:text-[1.75rem]">{nome}</h1>
          {texto && <p className="mt-1 text-[0.95rem] leading-relaxed text-zinc-300">{texto}</p>}
          {formula && (
            <p className="mt-2 flex items-start gap-1.5 text-xs leading-relaxed text-zinc-500">
              <Sigma size={13} className="mt-[0.15rem] shrink-0 text-zinc-600" aria-hidden />
              <span><span className="sr-only">Como é calculado: </span>{formula}</span>
            </p>
          )}
        </div>
      </div>

      {(acoes || idx >= 0) && (
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          {acoes}
          {idx >= 0 && (
            <nav aria-label="Etapas do ciclo" className="flex items-center gap-1 rounded-xl border border-white/[0.07] bg-white/[0.02] p-1">
              <PassoLink alvo={anterior} direcao="anterior" />
              <span className="px-2 text-xs font-medium tabular-nums text-zinc-400">
                Etapa {idx + 1} de {ORDEM_DO_CICLO.length}
              </span>
              <PassoLink alvo={proxima} direcao="proxima" />
            </nav>
          )}
        </div>
      )}
    </header>
  );
}

function PassoLink({ alvo, direcao }: { alvo: (typeof MODULOS)[ChaveModulo] | null; direcao: "anterior" | "proxima" }) {
  const Seta = direcao === "anterior" ? ChevronLeft : ChevronRight;
  if (!alvo) {
    return <span className="flex h-8 w-8 items-center justify-center text-zinc-700" aria-hidden><Seta size={16} /></span>;
  }
  const rotulo = `${direcao === "anterior" ? "Etapa anterior" : "Próxima etapa"}: ${alvo.sigla ?? alvo.nome}`;
  return (
    <Link to={alvo.to} title={rotulo} aria-label={rotulo}
      className="flex h-8 items-center gap-1 rounded-lg px-2 text-xs font-semibold text-zinc-300 transition-colors hover:bg-white/[0.06] hover:text-white">
      {direcao === "anterior" && <Seta size={15} />}
      <span>{alvo.sigla ?? alvo.nome.split(" ")[0]}</span>
      {direcao === "proxima" && <Seta size={15} />}
    </Link>
  );
}
