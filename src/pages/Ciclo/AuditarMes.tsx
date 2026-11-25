/** "Auditar <mês>" no cartão da Auditoria CGR do Painel do Ciclo: o analista arrasta a
 * pasta das notas de UM mês (ou escolhe a pasta ou o .zip dela), confere o resultado ali
 * mesmo e só grava se confirmar. Mesmo envio da tela da Auditoria (modo XML, todas as
 * empresas, sem planilha). O seletor de pasta pode fazer o Chrome perguntar se quer enviar
 * os arquivos; arrastar ou .zip não perguntam. */
import { useEffect, useRef, useState } from "react";
import { FileArchive, Loader2, Play } from "lucide-react";
import type { ArquivoDaPasta } from "../../api";
import { mensagemDeErro } from "../../api/client";
import { Alert } from "../../components/ui/Alert";
import { AreaSoltarPasta } from "../../components/ui/AreaSoltarPasta";
import { avisarSucesso } from "../../components/ui/avisos";
import { Button } from "../../components/ui/Button";
import { EsqueletoLista } from "../../components/ui/EsqueletoLista";
import { ListaProblemas } from "../../components/ui/ListaProblemas";
import { ModalAviso } from "../../components/ui/ModalAviso";
import { brl, num } from "../../utils/format";
import { carregarNaMemoria, type PastaLida } from "../../utils/pasta";
import { empresasDosCaminhos } from "../../utils/pastaCiclo";
import { arquivosParaEnvio, avisoDaSoltura, lerPastaSolta, type Soltura } from "../../utils/soltarPasta";
import { ehZip } from "../../utils/zipCiclo";
import type { AuditoriaHistoricoLinha } from "../../types";
import { auditarMes, type AuditoriaDoMes } from "./auditoriaDoMes";
import { OndeDifere } from "./Processar";
import { pendenciasDosMeses } from "./notasFaltantes";
import { GravarMes } from "./GravarMes";
import { divergenciaDoMes } from "./gravarDoMes";

/** Limite de arquivos por envio do backend (MAX_ARQUIVOS em Src/api/uploads.py). */
const MAX_ARQUIVOS = 20_000;

type Fase = "escolher" | "lendo" | "processando" | "erro" | "resultado";

interface Envio {
  raiz: string;
  arquivos: ArquivoDaPasta[];
  /** null: é um .zip — quem confere as subpastas de empresa é o servidor. */
  empresas: { nome: string; xml: number; pdf: number }[] | null;
}

const mesCurto = (periodo: string) => periodo.split("/")[0];

/** Por que não dá para enviar (antes de gastar minutos de OCR no servidor). */
const bloqueioDe = (envio: Envio | null) => !envio ? null
  : !envio.arquivos.length ? "Esta pasta não tem nenhum XML ou PDF."
  : envio.empresas && !envio.empresas.length
    ? "Esta pasta não tem subpastas de empresa. Traga a pasta do mês, a que contém as pastas Petrobras, TAG… com os XML e PDF dentro."
  : envio.arquivos.length > MAX_ARQUIVOS
    ? `São ${num(envio.arquivos.length)} arquivos; o servidor aceita até ${num(MAX_ARQUIVOS)} por envio. Use a tela da Auditoria por empresa.`
  : null;

