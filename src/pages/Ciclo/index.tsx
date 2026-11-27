import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { ChevronLeft, ChevronRight, FileArchive, FileSpreadsheet, FolderOpen, Lock } from "lucide-react";
import { ModalAviso, type VarianteAviso } from "../../components/ui/ModalAviso";
import { AreaSoltarPasta } from "../../components/ui/AreaSoltarPasta";
import { avisarAtencao, avisarSucesso } from "../../components/ui/avisos";
import { faixaDosMeses, rotuloCurtoDoTrimestre, rotuloDoPeriodo } from "../../utils/rotulos";
import { etapaDaChave, numeroDaEtapa, rotaDaEtapa } from "../../utils/etapasDoCiclo";
import { EVENTO_ABRIR_PAINEL, irParaSecao } from "../../components/ui/useIrParaSecao";
import { avisoDaSoltura, lerPastaSolta, type Soltura } from "../../utils/soltarPasta";
import {
  apurarPR, buscarTrimestreSR, gerarMinutaNotaTecnica, gerarRelatorioTrimestral, getHistoricoAuditoria, getHistoricoCGF, getHistoricoConcilia,
  getHistoricoRET, getHistoricoSCG, getPMPVMensal, getPR, getPVTrimestre, getSituacaoCiclo,
} from "../../api";
import { mensagemDeErro } from "../../api/client";
import { brl, num } from "../../utils/format";
import { salvarArquivo } from "../../utils/download";
import { NOMES_ETAPA, mapaDoTrimestre, type Etapa, type Situacao } from "../../utils/pastaCiclo";
import { linkDoPMPV, mesesDoPRDoCivil } from "../../utils/periodos";
import { chaveDoPR, chaveDoPV } from "../../utils/cartoesPRePV";
import { secaoPedidaNaUrl } from "../../utils/gravarNoPainel";
import { ProcessarTrimestre, type Retomada } from "./Processar";
import { AuditarMes } from "./AuditarMes";
import { CompararPlanilha } from "./CompararPlanilha";
import { SRDoTrimestre } from "./SRDoTrimestre";
import { TarifaMediaDoCiclo } from "./CartaoTarifaMedia";
import { PRDoTrimestre } from "./PRDoTrimestre";
import { PVDoTrimestre } from "./PVDoTrimestre";
import { aplicarEtapasDoBack, etapasDoBack } from "./etapasDoBack";
import { ConferenciaDoMes } from "./ConferenciaDoMes";
import { MapaPasta } from "./MapaPasta";
import { ICONE } from "./situacaoUI";
import { ProximoPassoBloco } from "./ProximoPassoBloco";
import { SubpassoRecolhivel } from "./SubpassoRecolhivel";
import { PASSOS_DA_PASTA, passoSelecionado } from "./passoSelecionado";
import { DetalheDoPMPV } from "./DetalheDoPMPV";
import { AoFechar } from "./AoFechar";
import { trimestresDoCicloTocados } from "./trimestresDoCicloTocados";
import {
  ID_APROVACAO, ID_COMPARAR, ID_ENTREGAS, ID_PASTA, ID_PR, ID_PROCESSAR, ID_PV, ID_SR, ROTULO_DESTINO, blocoDoProximoPasso, idDoPasso, textoDoAndamento, type AcaoDoBloco, type BlocoProximoPasso,
} from "./blocoProximoPasso";
import { AguardandoAprovacao } from "./AguardandoAprovacao";
import { linkDoCiclo, useManterPeriodoNaUrl, usePeriodoDaUrl } from "../../utils/periodoNaUrl";
import { esquecer, guardar, lembrar } from "../../utils/lembrar";
import { reabrirPasta, type ArquivoDaPastaCiclo, type ChavePasta, type PastaLida } from "../../utils/pasta";
import { ehZip, lerZipDaPasta } from "../../utils/zipCiclo";
import { Skeleton } from "../../components/ui/Skeleton";
import { EsqueletoLista } from "../../components/ui/EsqueletoLista";
import type {
  AuditoriaHistoricoLinha, CGFHistoricoLinha, ConciliaHistoricoLinha, PRApuracao, PVTrimestre, RETHistoricoLinha, SituacaoCiclo,
  SCGHistoricoLinha,
} from "../../types";
import { PageHeader } from "../../components/layout/PageHeader";
import { Button } from "../../components/ui/Button";
import { classesDoBotao } from "../../components/ui/estilosBotao";
import { DivergenciaSCG } from "./DivergenciaSCG";
import { calcularProximoPasso, proximoDoBack, type ChavePasso, type DestinoBloqueio } from "./proximoPasso";
import { trimestreSugerido } from "./trimestreSugerido";
import { escolherPlanilha, planilhaDoTrimestre, type PlanilhaEscolhida } from "./planilhaDoTrimestre";

const PANEL = "rounded-xl border border-white/[0.07] bg-panel";

// O que o Painel guarda no navegador (utils/lembrar) para sobreviver a recarregar a página.
const MEMORIA_PASTA = "ciclo:pasta";
const memoriaProcessar = (raiz: string, inicio: string) => `ciclo:processar:${raiz}:${inicio}`;
/** Nomes dos arquivos (o mapa só usa os nomes) e, no Chrome/Edge, a chave para reler a pasta. */
interface PastaGuardada { raiz: string; caminhos: string[]; chave?: ChavePasta }
/** Uma ideia curta por passo, para quem não conhece as siglas. */
const SUBTITULO: Partial<Record<ChavePasso, string>> = {
  pmpv: "Preço médio", auditoria: "Notas de compra", cgf: "Gás faturado", ret: "Transporte", rp: "Penalidades",
  scg: "Saldo do mês", sr: "Saldo remanescente", pr: "Recuperação", pv: "Preço de venda",
};
const MESES = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
const TRIMESTRES = ["Jan a Mar", "Abr a Jun", "Jul a Set", "Out a Dez"];

/** Por que a pasta não abriu, em janela: o que fazer vira o botão principal. */
interface AvisoPasta {
  variante: VarianteAviso;
  titulo: string;
  texto: string;
  acao?: "zip"; // botão principal "Escolher o .zip da pasta"
}

interface Dados {
  auditoria: AuditoriaHistoricoLinha[];
  cgf: CGFHistoricoLinha[];
  ret: RETHistoricoLinha[];
  concilia: ConciliaHistoricoLinha[];
  scg: SCGHistoricoLinha[];
  srSalvo: Record<string, unknown>[];
  pr: PRApuracao | null;
  prSalvo: number | null;
  pv: PVTrimestre | null;
  situacao: SituacaoCiclo | null; // GET /ciclo/situacao; null no back antigo (o Painel calcula sozinho)
  pmpv: number[]; // PMPV de cada mês apurado (0 = não salvo ou não consegui consultar)
}

