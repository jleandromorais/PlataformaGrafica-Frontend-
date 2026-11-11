/** RET: destaques do mês + fórmula + prova real + histórico interativo.
 *
 * A tela não lê PDFs nem grava: isso fica no Painel do Ciclo (Processar).
 * Aqui o analista vê COMO o RET é calculado (card da fórmula) e a CONTA ABERTA do mês
 * escolhido (prova real), e escolhe o mês clicando na tabela "RET gravado".
 * A leitura antiga pela própria tela está guardada em ./LeituraDoMes.tsx. */
import { useEffect, useRef, useState } from "react";
import { Alert } from "../../components/ui/Alert";
import { CardFormula } from "../../components/ui/CardFormula";
import { LinhasEsqueleto } from "../../components/ui/EsqueletoTabela";
import { Paginacao } from "../../components/ui/Paginacao";
import { PeriodoClicavel } from "../../components/ui/PeriodoClicavel";
import { useProvaRealDoMes } from "../../components/ui/useProvaRealDoMes";
import { PageHeader } from "../../components/layout/PageHeader";
import { getHistoricoRET, getProvaRealRET } from "../../api";
import { mensagemDeErro } from "../../api/client";
import { brl, dataHora, num } from "../../utils/format";
import { linhaDoMes } from "../../utils/linhaDoMes";
import { MESES_ABREV } from "../../utils/periodos";
import { usePaginacao } from "../../utils/paginacao";
import { useManterPeriodoNaUrl, usePeriodoDaUrl } from "../../utils/periodoNaUrl";
import { rolarAteCardSeEscondido } from "../../utils/rolagem";
import type { RETHistoricoLinha } from "../../types";
import { KpisRET } from "./KpisRET";
import { ProvaRealRET } from "./ProvaRealRET";

const PANEL = "rounded-xl border border-white/[0.07] bg-panel";

