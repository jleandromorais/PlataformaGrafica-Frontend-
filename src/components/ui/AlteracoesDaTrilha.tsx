/** Seção "Alterações" da prova real (SCG, SR, PR e PV): quando o valor gravado mudou, de quanto para quanto e
 * por qual caminho (GET /trilha). Não identifica a pessoa, só data, hora, valor antigo e valor novo.
 * Só lê. Servidor antigo (sem a rota): a seção não aparece. */
import { useEffect, useState } from "react";
import { History } from "lucide-react";
import { isAxiosError } from "axios";
import { getTrilha } from "../../api";
import { mensagemDeErro } from "../../api/client";
import { dataHora } from "../../utils/format";
import type { AlteracaoDaTrilha } from "../../types";

/** Nome do campo gravado em texto de gente ("sr_selic" vira "SR com SELIC"). */
const NOMES_DE_CAMPO: Record<string, string> = {
  scg: "SCG", sr: "SR", pr: "PR", pv: "PV", pmpv: "PMPV", vp: "VP", vf: "VF",
  sr_selic: "SR com SELIC", scg_selic: "SCG com SELIC", rpv: "RPV", total: "Total",
};
const nomeDoCampo = (c: string) => NOMES_DE_CAMPO[c] ?? c.replace(/_/g, " ");

/** null = ainda não havia valor (antes) ou o valor foi apagado (depois). */
const valorEmTexto = (v: number | null) => (v === null ? "vazio" : v.toLocaleString("pt-BR", { maximumFractionDigits: 4 }));

/** "salvar" / "cascata" / "apagar" em palavras de gente. */
const ORIGENS: Record<string, string> = { salvar: "Salvo na tela", cascata: "Cascata aprovada", apagar: "Apagado" };

export function AlteracoesDaTrilha({ periodos, rotulo, tabela, versao, className = "" }: {
  /** Chaves em que o valor aberto pode estar guardado: um mês ("Set/2026") ou a chave do trimestre da tarifa
   * ("Fev - Abr/2026"). Com mais de uma, as alterações de todas entram na mesma lista. Vazio ou null: não mostra. */
  periodos: string[] | null;
  /** Como chamar o que está aberto no texto ("Set/2026", "Jan a Mar/2026"). */
  rotulo: string | null;
  /** Tabela que guarda o valor: "consolidacao" (SCG), "sr_resultados", "pr_resultados" ou "pv_resultados". */
  tabela: string;
  /** Muda quando a prova real é recarregada (depois de salvar): a trilha busca de novo. */
  versao?: string | number | null;
  className?: string;
}) {
  const chave = periodos?.length ? `${tabela}|${periodos.join(",")}|${versao ?? ""}` : null;
  // Resposta guardada com a chave do pedido: ao trocar de mês a antiga deixa de valer sem precisar zerar o estado.
  const [res, setRes] = useState<{ chave: string; itens: AlteracaoDaTrilha[] | null; erro: string | null } | null>(null);

  useEffect(() => {
    if (!periodos?.length || !chave) return;
    let vivo = true;
    // Uma busca por chave; as que o servidor recusar (chave que não existe nesta tabela) não derrubam as outras.
    Promise.allSettled(periodos.map((p) => getTrilha(p, tabela))).then((feitas) => {
      if (!vivo) return;
      const ok = feitas.filter((f): f is PromiseFulfilledResult<AlteracaoDaTrilha[]> => f.status === "fulfilled");
      if (ok.length === 0) {
        const e = (feitas[0] as PromiseRejectedResult).reason;
        const semRota = isAxiosError(e) && (e.response?.status === 404 || e.response?.status === 405);
        setRes({ chave, itens: null, erro: semRota ? null : mensagemDeErro(e, "Não foi possível carregar as alterações.") });
        return;
      }
      // Junta, tira repetidas (mesmo id) e deixa a mais recente primeiro.
      const porId = new Map<number, AlteracaoDaTrilha>();
      ok.forEach((f) => f.value.forEach((a) => porId.set(a.id, a)));
      const itens = [...porId.values()].sort((a, b) => (a.data_hora < b.data_hora ? 1 : a.data_hora > b.data_hora ? -1 : b.id - a.id));
      setRes({ chave, itens, erro: null });
    });
    return () => { vivo = false; };
    // `periodos` entra pela chave (texto): o array novo a cada render não refaz a busca.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tabela, chave]);

  const atual = res && res.chave === chave ? res : null;
  if (!periodos?.length || !atual) return null;               // sem mês aberto ou ainda buscando
  if (!atual.itens && !atual.erro) return null;              // servidor antigo
  const itens = atual.itens ?? [];

  return (
    <section aria-label="Alterações" className={`mt-4 border-t border-white/[0.07] pt-4 ${className}`}>
      <details>
        <summary className="flex cursor-pointer items-center gap-2 text-sm font-semibold text-zinc-200 hover:text-white">
          <History size={14} className="text-zinc-400" aria-hidden /> Alterações ({itens.length})
        </summary>
        {atual.erro && <p role="alert" className="mt-2 text-xs text-red-300">{atual.erro}</p>}
        {!atual.erro && itens.length === 0 && (
          <p className="mt-2 text-xs text-zinc-500">Nenhuma alteração registrada para {rotulo ?? periodos[0]}. O que for gravado a partir de agora aparece aqui.</p>
        )}
        {itens.length > 0 && (
          <div className="mt-2 overflow-x-auto">
            <table className="w-full min-w-[30rem] text-xs">
              <caption className="sr-only">Alterações de {rotulo ?? periodos[0]}</caption>
              <thead className="text-left text-zinc-500">
                <tr>
                  <th scope="col" className="py-1.5 pr-3 font-medium">Quando</th>
                  <th scope="col" className="py-1.5 pr-3 font-medium">O que</th>
                  <th scope="col" className="py-1.5 pr-3 text-right font-medium">Antes</th>
                  <th scope="col" className="py-1.5 pr-3 text-right font-medium">Depois</th>
                  <th scope="col" className="py-1.5 font-medium">Por onde</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.05]">
                {itens.map((a) => (
                  <tr key={a.id}>
                    <td className="py-1.5 pr-3 tabular-nums text-zinc-400">{dataHora(a.data_hora)}</td>
                    <td className="py-1.5 pr-3 text-zinc-300">{nomeDoCampo(a.campo)}<span className="block text-[0.65rem] text-zinc-500">{a.periodo}</span></td>
                    <td className="py-1.5 pr-3 text-right tabular-nums text-zinc-400">{valorEmTexto(a.valor_antigo)}</td>
                    <td className="py-1.5 pr-3 text-right font-semibold tabular-nums text-zinc-100">{valorEmTexto(a.valor_novo)}</td>
                    <td className="py-1.5 text-zinc-500">{ORIGENS[a.origem] ?? a.origem}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </details>
    </section>
  );
}
