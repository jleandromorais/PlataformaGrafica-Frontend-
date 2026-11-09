/** Linha de destaques (KPIs) do CGF do mês aberto. Só mostra o que veio do backend
 * (GET /cgf/prova-real); não recalcula nada. */
import { BarChart2, Droplets, Scale, Tag } from "lucide-react";
import { Conferencia } from "../../components/ui/Conferencia";
import { GradeKpis, Kpi } from "../../components/ui/KpiCard";
import type { EstadoProva } from "../../components/ui/useProvaRealDoMes";
import { brl, num } from "../../utils/format";
import { brlResumido, contabil } from "../Auditoria/formatoProva";
import type { ProvaRealCGF } from "../../types";

export function KpisCGF({ periodo, estado }: { periodo: string | null; estado: EstadoProva<ProvaRealCGF> }) {
  const { dados: d, carregando, atualizando, erro } = estado;
  if (!periodo || erro) return null; // sem mês ou com erro: o aviso fica no card da prova real

  const temResumo = !!d && d.tem_resumo;
  const temCgf = !!d && d.cgf_gravado !== null;

  return (
    <GradeKpis titulo={`Destaques de ${periodo}`} carregando={carregando} atualizando={atualizando}>
      <Kpi icone={<Droplets size={16} aria-hidden />} rotulo="Volume final" carregando={carregando}
        valor={temResumo ? <span title={`${num(d.volume_final_calculado, 4)} m³`}>{num(d.volume_final_calculado, 2)} m³</span> : "—"}
        detalhe={temResumo ? `faturado ${num(d.volume_faturado, 2)} − devoluções ${num(d.volume_devolucoes, 2)}` : "sem volumes gravados"} />

      <Kpi icone={<Tag size={16} aria-hidden />} rotulo="PMPV do mês" carregando={carregando}
        valor={d && d.pmpv !== null ? brl(d.pmpv, 4) : "—"}
        detalhe={d && d.pmpv !== null ? "R$/m³" : d ? "sem PMPV gravado" : "—"} />

      <Kpi icone={<BarChart2 size={16} aria-hidden />} rotulo="CGF do mês" carregando={carregando}
        valor={temCgf ? <span title={brl(d.cgf_gravado!)}>{brlResumido(d.cgf_gravado!)}</span> : "—"}
        detalhe={temCgf ? contabil(d.cgf_gravado!) : "nada gravado"} />

      <Kpi icone={<Scale size={16} aria-hidden />} rotulo="Prova real" carregando={carregando}
        valor={!temResumo
          ? <span className="text-zinc-400">sem conta</span>
          : d.pmpv === null
            ? <span className="text-amber-300">sem PMPV</span>
            : <Conferencia confere={d.confere}>{d.confere ? "Confere" : "Não confere"}</Conferencia>}
        detalhe={!temResumo ? "processe o mês no Painel do Ciclo"
          : d.pmpv === null ? "grave o PMPV do mês"
            : d.diferenca_cgf === null ? "sem CGF gravado"
              : `diferença ${contabil(d.diferenca_cgf)}`} />
    </GradeKpis>
  );
}
