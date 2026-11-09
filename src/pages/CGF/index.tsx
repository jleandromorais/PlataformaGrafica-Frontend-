/** CGF: destaques do mês + fórmula + prova real + histórico interativo.
 *
 * A tela não lê planilhas nem grava: isso fica no Painel do Ciclo (Processar).
 * Aqui o analista vê COMO o CGF é calculado (card da fórmula) e a CONTA ABERTA do mês
 * escolhido (prova real), e escolhe o mês clicando na tabela "Histórico gravado".
 * A leitura antiga pela própria tela está guardada em ./LeituraDoMes.tsx. */
import { useEffect, useRef, useState } from "react";
import { Alert } from "../../components/ui/Alert";
import { CardFormula } from "../../components/ui/CardFormula";
import { LinhasEsqueleto } from "../../components/ui/EsqueletoTabela";
import { Paginacao } from "../../components/ui/Paginacao";
import { PeriodoClicavel } from "../../components/ui/PeriodoClicavel";
import { useProvaRealDoMes } from "../../components/ui/useProvaRealDoMes";
import { PageHeader } from "../../components/layout/PageHeader";
import { getHistoricoCGF, getProvaRealCGF } from "../../api";
import { mensagemDeErro } from "../../api/client";
import { brl, dataHora, num } from "../../utils/format";
import { MESES_ABREV } from "../../utils/periodos";
import { linhaDoMes } from "../../utils/linhaDoMes";
import { usePaginacao } from "../../utils/paginacao";
import { useManterPeriodoNaUrl, usePeriodoDaUrl } from "../../utils/periodoNaUrl";
import { rolarAteCardSeEscondido } from "../../utils/rolagem";
import type { CGFHistoricoLinha } from "../../types";
import { KpisCGF } from "./KpisCGF";
import { ProvaRealCGF } from "./ProvaRealCGF";

const PANEL = "rounded-xl border border-white/[0.07] bg-panel";

