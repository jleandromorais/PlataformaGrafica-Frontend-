/** SR (Saldo Remanescente) do trimestre apurado do Painel do Ciclo.
 *
 * O Painel busca sozinho o VP (PMPV), o VF (CGF), o PR (módulo PR) e a SELIC (Banco Central),
 * monta o SR e mostra onde ele diverge do gravado. Nada é gravado até o analista confirmar:
 * o botão Gravar sempre pede confirmação e, havendo divergência, diz isso com todas as letras
 * (mesmo aviso do Processar). Os números vêm do backend (POST /sr/trimestre/proposta);
 * aqui só se mostra, se compara com o gravado e se grava pelo mesmo caminho da tela /sr. */
import { useRef, useState } from "react";
import { AlertTriangle, Calculator, Save } from "lucide-react";
import { Alert } from "../../components/ui/Alert";
import { Button } from "../../components/ui/Button";
import { EsqueletoBlocos } from "../../components/ui/EsqueletoBlocos";
import { ModalAviso } from "../../components/ui/ModalAviso";
import { avisarSucesso, faixaDosMeses } from "../../components/ui/avisos";
import { propostaSRTrimestre, salvarTrimestreSR } from "../../api";
import { mensagemDeErro } from "../../api/client";
import { brl, num } from "../../utils/format";
import { textoPRAutomatico } from "../../utils/prAutomatico";
import {
  camposDiferentes, faixaDoTrimestre, mesesDivergentes, motivosDoMes, rotuloDoPR, tituloDaDivergencia,
} from "../../utils/propostaSR";
import type { SRProposta, SRPropostaLinha } from "../../types";

const PANEL = "rounded-xl border border-white/[0.07] bg-panel";
const tarifa = (v: number) => brl(v, 4);

