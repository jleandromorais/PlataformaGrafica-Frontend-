/** "Auditar <mês>" no cartão da Auditoria CGR do Painel do Ciclo: o analista escolhe a
 * pasta das notas de UM mês, confere o resultado ali mesmo e só grava se confirmar.
 * Mesmo envio da tela da Auditoria (modo XML, todas as empresas, sem planilha). */
import { useEffect, useRef, useState } from "react";
import { Loader2, Play, Save, X } from "lucide-react";
import { salvarAuditoria, type ArquivoDaPasta } from "../../api";
import { mensagemDeErro } from "../../api/client";
import { Alert } from "../../components/ui/Alert";
import { Button } from "../../components/ui/Button";
import { EsqueletoLista } from "../../components/ui/EsqueletoLista";
import { ListaProblemas } from "../../components/ui/ListaProblemas";
import { Modal } from "../../components/ui/Modal";
import { SeletorArquivos } from "../../components/ui/SeletorArquivos";
import { SeletorPasta } from "../../components/ui/SeletorPasta";
import { Valor } from "../../components/ui/Valor";
import { brl, num } from "../../utils/format";
import { carregarNaMemoria, lerPasta } from "../../utils/pasta";
import { empresasDosCaminhos } from "../../utils/pastaCiclo";
import type { AuditoriaHistoricoLinha } from "../../types";
import { auditarMes, type AuditoriaDoMes } from "./auditoriaDoMes";
import { OndeDifere } from "./Processar";

/** Limite de arquivos por envio do backend (MAX_ARQUIVOS em Src/api/uploads.py). */
const MAX_ARQUIVOS = 20_000;

type Fase = "escolher" | "lendo" | "processando" | "erro" | "resultado" | "gravando" | "gravado";

interface Envio {
  raiz: string;
  arquivos: ArquivoDaPasta[];
  /** null: é um .zip — quem confere as subpastas de empresa é o servidor. */
  empresas: { nome: string; xml: number; pdf: number }[] | null;
}

const mesCurto = (periodo: string) => periodo.split("/")[0];