async function carregar(meses: string[], mesesPR: string[]): Promise<Dados> {
  const chavePV = chaveDoPV(mesesPR); // as chaves gravadas do PR e do PV (não mudam): utils/cartoesPRePV.ts
  const vazio = <T,>(p: Promise<T>, padrao: T) => p.catch(() => padrao);
  const [auditoria, cgf, ret, concilia, scg, srSalvo, pr, prSalvo, pv, pmpv, situacao] = await Promise.all([
    getHistoricoAuditoria(), getHistoricoCGF(), getHistoricoRET(), getHistoricoConcilia(), getHistoricoSCG(),
    vazio(buscarTrimestreSR(`${meses[0]}_${meses[2]}`), []),
    vazio<PRApuracao | null>(apurarPR(mesesPR), null),
    vazio<number | null>(getPR(chaveDoPR(mesesPR)).then((r) => r.pr), null),
    vazio<PVTrimestre | null>(getPVTrimestre(chavePV.trimestre, chavePV.ano), null),
    // Mesmo critério do Processar: sem PMPV salvo (ou sem resposta), conta como faltando.
    Promise.all(meses.map((m) => getPMPVMensal(m).then((r) => r.pmpv || 0).catch(() => 0))),
    getSituacaoCiclo(`${meses[0]}_${meses[2]}`),
  ]);
  return { auditoria, cgf, ret, concilia, scg, srSalvo, pr, prSalvo, pv, pmpv, situacao };
}

/** Toast ao terminar de ler a pasta (ou o .zip): mesmos números do mapa. Só para pasta trazida
 * agora; a pasta "lembrada" ao recarregar a página não passa por aqui. */
function avisarPastaCarregada(raiz: string, nomes: string[], meses: string[]) {
  const mapa = mapaDoTrimestre(nomes, meses);
  const lidos = `${num(nomes.length)} arquivo(s) lido(s)`;
  // Agrupa o que falta por etapa: "Auditoria CGR: Ago, Set".
  const faltas = (["auditoria", "cgf", "ret", "conciliacao"] as Etapa[]).map((e) => {
    const m = mapa.celulas.filter((c) => c.etapa === e && c.situacao === "falta").map((c) => c.periodo.split("/")[0]);
    return m.length ? `${NOMES_ETAPA[e].split(" (")[0]}: ${m.join(", ")}` : null;
  }).filter(Boolean);
  const conferir = mapa.celulas.filter((c) => c.situacao === "atencao").length;
  if (faltas.length) {
    avisarAtencao(`Pasta ${raiz} carregada, mas faltam arquivos`, `${lidos}. Faltam: ${faltas.join("; ")}.`);
  } else if (conferir) {
    avisarAtencao(`Pasta ${raiz} carregada, com pontos para conferir`, `${lidos}; ${conferir} ponto(s) para conferir no mapa.`);
  } else {
    avisarSucesso(`Pasta ${raiz} carregada`, `${lidos}; ${faixaDosMeses(meses)}: tudo encontrado.`);
  }
}

// ── Etapas do ciclo ───────────────────────────────────────────────────────────

interface Etapa_ {
  chave: ChavePasso;
  titulo: string;
  descricao: string;
  situacao: Situacao;
  detalhe: ReactNode;
  link: string; // tela da etapa já no período certo (S2)
  extra?: ReactNode; // ação dentro do cartão (ex.: "Auditar <mês>" na Auditoria CGR)
  mesesQueFaltam?: string[]; // etapas mensais: entra na frase "Bloqueado: falta o SCG de Jul"
  soLink?: boolean; // só leva a uma tela (tarifa média): não conta como pronta nem vira "Próximo"
}

function porMes<T extends { periodo: string }>(lista: T[], meses: string[], valor: (l: T) => string,
  alerta?: (l: T) => string | null, linkDoMes?: (m: string) => string,
): { situacao: Situacao; detalhe: ReactNode; pendente?: string; mesesQueFaltam: string[] } {
  const linhas = meses.map((m) => ({ m, l: lista.find((x) => x.periodo === m) }));
  const alertas = linhas.map(({ l }) => (l && alerta ? alerta(l) : null));
  const faltam = linhas.filter(({ l }) => !l).length;
  const chip = (l: T | undefined, i: number) =>
    `rounded-md border px-2 py-1 text-xs tabular-nums ${
      !l ? "border-white/[0.07] text-zinc-500" : alertas[i] ? "border-amber-400/30 text-amber-200" : "border-emerald-400/20 text-zinc-200"}`;
  return {
    situacao: faltam ? "falta" : alertas.some(Boolean) ? "atencao" : "ok",
    // 1º mês, em ordem, que falta ou tem ⚠: é onde o "Fazer agora" abre.
    pendente: linhas.find(({ l }, i) => !l || alertas[i])?.m,
    mesesQueFaltam: linhas.filter(({ l }) => !l).map(({ m }) => m),
    detalhe: (
      <>
        <div className="flex flex-wrap gap-2">
          {linhas.map(({ m, l }, i) => {
            const texto = `${m.split("/")[0]}: ${l ? valor(l) : "falta"}${alertas[i] ? " ⚠" : ""}`;
            return linkDoMes ? (
              <Link key={m} to={linkDoMes(m)} title={`Abrir ${m}`} className={`${chip(l, i)} hover:border-sky-400/50 hover:text-white`}>
                {texto}
              </Link>
            ) : (
              <span key={m} className={chip(l, i)}>{texto}</span>
            );
          })}
        </div>
        {/* O motivo do ⚠ escrito, não só no passar do mouse. */}
        {[...new Set(alertas.filter(Boolean))].map((a) => (
          <p key={a} className="mt-1.5 text-xs text-amber-200/90">
            ⚠ {linhas.filter((_, i) => alertas[i] === a).map(({ m }) => m.split("/")[0]).join(", ")}: {a}
          </p>
        ))}
      </>
    ),
  };
}

/** Etapa mensal: "Fazer agora" abre no 1º mês pendente; cada chip de mês abre aquele mês. */
function etapaMensal<T extends { periodo: string }>(chave: ChavePasso, titulo: string, descricao: string, lista: T[],
  meses: string[], valor: (l: T) => string, alerta?: (l: T) => string | null): Etapa_ {
  const linkDoMes = (m: string) => linkDoCiclo(rotaDaEtapa(chave), meses[0], { chave: "periodo", valor: m });
  const { pendente, ...resto } = porMes(lista, meses, valor, alerta, linkDoMes);
  return { chave, titulo, descricao, ...resto, link: linkDoMes(pendente ?? meses[0]) };
}

