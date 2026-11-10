/** Destaques (KPIs) do SR do trimestre aberto. Só mostra o que veio do backend
 * (GET /sr/prova-real); não recalcula nada. */
import { AlertTriangle, CalendarRange, CircleHelp, Database, Scale, Wallet } from "lucide-react";
import { Conferencia } from "../../components/ui/Conferencia";
import { GradeKpis, Kpi } from "../../components/ui/KpiCard";
import type { EstadoProva } from "../../components/ui/useProvaRealDoMes";
import { brl } from "../../utils/format";
import { brlResumido, contabil } from "../Auditoria/formatoProva";
import type { ProvaRealSR } from "../../types";
import { estadoDaProvaSR, estadoDasFontes, rotuloDoTrimestre } from "./estadoProva";

export function KpisSR({ chave, estado }: { chave: string | null; estado: EstadoProva<ProvaRealSR> }) {
  const { dados: d, carregando, atualizando, erro } = estado;
  if (!chave || erro) return null; // sem trimestre ou com erro: o aviso fica no card da prova real

  const situacao = d ? estadoDaProvaSR(d) : null;
  const fontes = d ? estadoDasFontes(d) : null;
  const g = !!d && situacao !== "nao_gravado";
  const dif = d ? d.total_gravado - d.total_recalculado : 0;

  return (
    <GradeKpis titulo={`Destaques de ${rotuloDoTrimestre(chave)}`} carregando={carregando} atualizando={atualizando}>
      <Kpi icone={<Wallet size={16} aria-hidden />} rotulo="SR do trimestre" carregando={carregando}
        valor={g ? <span title={brl(d.total_gravado)}>{brlResumido(d.total_gravado)}</span> : "—"}
        detalhe={g ? contabil(d.total_gravado) : "nada gravado"} />

      <Kpi icone={<CalendarRange size={16} aria-hidden />} rotulo="Meses gravados" carregando={carregando}
        valor={d ? `${d.linhas.length} de ${d.labels_meses.length || 3}` : "—"}
        detalhe={g ? d.labels_meses.join(", ") : "nada gravado"} />

      <Kpi icone={<Database size={16} aria-hidden />} rotulo="Fontes" carregando={carregando}
        valor={fontes === "em_dia"
          ? <Conferencia confere>em dia</Conferencia>
          : fontes === "desatualizadas"
            ? <span className="inline-flex items-center gap-1 text-amber-300"><AlertTriangle size={18} aria-hidden />desatualizadas</span>
            : fontes === "indisponiveis"
              ? <span className="inline-flex items-center gap-1 text-zinc-400"><CircleHelp size={18} aria-hidden />indisponíveis</span>
              : <span className="text-zinc-400">—</span>}
        detalhe={fontes === "em_dia" ? "PMPV, CGF, PR e SELIC iguais ao gravado"
          : fontes === "desatualizadas" ? "recalcule no Painel do Ciclo"
            : fontes === "indisponiveis" ? "não deu para consultar agora" : "nada gravado"} />

      <Kpi icone={<Scale size={16} aria-hidden />} rotulo="Prova real" carregando={carregando}
        valor={g
          ? <Conferencia confere={situacao === "confere"}>{situacao === "confere" ? "Confere" : "Não confere"}</Conferencia>
          : <span className="text-zinc-400">sem SR gravado</span>}
        detalhe={g ? `diferença ${contabil(dif)}` : "grave o trimestre"} />
    </GradeKpis>
  );
}
