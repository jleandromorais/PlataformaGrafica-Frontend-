/** Linha de destaques (KPIs) do PV do trimestre aberto: PMPV, PR, PV e o resultado da prova real.
 * Só mostra o que veio do backend (GET /pv/prova-real); não recalcula nada. */
import { Equal, Plus, Scale, Tag } from "lucide-react";
import { Conferencia } from "../../components/ui/Conferencia";
import { GradeKpis, Kpi } from "../../components/ui/KpiCard";
import type { EstadoProva } from "../../components/ui/useProvaRealDoMes";
import { colorForValue } from "../../theme";
import { brl } from "../../utils/format";
import type { ProvaRealPV } from "../../types";

export function KpisPV({ chave, estado }: { chave: string | null; estado: EstadoProva<ProvaRealPV> }) {
  const { dados: d, carregando, atualizando, erro } = estado;
  if (!chave || erro) return null; // sem trimestre ou com erro: o aviso fica no card da prova real

  const g = !!d && d.tem_salvo;
  const tarifa = (v: number) => brl(v, 4);

  return (
    <GradeKpis titulo={`Destaques de ${chave}`} carregando={carregando} atualizando={atualizando}>
      <Kpi icone={<Tag size={16} aria-hidden />} rotulo="PMPV do trimestre" carregando={carregando}
        valor={g && d.pmpv_gravado !== null ? tarifa(d.pmpv_gravado) : "—"}
        detalhe={!g ? "ainda não gravado" : d.pmpv_confere ? "R$/m³ · igual ao módulo PMPV" : `R$/m³ · hoje no PMPV: ${tarifa(d.pmpv_atual)}`} />

      <Kpi icone={<Plus size={16} aria-hidden />} rotulo="PR do trimestre" carregando={carregando}
        valor={g && d.pr_gravado !== null ? <span className={colorForValue(d.pr_gravado)}>{tarifa(d.pr_gravado)}</span> : "—"}
        detalhe={!g ? "ainda não gravado" : d.pr_confere ? "R$/m³ · igual ao módulo PR" : `R$/m³ · hoje no PR: ${tarifa(d.pr_atual)}`} />

      <Kpi icone={<Equal size={16} aria-hidden />} rotulo="PV do trimestre" carregando={carregando}
        valor={g && d.pv_gravado !== null ? <span className={colorForValue(d.pv_gravado)}>{tarifa(d.pv_gravado)}</span> : "—"}
        detalhe={!g && d ? `hoje os módulos dão ${tarifa(d.pv_atual)}` : "PMPV + PR, R$/m³"} />

      <Kpi icone={<Scale size={16} aria-hidden />} rotulo="Prova real" carregando={carregando}
        valor={!g
          ? <span className="text-zinc-400">sem PV gravado</span>
          : <Conferencia confere={d.confere}>{d.confere ? "Confere" : "Não confere"}</Conferencia>}
        detalhe={!g ? "salve o PV do trimestre"
          : d.confere ? "conta e módulos batem"
            : !d.conta_confere ? "a conta não fecha" : "o PMPV ou o PR mudou depois"} />
    </GradeKpis>
  );
}
