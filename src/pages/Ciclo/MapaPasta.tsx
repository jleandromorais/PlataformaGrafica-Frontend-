/** Mapa da pasta do ciclo: para cada etapa e mês, quantos arquivos o sistema achou (só pelos nomes). */
import { useState } from "react";
import { Button } from "../../components/ui/Button";
import { num } from "../../utils/format";
import { NOMES_ETAPA, mapaDoTrimestre, type CelulaMapa, type Etapa } from "../../utils/pastaCiclo";
import { ICONE } from "./situacaoUI";

export function MapaPasta({ mapa, meses, raiz, total, processar, aberto, lembrada = false }: {
  mapa: ReturnType<typeof mapaDoTrimestre>; meses: string[]; raiz: string; total: number;
  processar?: () => void; // ausente: Painel ainda carregando
  aberto: boolean;        // Processar já aberto abaixo: o botão vira "Recomeçar"
  lembrada?: boolean;     // só os nomes foram lembrados: o navegador não guarda os arquivos depois de recarregar
}) {
  const [aberta, setAberta] = useState<CelulaMapa | null>(null);
  const etapasMapa: Etapa[] = ["auditoria", "cgf", "ret", "conciliacao"];
  const celula = (e: Etapa, m: string) => mapa.celulas.find((c) => c.etapa === e && c.periodo === m)!;
  const problemas = mapa.celulas.filter((c) => c.situacao !== "ok").length;
  return (
    <div className="mt-5">
      <p className="text-sm text-zinc-400">
        <b className="text-zinc-200">{raiz}</b>{lembrada && <span className="text-amber-200"> (pasta lembrada, sem arquivos)</span>}: {num(total)} arquivos {lembrada ? "lembrados" : "lidos"} ·{" "}
        {problemas ? <span className="text-amber-200">{problemas} ponto(s) para conferir</span> : <span className="text-emerald-300">tudo encontrado</span>}
        {" "}· {num(mapa.ignorados)} de outros meses ignorados
      </p>
      {mapa.semMes.length > 0 && (
        <p className="mt-1 text-sm text-amber-200">
          ⚠ {mapa.semMes.length === 1 ? "Esta pasta não tem" : "Estas pastas não têm"} o mês no nome e não foram usadas:{" "}
          {mapa.semMes.map((p) => `“${p.split("/").pop()}”`).join(", ")}. Renomeie com mês e ano (ex.: “09 set-26 NFs”).
        </p>
      )}
      <div className="mt-3 overflow-x-auto">
        <table className="w-full min-w-[36rem] text-sm">
          <thead className="bg-white/[0.03] text-xs text-zinc-400">
            <tr>
              <th className="px-4 py-2.5 text-left font-semibold">Etapa</th>
              {meses.map((m) => <th key={m} className="px-3 py-2.5 text-left font-semibold">{m}</th>)}
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.05]">
            {etapasMapa.map((e) => (
              <tr key={e}>
                <td className="px-4 py-2.5 text-zinc-200">{NOMES_ETAPA[e]}</td>
                {meses.map((m) => {
                  const c = celula(e, m);
                  return (
                    <td key={m} className="px-3 py-2">
                      <button type="button" onClick={() => setAberta(aberta === c ? null : c)}
                        className={`flex items-center gap-1.5 rounded-md px-2 py-1 text-left ${aberta === c ? "bg-white/[0.06]" : "hover:bg-white/[0.04]"}`}>
                        {ICONE[c.situacao]}
                        <span className={c.situacao === "falta" ? "text-zinc-500" : "text-zinc-200"}>
                          {c.situacao === "falta" ? "não achei" : `${num(c.arquivos)} arquivo(s)`}
                        </span>
                      </button>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {aberta && (
        <div className="mt-3 rounded-xl border border-white/[0.07] bg-white/[0.02] p-4 text-sm">
          <p className="font-semibold text-zinc-100">{NOMES_ETAPA[aberta.etapa]} · {aberta.periodo}</p>
          {aberta.conjuntos.length > 0 && (
            <ul className="mt-2 space-y-0.5 text-xs text-zinc-400">
              {aberta.conjuntos.map((c) => <li key={c} className="break-all">📁 {c || "(direto na pasta escolhida)"}</li>)}
            </ul>
          )}
          {aberta.avisos.map((a) => <p key={a} className="mt-2 text-amber-200">⚠ {a}</p>)}
          {aberta.notas.map((a) => <p key={a} className="mt-2 text-zinc-500">{a}</p>)}
          {aberta.situacao === "falta" && (
            <p className="mt-2 text-zinc-400">Não encontrei arquivos desta etapa para {aberta.periodo}. Confira se a pasta do mês existe e tem os arquivos.</p>
          )}
        </div>
      )}
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <Button variant="primary" disabled={!processar} onClick={processar}>
          {aberto ? "Recomeçar o Processar" : `Processar ${meses[0]} a ${meses[2]}`}
        </Button>
        <span className="text-xs text-zinc-500">
          Envia estes arquivos para cada etapa, mostra o resultado e só grava o que você confirmar. Auditoria, CGF, RET e RP.
        </span>
      </div>
    </div>
  );
}
