/** Linha de destaques (KPIs) do RPV do mês aberto: CGR, CGF, RPV e o resultado da prova real.
 * Só mostra o que veio do backend (GET /rpv/prova-real); não recalcula nada. */
import { BarChart2, Equal, Scale, Search } from "lucide-react";
import { Conferencia } from "../../components/ui/Conferencia";
import { GradeKpis, Kpi } from "../../components/ui/KpiCard";
import type { EstadoProva } from "../../components/ui/useProvaRealDoMes";
import { brl } from "../../utils/format";
import { brlResumido, contabil } from "../Auditoria/formatoProva";
import type { ProvaRealRPV } from "../../types";

/** Verde: CGR maior que CGF; vermelho: menor (o mesmo critério da tela de antes). */
const corDoValor = (v: number) => (v > 0 ? "text-emerald-300" : v < 0 ? "text-red-300" : "text-white");

export function KpisRPV({ periodo, estado }: { periodo: string | null; estado: EstadoProva<ProvaRealRPV> }) {
  const { dados: d, carregando, atualizando, erro } = estado;
  if (!periodo || erro) return null; // sem mês ou com erro: o aviso fica no card da prova real

  const g = !!d && d.gravado;
  const rpv = g ? d.rpv_gravado ?? d.rpv_calculado : 0;

  return (
    <GradeKpis titulo={`Destaques de ${periodo}`} carregando={carregando} atualizando={atualizando}>
      <Kpi icone={<Search size={16} aria-hidden />} rotulo="CGR do mês" carregando={carregando}
        valor={g ? <span title={brl(d.cgr)}>{brlResumido(d.cgr)}</span> : "—"}
        detalhe={g ? contabil(d.cgr) : "nada gravado"} />

      <Kpi icone={<BarChart2 size={16} aria-hidden />} rotulo="CGF do mês" carregando={carregando}
        valor={g ? <span title={brl(d.cgf)}>{brlResumido(d.cgf)}</span> : "—"}
        detalhe={g ? contabil(d.cgf) : "nada gravado"} />

      <Kpi icone={<Equal size={16} aria-hidden />} rotulo="RPV do mês" carregando={carregando}
        valor={g ? <span className={corDoValor(rpv)} title={brl(rpv)}>{brlResumido(rpv)}</span> : "—"}
        detalhe={!g ? "nada gravado" : rpv > 0 ? "CGR maior que CGF" : rpv < 0 ? "CGR menor que CGF" : "CGR igual a CGF"} />

      <Kpi icone={<Scale size={16} aria-hidden />} rotulo="Prova real" carregando={carregando}
        valor={!g
          ? <span className="text-zinc-400">sem conta</span>
          : <Conferencia confere={d.confere}>{d.confere ? "Confere" : "Não confere"}</Conferencia>}
        detalhe={!g ? "grave o CGR e o CGF do mês"
          : d.diferenca === null ? "sem RPV gravado"
            : `diferença ${contabil(d.diferenca)}`} />
    </GradeKpis>
  );
}
