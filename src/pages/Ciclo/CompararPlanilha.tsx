/** Fim do Painel do Ciclo: "Comparar com a planilha" (opcional), igual à tela da Auditoria do
 * CGR. O analista escolhe a planilha da Conta Gráfica (.xlsx) e o mês do trimestre; o sistema
 * audita as notas desse mês e mostra a comparação (CGR, empresas, notas que faltam ou diferem).
 * Usa a pasta do ciclo já arrastada lá em cima; sem ela, aceita a pasta (ou .zip) do mês aqui
 * mesmo. NUNCA grava nada: é só conferência, depois do ciclo. */

// ── Importações: peças prontas que este arquivo usa ───────────────────────────
// React: useMemo guarda uma conta pronta (só refaz se algo mudar); useRef aponta para um
// elemento da tela (aqui, os campos escondidos de escolher arquivo); useState é a "memória" da tela.
import { useMemo, useRef, useState } from "react";
import { FileArchive, FileSpreadsheet, Loader2, Play, X } from "lucide-react"; // ícones
import type { ArquivoDaPasta } from "../../api";
import { mensagemDeErro } from "../../api/client"; // transforma um erro técnico em frase para o usuário
import { Button } from "../../components/ui/Button";
import { AreaSoltarPasta } from "../../components/ui/AreaSoltarPasta"; // a área tracejada de arrastar pasta
import { EsqueletoLista } from "../../components/ui/EsqueletoLista"; // as barrinhas cinza de "carregando"
import { ModalAviso } from "../../components/ui/ModalAviso"; // a janelinha de aviso
import { brl, num } from "../../utils/format"; // brl = "R$ 1.000,00"; num = número com separador de milhar
import { abrirArquivo, carregarNaMemoria, type ArquivoDaPastaCiclo } from "../../utils/pasta";
import { arquivosDaCelula, classificar, empresasDosCaminhos, envioDaAuditoria } from "../../utils/pastaCiclo";
import { arquivosParaEnvio, avisoDaSoltura, lerPastaSolta, type Soltura } from "../../utils/soltarPasta";
import { ehZip } from "../../utils/zipCiclo";
import type { AuditoriaHistoricoLinha } from "../../types";
import { ComparacaoPlanilha } from "../Auditoria/ComparacaoPlanilha"; // o quadro de resultado, o mesmo da tela da Auditoria
import { auditarMes, type AuditoriaDoMes } from "./auditoriaDoMes"; // a função que fala com o servidor

// Classes de estilo do "cartão" da seção (borda fina e fundo do painel), as mesmas do resto do Painel.
const PANEL = "rounded-xl border border-white/[0.07] bg-panel";
// O servidor aceita no máximo esta quantidade de arquivos por envio (vem de Src/api/uploads.py).
const MAX_ARQUIVOS = 20_000;

// Em que momento a seção está. Só um deles vale de cada vez:
//   escolher     -> o usuário ainda está escolhendo planilha, mês e pasta
//   lendo        -> o navegador está lendo os arquivos do disco
//   processando  -> o servidor está auditando e comparando
//   resultado    -> deu certo, mostra o quadro de comparação
//   erro         -> deu errado, mostra o motivo
type Fase = "escolher" | "lendo" | "processando" | "resultado" | "erro";

/** Pasta (ou .zip) do mês trazida aqui, quando a do ciclo não tem o mês ou não foi arrastada. */
interface Envio {
  raiz: string;                 // nome da pasta (ex.: "09 set-26 NFs"); o servidor usa para achar o mês
  arquivos: ArquivoDaPasta[];   // cada arquivo + o caminho dele dentro da pasta
  /** null: é um .zip — quem confere as subpastas de empresa é o servidor. */
  empresas: { nome: string; xml: number; pdf: number }[] | null;
}

// "Set/2026" -> "Set". Usado nos botões ("Comparar Set").
const mesCurto = (periodo: string) => periodo.split("/")[0];

/** Por que NÃO dá para enviar esta pasta (ou null se está tudo certo).
 * Melhor avisar agora do que gastar minutos de leitura no servidor para falhar no fim. */
function bloqueioDe(envio: Envio | null) {
  if (!envio) return null;
  if (!envio.arquivos.length) return "Esta pasta não tem nenhum XML ou PDF.";
  // A pasta precisa ter UMA subpasta por empresa (Petrobras, TAG…); sem isso o servidor recusa.
  if (envio.empresas && !envio.empresas.length) {
    return "Esta pasta não tem subpastas de empresa. Traga a pasta do mês, a que contém as pastas Petrobras, TAG… com os XML e PDF dentro.";
  }
  if (envio.arquivos.length > MAX_ARQUIVOS) return `São ${num(envio.arquivos.length)} arquivos; o servidor aceita até ${num(MAX_ARQUIVOS)} por envio.`;
  return null;
}

