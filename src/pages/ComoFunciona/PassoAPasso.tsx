import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { MODULOS } from "../../components/layout/modulos";
import { classesDoBotao } from "../../components/ui/estilosBotao";
import {
  ETAPAS_DO_CICLO, FASES_DO_CICLO, TOTAL_DE_PASSOS, type ChaveEtapa, type EtapaDoCiclo,
} from "../../utils/etapasDoCiclo";

/** O texto de cada passo. A ordem, o número e a fase vêm da lista única (`utils/etapasDoCiclo.ts`). */
const TEXTO: Partial<Record<ChaveEtapa, { texto: string; botao: string }>> = {
  pmpv: { texto: "Calcule o preço médio e o volume previsto (VP) dos meses apurados. O CGF usa.", botao: "Abrir o PMPV" },
  auditoria: { texto: "Envie a pasta do trimestre e processe. Veja a Conferência do mês e a prova real e grave só o que bater.", botao: "Abrir o Painel do Ciclo" },
  cgf: { texto: "Sai do mesmo processamento. Ao gravar o CGR e o CGF, o RPV (CGR − CGF) se calcula sozinho.", botao: "Abrir o Painel do Ciclo" },
  ret: { texto: "Encargos de transporte (EAT e EC), lidos da mesma pasta.", botao: "Abrir o Painel do Ciclo" },
  rp: { texto: "Penalidades, com receitas e despesas, lidas da mesma pasta.", botao: "Abrir o Painel do Ciclo" },
  scg: { texto: "Se calcula sozinho ao gravar os módulos. Só abra a tela se o Painel avisar que o SCG diverge.", botao: "Abrir o SCG" },
  sr: { texto: "Calcule o SR com a SELIC, no cartão do Painel. Depois de gravar, aprove a prévia do que vem à frente: o gravado (Antes) ao lado do calculado (Novo). Nada é gravado sem o seu aval.", botao: "Abrir o Painel do Ciclo" },
  pr: { texto: "Converta o saldo a recuperar em R$/m³, para cobrar no trimestre seguinte. Confira e grave no cartão do PR, no Painel.", botao: "Abrir o Painel do Ciclo" },
  pv: { texto: "Some o PMPV e o PR para chegar ao preço de venda do trimestre novo. Confira e grave no cartão do PV, no Painel.", botao: "Abrir o Painel do Ciclo" },
  tarifa: { texto: "É só leitura: o PV mais a margem de distribuição (MB). Fecha na tela PMPV do trimestre novo.", botao: "Abrir o PMPV" },
  entregas: { texto: "Baixe a minuta da Nota Técnica e o relatório do trimestre no Painel. O Excel Final fica na tela dele.", botao: "Abrir o Painel do Ciclo" },
};

const destino = (e: EtapaDoCiclo) => (e.ondeSeTrabalha === "painel" ? MODULOS.ciclo.to : e.rota);

/** O trimestre em 9 passos numerados (os mesmos do menu, do cabeçalho e do Painel), em 4 fases. */
export function PassoAPasso() {
  return (
    <div className="flex flex-col gap-6">
      <p className="max-w-3xl text-[0.95rem] leading-relaxed text-zinc-300">
        São {TOTAL_DE_PASSOS} passos, sempre nesta ordem. O número é o mesmo no menu, no topo de cada tela e no Painel do Ciclo.
      </p>
      {FASES_DO_CICLO.map((fase) => (
        <section key={fase} aria-label={fase} className="flex flex-col gap-2">
          <h3 className="text-sm font-semibold text-zinc-400">{fase}</h3>
          <ol className="overflow-hidden rounded-xl border border-white/[0.07] bg-panel">
            {ETAPAS_DO_CICLO.filter((e) => e.fase === fase && TEXTO[e.chave]).map((e) => {
              const t = TEXTO[e.chave]!;
              return (
                <li key={e.chave} className="flex flex-col gap-3 border-b border-white/[0.07] p-4 last:border-b-0 sm:flex-row sm:items-center sm:gap-5 sm:px-5">
                  <span aria-hidden className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-sky-500/15 text-sm font-bold text-sky-400">
                    {e.numero ?? "·"}
                  </span>
                  <div className="min-w-0 flex-1">
                    <h4 className="text-base font-semibold text-white">
                      {e.numero !== null && <span className="sr-only">Passo {e.numero}: </span>}{e.nome}
                    </h4>
                    <p className="mt-0.5 text-sm leading-relaxed text-zinc-300">{t.texto}</p>
                  </div>
                  <Link to={destino(e)} className={classesDoBotao("primary", "md", "shrink-0 sm:w-56")}>
                    {t.botao}<ArrowRight size={14} aria-hidden />
                  </Link>
                </li>
              );
            })}
          </ol>
        </section>
      ))}
      <p className="max-w-3xl text-sm leading-relaxed text-zinc-400">
        O RPV não é um passo: ele se calcula sozinho e você o consulta na tela{" "}
        <Link to={MODULOS.rpv.to} className="rounded font-semibold text-zinc-200 underline underline-offset-2 hover:text-white">RPV</Link>.
        Nos documentos da ARPE, o PR e o PV aparecem como <strong className="text-zinc-200">Módulo 3 (Consolidação)</strong> e o
        Excel Final, como <strong className="text-zinc-200">Módulo 9</strong>.
      </p>
    </div>
  );
}