export default function CGFPage() {
  // "Fazer agora" do Painel do Ciclo abre no mês certo (?periodo=Mai/2026).
  const daUrl = usePeriodoDaUrl("periodo");
  const [escolhido, setEscolhido] = useState<string | null>(daUrl ? `${MESES_ABREV[daUrl.mes]}/${daUrl.ano}` : null);
  const [historico, setHistorico] = useState<CGFHistoricoLinha[]>([]);
  const [historicoCarregado, setHistoricoCarregado] = useState(false); // até a 1ª resposta, a tabela mostra o esqueleto
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    getHistoricoCGF()
      .then((h) => {
        setHistorico(h);
        // Sem mês na URL: abre na prova real do mês mais recente (o histórico vem do mais novo ao mais antigo).
        setEscolhido((atual) => atual ?? h.find((l) => l.periodo_valido)?.periodo ?? null);
      })
      .catch((e) => setErro(mensagemDeErro(e, "Não foi possível carregar o histórico do CGF.")))
      .finally(() => setHistoricoCarregado(true));
  }, []);

  useManterPeriodoNaUrl("periodo", escolhido ?? "");
  const pag = usePaginacao(historico, { focoIndice: historico.findIndex((h) => h.periodo === escolhido) });

  // Uma busca só da prova real para KPIs, fórmula preenchida e card da prova real.
  const prova = useProvaRealDoMes(escolhido, getProvaRealCGF);
  const d = prova.dados && !prova.erro && prova.dados.tem_resumo ? prova.dados : null;

  // Ao escolher um mês na tabela (que fica embaixo), leva a vista até a prova real se ela não estiver na tela.
  const provaRef = useRef<HTMLElement>(null);
  const abrirMes = (periodo: string) => {
    setEscolhido(periodo);
    rolarAteCardSeEscondido(provaRef.current);
  };

  // Fórmula preenchida: só mostra os números que o backend devolveu.
  const aplicada = d ? [
    `Volume final = ${num(d.volume_faturado, 4)} − ${num(d.volume_devolucoes, 4)} = ${num(d.volume_final_calculado, 4)} m³`,
    ...(d.pmpv !== null && d.cgf_calculado !== null
      ? [`CGF = ${num(d.volume_final_calculado, 4)} × ${num(d.pmpv, 4)} = ${brl(d.cgf_calculado)}`]
      : ["CGF = sem PMPV neste mês"]),
  ] : undefined;

  return (
    <div className="px-4 py-6 sm:px-8 lg:px-10 lg:py-8">
      <div className="mx-auto flex max-w-[1500px] flex-col gap-6">
        <PageHeader modulo="cgf"
          descricao="Como o CGF é calculado e a prova real de cada mês. Para ler as planilhas de NF e gravar um mês, use o Painel do Ciclo." />

        {erro && <Alert variant="error">{erro}</Alert>}

        <KpisCGF periodo={escolhido} estado={prova} />

        {/* Fórmula (vinho) à esquerda, acompanhando a rolagem em xl; prova real à direita. */}
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
          <CardFormula className="xl:sticky xl:top-6 xl:col-span-5 xl:self-start 2xl:col-span-4"
            descricao="Como o CGF do mês é calculado a partir das planilhas de NF."
            tituloAplicada={d ? `Com os números de ${d.periodo}` : undefined}
            aplicada={aplicada}
            atualizando={prova.atualizando}
            formula={[
              "Volume final = faturado − devoluções",
              "CGF (R$) = volume final × PMPV do mês",
            ]}
            termos={[
              { termo: "faturado", explicacao: "Volume das NF faturadas e complementares, já sem o consumo próprio (m³)." },
              { termo: "devoluções", explicacao: "Volume das NF devolvidas no mês (m³)." },
              { termo: "PMPV", explicacao: "Preço médio ponderado do mês, em R$/m³ (tela PMPV)." },
            ]}
            regras={[
              "Canceladas, denegadas e rejeitadas são só informativas: não entram no volume final.",
              "Consumo próprio já foi retirado do faturado.",
              "O CGF gravado alimenta o RPV do mês (RPV = CGR − CGF).",
            ]}
          />
          <ProvaRealCGF periodo={escolhido} estado={prova} cardRef={provaRef} className="xl:col-span-7 2xl:col-span-8" />
        </div>

        <section className={`${PANEL} overflow-hidden`}>
          <div className="border-b border-white/[0.07] px-5 py-4 sm:px-6">
            <h2 className="text-base font-semibold text-white">Histórico gravado</h2>
            <p className="mt-0.5 text-xs text-zinc-500">Clique num mês para ver a prova real dele.</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[52rem] text-sm">
              <thead className="bg-white/[0.03] text-[0.7rem] text-zinc-400">
                <tr>
                  {["Período", "Faturado (m³)", "Devoluções (m³)", "Volume final (m³)", "CGF (R$)", "Atualizado"].map((h, i) => (
                    <th key={h} scope="col" className={`px-4 py-3 font-semibold ${i ? "text-right" : "border-l-[3px] border-l-transparent text-left"}`}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.05]">
                {!historicoCarregado && <LinhasEsqueleto colunas={6} texto="Carregando o histórico…" />}
                {pag.itensDaPagina.map((h) => {
                  const ativo = h.periodo === escolhido;
                  return (
                    <tr key={h.periodo} aria-current={ativo ? "true" : undefined}
                      onClick={h.periodo_valido ? () => abrirMes(h.periodo) : undefined}
                      className={linhaDoMes(ativo, h.periodo_valido)}>
                      <PeriodoClicavel periodo={h.periodo} valido={h.periodo_valido} ativo={ativo} onAbrir={abrirMes} />
                      <td className="px-4 py-2.5 text-right tabular-nums text-zinc-300">{num(h.volume_faturado, 2)}</td>
                      <td className={`px-4 py-2.5 text-right tabular-nums ${h.volume_devolucoes ? "text-zinc-300" : "text-amber-300"}`}
                        title={h.volume_devolucoes ? undefined : "Sem devoluções: confira se o arquivo de devolvidas foi lido"}>
                        {num(h.volume_devolucoes, 2)}
                      </td>
                      <td className="px-4 py-2.5 text-right tabular-nums text-zinc-200">{num(h.volume_final, 2)}</td>
                      <td className="px-4 py-2.5 text-right font-semibold tabular-nums text-emerald-300">{brl(h.cgf_rs)}</td>
                      <td className="px-4 py-2.5 text-right tabular-nums text-zinc-500">{dataHora(h.data_atualizacao)}</td>
                    </tr>
                  );
                })}
                {historicoCarregado && historico.length === 0 && (
                  <tr><td colSpan={6} className="px-4 py-8 text-center text-zinc-500">Nenhum CGF gravado.</td></tr>
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
