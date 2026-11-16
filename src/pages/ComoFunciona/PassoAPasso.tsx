import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { MODULOS } from "../../components/layout/modulos";
import { classesDoBotao } from "../../components/ui/estilosBotao";

interface Passo {
  titulo: string;
  texto: string;
  botao: string;
  to: string;
  /** Telas que andam juntas com a principal do passo. */
  extras?: { nome: string; to: string }[];
}

const PASSOS: Passo[] = [
  { titulo: "PMPV do trimestre", texto: "Calcule o preço médio e o volume previsto (VP).",
    botao: "Abrir o PMPV", to: MODULOS.pmpv.to },
  { titulo: "Processar a pasta", texto: "Envie a pasta do trimestre e processe. Confira a prévia antes de gravar.",
    botao: "Abrir o Painel do Ciclo", to: MODULOS.ciclo.to },
  { titulo: "Conferir o mês", texto: "Veja a Conferência do mês e a prova real de cada tela. Grave só o que bater.",
    botao: "Conferir o mês", to: MODULOS.ciclo.to },
  { titulo: "SR, PR e PV", texto: "Calcule o SR com a SELIC.",
    botao: "Abrir o SR", to: MODULOS.sr.to,
    extras: [{ nome: "PR", to: MODULOS.pr.to }, { nome: "PV", to: MODULOS.pv.to }] },
  { titulo: "Aprovar a cascata", texto: "Compare Antes × Novo do SR, PR e PV. Nada é gravado sem o seu aval.",
    botao: "Aprovar e gravar", to: MODULOS.ciclo.to },
];

/** O mês em cinco passos curtos, cada um com o botão que abre a tela. */
export function PassoAPasso() {
  return (
    <ol className="overflow-hidden rounded-xl border border-white/[0.07] bg-panel">
      {PASSOS.map((p, i) => (
        <li key={p.titulo} className="flex flex-col gap-3 border-b border-white/[0.07] p-4 last:border-b-0 sm:flex-row sm:items-center sm:gap-5 sm:px-5">
          <span aria-hidden className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-sky-500/15 text-sm font-bold text-sky-400">{i + 1}</span>
          <div className="min-w-0 flex-1">
            <h3 className="text-base font-semibold text-white">{p.titulo}</h3>
            <p className="mt-0.5 text-sm leading-relaxed text-zinc-300">
              {p.texto}
              {p.extras && (
                <span className="text-zinc-400"> Depois:{" "}
                  {p.extras.map((e, k) => (
                    <span key={e.nome}>{k > 0 && " e "}
                      <Link to={e.to} className="rounded font-semibold text-zinc-200 underline underline-offset-2 hover:text-white">{e.nome}</Link>
                    </span>
                  ))}.
                </span>
              )}
            </p>
          </div>
          <Link to={p.to} className={classesDoBotao("primary", "md", "shrink-0 sm:w-56")}>
            {p.botao}<ArrowRight size={14} aria-hidden />
          </Link>
        </li>
      ))}
    </ol>
  );
}
