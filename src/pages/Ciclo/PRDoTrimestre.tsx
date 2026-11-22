/** PR (Parcela de Recuperação) do trimestre do ciclo, no Painel (passo 8). A tela /pr virou consulta.
 *
 * Quem calcula é o back (`POST /pr/apurar`, que o Painel já chamou ao carregar e passa pronto): o PR usa o SCG e o SR
 * GRAVADOS do trimestre apurado e o VP do trimestre do PR. Aqui só se mostra o cálculo, o gravado ao lado, e se grava
 * pelo mesmo caminho da tela de antes (`POST /pr/salvar`) com a janela "Gravar o PR?" quando troca um valor gravado.
 * O PV que vem à frente não é regravado sozinho: o analista o aprova no bloco "Aguardando sua aprovação". */
import { useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Save } from "lucide-react";
import { Alert } from "../../components/ui/Alert";
import { Button } from "../../components/ui/Button";
import { ConfirmarGravacao } from "../../components/ui/ConfirmarGravacao";
import { EsqueletoBlocos } from "../../components/ui/EsqueletoBlocos";
import { classesDoBotao } from "../../components/ui/estilosBotao";
import { avisarSucesso } from "../../components/ui/avisos";
import { usePreviaCascata } from "../../components/ui/usePreviaCascata";
import { salvarPR } from "../../api";
import { mensagemDeErro } from "../../api/client";
import { AFETADOS_DA_TELA, precisaJanela } from "../../utils/confirmarGravacao";
import { chaveDoPR, prSubstitui, rotuloDoCartao } from "../../utils/cartoesPRePV";
import { brl, num } from "../../utils/format";
import { linkDoCiclo } from "../../utils/periodoNaUrl";
import { faixaDosMeses } from "../../utils/rotulos";
import type { PRApuracao } from "../../types";

const PANEL = "rounded-xl border border-white/[0.07] bg-panel";
const tarifa = (v: number) => num(v, 4);
const cor = (v: number) => (v > 0 ? "text-emerald-300" : v < 0 ? "text-red-300" : "text-zinc-300");

