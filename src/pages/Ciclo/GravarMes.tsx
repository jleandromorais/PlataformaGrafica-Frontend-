/** Passo final "Gravar o mês de <Mês/Ano>": o mesmo bloco serve depois de "Comparar com a planilha" e depois de "Auditar <mês>".
 * Mostra o que será gravado (CGR, notas, notas incluídas à mão, diferença contra a planilha), deixa escolher o que fazer com as
 * notas que só estão na planilha, avisa o que a regravação apaga (notas digitadas viram "reincluir" por padrão) e só grava
 * depois da confirmação. Quem soma e grava é o back-end (`salvarAuditoria`); aqui só se decide o que mostrar e enviar. */
import { useRef, useState } from "react";
import { Save, X } from "lucide-react";
import { salvarAuditoria } from "../../api";
import { mensagemDeErro } from "../../api/client";
import { Alert } from "../../components/ui/Alert";
import { avisarSucesso } from "../../components/ui/avisos";
import { Button } from "../../components/ui/Button";
import { ModalAviso } from "../../components/ui/ModalAviso";
import { usePreviaCascata } from "../../components/ui/usePreviaCascata";
import { Valor } from "../../components/ui/Valor";
import { AFETADOS_DOS_MODULOS, textoDepoisDeGravar } from "../../utils/confirmarGravacao";
import { brl, num } from "../../utils/format";
import type { AuditoriaHistoricoLinha } from "../../types";
import type { AuditoriaDoMes } from "./auditoriaDoMes";
import {
  decisaoInicial, diferencaParaPlanilha, digitadasDoMes, divergenciaDoMes, estadoDaGravacao, ID_GRAVAR_MES, MOTIVO_REINCLUSAO,
  rotuloDoBotao, textoDoEstado, tituloDaConfirmacao,
} from "./gravarDoMes";
import { decisaoParaEnviar, faltantesDoMes, podeGravarComFaltantes, rotuloDaNota, type Decisao } from "./notasFaltantes";

const TOL_DIF = 1; // R$: abaixo disso é arredondamento (a mesma do quadro da comparação)

