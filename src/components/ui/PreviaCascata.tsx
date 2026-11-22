/** Bloco "Aguardando sua aprovação" da cascata SR → PR → PV: depois de gravar um módulo (Auditoria, CGF, RET, RP,
 * SCG, SR, PR, PMPV), o que vem à frente NÃO é regravado sozinho. Aqui o analista vê, por trimestre, o valor
 * gravado hoje (Antes) ao lado do que o servidor calculou (Novo) e só grava ao clicar em "Aprovar em sequência".
 * Só o Painel do Ciclo desenha este componente; as outras telas mostram uma linha com o link para ele.
 * O servidor recalcula tudo na hora de gravar: os números desta tela nunca são enviados para gravar. */
import { useState } from "react";
import { AlertTriangle, ArrowRight, CheckCircle2, Loader2 } from "lucide-react";
import { aplicarCascata, previaCascata } from "../../api";
import { mensagemDeErro } from "../../api/client";
import { isAxiosError } from "axios";
import { brl, num } from "../../utils/format";
import type { Cascata, CascataTrimestre } from "../../types";
import { Button } from "./Button";
import { avisarErro, avisarSucesso } from "./avisos";
import { EVENTO_CASCATA_APROVADA } from "../../utils/aprovacao";

const tarifa = (v: number | null) => (v === null ? "não gravado" : num(v, 4));
const dinheiro = (v: number | null) => (v === null ? "não gravado" : brl(v));

/** "Jul/2026_Set/2026" vira "Jul a Set/2026". */
function rotuloDoSR(trimestre: string): string {
  const [ini, fim] = trimestre.split("_");
  if (!fim) return trimestre;
  const [m1, a1] = ini.split("/");
  const [, a2] = fim.split("/");
  return a1 === a2 ? `${m1} a ${fim}` : `${ini} a ${fim}`;
}

interface Linha { rotulo: string; antes: number | null; novo: number | null; formato: (v: number | null) => string }

/** As linhas da tabela de um trimestre: SR (só se a cascata parte dele), PR e PV. */
function linhasDe(t: CascataTrimestre): Linha[] {
  const linhas: Linha[] = [];
  if (t.trimestre_sr) linhas.push({ rotulo: `SR de ${rotuloDoSR(t.trimestre_sr)}`, antes: t.sr_antes, novo: t.sr_novo, formato: dinheiro });
  linhas.push({ rotulo: `PR de ${t.chave_pr}`, antes: t.pr_antes, novo: t.pr_novo, formato: tarifa });
  linhas.push({ rotulo: `PV de ${t.chave_pv}`, antes: t.pv_antes, novo: t.pv_novo, formato: tarifa });
  return linhas;
}

/** Mudou de verdade? Tarifa tem 4 casas; o SR (dinheiro) tolera 1 centavo. */
const mudou = (l: Linha) => l.novo !== null && (l.antes === null || Math.abs(l.novo - l.antes) > (l.formato === dinheiro ? 0.005 : 0.00005));

