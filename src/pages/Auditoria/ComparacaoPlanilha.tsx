import { useState } from "react";
import type { AuditoriaComparacao } from "../../types";
import { brl, num } from "../../utils/format";

const TOL = 1; // R$ — abaixo disso é arredondamento

/** Resultado da comparação das notas auditadas com a planilha da Conta Gráfica.
 * O layout vem do `tipo` da comparação (não do nome do modelo):
 *  - por_nota: planilha com uma linha por nota — mostra CGR, notas que faltam de cada lado,
 *    notas com valores diferentes e conferência por supridor;
 *  - por_supridor: planilha só com totais por supridor (volume e CGR);
 *  - generico: só presença das notas.
 * Em qualquer um, "Mostrar diferenças" abre o porquê de cada supridor com diferença. */
export function ComparacaoPlanilha({ comparacao: c, className }: { comparacao: AuditoriaComparacao; className: string }) {
  const [mostrarDif, setMostrarDif] = useState(false);
  const porNota = c.tipo === "por_nota";
  const porSupridor = c.tipo === "por_supridor";
  const comModelo = porNota || porSupridor;
  const fontes: [string, number | null][] = (c.fontes_cgr ?? []).map((f) => [f.rotulo, f.valor]);
  const aud = c.cgr_auditoria ?? 0;
  const divergeTotal = fontes.some(([, v]) => v !== null && Math.abs(aud - v) > TOL);
  const difEmpresas = comModelo ? c.por_empresa.filter((e) => !e.confere) : [];
  const temDivergencia = divergeTotal || c.divergencias_valor.length > 0 || difEmpresas.length > 0
    || c.notas_apenas_auditoria.length > 0 || c.notas_apenas_planilha.length > 0;

  return (
    <section className={className}>
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-base font-semibold text-white">Comparação com a planilha ({c.periodo})</h2>
        {comModelo && (
          <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${temDivergencia ? "bg-rose-500/15 text-rose-300" : "bg-emerald-500/15 text-emerald-300"}`}>
            {temDivergencia ? "Há divergências" : "Tudo confere"}
          </span>
        )}
      </div>
      <p className="mt-0.5 text-sm text-zinc-400">
        {comModelo ? `${c.modelo_rotulo} · ` : "Aba usada: "}
        {c.abas_do_periodo.join(", ") || <span className="text-amber-300">nenhuma aba corresponde ao mês</span>}
      </p>

      {comModelo && fontes.length > 0 && (
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wide text-zinc-500">
                <th className="pb-2 font-medium">CGR</th>
                <th className="pb-2 text-right font-medium">Valor</th>
                <th className="pb-2 text-right font-medium">Auditoria − planilha</th>
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
                  <td className={`py-2 text-right font-semibold tabular-nums ${v === null ? "" : Math.abs(aud - v) > TOL ? "text-rose-300" : "text-emerald-300"}`}>
                    {v === null ? "" : Math.abs(aud - v) > TOL ? brl(aud - v) : "confere"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {c.notas_mes_na_planilha && (
        <div className="mt-4 grid grid-cols-2 gap-3 text-center sm:grid-cols-4">
          {([
            ["Batem", c.qtd_em_ambas - (c.divergencias_valor?.length ?? 0), "text-emerald-300"],
            ["Valor diferente", c.divergencias_valor?.length ?? 0, "text-rose-300"],
            ["Só na auditoria", c.notas_apenas_auditoria.length, "text-amber-300"],
            ["Só na planilha", c.notas_apenas_planilha.length, "text-amber-300"],
          ] as const).filter(([r]) => porNota || r !== "Valor diferente").map(([r, v, cor]) => (
            <div key={r} className="rounded-xl border border-white/[0.05] bg-white/[0.015] py-3">
              <p className={`text-2xl font-bold tabular-nums ${v ? cor : "text-zinc-500"}`}>{v}</p>
              <p className="text-xs text-zinc-400">{r}</p>
            </div>
          ))}
        </div>
      )}

      {c.divergencias_valor?.length > 0 && (
        <details open className="mt-4 text-sm">
          <summary className="cursor-pointer font-medium text-rose-300 hover:text-rose-200">
            Notas com valores diferentes ({c.divergencias_valor.length})
          </summary>
          <div className="mt-2 max-h-72 overflow-auto">
            <table className="w-full text-xs">
              <thead className="sticky top-0 bg-panel">
                <tr className="text-left uppercase tracking-wide text-zinc-500">
                  <th className="py-1.5 font-medium">Nota</th>
                  <th className="py-1.5 font-medium">O que diverge</th>
                  <th className="py-1.5 text-right font-medium">CGR auditoria</th>
                  <th className="py-1.5 text-right font-medium">CGR planilha</th>
                  <th className="py-1.5 text-right font-medium">Diferença</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.05]">
                {c.divergencias_valor.map((d) => (
                  <tr key={`${d.empresa}-${d.numero}`} title={`Volume ${num(d.volume_auditoria)} × ${num(d.volume_planilha)} m³ · alíquota ${d.aliquota_auditoria} × ${d.aliquota_planilha}`}>
                    <td className="py-1.5 text-zinc-300">{d.empresa} {d.numero}<span className="ml-1 text-zinc-500">· linha {d.linha_excel}</span></td>
                    <td className="py-1.5 text-rose-300">
                      {d.motivos.join(", ")}
                      {d.explicacao && <span className="mt-0.5 block text-zinc-400">{d.explicacao}</span>}
                    </td>
                    <td className="py-1.5 text-right tabular-nums text-zinc-300">{brl(d.cgr_auditoria)}</td>
                    <td className="py-1.5 text-right tabular-nums text-zinc-300">{brl(d.cgr_planilha)}</td>
                    <td className="py-1.5 text-right font-semibold tabular-nums text-rose-300">{Math.abs(d.diferenca_cgr) > TOL ? brl(d.diferenca_cgr) : "—"}</td>
                  </tr>
                ))}
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
                <tr className="text-left uppercase tracking-wide text-zinc-500">
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
                    <td className="py-1.5 text-zinc-300">{e.empresa}</td>
                    <td className={`py-1.5 text-right tabular-nums ${e.qtd_auditoria === e.qtd_planilha ? "text-zinc-400" : "text-amber-300"}`}>{e.qtd_auditoria} / {e.qtd_planilha}</td>
                    <td className="py-1.5 text-right tabular-nums text-zinc-300">{brl(e.cgr_auditoria)}</td>
                    <td className="py-1.5 text-right tabular-nums text-zinc-300">{brl(e.cgr_planilha)}</td>
                    <td className={`py-1.5 text-right font-semibold tabular-nums ${e.confere ? "text-emerald-300" : "text-rose-300"}`}>{e.confere ? "confere" : brl(e.diferenca)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </details>
      )}

      {comModelo && c.por_empresa.length > 0 && (
        <div className="mt-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className={`text-sm font-medium ${difEmpresas.length ? "text-rose-300" : "text-emerald-300"}`}>
              {difEmpresas.length ? `${difEmpresas.length} supridor(es) com diferença` : "Todos os supridores conferem com a planilha"}
            </p>
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
                  <li key={e.empresa} className="rounded-xl border border-rose-500/20 bg-rose-500/[0.04] p-3">
                    <p className="text-sm font-semibold text-zinc-100">{e.empresa}</p>
                    <dl className="mt-1.5 grid grid-cols-[auto_1fr_1fr_1fr] gap-x-4 gap-y-0.5 text-xs tabular-nums">
                      <dt />
                      <dd className="text-right text-zinc-500">Notas</dd>
                      <dd className="text-right text-zinc-500">Planilha</dd>
                      <dd className="text-right text-zinc-500">Diferença</dd>
                      <dt className="text-zinc-400">CGR</dt>
                      <dd className="text-right text-zinc-300">{brl(e.cgr_auditoria)}</dd>
                      <dd className="text-right text-zinc-300">{brl(e.cgr_planilha)}</dd>
                      <dd className={`text-right font-semibold ${difCgr ? "text-rose-300" : "text-emerald-300"}`}>{difCgr ? brl(e.diferenca) : "confere"}</dd>
                      {e.volume_auditoria !== undefined && (
                        <>
                          <dt className="text-zinc-400">Volume (m³)</dt>
                          <dd className="text-right text-zinc-300">{num(e.volume_auditoria)}</dd>
                          <dd className="text-right text-zinc-300">{num(e.volume_planilha ?? 0)}</dd>
                          <dd className={`text-right font-semibold ${difVol ? "text-rose-300" : "text-emerald-300"}`}>{difVol ? num(e.diferenca_volume ?? 0) : "confere"}</dd>
                        </>
                      )}
                    </dl>
                    <p className="mt-2 text-xs font-medium uppercase tracking-wide text-zinc-500">Por que difere</p>
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
                  <tr className="text-left uppercase tracking-wide text-zinc-500">
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
                      <td className="py-1.5 text-zinc-300">{e.empresa}</td>
                      <td className={`py-1.5 text-right tabular-nums ${Math.abs(e.diferenca_volume ?? 0) > 1 ? "text-amber-300" : "text-zinc-400"}`}>{num(e.volume_auditoria ?? 0)} / {num(e.volume_planilha ?? 0)}</td>
                      <td className="py-1.5 text-right tabular-nums text-zinc-300">{brl(e.cgr_auditoria)}</td>
                      <td className="py-1.5 text-right tabular-nums text-zinc-300">{brl(e.cgr_planilha)}</td>
                      <td className={`py-1.5 text-right font-semibold tabular-nums ${e.confere ? "text-emerald-300" : "text-rose-300"}`}>{e.confere ? "confere" : brl(e.diferenca)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </details>}
        </div>
      )}

      {(["notas_apenas_auditoria", "notas_apenas_planilha"] as const).map((k) =>
        c[k].length > 0 && (
          <details key={k} open className="mt-3 text-sm">
            <summary className="cursor-pointer font-medium text-amber-300 hover:text-amber-200">
              {k === "notas_apenas_auditoria" ? "Notas que vieram nos arquivos e NÃO estão na planilha" : "Notas que estão na planilha e NÃO vieram nos arquivos"} ({c[k].length})
            </summary>
            <ul className="mt-2 max-h-48 space-y-0.5 overflow-y-auto font-mono text-xs text-zinc-400">
              {c[k].map((n, i) => {
                const valor = (n.cgr_liquido ?? n.cgr_planilha) as number | undefined;
                return (
                  <li key={i}>
                    {[n.empresa, n.tipo, n.numero, n.linha_excel && `linha ${n.linha_excel}`, typeof valor === "number" && brl(valor)]
                      .filter(Boolean).join(" · ")}
                  </li>
                );
              })}
            </ul>
          </details>
        ))}

      {c.avisos.map((a) => (
        <p key={a} className={`mt-2 text-xs ${a.startsWith("CGR confere") ? "text-emerald-300" : a.startsWith("CGR DIVERGENTE") ? "font-medium text-rose-300" : "text-amber-300"}`}>{a}</p>
      ))}
    </section>
  );
}
