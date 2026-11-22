import type { ReactNode } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Route, Sigma } from "lucide-react";
import { moduleColor } from "../../theme";
import { etapaDoModulo, rotuloDaEtapa } from "../../utils/etapasDoCiclo";
import { linkDoPainel } from "../../utils/periodos";
import { classesDoBotao } from "../ui/estilosBotao";
import { MODULOS, type ChaveModulo } from "./modulos";

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
  /** Telas de consulta cujo valor se grava no Painel (SR, PR, PV): endereço do cartão certo, no trimestre certo. */
  gravarNoPainel?: string;
}

/** Cabeçalho único das telas: o que é, o que fazer aqui e, nas etapas do ciclo, em que passo
 * estamos ("Passo 4 de 9", da lista única) e o botão que leva ao Painel do Ciclo, no mesmo trimestre. */
export function PageHeader({ modulo, titulo, descricao, formula, acoes, gravarNoPainel }: Props) {
  const mod = MODULOS[modulo];
  const Icon = mod.icon;
  const nome = titulo ?? (mod.sigla ? `${mod.sigla} — ${mod.nome}` : mod.nome);
  const etapa = etapaDoModulo(modulo);
  const [params] = useSearchParams();
  const painel = linkDoPainel(params.get("ciclo"));
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

      {(acoes || etapa) && (
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          {acoes}
          {etapa && (
            <nav aria-label="Lugar no ciclo" className="flex flex-wrap items-center gap-2">
              <span className="rounded-md bg-sky-500/15 px-2.5 py-1 text-xs font-semibold tabular-nums text-sky-200">
                {rotuloDaEtapa(etapa.chave)}
              </span>
              <Link to={gravarNoPainel ?? painel} className={classesDoBotao(etapa.gravaNoPainel || gravarNoPainel ? "primary" : "ghost", "md")}>
                <Route size={15} aria-hidden />{gravarNoPainel ? "Gravar no Painel" : etapa.gravaNoPainel ? "Ler e gravar no Painel" : "Painel do Ciclo"}
              </Link>
            </nav>
          )}
        </div>
      )}
    </header>
  );
}
