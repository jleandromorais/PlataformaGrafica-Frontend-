/** RP (Conciliação): destaques do mês + fórmula + prova real + histórico interativo.
 *
 * A tela não lê PDFs nem grava: isso fica no Painel do Ciclo (Processar).
 * Aqui o analista vê COMO o RP é calculado (card da fórmula), a CONTA ABERTA do mês escolhido
 * e todas as notas dele (prova real, com as notas repetidas em destaque), e escolhe o mês
 * clicando na tabela "RP gravado". A leitura antiga pela própria tela está guardada em
 * ./LeituraDoMes.tsx. */
import { useEffect, useRef, useState } from "react";
import { Alert } from "../../components/ui/Alert";
import { CardFormula } from "../../components/ui/CardFormula";
import { LinhasEsqueleto } from "../../components/ui/EsqueletoTabela";
import { Paginacao } from "../../components/ui/Paginacao";
import { PeriodoClicavel } from "../../components/ui/PeriodoClicavel";
import { useProvaRealDoMes } from "../../components/ui/useProvaRealDoMes";
import { PageHeader } from "../../components/layout/PageHeader";
import { getHistoricoConcilia, getProvaRealRP } from "../../api";
import { mensagemDeErro } from "../../api/client";
import { brl, num } from "../../utils/format";
import { linhaDoMes } from "../../utils/linhaDoMes";
import { MESES_ABREV } from "../../utils/periodos";
import { usePaginacao } from "../../utils/paginacao";
import { useManterPeriodoNaUrl, usePeriodoDaUrl } from "../../utils/periodoNaUrl";
import { rolarAteCardSeEscondido } from "../../utils/rolagem";
import type { ConciliaHistoricoLinha } from "../../types";
import { KpisRP } from "./KpisRP";
import { ProvaRealRP } from "./ProvaRealRP";

const PANEL = "rounded-xl border border-white/[0.07] bg-panel";

