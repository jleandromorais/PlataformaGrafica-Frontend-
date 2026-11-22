import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { RefreshCw, Route } from "lucide-react";
import { Card } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { Input, Select } from "../../components/ui/Input";
import { Alert } from "../../components/ui/Alert";
import { linkParaGravarPV } from "../../utils/gravarNoPainel";
import { colorForValue } from "../../theme";
import { getHistoricoPV, getProvaRealPV, getPVTrimestre, getTrimestresFiscais } from "../../api";
import { mensagemDeErro } from "../../api/client";
import { MESES_ABREV, mesesDoTrimestre } from "../../utils/periodos";
import { tituloDe } from "../../utils/glossario";
import { useManterPeriodoNaUrl, usePeriodoDaUrl } from "../../utils/periodoNaUrl";
import { PageHeader } from "../../components/layout/PageHeader";
import { Skeleton } from "../../components/ui/Skeleton";
import { CardFormula } from "../../components/ui/CardFormula";
import { LinhasEsqueleto } from "../../components/ui/EsqueletoTabela";
import { Paginacao } from "../../components/ui/Paginacao";
import { PeriodoClicavel } from "../../components/ui/PeriodoClicavel";
import { useProvaRealDoMes } from "../../components/ui/useProvaRealDoMes";
import { brl, dataHora } from "../../utils/format";
import { linhaDoMes } from "../../utils/linhaDoMes";
import { usePaginacao } from "../../utils/paginacao";
import { rolarAteCardSeEscondido } from "../../utils/rolagem";
import type { PVHistoricoTrimestre } from "../../types";
import { KpisPV } from "./KpisPV";
import { ProvaRealPV } from "./ProvaRealPV";

const PANEL = "rounded-xl border border-white/[0.07] bg-panel";

/** Busca da prova real: a chave é "Fev - Abr/2026#versão" (a versão sobe ao salvar, para buscar de novo).
 * Função estável do módulo, como pede o hook. */
const buscarProvaDoTrimestre = (chave: string) => {
  const [tri] = chave.split("#"); // o que vem depois do # só força uma nova busca
  const i = tri.lastIndexOf("/");
  return getProvaRealPV(tri.slice(0, i), Number(tri.slice(i + 1)));
};

interface Trimestre { label: string; meses: string[] }

/** Ano do 1º mês. Até 2098: o Nov – Jan/2098 termina em Jan/2099, o último ano aceito. */
const ANO_MIN = 2000;
const ANO_MAX = 2098;
const anoOk = (a: number) => Number.isInteger(a) && a >= ANO_MIN && a <= ANO_MAX;

/** Trimestre fiscal do mês atual e o ano do seu 1º mês (em Jan, o Nov – Jan começou no ano anterior). */
function trimestreAtual(trimestres: Trimestre[]): { label: string; ano: number } {
  const hoje = new Date();
  const mes = MESES_ABREV[hoje.getMonth()];
  const t = trimestres.find((x) => x.meses.includes(mes)) ?? trimestres[0];
  if (!t) return { label: "", ano: hoje.getFullYear() };
  const voltou = MESES_ABREV.indexOf(mes) < MESES_ABREV.indexOf(t.meses[0]);
  return { label: t.label, ano: hoje.getFullYear() - (voltou ? 1 : 0) };
}

