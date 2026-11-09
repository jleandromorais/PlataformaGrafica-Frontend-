/** Linha de destaques (KPIs) do mês aberto: CGR, notas, empresas e o resultado da prova real.
 * Só mostra o que veio do backend (GET /auditoria/prova-real); não recalcula o CGR. */
import { Building2, CircleDollarSign, FileText, Scale } from "lucide-react";
import { Conferencia } from "../../components/ui/Conferencia";
import { GradeKpis, Kpi } from "../../components/ui/KpiCard";
import { brl, num } from "../../utils/format";
import { brlResumido, contabil, participacao, textoParticipacao } from "./formatoProva";
import type { EstadoProvaReal } from "./useProvaReal";

export function KpisDoMes({ periodo, estado }: { periodo: string | null; estado: EstadoProvaReal }) {
  const { dados: d, carregando, atualizando, erro } = estado;
  if (!periodo || erro) return null; // sem mês ou com erro: o aviso fica no card da prova real

  const temNotas = !!d && d.qtd_notas > 0;
  const nfe = d ? d.por_empresa.reduce((s, e) => s + e.qtd_nfe, 0) : 0;
  const cte = d ? d.por_empresa.reduce((s, e) => s + e.qtd_cte, 0) : 0;
  const maior = d && d.por_empresa.length
    ? d.por_empresa.reduce((a, b) => (b.cgr > a.cgr ? b : a))
    : null;

  return (
    <GradeKpis titulo={`Destaques de ${periodo}`} carregando={carregando} atualizando={atualizando}>

      <Kpi icone={<CircleDollarSign size={16} aria-hidden />} rotulo="CGR do mês" carregando={carregando}
        valor={temNotas ? <span title={brl(d.cgr_das_notas)}>{brlResumido(d.cgr_das_notas)}</span> : "—"}
        detalhe={temNotas ? contabil(d.cgr_das_notas) : "sem notas gravadas"} />

      <Kpi icone={<FileText size={16} aria-hidden />} rotulo="Notas" carregando={carregando}
        valor={d ? num(d.qtd_notas) : "—"}
        detalhe={temNotas ? `${num(nfe)} NF-e · ${num(cte)} CT-e` : "nenhuma gravada"} />

      <Kpi icone={<Building2 size={16} aria-hidden />} rotulo="Empresas" carregando={carregando}
        valor={d ? num(d.por_empresa.length) : "—"}
        detalhe={temNotas && maior ? `maior: ${maior.empresa} (${textoParticipacao(participacao(maior.cgr, d))})` : "—"} />

      <Kpi icone={<Scale size={16} aria-hidden />} rotulo="Prova real" carregando={carregando}
        valor={!temNotas
          ? <span className="text-zinc-400">sem conta</span>
          : <Conferencia confere={d.confere}>{d.confere ? "Confere" : "Não confere"}</Conferencia>}
        detalhe={!temNotas ? "audite o mês no Painel do Ciclo"
          : d.diferenca === null ? "sem CGR gravado"
            : `diferença ${contabil(d.diferenca)}`} />
    </GradeKpis>
  );
}
