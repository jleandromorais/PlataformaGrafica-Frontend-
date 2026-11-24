/** "Ao fechar": o que vem depois dos 9 passos e não tem número: a tarifa média (só leitura, fecha no
 * PMPV) e as entregas (minuta da NT, relatório do trimestre e Excel Final). */
import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { FileText, Lock, Scale } from "lucide-react";
import { Alert } from "../../components/ui/Alert";
import { Button } from "../../components/ui/Button";
import { classesDoBotao } from "../../components/ui/estilosBotao";
import { irParaSecao } from "../../components/ui/useIrParaSecao";
import { ID_ENTREGAS } from "./blocoProximoPasso";

export function AoFechar({ tarifa, planilha, onEscolherPlanilha, onGerarNT, gerandoNT, onGerarRelatorio, gerandoRelatorio, erro, carregando }: {
  tarifa: { detalhe: ReactNode; link: string; bloqueio?: { motivo: string; link: string; rotulo: string; rolarPara?: string } };
  /** Nome da planilha oficial escolhida neste trimestre (no passo 2), ou null. */
  planilha: string | null;
  /** "Escolher a planilha": leva ao campo único, no passo 2. */
  onEscolherPlanilha: () => void;
  onGerarNT: () => void;
  gerandoNT: boolean;
  onGerarRelatorio: () => void;
  gerandoRelatorio: boolean;
  erro: string | null;
  carregando: boolean;
}) {
  return (
    <section id={ID_ENTREGAS} aria-labelledby="ao-fechar-titulo" className="scroll-mt-4 overflow-hidden rounded-xl border border-white/[0.07] bg-panel">
      <h2 id="ao-fechar-titulo" className="border-b border-white/[0.07] px-5 py-4 text-base font-semibold text-white">Ao fechar</h2>
      <ul className="divide-y divide-white/[0.05]">
        {!carregando && (
          <li className="flex flex-wrap items-start gap-4 px-5 py-4">
            <Scale size={18} className="mt-0.5 text-zinc-400" aria-hidden />
            <div className="min-w-0 flex-1 basis-60">
              <p className="font-semibold text-zinc-100">Tarifa média</p>
              <p className="text-xs text-zinc-500">PV + margem de distribuição (MB); a tarifa nunca é gravada aqui</p>
              <div className="mt-2 text-sm text-zinc-300">{tarifa.detalhe}</div>
              {tarifa.bloqueio && (
                <p className="mt-1.5 flex items-start gap-1.5 text-sm font-medium text-amber-200">
                  <Lock size={14} className="mt-1 shrink-0" aria-hidden />
                  <span>Bloqueado: {tarifa.bloqueio.motivo}.</span>
                </p>
              )}
            </div>
            {tarifa.bloqueio ? (
              tarifa.bloqueio.rolarPara ? (
                <Button variant="ghost" onClick={() => irParaSecao(tarifa.bloqueio!.rolarPara!)}>{tarifa.bloqueio.rotulo}</Button>
              ) : (
                <Link to={tarifa.bloqueio.link} className={classesDoBotao("ghost", "md")}>{tarifa.bloqueio.rotulo}</Link>
              )
            ) : (
              <Link to={tarifa.link} className={classesDoBotao("ghost", "md")}>Abrir o PMPV</Link>
            )}
          </li>
        )}
        <li className="flex flex-wrap items-center gap-4 px-5 py-4">
          <FileText size={18} className="text-sky-300" aria-hidden />
          <div className="min-w-0 flex-1 basis-60">
            <p className="font-semibold text-zinc-100">Entregas</p>
            <p className="text-xs text-zinc-500">Minuta da Nota Técnica, relatório do trimestre e Excel Final do ciclo</p>
            <p className={`mt-1 text-xs ${planilha ? "text-emerald-400" : "text-amber-300"}`}>
              {planilha ? `O relatório compara as notas com a planilha ${planilha}.` : "Sem planilha, o relatório só confere o sistema com ele mesmo."}
              {!planilha && (
                <> <button type="button" onClick={onEscolherPlanilha} className="font-semibold underline underline-offset-2 hover:text-amber-200">Escolher a planilha</button></>
              )}
            </p>
          </div>
          <Button variant="primary" size="sm" onClick={onGerarNT} disabled={gerandoNT}>{gerandoNT ? "Gerando…" : "Baixar minuta da NT"}</Button>
          <Button variant="primary" size="sm" onClick={onGerarRelatorio} disabled={gerandoRelatorio}>{gerandoRelatorio ? "Gerando…" : "Baixar relatório do trimestre"}</Button>
          <Link to="/excel-final" className={classesDoBotao("ghost", "md")}>Excel Final</Link>
        </li>
      </ul>
      {erro && <div className="px-5 pb-4"><Alert variant="error">{erro}</Alert></div>}
    </section>
  );
}
