/** PV (Preço de Venda) do trimestre do ciclo, no Painel (passo 9). A tela /pv virou consulta.
 *
 * PV = PMPV + PR do mesmo trimestre. O Painel já leu o PMPV e o PR gravados (`GET /pv/trimestre`) e passa pronto;
 * aqui só se mostra, se compara com o PV gravado e se grava pelo mesmo caminho da tela de antes
 * (`POST /pv/trimestre/salvar`, que repete o valor nos 3 meses como o Excel Final lê), com a janela
 * "Gravar o PV?" quando troca um valor gravado ou há aviso. O PV é o fim da linha: não deixa nada à frente por aprovar. */
import { useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Save } from "lucide-react";
import { Alert } from "../../components/ui/Alert";
import { Button } from "../../components/ui/Button";
import { ConfirmarGravacao } from "../../components/ui/ConfirmarGravacao";
import { EsqueletoBlocos } from "../../components/ui/EsqueletoBlocos";
import { classesDoBotao } from "../../components/ui/estilosBotao";
import { avisarSucesso } from "../../components/ui/avisos";
import { salvarPVTrimestre } from "../../api";
import { mensagemDeErro } from "../../api/client";
import { AFETADOS_DA_TELA, precisaJanela } from "../../utils/confirmarGravacao";
import { chaveDoPV, pvSubstitui, rotuloDoCartao } from "../../utils/cartoesPRePV";
import { linkDoCiclo } from "../../utils/periodoNaUrl";
import { faixaDosMeses } from "../../utils/rotulos";
import type { PVTrimestre } from "../../types";

const PANEL = "rounded-xl border border-white/[0.07] bg-panel";
const tarifa = (v: number) => v.toFixed(4);

export function PVDoTrimestre({ pv, meses, mesesPR, carregando, onGravado }: {
  /** O que o Painel já leu ao carregar (`GET /pv/trimestre`); null se não conseguiu. */
  pv: PVTrimestre | null;
  /** Os 3 meses do trimestre CIVIL apurado do Painel. */
  meses: string[];
  /** Os 3 meses do trimestre do ciclo que o PV define. */
  mesesPR: string[];
  carregando: boolean;
  /** Depois de gravar: o Painel recarrega os passos. */
  onGravado: () => void;
}) {
  const faixa = faixaDosMeses(mesesPR);
  const rotulo = rotuloDoCartao("pv", mesesPR);
  const { trimestre, ano } = chaveDoPV(mesesPR);
  const [gravando, setGravando] = useState(false);
  const [confirmar, setConfirmar] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const botaoGravar = useRef<HTMLButtonElement>(null);

  const gravado = pv?.salvo?.pv ?? null;
  const substitui = !!pv && pvSubstitui(gravado, pv.pv);
  const avisos = pv?.avisos ?? [];
  const semPMPV = !!pv && pv.pmpv === 0;
  const podeGravar = !!pv && !semPMPV && !carregando && !gravando;

  /** O botão: pede confirmação quando troca um PV já gravado ou há aviso em amarelo; senão grava direto. */
  const pedirGravacao = () => {
    if (!pv) return;
    if (precisaJanela({ substitui, diverge: avisos.length > 0 })) setConfirmar(true);
    else void gravar();
  };

  const gravar = async () => {
    if (!pv) return;
    setErro(null);
    setGravando(true);
    try {
      const r = await salvarPVTrimestre(trimestre, ano, pv.pmpv, pv.pr);
      avisarSucesso(`PV de ${faixa} gravado`, `R$ ${tarifa(r.pv)} em ${r.gravado_em.join(", ")}.`);
      onGravado();
    } catch (e) {
      setErro(mensagemDeErro(e, "Não foi possível gravar o PV."));
    } finally {
      setGravando(false);
    }
  };

  const gravadoTxt = gravado === null ? "ainda não gravado" : substitui ? `gravado ${tarifa(gravado)}, diferente do calculado` : `gravado ${tarifa(gravado)}, igual ao calculado`;

  return (
    <section aria-labelledby="pv-ciclo-titulo" className={`${PANEL} p-5 sm:p-6`}>
      <h2 id="pv-ciclo-titulo" className="text-base font-semibold text-white">PV — Preço de Venda de {faixaDosMeses(mesesPR)}</h2>
      <p className="mt-1 text-sm text-zinc-400">
        PV = PMPV + PR do mesmo trimestre ({faixa}). Gravar repete o valor nos 3 meses, como o Excel Final lê. Nada é gravado até você confirmar.
      </p>

      {erro && <Alert variant="error" className="mt-4 whitespace-pre-line">{erro}</Alert>}

      <div aria-live="polite" aria-busy={carregando}>
        {carregando && !pv && <EsqueletoBlocos blocos={["h-8", "h-8", "h-10"]} texto={`Consultando o ${rotulo}…`} />}
      </div>

      {!carregando && !pv && (
        <Alert variant="warning" className="mt-4">Não consegui consultar o PV agora. Abra a tela PV para ver o motivo.</Alert>
      )}

      {pv && (
        <div className={`mt-5 transition-opacity ${carregando ? "opacity-50" : ""}`}>
          {avisos.length > 0 && <Alert variant="warning" className="mb-4" itens={avisos} />}
          {semPMPV && (
            <Alert variant="warning" className="mb-4">
              O PMPV de {faixa} está zerado. Grave o PMPV desse trimestre na tela PMPV antes de gravar o PV.
            </Alert>
          )}

          <dl className="grid gap-x-8 gap-y-1 text-sm sm:grid-cols-3">
            <Linha rotulo="PMPV (R$/m³)" valor={tarifa(pv.pmpv)} />
            <Linha rotulo="+ PR (R$/m³)" valor={tarifa(pv.pr)} />
            <Linha rotulo="= PV (R$/m³)" valor={tarifa(pv.pv)} destaque="text-lg font-bold text-white" />
          </dl>
          <p className={`mt-3 text-xs ${substitui ? "text-amber-300" : "text-zinc-500"}`}>PV {gravadoTxt}.</p>

          <div className="mt-4 flex flex-wrap items-center gap-3">
            <Button variant="solid" ref={botaoGravar} icon={<Save size={15} aria-hidden />} loading={gravando} disabled={!podeGravar} onClick={pedirGravacao}>
              {gravando ? "Gravando…" : `Gravar o ${rotulo}`}
            </Button>
            <Link to={linkDoCiclo("/pv", meses[0], { chave: "trimestre", valor: mesesPR[0] })} className={classesDoBotao("ghost", "md")}>
              Ver a prova real e o histórico do PV
            </Link>
          </div>

          <ConfirmarGravacao aberto={confirmar} onFechar={() => setConfirmar(false)} voltarFoco={botaoGravar}
            oque={`o ${rotulo}`} rotuloAcao="Gravar o PV" afeta={AFETADOS_DA_TELA.pv} onConfirmar={() => void gravar()}
            diverge={avisos.length > 0} motivos={avisos}
            linhas={[{ rotulo: "PV (R$/m³)", antes: gravado === null ? null : tarifa(gravado), depois: tarifa(pv.pv) }]} />
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
