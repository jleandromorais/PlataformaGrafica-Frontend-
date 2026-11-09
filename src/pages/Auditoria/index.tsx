/** Auditoria CGR: destaques do mês + fórmula + prova real + histórico interativo.
 *
 * A tela não lê notas nem grava: isso fica no Painel do Ciclo (Processar e "Auditar mês").
 * Aqui o analista vê COMO o CGR é calculado (card da fórmula) e a CONTA ABERTA do mês
 * escolhido (prova real), e escolhe o mês clicando na tabela "Meses auditados".
 * A leitura antiga pela própria tela está guardada em ./LeituraDoMes.tsx. */
import { useEffect, useRef, useState } from "react";
import { SeloEmExibicao } from "../../components/ui/SeloEmExibicao";
import { rolarAteCardSeEscondido } from "../../utils/rolagem";
import { Alert } from "../../components/ui/Alert";
import { CardFormula } from "../../components/ui/CardFormula";
import { getHistoricoAuditoria } from "../../api";
import { mensagemDeErro } from "../../api/client";
import { brl, brlEntrada, dataHora, num } from "../../utils/format";
import { MESES_ABREV } from "../../utils/periodos";
import { useManterPeriodoNaUrl, usePeriodoDaUrl } from "../../utils/periodoNaUrl";
import type { AuditoriaHistoricoLinha } from "../../types";
import { PageHeader } from "../../components/layout/PageHeader";
import { LinhasEsqueleto } from "../../components/ui/EsqueletoTabela";
import { Paginacao } from "../../components/ui/Paginacao";
import { usePaginacao } from "../../utils/paginacao";
import { KpisDoMes } from "./KpisDoMes";
import { ProvaReal } from "./ProvaReal";
import { useProvaReal } from "./useProvaReal";

const PANEL = "rounded-xl border border-white/[0.07] bg-panel";

