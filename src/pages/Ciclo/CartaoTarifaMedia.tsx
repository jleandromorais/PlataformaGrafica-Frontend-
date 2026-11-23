import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getTarifaMedia } from "../../api";
import { Skeleton } from "../../components/ui/Skeleton";
import { classesDoBotao } from "../../components/ui/estilosBotao";
import type { TarifaMedia } from "../../types";
import { descreverTarifaMedia } from "./tarifaMedia";

/** Conteúdo do passo "Tarifa média" do roteiro do Ciclo: PV gravado + MB e a tarifa, só leitura.
 * Nunca grava e não soma nada: os números vêm de GET /tarifa/media. Sem a rota (back antigo), sobra só a frase
 * que manda para o PMPV. O link "Fechar no PMPV" (o PMPV do trimestre novo) aparece sempre. */
export function TarifaMediaDoCiclo({ trimestre, versao, link, semLink = false }: { trimestre: string; versao: number; link: string; semLink?: boolean }) {
  // O resultado guarda de qual busca veio; se não é a atual, a tela mostra o esqueleto.
  const [res, setRes] = useState<{ id: string; dados: TarifaMedia | null } | null>(null);
  const id = `${trimestre}#${versao}`;
  const dados = res?.id === id ? res.dados : null;
  const carregando = res?.id !== id;

  useEffect(() => {
    let vigente = true; // só a busca mais recente vale (trocar de trimestre durante uma busca)
    getTarifaMedia(trimestre).then((d) => { if (vigente) setRes({ id, dados: d }); });
    return () => { vigente = false; };
  }, [trimestre, id]);

  const fechar = semLink ? null : <Link to={link} className={classesDoBotao("primary", "sm")}>Fechar no PMPV</Link>;

  if (carregando) {
    return (
      <div role="status" className="space-y-2">
        <span className="sr-only">Consultando a tarifa média…</span>
        <Skeleton className="h-4 w-4/5" />
        <Skeleton className="h-4 w-3/5" />
        {fechar}
      </div>
    );
  }
  if (!dados) {
    return (
      <div className="space-y-2">
        <p>Feche a tarifa média na tela PMPV, depois de gravar o PV do trimestre novo.</p>
        {fechar}
      </div>
    );
  }

  const d = descreverTarifaMedia(dados);
  return (
    <div className="space-y-2">
      {d.cruzaAno && (
        <p className="text-xs text-zinc-400">O trimestre cruza o ano: uma tarifa para a MB de cada ano. O sistema não escolhe qual vale.</p>
      )}
      <ul className="space-y-1.5">
        {d.linhas.map((l) => (
          <li key={l.ano} className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-0.5 rounded-lg border border-white/[0.07] bg-white/[0.02] px-3 py-2">
            <span className="min-w-0 text-sm text-zinc-300">{l.origem}</span>
            {l.tarifa
              ? <span className="text-sm tabular-nums text-zinc-400">Tarifa média <b className="text-base font-semibold text-white">{l.tarifa}</b></span>
              : <span className="text-sm text-zinc-500">sem tarifa</span>}
          </li>
        ))}
      </ul>
      {d.motivo && <p className="text-sm text-amber-200">{d.motivo}</p>}
      {d.aviso && <p className="text-xs text-amber-200/90">{d.aviso}</p>}
      <div className="pt-1">{fechar}</div>
    </div>
  );
}