export function SRDoTrimestre({ meses, onGravado }: {
  /** Os 3 meses do trimestre apurado do Painel, ex.: ["Jan/2026", "Fev/2026", "Mar/2026"]. */
  meses: string[];
  /** Depois de gravar: o Painel recarrega as etapas. */
  onGravado: () => void;
}) {
  const faixa = faixaDoTrimestre(meses);
  const [proposta, setProposta] = useState<SRProposta | null>(null);
  const [carregando, setCarregando] = useState(false);
  const [gravando, setGravando] = useState(false);
  const [confirmar, setConfirmar] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [sucesso, setSucesso] = useState<string | null>(null);
  const [avisoPR, setAvisoPR] = useState<string | null>(null);
  const ultimaBusca = useRef(0);
  const botaoGravar = useRef<HTMLButtonElement>(null);

  /** Pede a proposta ao backend. `manterMensagens`: depois de gravar, a frase de sucesso fica na tela. */
  const calcular = async (manterMensagens = false) => {
    const busca = ++ultimaBusca.current;
    if (!manterMensagens) { setSucesso(null); setAvisoPR(null); }
    setErro(null);
    setCarregando(true);
    try {
      const p = await propostaSRTrimestre(meses);
      if (busca === ultimaBusca.current) setProposta(p);
    } catch (e) {
      if (busca === ultimaBusca.current) setErro(mensagemDeErro(e, `Não foi possível calcular o SR de ${faixa}.`));
    } finally {
      if (busca === ultimaBusca.current) setCarregando(false);
    }
  };

  const gravar = async () => {
    if (!proposta || !proposta.pode_gravar) return;
    setConfirmar(false);
    setErro(null);
    setGravando(true);
    try {
      // Mesmos campos e mesma chamada da tela /sr: o back regrava o PR e o PV do trimestre seguinte.
      const linhas = proposta.linhas.map(({ mes, vp, vf, pr, selic_mensal, sr_anterior, diferenca, sr_parcela, sr_selic, total }) =>
        ({ mes, vp, vf, pr, selic_mensal, sr_anterior, diferenca, sr_parcela, sr_selic, total }));
      const salvo = await salvarTrimestreSR(meses, meses[meses.length - 1], linhas);
      const pr = textoPRAutomatico(salvo.pr_automatico);
      setSucesso(`SR de ${faixa} gravado. Total = ${brl(salvo.total)}.${pr?.ok ? ` ${pr.texto}` : ""}`);
      setAvisoPR(pr && !pr.ok ? pr.texto : null);
      // Só cita o PR/PV no aviso quando o back confirmou que atualizou; a pendência fica no aviso amarelo.
      avisarSucesso(`SR de ${faixaDosMeses(meses)} gravado`, `Total = ${brl(salvo.total)}.${pr?.ok ? ` ${pr.texto}` : ""}`);
      onGravado();
      await calcular(true); // a proposta passa a mostrar o gravado novo
    } catch (e) {
      setErro(mensagemDeErro(e, "Não foi possível gravar o SR do trimestre."));
    } finally {
      setGravando(false);
    }
  };

  const divergentes = proposta ? mesesDivergentes(proposta) : [];
  const motivosPorMes = proposta ? proposta.linhas.filter((l) => motivosDoMes(l).length > 0) : [];

  return (
    <section aria-labelledby="sr-ciclo-titulo" className={`${PANEL} p-5 sm:p-6`}>
      <h2 id="sr-ciclo-titulo" className="text-base font-semibold text-white">SR — Saldo Remanescente de {meses[0]} a {meses[meses.length - 1]}</h2>
      <p className="mt-1 text-sm text-zinc-400">
        Calcula o SR com o VP do PMPV, o VF do CGF, o PR do módulo PR e a SELIC do Banco Central. Nada é gravado até você confirmar.
      </p>

      <div className="mt-4">
        <Button variant="primary" icon={<Calculator size={15} />} loading={carregando} onClick={() => calcular()}>
          {proposta ? `Calcular de novo o SR de ${faixa}` : `Calcular SR de ${faixa}`}
        </Button>
      </div>

      {erro && <Alert variant="error" className="mt-4 whitespace-pre-line">{erro}</Alert>}
      {sucesso && <Alert variant="success" className="mt-4">{sucesso}</Alert>}
      {avisoPR && <Alert variant="warning" className="mt-4 whitespace-pre-line">{avisoPR}</Alert>}

      {/* Enquanto a proposta carrega pela primeira vez: esqueleto no formato da tabela. */}
      <div aria-live="polite" aria-busy={carregando}>
        {carregando && !proposta && <EsqueletoBlocos blocos={["h-8", "h-8", "h-8", "h-8", "h-10"]} texto={`Calculando o SR de ${faixa}…`} />}
      </div>

      {proposta && (
        <div className={`mt-5 transition-opacity ${carregando ? "opacity-50" : ""}`}>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[46rem] text-sm tabular-nums">
              <caption className="sr-only">SR de {faixa}, mês a mês, com o que está gravado hoje quando é diferente</caption>
              <thead className="text-[0.7rem] text-zinc-400">
                <tr className="border-b border-white/[0.07]">
                  <th scope="col" className="py-2 pr-3 text-left font-semibold">Mês</th>
                  <th scope="col" className="px-2 py-2 text-right font-semibold">VP (m³)</th>
                  <th scope="col" className="px-2 py-2 text-right font-semibold">VF (m³)</th>
                  <th scope="col" className="px-2 py-2 text-right font-semibold">VP − VF</th>
                  <th scope="col" className="px-2 py-2 text-right font-semibold">PR (R$/m³)</th>
                  <th scope="col" className="px-2 py-2 text-right font-semibold">SELIC</th>
                  <th scope="col" className="px-2 py-2 text-right font-semibold">SR anterior</th>
                  <th scope="col" className="py-2 pl-2 text-right font-semibold">SR do mês</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.05]">
                {proposta.linhas.map((l) => <LinhaDoMes key={l.mes} l={l} />)}
              </tbody>
              <tfoot>
                <tr className="border-t border-white/[0.12] font-semibold">
                  <th scope="row" colSpan={7} className="py-2 pr-3 text-left text-zinc-200">Total do SR (novo)</th>
                  <td className="py-2 pl-2 text-right text-sky-200">{brl(proposta.total)}</td>
                </tr>
                {proposta.total_gravado !== null && (
                  <>
                    <tr>
                      <th scope="row" colSpan={7} className="py-1 pr-3 text-left font-normal text-zinc-400">Total gravado hoje</th>
                      <td className="py-1 pl-2 text-right text-zinc-300">{brl(proposta.total_gravado)}</td>
                    </tr>
                    {proposta.diferenca_total !== null && (
                      <tr>
                        <th scope="row" colSpan={7} className="py-1 pr-3 text-left font-normal text-zinc-400">Diferença</th>
                        <td className={`py-1 pl-2 text-right ${Math.abs(proposta.diferenca_total) > 0.005 ? "font-semibold text-amber-300" : "text-zinc-300"}`}>
                          {brl(proposta.diferenca_total)}
                        </td>
                      </tr>
                    )}
                  </>
                )}
              </tfoot>
            </table>
          </div>

          {!proposta.selic.disponivel && proposta.selic.mensagem && (
            <Alert variant="warning" className="mt-4 whitespace-pre-line">{proposta.selic.mensagem}</Alert>
          )}
          {proposta.selic.disponivel && (
            <p className="mt-2 text-xs text-zinc-500">SELIC: {proposta.selic.fonte}.</p>
          )}

          {proposta.bloqueios.length > 0 && (
            <Alert variant="error" className="mt-4">
              <span className="block font-semibold">Não dá para gravar ainda:</span>
              <ul className="mt-1 list-disc space-y-0.5 pl-5">
                {proposta.bloqueios.map((b, i) => <li key={i}>{b}</li>)}
              </ul>
            </Alert>
          )}

          {/* Antes de gravar: divergência é dita com todas as letras, e quem decide é o analista. */}
          {divergentes.length > 0 ? (
            <Alert variant="warning" className="mt-4">
              <span className="block font-semibold">{tituloDaDivergencia(divergentes.length)}</span>
              <span className="mt-1 block">
                Se você gravar agora, será gravado <b>com a divergência</b>. Cabe ao analista analisar os dados antes de gravar.
              </span>
              <ul className="mt-1.5 list-none space-y-0.5 pl-0">
                {motivosPorMes.map((l) => (
                  <li key={l.mes} className="flex items-start gap-1.5">
                    <AlertTriangle size={13} className="mt-0.5 shrink-0" aria-hidden />
                    <span><b>{l.mes}</b>: {motivosDoMes(l).join("; ")}.</span>
                  </li>
                ))}
              </ul>
            </Alert>
          ) : (
            <p className="mt-4 text-sm text-emerald-300">Nenhuma divergência. Mesmo assim, cabe ao analista conferir antes de gravar.</p>
          )}

          <div className="mt-4">
            <button ref={botaoGravar} type="button" onClick={() => setConfirmar(true)}
              disabled={!proposta.pode_gravar || gravando || carregando}
              className="inline-flex items-center gap-2 rounded-lg bg-marinho px-4 py-2 text-sm font-semibold text-paper transition-colors hover:bg-marinho-claro focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-400 disabled:cursor-not-allowed disabled:bg-white/[0.06] disabled:text-zinc-400">
              {gravando ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" aria-hidden /> : <Save size={15} aria-hidden />}
              {gravando ? "Gravando…" : `Gravar o SR de ${faixa}`}
            </button>
          </div>

          <ModalAviso aberto={confirmar} onFechar={() => setConfirmar(false)} variante="atencao" voltarFoco={botaoGravar}
            rotuloFechar="Cancelar e conferir"
            titulo={divergentes.length ? "Gravar com divergências?" : `Gravar o SR de ${faixa}?`}
            acao={{ rotulo: divergentes.length ? "Gravar com divergências" : "Gravar o SR", onClick: gravar }}>
            <div className="space-y-3 text-sm">
              {divergentes.length > 0 && (
                <p>
                  Há divergência em <b>{divergentes.length === 1 ? "1 mês" : `${divergentes.length} meses`}</b>. Se continuar, será gravado
                  {" "}<b>com as divergências</b>. <b>Cabe ao analista analisar os dados antes de gravar.</b>
                </p>
              )}
              <dl className="space-y-1 rounded-lg border border-white/[0.07] bg-white/[0.03] px-4 py-3 tabular-nums">
                <div className="flex justify-between gap-4">
                  <dt className="text-zinc-400">Gravado hoje</dt>
                  <dd className="text-zinc-200">{proposta.total_gravado === null ? "nada gravado" : brl(proposta.total_gravado)}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="font-semibold text-zinc-200">Passa a ser</dt>
                  <dd className="font-semibold text-sky-200">{brl(proposta.total)}</dd>
                </div>
              </dl>
            </div>
          </ModalAviso>
        </div>
      )}
    </section>
  );
}

