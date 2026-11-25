import { useState } from "react";
import { AlertTriangle } from "lucide-react";
import type { AuditoriaComparacao, NotaSoNaPlanilha } from "../../types";
import { incluirNotaAuditoria } from "../../api";
import { mensagemDeErro } from "../../api/client";
import { Conferencia } from "../../components/ui/Conferencia";
import { usePreviaCascata } from "../../components/ui/usePreviaCascata";
import { ID_QUADRO_COMPARACAO, irParaSecao, useIrParaSecao } from "../../components/ui/useIrParaSecao";
import { brl, num } from "../../utils/format";
import { pedidoDeInclusao, podeIncluirNota } from "./incluirNota";
import { ID_GRAVAR_MES } from "../Ciclo/gravarDoMes";
import { TOL, cgrDaNota, cgrDifere, empresaDa, parearMesmoValor, resumoDaComparacao, separarAvisos, type SecaoDaComparacao } from "./comparacaoResumo";
import { Button } from "../../components/ui/Button";

/** "Empresa · NF-e · 123 · linha 10 · R$ 1.000,00": a nota numa linha. */
const textoDaNota = (n: Record<string, unknown>) => {
  const valor = cgrDaNota(n);
  return [n.empresa ?? n.supridor, n.tipo, n.numero, n.linha_excel && `linha ${n.linha_excel}`, valor !== undefined && brl(valor)]
    .filter(Boolean).join(" · ");
};

/** Resultado da comparação das notas auditadas com a planilha da Conta Gráfica.
 * O layout vem do `tipo` da comparação (não do nome do modelo):
 *  - por_nota: planilha com uma linha por nota — mostra CGR, notas que faltam de cada lado,
 *    notas com valores diferentes e conferência por supridor;
 *  - por_supridor: planilha só com totais por supridor (volume e CGR);
 *  - generico: só presença das notas.
 * Em qualquer um, "Mostrar diferenças" abre o porquê de cada supridor com diferença.
 * A comparação não grava nada; só o botão "Incluir esta nota" (nota que só está na planilha) grava, e só em mês já gravado. */
