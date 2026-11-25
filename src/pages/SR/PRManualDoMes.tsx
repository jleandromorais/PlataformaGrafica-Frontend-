/** Dentro da célula "PR (R$/m³)" do SR: deixa o analista INFORMAR o PR à mão quando não há PR salvo para o mês
 * (hoje só aparece "estimado" ou "ausente" e o SR fica travado). O valor digitado entra na prévia na hora; para valer,
 * é gravado com motivo obrigatório e confirmação (POST /pr/manual), fica registrado como origem "manual" (quem, quando,
 * por quê) e pode voltar ao automático. O cálculo automático do PR não muda. Quem usa decide a prévia (`aoDigitar`)
 * e recarrega depois de gravar (`aoGravado`). */
import { useRef, useState } from "react";
import { Save, Undo2 } from "lucide-react";
import { salvarPRManual, voltarPRAoAutomatico } from "../../api";
import { mensagemDeErro } from "../../api/client";
import { avisarSucesso } from "../../components/ui/avisos";
import { Button } from "../../components/ui/Button";
import { ConfirmarGravacao } from "../../components/ui/ConfirmarGravacao";
import { usePreviaCascata } from "../../components/ui/usePreviaCascata";
import { AFETADOS_DA_TELA } from "../../utils/confirmarGravacao";
import { brl } from "../../utils/format";
import { faixaDosMeses } from "../../utils/rotulos";
import { lerPRDigitado, motivoDoPRValido, problemaDoPRDigitado, textoDoPRManual } from "../../utils/prManual";
import type { SROrigemPR } from "../../types";

const CAMPO = "mt-1 w-full rounded-md border border-white/[0.12] bg-black/20 px-2 py-1 text-xs text-white placeholder:text-zinc-500 focus:outline-none focus-visible:border-sky-300";

export interface PRDoMes {
  pr: number;
  pr_origem: SROrigemPR;
  pr_motivo?: string;
  pr_usuario?: string;
  pr_data?: string;
}

