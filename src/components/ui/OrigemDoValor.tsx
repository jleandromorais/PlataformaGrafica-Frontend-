/** Uma linha de "De onde vêm os números" numa prova real: o valor usado, o selo (confere, não
 * confere ou sem itens para provar), um detalhe e o link para a tela que grava aquele valor. */
import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { ArrowUpRight, CircleHelp } from "lucide-react";
import type { SeloOrigem } from "../../utils/origemDoValor";
import { Conferencia } from "./Conferencia";

export function OrigemDoValor({ titulo, valor, selo, textos, detalhe, link }: {
  titulo: string;
  valor: string;
  selo: SeloOrigem;
  /** Texto de cada selo (ex.: { confere: "confere com as notas", ... }). */
  textos: Record<SeloOrigem, string>;
  detalhe?: ReactNode;
  link: { para: string; texto: string };
}) {
  return (
    <li className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 px-4 py-3">
      <div>
        <p className="font-semibold text-zinc-200">{titulo} <span className="ml-1 font-normal tabular-nums text-zinc-300">{valor}</span></p>
        {detalhe && <p className="text-xs tabular-nums text-zinc-500">{detalhe}</p>}
      </div>
      <div className="flex flex-col items-end gap-1 text-xs font-medium">
        {selo === "sem_itens"
          ? <span className="inline-flex items-center gap-1 whitespace-nowrap text-zinc-400"><CircleHelp size={13} aria-hidden className="shrink-0" />{textos.sem_itens}</span>
          : <Conferencia confere={selo === "confere"}>{textos[selo]}</Conferencia>}
        <Link to={link.para} className="inline-flex items-center gap-1 rounded text-sky-300 hover:text-sky-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-400">
          {link.texto} <ArrowUpRight size={12} aria-hidden />
        </Link>
      </div>
    </li>
  );
}