export function PreviaCascata({ cascata: cascataDaTela, aoAplicar, aoFechar, className = "" }: {
  cascata: Cascata | null | undefined;
  /** Chamado depois de gravar (a tela pode recarregar o que mostra). */
  aoAplicar?: (resultado: Cascata) => void;
  /** "Agora não": esconde a prévia (nada é gravado; o aviso geral continua no Painel). */
  aoFechar?: () => void;
  className?: string;
}) {
  const [gravando, setGravando] = useState(false);
  const [gravada, setGravada] = useState<Cascata | null>(null);
  const [recalculada, setRecalculada] = useState<Cascata | null>(null); // prévia refeita depois de um 409
  const [mudou409, setMudou409] = useState(false); // os dados mudaram desde a prévia: nada foi gravado
  const cascata = recalculada ?? cascataDaTela;

  if (!cascata) return null;
  const pendencias = [...new Set([...cascata.pendencias, ...cascata.trimestres.flatMap((t) => t.pendencias)])];
  // Nada a aprovar e nada pendente: não ocupa lugar na tela.
  if (!gravada && !cascata.desatualizado && pendencias.length === 0) return null;

  const aprovar = async () => {
    setGravando(true);
    try {
      const r = await aplicarCascata(cascata.periodos, cascata.a_partir_de, { esperado: cascata.trimestres });
      setGravada(r);
      avisarSucesso("SR, PR e PV gravados", `${r.trimestres.length === 1 ? "1 trimestre atualizado" : `${r.trimestres.length} trimestres atualizados`} pelo servidor.`);
      window.dispatchEvent(new Event(EVENTO_CASCATA_APROVADA));
      aoAplicar?.(r);
    } catch (e) {
      // 409: o valor mudou desde a prévia. Nada foi gravado; o analista refaz a prévia e confere de novo.
      if (isAxiosError(e) && e.response?.status === 409) { setMudou409(true); return; }
      // 422 com as pendências: nada foi gravado.
      // O servidor manda as pendências uma por linha ("- falta o SCG de Set/2026"): cada uma vira um item do toast.
      const linhas = mensagemDeErro(e, "Não foi possível gravar o SR, o PR e o PV. Nada foi gravado.")
        .split(/\r?\n/).map((l) => l.replace(/^\s*-\s*/, "").trim()).filter(Boolean);
      avisarErro("Não gravei a cascata", linhas);
    } finally {
      setGravando(false);
    }
  };

  const refazer = async () => {
    setGravando(true);
    try {
      setRecalculada(await previaCascata(cascata.periodos, cascata.a_partir_de));
      setMudou409(false);
    } catch (e) {
      avisarErro("Não refiz a prévia", [mensagemDeErro(e, "Tente de novo em instantes.")]);
    } finally {
      setGravando(false);
    }
  };

  if (gravada) {
    return (
      <div role="status" className={`flex items-start gap-2.5 rounded-lg border border-emerald-500/20 bg-emerald-500/[0.06] px-4 py-2.5 text-sm text-zinc-200 ${className}`}>
        <CheckCircle2 size={16} className="mt-0.5 shrink-0 text-emerald-400" aria-hidden />
        <p><b className="text-emerald-400">Gravado.</b> O SR, o PR e o PV aprovados agora estão com os valores novos.</p>
      </div>
    );
  }

  const bloqueada = pendencias.length > 0;
  return (
    <section aria-label="Valores à frente para aprovar" className={`rounded-xl border border-amber-500/25 bg-amber-500/[0.05] p-4 text-sm ${className}`}>
      <h3 className="flex items-center gap-2 font-semibold text-amber-400">
        <AlertTriangle size={16} aria-hidden /> Aguardando sua aprovação
      </h3>
      <p className="mt-1 text-zinc-300">
        <b className="text-zinc-100">O SR, o PR e o PV ficaram desatualizados.</b> O que você gravou já vale. O que vem à frente{" "}
        <b className="text-zinc-100">não foi alterado</b>: confira o que mudaria e aprove para gravar. Se preferir um de cada vez, grave pelos
        cartões do SR, do PR e do PV, mais abaixo.
      </p>

      <div className="mt-3 space-y-3">
        {cascata.trimestres.map((t) => (
          <div key={t.periodo} className="overflow-x-auto rounded-lg border border-white/[0.07] bg-white/[0.02]">
            <table className="w-full min-w-[28rem] text-xs">
              <caption className="sr-only">Antes e depois de {t.chave_pv}</caption>
              <thead className="text-left text-zinc-500">
                <tr>
                  <th scope="col" className="px-3 py-2 font-medium">Trimestre {t.meses_pr.length ? `(${t.meses_pr[0].split("/")[0]} a ${t.meses_pr[t.meses_pr.length - 1]})` : ""}</th>
                  <th scope="col" className="px-3 py-2 text-right font-medium">Antes (gravado)</th>
                  <th scope="col" className="w-6" aria-hidden />
                  <th scope="col" className="px-3 py-2 text-right font-medium">Novo (calculado)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.05]">
                {linhasDe(t).map((l) => (
                  <tr key={l.rotulo}>
                    <td className="px-3 py-1.5 text-zinc-300">{l.rotulo}</td>
                    <td className="px-3 py-1.5 text-right tabular-nums text-zinc-400">{l.formato(l.antes)}</td>
                    <td className="text-zinc-600"><ArrowRight size={12} aria-hidden /></td>
                    <td className={`px-3 py-1.5 text-right tabular-nums ${l.novo === null ? "text-zinc-500" : mudou(l) ? "font-semibold text-amber-300" : "text-zinc-300"}`}>
                      {l.novo === null ? "não calculado" : l.formato(l.novo)}
                      {l.novo !== null && !mudou(l) && <span className="ml-1 text-zinc-500">(igual)</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))}
      </div>

      {pendencias.length > 0 && (
        <div className="mt-3 rounded-lg border border-red-500/20 bg-red-500/[0.06] px-3 py-2 text-zinc-200">
          <p className="text-xs font-semibold text-red-400">Falta resolver antes de gravar</p>
          <ul className="mt-1 list-disc space-y-0.5 pl-4 text-xs">
            {pendencias.map((p) => <li key={p}>{p}</li>)}
          </ul>
        </div>
      )}

      {mudou409 && (
        <div role="alert" className="mt-3 rounded-lg border border-amber-500/30 bg-amber-500/[0.08] px-3 py-2 text-zinc-200">
          <p className="text-xs font-semibold text-amber-300">Os dados mudaram desde a prévia. Nada foi gravado.</p>
          <p className="mt-1 text-xs">Recalcule a prévia, confira os valores novos e aprove de novo.</p>
          <Button className="mt-2" variant="warning" size="sm" onClick={() => void refazer()} disabled={gravando}>Refazer a prévia</Button>
        </div>
      )}

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <Button variant="solid" onClick={() => void aprovar()} disabled={bloqueada || gravando}
          icon={gravando ? <Loader2 size={14} className="animate-spin" aria-hidden /> : undefined}>
          Aprovar em sequência
        </Button>
        {aoFechar && <Button variant="ghost" onClick={aoFechar} disabled={gravando}>Agora não</Button>}
        {bloqueada && <span className="text-xs text-zinc-500">Resolva as pendências acima para liberar o botão.</span>}
      </div>
    </section>
  );
}
