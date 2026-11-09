/** RPV: destaques do mês + fórmula + prova real + histórico interativo.
 *
 * A tela não recebe valores digitados: o RPV é recalculado sozinho quando o CGR (Auditoria)
 * e o CGF são gravados. Aqui o analista vê COMO o RPV é calculado (card da fórmula) e a CONTA
 * ABERTA do mês escolhido (prova real), e escolhe o mês clicando na tabela "Histórico".
 * A entrada manual de CGR e CGF está guardada em ./EntradaManual.tsx. */
import { useCallback, useEffect, useRef, useState } from "react";
import { Alert } from "../../components/ui/Alert";
import { CardFormula } from "../../components/ui/CardFormula";
import { LinhasEsqueleto } from "../../components/ui/EsqueletoTabela";
import { Paginacao } from "../../components/ui/Paginacao";
import { PeriodoClicavel } from "../../components/ui/PeriodoClicavel";
import { useProvaRealDoMes } from "../../components/ui/useProvaRealDoMes";
import { PageHeader } from "../../components/layout/PageHeader";
import { getHistoricoRPV, getProvaRealRPV } from "../../api";
import { mensagemDeErro } from "../../api/client";
import { brl, brlEntrada, dataHora } from "../../utils/format";
import { MESES_ABREV } from "../../utils/periodos";
import { linhaDoMes } from "../../utils/linhaDoMes";
import { usePaginacao } from "../../utils/paginacao";
import { useManterPeriodoNaUrl, usePeriodoDaUrl } from "../../utils/periodoNaUrl";
import { rolarAteCardSeEscondido } from "../../utils/rolagem";
import type { RPVHistoricoLinha } from "../../types";
import { KpisRPV } from "./KpisRPV";
import { ProvaRealRPV } from "./ProvaRealRPV";

const PANEL = "rounded-xl border border-white/[0.07] bg-panel";

function corDoValor(v: number) {
  return v > 0 ? "text-emerald-300" : v < 0 ? "text-red-300" : "text-zinc-300";
}