// O que o Painel entrega a esta seção (as "props"):
//   meses     -> os 3 meses do trimestre aberto, ex.: ["Jul/2026", "Ago/2026", "Set/2026"]
//   caminhos  -> os NOMES dos arquivos da pasta do ciclo (ou null se nenhuma foi trazida)
//   arquivos  -> os arquivos de verdade, abertos no navegador (vazio depois de recarregar a página)
//   auditoria -> o CGR já gravado de cada mês, só para mostrar ao lado do calculado
export function CompararPlanilha({ meses, caminhos, arquivos, auditoria }: {
  meses: string[];
  caminhos: string[] | null;
  arquivos: Map<string, ArquivoDaPastaCiclo>;
  auditoria: AuditoriaHistoricoLinha[];
}) {
  // ── A memória da seção (cada useState guarda um valor e uma função para trocá-lo) ──
  const [planilha, setPlanilha] = useState<File | null>(null);     // a planilha escolhida
  const [ativo, setAtivo] = useState<string | null>(null);         // o mês escolhido, ex.: "Ago/2026"
  const [fase, setFase] = useState<Fase>("escolher");              // em que momento estamos
  const [envio, setEnvio] = useState<Envio | null>(null);          // pasta trazida à mão (plano B)
  const [lendoPasta, setLendoPasta] = useState(false);             // true enquanto lista a pasta arrastada
  const [lidos, setLidos] = useState<{ feitos: number; total: number } | null>(null); // progresso "12 de 90"
  const [res, setRes] = useState<AuditoriaDoMes | null>(null);     // a resposta do servidor
  const [erro, setErro] = useState<string | null>(null);           // a frase de erro, se houver
  const [aviso, setAviso] = useState<{ titulo: string; texto: string } | null>(null); // texto da janelinha de aviso
  // Referências aos campos <input type="file"> escondidos: o botão bonito "clica" neles por baixo dos panos.
  const inputPlanilha = useRef<HTMLInputElement>(null);
  const inputZip = useRef<HTMLInputElement>(null);
  const botaoZip = useRef<HTMLButtonElement>(null); // o foco do teclado volta para ele ao fechar o aviso

  // O ano do trimestre ("2026"), para completar nomes de pasta que vêm sem ano.
  const ano = Number(meses[0].split("/")[1]);
  // Entende o que cada arquivo da pasta do ciclo é (auditoria? CGF? de que mês?).
  // useMemo: só refaz essa classificação se a pasta ou o ano mudarem.
  const reconhecidos = useMemo(
    () => (caminhos ?? []).map((c) => classificar(c, ano)).filter((x): x is NonNullable<ReturnType<typeof classificar>> => !!x),
    [caminhos, ano],
  );

  // As notas DESTE mês que estão na pasta do ciclo. Só valem se os arquivos estão abertos no
  // navegador (o usuário arrastou a pasta nesta visita). Depois de recarregar a página o
  // navegador guarda só os nomes, e aí esta lista fica vazia e a seção pede a pasta de novo.
  const doCiclo = useMemo(() => {
    if (!ativo) return [];
    const { pastas, zipsSoltos } = arquivosDaCelula(reconhecidos, "auditoria", ativo);
    const lista = [...pastas, ...zipsSoltos];
    return lista.length && lista.every((a) => arquivos.has(a.caminho)) ? lista : [];
  }, [ativo, reconhecidos, arquivos]);
  const usaCiclo = doCiclo.length > 0; // true = vamos usar a pasta do ciclo; false = precisa trazer a pasta do mês

  // ── Valores derivados (contas simples em cima da memória) ──
  const ocupado = fase === "lendo" || fase === "processando";   // há trabalho em andamento: trava os botões
  const cgrGravado = ativo ? auditoria.find((h) => h.periodo === ativo)?.cgr_gravado ?? null : null; // CGR salvo do mês
  const bloqueio = usaCiclo ? null : bloqueioDe(envio);          // motivo de a pasta trazida à mão não servir
  // O botão "Comparar" só liga quando tem planilha, mês, notas e nenhum problema. Evita gastar minutos à toa.
  const pronto = !!planilha && !!ativo && (usaCiclo || (!!envio && !bloqueio)) && !lendoPasta;

  // Volta ao começo da escolha (descarta resultado, erro e pasta trazida à mão).
  const zerar = () => { setFase("escolher"); setEnvio(null); setRes(null); setErro(null); setLidos(null); };
  // Clicar num mês abre aquele mês; clicar de novo no mesmo fecha. Trocar de mês descarta o que havia.
  const abrirMes = (m: string) => { zerar(); setAtivo(ativo === m ? null : m); };

  // Guarda a pasta trazida à mão e, se ela não serve, avisa na hora em janelinha.
  const usar = (novo: Envio) => {
    setErro(null);
    setEnvio(novo);
    const motivo = bloqueioDe(novo);
    if (motivo) setAviso({ titulo: "Esta pasta não serve para comparar", texto: motivo });
  };

  // O usuário escolheu um arquivo no botão ".zip": confere se é mesmo um .zip antes de aceitar.
  const escolherZip = (zip: File | undefined) => {
    if (!zip) return;
    if (!ehZip(zip)) {
      setAviso({ titulo: "Escolha um arquivo .zip",
        texto: `“${zip.name}” não é um .zip. Compacte a pasta de ${ativo} (botão direito › Enviar para › Pasta compactada) e escolha o .zip, ou arraste a pasta para a área tracejada.` });
      return;
    }
    // Para .zip não dá para contar empresas aqui (está fechado): quem confere é o servidor (empresas: null).
    usar({ raiz: zip.name.replace(/\.zip$/i, ""), arquivos: [{ arquivo: zip, caminho: zip.name }], empresas: null });
  };

  // O usuário SOLTOU algo na área tracejada. Pode ser uma pasta (ótimo), um .zip (ótimo)
  // ou arquivos soltos / várias coisas (não servem: explicamos o que fazer).
  const soltar = async (s: Soltura) => {
    if (s.tipo === "zip" && s.zip) return escolherZip(s.zip);
    if (s.tipo !== "pasta" || !s.pasta) {
      setAviso(avisoDaSoltura(s.tipo === "pasta" || s.tipo === "zip" ? "nada" : s.tipo, `de ${ativo}`));
      return;
    }
    setLendoPasta(true);
    try {
      const pasta = await lerPastaSolta(s.pasta);                         // lista o que há dentro da pasta
      const lista = await arquivosParaEnvio(pasta, ["xml", "pdf"]);       // fica só com XML e PDF (o que a auditoria lê)
      usar({ raiz: pasta.raiz, arquivos: lista, empresas: empresasDosCaminhos(lista.map((a) => a.caminho)) });
    } catch (e) {
      setAviso({ titulo: "Não foi possível ler a pasta", texto: e instanceof Error ? e.message : mensagemDeErro(e, "Não foi possível ler a pasta.") });
    } finally {
      setLendoPasta(false); // roda sempre, com erro ou sem: tira o "Lendo a pasta…" da tela
    }
  };

  // O botão "Comparar": o coração da seção. Passo a passo:
  const comparar = async () => {
    if (!planilha || !ativo || !pronto) return; // trava de segurança (o botão já fica desligado)
    setErro(null);
    setFase("lendo");
    try {
      // 1) Junta os arquivos: da pasta do ciclo ou da pasta trazida à mão.
      let enviar: ArquivoDaPasta[];
      let raiz: string;
      if (usaCiclo) {
        // Abre do disco só os arquivos deste mês (a pasta do ciclo só tinha listado os nomes).
        enviar = await Promise.all(doCiclo.map(async (a) => ({ arquivo: await abrirArquivo(arquivos.get(a.caminho)!), caminho: envioDaAuditoria(a).caminho })));
        raiz = envioDaAuditoria(doCiclo[0]).raiz;
      } else {
        enviar = envio!.arquivos;
        raiz = envio!.raiz;
      }
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
        setErro(`O nome da pasta “${raiz}” indica ${r.outroMes}, não ${ativo}. Traga a pasta das notas de ${ativo}.`);
        setFase("erro");
      } else {
        setRes(r);
        setFase("resultado");
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
        Terminado o ciclo, confira o CGR de um mês contra a planilha da Conta Gráfica, igual à tela da Auditoria. As notas são lidas de novo
        {" "}e comparadas com a planilha; <b className="text-zinc-200">nada é gravado</b>.
      </p>

      <div className="mt-4 space-y-4">
        {/* PASSO 1 — a planilha. O <input> de arquivo fica escondido; o botão bonito clica nele. */}
        <div>
          <p className="mb-2 text-xs font-medium text-zinc-500">1. Planilha da Conta Gráfica</p>
          <input ref={inputPlanilha} type="file" accept=".xlsx,.xls" className="hidden" tabIndex={-1} aria-hidden
            // Trocou a planilha: o resultado antigo não vale mais. e.target.value = "" deixa escolher o mesmo arquivo de novo.
            onChange={(e) => { setPlanilha(e.target.files?.[0] ?? null); setRes(null); if (fase === "resultado") setFase("escolher"); e.target.value = ""; }} />
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

            {usaCiclo ? (
              // Caminho feliz: a pasta do ciclo já tem o mês. Nada para o usuário fazer.
              <p className="mt-3 text-sm text-zinc-300">
                Vou usar as notas de {ativo} da pasta do ciclo que você trouxe lá em cima ({num(doCiclo.length)} arquivo(s)).
              </p>
            ) : (
              // Plano B: pede a pasta (ou .zip) do mês aqui mesmo.
              <div className="mt-3 space-y-3">
                <p className="text-xs text-zinc-500">
                  {caminhos?.length
                    ? `A pasta do ciclo não está aberta com as notas de ${ativo}.`
                    : "Nenhuma pasta do ciclo foi trazida."}{" "}
                  Traga a pasta do mês aqui, a que contém uma pasta por empresa (Petrobras, TAG…) com os XML e PDF.
                </p>
                <AreaSoltarPasta texto={`Arraste aqui a pasta de ${ativo}`} onSoltar={soltar} desabilitado={lendoPasta}>
                  {/* Alternativa ao arrastar: escolher um .zip. Com .zip o Chrome não mostra aviso de permissão. */}
                  <button ref={botaoZip} type="button" onClick={() => inputZip.current?.click()} disabled={lendoPasta}
                    className="flex items-center gap-2 rounded-xl border border-sky-500/40 px-4 py-2 text-sm font-semibold text-sky-200 hover:bg-sky-500/10 disabled:opacity-50">
                    <FileArchive size={16} aria-hidden /> ou escolha o .zip da pasta
                  </button>
                  <p className="text-xs text-zinc-500">Assim o Chrome não precisa pedir permissão.</p>
                </AreaSoltarPasta>
                <input ref={inputZip} type="file" accept=".zip,application/zip" className="hidden" tabIndex={-1} aria-hidden
                  onChange={(e) => { escolherZip(e.target.files?.[0]); e.target.value = ""; }} />
                {lendoPasta && (
                  <p className="flex items-center gap-2 text-xs text-zinc-400" aria-live="polite">
                    <Loader2 size={13} className="animate-spin text-sky-300" aria-hidden /> Lendo a pasta…
                  </p>
                )}
                {/* Resumo do que foi trazido, e o motivo escrito caso a pasta não sirva. */}
                {envio && !lendoPasta && (
                  <p className="text-xs text-zinc-400">
                    {envio.empresas ? <>Pasta <b className="text-zinc-200">{envio.raiz}</b>: {num(envio.arquivos.length)} arquivo(s) em {envio.empresas.length} empresa(s).</>
                      : <>.zip <b className="text-zinc-200">{envio.arquivos[0]?.caminho}</b> (o servidor confere as pastas das empresas).</>}
                    {bloqueio && <span className="block text-amber-200">⚠ {bloqueio}</span>}
                  </p>
                )}
              </div>
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
              <ComparacaoPlanilha comparacao={res.comparacao} className="rounded-xl border border-white/[0.07] bg-white/[0.02] p-4" />
            ) : (
              // Sem comparação: planilha ilegível ou sem aba do mês. Mostra o motivo que o servidor deu.
              <p className="text-sm text-amber-200">{res.planilhaIlegivel ?? res.avisoComparacao ?? "A planilha não pôde ser comparada."}</p>
            )}
            <p className="text-xs text-zinc-500">
              Esta comparação não grava nada. Se houver divergência com a planilha, o ciclo gravado continua com ela até ser corrigido:
              cabe ao analista analisar os dados antes de gravar.
            </p>
            <div className="flex flex-wrap gap-2">
              <Button variant="ghost" onClick={() => { zerar(); }}>Comparar de novo</Button>
              <Button variant="ghost" onClick={() => { zerar(); setAtivo(null); }}>Fechar</Button>
            </div>
          </div>
        )}
      </div>

      {/* Janelinha de aviso para entradas recusadas (arquivo que não é .zip, pasta sem empresas…).
          O botão principal já leva ao próximo passo: escolher o .zip. */}
      <ModalAviso aberto={!!aviso} onFechar={() => setAviso(null)} variante="atencao" titulo={aviso?.titulo ?? ""} voltarFoco={botaoZip}
        acao={{ rotulo: "Escolher o .zip da pasta", onClick: () => { setAviso(null); setEnvio(null); inputZip.current?.click(); } }}>
        {aviso?.texto ?? ""}
      </ModalAviso>
    </section>
  );
}