export default function RETPage() {
  // "Ver" do Painel do Ciclo abre no mês certo (?periodo=Mai/2026).
  const daUrl = usePeriodoDaUrl("periodo");
  const [escolhido, setEscolhido] = useState<string | null>(daUrl ? `${MESES_ABREV[daUrl.mes]}/${daUrl.ano}` : null);
  const [historico, setHistorico] = useState<RETHistoricoLinha[]>([]);
  const [historicoCarregado, setHistoricoCarregado] = useState(false); // até a 1ª resposta, a tabela mostra o esqueleto
  const [erro, setErro] = useState<string | null>(null);

  // Sobe quando um documento é tirado do cálculo: o histórico (RET gravado por mês) é buscado de novo.
  const [versaoHistorico, setVersaoHistorico] = useState(0);

  useEffect(() => {
    getHistoricoRET()
      .then((h) => {
        setHistorico(h);
        // Sem mês na URL: abre na prova real do mês mais recente (o histórico vem do mais novo ao mais antigo).
        setEscolhido((atual) => atual ?? h.find((l) => l.periodo_valido)?.periodo ?? null);
      })
      .catch((e) => setErro(mensagemDeErro(e, "Não foi possível carregar o histórico do RET.")))
      .finally(() => setHistoricoCarregado(true));
  }, [versaoHistorico]);

  useManterPeriodoNaUrl("periodo", escolhido ?? "");
  const pag = usePaginacao(historico, { focoIndice: historico.findIndex((h) => h.periodo === escolhido) });

  // Uma busca só da prova real para KPIs, fórmula preenchida e card da prova real.
  const prova = useProvaRealDoMes(escolhido, getProvaRealRET);
  const d = prova.dados && !prova.erro && prova.dados.tem_itens && prova.dados.ret_calculado !== null ? prova.dados : null;

  // Ao escolher um mês na tabela (que fica embaixo), leva a vista até a prova real se ela não estiver na tela.
  const provaRef = useRef<HTMLElement>(null);
  const abrirMes = (periodo: string) => {
    setEscolhido(periodo);
    rolarAteCardSeEscondido(provaRef.current);
  };

  const taxa = d ? `${num(d.pis_cofins_rate * 100, 2)}%` : "9,25%";

  return (
    <div className="px-4 py-6 sm:px-8 lg:px-10 lg:py-8">
      <div className="mx-auto flex max-w-[1500px] flex-col gap-6">
        <PageHeader modulo="ret"
          descricao="Como o RET é calculado e a prova real de cada mês. Para ler os PDFs de encargos e gravar um mês, use o Painel do Ciclo." />

        {erro && <Alert variant="error">{erro}</Alert>}

        <KpisRET periodo={escolhido} estado={prova} />

        {/* Fórmula (vinho) à esquerda, acompanhando a rolagem em xl; prova real à direita. */}
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
          <CardFormula className="xl:sticky xl:top-6 xl:col-span-5 xl:self-start 2xl:col-span-4"
            descricao="Como o RET do mês é calculado a partir dos PDFs de encargos."
            tituloAplicada={d ? `Com os números de ${d.periodo}` : undefined}
            aplicada={d ? [
              `EAT líquido = ${num(d.eat_bruto, 2)} × (1 − ${taxa}) = ${num(d.eat_liquido, 2)}`,
              `RET = ${num(d.eat_liquido, 2)} + ${num(d.ec, 2)} = ${brl(d.ret_calculado!)}`,
            ] : undefined}
            atualizando={prova.atualizando}
            formula={[
              "RET = EAT líquido + EC",
              "EAT líquido = EAT × (1 − PIS/COFINS)",
            ]}
            termos={[
              { termo: "EAT", explicacao: "Encargo de Transporte. É a soma dos documentos de EAT do mês. O sistema desconta o PIS/COFINS dele." },
              { termo: "PIS/COFINS", explicacao: "Tributos de 9,25%. O sistema os desconta do EAT, multiplicando o valor por (1 − 9,25%)." },
              { termo: "EC", explicacao: "Encargo de Capacidade. É a soma dos documentos de EC do mês, pelo valor do documento (o sistema não aplica o desconto nele)." },
              { termo: "RET", explicacao: "Recuperação de Encargos de Transporte: o valor do mês, em reais." },
            ]}
            regras={[
              "O tipo (EAT ou EC) vem da pasta do documento; o mês, do nome da pasta (ex.: “EAT fev26”).",
              "Documentos de outras pastas (penalidades, TOP e outros) são lidos, mas ficam fora do RET.",
              "O RET gravado do mês alimenta o SCG (SCG = RPV + RET + RP).",
            ]}
          />
          <ProvaRealRET periodo={escolhido} estado={prova} cardRef={provaRef} aoMudar={() => setVersaoHistorico((v) => v + 1)} className="xl:col-span-7 2xl:col-span-8" />
        </div>

        <section className={`${PANEL} overflow-hidden`}>
          <div className="border-b border-white/[0.07] px-5 py-4 sm:px-6">
            <h2 className="text-base font-semibold text-white">RET gravado</h2>
            <p className="mt-0.5 text-xs text-zinc-500">Clique num mês para ver a prova real dele.</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[32rem] text-sm">
              <thead className="bg-white/[0.03] text-[0.7rem] text-zinc-400">
                <tr>
                  {["Período", "Documentos", "RET gravado", "Atualizado"].map((h, i) => (
                    <th key={h} scope="col" className={`px-4 py-3 font-semibold ${i ? "text-right" : "border-l-[3px] border-l-transparent text-left"}`}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.05]">
                {!historicoCarregado && <LinhasEsqueleto colunas={4} texto="Carregando o histórico…" />}
                {pag.itensDaPagina.map((h) => {
                  const ativo = h.periodo === escolhido;
                  return (
                    <tr key={h.periodo} aria-current={ativo ? "true" : undefined}
                      onClick={h.periodo_valido ? () => abrirMes(h.periodo) : undefined}
                      className={linhaDoMes(ativo, h.periodo_valido)}>
                      <PeriodoClicavel periodo={h.periodo} valido={h.periodo_valido} ativo={ativo} onAbrir={abrirMes} />
                      <td className="px-4 py-2.5 text-right tabular-nums text-zinc-300">{num(h.qtd_documentos)}</td>
                      <td className="px-4 py-2.5 text-right font-semibold tabular-nums text-zinc-100">{brl(h.ret_gravado)}</td>
                      <td className="px-4 py-2.5 text-right tabular-nums text-zinc-500">{dataHora(h.data_atualizacao)}</td>
                    </tr>
                  );
                })}
                {historicoCarregado && historico.length === 0 && <tr><td colSpan={4} className="px-4 py-8 text-center text-zinc-500">Nenhum RET gravado.</td></tr>}
              </tbody>
            </table>
          </div>
          <Paginacao {...pag} onMudar={pag.setPagina} rotulo={["mês", "meses"]} />
        </section>
      </div>
    </div>
  );
}