export function AuditarMes({ meses, auditoria, planilha = null, onGravado }: {
  meses: string[];
  auditoria: AuditoriaHistoricoLinha[];
  /** A planilha da Conta Gráfica escolhida em "Comparar com a planilha" (ou null). Com ela, a nota que só está nela aparece antes de gravar. */
  planilha?: File | null;
  onGravado: () => void;
}) {
  const [ativo, setAtivo] = useState<string | null>(null);
  const [fase, setFase] = useState<Fase>("escolher");
  const [envio, setEnvio] = useState<Envio | null>(null);
  const [lendoPasta, setLendoPasta] = useState(false); // listando a pasta arrastada
  const [lidos, setLidos] = useState<{ feitos: number; total: number } | null>(null);
  const [res, setRes] = useState<AuditoriaDoMes | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  // Entrada recusada (arquivos soltos, não é .zip, pasta sem empresas…): aviso em janela.
  const [aviso, setAviso] = useState<{ titulo: string; texto: string } | null>(null);
  const titulo = useRef<HTMLHeadingElement>(null);
  const inputZip = useRef<HTMLInputElement>(null);
  const botaoZip = useRef<HTMLButtonElement>(null);

  // Ao abrir um mês e a cada resultado, o foco vai para o título do painel (leitor de tela e teclado).
  useEffect(() => {
    if (ativo && fase !== "lendo" && fase !== "processando") titulo.current?.focus();
  }, [ativo, fase]);

  // Há trabalho que se perde ao trocar de mês: só um mês por vez.
  const travado = fase === "lendo" || fase === "processando" || fase === "resultado";
  const cgrGravado = ativo ? auditoria.find((h) => h.periodo === ativo)?.cgr_gravado ?? null : null;

  const zerar = () => {
    setFase("escolher");
    setEnvio(null);
    setRes(null);
    setErro(null);
    setAviso(null);
    setLidos(null);
  };
  const abrir = (m: string) => {
    zerar();
    setAtivo(ativo === m ? null : m);
  };
  const fechar = () => { zerar(); setAtivo(null); };

  /** Pasta ou .zip escolhido: se não serve, já avisa em janela (com o próximo passo). */
  const usar = (novo: Envio) => {
    setErro(null);
    setEnvio(novo);
    const motivo = bloqueioDe(novo);
    if (motivo) setAviso({ titulo: "Esta pasta não serve para auditar", texto: motivo });
  };

  const escolherZip = (zip: File | undefined) => {
    if (!zip) return;
    if (!ehZip(zip)) {
      setAviso({ titulo: "Escolha um arquivo .zip",
        texto: `“${zip.name}” não é um .zip. Compacte a pasta de ${ativo} (botão direito › Enviar para › Pasta compactada) `
          + "e escolha o .zip, ou arraste a pasta para a área tracejada." });
      return;
    }
    usar({ raiz: zip.name.replace(/\.zip$/i, ""), arquivos: [{ arquivo: zip, caminho: zip.name }], empresas: null });
  };

  const soltar = async (s: Soltura) => {
    const nome = `de ${ativo}`;
    if (s.tipo === "zip" && s.zip) return escolherZip(s.zip);
    if (s.tipo !== "pasta" || !s.pasta) {
      setAviso(avisoDaSoltura(s.tipo === "pasta" || s.tipo === "zip" ? "nada" : s.tipo, nome));
      return;
    }
    const p = s.pasta;
    return lerPasta(() => lerPastaSolta(p));
  };

  /** Pasta solta ou escolhida no seletor: fica só com XML e PDF e confere as empresas. */
  const lerPasta = async (ler: () => Promise<PastaLida>) => {
    setLendoPasta(true);
    try {
      const pasta = await ler();
      const arquivos = await arquivosParaEnvio(pasta, ["xml", "pdf"]);
      usar({ raiz: pasta.raiz || "escolhida", arquivos, empresas: empresasDosCaminhos(arquivos.map((a) => a.caminho)) });
    } catch (e) {
      setAviso({ titulo: "Não foi possível ler a pasta",
        texto: e instanceof Error ? e.message : mensagemDeErro(e, "Não foi possível ler a pasta.") });
    } finally {
      setLendoPasta(false);
    }
  };

  const bloqueio = bloqueioDe(envio);

  const processar = async () => {
    if (!envio || !ativo || bloqueio) return;
    setErro(null);
    setFase("lendo");
    try {
      const memoria = await carregarNaMemoria(envio.arquivos, (feitos, total) => setLidos({ feitos, total }));
      setFase("processando");
      const r = await auditarMes(memoria, envio.raiz, ativo, cgrGravado, true, planilha);
      if (r.erros.length) {
        setErro(`O servidor não conseguiu auditar ${ativo}: ${r.erros.join(" ")} Corrija os arquivos indicados e traga a pasta de novo.`);
        setFase("erro");
      } else if (r.outroMes) {
        setErro(`O nome da pasta “${envio.raiz}” indica ${r.outroMes}, não ${ativo}. Nada foi gravado. `
          + `Traga a pasta das notas de ${ativo}, ou use “Auditar ${mesCurto(r.outroMes)}” se essas notas são daquele mês.`);
        setFase("erro");
      } else {
        setRes(r);
        setFase("resultado");
        // Lidas, ainda não gravadas (o aviso de gravar vem depois, em gravar()).
        avisarSucesso(`Notas de ${ativo} lidas`, `${num(r.r.itens.length)} nota(s), CGR ${brl(r.r.totais.cgr_liquido)}. Confira antes de gravar.`);
      }
    } catch (e) {
      // Falha ao ler o arquivo no disco vem com o arquivo e o próximo passo; a da API, via mensagemDeErro.
      setErro(e instanceof Error && !("isAxiosError" in e) ? e.message
        : mensagemDeErro(e, `Não foi possível auditar ${ativo}`));
      setFase("erro");
    }
  };

  /** Erro de auditar: volta a escolher (a pasta errada sai). */
  const voltarAEscolher = () => { setErro(null); setEnvio(null); setFase("escolher"); };

  const pendencias = pendenciasDosMeses(auditoria, meses); // meses gravados com nota faltante: o aviso fica aqui
  const d = res?.diferencas;
  const { apagadas, temDiferenca } = res ? divergenciaDoMes(res) : { apagadas: [], temDiferenca: false };
  const substitui = cgrGravado !== null;
  const linhaDoMes = ativo ? auditoria.find((h) => h.periodo === ativo) : undefined;
  const erroAoAuditar = fase === "erro" && !!erro;

  return (
    <div className="mt-3">
      {pendencias.length > 0 && (
        <Alert variant="warning" className="mb-3">
          <strong>Nota faltante na Auditoria CGR</strong>
          <ul className="mt-1 list-disc pl-5 text-xs">{pendencias.map((t) => <li key={t}>{t}</li>)}</ul>
        </Alert>
      )}
      <div role="group" aria-label="Auditar um mês aqui no Painel" className="flex flex-wrap items-center gap-2">
        {meses.map((m) => {
          const aberto = ativo === m;
          const bloqueado = travado && !aberto;
          return (
            <button key={m} type="button" onClick={() => abrir(m)} disabled={bloqueado || (aberto && travado)}
              aria-expanded={aberto} aria-controls={aberto ? "auditar-mes-painel" : undefined}
              title={bloqueado ? `Grave ou descarte ${ativo} antes de auditar outro mês` : undefined}
              className={`rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-400 disabled:cursor-not-allowed disabled:opacity-40 ${
                aberto ? "border-sky-400/50 bg-sky-500/15 text-sky-100" : "border-white/[0.1] text-zinc-300 hover:border-sky-400/40 hover:text-white"}`}>
              Auditar {mesCurto(m)}
            </button>
          );
        })}
      </div>

      {/* Fora das fases: o botão principal dos avisos também abre a escolha do .zip. */}
      <input ref={inputZip} type="file" accept=".zip,application/zip" className="hidden" tabIndex={-1} aria-hidden
        onChange={(e) => { escolherZip(e.target.files?.[0]); e.target.value = ""; }} />

      {ativo && (
        <div id="auditar-mes-painel" className="mt-3 rounded-xl border border-white/[0.07] bg-white/[0.02] p-4">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h3 ref={titulo} tabIndex={-1} className="text-sm font-semibold text-white outline-none">Auditar {ativo}</h3>
            <span className="text-xs text-zinc-500">
              {substitui ? <>CGR gravado: <span className="tabular-nums text-zinc-300">{brl(cgrGravado!)}</span></> : "Ainda sem CGR gravado"}
            </span>
          </div>

          {fase === "escolher" && (
            <div className="mt-3 space-y-3">
              <AreaSoltarPasta texto={`Arraste aqui a pasta de ${ativo}`} onSoltar={soltar} desabilitado={lendoPasta}>
                <p className="max-w-[60ch] text-xs text-zinc-500">
                  A pasta do mês, que contém uma pasta por empresa (Petrobras, TAG…) com os XML e PDF. Não traga a pasta de uma só empresa.
                </p>
                {/* Sem "Escolher a pasta": o seletor do sistema faz o Chrome abrir um aviso que o site não controla. */}
                <Button variant="primary" ref={botaoZip} onClick={() => inputZip.current?.click()} disabled={lendoPasta}>
                  <FileArchive size={16} aria-hidden /> ou escolha o .zip da pasta
                </Button>
                <p className="text-xs text-zinc-500">Assim o Chrome não precisa pedir permissão.</p>
              </AreaSoltarPasta>
              {lendoPasta && (
                <p className="flex items-center gap-2 text-xs text-zinc-400" aria-live="polite">
                  <Loader2 size={13} className="animate-spin text-sky-300" aria-hidden /> Lendo a pasta…
                </p>
              )}
              {envio && !lendoPasta && (
                <p className="text-xs text-zinc-400">
                  {envio.empresas ? <>Pasta <b className="text-zinc-200">{envio.raiz}</b>: </> : <>.zip <b className="text-zinc-200">{envio.arquivos[0]?.caminho}</b> (o servidor confere as pastas das empresas).</>}
                  {envio.empresas && envio.empresas.length > 0 && (
                    <>
                      {num(envio.arquivos.length)} arquivo(s) em {envio.empresas.length} empresa(s):{" "}
                      {envio.empresas.map((e) => `${e.nome} (${e.xml} XML · ${e.pdf} PDF)`).join(", ")}.
                      {envio.empresas.some((e) => e.pdf && !e.xml) && (
                        <span className="block text-amber-200/90">
                          Só PDF (lidas por OCR, confira com atenção): {envio.empresas.filter((e) => e.pdf && !e.xml).map((e) => e.nome).join(", ")}.
                        </span>
                      )}
                    </>
                  )}
                  {/* O motivo fica escrito aqui depois de fechar o aviso: é por isso que "Processar" está desligado. */}
                  {bloqueio && <span className="block text-amber-200">⚠ {bloqueio}</span>}
                </p>
              )}
              <div className="flex flex-wrap gap-2">
                <Button variant="solid" icon={<Play size={14} />} onClick={processar} disabled={!envio || !!bloqueio || lendoPasta}>
                  Processar {ativo}
                </Button>
                <Button variant="ghost" onClick={fechar}>Cancelar</Button>
              </div>
              <p className="text-xs text-zinc-500">Nada é gravado agora: você confere o resultado e decide.</p>
            </div>
          )}

          {(fase === "lendo" || fase === "processando") && (
            <div className="mt-3" aria-live="polite">
              <p className="flex items-center gap-2 text-sm text-zinc-300">
                <Loader2 size={14} className="animate-spin text-sky-300" aria-hidden />
                {fase === "lendo"
                  ? `Lendo os arquivos de ${envio?.raiz}${lidos ? ` (${num(lidos.feitos)} de ${num(lidos.total)})` : ""}…`
                  : `Auditando ${num(envio?.arquivos.length ?? 0)} arquivo(s) de ${ativo}…`}
              </p>
              {fase === "processando" && (
                <p className="mt-1 text-xs text-zinc-500">PDFs levam cerca de 1 min a cada 90. Não feche a página.</p>
              )}
              <EsqueletoLista linhas={2} icone={false} className="mt-3" texto={`Auditando ${ativo}`} />
            </div>
          )}

          {fase === "resultado" && res && (
            <div className="mt-3 space-y-3">
              <p className="text-xs text-zinc-500">
                {res.r.totais.qtd_nfe} NF-e · {res.r.totais.qtd_cte} CT-e · {res.r.totais.qtd_devolucoes} devoluções
                {" "}· lidos {res.r.qtd_xml_lidos} XML e {res.r.qtd_pdf_lidos} PDF · {res.r.totais.por_empresa.length} empresa(s) · pasta {envio?.raiz}
              </p>

              {apagadas.length > 0 && (
                <Alert variant="error">
                  <strong>{apagadas.length === 1 ? "1 empresa gravada não está" : `${apagadas.length} empresas gravadas não estão`} nesta pasta e
                  {apagadas.length === 1 ? " será apagada" : " serão apagadas"} ao gravar:</strong>{" "}
                  {apagadas.map((e) => `${e.empresa} (${brl(e.gravado)})`).join(", ")}. Se as notas delas são deste mês, coloque-as na pasta e processe de novo.
                </Alert>
              )}
              {res.avisos.map((a) => <p key={a} className="text-xs text-amber-200">⚠ {a}</p>)}
              {temDiferenca && <OndeDifere d={d!} total={res.r.totais.cgr_liquido - (cgrGravado ?? 0)} />}
              {res.r.problemas.length > 0 && (
                <details className="text-xs">
                  <summary className="cursor-pointer text-sky-300">Ver os problemas por arquivo ({res.r.problemas.length})</summary>
                  <ListaProblemas problemas={res.r.problemas} className="mt-2" />
                </details>
              )}

              <GravarMes key={`${ativo}-${envio?.raiz ?? ""}`} periodo={ativo!} res={res} linha={linhaDoMes} planilhaEscolhida={!!planilha}
                aoGravar={onGravado} aoDescartar={fechar} className="rounded-xl border border-white/[0.07] bg-white/[0.02] p-4" />
            </div>
          )}

        </div>
      )}

      {/* Entrada recusada: o próximo passo é escolher o .zip (ou arrastar de novo). */}
      <ModalAviso aberto={!!aviso} onFechar={() => setAviso(null)} variante="atencao" titulo={aviso?.titulo ?? ""} voltarFoco={botaoZip}
        acao={{ rotulo: "Escolher o .zip da pasta", onClick: () => { setAviso(null); setEnvio(null); inputZip.current?.click(); } }}>
        {aviso?.texto ?? ""}
      </ModalAviso>

      {/* Auditar falhou: escolher outra pasta. */}
      <ModalAviso aberto={erroAoAuditar} onFechar={voltarAEscolher} variante="erro" titulo={`Não foi possível auditar ${ativo}`}
        voltarFoco={titulo}
        acao={{ rotulo: "Escolher o .zip da pasta", onClick: () => { voltarAEscolher(); inputZip.current?.click(); } }}>
        {erroAoAuditar ? erro! : ""}
      </ModalAviso>

    </div>
  );
}
