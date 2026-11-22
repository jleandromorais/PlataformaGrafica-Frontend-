/** A janela "Gravar ...?" padrão das telas que gravam: título, aviso de divergência (se houver),
 * o resumo "Gravado hoje × Passa a ser" e, quando a gravação afeta o que vem à frente, a frase
 * "Depois de gravar, você vai aprovar ... no Painel". É o `ModalAviso` com o texto padrão;
 * quando a janela abre e quando o texto aparece ficam em `utils/confirmarGravacao.ts`. */
import type { ReactNode, RefObject } from "react";
import { ModalAviso } from "./ModalAviso";
import { rotuloDaAcao, textoDepoisDeGravar, tituloDaJanela, type Afetado } from "../../utils/confirmarGravacao";

export interface LinhaDoResumo {
  rotulo: string;
  /** Valor gravado hoje, já formatado; null quando nada está gravado. */
  antes: string | null;
  /** Valor que passa a valer, já formatado. */
  depois: string;
}

export function ConfirmarGravacao({
  aberto, onFechar, onConfirmar, oque, rotuloAcao, linhas, diverge = false, motivos, afeta = [], voltarFoco, children,
}: {
  aberto: boolean;
  onFechar: () => void;
  /** Chamado ao clicar no botão principal (a janela fecha antes). */
  onConfirmar: () => void;
  /** "o SCG de Mar/2026": entra em "Gravar {oque}?". */
  oque: string;
  /** Texto do botão sem divergência, ex.: "Gravar o SCG". */
  rotuloAcao: string;
  linhas: LinhaDoResumo[];
  /** Há divergência: o título e o botão dizem "com divergências". */
  diverge?: boolean;
  /** O que diverge, uma frase por item (só aparece com `diverge`). */
  motivos?: ReactNode[];
  /** O que a gravação deixa desatualizado à frente (SR, PR, PV); vazio = sem a frase. */
  afeta?: Afetado[];
  voltarFoco?: RefObject<HTMLElement | null>;
  /** Texto extra entre o aviso e o resumo. */
  children?: ReactNode;
}) {
  const depois = textoDepoisDeGravar(afeta);
  return (
    <ModalAviso aberto={aberto} onFechar={onFechar} variante="atencao" voltarFoco={voltarFoco}
      rotuloFechar="Cancelar e conferir" titulo={tituloDaJanela(oque, diverge)}
      acao={{ rotulo: rotuloDaAcao(rotuloAcao, diverge), onClick: () => { onFechar(); onConfirmar(); } }}>
      <div className="space-y-3 text-sm">
        {diverge && (
          <div>
            <p>Se continuar, será gravado <b>com as divergências</b>. <b>Cabe ao analista analisar os dados antes de gravar.</b></p>
            {motivos && motivos.length > 0 && (
              <ul className="mt-2 list-disc space-y-0.5 pl-5 text-zinc-300">
                {motivos.map((m, i) => <li key={i}>{m}</li>)}
              </ul>
            )}
          </div>
        )}
        {children}
        <dl className="space-y-1 rounded-lg border border-white/[0.07] bg-white/[0.03] px-4 py-3 tabular-nums">
          {linhas.map((l) => (
            <div key={l.rotulo} className="space-y-1">
              {linhas.length > 1 && <dt className="text-xs font-semibold text-zinc-400">{l.rotulo}</dt>}
              <div className="flex justify-between gap-4">
                <dt className="text-zinc-400">Gravado hoje</dt>
                <dd className="text-zinc-200">{l.antes ?? "nada gravado"}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="font-semibold text-zinc-200">Passa a ser</dt>
                <dd className="font-semibold text-sky-200">{l.depois}</dd>
              </div>
            </div>
          ))}
        </dl>
        {depois && <p className="text-zinc-400">{depois}</p>}
      </div>
    </ModalAviso>
  );
}
