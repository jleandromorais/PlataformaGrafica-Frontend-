import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import {
  AlertTriangle, CheckCircle2, ChevronLeft, ChevronRight, CircleDashed, FileArchive, FileText, FolderOpen,
} from "lucide-react";
import { ModalAviso, type VarianteAviso } from "../../components/ui/ModalAviso";
import { AreaSoltarPasta } from "../../components/ui/AreaSoltarPasta";
import { Alert } from "../../components/ui/Alert";
import { avisarAtencao, avisarSucesso, faixaDosMeses } from "../../components/ui/avisos";
import { avisoDaSoltura, lerPastaSolta, type Soltura } from "../../utils/soltarPasta";
import {
  apurarPR, buscarTrimestreSR, gerarMinutaNotaTecnica, gerarRelatorioTrimestral, getHistoricoAuditoria, getHistoricoCGF, getHistoricoConcilia,
  getHistoricoRET, getHistoricoSCG, getPR, getPVTrimestre,
} from "../../api";
import { mensagemDeErro } from "../../api/client";
import { brl, num } from "../../utils/format";
import { salvarArquivo } from "../../utils/download";
import { NOMES_ETAPA, mapaDoTrimestre, type CelulaMapa, type Etapa, type Situacao } from "../../utils/pastaCiclo";
import { mesesDoPRDoCivil } from "../../utils/periodos";
import { ProcessarTrimestre, type Retomada } from "./Processar";
import { AuditarMes } from "./AuditarMes";
import { CompararPlanilha } from "./CompararPlanilha";
import { SRDoTrimestre } from "./SRDoTrimestre";
import { linkDoCiclo, useManterPeriodoNaUrl, usePeriodoDaUrl } from "../../utils/periodoNaUrl";
import { esquecer, guardar, lembrar } from "../../utils/lembrar";
import { reabrirPasta, type ArquivoDaPastaCiclo, type ChavePasta, type PastaLida } from "../../utils/pasta";
import { ehZip, lerZipDaPasta } from "../../utils/zipCiclo";
import { Skeleton } from "../../components/ui/Skeleton";
import { EsqueletoLista } from "../../components/ui/EsqueletoLista";
import type {
  AuditoriaHistoricoLinha, CGFHistoricoLinha, ConciliaHistoricoLinha, PRApuracao, PVTrimestre, RETHistoricoLinha,
  SCGHistoricoLinha,
} from "../../types";
import { PageHeader } from "../../components/layout/PageHeader";

const PANEL = "rounded-xl border border-white/[0.07] bg-panel";

// O que o Painel guarda no navegador (utils/lembrar) para sobreviver a recarregar a página.
const MEMORIA_PASTA = "ciclo:pasta";
const memoriaProcessar = (raiz: string, inicio: string) => `ciclo:processar:${raiz}:${inicio}`;
/** Nomes dos arquivos (o mapa só usa os nomes) e, no Chrome/Edge, a chave para reler a pasta. */
interface PastaGuardada { raiz: string; caminhos: string[]; chave?: ChavePasta }
const MESES = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
const TRIMESTRES = ["Jan – Mar", "Abr – Jun", "Jul – Set", "Out – Dez"];
const FISCAIS: Record<string, string> = { Nov: "Nov - Jan", Fev: "Fev - Abr", Mai: "Mai - Jul", Ago: "Ago - Out" };

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
}

async function carregar(meses: string[], mesesPR: string[]): Promise<Dados> {
  const label = FISCAIS[mesesPR[0].split("/")[0]];
  const vazio = <T,>(p: Promise<T>, padrao: T) => p.catch(() => padrao);
  const [auditoria, cgf, ret, concilia, scg, srSalvo, pr, prSalvo, pv] = await Promise.all([
    getHistoricoAuditoria(), getHistoricoCGF(), getHistoricoRET(), getHistoricoConcilia(), getHistoricoSCG(),
    vazio(buscarTrimestreSR(`${meses[0]}_${meses[2]}`), []),
    vazio<PRApuracao | null>(apurarPR(mesesPR), null),
    vazio<number | null>(getPR(`${label}/${mesesPR[2].split("/")[1]}`).then((r) => r.pr), null),
    vazio<PVTrimestre | null>(getPVTrimestre(label, Number(mesesPR[0].split("/")[1])), null),
  ]);
  return { auditoria, cgf, ret, concilia, scg, srSalvo, pr, prSalvo, pv };
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
  titulo: string;
  descricao: string;
  situacao: Situacao;
  detalhe: ReactNode;
  link: string; // tela da etapa já no período certo (S2)
  extra?: ReactNode; // ação dentro do cartão (ex.: "Auditar <mês>" na Auditoria CGR)
}

