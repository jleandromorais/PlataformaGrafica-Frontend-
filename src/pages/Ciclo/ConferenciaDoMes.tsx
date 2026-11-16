/** "Conferência do mês" do Painel do Ciclo, perto do Processar: antes de gravar, mostra para cada etapa
 * (CGR, CGF, RET, RP) o total do mês, o do mês anterior e quanto variou, e avisa quando
 *  - o total variou mais de 20% (valor "fora do normal"), ou
 *  - uma empresa que mandou arquivo no mês anterior não mandou neste (só CGR e RET).
 * É só um aviso: não bloqueia nada e não grava nada. Servidor antigo (sem a rota): o card nem aparece. */
import { useEffect, useState } from "react";
import { isAxiosError } from "axios";
import { AlertTriangle, CheckCircle2 } from "lucide-react";
import { getConferenciaDoMes } from "../../api";
import { mensagemDeErro } from "../../api/client";
import { EsqueletoLista } from "../../components/ui/EsqueletoLista";
import { brl, num } from "../../utils/format";
import type { ConferenciaDoMes as Conferencia, EtapaDaConferencia } from "../../types";

const NOMES: Record<EtapaDaConferencia, string> = { CGR: "CGR (Auditoria)", CGF: "CGF", RET: "RET", RP: "RP" };

/** Total em reais, ou "—" quando o mês não tem esse valor gravado. */
const totalEmTexto = (v: number | null) => (v === null ? "—" : brl(v));

/** "+25,3%" / "−4,0%" (sem casa quando não há mês anterior para comparar). */
function textoVariacao(pct: number | null): string {
  if (pct === null) return "sem mês anterior";
  const sinal = pct > 0 ? "+" : pct < 0 ? "−" : "";
  return `${sinal}${num(Math.abs(pct), 1)}%`;
}

export function ConferenciaDoMes({ meses, versao }: {
  /** Os 3 meses do trimestre aberto (o mês escolhido começa no último). */
  meses: string[];
  /** Muda quando o Painel recarrega depois de gravar: a conferência busca de novo. */
  versao: number;
}) {
  const [mes, setMes] = useState(meses[meses.length - 1]);
  // Resposta guardada com a chave do pedido: trocar de mês/versão deixa a antiga de lado (aparece o esqueleto até chegar a nova).
  const [res, setRes] = useState<{ chave: string; dados: Conferencia | null; erro: string | null } | null>(null);
  const chave = `${mes}|${versao}`;

  useEffect(() => {
    let vivo = true;
    getConferenciaDoMes(mes)
      .then((dados) => { if (vivo) setRes({ chave, dados, erro: null }); })
      .catch((e) => {
        if (!vivo) return;
        // Sem a rota (servidor antigo): some em silêncio. Outro erro: uma frase no card.
        const antigo = isAxiosError(e) && (e.response?.status === 404 || e.response?.status === 405);
        setRes({ chave, dados: null, erro: antigo ? null : mensagemDeErro(e, "Não foi possível conferir o mês agora.") });
      });
    return () => { vivo = false; };
  }, [mes, chave]);

  const atual = res && res.chave === chave ? res : null;
  if (atual && !atual.dados && !atual.erro) return null; // servidor antigo

  const etapas = atual?.dados?.etapas ?? [];
  const limite = atual?.dados?.limite_pct ?? 20;
  const alertas = etapas.filter((x) => x.fora_do_normal || x.empresas_faltando.length > 0).length;

  return (
    <section aria-labelledby="conferencia-mes-titulo" className="mt-5 rounded-xl border border-white/[0.07] bg-white/[0.02] p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 id="conferencia-mes-titulo" className="text-sm font-semibold text-white">Conferência do mês</h3>
        <div role="group" aria-label="Mês da conferência" className="flex gap-1">
          {meses.map((m) => (
            <button key={m} type="button" aria-pressed={m === mes} onClick={() => setMes(m)}
              className={`rounded-lg border px-2.5 py-1.5 text-xs font-medium focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-400 ${
                m === mes ? "border-sky-400/50 bg-sky-500/15 text-sky-100" : "border-white/[0.1] text-zinc-400 hover:text-white"}`}>
              {m.split("/")[0]}
            </button>
          ))}
        </div>
      </div>
      <p className="mt-1 text-xs text-zinc-500">
        Compara {mes} com {atual?.dados?.periodo_anterior ?? "o mês anterior"}, antes de gravar. É só um aviso: não bloqueia nada. Marca variação acima de {num(limite)}% e empresa que mandou arquivo antes e não mandou agora.
      </p>

      {!atual && <EsqueletoLista linhas={3} icone={false} className="mt-3" texto={`Conferindo ${mes}`} />}
      {atual?.erro && <p role="alert" className="mt-3 text-sm text-red-300">{atual.erro}</p>}

      {atual?.dados && (
        <>
          <p className={`mt-3 flex items-center gap-1.5 text-sm font-medium ${alertas ? "text-amber-300" : "text-emerald-300"}`}>
            {alertas ? <AlertTriangle size={14} aria-hidden /> : <CheckCircle2 size={14} aria-hidden />}
            {alertas ? `${alertas} ${alertas === 1 ? "etapa pede" : "etapas pedem"} um olhar` : "Nada fora do normal em " + mes}
          </p>
          <div className="mt-2 overflow-x-auto">
            <table className="w-full min-w-[30rem] text-xs">
              <thead className="text-left text-zinc-500">
                <tr>
                  <th scope="col" className="py-1.5 font-medium">Etapa</th>
                  <th scope="col" className="py-1.5 text-right font-medium">{mes}</th>
                  <th scope="col" className="py-1.5 text-right font-medium">Mês anterior</th>
                  <th scope="col" className="py-1.5 text-right font-medium">Variação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.05]">
                {etapas.map((x) => {
                  return (
                    <tr key={x.etapa} className="align-top">
                      <td className="py-1.5 text-zinc-300">
                        {NOMES[x.etapa] ?? x.etapa}
                        {x.empresas_faltando.length > 0 && (
                          <span className="mt-0.5 block text-amber-300">
                            {x.empresas_faltando.length === 1 ? "Não mandou neste mês: " : "Não mandaram neste mês: "}
                            {x.empresas_faltando.join(", ")}.
                          </span>
                        )}
                      </td>
                      <td className="py-1.5 text-right tabular-nums text-zinc-200">{totalEmTexto(x.total)}</td>
                      <td className="py-1.5 text-right tabular-nums text-zinc-500">{totalEmTexto(x.total_anterior)}</td>
                      <td className={`py-1.5 text-right tabular-nums ${x.fora_do_normal ? "font-semibold text-amber-300" : "text-zinc-400"}`}>
                        {textoVariacao(x.variacao_pct)}
                        {x.fora_do_normal && <span className="block text-[0.65rem] font-medium">fora do normal</span>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </section>
  );
}