/** Uma linha do mês; abaixo dela, em âmbar, o gravado nas colunas que diferem e os alertas do mês. */
function LinhaDoMes({ l }: { l: SRPropostaLinha }) {
  const dif = new Set<string>(camposDiferentes(l));
  const g = l.gravado;
  const origemPR = rotuloDoPR(l.pr_chave);
  /** Valor gravado pequeno, em âmbar, só quando a coluna difere. */
  const gravado = (campo: string, texto: string | null) =>
    dif.has(campo) && texto ? <span className="block text-[0.7rem] font-normal text-amber-300">gravado: {texto}</span> : null;

  return (
    <tr className="align-top">
      <th scope="row" className="py-2 pr-3 text-left font-medium text-zinc-100">{l.mes}</th>
      <td className="px-2 py-2 text-right text-zinc-200">{num(l.vp, 2)}{g && gravado("vp", num(g.vp, 2))}</td>
      <td className="px-2 py-2 text-right text-zinc-200">{num(l.vf, 2)}{g && gravado("vf", num(g.vf, 2))}</td>
      <td className="px-2 py-2 text-right text-zinc-300">{num(l.diferenca, 2)}</td>
      <td className="px-2 py-2 text-right text-zinc-200">
        {tarifa(l.pr)}
        {g && gravado("pr", tarifa(g.pr))}
        {(origemPR || l.pr_origem !== "salvo") && (
          <span className={`block text-[0.7rem] font-normal ${l.pr_origem === "salvo" ? "text-zinc-500" : "text-amber-300"}`}>
            {l.pr_origem === "ausente" ? "PR ausente" : `${origemPR}${l.pr_origem === "estimado" ? " (estimado)" : ""}`}
          </span>
        )}
      </td>
      <td className="px-2 py-2 text-right text-zinc-200">{num(l.selic_mensal, 4)}%{g && gravado("selic_mensal", `${num(g.selic_mensal, 4)}%`)}</td>
      <td className="px-2 py-2 text-right text-zinc-300">{brl(l.sr_anterior)}{g && gravado("sr_anterior", brl(g.sr_anterior))}</td>
      <td className="py-2 pl-2 text-right font-semibold text-zinc-100">{brl(l.sr_selic)}{g && gravado("sr_selic", brl(g.sr_selic))}</td>
    </tr>
  );
}