export function AuditarMes({ meses, auditoria, onGravado }: {
  meses: string[];
  auditoria: AuditoriaHistoricoLinha[];
  onGravado: () => void;
}) {
  const [ativo, setAtivo] = useState<string | null>(null);
  const [fase, setFase] = useState<Fase>("escolher");
  const [envio, setEnvio] = useState<Envio | null>(null);
  const [lidos, setLidos] = useState<{ feitos: number; total: number } | null>(null);
  const [res, setRes] = useState<AuditoriaDoMes | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [confirmar, setConfirmar] = useState(false);
  const [gravado, setGravado] = useState<{ cgr: number; notas: number } | null>(null);
  const titulo = useRef<HTMLHeadingElement>(null);

  // Ao abrir um mês e a cada resultado, o foco vai para o título do painel (leitor de tela e teclado).
  useEffect(() => {
    if (ativo && fase !== "lendo" && fase !== "processando" && fase !== "gravando") titulo.current?.focus();
  }, [ativo, fase]);

  // Há trabalho que se perde ao trocar de mês: só um mês por vez.
  const travado = fase === "lendo" || fase === "processando" || fase === "gravando" || fase === "resultado";
  const cgrGravado = ativo ? auditoria.find((h) => h.periodo === ativo)?.cgr_gravado ?? null : null;

  const zerar = () => {
    setFase("escolher");
    setEnvio(null);
    setRes(null);
    setErro(null);
    setLidos(null);
    setGravado(null);
  };
  const abrir = (m: string) => {
    zerar();
    setAtivo(ativo === m ? null : m);
  };
  const fechar = () => { zerar(); setAtivo(null); };

  const escolherPasta = (lista: FileList) => {
    setErro(null);
    const { raiz, arquivos } = lerPasta(lista, ["xml", "pdf"]);
    setEnvio({ raiz, arquivos, empresas: empresasDosCaminhos(arquivos.map((a) => a.caminho)) });
  };
  const escolherZip = (zips: File[]) => {
    setErro(null);
    const zip = zips[zips.length - 1];
    setEnvio(zip ? { raiz: zip.name.replace(/\.zip$/i, ""), arquivos: [{ arquivo: zip, caminho: zip.name }], empresas: null } : null);
  };

  // Por que não dá para enviar (antes de gastar minutos de OCR no servidor).
  const bloqueio = !envio ? null
    : !envio.arquivos.length ? "Esta pasta não tem nenhum XML ou PDF."
    : envio.empresas && !envio.empresas.length
      ? "Esta pasta não tem subpastas de empresa. Escolha a pasta do mês, a que contém as pastas Petrobras, TAG… com os XML e PDF dentro."
    : envio.arquivos.length > MAX_ARQUIVOS
      ? `São ${num(envio.arquivos.length)} arquivos; o servidor aceita até ${num(MAX_ARQUIVOS)} por envio. Use a tela da Auditoria por empresa.`
    : null;

  const processar = async () => {
    if (!envio || !ativo || bloqueio) return;
    setErro(null);
    setFase("lendo");
    try {
      const memoria = await carregarNaMemoria(envio.arquivos, (feitos, total) => setLidos({ feitos, total }));
      setFase("processando");
      const r = await auditarMes(memoria, envio.raiz, ativo, cgrGravado, true);
      if (r.erros.length) {
        setErro(`O servidor não conseguiu auditar ${ativo}: ${r.erros.join(" ")} Corrija os arquivos indicados e escolha a pasta de novo.`);
        setFase("erro");
      } else if (r.outroMes) {
        setErro(`O nome da pasta “${envio.raiz}” indica ${r.outroMes}, não ${ativo}. Nada foi gravado. `
          + `Escolha a pasta das notas de ${ativo}, ou use “Auditar ${mesCurto(r.outroMes)}” se essas notas são daquele mês.`);
        setFase("erro");
      } else {
        setRes(r);
        setFase("resultado");
      }
    } catch (e) {
      // Falha ao ler o arquivo no disco vem com o arquivo e o próximo passo; a da API, via mensagemDeErro.
      setErro(e instanceof Error && !("isAxiosError" in e) ? e.message
        : mensagemDeErro(e, `Não foi possível auditar ${ativo}`));
      setFase("erro");
    }
  };

  const gravar = async () => {
    if (!res || !ativo) return;
    setConfirmar(false);
    setErro(null);
    setFase("gravando");
    try {
      const s = await salvarAuditoria(ativo, res.r.itens);
      setGravado({ cgr: s.cgr_liquido, notas: s.qtd_itens });
      setRes(null);
      setEnvio(null);
      setFase("gravado");
      onGravado();
    } catch (e) {
      setErro(mensagemDeErro(e, `Não foi possível gravar ${ativo}`));
      setFase("resultado");
    }
  };

  const d = res?.diferencas;
  // Gravar substitui o mês inteiro: empresa gravada que não veio nesta pasta some.
  const apagadas = d?.tem_notas_gravadas ? d.por_empresa.filter((e) => e.processado === 0 && e.gravado !== 0) : [];
  const temDiferenca = !!d && (d.resumo.length > 0 || d.notas.length > 0);
  const substitui = cgrGravado !== null;

  return (
    <div className="mt-3">
      <div role="group" aria-label="Auditar um mês aqui no Painel" className="flex flex-wrap items-center gap-2">
        {meses.map((m) => {
          const aberto = ativo === m;
          const bloqueado = travado && !aberto;
          return (
            <button key={m} type="button" onClick={() => abrir(m)} disabled={bloqueado || (aberto && travado)}
              aria-expanded={aberto} aria-controls={aberto ? "auditar-mes-painel" : undefined}
              title={bloqueado ? `Grave ou descarte ${ativo} antes de auditar outro mês` : undefined}
              className={`rounded-md border px-2.5 py-1 text-xs font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-400 disabled:cursor-not-allowed disabled:opacity-40 ${
                aberto ? "border-sky-400/50 bg-sky-500/15 text-sky-100" : "border-white/[0.1] text-zinc-300 hover:border-sky-400/40 hover:text-white"}`}>
              Auditar {mesCurto(m)}
            </button>
          );
        })}
      </div>

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
              <SeletorPasta onEscolher={escolherPasta}
                titulo={envio?.empresas ? `Pasta: ${envio.raiz}` : `Escolher a pasta das notas de ${ativo}`}
                detalhe="A pasta do mês, que contém uma pasta por empresa (Petrobras, TAG…) com os XML e PDF. Não escolha a pasta de uma só empresa." />
              <SeletorArquivos accept=".zip" titulo="Ou um .zip da pasta do mês" dica="Com as pastas das empresas dentro"
                arquivos={envio && !envio.empresas ? [envio.arquivos[0].arquivo] : []} onChange={escolherZip} />
              {envio?.empresas && envio.empresas.length > 0 && (
                <p className="text-xs text-zinc-400">
                  {num(envio.arquivos.length)} arquivo(s) em {envio.empresas.length} empresa(s):{" "}
                  {envio.empresas.map((e) => `${e.nome} (${e.xml} XML · ${e.pdf} PDF)`).join(", ")}.
                  {envio.empresas.some((e) => e.pdf && !e.xml) && (
                    <span className="block text-amber-200/90">
                      Só PDF (lidas por OCR, confira com atenção): {envio.empresas.filter((e) => e.pdf && !e.xml).map((e) => e.nome).join(", ")}.
                    </span>
                  )}
                </p>
              )}
              {bloqueio && <Alert variant="warning">{bloqueio}</Alert>}
              <div className="flex flex-wrap gap-2">
                <Button variant="solid" icon={<Play size={14} />} onClick={processar} disabled={!envio || !!bloqueio}>
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

          {fase === "erro" && (
            <div className="mt-3 space-y-3">
              {erro && <Alert variant="error">{erro}</Alert>}
              <div className="flex flex-wrap gap-2">
                <Button variant="primary" onClick={() => { setErro(null); setEnvio(null); setFase("escolher"); }}>Escolher outra pasta</Button>
                <Button variant="ghost" onClick={fechar}>Fechar</Button>
              </div>
            </div>
          )}

          {(fase === "resultado" || fase === "gravando") && res && (
            <div className="mt-3 space-y-3">
              {erro && <Alert variant="error">{erro}</Alert>}
              <dl className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                <div>
                  <dt className="text-xs text-zinc-500">CGR líquido calculado</dt>
                  <dd className="text-lg font-semibold text-sky-200"><Valor valor={res.r.totais.cgr_liquido} /></dd>
                </div>
                <div>
                  <dt className="text-xs text-zinc-500">CGR gravado</dt>
                  <dd className="text-lg font-semibold text-zinc-200">{substitui ? <Valor valor={cgrGravado!} /> : <span className="text-zinc-500">—</span>}</dd>
                </div>
                <div>
                  <dt className="text-xs text-zinc-500">Notas auditadas</dt>
                  <dd className="text-lg font-semibold tabular-nums text-zinc-200">{num(res.r.itens.length)}</dd>
                </div>
              </dl>
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
              {res.naoLidos > 0 && (
                <Alert variant="warning">
                  {res.naoLidos === 1 ? "1 PDF não foi lido" : `${res.naoLidos} PDFs não foram lidos`}: a nota fica fora do CGR.
                  Grave só se puder ficar assim; senão, confira na tela da Auditoria.
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

              <div className="flex flex-wrap items-center gap-2 pt-1">
                <Button variant="solid" icon={<Save size={14} />} onClick={() => setConfirmar(true)} loading={fase === "gravando"}>
                  {fase === "gravando" ? `Gravando ${ativo}…` : substitui ? `Gravar ${ativo} (substitui ${brl(cgrGravado!)})` : `Gravar ${ativo}`}
                </Button>
                <Button variant="ghost" icon={<X size={14} />} onClick={fechar} disabled={fase === "gravando"}>Descartar</Button>
              </div>
            </div>
          )}

          {fase === "gravado" && gravado && (
            <div className="mt-3 space-y-3">
              <Alert variant="success">
                CGR de {ativo} gravado: {brl(gravado.cgr)} ({num(gravado.notas)} notas). O sistema também regravou o RPV e o PR/PV dos
                meses afetados, e as etapas do ciclo já foram atualizadas.
              </Alert>
              <Button variant="ghost" onClick={fechar}>Fechar</Button>
            </div>
          )}
        </div>
      )}

      <Modal aberto={confirmar} onFechar={() => setConfirmar(false)} icone={<Save size={20} />}
        titulo={substitui ? `Substituir o CGR de ${ativo}?` : `Gravar o CGR de ${ativo}?`}
        rodape={<>
          <button type="button" onClick={gravar}
            className="w-full rounded-xl bg-marinho px-4 py-2.5 text-sm font-semibold text-paper hover:bg-marinho-claro">
            {substitui ? "Substituir e gravar" : "Gravar"}
          </button>
          <button type="button" onClick={() => setConfirmar(false)}
            className="w-full rounded-xl px-4 py-2.5 text-sm font-medium text-zinc-400 hover:bg-white/[0.04] hover:text-white">Cancelar</button>
        </>}>
        {res && (
          <dl className="grid grid-cols-[1fr_auto] gap-x-4 gap-y-1">
            {substitui && <><dt>Gravado hoje</dt><dd className="text-right text-zinc-200"><Valor valor={cgrGravado!} /></dd></>}
            <dt>{substitui ? "Passa a ser" : "CGR calculado"}</dt>
            <dd className="text-right font-semibold text-white"><Valor valor={res.r.totais.cgr_liquido} /></dd>
          </dl>
        )}
        <p>{substitui ? `As notas gravadas de ${ativo} são apagadas e entram só` : `Entram em ${ativo}`} as {num(res?.r.itens.length ?? 0)} notas
          desta pasta. O servidor recalcula o CGR e regrava o RPV e o PR/PV dos meses afetados.</p>
        {apagadas.length > 0 && (
          <p className="text-red-300">{apagadas.map((e) => e.empresa).join(", ")} {apagadas.length === 1 ? "sairá" : "sairão"} do mês.</p>
        )}
        {!!res?.naoLidos && <p className="text-amber-200">{res.naoLidos} PDF(s) não lido(s) ficam fora do CGR.</p>}
      </Modal>
    </div>
  );
}
