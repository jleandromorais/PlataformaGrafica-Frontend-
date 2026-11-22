/** Bloco "Aguardando sua aprovação" do Painel: a prévia da cascata (SR, PR e PV) do trimestre aberto,
 * com "Aprovar em sequência". É o ÚNICO lugar onde a cascata é aprovada (spec do Fluxo único, decisão 4).
 *
 * Busca `GET /cascata/previa?periodos=<3 meses do trimestre>` e só aparece quando algo difere do gravado.
 * Pendências de OUTROS trimestres (`GET /cascata/pendente`) viram uma linha à parte, sem poluir este.
 * Nada é gravado aqui sem o clique: o servidor recalcula tudo e responde 409 se os dados mudaram.
 * Quem usa põe `key` no trimestre: trocar de trimestre recomeça o bloco limpo (sem o "Gravado." do anterior). */
import { useEffect, useRef, useState } from "react";
import { AlertTriangle } from "lucide-react";
import { cascataPendente, previaCascata } from "../../api";
import { Button } from "../../components/ui/Button";
import { PreviaCascata } from "../../components/ui/PreviaCascata";
import { cascataTemParaAprovar, outrosTrimestres } from "../../utils/aprovacao";
import { faixaDosMeses } from "../../utils/rotulos";
import type { Cascata } from "../../types";

export function AguardandoAprovacao({ meses, versao, aoMudar, aoAplicar }: {
  /** Os 3 meses do trimestre civil aberto no Painel. */
  meses: string[];
  /** Sobe quando algo foi gravado: a prévia é buscada de novo. */
  versao: number;
  /** Diz ao Painel se há algo que o analista PODE aprovar agora (o bloco "Próximo passo" usa). */
  aoMudar: (pendente: boolean) => void;
  /** Depois de aprovar: o Painel recarrega os passos. */
  aoAplicar: () => void;
}) {
  const [doTrimestre, setDoTrimestre] = useState<Cascata | null>(null);
  const [outros, setOutros] = useState<Cascata | null>(null);
  const [verOutros, setVerOutros] = useState(false);
  const [falhou, setFalhou] = useState(false);
  const [tentativa, setTentativa] = useState(0);
  const [carga, setCarga] = useState(0);          // muda a cada prévia nova: o PreviaCascata recomeça limpo
  const aplicou = useRef(false);                  // acabou de aprovar: o "Gravado." fica até a próxima prévia
  const avisar = useRef(aoMudar);
  useEffect(() => { avisar.current = aoMudar; });
  const chave = meses.join("|");

  useEffect(() => {
    let vivo = true;
    // Uma falha não derruba a outra: o aviso geral é um extra.
    Promise.all([
      previaCascata(meses).then((c) => ({ c }), () => ({ c: null })),
      cascataPendente().catch(() => null),
    ]).then(([previa, geral]) => {
      if (!vivo) return;
      setFalhou(previa.c === null);
      const aberto = previa.c;
      setOutros(outrosTrimestres(geral && geral.desatualizado ? geral : null, aberto));
      if (cascataTemParaAprovar(aberto)) {
        aplicou.current = false;
        setDoTrimestre(aberto);
        setCarga((n) => n + 1);
      } else if (!aplicou.current) {
        setDoTrimestre(null);
      }
      // Só é "para aprovar agora" quando não há pendência que trave o botão.
      const podeAprovar = cascataTemParaAprovar(aberto) && aberto!.pendencias.length === 0
        && aberto!.trimestres.every((t) => t.pendencias.length === 0);
      avisar.current(podeAprovar);
    });
    return () => { vivo = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chave, versao, tentativa]);

  const n = outros?.trimestres.length ?? 0;
  return (
    <div className="flex flex-col gap-3">
      {doTrimestre && (
        <PreviaCascata key={`${chave}-${carga}`} cascata={doTrimestre}
          aoAplicar={() => { aplicou.current = true; aoAplicar(); }} />
      )}

      {falhou && (
        <div role="alert" className="flex flex-wrap items-center gap-3 rounded-lg border border-white/[0.07] bg-white/[0.03] px-4 py-2.5 text-sm text-zinc-300">
          <AlertTriangle size={16} className="shrink-0 text-amber-400" aria-hidden />
          <p className="min-w-0 flex-1">Não consegui conferir se há valores à frente para aprovar em {faixaDosMeses(meses)}. Nada foi gravado.</p>
          <Button size="sm" variant="ghost" onClick={() => setTentativa((t) => t + 1)}>Tentar de novo</Button>
        </div>
      )}

      {outros && !verOutros && (
        <div role="status" className="flex flex-wrap items-center gap-3 rounded-lg border border-amber-500/20 bg-amber-500/[0.06] px-4 py-2.5 text-sm text-zinc-200">
          <AlertTriangle size={16} className="shrink-0 text-amber-400" aria-hidden />
          <p className="min-w-0 flex-1">
            <b className="text-amber-400">{n === 1 ? "Outro trimestre" : `Outros ${n} trimestres`} com SR, PR ou PV desatualizado.</b>{" "}
            Não é o que está aberto aqui. Nada será gravado sem a sua aprovação.
          </p>
          <Button variant="warning" size="sm" onClick={() => setVerOutros(true)}>Ver e aprovar</Button>
        </div>
      )}
      {outros && verOutros && (
        <PreviaCascata key={`outros-${outros.periodos.join("|")}`} cascata={outros} aoFechar={() => setVerOutros(false)}
          aoAplicar={() => { setVerOutros(false); setOutros(null); aoAplicar(); }} />
      )}
    </div>
  );
}