export function PRDoTrimestre({ apuracao, prSalvo, meses, mesesPR, carregando, onGravado }: {
  /** O que o Painel já calculou ao carregar (`POST /pr/apurar`); null se não conseguiu. */
  apuracao: PRApuracao | null;
  /** PR gravado deste trimestre do ciclo; null = ainda não gravado. */
  prSalvo: number | null;
  /** Os 3 meses do trimestre CIVIL apurado do Painel. */
  meses: string[];
  /** Os 3 meses do trimestre do ciclo que o PR define. */
  mesesPR: string[];
  carregando: boolean;
  /** Depois de gravar: o Painel recarrega os passos. */
  onGravado: () => void;
}) {
  const faixa = faixaDosMeses(mesesPR);
  const rotulo = rotuloDoCartao("pr", mesesPR);
  const chave = chaveDoPR(mesesPR);
  const [gravando, setGravando] = useState(false);
  const [confirmar, setConfirmar] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const botaoGravar = useRef<HTMLButtonElement>(null);
  const { previa, mostrarCascata } = usePreviaCascata("mt-4"); // o PV à frente: o analista aprova no bloco do Painel

  const substitui = !!apuracao && prSubstitui(prSalvo, apuracao.pr);
  const pendencias = apuracao?.pendencias ?? [];
  const podeGravar = !!apuracao && apuracao.vp > 0 && pendencias.length === 0 && !carregando && !gravando;

  /** O botão: pede confirmação quando troca um PR já gravado por outro valor; senão grava direto. */
  const pedirGravacao = () => {
    if (!apuracao) return;
    if (precisaJanela({ substitui, diverge: false })) setConfirmar(true);
    else void gravar();
  };

  const gravar = async () => {
    if (!apuracao) return;
    setErro(null);
    setGravando(true);
    try {
      const r = await salvarPR(chave, apuracao.scg_selic, apuracao.sr, apuracao.vp);
      mostrarCascata(r.cascata);
      avisarSucesso(`PR de ${faixa} gravado`, `${tarifa(r.pr)} R$/m³.`);
      onGravado();
    } catch (e) {
      setErro(mensagemDeErro(e, "Não foi possível gravar o PR."));
    } finally {
      setGravando(false);
    }
  };

  const gravadoTxt = prSalvo === null ? "ainda não gravado" : substitui ? `gravado ${tarifa(prSalvo)}, diferente do calculado` : `gravado ${tarifa(prSalvo)}, igual ao calculado`;

  return (
    <section aria-labelledby="pr-ciclo-titulo" className={`${PANEL} p-5 sm:p-6`}>
      <h2 id="pr-ciclo-titulo" className="text-base font-semibold text-white">PR — Parcela de Recuperação de {faixaDosMeses(mesesPR)}</h2>
      <p className="mt-1 text-sm text-zinc-400">
        Usa o SCG e o SR gravados de {faixaDosMeses(meses)} e o VP de {faixa}, em 4 casas. Nada é gravado até você confirmar.
      </p>

      {erro && <Alert variant="error" className="mt-4 whitespace-pre-line">{erro}</Alert>}
      {previa}

      <div aria-live="polite" aria-busy={carregando}>
        {carregando && !apuracao && <EsqueletoBlocos blocos={["h-8", "h-8", "h-8", "h-10"]} texto={`Calculando o ${rotulo}…`} />}
      </div>

      {!carregando && !apuracao && (
        <Alert variant="warning" className="mt-4">Não consegui calcular o PR agora. Abra a tela PR para ver o motivo.</Alert>
      )}

      {apuracao && (
        <div className={`mt-5 transition-opacity ${carregando ? "opacity-50" : ""}`}>
          {pendencias.length > 0 && (
            <Alert variant="warning" className="mb-4" titulo="Para gravar o PR, resolva antes:" itens={pendencias} />
          )}

          <div className="overflow-x-auto">
            <table className="w-full min-w-[34rem] text-sm tabular-nums">
              <caption className="sr-only">Saldo a recuperar de {faixaDosMeses(meses)}, mês a mês</caption>
              <thead className="text-[0.7rem] text-zinc-400">
                <tr className="border-b border-white/[0.07]">
                  <th scope="col" className="py-2 pr-3 text-left font-semibold">Mês</th>
                  <th scope="col" className="px-2 py-2 text-right font-semibold">SCG</th>
                  <th scope="col" className="px-2 py-2 text-right font-semibold">SELIC acum. (%)</th>
                  <th scope="col" className="px-2 py-2 text-right font-semibold">SCG com SELIC</th>
                  <th scope="col" className="py-2 pl-2 text-right font-semibold">SR com SELIC</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.05]">
                {apuracao.meses.map((m) => (
                  <tr key={m.periodo}>
                    <th scope="row" className="py-2 pr-3 text-left font-medium text-zinc-100">{m.periodo}</th>
                    <td className={`px-2 py-2 text-right ${cor(m.scg)}`}>{brl(m.scg)}</td>
                    <td className="px-2 py-2 text-right text-zinc-300">{num(m.selic, 6)}</td>
                    <td className={`px-2 py-2 text-right ${cor(m.scg_selic)}`}>{brl(m.scg_selic)}</td>
                    <td className={`py-2 pl-2 text-right ${cor(m.sr)}`}>{brl(m.sr)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t border-white/[0.12] font-semibold">
                  <th scope="row" colSpan={3} className="py-2 pr-3 text-right text-zinc-300">Totais</th>
                  <td className={`px-2 py-2 text-right ${cor(apuracao.scg_selic)}`}>{brl(apuracao.scg_selic)}</td>
                  <td className={`py-2 pl-2 text-right ${cor(apuracao.sr)}`}>{brl(apuracao.sr)}</td>
                </tr>
              </tfoot>
            </table>
          </div>

          <dl className="mt-4 grid gap-x-8 gap-y-1 text-sm sm:grid-cols-2">
            <Linha rotulo="Saldo total a recuperar" valor={brl(apuracao.saldo_total)} destaque={cor(apuracao.saldo_total)} />
            <Linha rotulo={`÷ VP (${apuracao.meses_pr.map((p, i) => `${p.split("/")[0]} ${num(apuracao.vps[i])}`).join(" + ")})`} valor={`${num(apuracao.vp)} m³`} />
            <Linha rotulo="PR (R$/m³)" valor={tarifa(apuracao.pr)} destaque={`text-lg font-bold ${cor(apuracao.pr)}`} />
            <Linha rotulo="PMPV → PV = PMPV + PR" valor={`${tarifa(apuracao.pmpv)} → ${tarifa(apuracao.pv)}`} />
          </dl>
          <p className={`mt-3 text-xs ${substitui ? "text-amber-300" : "text-zinc-500"}`}>PR {gravadoTxt}.</p>

          <div className="mt-4 flex flex-wrap items-center gap-3">
            <Button variant="solid" ref={botaoGravar} icon={<Save size={15} aria-hidden />} loading={gravando} disabled={!podeGravar} onClick={pedirGravacao}>
              {gravando ? "Gravando…" : `Gravar o ${rotulo}`}
            </Button>
            <Link to={linkDoCiclo("/pr", meses[0], { chave: "trimestre", valor: mesesPR[0] })} className={classesDoBotao("ghost", "md")}>
              Ver a conta e o histórico do PR
            </Link>
          </div>

          <ConfirmarGravacao aberto={confirmar} onFechar={() => setConfirmar(false)} voltarFoco={botaoGravar}
            oque={`o ${rotulo}`} rotuloAcao="Gravar o PR" afeta={AFETADOS_DA_TELA.pr} onConfirmar={() => void gravar()}
            linhas={[{ rotulo: "PR (R$/m³)", antes: prSalvo === null ? null : tarifa(prSalvo), depois: tarifa(apuracao.pr) }]} />
        </div>
      )}
    </section>
  );
}

function Linha({ rotulo, valor, destaque }: { rotulo: string; valor: string; destaque?: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4 py-0.5">
      <dt className="text-zinc-400">{rotulo}</dt>
      <dd className={`whitespace-nowrap tabular-nums ${destaque ?? "text-zinc-100"}`}>{valor}</dd>
    </div>
  );
}
