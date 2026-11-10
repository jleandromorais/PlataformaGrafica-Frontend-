import { ArrowDown, ArrowRight, RotateCcw } from "lucide-react";
import { Link } from "react-router-dom";
import { MODULOS } from "../../components/layout/modulos";

const PASSOS = [
  { n: 1, titulo: "PMPV", to: MODULOS.pmpv.to,
    texto: "Você calcula o preço médio de venda do trimestre e o volume previsto (VP)." },
  { n: 2, titulo: "Painel do Ciclo", to: MODULOS.ciclo.to,
    texto: "Você envia a pasta do trimestre que passou. O sistema lê as notas (Auditoria CGR), as planilhas de volume (CGF), os encargos de transporte (RET) e as penalidades (RP), mostra o resultado e só grava o que você confirmar. Daí sai o saldo de cada mês (SCG)." },
  { n: 3, titulo: "SR", to: MODULOS.sr.to,
    texto: "O que ficou por recuperar do trimestre, corrigido pela SELIC." },
  { n: 4, titulo: "PR", to: MODULOS.pr.to,
    texto: "O saldo total dividido pelo volume previsto do trimestre do PR." },
  { n: 5, titulo: "Volta ao PMPV", to: MODULOS.pmpv.to,
    texto: "O PR entra no PMPV do trimestre seguinte e o PV fica sendo PMPV + PR." },
];

/** A volta do ciclo em cartões e setas. Em tela estreita vira uma lista vertical. */
export function DiagramaCiclo() {
  return (
    <ol className="flex flex-col items-stretch gap-2 lg:flex-row lg:items-stretch lg:gap-1.5">
      {PASSOS.map((p, i) => (
        <li key={p.n} className="flex flex-col items-stretch gap-2 lg:flex-1 lg:flex-row lg:items-center lg:gap-1.5">
          <div className="flex-1 rounded-xl border border-white/[0.07] bg-panel p-4">
            <p className="flex items-center gap-2 text-sm font-semibold text-white">
              <span aria-hidden className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-sky-500/15 text-xs font-bold text-sky-400">{p.n}</span>
              <Link to={p.to} className="rounded underline-offset-2 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-400">{p.titulo}</Link>
              {p.n === 5 && <RotateCcw size={14} className="text-zinc-400" aria-hidden />}
            </p>
            <p className="mt-2 text-sm leading-relaxed text-zinc-300">{p.texto}</p>
          </div>
          {i < PASSOS.length - 1 && (
            <>
              <ArrowDown size={18} className="mx-auto shrink-0 text-zinc-500 lg:hidden" aria-hidden />
              <ArrowRight size={18} className="hidden shrink-0 text-zinc-500 lg:block" aria-hidden />
            </>
          )}
        </li>
      ))}
    </ol>
  );
}