export function PRManualDoMes({ chave, meses, linha, estimadoOriginal, aoDigitar, aoGravado }: {
  /** Trimestre da tarifa do PR, ex.: "Fev - Abr/2026" (um PR vale para os 3 meses dele). */
  chave: string;
  /** Meses deste SR que usam essa chave (para dizer "vale para Mai e Jun"). */
  meses: string[];
  linha: PRDoMes;
  /** O PR estimado de antes de digitar (ou 0 se não havia): é o "antes" da janela e para onde "Usar o estimado" volta. */
  estimadoOriginal: number;
  /** Chamado a cada valor válido digitado (e com null ao desistir): quem usa põe o valor na prévia. */
  aoDigitar: (chave: string, valor: number | null) => void;
  /** Depois de gravar ou voltar ao automático: quem usa recarrega os números do banco. */
  aoGravado: () => void;
}) {
  const [aberto, setAberto] = useState(false);
  const [texto, setTexto] = useState("");
  const [motivo, setMotivo] = useState("");
  const [confirmar, setConfirmar] = useState(false);
  const [ocupado, setOcupado] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const botao = useRef<HTMLButtonElement>(null);
  const { previa, mostrarCascata } = usePreviaCascata("mt-2");

  const rotulo = faixaDosMeses(meses);
  const valor = lerPRDigitado(texto);
  const problema = problemaDoPRDigitado(texto);
  const podeGravar = valor !== null && !problema && motivoDoPRValido(motivo) && !ocupado;

  const digitar = (t: string) => {
    setTexto(t);
    setErro(null);
    const n = lerPRDigitado(t);
    aoDigitar(chave, n !== null && !problemaDoPRDigitado(t) ? n : null);
  };
  const desistir = () => { setTexto(""); setMotivo(""); setAberto(false); setErro(null); aoDigitar(chave, null); };

  const gravar = async () => {
    if (valor === null) return;
    setOcupado(true);
    setErro(null);
    try {
      const r = await salvarPRManual(chave, valor, motivo.trim());
      mostrarCascata(r.cascata);
      avisarSucesso(`PR de ${chave} gravado à mão`, `${brl(r.pr, 4)} · motivo: ${motivo.trim()}. O PV só muda depois que você aprovar no Painel.`);
      setTexto(""); setMotivo(""); setAberto(false);
      aoDigitar(chave, null);
      aoGravado();
    } catch (e) {
      setErro(mensagemDeErro(e, "Não foi possível gravar o PR digitado."));
    } finally {
      setOcupado(false);
    }
  };

  const voltar = async () => {
    setOcupado(true);
    setErro(null);
    try {
      await voltarPRAoAutomatico(chave, motivo.trim());
      avisarSucesso(`PR de ${chave} voltou ao automático`, "O PR digitado foi apagado; o SR volta a pedir o PR calculado.");
      setMotivo(""); setAberto(false);
      aoGravado();
    } catch (e) {
      setErro(mensagemDeErro(e, "Não foi possível voltar ao PR automático."));
    } finally {
      setOcupado(false);
    }
  };

  // PR já gravado à mão: mostra quem, quando e por quê, e deixa voltar ao automático (com motivo).
  if (linha.pr_origem === "manual") {
    return (
      <div className="mt-0.5 text-right text-[0.7rem] text-sky-300">
        <span className="block">{textoDoPRManual(linha)}</span>
        {!aberto ? (
          <button type="button" onClick={() => setAberto(true)} className="mt-0.5 text-zinc-400 underline-offset-2 hover:underline focus-visible:outline-2 focus-visible:outline-sky-400">
            Voltar ao automático
          </button>
        ) : (
          <div className="mt-1 text-left">
            <label className="block text-zinc-300">Motivo (obrigatório)
              <input type="text" className={CAMPO} value={motivo} onChange={(e) => setMotivo(e.target.value)} disabled={ocupado}
                placeholder="Ex.: o PR calculado já está salvo" />
            </label>
            <span className="mt-1.5 flex flex-wrap gap-2">
              <Button variant="solid" size="sm" ref={botao} icon={<Undo2 size={13} />} disabled={!motivoDoPRValido(motivo) || ocupado} onClick={() => setConfirmar(true)}>
                Voltar ao automático
              </Button>
              <Button variant="ghost" size="sm" disabled={ocupado} onClick={() => { setAberto(false); setMotivo(""); setErro(null); }}>Cancelar</Button>
            </span>
          </div>
        )}
        {erro && <p role="alert" className="mt-1 text-left text-red-300">{erro}</p>}
        {previa}
        <ConfirmarGravacao aberto={confirmar} onFechar={() => setConfirmar(false)} voltarFoco={botao}
          oque={`o PR de ${chave} (voltar ao automático)`} rotuloAcao="Voltar ao automático" afeta={AFETADOS_DA_TELA.pr}
          onConfirmar={() => void voltar()}
          linhas={[{ rotulo: `PR de ${chave}`, antes: `${brl(linha.pr, 4)} (manual)`, depois: "sem PR salvo: volta ao automático" }]} />
      </div>
    );
  }

  // Só mês sem PR salvo pode receber PR à mão.
  if (linha.pr_origem !== "estimado" && linha.pr_origem !== "ausente" && linha.pr_origem !== "digitado") return null;

  if (!aberto) {
    return (
      <button type="button" onClick={() => setAberto(true)}
        className="mt-0.5 block w-full text-right text-[0.7rem] font-medium text-sky-300 underline-offset-2 hover:underline focus-visible:outline-2 focus-visible:outline-sky-400">
        Informar PR
      </button>
    );
  }

  return (
    <div className="mt-1 min-w-[13rem] text-left text-[0.7rem] font-normal text-zinc-300">
      <label className="block">PR de {rotulo} (R$/m³)
        <input type="text" inputMode="decimal" autoComplete="off" className={CAMPO} value={texto} onChange={(e) => digitar(e.target.value)}
          disabled={ocupado} placeholder="-0,0321" aria-invalid={!!problema} aria-describedby={`pr-manual-${chave}`} />
      </label>
      <p id={`pr-manual-${chave}`} className={problema ? "mt-0.5 text-red-300" : "mt-0.5 text-zinc-500"}>
        {problema ?? (meses.length > 1 ? `Vale para ${meses.map((m) => m.split("/")[0]).join(" e ")}: o trimestre da tarifa tem um PR só.` : "O PR vale para o trimestre da tarifa.")}
      </p>
      {valor !== null && !problema && (
        <>
          <label className="mt-1.5 block">Motivo (obrigatório)
            <input type="text" className={CAMPO} value={motivo} onChange={(e) => setMotivo(e.target.value)} disabled={ocupado}
              placeholder="Ex.: valor oficial da Nota Técnica" />
          </label>
          <p className="mt-0.5 text-amber-200">Prévia: o SR já usa {brl(valor, 4)}. Para valer, grave o PR.</p>
        </>
      )}
      <span className="mt-1.5 flex flex-wrap gap-2">
        <Button variant="solid" size="sm" ref={botao} icon={<Save size={13} />} disabled={!podeGravar} onClick={() => setConfirmar(true)}>
          Gravar o PR de {rotulo}
        </Button>
        <Button variant="ghost" size="sm" disabled={ocupado} onClick={desistir}>Usar o estimado</Button>
      </span>
      {erro && <p role="alert" className="mt-1 text-red-300">{erro}</p>}
      {previa}
      <ConfirmarGravacao aberto={confirmar} onFechar={() => setConfirmar(false)} voltarFoco={botao}
        oque={`o PR de ${chave} (à mão)`} rotuloAcao="Gravar o PR" afeta={AFETADOS_DA_TELA.pr}
        onConfirmar={() => void gravar()}
        linhas={[{ rotulo: `PR de ${chave}`, antes: estimadoOriginal ? `${brl(estimadoOriginal, 4)} (estimado, não salvo)` : null, depois: valor === null ? "—" : `${brl(valor, 4)} (manual)` }]}>
        <p>Este PR fica registrado como <b>manual</b>, com o seu nome, a data e o motivo: <i>{motivo.trim()}</i>.</p>
      </ConfirmarGravacao>
    </div>
  );
}