function etapas(d: Dados, meses: string[], mesesPR: string[], auditarMes: ReactNode, divergenciaScg: ReactNode, tarifaMedia: ReactNode): Etapa_[] {
  const faixaPR = `${mesesPR[0]} a ${mesesPR[2]}`;
  const srTotal = d.srSalvo.reduce((s, l) => s + Number(l.sr_selic ?? 0), 0);
  const prDifere = d.pr && d.prSalvo !== null && Math.abs(d.prSalvo - d.pr.pr) > 1e-9;
  const pvDifere = d.pv?.salvo && Math.abs(d.pv.salvo.pv - d.pv.pv) > 1e-9;
  const trimestrePR = { chave: "trimestre" as const, valor: mesesPR[0] };
  // O PMPV é por trimestre do ciclo e o apurado é civil: cada trimestre do ciclo que cobre um mês apurado é um item.
  const tocados = trimestresDoCicloTocados(meses, d.pmpv);
  const pmpvPendente = tocados.find((t) => !t.pronto)?.mesesQueFaltam[0] ?? meses[0];
  return [
    // Passo 1 do roteiro: o PMPV dos meses apurados (o CGF usa), um item por trimestre do ciclo. A tela PMPV volta ao Painel pelo ?de=ciclo.
    { chave: "pmpv" as const, titulo: etapaDaChave("pmpv").nome, descricao: "Cada trimestre do ciclo que cobre um mês apurado tem o seu PMPV (e o VP); o CGF usa",
      link: linkDoPMPV(meses[0], pmpvPendente), situacao: tocados.every((t) => t.pronto) ? "ok" as const : "falta" as const,
      mesesQueFaltam: tocados.flatMap((t) => t.mesesQueFaltam), detalhe: <DetalheDoPMPV trimestres={tocados} cicloInicio={meses[0]} /> },
    { ...etapaMensal("auditoria", "Auditoria CGR", "NF de compra de gás e CT-e da TAG de cada mês", d.auditoria, meses,
      (l) => brl(l.cgr_gravado)), extra: auditarMes },
    etapaMensal("cgf", "CGF — Volume Faturado", "Planilhas de NF faturadas, canceladas e devolvidas", d.cgf, meses,
      (l) => brl(l.cgf_rs), (l) => (l.volume_devolucoes ? null : "Devoluções = 0: confira se a planilha de devoluções entrou.")),
    // RET não tem seletor de mês: o período vem dos próprios arquivos.
    { chave: "ret" as const, titulo: "RET — Encargos de transporte", descricao: "NDs e faturas de transporte (EAT + EC)", link: linkDoCiclo(rotaDaEtapa("ret"), meses[0]),
      ...porMes(d.ret, meses, (l) => brl(l.ret_gravado)) },
    etapaMensal("rp", "RP — Conciliação de penalidades", "Receitas (inclui TOP) e despesas de penalidade", d.concilia,
      meses, (l) => brl(l.rp_gravado),
      (l) => (Math.abs(l.rp_dos_itens - l.rp_gravado) > 1 ? "O RP gravado difere da soma dos itens." : null)),
    { ...etapaMensal("scg", "SCG — Saldo da Conta Gráfica", "SCG = RPV + RET + RP, por mês", d.scg, meses,
      (l) => brl(l.scg), (l) => (l.diverge ? "Os módulos e o valor gravado não batem." : null)), extra: divergenciaScg },
    {
      chave: "sr" as const, titulo: "SR — Saldo Remanescente", descricao: "Quadro 6 do trimestre, com SELIC",
      link: linkDoCiclo(rotaDaEtapa("sr"), meses[0], { chave: "trimestre", valor: meses[0] }),
      situacao: d.srSalvo.length ? "ok" : "falta",
      detalhe: d.srSalvo.length ? <span>Salvo · total {brl(srTotal)}</span> : <span>Ainda não salvo para este trimestre.</span>,
    },
    {
      chave: "pr" as const, titulo: `PR — Parcela de Recuperação de ${faixaPR}`, descricao: "Quadro 7: (SCG + SR com SELIC) ÷ VP",
      link: linkDoCiclo(rotaDaEtapa("pr"), meses[0], trimestrePR),
      situacao: !d.pr || d.pr.pendencias.length ? "falta" : prDifere || d.prSalvo === null ? "atencao" : "ok",
      detalhe: !d.pr ? <span>Não consegui calcular agora: abra a tela PR para ver o motivo.</span> : d.pr.pendencias.length ? (
        <span>{d.pr.pendencias.join(" ")}</span>
      ) : (
        <span>Calculado {num(d.pr.pr, 4)} · {d.prSalvo === null ? "ainda não salvo" : prDifere ? `salvo ${num(d.prSalvo, 4)} (diferente — salve de novo)` : "salvo"}</span>
      ),
    },
    {
      chave: "pv" as const, titulo: `PV — Preço de Venda de ${faixaPR}`, descricao: "Quadro 8: PMPV + PR",
      link: linkDoCiclo(rotaDaEtapa("pv"), meses[0], trimestrePR),
      situacao: !d.pv ? "falta" : !d.pv.salvo || pvDifere ? "atencao" : "ok",
      detalhe: !d.pv ? <span>Não consegui consultar agora: abra a tela PV para ver o motivo.</span> : (
        <span>Atual {num(d.pv.pv, 4)} · {!d.pv.salvo ? "ainda não salvo" : pvDifere ? `salvo ${num(d.pv.salvo.pv, 4)} (diferente — salve de novo)` : "salvo"}</span>
      ),
    },
    // Passo 5 do roteiro: só leitura aqui; a tarifa média (PV + MB) se fecha no PMPV.
    {
      chave: "tarifa" as const, titulo: "Tarifa média", soLink: true, situacao: "falta" as const,
      descricao: "PV + margem de distribuição (MB); a tarifa nunca é gravada aqui",
      link: linkDoPMPV(meses[0], mesesPR[0]),
      detalhe: tarifaMedia,
    },
  ];
}

// ── Página ────────────────────────────────────────────────────────────────────