export function GravarMes({ periodo, res, linha, planilhaEscolhida, aoGravar, aoDescartar, className = "" }: {
  periodo: string;
  /** As notas do mês já lidas e conferidas (com a comparação, se houve planilha). */
  res: AuditoriaDoMes;
  /** O que o mês tem gravado hoje (do histórico da Auditoria), ou undefined se nunca foi gravado. */
  linha: AuditoriaHistoricoLinha | null | undefined;
  /** Havia planilha na conferência? Sem ela o sistema não sabe se falta nota. */
  planilhaEscolhida: boolean;
  /** Depois de gravar: quem usa recarrega o Painel. */
  aoGravar: () => void;
  /** Mostra o botão "Descartar" (o Auditar mês usa; o Comparar tem os próprios botões). */
  aoDescartar?: () => void;
  className?: string;
}) {
  const faltantes = faltantesDoMes(res.comparacao);
  const falta = faltantes.notas.length;
  const [decisao, setDecisao] = useState<Decisao | null>(() => decisaoInicial(linha, faltantes));
  const [motivo, setMotivo] = useState(() => (decisaoInicial(linha, faltantes) === "incluir" ? MOTIVO_REINCLUSAO : ""));
  const [confirmar, setConfirmar] = useState(false);
  const [gravando, setGravando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [gravado, setGravado] = useState<{ cgr: number; notas: number } | null>(null);
  const botao = useRef<HTMLButtonElement>(null);
  const { previa, mostrarCascata } = usePreviaCascata(); // SR, PR e PV não são regravados sozinhos: o analista aprova a prévia

  const calculado = res.r.totais.cgr_liquido;
  const qtd = res.r.itens.length;
  const estado = estadoDaGravacao({ cgrCalculado: calculado, qtdNotas: qtd, linha });
  const substitui = estado === "igual" || estado === "substitui";
  const { apagadas, divergencia } = divergenciaDoMes(res);
  const digitadas = digitadasDoMes(linha, decisao, faltantes);
  const incluidas = decisao === "incluir" ? faltantes.paraIncluir ?? [] : [];
  const cgrIncluidas = incluidas.reduce((s, n) => s + n.cgr_liquido, 0);
  const difPlanilha = diferencaParaPlanilha(res.comparacao);
  const liberado = estado !== "vazio" && podeGravarComFaltantes(faltantes, decisao, motivo);

  const gravar = async () => {
    setConfirmar(false);
    setErro(null);
    setGravando(true);
    try {
      const faltas = decisaoParaEnviar(faltantes, decisao, motivo);
      const s = await salvarAuditoria(periodo, res.r.itens, faltas);
      mostrarCascata(s.cascata);
      setGravado({ cgr: s.cgr_liquido, notas: s.qtd_itens });
      avisarSucesso(`Auditoria de ${periodo} gravada`, `CGR = ${brl(s.cgr_liquido)} (${num(s.qtd_itens)} nota(s)).`
        + (faltas ? (faltas.decisao === "incluir" ? " Com a nota que só chega depois do período: confira e regularize." : " Sem a nota que está só na planilha.") : ""));
      aoGravar();
    } catch (e) {
      setErro(mensagemDeErro(e, `Não foi possível gravar ${periodo}`));
    } finally {
      setGravando(false);
    }
  };

  if (gravado) {
    return (
      <section id={ID_GRAVAR_MES} className={`realce-secao space-y-3 ${className}`}>
        <h3 className="text-sm font-semibold text-white outline-none">Gravar o mês de {periodo}</h3>
        <Alert variant="success">
          CGR de {periodo} gravado: {brl(gravado.cgr)} ({num(gravado.notas)} notas). O sistema também regravou o RPV do mês e as etapas
          do ciclo já foram atualizadas. O SR, o PR e o PV não mudam sozinhos: aprove a prévia abaixo, se aparecer.
        </Alert>
        {previa}
        {aoDescartar && <Button variant="ghost" onClick={aoDescartar}>Fechar</Button>}
      </section>
    );
  }

  return (
    <section id={ID_GRAVAR_MES} aria-labelledby="gravar-mes-titulo" className={`realce-secao space-y-3 ${className}`}>
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h3 id="gravar-mes-titulo" className="text-sm font-semibold text-white outline-none">Passo final: gravar o mês de {periodo}</h3>
        <span className="text-xs text-zinc-400">{textoDoEstado(estado, periodo, linha, calculado)}</span>
      </div>

      <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div>
          <dt className="text-xs text-zinc-500">CGR que será gravado</dt>
          <dd className="text-lg font-semibold text-sky-200"><Valor valor={calculado + cgrIncluidas} /></dd>
        </div>
        <div>
          <dt className="text-xs text-zinc-500">Notas</dt>
          <dd className="text-lg font-semibold tabular-nums text-zinc-200">{num(qtd + incluidas.length)}</dd>
          {incluidas.length > 0 && <dd className="text-xs text-zinc-500">{num(qtd)} dos arquivos + {num(incluidas.length)} à mão</dd>}
        </div>
        <div>
          <dt className="text-xs text-zinc-500">Incluídas à mão</dt>
          <dd className="text-lg font-semibold tabular-nums text-zinc-200">
            {incluidas.length ? <Valor valor={cgrIncluidas} /> : <span className="text-zinc-500">nenhuma</span>}
          </dd>
        </div>
        <div>
          <dt className="text-xs text-zinc-500">Diferença para a planilha</dt>
          <dd className={`text-lg font-semibold tabular-nums ${difPlanilha !== null && Math.abs(difPlanilha) > TOL_DIF ? "text-amber-200" : "text-zinc-200"}`}>
            {difPlanilha === null ? <span className="text-zinc-500">sem planilha</span> : <Valor valor={difPlanilha} />}
          </dd>
          {difPlanilha !== null && <dd className="text-xs text-zinc-500">só as notas lidas, sem as incluídas à mão</dd>}
        </div>
      </dl>

      {falta > 0 && (
        <div role="group" aria-labelledby="falta-titulo" className="rounded-lg border border-amber-300/30 bg-amber-400/[0.06] p-3 text-sm text-amber-100">
          <p id="falta-titulo" className="font-semibold">
            {falta === 1 ? "1 nota está na planilha e não veio na pasta" : `${falta} notas estão na planilha e não vieram na pasta`}. Escolha antes de gravar:
          </p>
          <ul className="mt-1 list-disc pl-5 text-xs text-amber-200">{faltantes.notas.map((n) => <li key={rotuloDaNota(n)}>{rotuloDaNota(n)}</li>)}</ul>
          <div className="mt-3 flex flex-wrap gap-2">
            <Button variant={decisao === "incluir" ? "solid" : "ghost"} size="sm" aria-pressed={decisao === "incluir"}
              disabled={!faltantes.paraIncluir || gravando} onClick={() => { setDecisao("incluir"); }}>
              Incluir no cálculo
            </Button>
            <Button variant={decisao === "seguir_sem" ? "solid" : "ghost"} size="sm" aria-pressed={decisao === "seguir_sem"}
              disabled={gravando} onClick={() => setDecisao("seguir_sem")}>
              Seguir sem {falta === 1 ? "ela" : "elas"}
            </Button>
          </div>
          {decisao === "incluir" && (
            <label className="mt-2 block text-xs text-amber-100">
              Motivo (obrigatório)
              <input type="text" value={motivo} onChange={(e) => setMotivo(e.target.value)} disabled={gravando}
                placeholder="Ex.: estorno da nota 550499 de Jul/26; valor da planilha"
                className="mt-1 w-full rounded-md border border-amber-300/30 bg-black/20 px-2 py-1 text-xs text-white placeholder:text-zinc-500 focus:outline-none focus-visible:border-amber-300" />
            </label>
          )}
          <p className="mt-2 text-xs text-amber-200">
            {!faltantes.paraIncluir ? "A planilha não traz o CGR de todas, então só dá para seguir sem elas. "
              : decisao === "incluir" ? `${falta === 1 ? "A nota entra" : "As notas entram"} no CGR com o valor da planilha. Confira e regularize quando ${falta === 1 ? "ela chegar" : "elas chegarem"}.`
              : decisao === "seguir_sem" ? `O CGR é gravado sem ${falta === 1 ? "essa nota" : "essas notas"}. O aviso fica no Painel até o mês ser gravado de novo.`
              : "A escolha fica registrada na trilha."}
          </p>
        </div>
      )}

      {digitadas && !digitadas.reincluidas && (
        <Alert variant="error">
          <strong>{digitadas.qtd === 1 ? "1 nota incluída à mão será apagada" : `${digitadas.qtd} notas incluídas à mão serão apagadas`} ao gravar</strong>
          {" "}({brl(digitadas.cgr)} no CGR de {periodo}).{" "}
          {planilhaEscolhida
            ? "A planilha não traz essa nota como faltante, então ela não volta sozinha: inclua de novo depois, com “Incluir esta nota”."
            : "Escolha a planilha em “Comparar com a planilha” antes de gravar, para o sistema poder reincluí-la."}
        </Alert>
      )}
      {digitadas?.reincluidas && (
        <p className="text-xs text-emerald-300">
          {digitadas.qtd === 1 ? "A nota incluída à mão antes volta" : `As ${digitadas.qtd} notas incluídas à mão antes voltam`} junto, marcada{digitadas.qtd === 1 ? "" : "s"} em “Incluir no cálculo”.
        </p>
      )}

      {res.naoLidos > 0 && (
        <Alert variant="warning">
          {res.naoLidos === 1 ? "1 PDF não foi lido" : `${res.naoLidos} PDFs não foram lidos`}: a nota fica fora do CGR.
          Grave só se puder ficar assim; senão, confira na tela da Auditoria.
        </Alert>
      )}
      {!planilhaEscolhida && (
        <p className="text-xs text-zinc-500">Sem planilha escolhida, não confiro se falta nota. Escolha-a em “Comparar com a planilha” antes de gravar.</p>
      )}
      {planilhaEscolhida && !res.comparacao && (
        <p className="text-xs text-amber-200">⚠ Não consegui comparar com a planilha{res.planilhaIlegivel ?? res.avisoComparacao ? `: ${res.planilhaIlegivel ?? res.avisoComparacao}` : ""}. Não sei se falta nota.</p>
      )}
      {divergencia && (
        <Alert variant="warning">
          <strong>Há divergência neste mês.</strong> Se gravar agora, o CGR de {periodo} será gravado <b>com a divergência</b>.
          Cabe ao analista analisar os dados antes de gravar.
        </Alert>
      )}

      <div className="flex flex-wrap items-center gap-2 pt-1">
        <Button variant={estado === "igual" ? "ghost" : "solid"} ref={botao} icon={<Save size={14} />} onClick={() => setConfirmar(true)}
          loading={gravando} disabled={!liberado}>
          {rotuloDoBotao(estado, periodo, linha, gravando)}
        </Button>
        {aoDescartar && <Button variant="ghost" icon={<X size={14} />} onClick={aoDescartar} disabled={gravando}>Descartar</Button>}
      </div>

      {/* Gravar falhou: o resultado continua na tela; dá para tentar de novo. */}
      <ModalAviso aberto={!!erro && !gravando} onFechar={() => setErro(null)} variante="erro" titulo={`Não foi possível gravar ${periodo}`}
        voltarFoco={botao} acao={{ rotulo: "Tentar gravar de novo", onClick: () => { void gravar(); } }}>
        {erro ?? ""}
      </ModalAviso>

      {/* Confirmação antes de gravar: diz o que será substituído. */}
      <ModalAviso aberto={confirmar} onFechar={() => setConfirmar(false)} variante={substitui || divergencia ? "atencao" : "info"}
        icone={substitui || divergencia ? undefined : <Save size={20} />} voltarFoco={botao}
        titulo={tituloDaConfirmacao(estado, periodo, divergencia)}
        acao={{ rotulo: divergencia ? "Gravar com divergências" : substitui ? "Gravar e substituir" : "Gravar", onClick: () => { void gravar(); } }}
        rotuloFechar={divergencia ? "Cancelar e conferir" : "Cancelar"}>
        {divergencia && (
          <p>Há divergência neste mês. Se continuar, será gravado <b>com a divergência</b>. <b>Cabe ao analista analisar os dados antes de gravar.</b></p>
        )}
        {falta > 0 && decisao && (
          <p className="text-amber-200">
            {decisao === "incluir" ? `Entra no CGR ${falta === 1 ? "a nota que só está" : "as notas que só estão"} na planilha.`
              : `${falta === 1 ? "A nota que está" : "As notas que estão"} só na planilha ficam fora do CGR.`} A escolha fica registrada.
          </p>
        )}
        {digitadas && (
          <p className={digitadas.reincluidas ? "text-emerald-300" : "text-red-300"}>
            {digitadas.reincluidas
              ? `${digitadas.qtd === 1 ? "A nota incluída à mão volta" : `As ${digitadas.qtd} notas incluídas à mão voltam`} junto (${brl(digitadas.cgr)}).`
              : `${digitadas.qtd === 1 ? "A nota incluída à mão será apagada" : `As ${digitadas.qtd} notas incluídas à mão serão apagadas`} (${brl(digitadas.cgr)}).`}
          </p>
        )}
        <dl className="grid grid-cols-[1fr_auto] gap-x-4 gap-y-1">
          <dt className="col-span-2 font-medium text-zinc-200">Auditoria CGR · {periodo}</dt>
          {substitui && <><dt>Gravado hoje</dt><dd className="text-right tabular-nums text-zinc-200"><Valor valor={linha?.cgr_gravado ?? 0} /></dd></>}
          <dt>{substitui ? "Passa a ser" : "CGR que será gravado"}</dt>
          <dd className="text-right font-semibold tabular-nums text-white"><Valor valor={calculado + cgrIncluidas} /></dd>
        </dl>
        <p>{substitui ? `As notas gravadas de ${periodo} são apagadas e entram só` : `Entram em ${periodo}`} as {num(qtd)} notas
          lidas{incluidas.length ? `, mais ${num(incluidas.length)} à mão` : ""}. O servidor recalcula o CGR e regrava o RPV e o SCG do mês.</p>
        {apagadas.length > 0 && (
          <p className="text-red-300">{apagadas.map((e) => e.empresa).join(", ")} {apagadas.length === 1 ? "sairá" : "sairão"} do mês.</p>
        )}
        {res.naoLidos > 0 && <p className="text-amber-200">{res.naoLidos} PDF(s) não lido(s) ficam fora do CGR.</p>}
        <p className="text-zinc-400">{textoDepoisDeGravar(AFETADOS_DOS_MODULOS)}</p>
      </ModalAviso>
    </section>
  );
}
