import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { AlertTriangle } from "lucide-react";
import { getSCGComparacao } from "../../api";
import { mensagemDeErro } from "../../api/client";
import { brl } from "../../utils/format";
import { linkDoCiclo } from "../../utils/periodoNaUrl";
import { Alert } from "../../components/ui/Alert";
import { Button } from "../../components/ui/Button";
import { Skeleton } from "../../components/ui/Skeleton";
import type { SCGComparacao } from "../../types";
import { linhasDivergentes } from "./linhasDivergentes";

/** Meses em que o SCG gravado não bate com a soma dos módulos: mostra os DOIS valores e avisa.
 * Não escolhe nenhum nem grava nada; quem decide é o analista, na tela SCG. */
export function DivergenciaSCG({ meses, cicloInicio, versao }: { meses: string[]; cicloInicio: string; versao: number }) {
  // O resultado guarda de qual busca veio; se não é a atual, a tela mostra o esqueleto.
  const [res, setRes] = useState<{ id: string; dados?: SCGComparacao[]; erro?: string } | null>(null);
  const [tentativa, setTentativa] = useState(0);
  const id = `${meses.join("|")}#${tentativa}#${versao}`;
  const atual = res?.id === id ? res : null;
  const dados = atual?.dados ?? null;
  const erro = atual?.erro ?? null;

  useEffect(() => {
    // Só a busca mais recente vale (trocar de trimestre ou "Tentar de novo" durante uma busca).
    let vigente = true;
    Promise.all(meses.map((m) => getSCGComparacao(m)))
      .then((d) => { if (vigente) setRes({ id, dados: d }); })
      .catch((e) => { if (vigente) setRes({ id, erro: mensagemDeErro(e, "Não foi possível comparar o SCG gravado com os módulos.") }); });
    return () => { vigente = false; };
    // meses entra pelo id (texto estável); a lista em si muda de identidade a cada render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  if (erro) {
    return (
      <div className="mt-3 flex flex-wrap items-center gap-3">
        <Alert variant="error" className="min-w-0 flex-1">{erro}</Alert>
        <Button variant="ghost" size="sm" onClick={() => setTentativa((t) => t + 1)}>Tentar de novo</Button>
      </div>
    );
  }
  if (!dados) {
    return (
      <div role="status" className="mt-3 space-y-2">
        <span className="sr-only">Comparando o SCG gravado com os módulos…</span>
        <Skeleton className="h-4 w-3/5" />
        <Skeleton className="h-16 w-full" />
      </div>
    );
  }

  return (
    <div className="mt-3 space-y-3">
      {dados.map((c) => (
        <div key={c.periodo} className="rounded-lg border border-amber-400/30 bg-amber-400/[0.06] p-3">
          <p className="flex items-start gap-2 text-sm font-semibold text-amber-200">
            <AlertTriangle size={15} className="mt-0.5 shrink-0" aria-hidden />
            {c.periodo.split("/")[0]}: o SCG gravado não bate com a soma dos módulos
          </p>
          <div className="mt-2 overflow-x-auto">
            <table className="w-full min-w-[22rem] text-sm tabular-nums">
              <thead className="text-xs text-zinc-400">
                <tr>
                  <th className="py-1 pr-3 text-left font-medium"><span className="sr-only">Campo</span></th>
                  <th className="px-3 py-1 text-right font-medium">Soma dos módulos</th>
                  <th className="px-3 py-1 text-right font-medium">Gravado</th>
                  <th className="py-1 pl-3 text-right font-medium">Diferença</th>
                </tr>
              </thead>
              <tbody>
                {linhasDivergentes(c).map((l) => (
                  <tr key={l.campo} className="border-t border-white/[0.06]">
                    <td className="py-1 pr-3 font-medium text-zinc-300">{l.rotulo}</td>
                    <td className="px-3 py-1 text-right text-zinc-100">{brl(l.modulos)}</td>
                    <td className="px-3 py-1 text-right text-zinc-100">{l.gravado === null ? "não gravado" : brl(l.gravado)}</td>
                    <td className="py-1 pl-3 text-right text-amber-200">{l.diferenca === null ? "—" : brl(l.diferenca)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-2 text-xs text-zinc-300">
            Os dois valores estão aqui e o sistema não escolheu nenhum. Descubra a causa (com o analista) antes de
            decidir qual vale.{" "}
            <Link to={linkDoCiclo("/scg", cicloInicio, { chave: "periodo", valor: c.periodo })}
              className="font-medium text-sky-300 underline-offset-2 hover:underline">
              Abrir o SCG de {c.periodo.split("/")[0]}
            </Link>
          </p>
        </div>
      ))}
    </div>
  );
}
