/** Painel do Ciclo, logo depois da pasta e antes do SR: "Comparar com a planilha" (opcional), igual à tela da Auditoria do
 * CGR. O analista escolhe a planilha da Conta Gráfica (.xlsx) e o mês do trimestre; o sistema
 * audita as notas desse mês e mostra a comparação (CGR, empresas, notas que faltam ou diferem).
 * As notas vêm SEMPRE da pasta do ciclo trazida lá em cima, em "Importar da pasta do ciclo";
 * sem ela, a seção só avisa e leva o usuário até lá (a pasta é escolhida num lugar só).
 * A comparação não grava nada; só o botão "Incluir esta nota" (nota só na planilha) grava. */

// ── Importações: peças prontas que este arquivo usa ───────────────────────────
// React: useMemo guarda uma conta pronta (só refaz se algo mudar); useRef aponta para um
// elemento da tela (aqui, o campo escondido de escolher a planilha); useState é a "memória" da tela.
import { useMemo, useRef, useState } from "react";
import { FileSpreadsheet, FolderOpen, Loader2, Play, X } from "lucide-react"; // ícones
import type { ArquivoDaPasta } from "../../api";
import { mensagemDeErro } from "../../api/client"; // transforma um erro técnico em frase para o usuário
import { Button } from "../../components/ui/Button";
import { EsqueletoLista } from "../../components/ui/EsqueletoLista"; // as barrinhas cinza de "carregando"
import { brl, num } from "../../utils/format"; // brl = "R$ 1.000,00"; num = número com separador de milhar
import { abrirArquivo, carregarNaMemoria, type ArquivoDaPastaCiclo } from "../../utils/pasta";
import { arquivosDaCelula, classificar, envioDaAuditoria } from "../../utils/pastaCiclo";
import type { AuditoriaHistoricoLinha } from "../../types";
import { ComparacaoPlanilha } from "../Auditoria/ComparacaoPlanilha"; // o quadro de resultado, o mesmo da tela da Auditoria
import { TOL, parearMesmoValor, resumoDaComparacao, separarAvisos } from "../Auditoria/comparacaoResumo";
import { avisarAtencao, avisarSucesso } from "../../components/ui/avisos"; // avisos no canto da tela (toast)
import { auditarMes, type AuditoriaDoMes } from "./auditoriaDoMes"; // a função que fala com o servidor

// Classes de estilo do "cartão" da seção (borda fina e fundo do painel), as mesmas do resto do Painel.
const PANEL = "rounded-xl border border-white/[0.07] bg-panel";

// Em que momento a seção está. Só um deles vale de cada vez:
//   escolher     -> o usuário ainda está escolhendo planilha e mês
//   lendo        -> o navegador está lendo os arquivos do disco
//   processando  -> o servidor está auditando e comparando
//   resultado    -> deu certo, mostra o quadro de comparação
//   erro         -> deu errado, mostra o motivo
type Fase = "escolher" | "lendo" | "processando" | "resultado" | "erro";

// "Set/2026" -> "Set". Usado nos botões ("Comparar Set").
const mesCurto = (periodo: string) => periodo.split("/")[0];

// Rola a página até a seção "Importar da pasta do ciclo" (o id fica no index.tsx do Painel).
const irParaImportar = () =>
  document.getElementById("importar-pasta")?.scrollIntoView({ behavior: "smooth", block: "start" });

// Aviso no canto quando a comparação termina. Usa o mesmo resumo do quadro de resultado
// (resumoDaComparacao), para o aviso e o quadro nunca discordarem.
function avisarResultado(mes: string, r: AuditoriaDoMes) {
  const c = r.comparacao;
  if (!c) return; // planilha ilegível ou sem aba do mês: o motivo já aparece na tela
  const { veredito } = separarAvisos(c.avisos);
  const resumo = resumoDaComparacao(c, parearMesmoValor(c.notas_apenas_auditoria, c.notas_apenas_planilha), veredito);
  if (resumo.confere) { avisarSucesso(`${mes} confere com a planilha`); return; }
  // Diferença do CGR: notas menos a 1ª fonte da planilha (a mesma conta da frase do quadro).
  const ref = (c.fontes_cgr ?? []).find((f) => f.valor !== null)?.valor ?? null;
  const dif = ref !== null ? (c.cgr_auditoria ?? 0) - ref : 0;
  avisarAtencao(`${mes}: ${resumo.itens.length} ${resumo.itens.length === 1 ? "ponto" : "pontos"} para conferir`,
    Math.abs(dif) > TOL ? `As notas somam ${brl(Math.abs(dif))} a ${dif < 0 ? "menos" : "mais"} que a planilha. Nada foi gravado.` : "O total confere, mas há notas para olhar. Nada foi gravado.");
}