export default function RPVPage() {
  const daUrl = usePeriodoDaUrl("periodo");
  const [escolhido, setEscolhido] = useState<string | null>(daUrl ? `${MESES_ABREV[daUrl.mes]}/${daUrl.ano}` : null);
  const [historico, setHistorico] = useState<RPVHistoricoLinha[]>([]);
  const [historicoCarregado, setHistoricoCarregado] = useState(false); // até a 1ª resposta, a tabela mostra o esqueleto
  const [erro, setErro] = useState<string | null>(null);

  const carregarHistorico = useCallback(() => {
    getHistoricoRPV()
      .then((h) => {
        setHistorico(h);
        // Sem mês na URL: abre na prova real do mês mais recente (o histórico vem do mais novo ao mais antigo).
        setEscolhido((atual) => atual ?? h[0]?.periodo ?? null);
      })
      .catch((e) => setErro(mensagemDeErro(e, "Não foi possível carregar o histórico do RPV.")))
      .finally(() => setHistoricoCarregado(true));
  }, []);
  useEffect(carregarHistorico, [carregarHistorico]);

  useManterPeriodoNaUrl("periodo", escolhido ?? "");
  const pag = usePaginacao(historico, { focoIndice: historico.findIndex((h) => h.periodo === escolhido) });

  // Uma busca só da prova real para KPIs, fórmula preenchida e card da prova real.
  const prova = useProvaRealDoMes(escolhido, getProvaRealRPV);
  const d = prova.dados && !prova.erro && prova.dados.gravado ? prova.dados : null;

  // Ao escolher um mês na tabela (que fica embaixo), leva a vista até a prova real se ela não estiver na tela.
  const provaRef = useRef<HTMLElement>(null);
  const abrirMes = (periodo: string) => {
    setEscolhido(periodo);
    rolarAteCardSeEscondido(provaRef.current);
  };

  return (
    <div className="px-4 py-6 sm:px-8 lg:px-10 lg:py-8">
      <div className="mx-auto flex max-w-[1500px] flex-col gap-6">
        <PageHeader modulo="rpv"
          descricao="Como o RPV é calculado e a prova real de cada mês. O RPV é recalculado sozinho quando o CGR (Auditoria) e o CGF são gravados." />

        {erro && <Alert variant="error" className="whitespace-pre-line">{erro}</Alert>}

        <KpisRPV periodo={escolhido} estado={prova} />

        {/* Fórmula (vinho) à esquerda, acompanhando a rolagem em xl; prova real à direita. */}
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
          <CardFormula className="xl:sticky xl:top-6 xl:col-span-5 xl:self-start 2xl:col-span-4"
            descricao="Como o RPV do mês é calculado."
            tituloAplicada={d ? `Com os números de ${d.periodo}` : undefined}
            aplicada={d ? [`RPV = ${brlEntrada(d.cgr)} − ${brlEntrada(d.cgf)} = ${brl(d.rpv_calculado)}`] : undefined}
            atualizando={prova.atualizando}
            formula={["RPV = CGR − CGF, por mês"]}
            termos={[
              { termo: "CGR", explicacao: "Custo do gás realizado: o CGR gravado na Auditoria CGR." },
              { termo: "CGF", explicacao: "Custo do gás faturado: volume final × PMPV, gravado na tela CGF." },
              { termo: "RPV", explicacao: "A diferença do mês. Positivo: CGR maior que CGF. Negativo: CGR menor que CGF." },
            ]}
            regras={[
              "O RPV é recalculado sozinho quando o CGR ou o CGF do mês é gravado.",
              "O RPV gravado alimenta o SCG do mês (SCG = RPV + RET + RP).",
            ]}
          />
          <ProvaRealRPV periodo={escolhido} estado={prova} cardRef={provaRef} className="xl:col-span-7 2xl:col-span-8" />
        </div>

        <section className={`${PANEL} overflow-hidden`}>
          <div className="border-b border-white/[0.07] px-5 py-4 sm:px-6">
            <h2 className="text-base font-semibold text-white">Histórico</h2>
            <p className="mt-0.5 text-xs text-zinc-500">Clique num mês para ver a prova real dele.</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[40rem] text-sm">
              <thead className="bg-white/[0.03] text-[0.7rem] text-zinc-400">
                <tr>
                  {["Período", "CGR", "CGF", "RPV", "Atualizado"].map((h, i) => (
                    <th key={h} scope="col" className={`px-4 py-3 font-semibold ${i ? "text-right" : "border-l-[3px] border-l-transparent text-left"}`}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.05]">
                {!historicoCarregado && <LinhasEsqueleto colunas={5} texto="Carregando o histórico…" />}
                {pag.itensDaPagina.map((h) => {
                  const ativo = h.periodo === escolhido;
                  return (
                    <tr key={h.periodo} aria-current={ativo ? "true" : undefined}
                      onClick={() => abrirMes(h.periodo)}
                      className={linhaDoMes(ativo, true)}>
                      <PeriodoClicavel periodo={h.periodo} valido ativo={ativo} onAbrir={abrirMes} />
                      <td className="px-4 py-2.5 text-right tabular-nums text-zinc-300">{brl(h.cgr)}</td>
                      <td className="px-4 py-2.5 text-right tabular-nums text-zinc-300">{brl(h.cgf)}</td>
                      <td className={`px-4 py-2.5 text-right font-semibold tabular-nums ${corDoValor(h.rpv)}`}>{brl(h.rpv)}</td>
                      <td className="px-4 py-2.5 text-right tabular-nums text-zinc-500">{dataHora(h.data_atualizacao)}</td>
                    </tr>
                  );
                })}
                {historicoCarregado && historico.length === 0 && (
                  <tr><td colSpan={5} className="px-4 py-8 text-center text-zinc-500">Nenhum período salvo ainda.</td></tr>
                )}
              </tbody>
            </table>
          </div>
          <Paginacao {...pag} onMudar={pag.setPagina} rotulo={["mês", "meses"]} />
        </section>
      </div>
    </div>
  );
}
