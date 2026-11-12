/** Destaques (KPIs) do SCG do mês aberto: SCG, RPV, RET, RP e a prova real. Só mostra o que
 * veio do backend (GET /scg/prova-real); não recalcula nada. */
import { Equal, FileText, Minus, Scale, Truck } from "lucide-react";
import { Conferencia } from "../../components/ui/Conferencia";
import { GradeKpis, Kpi } from "../../components/ui/KpiCard";
import type { EstadoProva } from "../../components/ui/useProvaRealDoMes";
import { brl } from "../../utils/format";
import { brlResumido, contabil } from "../Auditoria/formatoProva";
import type { ProvaRealSCG } from "../../types";
import { estadoDaProvaSCG } from "./estadoProva";

/** Verde: positivo; vermelho: negativo (o mesmo critério da tela). */
const cor = (v: number) => (v > 0 ? "text-emerald-300" : v < 0 ? "text-red-300" : "text-white");

export function KpisSCG({ periodo, estado }: { periodo: string | null; estado: EstadoProva<ProvaRealSCG> }) {
  const { dados: d, carregando, atualizando, erro } = estado;
  if (!periodo || erro) return null; // sem mês ou com erro: o aviso fica no card da prova real

  const situacao = d ? estadoDaProvaSCG(d) : null;
  const g = !!d && situacao !== "nao_gravado";
  const valor = (v: number) => <span className={cor(v)} title={brl(v)}>{brlResumido(v)}</span>;

  // Coluna crua vazia ou 0, mas a soma dos módulos existe: "R$ 0,00" enganaria, o mês só não foi gravado.
  const cruNaoGravado = !!d && (d.scg_gravado === null || Math.abs(d.scg_gravado) < 0.005) && Math.abs(d.scg_calculado) >= 0.005;

  return (
    <GradeKpis titulo={`Destaques de ${periodo}`} carregando={carregando} atualizando={atualizando} cinco>
      <Kpi icone={<Equal size={16} aria-hidden />} rotulo="SCG do mês" carregando={carregando}
        valor={cruNaoGravado ? <span className="text-zinc-400">não gravado</span> : g && d.scg_gravado !== null ? valor(d.scg_gravado) : "—"}
        detalhe={cruNaoGravado ? `soma dos módulos: ${contabil(d.scg_calculado)}` : g && d.scg_gravado !== null ? contabil(d.scg_gravado) : "nada gravado"} />

      <Kpi icone={<Minus size={16} aria-hidden />} rotulo="RPV" carregando={carregando}
        valor={g ? valor(d.rpv) : "—"} detalhe={g ? "CGR − CGF" : "nada gravado"} />

      <Kpi icone={<Truck size={16} aria-hidden />} rotulo="RET" carregando={carregando}
        valor={g ? valor(d.ret) : "—"} detalhe={g ? contabil(d.ret) : "nada gravado"} />

      <Kpi icone={<FileText size={16} aria-hidden />} rotulo="RP" carregando={carregando}
        valor={g ? valor(d.rp) : "—"} detalhe={g ? contabil(d.rp) : "nada gravado"} />

      <Kpi icone={<Scale size={16} aria-hidden />} rotulo="Prova real" carregando={carregando}
        valor={g
          ? <Conferencia confere={situacao === "confere"}>{situacao === "confere" ? "Confere" : "Não confere"}</Conferencia>
          : <span className="text-zinc-400">sem SCG gravado</span>}
        detalhe={g ? (d.diferenca === null ? "" : `diferença ${contabil(d.diferenca)}`) : "grave o mês na tabela abaixo"} />
    </GradeKpis>
  );
}