export default function CicloPage() {
  const hoje = new Date();
  // "Voltar ao Painel" das telas reabre o mesmo trimestre (?trimestre=Abr/2026, 1º mês).
  const daUrl = usePeriodoDaUrl("trimestre");
  const inicio = daUrl && daUrl.mes % 3 === 0 ? daUrl : null;
  const sugerido = trimestreSugerido(hoje); // o último trimestre terminado (em janeiro, Out–Dez do ano anterior)
  const [ano, setAno] = useState(inicio?.ano ?? sugerido.ano);
  const [tri, setTri] = useState(inicio ? inicio.mes / 3 : sugerido.tri);
  const meses = useMemo(() => [0, 1, 2].map((i) => `${MESES[tri * 3 + i]}/${ano}`), [ano, tri]);
  const mesesPR = useMemo(() => mesesDoPRDoCivil(meses[2]), [meses]);
  useManterPeriodoNaUrl("trimestre", meses[0]);

  const [escolhido, setEscolhido] = useState<ChavePasso | null>(null); // passo aberto à direita; null = o próximo passo
  const [dados, setDados] = useState<Dados | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);              // a carga da situação falhou (aparece no bloco "Próximo passo")
  const [erroEntrega, setErroEntrega] = useState<string | null>(null);  // minuta ou relatório não saiu (aparece em "Ao fechar")
  const [aguardandoAprovacao, setAguardandoAprovacao] = useState(false); // o trimestre aberto tem SR, PR ou PV para o analista aprovar
  // Vindo de uma tela que gravou (?aprovar=1): rola até o bloco de aprovação quando a carga termina.
  const [params, setParams] = useSearchParams();
  const pediuAprovar = params.get("aprovar") === "1";
  // Vindo de /sr, /pr ou /pv ("Gravar no Painel", ?abrir=pr): abre o cartão do passo quando a carga termina.
  const pediuAbrir = secaoPedidaNaUrl(params.get("abrir"));
  const [caminhos, setCaminhos] = useState<string[] | null>(null);
  // Os arquivos da pasta escolhida (caminho sem a pasta raiz → File), para o "Processar" enviar.
  const [arquivos, setArquivos] = useState<Map<string, ArquivoDaPastaCiclo>>(new Map());
  const [processando, setProcessando] = useState(false);
  const [versao, setVersao] = useState(0); // muda depois de gravar: recarrega as etapas
  const [raiz, setRaiz] = useState("");
  const [retomar, setRetomar] = useState<Retomada | null>(null); // prévia do Processar guardada
  // "lendo": listando os nomes da pasta ou do .zip (esqueleto).
  const [estadoPasta, setEstadoPasta] = useState<"parada" | "lendo">("parada");
  const ocupadoPasta = estadoPasta !== "parada";
  // Por que a pasta não entrou (soltou arquivos, .zip inválido ou vazio, erro): em janela,
  // com o próximo passo como botão.
  const [avisoLeitura, setAvisoLeitura] = useState<AvisoPasta | null>(null);
  const [rodada, setRodada] = useState(0); // "Recomeçar o Processar": muda a key e zera o painel
  // Três jeitos de trazer a pasta: arrastar e .zip (o Chrome não pergunta nada) e o seletor
  // de pasta (<input webkitdirectory>), que é mais fácil de achar, mas o Chrome pode
  // perguntar "Enviar X arquivos para este site?". O seletor não dá chave: não é relida ao recarregar.
  const inputZip = useRef<HTMLInputElement>(null);
  const botaoZip = useRef<HTMLButtonElement>(null);   // o foco volta para ele ao fechar o aviso
  const [gerandoNT, setGerandoNT] = useState(false);
  const [gerandoRel, setGerandoRel] = useState(false);
  // Planilha escolhida no "Comparar com a planilha": o relatório do trimestre compara as notas com ela.
  const [planilhaEscolhida, setPlanilhaEscolhida] = useState<PlanilhaEscolhida<File> | null>(null);
  const planilhaRel = planilhaDoTrimestre(planilhaEscolhida, meses[0]);

  // Ao abrir a tela: traz de volta a última pasta (os nomes, para o mapa). Se ela foi
  // arrastada e o navegador ainda dá a permissão SEM perguntar, relê os arquivos; senão,
  // pede para arrastar de novo. Nunca pede permissão (seria o aviso do Chrome).
  useEffect(() => {
    lembrar<PastaGuardada>(MEMORIA_PASTA).then(async (g) => {
      if (!g) return;
      setRaiz(g.raiz);
      setCaminhos(g.caminhos);
      if (!g.chave) return;
      setEstadoPasta("lendo");
      const lida = await reabrirPasta(g.chave).catch(() => null);
      if (lida) setArquivos(lida.arquivos);
      setEstadoPasta("parada");
    });
  }, []);

  // A cada pasta ou trimestre: reabre o Processar onde parou, se houver prévia guardada.
  useEffect(() => {
    if (!raiz) return;
    let vigente = true;
    lembrar<Retomada>(memoriaProcessar(raiz, meses[0])).then((r) => {
      if (!vigente) return;
      setRetomar(r ?? null);
      setProcessando(!!r);
    });
    return () => { vigente = false; };
  }, [raiz, meses]);

  useEffect(() => {
    // Só a carga mais recente vale: uma anterior que falhe depois não pinta erro sobre dados bons.
    let vigente = true;
    carregar(meses, mesesPR)
      .then((d) => { if (vigente) { setDados(d); setErro(null); setCarregando(false); } })
      .catch((e) => { if (vigente) { setErro(mensagemDeErro(e, "Não foi possível carregar a situação do ciclo.")); setCarregando(false); } });
    return () => { vigente = false; };
  }, [meses, mesesPR, versao]);

  useEffect(() => {
    if (!pediuAprovar || carregando) return;
    const t = window.setTimeout(() => {
      irParaSecao(ID_APROVACAO);
      setParams((p) => { p.delete("aprovar"); return p; }, { replace: true });
    }, 600); // a prévia da cascata chega depois da situação
    return () => window.clearTimeout(t);
  }, [pediuAprovar, carregando, setParams]);

  useEffect(() => {
    if (!pediuAbrir || carregando) return;
    const t = window.setTimeout(() => {
      irParaSecao(pediuAbrir);
      setParams((p) => { p.delete("abrir"); return p; }, { replace: true });
    }, 150);
    return () => window.clearTimeout(t);
  }, [pediuAbrir, carregando, setParams]);

  // Outras telas (irParaSecao) pedem para mostrar o painel de um passo que está escondido.
  useEffect(() => {
    const abrir = (ev: Event) => setEscolhido((ev as CustomEvent<ChavePasso>).detail);
    window.addEventListener(EVENTO_ABRIR_PAINEL, abrir);
    return () => window.removeEventListener(EVENTO_ABRIR_PAINEL, abrir);
  }, []);

  const irPara = (novoAno: number, novoTri: number) => {
    setCarregando(true);
    setProcessando(false);
    setPlanilhaEscolhida(null); // a planilha de um trimestre não vale para outro
    setErroEntrega(null);
    setEscolhido(null);
    setAno(novoAno);
    setTri(novoTri);
  };

  const avancarDepois = useRef(false);
  const aoGravarPasso = () => { avancarDepois.current = true; setVersao((v) => v + 1); };
  const mesesScgDivergentes = dados ? meses.filter((m) => dados.scg.find((l) => l.periodo === m)?.diverge) : [];
  const listaLocal = dados ? etapas(dados, meses, mesesPR,
    <AuditarMes key={meses[0]} meses={meses} auditoria={dados.auditoria} planilha={planilhaRel} onGravado={aoGravarPasso} />,
    mesesScgDivergentes.length ? <DivergenciaSCG meses={mesesScgDivergentes} cicloInicio={meses[0]} versao={versao} /> : null,
    <TarifaMediaDoCiclo semLink trimestre={`${mesesPR[0]}_${mesesPR[2]}`} versao={versao} link={linkDoPMPV(meses[0], mesesPR[0])} />) : [];
  // Back novo: o estado de cada passo vem de GET /ciclo/situacao (campo `etapas`). Sem o campo (back antigo) ou com ele
  // estranho, vale o cálculo local de sempre. Os detalhes de cada passo (valores por mês) continuam vindo do que o Painel leu.
  const lista = aplicarEtapasDoBack(listaLocal, etapasDoBack(dados?.situacao));
  const contaveis = lista.filter((e) => !e.soLink);
  const prontas = contaveis.filter((e) => e.situacao === "ok").length;
  // Próximo passo e bloqueios: calculados aqui com o que o Painel já carregou (depois vêm de GET /ciclo/situacao).
  const local = calcularProximoPasso({
    passos: lista.map((e) => ({ chave: e.chave, situacao: e.situacao, mesesQueFaltam: e.mesesQueFaltam, soLink: e.soLink })),
    pmpvNovoPronto: dados?.situacao?.pmpv_novo ? dados.situacao.pmpv_novo.existe : dados?.pv ? dados.pv.pmpv > 0 : null,
    rotuloPmpvNovo: `${mesesPR[0].split("/")[0]} a ${mesesPR[2]}`,
  });
  const bloqueios = local.bloqueios;
  const proximo = proximoDoBack(local.proximo, dados?.situacao?.proximo_passo,
    Object.fromEntries(lista.map((e) => [e.chave, e.situacao])));
  const linkDoDestino = (d: DestinoBloqueio) => d === "pmpv_novo" ? linkDoPMPV(meses[0], mesesPR[0]) : lista.find((e) => e.chave === d)?.link ?? "#";
  const mapa = caminhos ? mapaDoTrimestre(caminhos, meses) : null;

  /** Pasta nova (arrastada, escolhida ou .zip): descarta a prévia antiga dela e guarda os nomes (e a chave). */
  const aplicarPasta = async (pasta: PastaLida, chave?: ChavePasta) => {
    await esquecer(memoriaProcessar(pasta.raiz, meses[0]));
    const nomes = [...pasta.arquivos.keys()];
    setRetomar(null);
    setProcessando(false);
    setRaiz(pasta.raiz);
    setCaminhos(nomes);
    setArquivos(pasta.arquivos);
    guardar(MEMORIA_PASTA, { raiz: pasta.raiz, caminhos: nomes, chave } satisfies PastaGuardada);
  };

  // Nome que os textos usam para a pasta do ano (ex.: SCG-26).
  const nomePasta = raiz || `SCG-${String(ano).slice(-2)}`;

  /** Lê a pasta (ou o .zip) e mostra o mapa; erro ou nada dentro → aviso em janela. */
  const lerEntrada = async (ler: () => Promise<PastaLida>, chave?: Promise<ChavePasta | null>, oQue = "a pasta") => {
    setAvisoLeitura(null);
    setEstadoPasta("lendo");
    try {
      const [pasta, k] = await Promise.all([ler(), chave ?? Promise.resolve(null)]);
      if (!pasta.arquivos.size) {
        setAvisoLeitura({ variante: "atencao", titulo: oQue === "o .zip" ? "O .zip está vazio" : "A pasta está vazia",
          texto: `Não encontrei nenhum arquivo ${pasta.raiz ? `em “${pasta.raiz}”` : "na pasta escolhida"}. Confira se é a pasta das notas do ano (ex.: ${nomePasta}) e tente de novo.`,
          acao: "zip" });
        return;
      }
      await aplicarPasta(pasta, k ?? undefined);
      avisarPastaCarregada(pasta.raiz || nomePasta, [...pasta.arquivos.keys()], meses);
    } catch (e) {
      setAvisoLeitura({ variante: "erro", titulo: `Não foi possível ler ${oQue}`, acao: "zip",
        texto: e instanceof Error && !("isAxiosError" in e) ? e.message : mensagemDeErro(e, `Não foi possível ler ${oQue}.`) });
    } finally {
      setEstadoPasta("parada");
    }
  };

  // Pasta (ou .zip) arrastada para a área: o Chrome não pergunta nada.
  const soltar = (s: Soltura) => {
    if (s.tipo === "pasta" && s.pasta) { const p = s.pasta; lerEntrada(() => lerPastaSolta(p), s.chave); return; }
    if (s.tipo === "zip" && s.zip) { escolherZip(s.zip); return; }
    const a = avisoDaSoltura(s.tipo === "pasta" || s.tipo === "zip" ? "nada" : s.tipo, nomePasta);
    setAvisoLeitura({ variante: "atencao", ...a, acao: "zip" });
  };

  const escolherZip = (f: File | undefined) => {
    if (!f) return;
    if (!ehZip(f)) {
      setAvisoLeitura({ variante: "atencao", titulo: "Escolha um arquivo .zip", acao: "zip",
        texto: `“${f.name}” não é um .zip. Compacte a pasta ${nomePasta} (botão direito › Enviar para › Pasta compactada) `
          + "e escolha o .zip, ou arraste a pasta para a área tracejada." });
      return;
    }
    lerEntrada(() => lerZipDaPasta(f), undefined, "o .zip");
  };

  const fecharProcessar = () => {
    esquecer(memoriaProcessar(raiz, meses[0]));
    setRetomar(null);
    setProcessando(false);
  };

  // Prévia antiga aberta (ex.: voltou depois de recarregar): descarta e começa do zero.
  const recomecarProcessar = () => {
    esquecer(memoriaProcessar(raiz, meses[0]));
    setRetomar(null);
    setRodada((r) => r + 1);
    setProcessando(true);
  };

  // Lembrou os nomes, mas ainda sem acesso aos arquivos: dá para ver o mapa, não enviar.
  const semArquivos = !!caminhos && arquivos.size === 0;

  const gerarNT = async () => {
    setGerandoNT(true);
    try {
      salvarArquivo(await gerarMinutaNotaTecnica(meses[2]),
        `Minuta_NT_Repasse_${mesesPR[0].replace("/", "-")}_a_${mesesPR[2].replace("/", "-")}.docx`);
    } catch (e) {
      setErroEntrega(mensagemDeErro(e, "Não foi possível gerar a minuta da Nota Técnica."));
    } finally {
      setGerandoNT(false);
    }
  };

  // Word do trimestre: resultado dos meses e o que não confere (provas reais). Não grava nada.
  const gerarRelatorio = async () => {
    setGerandoRel(true);
    try {
      salvarArquivo(await gerarRelatorioTrimestral(meses[2], planilhaRel),
        `Relatorio_Trimestral_${meses[0].replace("/", "-")}_a_${meses[2].replace("/", "-")}.docx`);
    } catch (e) {
      setErroEntrega(mensagemDeErro(e, "Não foi possível gerar o relatório do trimestre."));
    } finally {
      setGerandoRel(false);
    }
  };

  // ── Bloco "Próximo passo" (o texto e o botão de cada situação moram em blocoDoProximoPasso) ──
  const tocados = dados ? trimestresDoCicloTocados(meses, dados.pmpv) : [];
  const trimestrePMPVPendente = tocados.find((t) => !t.pronto)?.trimestre;
  const bloco: BlocoProximoPasso | null = carregando ? null : blocoDoProximoPasso({
    erro: !!erro, proximo, bloqueios,
    passos: lista.map((e) => ({ chave: e.chave, situacao: e.situacao, mesesQueFaltam: e.mesesQueFaltam, soLink: e.soLink })),
    temPasta: !!caminhos, temArquivos: arquivos.size > 0, nomePasta, aguardandoAprovacao,
    selic: dados?.situacao?.selic,
    rotulos: { apurado: rotuloDoPeriodo(meses), ciclo: rotuloDoPeriodo(mesesPR),
      pmpvPendente: trimestrePMPVPendente ? rotuloCurtoDoTrimestre(trimestrePMPVPendente) : null },
    linkDe: linkDoDestino,
  });

  const executarAcao = (a: AcaoDoBloco) => {
    if (a.tipo === "recarregar") { setErro(null); setCarregando(true); setVersao((v) => v + 1); return; }
    if (a.tipo === "rolar") { irParaSecao(a.alvo); return; }
    if (a.tipo === "abrir-processar") {
      if (!processando) setProcessando(true);
      setEscolhido("auditoria");
      window.setTimeout(() => irParaSecao(ID_PROCESSAR), 120); // espera o Processar aparecer
    }
  };

  const tarifa = lista.find((e) => e.chave === "tarifa");
  const bloqueioTarifa = bloqueios.tarifa;

  const passos = lista.filter((e) => e.chave !== "tarifa");
  const ativo = passoSelecionado(escolhido, proximo, passos.map((e) => e.chave));
  // No estreito a trilha é uma faixa rolável: mantém o passo aberto à vista.
  const trilhaRef = useRef<HTMLElement>(null);
  useEffect(() => {
    if (!window.matchMedia("(max-width: 1023px)").matches) return;
    trilhaRef.current?.querySelector<HTMLElement>("[aria-current=step]")?.scrollIntoView({ inline: "center", block: "nearest" });
  }, [ativo, carregando]);

  // Depois de gravar um passo: quando a situação nova chega, rola até o próximo passo pendente (ou às entregas).
  useEffect(() => {
    if (!avancarDepois.current || carregando || !dados) return;
    avancarDepois.current = false;
    const alvo = proximo ? idDoPasso(proximo) : ID_ENTREGAS;
    window.setTimeout(() => irParaSecao(alvo), 250); // espera o React desenhar a situação nova
  }, [dados, carregando, proximo]);

  // Ao rolar, o passo à vista fica marcado na trilha (aria-current="step").
  const chavesDosPassos = passos.map((e) => e.chave).join(",");
  useEffect(() => {
    if (!chavesDosPassos) return;
    const chaves = chavesDosPassos.split(",") as ChavePasso[];
    const raizDaRolagem = trilhaRef.current?.closest("main") ?? null;
    const visiveis = new Set<ChavePasso>();
    const obs = new IntersectionObserver((itens) => {
      for (const i of itens) {
        const chave = chaves.find((c) => idDoPasso(c) === i.target.id);
        if (!chave) continue;
        if (i.isIntersecting) visiveis.add(chave); else visiveis.delete(chave);
      }
      const primeiro = chaves.find((c) => visiveis.has(c));
      if (primeiro) setEscolhido(primeiro);
    }, { root: raizDaRolagem, rootMargin: "-140px 0px -55% 0px" }); // a faixa de leitura: abaixo da trilha, até perto do meio da tela
    chaves.forEach((c) => { const el = document.getElementById(idDoPasso(c)); if (el) obs.observe(el); });
    return () => obs.disconnect();
  }, [chavesDosPassos]);

  /** Resumo do passo aberto: título, valores por mês, bloqueio e o botão que leva à tela dele. */
  const resumo = (e: Etapa_) => {
    const bloqueio = bloqueios[e.chave];
    const vaiParaTela = !bloqueio && e.chave !== proximo && e.chave !== "sr" && e.chave !== "pr" && e.chave !== "pv";
    return (
      <div className={`${PANEL} p-5 sm:p-6`}>
        <div className="flex flex-wrap items-center gap-3">
          <h2 className="text-base font-semibold text-white">
            <span className="mr-2 tabular-nums text-zinc-500">{numeroDaEtapa(e.chave)}</span>{e.titulo}
          </h2>
          <span className="ml-auto flex items-center gap-2">
            {ICONE[e.situacao]}
            {bloqueio ? (
              <Link to={linkDoDestino(bloqueio.destino)} className={classesDoBotao("ghost", "md")}>
                {bloqueio.destino === "pmpv_novo" ? `Abrir o PMPV de ${mesesPR[0].split("/")[0]} a ${mesesPR[2].split("/")[0]}` : ROTULO_DESTINO[bloqueio.destino]}
              </Link>
            ) : vaiParaTela ? (
              <Link to={e.link} className={classesDoBotao(e.situacao === "ok" ? "ghost" : "primary", "md")}>{e.situacao === "ok" ? "Ver" : PASSOS_DA_PASTA.includes(e.chave) && e.chave !== "auditoria" ? `Abrir a tela avulsa do ${etapaDaChave(e.chave).sigla}` : "Fazer agora"}</Link>
            ) : null}
          </span>
        </div>
        <div className="mt-3 text-sm text-zinc-300">{e.detalhe}</div>
        {bloqueio && (
          <p className="mt-2 flex items-start gap-1.5 text-sm font-medium text-amber-200">
            <Lock size={14} className="mt-1 shrink-0" aria-hidden />
            <span>Bloqueado: {bloqueio.motivo}.</span>
          </p>
        )}
        {e.extra}
      </div>
    );
  };

  const aoFechar = (
    <AoFechar carregando={carregando} erro={erroEntrega} planilha={planilhaRel?.name ?? null}
      onEscolherPlanilha={() => irParaSecao(ID_COMPARAR)}
      onGerarNT={gerarNT} gerandoNT={gerandoNT} onGerarRelatorio={gerarRelatorio} gerandoRelatorio={gerandoRel}
      tarifa={{ detalhe: tarifa?.detalhe, link: tarifa?.link ?? "#",
        bloqueio: bloqueioTarifa ? { motivo: bloqueioTarifa.motivo, link: linkDoDestino(bloqueioTarifa.destino), rotulo: ROTULO_DESTINO[bloqueioTarifa.destino],
          rolarPara: bloqueioTarifa.destino === "pv" ? ID_PV : undefined } : undefined }} />
  );

  return (
    <div className="px-4 py-6 sm:px-8 lg:px-10 lg:py-8">
      <div className="mx-auto flex max-w-[1280px] flex-col gap-5">
        <PageHeader modulo="ciclo" />

        {/* Topo: o trimestre e o andamento. Tudo abaixo depende dele. */}
        <section className={`${PANEL} flex flex-wrap items-center gap-x-4 gap-y-3 p-4 sm:px-6`}>
          <div className="flex items-center gap-1">
            <button type="button" aria-label="Ano anterior" onClick={() => irPara(ano - 1, tri)}
              className="flex min-h-11 min-w-11 items-center justify-center rounded-lg text-zinc-400 transition-colors hover:bg-white/[0.05] hover:text-white"><ChevronLeft size={16} /></button>
            <span className="w-14 text-center text-lg font-semibold tabular-nums text-white">{ano}</span>
            <button type="button" aria-label="Próximo ano" onClick={() => irPara(ano + 1, tri)}
              className="flex min-h-11 min-w-11 items-center justify-center rounded-lg text-zinc-400 transition-colors hover:bg-white/[0.05] hover:text-white"><ChevronRight size={16} /></button>
          </div>
          <div role="radiogroup" aria-label="Trimestre civil apurado" className="flex flex-wrap gap-1 rounded-lg bg-white/[0.03] p-1">
            {TRIMESTRES.map((t, i) => (
              <button key={t} type="button" role="radio" aria-checked={tri === i} onClick={() => irPara(ano, i)}
                className={`min-h-11 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  tri === i ? "bg-sky-500/20 text-sky-200" : "text-zinc-400 hover:text-zinc-100"}`}>{t}</button>
            ))}
          </div>
          <p className="text-sm text-zinc-400 lg:ml-auto">
            Apura <b className="text-zinc-200">{rotuloDoPeriodo(meses, "civil")}</b> → PR e PV de{" "}
            <b className="text-zinc-200">{rotuloDoPeriodo(mesesPR, "ciclo")}</b>
            {dados && !carregando && <span className="ml-2 rounded-md bg-white/[0.06] px-2 py-0.5 text-xs font-semibold tabular-nums text-zinc-200">{textoDoAndamento(prontas, contaveis.length)}</span>}
          </p>
        </section>

        {/* Faixa do próximo passo e da aprovação: o que fazer agora, um botão. */}
        <ProximoPassoBloco bloco={bloco} detalheDoErro={erro} onAcao={executarAcao} />
        <div id={ID_APROVACAO} className="scroll-mt-4 empty:hidden">
          <AguardandoAprovacao key={meses[0]} meses={meses} versao={versao} aoMudar={setAguardandoAprovacao} aoAplicar={() => setVersao((v) => v + 1)} />
        </div>

        {/* Trilha: índice fixo no topo da área que rola. Clicar rola até o passo; o passo à vista fica marcado. */}
        <nav ref={trilhaRef} aria-label="Passos do trimestre" className={`${PANEL} sticky top-0 z-20 overflow-hidden shadow-lg shadow-black/30`}>
          {carregando ? (
            <EsqueletoEtapas />
          ) : (
            <ol className="flex divide-x divide-white/[0.05] overflow-x-auto lg:grid lg:grid-cols-9 lg:overflow-visible">
              {passos.map((e) => {
                const ehProximo = e.chave === proximo;
                const aberto = e.chave === ativo;
                const bloqueio = bloqueios[e.chave];
                return (
                  <li key={e.chave} className="min-w-[8.5rem] shrink-0 lg:min-w-0 lg:shrink">
                    <button type="button" onClick={() => { setEscolhido(e.chave); irParaSecao(idDoPasso(e.chave)); }} aria-current={aberto ? "step" : undefined}
                      title={bloqueio ? `Bloqueado: ${bloqueio.motivo}` : e.titulo}
                      className={`flex h-full min-h-20 w-full flex-col items-start gap-1 border-t-4 px-3 py-3 text-left transition-colors ${
                        aberto ? "border-sky-400 bg-sky-500/[0.08] text-white" : "border-transparent text-zinc-300 hover:bg-white/[0.04]"}`}>
                      <span className="flex w-full items-center gap-2 text-xs tabular-nums text-zinc-500">
                        {numeroDaEtapa(e.chave)}
                        {ICONE[e.situacao]}
                        {bloqueio && <Lock size={13} className="shrink-0 text-amber-300" aria-label="Bloqueado" />}
                        {ehProximo && <span className="rounded-md bg-sky-500/20 px-1.5 py-0.5 text-xs font-semibold text-sky-200">Próximo<span className="sr-only"> (próximo passo)</span></span>}
                      </span>
                      <span className="text-sm font-semibold">{etapaDaChave(e.chave).sigla ?? e.titulo.split(" — ")[0]}</span>
                      <span className="text-xs text-zinc-400">{SUBTITULO[e.chave]}</span>
                    </button>
                  </li>
                );
              })}
            </ol>
          )}
        </nav>

        {/* O passo aberto. Os blocos de trabalho ficam montados, só escondidos, para não perder pasta, prévia nem planilha ao trocar de passo. */}
        <div className="flex min-w-0 flex-col gap-5">
          {passos.map((e) => (
            <section key={e.chave} id={idDoPasso(e.chave)} aria-label={`Passo ${numeroDaEtapa(e.chave)}: ${e.titulo}`}
              style={{ scrollMarginTop: "7rem" }} className="realce-secao flex flex-col gap-5">
            {(!["sr", "pr", "pv"].includes(e.chave) || bloqueios[e.chave]) && resumo(e)}

            {e.chave === "auditoria" && <div className="flex flex-col gap-3">
              <div id={ID_PASTA} className={`${PANEL} scroll-mt-28 p-5 sm:p-6`}>
                <h2 className="flex items-center gap-2 text-base font-semibold text-white"><FolderOpen size={16} /> Processar a pasta <span className="text-xs font-normal text-zinc-500">(passos 2 a 5)</span></h2>
                <p className="mt-1 text-sm text-zinc-400">Arraste a pasta <b>{nomePasta}</b>. Ao arrastar, só os nomes são lidos, aqui no navegador. Os arquivos só seguem para o servidor quando você clicar em Processar (ou em Comparar com a planilha), e nada é gravado sem a sua confirmação.</p>
                <p className="mt-2 text-sm text-zinc-400">Feito junto, num Processar só: Auditoria CGR, CGF, RET e RP (passos 2 a 5). Você escolhe o que enviar e confere tudo antes de gravar.</p>
                <div className="mt-4">
                  <AreaSoltarPasta texto={`Arraste aqui a pasta ${nomePasta} (ou outra do ano)`} onSoltar={soltar} desabilitado={ocupadoPasta}>
                    {/* Sem "Escolher a pasta" de propósito: o seletor de pasta do sistema faz o Chrome abrir
                        o aviso "Quer carregar N ficheiros para este site?", que nenhum site consegue esconder
                        nem estilizar. Arrastar ou usar o .zip não dispara esse aviso. */}
                    <Button variant="primary" ref={botaoZip} onClick={() => inputZip.current?.click()} disabled={ocupadoPasta}>
                      <FileArchive size={16} aria-hidden /> ou escolha o .zip da pasta
                    </Button>
                    <input ref={inputZip} type="file" accept=".zip,application/zip" className="hidden" tabIndex={-1} aria-hidden
                      onChange={(e) => { escolherZip(e.target.files?.[0]); e.target.value = ""; }} />
                  </AreaSoltarPasta>
                </div>
                <ModalAviso aberto={!!avisoLeitura} onFechar={() => setAvisoLeitura(null)} voltarFoco={botaoZip}
                  variante={avisoLeitura?.variante} titulo={avisoLeitura?.titulo ?? ""}
                  acao={avisoLeitura?.acao === "zip"
                    ? { rotulo: "Escolher o .zip da pasta", onClick: () => { setAvisoLeitura(null); inputZip.current?.click(); } }
                    : undefined}>
                  {avisoLeitura?.texto ?? ""}
                </ModalAviso>
                {ocupadoPasta && (
                  <div className="mt-5">
                    <p className="text-sm text-zinc-400">Lendo os nomes dos arquivos…</p>
                    <EsqueletoLista linhas={4} className="mt-4" texto="Lendo os arquivos da pasta" />
                  </div>
                )}
                {/* Conferência do mês: total de cada etapa x mês anterior, antes de processar e gravar. */}
                {mapa && !ocupadoPasta && <ConferenciaDoMes key={meses[0]} meses={meses} versao={versao} />}
                {mapa && !ocupadoPasta && (
                  <MapaPasta mapa={mapa} meses={meses} raiz={raiz} total={caminhos!.length} caminhos={caminhos!} aberto={processando} lembrada={semArquivos} aoAbrirTrimestre={irPara}
                    processar={dados ? (processando ? recomecarProcessar : () => setProcessando(true)) : undefined} />
                )}
                {mapa && !ocupadoPasta && processando && dados && (
                  <div id={ID_PROCESSAR} className="scroll-mt-28">
                    <ProcessarTrimestre key={`${raiz}-${meses[0]}-${rodada}`} meses={meses} caminhos={caminhos!} arquivos={arquivos}
                      memoria={memoriaProcessar(raiz, meses[0])} retomar={retomar} semArquivos={semArquivos}
                      auditoria={dados.auditoria} cgf={dados.cgf} ret={dados.ret} concilia={dados.concilia} onGravado={aoGravarPasso} onFechar={fecharProcessar} />
                  </div>
                )}
              </div>

              <SubpassoRecolhivel id={ID_COMPARAR} titulo="Comparar com a planilha" passos="opcional, confere o passo 2" icone={<FileSpreadsheet size={16} />} abrirPorPadrao={false}>
                {!carregando && dados ? (
                  <CompararPlanilha key={`comparar-${meses[0]}`} meses={meses} caminhos={caminhos} arquivos={arquivos} auditoria={dados.auditoria}
                    aoIncluirNota={() => setVersao((v) => v + 1)} aoTrocarPlanilha={(f) => setPlanilhaEscolhida(escolherPlanilha(f, meses[0]))} />
                ) : (
                  <p className="px-2 py-3 text-sm text-zinc-400">Disponível quando a situação do trimestre carregar.</p>
                )}
              </SubpassoRecolhivel>
            </div>}

            {/* SR do trimestre: o Painel busca VP, VF, PR e SELIC, mostra onde diverge do gravado e só grava depois de confirmar */}
            {e.chave === "sr" && <div id={ID_SR} className="scroll-mt-28">
              <SRDoTrimestre key={`sr-${meses[0]}`} meses={meses} selic={dados?.situacao?.selic} onGravado={aoGravarPasso} />
            </div>}
            {/* PR e PV do trimestre do ciclo: o Painel já leu o cálculo e o gravado; o cartão só mostra e grava (com a janela). */}
            {e.chave === "pr" && <div id={ID_PR} className="scroll-mt-28">
              <PRDoTrimestre key={`pr-${meses[0]}`} apuracao={dados?.pr ?? null} prSalvo={dados?.prSalvo ?? null} meses={meses} mesesPR={mesesPR}
                carregando={carregando} onGravado={aoGravarPasso} />
            </div>}
            {e.chave === "pv" && <div id={ID_PV} className="scroll-mt-28">
              <PVDoTrimestre key={`pv-${meses[0]}`} pv={dados?.pv ?? null} meses={meses} mesesPR={mesesPR}
                carregando={carregando} onGravado={aoGravarPasso} />
            </div>}
            </section>
          ))}
        </div>

        {/* Ao fechar: sempre embaixo das opções (trilha e painel do passo). */}
        {aoFechar}
      </div>
    </div>
  );
}

// ── Esqueletos (enquanto carrega) ─────────────────────────────────────────────
// Imitam a forma do que vai aparecer, para a tela não "pular" quando os dados chegam.

/** Lugar da trilha: nove caixas na faixa, para a tela não "pular" quando os dados chegam. */
function EsqueletoEtapas() {
  return (
    <div role="status" className="grid grid-cols-3 divide-x divide-white/[0.05] lg:grid-cols-9">
      <span className="sr-only">Consultando os passos do trimestre…</span>
      {[0, 1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
        <div key={i} className="space-y-2 px-3 py-4">
          <Skeleton className="h-4 w-10" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-full" />
        </div>
      ))}
    </div>
  );
}