export function ComparacaoPlanilha({ comparacao: c, className, aoIncluirNota, mesGravado = true }: {
  comparacao: AuditoriaComparacao;
  className: string;
  /** Chamado depois de incluir uma nota: quem usa recarrega o histórico/CGR gravado. */
  aoIncluirNota?: () => void;
  /** O mês já tem notas gravadas? Sem isso o back recusa "Incluir esta nota" (o CGR viraria só a nota): o botão leva ao passo "Gravar o mês". */
  mesGravado?: boolean;
}) {
  const [mostrarDif, setMostrarDif] = useState(false);
  // Regra única: tudo que mostra um problema é clicável e leva ao detalhe (rola, abre o que está fechado e destaca por ~2 s).
  const { idDe: idSecao, ir } = useIrParaSecao();
  // Lista "Só na planilha" / "Só nos arquivos" filtrada por uma empresa (clique no item do resumo).
  const [filtro, setFiltro] = useState<string | null>(null);
  const irPara = (secao: SecaoDaComparacao, empresa?: string) => {
    if (secao === "planilha" || secao === "arquivos") setFiltro(empresa ?? null);
    if (secao === "supridores") setMostrarDif(true); // abre "Mostrar diferenças"
    // Espera o React desenhar a lista (aberta ou filtrada) antes de rolar até ela.
    window.requestAnimationFrame(() => window.requestAnimationFrame(() => ir(secao === "supridores" && empresa ? `sup-${empresa}` : secao)));
  };
  const porNota = c.tipo === "por_nota";
  const porSupridor = c.tipo === "por_supridor";
  const comModelo = porNota || porSupridor;
  const fontes: [string, number | null][] = (c.fontes_cgr ?? []).map((f) => [f.rotulo, f.valor]);
  const aud = c.cgr_auditoria ?? 0;
  const divergeTotal = fontes.some(([, v]) => v !== null && Math.abs(aud - v) > TOL);
  const difEmpresas = comModelo ? c.por_empresa.filter((e) => !e.confere) : [];
  const temDivergencia = divergeTotal || c.divergencias_valor.length > 0 || difEmpresas.length > 0
    || c.notas_apenas_auditoria.length > 0 || c.notas_apenas_planilha.length > 0;
  // A mesma nota nos dois lados (número/empresa lidos diferente) sai das listas de "só de um lado".
  const pareamento = parearMesmoValor(c.notas_apenas_auditoria, c.notas_apenas_planilha);
  const { veredito, leitura } = separarAvisos(c.avisos);
  const resumo = resumoDaComparacao(c, pareamento, veredito);
  const pontos = resumo.itens.length;
  const algumCgrDifere = c.divergencias_valor.some(cgrDifere);
  const batem = c.notas_em_ambas ?? [];                         // o back antigo não manda: sem lista, "Batem" fica sem clique
  const soDaEmpresa = (n: Record<string, unknown>) => !filtro || empresaDa(n) === filtro;
  const aSerVista: SecaoDaComparacao | null = difEmpresas.length ? "supridores" : c.divergencias_valor.length ? "diferentes" : null; // para onde leva a diferença do total

  // Supridor com diferença: o nome vira botão que abre o cartão "Por que difere" dele. Só com modelo (tem explicações).
  const nomeDoSupridor = (e: { empresa: string; confere: boolean }) =>
    !e.confere && comModelo ? (
      <button type="button" onClick={() => irPara("supridores", e.empresa)}
        aria-label={`${e.empresa}: com diferença. Mostrar por que difere`}
        className="rounded text-left underline-offset-2 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-300">
        {e.empresa} <span className="text-[0.65rem] font-medium text-amber-200/80">por quê →</span>
      </button>
    ) : e.empresa;

  return (
    <section id={ID_QUADRO_COMPARACAO} className={`realce-secao ${className}`}>
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-base font-semibold text-white">Comparação com a planilha ({c.periodo})</h2>
        {comModelo && (
          <Conferencia
            confere={!temDivergencia}
            className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${!temDivergencia ? "bg-emerald-400/10" : divergeTotal ? "bg-red-400/10" : "bg-amber-400/10"}`}
          >
            {temDivergencia ? `${pontos} ${pontos === 1 ? "ponto" : "pontos"} para conferir` : "Tudo confere"}
          </Conferencia>
        )}
      </div>
      <p className="mt-0.5 text-sm text-zinc-400">
        Nada foi gravado: isto é só uma conferência.{" "}
        {comModelo ? `${c.modelo_rotulo} · ` : "Aba usada: "}
        {c.abas_do_periodo.join(", ") || <span className="text-amber-300">nenhuma aba corresponde ao mês</span>}
      </p>

      {/* Resumo em linguagem simples: o veredito e as causas. Os detalhes vêm abaixo. */}
      <div className={`mt-4 rounded-xl border p-3 text-sm ${resumo.confere ? "border-emerald-400/20 bg-emerald-400/[0.04]" : "border-white/[0.08] bg-white/[0.03]"}`}>
        {resumo.confere || divergeTotal
          ? <Conferencia confere={resumo.confere} quebrar className="font-semibold">{resumo.frase}</Conferencia>
          : (
            // CGR confere, mas há notas para olhar: âmbar, não vermelho.
            <span className="inline-flex items-start gap-1 font-semibold text-amber-300">
              <AlertTriangle size={13} strokeWidth={2.5} aria-hidden className="mt-0.5 shrink-0" />{resumo.frase}
            </span>
          )}
        {resumo.itens.length > 0 && (
          <ul className="mt-2 list-disc space-y-1 pl-5 text-zinc-300">
            {resumo.itens.map((i) => (
              <li key={i.texto} className={i.gravidade === "dinheiro" ? "marker:text-red-400" : "marker:text-amber-400"}>
                {i.secao ? (
                  // Item de problema: um clique leva às notas responsáveis.
                  <button type="button" onClick={() => irPara(i.secao!, i.empresa)}
                    aria-label={`${i.texto} Mostrar quais`}
                    className="text-left underline-offset-2 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-300">
                    {i.texto} <span className="whitespace-nowrap text-xs font-medium text-amber-200/80">Ver →</span>
                  </button>
                ) : i.texto}
              </li>
            ))}
          </ul>
        )}
      </div>

      {comModelo && fontes.length > 0 && (
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-zinc-500">
                <th className="pb-2 font-medium">CGR</th>
                <th className="pb-2 text-right font-medium">Valor</th>
                <th className="pb-2 text-right font-medium">Diferença (notas − planilha)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.05]">
              <tr>
                <td className="py-2 text-zinc-300">Auditoria (notas lidas)</td>
                <td className="py-2 text-right font-semibold tabular-nums text-zinc-100">{brl(aud)}</td>
                <td />
              </tr>
              {fontes.map(([rotulo, v]) => (
                <tr key={rotulo}>
                  <td className="py-2 text-zinc-300">Planilha · {rotulo}</td>
                  <td className="py-2 text-right tabular-nums text-zinc-300">{v === null ? <span className="text-zinc-500">não tem este mês</span> : brl(v)}</td>
                  <td className="py-2 text-right font-semibold num">
                    {v !== null && (Math.abs(aud - v) > TOL && aSerVista ? (
                      // Diferença no total: leva ao porquê (supridores ou notas com valor diferente).
                      <button type="button" onClick={() => irPara(aSerVista)}
                        aria-label={`Diferença de ${brl(aud - v)} no total. Mostrar o porquê`}
                        className="rounded underline-offset-2 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-300">
                        <Conferencia confere={false}>{brl(aud - v)}</Conferencia>
                      </button>
                    ) : (
                      <Conferencia confere={Math.abs(aud - v) <= TOL}>{Math.abs(aud - v) > TOL ? brl(aud - v) : undefined}</Conferencia>
                    ))}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {c.notas_mes_na_planilha && (
        <div className={`mt-4 grid grid-cols-2 gap-3 text-center ${porNota && pareamento.pares.length ? "sm:grid-cols-5" : "sm:grid-cols-4"}`}>
          {([
            ["Batem", c.qtd_em_ambas - (c.divergencias_valor?.length ?? 0), "text-emerald-300", batem.length ? "batem" : null],
            ["Valor diferente", c.divergencias_valor?.length ?? 0, algumCgrDifere ? "text-red-300" : "text-amber-300", "diferentes"],
            ["Mesma nota dos dois lados", pareamento.pares.length, "text-amber-300", "pares"],
            ["Só nos arquivos", pareamento.restoAuditoria.length, "text-amber-300", "arquivos"],
            ["Só na planilha", pareamento.restoPlanilha.length, "text-amber-300", "planilha"],
          ] as const)
            .filter(([r, v]) => (porNota || r !== "Valor diferente") && (v > 0 || r !== "Mesma nota dos dois lados"))
            .map(([r, v, cor, secao]) => {
              const conteudo = (
                <>
                  <p className={`text-2xl font-bold tabular-nums ${v ? cor : "text-zinc-500"}`}>{v}</p>
                  <p className="text-xs text-zinc-400">{r}</p>
                </>
              );
              // Com notas e com lista própria, o contador vira botão que leva até a lista.
              // "Batem" (verde) é a exceção aprovada à regra "só problema é clicável": abre as notas que conferem.
              return secao && v > 0 ? (
                <button key={r} type="button" onClick={() => irPara(secao)}
                  aria-label={`${r}: ${v}. Mostrar quais`}
                  className={`card-hover rounded-xl border border-white/[0.05] bg-white/[0.015] py-3 transition focus-visible:outline-2 focus-visible:outline-offset-2 ${secao === "batem"
                    ? "hover:border-emerald-300/40 hover:bg-emerald-300/[0.04] focus-visible:outline-emerald-300"
                    : "hover:border-amber-300/40 hover:bg-amber-300/[0.04] focus-visible:outline-amber-300"}`}>
                  {conteudo}
                  <span className={`mt-0.5 block text-[0.65rem] font-medium ${secao === "batem" ? "text-emerald-200/80" : "text-amber-200/80"}`}>ver quais ↓</span>
                </button>
              ) : (
                <div key={r} className="card-hover rounded-xl border border-white/[0.05] bg-white/[0.015] py-3">{conteudo}</div>
              );
            })}
        </div>
      )}

      {pareamento.pares.length > 0 && (
        <details open id={idSecao("pares")} className="mt-4 text-sm realce-secao">
          <summary className="cursor-pointer font-medium text-amber-300 hover:text-amber-200">
            Parecem a mesma nota (número ou empresa lidos de outro jeito) ({pareamento.pares.length})
          </summary>
          <p className="mt-1 text-xs text-zinc-400">O CGR é o mesmo nos dois lados. Confira no PDF se é a mesma nota; se for, não falta nada.</p>
          <ul className="mt-2 max-h-72 space-y-2 overflow-y-auto text-xs">
            {pareamento.pares.map((p, i) => (
              <li key={i} className="rounded-lg border border-white/[0.06] bg-white/[0.02] px-3 py-2 font-mono text-zinc-400">
                <span className="block"><span className="font-sans text-zinc-500">Nos arquivos: </span>{textoDaNota(p.auditoria)}</span>
                <span className="block"><span className="font-sans text-zinc-500">Na planilha: </span>{textoDaNota(p.planilha)}</span>
              </li>
            ))}
          </ul>
        </details>
      )}

      {pareamento.restoPlanilha.length > 0 && (
        <details open id={idSecao("planilha")} className="mt-3 text-sm realce-secao">
          <summary className="cursor-pointer font-medium text-amber-300 hover:text-amber-200">
            Notas que estão na planilha e NÃO vieram nos arquivos ({pareamento.restoPlanilha.length})
          </summary>
          <FiltroAtivo filtro={filtro} aoLimpar={() => setFiltro(null)} />
          <ul className="mt-2 max-h-72 space-y-1 overflow-y-auto font-mono text-xs text-zinc-400">
            {pareamento.restoPlanilha.filter(soDaEmpresa).map((n, i) => (
              <li key={i}>
                {/* Só a nota da planilha com CGR (modelo por nota) pode ser incluída no mês. */}
                {c.periodo && podeIncluirNota(n as NotaSoNaPlanilha)
                  ? <IncluirNota nota={n as NotaSoNaPlanilha} texto={textoDaNota(n)} periodo={c.periodo} aoIncluir={aoIncluirNota} mesGravado={mesGravado} />
                  : textoDaNota(n)}
              </li>
            ))}
          </ul>
        </details>
      )}

      {pareamento.restoAuditoria.length > 0 && (
        <details open id={idSecao("arquivos")} className="mt-3 text-sm realce-secao">
          <summary className="cursor-pointer font-medium text-amber-300 hover:text-amber-200">
            Notas que vieram nos arquivos e NÃO estão na planilha ({pareamento.restoAuditoria.length})
          </summary>
          <FiltroAtivo filtro={filtro} aoLimpar={() => setFiltro(null)} />
          <ul className="mt-2 max-h-72 space-y-1 overflow-y-auto font-mono text-xs text-zinc-400">
            {pareamento.restoAuditoria.filter(soDaEmpresa).map((n, i) => <li key={i}>{textoDaNota(n)}</li>)}
          </ul>
        </details>
      )}

      {/* Card "Batem": fechada por padrão; abre ao clicar no card verde. */}
      {batem.length > 0 && (
        <details id={idSecao("batem")} className="mt-3 text-sm realce-secao">
          <summary className="cursor-pointer font-medium text-emerald-300 hover:text-emerald-200">
            Notas que conferem ({batem.length})
          </summary>
          <ul className="mt-2 max-h-72 space-y-1 overflow-y-auto font-mono text-xs text-zinc-400">
            {batem.map((n, i) => <li key={i}>{textoDaNota(n as Record<string, unknown>)}</li>)}
          </ul>
        </details>
      )}

      {c.divergencias_valor?.length > 0 && (
        <details open id={idSecao("diferentes")} className="mt-4 text-sm realce-secao">
          <summary className={`cursor-pointer font-medium ${algumCgrDifere ? "text-red-300 hover:text-red-200" : "text-amber-300 hover:text-amber-200"}`}>
            Notas com valores diferentes ({c.divergencias_valor.length})
          </summary>
          <div className="mt-2 max-h-72 overflow-auto">
            <table className="w-full text-xs">
              <thead className="sticky top-0 bg-panel">
                <tr className="text-left text-zinc-500">
                  <th className="py-1.5 pr-3 font-medium">Nota</th>
                  <th className="px-3 py-1.5 font-medium">O que diverge</th>
                  <th className="px-3 py-1.5 text-right font-medium">CGR auditoria</th>
                  <th className="px-3 py-1.5 text-right font-medium">CGR planilha</th>
                  <th className="py-1.5 pl-3 text-right font-medium">Diferença</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.05]">
                {c.divergencias_valor.map((d) => {
                  const difere = cgrDifere(d);
                  return (
                    <tr key={`${d.empresa}-${d.numero}`} title={`Volume ${num(d.volume_auditoria)} × ${num(d.volume_planilha)} m³ · alíquota ${d.aliquota_auditoria} × ${d.aliquota_planilha}`}>
                      <td className="py-1.5 pr-3 text-zinc-300">{d.empresa} {d.numero}<span className="ml-1 text-zinc-500">· linha {d.linha_excel}</span></td>
                      <td className={`px-3 py-1.5 ${difere ? "text-red-300" : "text-amber-300"}`}>
                        {/* CGR igual: só o volume/alíquota difere, não muda o total (âmbar, não vermelho). */}
                        {difere ? d.motivos.join(", ")
                          : `Só ${d.motivos.map((m) => (m.startsWith("alíquota") ? `a ${m}` : m.startsWith("nota") ? m : `o ${m}`)).join(" e ")} `
                            + `${d.motivos.length > 1 ? "diferem" : "difere"} (CGR igual)`}
                        {d.explicacao && <span className="mt-0.5 block text-zinc-400">{d.explicacao}</span>}
                      </td>
                      <td className="px-3 py-1.5 text-right tabular-nums text-zinc-300">{brl(d.cgr_auditoria)}</td>
                      <td className="px-3 py-1.5 text-right tabular-nums text-zinc-300">{brl(d.cgr_planilha)}</td>
                      <td className="py-1.5 pl-3 text-right font-semibold num">{difere ? <Conferencia confere={false}>{brl(d.diferenca_cgr)}</Conferencia> : <span className="text-zinc-500">—</span>}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </details>
      )}

      {!porSupridor && c.por_empresa?.length > 0 && (
        <details open={c.por_empresa.some((e) => !e.confere)} className="mt-3 text-sm">
          <summary className="cursor-pointer text-zinc-300 hover:text-white">
            Conferência por supridor ({c.por_empresa.filter((e) => !e.confere).length} com divergência)
          </summary>
          <div className="mt-2 overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-left text-zinc-500">
                  <th className="py-1.5 font-medium">Supridor</th>
                  <th className="py-1.5 text-right font-medium">Notas aud. / plan.</th>
                  <th className="py-1.5 text-right font-medium">CGR auditoria</th>
                  <th className="py-1.5 text-right font-medium">CGR planilha</th>
                  <th className="py-1.5 text-right font-medium">Diferença</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.05]">
                {c.por_empresa.map((e) => (
                  <tr key={e.empresa}>
                    <td className="py-1.5 text-zinc-300">{nomeDoSupridor(e)}</td>
                    <td className={`py-1.5 text-right tabular-nums ${e.qtd_auditoria === e.qtd_planilha ? "text-zinc-400" : "text-amber-300"}`}>{e.qtd_auditoria} / {e.qtd_planilha}</td>
                    <td className="py-1.5 text-right tabular-nums text-zinc-300">{brl(e.cgr_auditoria)}</td>
                    <td className="py-1.5 text-right tabular-nums text-zinc-300">{brl(e.cgr_planilha)}</td>
                    <td className="py-1.5 text-right font-semibold num"><Conferencia confere={e.confere}>{e.confere ? undefined : brl(e.diferenca)}</Conferencia></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </details>
      )}

      {comModelo && c.por_empresa.length > 0 && (
        <div id={idSecao("supridores")} className="mt-4 realce-secao">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <Conferencia confere={!difEmpresas.length} className="text-sm font-medium">
              {difEmpresas.length ? `${difEmpresas.length} supridor(es) com diferença` : "Todos os supridores conferem com a planilha"}
            </Conferencia>
            {difEmpresas.length > 0 && (
              <button
                type="button"
                onClick={() => setMostrarDif((v) => !v)}
                aria-expanded={mostrarDif}
                className="rounded-lg border border-white/10 bg-white/[0.03] px-3 py-1.5 text-xs font-medium text-zinc-200 transition hover:bg-white/[0.07]"
              >
                {mostrarDif ? "Ocultar diferenças" : "Mostrar diferenças"}
              </button>
            )}
          </div>

          {mostrarDif && difEmpresas.length > 0 && (
            <ul className="mt-3 space-y-3">
              {difEmpresas.map((e) => {
                const difCgr = Math.abs(e.diferenca) > TOL;
                const difVol = Math.abs(e.diferenca_volume ?? 0) > 1;
                return (
                  <li key={e.empresa} id={idSecao(`sup-${e.empresa}`)} className="rounded-xl border border-red-400/20 bg-red-400/[0.04] p-3 realce-secao">
                    <p className="text-sm font-semibold text-zinc-100">{e.empresa}</p>
                    <dl className="mt-1.5 grid grid-cols-[auto_1fr_1fr_1fr] gap-x-4 gap-y-0.5 text-xs tabular-nums">
                      <dt />
                      <dd className="text-right text-zinc-500">Notas</dd>
                      <dd className="text-right text-zinc-500">Planilha</dd>
                      <dd className="text-right text-zinc-500">Diferença</dd>
                      <dt className="text-zinc-400">CGR</dt>
                      <dd className="text-right text-zinc-300">{brl(e.cgr_auditoria)}</dd>
                      <dd className="text-right text-zinc-300">{brl(e.cgr_planilha)}</dd>
                      <dd className="text-right font-semibold"><Conferencia confere={!difCgr}>{difCgr ? brl(e.diferenca) : undefined}</Conferencia></dd>
                      {e.volume_auditoria !== undefined && (
                        <>
                          <dt className="text-zinc-400">Volume (m³)</dt>
                          <dd className="text-right text-zinc-300">{num(e.volume_auditoria)}</dd>
                          <dd className="text-right text-zinc-300">{num(e.volume_planilha ?? 0)}</dd>
                          <dd className="text-right font-semibold"><Conferencia confere={!difVol}>{difVol ? num(e.diferenca_volume ?? 0) : undefined}</Conferencia></dd>
                        </>
                      )}
                    </dl>
                    <p className="mt-2 text-xs font-medium text-zinc-500">Por que difere</p>
                    <ul className="mt-1 list-disc space-y-1 pl-4 text-xs text-zinc-300">
                      {(e.explicacoes?.length ? e.explicacoes : ["Sem causa identificada pelas notas lidas."]).map((t) => <li key={t}>{t}</li>)}
                    </ul>
                  </li>
                );
              })}
            </ul>
          )}

          {porSupridor && <details className="mt-3 text-sm">
            <summary className="cursor-pointer text-zinc-300 hover:text-white">Conferência por supridor ({c.por_empresa.length})</summary>
            <div className="mt-2 overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-left text-zinc-500">
                    <th className="py-1.5 font-medium">Supridor</th>
                    <th className="py-1.5 text-right font-medium">Volume notas / NT (m³)</th>
                    <th className="py-1.5 text-right font-medium">CGR notas</th>
                    <th className="py-1.5 text-right font-medium">CGR NT</th>
                    <th className="py-1.5 text-right font-medium">Diferença</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.05]">
                  {c.por_empresa.map((e) => (
                    <tr key={e.empresa}>
                      <td className="py-1.5 text-zinc-300">{nomeDoSupridor(e)}</td>
                      <td className={`py-1.5 text-right tabular-nums ${Math.abs(e.diferenca_volume ?? 0) > 1 ? "text-amber-300" : "text-zinc-400"}`}>{num(e.volume_auditoria ?? 0)} / {num(e.volume_planilha ?? 0)}</td>
                      <td className="py-1.5 text-right tabular-nums text-zinc-300">{brl(e.cgr_auditoria)}</td>
                      <td className="py-1.5 text-right tabular-nums text-zinc-300">{brl(e.cgr_planilha)}</td>
                      <td className="py-1.5 text-right font-semibold num"><Conferencia confere={e.confere}>{e.confere ? undefined : brl(e.diferenca)}</Conferencia></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </details>}
        </div>
      )}

      {/* Avisos de leitura (OCR, nota casada pelo valor…). O veredito do CGR já está no resumo do topo. */}
      {leitura.length > 0 && (
        <details className="mt-4 text-sm">
          <summary className="cursor-pointer font-medium text-amber-300 hover:text-amber-200">Confira estes PDFs ({leitura.length})</summary>
          <ul className="mt-2 max-w-[72ch] list-disc space-y-1 pl-5 text-xs text-zinc-300">
            {leitura.map((a) => <li key={a}>{a}</li>)}
          </ul>
        </details>
      )}
    </section>
  );
}

/** Uma nota que só está na planilha, com o botão "Incluir esta nota" e a confirmação em duas etapas
 * (mesmo jeito do aviso de possível duplicata). Incluir GRAVA a nota no CGR do mês. */
function IncluirNota({ nota, texto, periodo, aoIncluir, mesGravado }: {
  nota: NotaSoNaPlanilha; texto: string; periodo: string; aoIncluir?: () => void; mesGravado: boolean;
}) {
  const [confirmando, setConfirmando] = useState(false);
  const [motivo, setMotivo] = useState("");
  const [incluindo, setIncluindo] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [cgrNovo, setCgrNovo] = useState<{ valor: number; notas: number } | null>(null);   // CGR do mês e nº de notas depois de incluir
  const { previa, mostrarCascata } = usePreviaCascata("font-sans"); // SR, PR e PV: aprovar no Painel

  const pedido = pedidoDeInclusao(nota, motivo);

  const incluir = async () => {
    if (!pedido) return;
    setIncluindo(true);
    setErro(null);
    try {
      const r = await incluirNotaAuditoria(periodo, pedido);
      setCgrNovo({ valor: r.valor_gravado, notas: r.qtd_itens });
      mostrarCascata(r.cascata);
      setConfirmando(false);
      aoIncluir?.();
    } catch (e) {
      setErro(mensagemDeErro(e, "Não foi possível incluir a nota. Tente de novo."));
    } finally {
      setIncluindo(false);
    }
  };

  return (
    <div className="flex flex-col gap-1.5">
      <span className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <span>{texto}</span>
        {cgrNovo !== null ? (
          <span className="font-sans font-medium text-emerald-300">incluída · o mês tem {cgrNovo.notas} notas · CGR agora {brl(cgrNovo.valor)}</span>
        ) : !mesGravado ? (
          // O back recusa: sem notas gravadas o CGR do mês viraria só esta nota. Primeiro grava-se o mês.
          <Button variant="ghost" size="sm" onClick={() => { irParaSecao(ID_GRAVAR_MES); }}>
            Grave o mês antes de incluir
          </Button>
        ) : !confirmando && (
          <Button variant="warning" size="sm" onClick={() => { setConfirmando(true); setErro(null); }}>
            Incluir esta nota
          </Button>
        )}
      </span>

      {confirmando && cgrNovo === null && (
        <div className="rounded-md border border-amber-300/30 bg-amber-400/[0.06] px-3 py-2 font-sans text-xs text-amber-200">
          <p>
            Incluir esta nota no CGR de <b>{periodo}</b> com o valor da planilha: <b className="tabular-nums">{brl(nota.cgr_planilha!)}</b>.
            {" "}Isto <b>grava</b> a nota no mês; o CGR, o RPV e o SCG são recalculados. O SR, o PR e o PV só mudam depois que você aprovar no Painel.
          </p>
          <label className="mt-2 block">
            <span className="text-amber-100">Motivo (obrigatório)</span>
            <input type="text" value={motivo} onChange={(e) => setMotivo(e.target.value)} disabled={incluindo}
              placeholder="Ex.: a Copergás não mandou a nota; valor da planilha"
              className="mt-1 w-full rounded-md border border-amber-300/30 bg-black/20 px-2 py-1 text-xs text-white placeholder:text-zinc-500 focus:outline-none focus-visible:border-amber-300" />
          </label>
          <span className="mt-2 flex flex-wrap gap-2">
            <Button variant="solid" size="sm" disabled={!pedido || incluindo} onClick={() => void incluir()}>
              {incluindo ? "Incluindo…" : `Incluir no CGR de ${periodo}`}
            </Button>
            <Button variant="warning" size="sm" disabled={incluindo} onClick={() => { setConfirmando(false); setErro(null); }}>
              Cancelar
            </Button>
          </span>
          {!motivo.trim() && <p className="mt-1.5 text-zinc-400">Escreva o motivo para liberar o botão.</p>}
        </div>
      )}

      {erro && <p role="alert" className="font-sans text-xs text-red-300">{erro}</p>}
      {previa}
    </div>
  );
}

/** "Mostrando só as notas da TAG · Ver todas": avisa que a lista está filtrada e deixa tirar o filtro. */
function FiltroAtivo({ filtro, aoLimpar }: { filtro: string | null; aoLimpar: () => void }) {
  if (!filtro) return null;
  return (
    <p className="mt-1 flex flex-wrap items-center gap-2 text-xs text-zinc-400">
      Só as notas de <b className="text-zinc-200">{filtro}</b>.
      <button type="button" onClick={aoLimpar}
        className="font-medium text-sky-300 underline-offset-2 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-400">
        Ver todas
      </button>
    </p>
  );
}
