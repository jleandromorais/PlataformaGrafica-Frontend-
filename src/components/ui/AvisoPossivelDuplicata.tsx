/** Aviso âmbar "Possível duplicata" das provas reais de RP, RET e Auditoria: duas ou mais notas do
 * mesmo grupo com o mesmo valor. O back-end já agrupa (`possiveis_duplicatas_valor`); aqui se mostra
 * e, se a tela passar `aoTirar`, cada nota ganha o botão "Tirar do cálculo" (com confirmação).
 * Tirar uma nota apaga ela do mês gravado e o back-end regrava o total (e o SCG/PR que dependem dele). */
import { useState } from "react";
import { AlertTriangle } from "lucide-react";
import { mensagemDeErro } from "../../api/client";
import { brl } from "../../utils/format";
import { m3 } from "../../utils/format";
import type { Cascata, DetalheDuplicata, PossivelDuplicataValor } from "../../types";
import { usePreviaCascata } from "./usePreviaCascata";
import { Button } from "./Button";

/** "nº 255 · R$ 1.000,00 · 1.234 m³ · vence 10/10/2026": o contexto de uma nota, só com o que o back mandou. */
function textoDoDetalhe(d: DetalheDuplicata | undefined): string {
  if (!d) return "";
  return [
    d.numero ? `nº ${d.numero}` : null,
    brl(d.valor),
    d.volume != null ? m3(d.volume) : null,
    d.vencimento ? `vence ${d.vencimento}` : null,
  ].filter(Boolean).join(" · ");
}

interface Props {
  grupos: PossivelDuplicataValor[] | undefined;
  /** Mês da prova real (ex.: "Fev/2026"), que vai na pergunta de confirmação. */
  periodo?: string | null;
  /** O que o total do mês se chama nesta tela: "RP", "RET" ou "CGR". */
  totalDoMes?: string;
  /** Tira a nota (id gravado) do cálculo. Sem isto, o aviso só informa. */
  aoTirar?: (periodo: string, id: number) => Promise<unknown>;
  /** Chamado depois de tirar com sucesso: a tela recarrega a prova real e o histórico. */
  aoConcluir?: () => void;
  className?: string;
}

export function AvisoPossivelDuplicata({ grupos, periodo, totalDoMes = "total", aoTirar, aoConcluir, className = "" }: Props) {
  const [confirmando, setConfirmando] = useState<number | null>(null);
  const [tirando, setTirando] = useState<number | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  // Tirar uma nota mexe no SCG do mês: o servidor devolve a prévia do SR, PR e PV (que não são regravados sozinhos).
  const { previa, mostrarCascata } = usePreviaCascata("mt-3");
  if (!grupos || grupos.length === 0) return previa;
  const qtdNotas = grupos.reduce((soma, g) => soma + g.qtd, 0);
  const podeTirar = !!aoTirar && !!periodo;

  const tirar = async (id: number) => {
    if (!aoTirar || !periodo) return;
    setTirando(id);
    setErro(null);
    try {
      const r = await aoTirar(periodo, id);
      mostrarCascata((r as { cascata?: Cascata | null } | undefined)?.cascata);
      setConfirmando(null);
      aoConcluir?.();
    } catch (e) {
      setErro(mensagemDeErro(e, "Não foi possível tirar a nota do cálculo. Tente de novo."));
    } finally {
      setTirando(null);
    }
  };

  return (
    <div role="alert" className={`rounded-lg border border-amber-400/40 bg-amber-400/[0.08] px-4 py-3 text-sm text-amber-200 ${className}`}>
      <p className="flex items-center gap-2 font-semibold">
        <AlertTriangle size={16} className="shrink-0" aria-hidden />
        Possível duplicata: {qtdNotas} notas com valor igual neste mês
      </p>

      <ul className="mt-2 space-y-3">
        {grupos.map((g) => (
          <li key={`${g.grupo}-${g.valor}`}>
            <p><b className="tabular-nums">{brl(g.valor)}</b> em {g.qtd} notas ({g.grupo}):</p>
            <ul className="mt-1 space-y-1.5 pl-4">
              {g.notas.map((nome, i) => {
                const id = g.ids?.[i];
                return (
                  <li key={`${nome}-${i}`} className="flex flex-col gap-1.5">
                    <span className="flex flex-wrap items-center gap-x-3 gap-y-1">
                      <span className="break-all">• {nome}</span>
                      {g.detalhes?.[i] && <span className="text-xs tabular-nums text-amber-100/80">{textoDoDetalhe(g.detalhes[i])}</span>}
                      {podeTirar && id !== undefined && confirmando !== id && (
                        <Button variant="warning" size="sm" onClick={() => { setConfirmando(id); setErro(null); }}>
                          Tirar do cálculo
                        </Button>
                      )}
                    </span>
                    {podeTirar && id !== undefined && confirmando === id && (
                      <span className="rounded-md border border-amber-300/30 bg-black/20 px-3 py-2 text-xs">
                        Tirar esta nota do {totalDoMes} de <b>{periodo}</b>? O {totalDoMes} gravado do mês e o SCG
                        são recalculados; o SR, o PR e o PV só mudam depois que você aprovar a prévia. Para trazer a nota de volta, processe e grave o mês de novo.
                        <span className="mt-2 flex gap-2">
                          <Button variant="solid" size="sm" disabled={tirando === id} onClick={() => void tirar(id)}>
                            {tirando === id ? "Tirando…" : "Sim, tirar"}
                          </Button>
                          <Button variant="warning" size="sm" disabled={tirando === id} onClick={() => setConfirmando(null)}>
                            Cancelar
                          </Button>
                        </span>
                      </span>
                    )}
                  </li>
                );
              })}
            </ul>
          </li>
        ))}
      </ul>

      {erro && <p role="alert" className="mt-2 text-xs text-red-300">{erro}</p>}

      <p className="mt-3 text-xs">
        Duas notas do mesmo grupo com o mesmo valor podem ser a mesma nota guardada duas vezes (por exemplo,
        a original e a "atualizada"). Abra os arquivos e confira: se for cópia, tire uma do cálculo. Mantenha
        a de nome mais limpo. Se forem notas diferentes que só têm o mesmo valor, pode ignorar.
      </p>
      {previa}
    </div>
  );
}