export default function AuditoriaPage() {
  // "Ver" do Painel do Ciclo abre no mês certo (?periodo=Mai/2026).
  const daUrl = usePeriodoDaUrl("periodo");
  const [escolhido, setEscolhido] = useState<string | null>(daUrl ? `${MESES_ABREV[daUrl.mes]}/${daUrl.ano}` : null);
  const [historico, setHistorico] = useState<AuditoriaHistoricoLinha[]>([]);
  const [historicoCarregado, setHistoricoCarregado] = useState(false); // até a 1ª resposta, a tabela mostra o esqueleto
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    getHistoricoAuditoria()
      .then((h) => {
        setHistorico(h);
        // Sem mês na URL: abre na prova real do mês mais recente (o histórico vem do mais novo ao mais antigo).
        setEscolhido((atual) => atual ?? h.find((l) => l.periodo_valido)?.periodo ?? null);
      })
      .catch((e) => setErro(mensagemDeErro(e, "Não foi possível carregar o histórico da Auditoria CGR.")))
      .finally(() => setHistoricoCarregado(true));
  }, []);

  useManterPeriodoNaUrl("periodo", escolhido ?? "");
  const pag = usePaginacao(historico, { focoIndice: historico.findIndex((h) => h.periodo === escolhido) });

  // Uma busca só da prova real para KPIs, fórmula preenchida e card da prova real.
  const prova = useProvaReal(escolhido);
  const d = prova.dados && !prova.erro && prova.dados.qtd_notas > 0 ? prova.dados : null;

  // Ao escolher um mês na tabela (que fica embaixo), leva a vista até a prova real se ela não estiver na tela.
  const provaRef = useRef<HTMLElement>(null);
  const abrirMes = (periodo: string) => {
    setEscolhido(periodo);
    rolarAteCardSeEscondido(provaRef.current);
  };

  return (
    <div className="px-4 py-6 sm:px-8 lg:px-10 lg:py-8">
      <div className="mx-auto flex max-w-[1500px] flex-col gap-6">
        <PageHeader modulo="auditoria"
          descricao="Como o CGR é calculado e a prova real de cada mês. Para ler as notas e gravar um mês, use o Painel do Ciclo." />

        {erro && <Alert variant="error">{erro}</Alert>}

        <KpisDoMes periodo={escolhido} estado={prova} />

        {/* Fórmula (vinho) à esquerda, prova real à direita. A fórmula não estica: fica no tamanho
            dela e acompanha a rolagem (sticky) ao lado da prova real, que é mais alta. Em telas
            muito largas ela fica mais estreita (4 de 12 colunas), para não sobrar espaço. */}
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
          <CardFormula className="xl:sticky xl:top-6 xl:col-span-5 xl:self-start 2xl:col-span-4"
            descricao="Como o CGR do mês é calculado a partir das notas."
            tituloAplicada={d ? `Com os números de ${d.periodo}` : undefined}
            aplicada={d ? [
              `CGR = ${brlEntrada(d.compras)} − ${brlEntrada(Math.abs(d.devolucoes))}`,
              `    = ${brl(d.cgr_das_notas)}`,
            ] : undefined}
            atualizando={prova.atualizando}
            formula={[
              "CGR = Σ compra sem tributos − devoluções",
              "compra sem tributos = valor × (1 − ICMS) × (1 − 9,25%)",
            ]}
            termos={[
              { termo: "valor", explicacao: "Valor da nota com tributos (NF-e: vNF; CT-e: vTPrest)." },
              { termo: "ICMS", explicacao: "Alíquota do ICMS da nota, em % (ex.: 12%, 20,5%)." },
              { termo: "9,25%", explicacao: "PIS (1,65%) + COFINS (7,6%)." },
              { termo: "devoluções", explicacao: "Notas em pasta de devolução: a mesma conta, com sinal negativo." },
            ]}
            regras={[
              "Entram as NF-e de compra de gás e os CT-e de gasoduto (TAG e Mastergás).",
              "CT-e de outras transportadoras é frete comum e fica fora do CGR.",
              "O CGR gravado alimenta o RPV do mês (RPV = CGR − CGF).",
            ]}
          />
          <ProvaReal periodo={escolhido} estado={prova} cardRef={provaRef} className="xl:col-span-7 2xl:col-span-8" />
        </div>

        <section className={`${PANEL} overflow-hidden`}>
          <div className="border-b border-white/[0.07] px-5 py-4 sm:px-6">
            <h2 className="text-base font-semibold text-white">Meses auditados</h2>
            <p className="mt-0.5 text-xs text-zinc-500">Clique num mês para ver a prova real dele.</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[32rem] text-sm">
              <thead className="bg-white/[0.03] text-[0.7rem] text-zinc-400">
                <tr>
                  {["Período", "Notas gravadas", "CGR gravado", "Atualizado"].map((h, i) => (
                    <th key={h} scope="col" className={`px-4 py-3 font-semibold ${i ? "text-right" : "border-l-[3px] border-l-transparent text-left"}`}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.05]">
                {!historicoCarregado && <LinhasEsqueleto colunas={4} texto="Carregando o histórico…" />}
                {pag.itensDaPagina.map((h) => {
                  const ativo = h.periodo === escolhido;
                  // Período inválido gravado (ex.: "Teste2") não tem prova real: a linha não é clicável.
                  const clicavel = h.periodo_valido;
                  return (
                    <tr key={h.periodo} aria-current={ativo ? "true" : undefined}
                      onClick={clicavel ? () => abrirMes(h.periodo) : undefined}
                      className={`transition-colors ${ativo ? "bg-sky-500/[0.10]" : clicavel ? "cursor-pointer hover:bg-white/[0.03]" : ""}`}>
                      {/* Faixa à esquerda da linha aberta: borda da 1ª célula (as linhas sem destaque têm
                          a mesma borda transparente, para o texto não "pular" ao trocar de mês). */}
                      <td className={`border-l-[3px] px-4 py-2.5 font-medium ${ativo ? "border-l-sky-400 text-white" : "border-l-transparent text-zinc-200"}`}>
                        {clicavel ? (
                          // O botão deixa a linha acessível pelo teclado (Tab + Enter) e por leitor de tela.
                          <button type="button" onClick={(e) => { e.stopPropagation(); abrirMes(h.periodo); }}
                            aria-label={`Ver a prova real de ${h.periodo}`}
                            className="rounded text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-400">
                            {h.periodo}
                          </button>
                        ) : (
                          <>
                            {h.periodo}
                            <span className="ml-2 rounded-full border border-red-500/30 bg-red-500/10 px-1.5 py-0.5 text-[0.65rem] font-semibold text-red-300" title="Período gravado com nome inválido: corrija ou apague no banco">inválido</span>
                          </>
                        )}
                        {/* Selo neutro (não é "confere"): só diz qual mês está na prova real. */}
                        {ativo && <SeloEmExibicao />}
                      </td>
                      <td className="px-4 py-2.5 text-right tabular-nums text-zinc-300">{num(h.qtd_notas)}</td>
                      <td className="px-4 py-2.5 text-right font-semibold tabular-nums text-zinc-100">{brl(h.cgr_gravado)}</td>
                      <td className="px-4 py-2.5 text-right tabular-nums text-zinc-500">{dataHora(h.data_atualizacao)}</td>
                    </tr>
                  );
                })}
                {historicoCarregado && historico.length === 0 && <tr><td colSpan={4} className="px-4 py-8 text-center text-zinc-500">Nenhum mês auditado.</td></tr>}
              </tbody>
            </table>
          </div>
          <Paginacao {...pag} onMudar={pag.setPagina} rotulo={["mês", "meses"]} />
        </section>
      </div>
    </div>
  );
}