export default function PVPage() {
  const daUrl = usePeriodoDaUrl("trimestre");
  const [trimestres, setTrimestres] = useState<Trimestre[]>([]);
  const [trimestre, setTrimestre] = useState("");
  const [ano, setAno] = useState(new Date().getFullYear());
  const primeiroMes = trimestres.find((t) => t.label === trimestre)?.meses[0];
  useManterPeriodoNaUrl("trimestre", primeiroMes ? `${primeiroMes}/${ano}` : "");
  const [periodos, setPeriodos] = useState<string[]>([]);

  const [pmpv, setPmpv] = useState(0);
  const [pr, setPr] = useState(0);

  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [avisos, setAvisos] = useState<string[]>([]);
  const ultimaBusca = useRef(0);

  // Histórico de PVs gravados por trimestre e o trimestre aberto na prova real (?prova=Fev - Abr/2026).
  const [params, setParams] = useSearchParams();
  const [historico, setHistorico] = useState<PVHistoricoTrimestre[]>([]);
  const [historicoCarregado, setHistoricoCarregado] = useState(false); // até a 1ª resposta, a tabela mostra o esqueleto
  const [escolhido, setEscolhido] = useState<string | null>(() => params.get("prova"));
  const provaRef = useRef<HTMLElement>(null);

  const carregarHistorico = useCallback(() => {
    getHistoricoPV()
      .then(setHistorico)
      .catch((e) => setErro(mensagemDeErro(e, "Não foi possível carregar o histórico do PV.")))
      .finally(() => setHistoricoCarregado(true));
  }, []);
  useEffect(carregarHistorico, [carregarHistorico]);

  const pv = pmpv + pr;
  const anoValido = anoOk(ano);
  // Aberto na prova real: o escolhido; senão o gravado mais recente; senão o do formulário (mostra "sem PV gravado").
  const chaveForm = trimestre && anoOk(ano) ? `${trimestre}/${ano}` : null;
  const aberto = escolhido ?? historico[0]?.chave ?? (historicoCarregado ? chaveForm : null);
  const prova = useProvaRealDoMes(aberto === null ? null : `${aberto}#0`, buscarProvaDoTrimestre, aberto === null ? undefined : aberto);
  const pag = usePaginacao(historico, { focoIndice: historico.findIndex((h) => h.chave === aberto) });

  // Mantém ?prova=... no endereço: recarregar ou compartilhar o link abre a mesma prova real.
  useEffect(() => {
    if (escolhido === null || params.get("prova") === escolhido) return;
    setParams((p) => { p.set("prova", escolhido); return p; }, { replace: true });
  }, [escolhido, params, setParams]);

  const abrirProva = (chave: string) => {
    setEscolhido(chave);
    rolarAteCardSeEscondido(provaRef.current);
  };
  const dProva = prova.dados && !prova.erro && prova.dados.tem_salvo ? prova.dados : null;

  const carregar = async (label = trimestre, a = ano) => {
    // Invalida a busca anterior e limpa a tela antes de validar: nada do trimestre
    // antigo fica visível (nem pode ser salvo) sob o novo rótulo.
    const busca = ++ultimaBusca.current;
    setPmpv(0);
    setPr(0);
    setPeriodos([]);
    setAvisos([]);
    setErro(null);
    // valida o ano recebido (o estado `ano` ainda é o do render anterior enquanto se digita)
    if (!label || !anoOk(a)) {
      setCarregando(false);
      return;
    }
    setCarregando(true);
    try {
      const d = await getPVTrimestre(label, a);
      if (busca !== ultimaBusca.current) return; // o usuário já trocou de trimestre
      setPeriodos(d.periodos);
      // Sempre os valores atuais dos módulos PMPV e PR: mostrar o PV já salvo
      // escondia o PR novo (salvo depois) e não havia como trazê-lo para a tela.
      // O aviso diz quando o PV gravado difere; "Gravar" atualiza.
      setPmpv(d.pmpv);
      setPr(d.pr);
      setAvisos(d.avisos);
    } catch (e) {
      if (busca === ultimaBusca.current) setErro(mensagemDeErro(e, `Não foi possível carregar o PV de ${label}/${a}.`));
    } finally {
      if (busca === ultimaBusca.current) setCarregando(false);
    }
  };

  /** Troca trimestre/ano e já carrega do banco. */
  const mudar = (label: string, a: number) => {
    setTrimestre(label);
    setAno(a);
    carregar(label, a);
  };

  useEffect(() => {
    getTrimestresFiscais()
      .then((t) => {
        setTrimestres(t);
        // "Fazer agora" do Painel do Ciclo: ?trimestre=Ago/2026 (1º mês; o ano do PV é o dele).
        const doLink = daUrl && t.find((x) => x.meses[0] === MESES_ABREV[daUrl.mes]);
        const atual = doLink && daUrl ? { label: doLink.label, ano: daUrl.ano } : trimestreAtual(t);
        mudar(atual.label, atual.ano);
      })
      .catch((e) => setErro(mensagemDeErro(e, "Não foi possível carregar a lista de trimestres.")));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="px-4 py-6 sm:px-8 lg:px-10 lg:py-8">
      <div className="mx-auto flex w-full max-w-[1500px] flex-col gap-6">
      <PageHeader modulo="pv" gravarNoPainel={primeiroMes ? linkParaGravarPV(`${primeiroMes}/${ano}`) : undefined} />

      {erro && <Alert variant="error" className="whitespace-pre-line">{erro}</Alert>}
      {avisos.length > 0 && <Alert variant="warning" itens={avisos} />}

      <KpisPV chave={aberto} estado={prova} />

      <Card title="Trimestre">
        <div className="flex flex-wrap items-end gap-3">
          <Select
            label="Trimestre fiscal"
            value={trimestre}
            onChange={(e) => mudar(e.target.value, ano)}
            options={
              trimestres.length
                ? trimestres.map((t) => ({ value: t.label, label: t.label }))
                : [{ value: "", label: "(carregando…)" }]
            }
          />
          <Input
            label="Ano (do 1º mês)"
            type="number"
            value={ano}
            onChange={(e) => mudar(trimestre, Number(e.target.value))}
            error={anoValido ? undefined : `Entre ${ANO_MIN} e ${ANO_MAX}.`}
            className="w-32"
          />
          <Button variant="ghost" icon={<RefreshCw size={14} />} loading={carregando} onClick={() => carregar()}>
            Recarregar do banco
          </Button>
        </div>
        {periodos.length > 0 && (
          <p className="mt-3 text-xs text-zinc-500">Meses do trimestre: {periodos.join(", ")}</p>
        )}
      </Card>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Card title={tituloDe("PMPV")} subtitle="Do trimestre, em R$/m³">
          <p className="text-2xl font-bold tabular-nums text-zinc-100">{carregando ? "…" : pmpv.toFixed(4)}</p>
          <p className="mt-2 text-xs text-zinc-500">Lido do PMPV gravado do trimestre. Para mudar, use a tela PMPV.</p>
        </Card>

        <Card title="PR — Parcela de Recuperação" subtitle="Do trimestre, em R$/m³">
          <p className="text-2xl font-bold tabular-nums text-zinc-100">{carregando ? "…" : pr.toFixed(4)}</p>
          <p className="mt-2 text-xs text-zinc-500">
            Lido do PR gravado. PR = (SCG com SELIC + SR com SELIC do trimestre apurado) ÷ VP do trimestre do PR
          </p>
        </Card>
      </div>

      <Card className="border border-teal-500/20">
        <div className="flex flex-wrap items-center gap-4">
          <span className="text-sm text-zinc-400">PV = PMPV + PR =</span>
          {/* Carregando: esqueleto no lugar do número, em vez de mostrar "R$ 0.0000" provisório. */}
          {carregando ? (
            <span role="status">
              <span className="sr-only">Carregando o PV do trimestre…</span>
              <Skeleton className="h-9 w-44" />
            </span>
          ) : (
            <span className={`text-3xl font-extrabold ${colorForValue(pv)}`}>R$ {pv.toFixed(4)}</span>
          )}
        </div>
      </Card>

      <p className="-mt-2 text-sm text-zinc-400">
        Esta tela é de consulta. O PV se grava no cartão do Painel, com a conferência e a confirmação; gravar repete o valor nos 3 meses, como o Excel Final lê.{" "}
        {primeiroMes && (
          <Link to={linkParaGravarPV(`${primeiroMes}/${ano}`)} className="inline-flex items-center gap-1 font-semibold text-sky-300 underline underline-offset-2 hover:text-sky-200">
            <Route size={13} aria-hidden />Gravar no Painel
          </Link>
        )}
      </p>

      {/* Fórmula (vinho) à esquerda, acompanhando a rolagem em xl; prova real do trimestre aberto à direita. */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
        <CardFormula className="xl:sticky xl:top-6 xl:col-span-5 xl:self-start 2xl:col-span-4"
          descricao="Como o PV do trimestre é calculado."
          tituloAplicada={dProva ? `Com os números de ${dProva.chave}` : undefined}
          aplicada={dProva && dProva.pmpv_gravado !== null && dProva.pr_gravado !== null && dProva.pv_da_soma !== null
            ? [`PV = ${dProva.pmpv_gravado.toFixed(4)} + ${dProva.pr_gravado.toFixed(4)} = ${dProva.pv_da_soma.toFixed(4)}`]
            : undefined}
          atualizando={prova.atualizando}
          formula={["PV = PMPV + PR (do mesmo trimestre fiscal)"]}
          termos={[
            { termo: "PMPV", explicacao: "Preço médio ponderado do trimestre, em R$/m³ (tela PMPV)." },
            { termo: "PR", explicacao: "Parcela de Recuperação do trimestre, em R$/m³ (tela PR)." },
            { termo: "PV", explicacao: "O preço de venda do trimestre, em R$/m³." },
          ]}
          regras={[
            "Gravar (no Painel) grava o PV no trimestre e repete o valor nos 3 meses, como o Excel Final lê.",
            "Se o PMPV ou o PR mudar depois de gravado, o PV gravado fica velho: grave de novo no Painel.",
          ]}
        />
        <ProvaRealPV chave={aberto} estado={prova} cardRef={provaRef} className="xl:col-span-7 2xl:col-span-8"
          onUsarNoFormulario={aberto ? () => {
            const i = aberto.lastIndexOf("/");
            mudar(aberto.slice(0, i), Number(aberto.slice(i + 1)));
          } : undefined} />
      </div>

      <section className={`${PANEL} overflow-hidden`}>
        <div className="border-b border-white/[0.07] px-5 py-4 sm:px-6">
          <h2 className="text-base font-semibold text-white">PVs gravados por trimestre</h2>
          <p className="mt-0.5 text-xs text-zinc-500">Clique num trimestre para ver a prova real dele. O formulário de cima não muda.</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[46rem] text-sm">
            <thead className="bg-white/[0.03] text-[0.7rem] text-zinc-400">
              <tr>
                <th scope="col" className="border-l-[3px] border-l-transparent px-4 py-3 text-left font-semibold">Trimestre</th>
                <th scope="col" className="px-4 py-3 text-left font-semibold">Meses</th>
                <th scope="col" className="px-4 py-3 text-right font-semibold">PMPV (R$/m³)</th>
                <th scope="col" className="px-4 py-3 text-right font-semibold">PR (R$/m³)</th>
                <th scope="col" className="px-4 py-3 text-right font-semibold">PV (R$/m³)</th>
                <th scope="col" className="px-4 py-3 text-right font-semibold">Gravado em</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.05]">
              {!historicoCarregado && <LinhasEsqueleto colunas={6} texto="Carregando o histórico…" />}
              {pag.itensDaPagina.map((h) => {
                const ativo = h.chave === aberto;
                return (
                  <tr key={h.chave} aria-current={ativo ? "true" : undefined}
                    onClick={() => abrirProva(h.chave)}
                    className={linhaDoMes(ativo, true)}>
                    <PeriodoClicavel periodo={h.chave} valido ativo={ativo} onAbrir={abrirProva} />
                    {/* Meses com o ano de cada um: "Nov/2025, Dez/2025, Jan/2026" (o ano do trimestre é o do 1º mês). */}
                    <td className="px-4 py-2.5 text-xs text-zinc-400">{mesesDoTrimestre(h.trimestre.split(" - ")[0], h.ano).join(", ")}</td>
                    <td className="px-4 py-2.5 text-right tabular-nums text-zinc-300">{brl(h.pmpv, 4)}</td>
                    <td className={`px-4 py-2.5 text-right tabular-nums ${colorForValue(h.pr)}`}>{brl(h.pr, 4)}</td>
                    <td className={`px-4 py-2.5 text-right font-semibold tabular-nums ${colorForValue(h.pv)}`}>{brl(h.pv, 4)}</td>
                    <td className="px-4 py-2.5 text-right tabular-nums text-zinc-500">{dataHora(h.data_atualizacao)}</td>
                  </tr>
                );
              })}
              {historicoCarregado && historico.length === 0 && (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-zinc-500">Nenhum trimestre gravado ainda.</td></tr>
              )}
            </tbody>
          </table>
        </div>
        <Paginacao {...pag} onMudar={pag.setPagina} rotulo={["trimestre", "trimestres"]} />
      </section>
      </div>
    </div>
  );
}