// O que o Painel entrega a esta seção (as "props"):
//   meses     -> os 3 meses do trimestre aberto, ex.: ["Jul/2026", "Ago/2026", "Set/2026"]
//   caminhos  -> os NOMES dos arquivos da pasta do ciclo (ou null se nenhuma foi trazida)
//   arquivos  -> os arquivos de verdade, abertos no navegador (vazio depois de recarregar a página)
//   auditoria -> o CGR já gravado de cada mês, só para mostrar ao lado do calculado
export function CompararPlanilha({ meses, caminhos, arquivos, auditoria, aoIncluirNota }: {
  meses: string[];
  caminhos: string[] | null;
  arquivos: Map<string, ArquivoDaPastaCiclo>;
  auditoria: AuditoriaHistoricoLinha[];
  /** Depois de "Incluir esta nota": o Painel recarrega as etapas (o CGR gravado do mês mudou). */
  aoIncluirNota?: () => void;
}) {
  // ── A memória da seção (cada useState guarda um valor e uma função para trocá-lo) ──
  const [planilha, setPlanilha] = useState<File | null>(null);     // a planilha escolhida
  const [ativo, setAtivo] = useState<string | null>(null);         // o mês escolhido, ex.: "Ago/2026"
  const [fase, setFase] = useState<Fase>("escolher");              // em que momento estamos
  const [lidos, setLidos] = useState<{ feitos: number; total: number } | null>(null); // progresso "12 de 90"
  const [res, setRes] = useState<AuditoriaDoMes | null>(null);     // a resposta do servidor
  const [erro, setErro] = useState<string | null>(null);           // a frase de erro, se houver
  // Referência ao campo <input type="file"> escondido: o botão bonito "clica" nele por baixo dos panos.
  const inputPlanilha = useRef<HTMLInputElement>(null);

  // O ano do trimestre ("2026"), para completar nomes de pasta que vêm sem ano.
  const ano = Number(meses[0].split("/")[1]);
  // Entende o que cada arquivo da pasta do ciclo é (auditoria? CGF? de que mês?).
  // useMemo: só refaz essa classificação se a pasta ou o ano mudarem.
  const reconhecidos = useMemo(
    () => (caminhos ?? []).map((c) => classificar(c, ano)).filter((x): x is NonNullable<ReturnType<typeof classificar>> => !!x),
    [caminhos, ano],
  );

  // As notas de Auditoria DESTE mês que a pasta do ciclo lista (pelos nomes).
  const doMes = useMemo(() => {
    if (!ativo) return [];
    const { pastas, zipsSoltos } = arquivosDaCelula(reconhecidos, "auditoria", ativo);
    return [...pastas, ...zipsSoltos];
  }, [ativo, reconhecidos]);
  // Só valem se os arquivos estão abertos no navegador (o usuário arrastou a pasta nesta visita).
  // Depois de recarregar a página o navegador guarda só os nomes, e aí esta lista fica vazia.
  const doCiclo = useMemo(
    () => (doMes.length && doMes.every((a) => arquivos.has(a.caminho)) ? doMes : []),
    [doMes, arquivos],
  );

  // ── Valores derivados (contas simples em cima da memória) ──
  const ocupado = fase === "lendo" || fase === "processando";   // há trabalho em andamento: trava os botões
  const cgrGravado = ativo ? auditoria.find((h) => h.periodo === ativo)?.cgr_gravado ?? null : null; // CGR salvo do mês
  // O botão "Comparar" só liga com planilha, mês e as notas do mês abertas na pasta do ciclo.
  const pronto = !!planilha && !!ativo && doCiclo.length > 0 && !ocupado;

  // Sem notas para comparar: por quê? Cada caso pede uma frase diferente ao usuário.
  const semNotas = !ativo || doCiclo.length ? null
    : !caminhos?.length
      ? `Para comparar ${ativo}, traga a pasta do ciclo lá em cima, em Importar da pasta do ciclo (arraste a pasta ou escolha o .zip).`
      // A pasta tem as notas do mês, mas os arquivos não estão abertos: a página foi recarregada.
      : doMes.length
        ? "Recarregou a página: arraste a pasta de novo lá em cima, em Importar da pasta do ciclo (o navegador não guarda os arquivos)."
        : `A pasta do ciclo não tem notas de Auditoria de ${ativo}. Confira a pasta e traga-a de novo lá em cima, em Importar da pasta do ciclo.`;

  // Volta ao começo da escolha (descarta resultado e erro).
  const zerar = () => { setFase("escolher"); setRes(null); setErro(null); setLidos(null); };
  // Clicar num mês abre aquele mês; clicar de novo no mesmo fecha. Trocar de mês descarta o que havia.
  const abrirMes = (m: string) => { zerar(); setAtivo(ativo === m ? null : m); };

  // O botão "Comparar": o coração da seção. Passo a passo:
  const comparar = async () => {
    if (!planilha || !ativo || !pronto) return; // trava de segurança (o botão já fica desligado)
    setErro(null);
    setFase("lendo");
    try {
      // 1) Abre do disco só os arquivos deste mês (a pasta do ciclo só tinha listado os nomes).
      const enviar: ArquivoDaPasta[] = await Promise.all(
        doCiclo.map(async (a) => ({ arquivo: await abrirArquivo(arquivos.get(a.caminho)!), caminho: envioDaAuditoria(a).caminho })),
      );
      const raiz = envioDaAuditoria(doCiclo[0]).raiz;
      // 2) Copia tudo para a memória do navegador antes de enviar. Pasta em rede/OneDrive pode
      //    falhar no meio do envio; aqui, se falhar, o erro diz QUAL arquivo e o que fazer.
      const memoria = await carregarNaMemoria(enviar, (feitos, total) => setLidos({ feitos, total }));
      setFase("processando");
      // 3) Manda para o servidor auditar e comparar com a planilha.
      //    O null no 4º lugar quer dizer "não compare com o valor gravado no banco": aqui o gabarito é só a planilha.
      const r = await auditarMes(memoria, raiz, ativo, null, false, planilha);
      // 4) Confere a resposta. Erro de leitura ou pasta de OUTRO mês: não mostra comparação.
      if (r.erros.length) {
        setErro(`O servidor não conseguiu auditar ${ativo}: ${r.erros.join(" ")}`);
        setFase("erro");
      } else if (r.outroMes) {
        setErro(`O nome da pasta “${raiz}” indica ${r.outroMes}, não ${ativo}. Confira a pasta do ciclo trazida lá em cima.`);
        setFase("erro");
      } else {
        setRes(r);
        setFase("resultado");
        avisarResultado(ativo, r);
      }
    } catch (e) {
      // Falha ao ler o arquivo no disco já vem com frase pronta (Error comum); falha da API passa por mensagemDeErro.
      setErro(e instanceof Error && !("isAxiosError" in e) ? e.message : mensagemDeErro(e, `Não foi possível comparar ${ativo}`));
      setFase("erro");
    }
  };

  // CGR líquido que o sistema calculou a partir das notas (null enquanto não há resultado).
  const total = res?.r.totais.cgr_liquido ?? null;

  // ── O que aparece na tela (JSX: parece HTML, mas é JavaScript) ──
  return (
    <section className={`${PANEL} p-5 sm:p-6`} aria-labelledby="comparar-planilha-titulo">
      <h2 id="comparar-planilha-titulo" className="flex items-center gap-2 text-base font-semibold text-white">
        <FileSpreadsheet size={16} /> Comparar com a planilha <span className="text-xs font-normal text-zinc-500">(opcional)</span>
      </h2>
      <p className="mt-1 max-w-2xl text-sm text-zinc-400">
        Antes de seguir para o SR, confira o CGR de um mês contra a planilha da Conta Gráfica, igual à tela da Auditoria. As notas do mês
        {" "}vêm da pasta do ciclo trazida lá em cima, são lidas de novo e comparadas com a planilha; a comparação
        {" "}<b className="text-zinc-200">não grava nada</b>. Só o botão
        {" "}<b className="text-zinc-200">Incluir esta nota</b> (nota que está só na planilha) grava a nota no CGR do mês.
      </p>

      <div className="mt-4 space-y-4">
        {/* PASSO 1 — a planilha. O <input> de arquivo fica escondido; o botão bonito clica nele. */}
        <div>
          <p className="mb-2 text-xs font-medium text-zinc-500">1. Planilha da Conta Gráfica</p>
          <input ref={inputPlanilha} type="file" accept=".xlsx,.xls" className="hidden" tabIndex={-1} aria-hidden
            // Trocou a planilha: o resultado antigo não vale mais. e.target.value = "" deixa escolher o mesmo arquivo de novo.
            onChange={(e) => {
              const f = e.target.files?.[0] ?? null;
              setPlanilha(f); setRes(null); if (fase === "resultado") setFase("escolher"); e.target.value = "";
              if (f) avisarSucesso("Planilha carregada", f.name); // aviso no canto: o arquivo entrou
            }} />
          {planilha ? (
            // Já escolheu: mostra o nome do arquivo e um X para remover.
            <div className="flex max-w-md items-center gap-2 rounded-lg border border-white/[0.05] bg-white/[0.015] px-3 py-2 text-sm">
              <FileSpreadsheet size={14} className="text-emerald-400" aria-hidden />
              <span className="min-w-0 flex-1 truncate text-zinc-200">{planilha.name}</span>
              <button type="button" disabled={ocupado} aria-label="Remover planilha" onClick={() => { setPlanilha(null); zerar(); }}
                className="text-zinc-500 hover:text-red-400 disabled:opacity-40"><X size={14} /></button>
            </div>
          ) : (
            <Button variant="ghost" icon={<FileSpreadsheet size={15} />} onClick={() => inputPlanilha.current?.click()}>Escolher planilha (.xlsx)</Button>
          )}
        </div>

        {/* PASSO 2 — o mês. Um botão por mês do trimestre; o escolhido fica azul. Travam durante o trabalho. */}
        <div>
          <p className="mb-2 text-xs font-medium text-zinc-500">2. Mês a comparar</p>
          <div role="group" aria-label="Mês a comparar com a planilha" className="flex flex-wrap items-center gap-2">
            {meses.map((m) => {
              const aberto = ativo === m;
              return (
                <button key={m} type="button" onClick={() => abrirMes(m)} disabled={ocupado} aria-pressed={aberto}
                  className={`rounded-md border px-2.5 py-1 text-xs font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-400 disabled:cursor-not-allowed disabled:opacity-40 ${
                    aberto ? "border-sky-400/50 bg-sky-500/15 text-sky-100" : "border-white/[0.1] text-zinc-300 hover:border-sky-400/40 hover:text-white"}`}>
                  Comparar {mesCurto(m)}
                </button>
              );
            })}
          </div>
        </div>

        {/* PASSO 3 — de onde vêm as notas + botão Comparar. Só aparece com um mês escolhido e antes/depois do trabalho. */}
        {ativo && (fase === "escolher" || fase === "erro") && (
          <div className="rounded-xl border border-white/[0.07] bg-white/[0.02] p-4">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h3 className="text-sm font-semibold text-white">Comparar {ativo}</h3>
              <span className="text-xs text-zinc-500">
                {cgrGravado !== null ? <>CGR gravado: <span className="tabular-nums text-zinc-300">{brl(cgrGravado)}</span></> : "Ainda sem CGR gravado"}
              </span>
            </div>

            {semNotas ? (
              // Sem as notas do mês: a pasta é escolhida num lugar só, lá em cima. Aqui só avisa e leva até lá.
              <div className="mt-3 rounded-lg bg-amber-400/[0.06] px-4 py-3 text-sm text-amber-200">
                <p>{semNotas}</p>
                <button type="button" onClick={irParaImportar}
                  className="mt-2 inline-flex items-center gap-1.5 text-xs font-semibold text-sky-300 underline-offset-2 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-400">
                  <FolderOpen size={13} aria-hidden /> Ir para Importar da pasta do ciclo
                </button>
              </div>
            ) : (
              // Caminho feliz: a pasta do ciclo já tem o mês. Nada para o usuário fazer.
              <p className="mt-3 text-sm text-zinc-300">
                Vou usar as notas de {ativo} da pasta do ciclo que você trouxe lá em cima ({num(doCiclo.length)} arquivo(s)).
              </p>
            )}

            {/* role="alert": leitores de tela anunciam o erro assim que ele aparece. */}
            {fase === "erro" && erro && <p role="alert" className="mt-3 text-sm text-red-300">{erro}</p>}

            <div className="mt-4 flex flex-wrap items-center gap-2">
              <Button variant="solid" icon={<Play size={14} />} onClick={comparar} disabled={!pronto}>Comparar {ativo} com a planilha</Button>
              {!planilha && <span className="text-xs text-zinc-500">Escolha a planilha no passo 1.</span>}
            </div>
          </div>
        )}

        {/* ESPERA — enquanto lê os arquivos e o servidor trabalha. */}
        {ocupado && ativo && (
          <div aria-live="polite">
            <p className="flex items-center gap-2 text-sm text-zinc-300">
              <Loader2 size={14} className="animate-spin text-sky-300" aria-hidden />
              {fase === "lendo"
                ? `Lendo os arquivos de ${ativo}${lidos ? ` (${num(lidos.feitos)} de ${num(lidos.total)})` : ""}…`
                : `Auditando ${ativo} e comparando com a planilha…`}
            </p>
            {fase === "processando" && <p className="mt-1 text-xs text-zinc-500">PDFs levam cerca de 1 min a cada 90. Não feche a página.</p>}
            <EsqueletoLista linhas={2} icone={false} className="mt-3" texto={`Comparando ${ativo}`} />
          </div>
        )}

        {/* RESULTADO — o CGR calculado, avisos e o quadro de comparação. */}
        {fase === "resultado" && res && ativo && (
          <div className="space-y-3">
            <p className="text-sm text-zinc-300">
              CGR líquido das notas de {ativo}: <b className="tabular-nums text-sky-200">{brl(total!)}</b>
              {cgrGravado !== null && <> · gravado <span className="tabular-nums">{brl(cgrGravado)}</span></>}
              {" "}· {num(res.r.itens.length)} nota(s) · {res.r.qtd_xml_lidos} XML e {res.r.qtd_pdf_lidos} PDF
            </p>
            {/* PDF que o leitor automático não conseguiu ler: a nota fica fora do CGR e pode aparecer como diferença. */}
            {res.naoLidos > 0 && (
              <p className="text-xs text-amber-200">⚠ {res.naoLidos === 1 ? "1 PDF não foi lido" : `${res.naoLidos} PDFs não foram lidos`}: a nota fica fora do CGR e pode aparecer como diferença.</p>
            )}
            {res.comparacao ? (
              // O quadro "Tudo confere / Há divergências" é o mesmo componente da tela da Auditoria.
              <ComparacaoPlanilha comparacao={res.comparacao} aoIncluirNota={aoIncluirNota} className="rounded-xl border border-white/[0.07] bg-white/[0.02] p-4" />
            ) : (
              // Sem comparação: planilha ilegível ou sem aba do mês. Mostra o motivo que o servidor deu.
              <p className="text-sm text-amber-200">{res.planilhaIlegivel ?? res.avisoComparacao ?? "A planilha não pôde ser comparada."}</p>
            )}
            <p className="text-xs text-zinc-500">
              Esta comparação não grava nada (só o botão “Incluir esta nota” grava). Se houver divergência com a planilha, o ciclo gravado continua com ela até ser corrigido:
              cabe ao analista analisar os dados antes de gravar.
            </p>
            <div className="flex flex-wrap gap-2">
              <Button variant="ghost" onClick={() => { zerar(); }}>Comparar de novo</Button>
              <Button variant="ghost" onClick={() => { zerar(); setAtivo(null); }}>Fechar</Button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