export default function ConciliacaoPage() {
  // "Fazer agora" do Painel do Ciclo abre no mês certo (?periodo=Mai/2026).
  const daUrl = usePeriodoDaUrl("periodo");
  const [escolhido, setEscolhido] = useState<string | null>(daUrl ? `${MESES_ABREV[daUrl.mes]}/${daUrl.ano}` : null);
  const [historico, setHistorico] = useState<ConciliaHistoricoLinha[]>([]);
  const [historicoCarregado, setHistoricoCarregado] = useState(false); // até a 1ª resposta, a tabela mostra o esqueleto
  const [erro, setErro] = useState<string | null>(null);

  // Sobe quando uma nota é tirada do cálculo: o histórico (RP gravado por mês) é buscado de novo.
  const [versaoHistorico, setVersaoHistorico] = useState(0);

  useEffect(() => {
    getHistoricoConcilia()
      .then((h) => {
        setHistorico(h);
        // Sem mês na URL: abre na prova real do mês mais recente (o histórico vem do mais novo ao mais antigo).
        setEscolhido((atual) => atual ?? h.find((l) => l.periodo_valido)?.periodo ?? null);
      })
      .catch((e) => setErro(mensagemDeErro(e, "Não foi possível carregar o histórico da Conciliação (RP).")))
      .finally(() => setHistoricoCarregado(true));
  }, [versaoHistorico]);

  useManterPeriodoNaUrl("periodo", escolhido ?? "");
  const pag = usePaginacao(historico, { focoIndice: historico.findIndex((h) => h.periodo === escolhido) });
  const rpDiverge = (h: ConciliaHistoricoLinha) => Math.abs(h.rp_dos_itens - h.rp_gravado) > 0.01;
  // Com paginação, um mês divergente pode estar em outra página: a lista abaixo do título mostra todos.
  const divergentes = historico.filter(rpDiverge);

  // Uma busca só da prova real para KPIs, fórmula preenchida e card da prova real.
  const prova = useProvaRealDoMes(escolhido, getProvaRealRP);
  const d = prova.dados && !prova.erro && prova.dados.tem_itens && prova.dados.rp_calculado !== null ? prova.dados : null;

  // Ao escolher um mês na tabela (que fica embaixo), leva a vista até a prova real se ela não estiver na tela.
  const provaRef = useRef<HTMLElement>(null);
  const abrirMes = (periodo: string) => {
    setEscolhido(periodo);
    rolarAteCardSeEscondido(provaRef.current);
  };

  const taxa = d ? `${num(d.taxa * 100, 2)}%` : "9,25%";

  return (
    <div className="px-4 py-6 sm:px-8 lg:px-10 lg:py-8">
      <div className="mx-auto flex max-w-[1500px] flex-col gap-6">
        <PageHeader modulo="conciliacao"
          descricao="Como o RP é calculado e a prova real de cada mês, com todas as notas. Para ler os PDFs de penalidades e gravar um mês, use o Painel do Ciclo." />

        {erro && <Alert variant="error">{erro}</Alert>}

        <KpisRP periodo={escolhido} estado={prova} />

        {/* Fórmula (vinho) à esquerda, acompanhando a rolagem em xl; prova real à direita. */}
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
          <CardFormula className="xl:sticky xl:top-6 xl:col-span-5 xl:self-start 2xl:col-span-4"
            descricao="Como o RP do mês é calculado a partir das notas de penalidade."
            tituloAplicada={d ? `Com os números de ${d.periodo}` : undefined}
            aplicada={d ? [
              `Receitas líquidas = ${num(d.receitas.bruto, 2)} × (1 − ${taxa}) = ${num(d.receitas.liquido, 2)}`,
              `Despesas líquidas = ${num(d.despesas.bruto, 2)} × (1 − ${taxa}) = ${num(d.despesas.liquido, 2)}`,
              `RP = ${num(d.despesas.liquido, 2)} − ${num(d.receitas.liquido, 2)} = ${brl(d.rp_calculado!)}`,
            ] : undefined}
            atualizando={prova.atualizando}
            formula={[
              "RP = Despesas líquidas − Receitas líquidas",
              "líquido = valor da nota × (1 − PIS/COFINS)",
            ]}
            termos={[
              { termo: "RP", explicacao: "Recuperação das Penalidades: o valor do mês, em reais." },
              { termo: "Receitas", explicacao: "Notas de penalidade da pasta de receitas. A TOP não recuperável também entra aqui, mesmo estando na pasta de despesas." },
              { termo: "Despesas", explicacao: "Notas de penalidade da pasta de despesas, menos a TOP não recuperável e as que já estão no RET." },
              { termo: "PIS/COFINS", explicacao: "Tributos de 9,25% que estão dentro do valor da nota. O RP usa o valor sem eles." },
              { termo: "PFP", explicacao: "Um tipo de nota de penalidade, de nota de débito (aparece no nome do arquivo como NDPFP). O sistema a conta como receita." },
              { termo: "TOP", explicacao: "TOP não recuperável. Conta como receita." },
            ]}
            regras={[
              "Despesa que já está no RET vale 0 no RP, para não contar duas vezes.",
              "Subpastas “Substituídos” ficam de fora: é onde vai a versão antiga de uma nota.",
              "A mesma nota não pode aparecer duas vezes (original e “Atualizada em…”). Se aparecer, a prova real avisa.",
              "O RP gravado do mês alimenta o SCG (SCG = RPV + RET + RP).",
            ]}
          />
          <ProvaRealRP periodo={escolhido} estado={prova} cardRef={provaRef} aoMudar={() => setVersaoHistorico((v) => v + 1)} className="xl:col-span-7 2xl:col-span-8" />
        </div>

        <section className={`${PANEL} overflow-hidden`}>
          <div className="border-b border-white/[0.07] px-5 py-4 sm:px-6">
            <h2 className="text-base font-semibold text-white">RP gravado</h2>
            <p className="mt-0.5 text-xs text-zinc-500">Clique num mês para ver a prova real e as notas dele. Quando o RP gravado difere do calculado pelos PDFs gravados, a linha fica em âmbar.</p>
            {divergentes.length > 0 && (
              <p className="mt-2 text-sm text-amber-300">
                {divergentes.length === 1 ? "1 mês diverge: " : `${divergentes.length} meses divergem: `}
                <span className="font-medium">{divergentes.map((h) => h.periodo).join(", ")}</span>
              </p>
            )}
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[44rem] text-sm">
              <thead className="bg-white/[0.03] text-[0.7rem] text-zinc-400">
                <tr>
                  {["Período", "PDFs", "Receitas", "Despesas", "RP dos PDFs", "RP gravado"].map((h, i) => (
                    <th key={h} scope="col" className={`px-4 py-3 font-semibold ${i ? "text-right" : "border-l-[3px] border-l-transparent text-left"}`}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.05]">
                {!historicoCarregado && <LinhasEsqueleto colunas={6} texto="Carregando o histórico…" />}
                {pag.itensDaPagina.map((h) => {
                  const ativo = h.periodo === escolhido;
                  const diverge = rpDiverge(h);
                  return (
                    <tr key={h.periodo} aria-current={ativo ? "true" : undefined}
                      onClick={h.periodo_valido ? () => abrirMes(h.periodo) : undefined}
                      className={`${linhaDoMes(ativo, h.periodo_valido)} ${diverge && !ativo ? "bg-amber-500/[0.05]" : ""}`}>
                      <PeriodoClicavel periodo={h.periodo} valido={h.periodo_valido} ativo={ativo} onAbrir={abrirMes} />
                      <td className="px-4 py-2.5 text-right tabular-nums text-zinc-400">{num(h.qtd_itens)}</td>
                      <td className="px-4 py-2.5 text-right tabular-nums text-zinc-300">{brl(h.total_receitas)}</td>
                      <td className="px-4 py-2.5 text-right tabular-nums text-zinc-300">{brl(h.total_despesas)}</td>
                      <td className="px-4 py-2.5 text-right tabular-nums text-zinc-300">{brl(h.rp_dos_itens)}</td>
                      <td className={`px-4 py-2.5 text-right font-semibold tabular-nums ${diverge ? "text-amber-300" : "text-zinc-100"}`}>{brl(h.rp_gravado)}</td>
                    </tr>
                  );
                })}
                {historicoCarregado && historico.length === 0 && <tr><td colSpan={6} className="px-4 py-8 text-center text-zinc-500">Nenhum RP gravado.</td></tr>}
              </tbody>
            </table>
          </div>
          <Paginacao {...pag} onMudar={pag.setPagina} rotulo={["mês", "meses"]} />
        </section>
      </div>
    </div>
  );
}