function porMes<T extends { periodo: string }>(lista: T[], meses: string[], valor: (l: T) => string,
  alerta?: (l: T) => string | null, linkDoMes?: (m: string) => string,
): { situacao: Situacao; detalhe: ReactNode; pendente?: string } {
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
function etapaMensal<T extends { periodo: string }>(titulo: string, descricao: string, rota: string, lista: T[],
  meses: string[], valor: (l: T) => string, alerta?: (l: T) => string | null): Etapa_ {
  const linkDoMes = (m: string) => linkDoCiclo(rota, meses[0], { chave: "periodo", valor: m });
  const { pendente, ...resto } = porMes(lista, meses, valor, alerta, linkDoMes);
  return { titulo, descricao, ...resto, link: linkDoMes(pendente ?? meses[0]) };
}

function etapas(d: Dados, meses: string[], mesesPR: string[], auditarMes: ReactNode): Etapa_[] {
  const faixaPR = `${mesesPR[0]} a ${mesesPR[2]}`;
  const srTotal = d.srSalvo.reduce((s, l) => s + Number(l.sr_selic ?? 0), 0);
  const prDifere = d.pr && d.prSalvo !== null && Math.abs(d.prSalvo - d.pr.pr) > 1e-9;
  const pvDifere = d.pv?.salvo && Math.abs(d.pv.salvo.pv - d.pv.pv) > 1e-9;
  const trimestrePR = { chave: "trimestre" as const, valor: mesesPR[0] };
  return [
    { ...etapaMensal("Auditoria CGR", "NF de compra de gás e CT-e da TAG de cada mês", "/auditoria", d.auditoria, meses,
      (l) => brl(l.cgr_gravado)), extra: auditarMes },
    etapaMensal("CGF — Volume Faturado", "Planilhas de NF faturadas, canceladas e devolvidas", "/cgf", d.cgf, meses,
      (l) => brl(l.cgf_rs), (l) => (l.volume_devolucoes ? null : "Devoluções = 0: confira se a planilha de devoluções entrou.")),
    // RET não tem seletor de mês: o período vem dos próprios arquivos.
    { titulo: "RET — Encargos de transporte", descricao: "NDs e faturas de transporte (EAT + EC)", link: linkDoCiclo("/ret", meses[0]),
      ...porMes(d.ret, meses, (l) => brl(l.ret_gravado)) },
    etapaMensal("RP — Conciliação de penalidades", "Receitas (inclui TOP) e despesas de penalidade", "/conciliacao", d.concilia,
      meses, (l) => brl(l.rp_gravado),
      (l) => (Math.abs(l.rp_dos_itens - l.rp_gravado) > 1 ? "O RP gravado difere da soma dos itens." : null)),
    etapaMensal("SCG — Saldo da Conta Gráfica", "SCG = RPV + RET + RP, por mês", "/scg", d.scg, meses,
      (l) => brl(l.scg), (l) => (l.diverge ? "Os módulos e o valor gravado não batem." : null)),
    {
      titulo: "SR — Saldo Remanescente", descricao: "Quadro 6 do trimestre, com SELIC",
      link: linkDoCiclo("/sr", meses[0], { chave: "trimestre", valor: meses[0] }),
      situacao: d.srSalvo.length ? "ok" : "falta",
      detalhe: d.srSalvo.length ? <span>Salvo · total {brl(srTotal)}</span> : <span>Ainda não salvo para este trimestre.</span>,
    },
    {
      titulo: `PR — Parcela de Recuperação de ${faixaPR}`, descricao: "Quadro 7: (SCG + SR com SELIC) ÷ VP",
      link: linkDoCiclo("/pr", meses[0], trimestrePR),
      situacao: !d.pr || d.pr.pendencias.length ? "falta" : prDifere || d.prSalvo === null ? "atencao" : "ok",
      detalhe: !d.pr ? <span>Não consegui calcular agora: abra a tela PR para ver o motivo.</span> : d.pr.pendencias.length ? (
        <span>{d.pr.pendencias.join(" ")}</span>
      ) : (
        <span>Calculado {num(d.pr.pr, 4)} · {d.prSalvo === null ? "ainda não salvo" : prDifere ? `salvo ${num(d.prSalvo, 4)} (diferente — salve de novo)` : "salvo"}</span>
      ),
    },
    {
      titulo: `PV — Preço de Venda de ${faixaPR}`, descricao: "Quadro 8: PMPV + PR",
      link: linkDoCiclo("/pv", meses[0], trimestrePR),
      situacao: !d.pv ? "falta" : !d.pv.salvo || pvDifere ? "atencao" : "ok",
      detalhe: !d.pv ? <span>Não consegui consultar agora: abra a tela PV para ver o motivo.</span> : (
        <span>Atual {num(d.pv.pv, 4)} · {!d.pv.salvo ? "ainda não salvo" : pvDifere ? `salvo ${num(d.pv.salvo.pv, 4)} (diferente — salve de novo)` : "salvo"}</span>
      ),
    },
  ];
}

const ICONE: Record<Situacao, ReactNode> = {
  ok: <CheckCircle2 size={18} className="text-emerald-400" aria-label="Pronto" />,
  atencao: <AlertTriangle size={18} className="text-amber-300" aria-label="Precisa de atenção" />,
  falta: <CircleDashed size={18} className="text-zinc-500" aria-label="Falta" />,
};

// ── Página ────────────────────────────────────────────────────────────────────

export default function CicloPage() {
  const hoje = new Date();
  // "Voltar ao Painel" das telas reabre o mesmo trimestre (?trimestre=Abr/2026, 1º mês).
  const daUrl = usePeriodoDaUrl("trimestre");
  const inicio = daUrl && daUrl.mes % 3 === 0 ? daUrl : null;
  const [ano, setAno] = useState(inicio?.ano ?? hoje.getFullYear());
  const [tri, setTri] = useState(inicio ? inicio.mes / 3 : Math.max(0, Math.floor(hoje.getMonth() / 3) - 1));
  const meses = useMemo(() => [0, 1, 2].map((i) => `${MESES[tri * 3 + i]}/${ano}`), [ano, tri]);
  const mesesPR = useMemo(() => mesesDoPRDoCivil(meses[2]), [meses]);
  useManterPeriodoNaUrl("trimestre", meses[0]);

  const [dados, setDados] = useState<Dados | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
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

  const irPara = (novoAno: number, novoTri: number) => {
    setCarregando(true);
    setProcessando(false);
    setAno(novoAno);
    setTri(novoTri);
  };

  const lista = dados ? etapas(dados, meses, mesesPR,
    <AuditarMes key={meses[0]} meses={meses} auditoria={dados.auditoria} onGravado={() => setVersao((v) => v + 1)} />) : [];
  const prontas = lista.filter((e) => e.situacao === "ok").length;
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
      setErro(mensagemDeErro(e, "Não foi possível gerar a minuta da Nota Técnica."));
    } finally {
      setGerandoNT(false);
    }
  };

  // Word do trimestre: resultado dos meses e o que não confere (provas reais). Não grava nada.
  const gerarRelatorio = async () => {
    setGerandoRel(true);
    try {
      salvarArquivo(await gerarRelatorioTrimestral(meses[2]),
        `Relatorio_Trimestral_${meses[0].replace("/", "-")}_a_${meses[2].replace("/", "-")}.docx`);
    } catch (e) {
      setErro(mensagemDeErro(e, "Não foi possível gerar o relatório do trimestre."));
    } finally {
      setGerandoRel(false);
    }
  };

  return (
    <div className="px-4 py-6 sm:px-8 lg:px-10 lg:py-8">
      <div className="mx-auto flex max-w-[1100px] flex-col gap-6">
        <PageHeader modulo="ciclo" />

        {erro && <Alert variant="error">{erro}</Alert>}

        <section className={`${PANEL} flex flex-wrap items-center gap-4 p-5 sm:p-6`}>
          <div className="flex items-center gap-1">
            <button type="button" aria-label="Ano anterior" onClick={() => irPara(ano - 1, tri)}
              className="rounded-md p-1.5 text-zinc-400 hover:bg-white/[0.05] hover:text-white"><ChevronLeft size={16} /></button>
            <span className="w-14 text-center text-lg font-semibold tabular-nums text-white">{ano}</span>
            <button type="button" aria-label="Próximo ano" onClick={() => irPara(ano + 1, tri)}
              className="rounded-md p-1.5 text-zinc-400 hover:bg-white/[0.05] hover:text-white"><ChevronRight size={16} /></button>
          </div>
          <div role="radiogroup" aria-label="Trimestre apurado" className="flex flex-wrap gap-1 rounded-lg bg-white/[0.03] p-1">
            {TRIMESTRES.map((t, i) => (
              <button key={t} type="button" role="radio" aria-checked={tri === i} onClick={() => irPara(ano, i)}
                className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                  tri === i ? "bg-sky-500/20 text-sky-200" : "text-zinc-400 hover:text-zinc-100"}`}>{t}</button>
            ))}
          </div>
          <p className="w-full text-sm text-zinc-400">
            Apura <b className="text-zinc-200">{meses[0]} a {meses[2]}</b> → define o PR e o PV de{" "}
            <b className="text-zinc-200">{mesesPR[0]} a {mesesPR[2]}</b>
            {dados && !carregando && <span className="ml-2 text-zinc-500">· {prontas} de {lista.length} etapas prontas</span>}
          </p>
          {dados && (
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/[0.05]" aria-hidden>
              <div className="h-full rounded-full bg-emerald-400/70 transition-all" style={{ width: `${(prontas / lista.length) * 100}%` }} />
            </div>
          )}
        </section>

        {/* Importar da pasta (o id deixa o "Comparar com a planilha" rolar a página até aqui) */}
        <section id="importar-pasta" className={`${PANEL} scroll-mt-4 p-5 sm:p-6`}>
          <h2 className="flex items-center gap-2 text-base font-semibold text-white"><FolderOpen size={16} /> Importar da pasta do ciclo</h2>
          <p className="mt-1 max-w-2xl text-sm text-zinc-400">
            Traga a pasta onde ficam as notas do ano (ex.: <b>{nomePasta}</b>). O sistema lê <b>só os nomes</b> dos arquivos,
            sem enviar nada, e mostra o que encontrou para cada etapa de {meses[0]} a {meses[2]}.
          </p>
          <div className="mt-4">
            <AreaSoltarPasta texto={`Arraste aqui a pasta ${nomePasta} (ou outra do ano)`} onSoltar={soltar} desabilitado={ocupadoPasta}>
              {/* Sem "Escolher a pasta" de propósito: o seletor de pasta do sistema faz o Chrome abrir
                  o aviso "Quer carregar N ficheiros para este site?", que nenhum site consegue esconder
                  nem estilizar. Arrastar ou usar o .zip não dispara esse aviso. */}
              <button ref={botaoZip} type="button" onClick={() => inputZip.current?.click()} disabled={ocupadoPasta}
                className="flex items-center gap-2 rounded-xl border border-sky-500/40 px-4 py-2 text-sm font-semibold text-sky-200 hover:bg-sky-500/10 disabled:opacity-50">
                <FileArchive size={16} aria-hidden /> ou escolha o .zip da pasta
              </button>
              <input ref={inputZip} type="file" accept=".zip,application/zip" className="hidden" tabIndex={-1} aria-hidden
                onChange={(e) => { escolherZip(e.target.files?.[0]); e.target.value = ""; }} />
              <p className="text-xs text-zinc-500">Assim o Chrome não precisa pedir permissão.</p>
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
          {semArquivos && !ocupadoPasta && (
            <p className="mt-4 rounded-lg bg-amber-400/[0.06] px-4 py-3 text-sm text-amber-200">
              Lembrei a pasta <b>{raiz}</b> da última vez e o mapa abaixo é dela. Para processar, traga a pasta de novo
              (arrastando, escolhendo a pasta ou o .zip): o navegador não guarda os arquivos depois de recarregar a página.
            </p>
          )}
          {mapa && !ocupadoPasta && (
            <MapaPasta mapa={mapa} meses={meses} raiz={raiz} total={caminhos!.length} aberto={processando}
              processar={dados ? (processando ? recomecarProcessar : () => setProcessando(true)) : undefined} />
          )}
          {mapa && !ocupadoPasta && processando && dados && (
            <ProcessarTrimestre key={`${raiz}-${meses[0]}-${rodada}`} meses={meses} caminhos={caminhos!} arquivos={arquivos}
              memoria={memoriaProcessar(raiz, meses[0])} retomar={retomar} semArquivos={semArquivos}
              auditoria={dados.auditoria} cgf={dados.cgf} ret={dados.ret} concilia={dados.concilia} onGravado={() => setVersao((v) => v + 1)} onFechar={fecharProcessar} />
          )}
        </section>

        {/* SR do trimestre: o Painel busca VP, VF, PR e SELIC, mostra onde diverge do gravado e só grava depois de confirmar */}
        {/* Chaves com prefixo: SR e Comparar são irmãos; a mesma chave nos dois fazia o React duplicar o card do SR. */}
        <SRDoTrimestre key={`sr-${meses[0]}`} meses={meses} onGravado={() => setVersao((v) => v + 1)} />

        {/* Comparar o CGR de um mês contra a planilha (opcional, não grava), acima das etapas */}
        {!carregando && dados && (
          <CompararPlanilha key={`comparar-${meses[0]}`} meses={meses} caminhos={caminhos} arquivos={arquivos} auditoria={dados.auditoria}
            aoIncluirNota={() => setVersao((v) => v + 1)} />
        )}

        {/* Etapas */}
        <section className={`${PANEL} overflow-hidden`}>
          <h2 className="border-b border-white/[0.07] px-5 py-4 text-base font-semibold text-white">Etapas do ciclo</h2>
          {carregando ? (
            <EsqueletoEtapas />
          ) : (
            <ol className="divide-y divide-white/[0.05]">
              {lista.map((e, i) => (
                <li key={e.titulo} className="flex flex-wrap items-start gap-4 px-5 py-4">
                  <span className="mt-0.5 flex items-center gap-3">
                    <span className="w-5 text-right text-xs tabular-nums text-zinc-500">{i + 1}</span>
                    {ICONE[e.situacao]}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-zinc-100">{e.titulo}</p>
                    <p className="text-xs text-zinc-500">{e.descricao}</p>
                    <div className="mt-2 text-sm text-zinc-300">{e.detalhe}</div>
                    {e.extra}
                  </div>
                  <Link to={e.link}
                    className={`rounded-lg px-3 py-1.5 text-sm font-medium ${e.situacao === "ok"
                      ? "text-zinc-400 hover:text-white" : "bg-sky-500/15 text-sky-200 hover:bg-sky-500/25"}`}>
                    {e.situacao === "ok" ? "Ver" : "Fazer agora"}
                  </Link>
                </li>
              ))}
              <li className="flex flex-wrap items-center gap-4 px-5 py-4">
                <span className="mt-0.5 flex items-center gap-3">
                  <span className="w-5 text-right text-xs tabular-nums text-zinc-500">{lista.length + 1}</span>
                  <FileText size={18} className="text-sky-300" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-zinc-100">Entregas</p>
                  <p className="text-xs text-zinc-500">Minuta da Nota Técnica, relatório do trimestre e Excel Final do ciclo</p>
                </div>
                <button type="button" onClick={gerarNT} disabled={gerandoNT}
                  className="rounded-lg bg-sky-500/15 px-3 py-1.5 text-sm font-medium text-sky-200 hover:bg-sky-500/25 disabled:opacity-50">
                  {gerandoNT ? "Gerando…" : "Baixar minuta da NT"}
                </button>
                <button type="button" onClick={gerarRelatorio} disabled={gerandoRel}
                  className="rounded-lg bg-sky-500/15 px-3 py-1.5 text-sm font-medium text-sky-200 hover:bg-sky-500/25 disabled:opacity-50">
                  {gerandoRel ? "Gerando…" : "Baixar relatório do trimestre"}
                </button>
                <Link to="/excel-final" className="rounded-lg px-3 py-1.5 text-sm font-medium text-zinc-400 hover:text-white">Excel Final</Link>
              </li>
            </ol>
          )}
        </section>
      </div>
    </div>
  );
}

// ── Esqueletos (enquanto carrega) ─────────────────────────────────────────────
// Imitam a forma do que vai aparecer, para a tela não "pular" quando os dados chegam.

/** Lugar das etapas: número, ícone, título, descrição e os valores de cada mês. */
function EsqueletoEtapas() {
  return (
    <div role="status" className="divide-y divide-white/[0.05]">
      <span className="sr-only">Consultando as etapas do ciclo…</span>
      {[0, 1, 2, 3, 4].map((i) => (
        <div key={i} className="flex items-start gap-4 px-5 py-4">
          <Skeleton className="mt-0.5 ml-8 h-[18px] w-[18px] rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-2/5" />
            <Skeleton className="h-3 w-3/5" />
            <div className="flex flex-wrap gap-2 pt-1">
              <Skeleton className="h-7 w-44" />
              <Skeleton className="h-7 w-44" />
              <Skeleton className="h-7 w-44" />
            </div>
          </div>
          <Skeleton className="h-7 w-12" />
        </div>
      ))}
    </div>
  );
}

// ── Mapa da pasta ─────────────────────────────────────────────────────────────

function MapaPasta({ mapa, meses, raiz, total, processar, aberto }: {
  mapa: ReturnType<typeof mapaDoTrimestre>; meses: string[]; raiz: string; total: number;
  processar?: () => void; // ausente: Painel ainda carregando
  aberto: boolean;        // Processar já aberto abaixo: o botão vira "Recomeçar"
}) {
  const [aberta, setAberta] = useState<CelulaMapa | null>(null);
  const etapasMapa: Etapa[] = ["auditoria", "cgf", "ret", "conciliacao"];
  const celula = (e: Etapa, m: string) => mapa.celulas.find((c) => c.etapa === e && c.periodo === m)!;
  const problemas = mapa.celulas.filter((c) => c.situacao !== "ok").length;
  return (
    <div className="mt-5">
      <p className="text-sm text-zinc-400">
        <b className="text-zinc-200">{raiz}</b>: {num(total)} arquivos lidos ·{" "}
        {problemas ? <span className="text-amber-200">{problemas} ponto(s) para conferir</span> : <span className="text-emerald-300">tudo encontrado</span>}
        {" "}· {num(mapa.ignorados)} de outros meses ignorados
      </p>
      {mapa.semMes.length > 0 && (
        <p className="mt-1 text-sm text-amber-200">
          ⚠ {mapa.semMes.length === 1 ? "Esta pasta não tem" : "Estas pastas não têm"} o mês no nome e não foram usadas:{" "}
          {mapa.semMes.map((p) => `“${p.split("/").pop()}”`).join(", ")}. Renomeie com mês e ano (ex.: “09 set-26 NFs”).
        </p>
      )}
      <div className="mt-3 overflow-x-auto">
        <table className="w-full min-w-[36rem] text-sm">
          <thead className="bg-white/[0.03] text-[0.7rem] text-zinc-400">
            <tr>
              <th className="px-4 py-2.5 text-left font-semibold">Etapa</th>
              {meses.map((m) => <th key={m} className="px-3 py-2.5 text-left font-semibold">{m}</th>)}
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.05]">
            {etapasMapa.map((e) => (
              <tr key={e}>
                <td className="px-4 py-2.5 text-zinc-200">{NOMES_ETAPA[e]}</td>
                {meses.map((m) => {
                  const c = celula(e, m);
                  return (
                    <td key={m} className="px-3 py-2">
                      <button type="button" onClick={() => setAberta(aberta === c ? null : c)}
                        className={`flex items-center gap-1.5 rounded-md px-2 py-1 text-left ${aberta === c ? "bg-white/[0.06]" : "hover:bg-white/[0.04]"}`}>
                        {ICONE[c.situacao]}
                        <span className={c.situacao === "falta" ? "text-zinc-500" : "text-zinc-200"}>
                          {c.situacao === "falta" ? "não achei" : `${num(c.arquivos)} arquivo(s)`}
                        </span>
                      </button>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {aberta && (
        <div className="mt-3 rounded-xl border border-white/[0.07] bg-white/[0.02] p-4 text-sm">
          <p className="font-semibold text-zinc-100">{NOMES_ETAPA[aberta.etapa]} · {aberta.periodo}</p>
          {aberta.conjuntos.length > 0 && (
            <ul className="mt-2 space-y-0.5 text-xs text-zinc-400">
              {aberta.conjuntos.map((c) => <li key={c} className="break-all">📁 {c || "(direto na pasta escolhida)"}</li>)}
            </ul>
          )}
          {aberta.avisos.map((a) => <p key={a} className="mt-2 text-amber-200">⚠ {a}</p>)}
          {aberta.notas.map((a) => <p key={a} className="mt-2 text-zinc-500">{a}</p>)}
          {aberta.situacao === "falta" && (
            <p className="mt-2 text-zinc-400">Não encontrei arquivos desta etapa para {aberta.periodo}. Confira se a pasta do mês existe e tem os arquivos.</p>
          )}
        </div>
      )}
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <button type="button" disabled={!processar} onClick={processar}
          className="rounded-xl bg-marinho px-5 py-2.5 text-sm font-semibold text-paper disabled:opacity-50">
          {aberto ? "Recomeçar o Processar" : `Processar ${meses[0]} a ${meses[2]}`}
        </button>
        <span className="text-xs text-zinc-500">
          Envia estes arquivos para cada etapa, mostra o resultado e só grava o que você confirmar. Auditoria, CGF, RET e RP.
        </span>
      </div>
    </div>
  );
}
