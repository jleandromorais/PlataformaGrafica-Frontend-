/** Linha de destaques (KPIs) do RP do mês aberto. Só mostra o que veio do backend
 * (GET /conciliacao/prova-real); não recalcula nada. */
import { AlertTriangle, ArrowDownToLine, ArrowUpFromLine, FileText, Scale } from "lucide-react";
import { Conferencia } from "../../components/ui/Conferencia";
import { GradeKpis, Kpi } from "../../components/ui/KpiCard";
import type { EstadoProva } from "../../components/ui/useProvaRealDoMes";
import { brl } from "../../utils/format";
import { brlResumido, contabil } from "../Auditoria/formatoProva";
import type { ProvaRealRP } from "../../types";
import { estadoDaProvaRP, qtdNaoLidos, textoQtdRepetidas } from "./estadoProva";

export function KpisRP({ periodo, estado }: { periodo: string | null; estado: EstadoProva<ProvaRealRP> }) {
  const { dados: d, carregando, atualizando, erro } = estado;
  if (!periodo || erro) return null; // sem mês ou com erro: o aviso fica no card da prova real

  const situacao = d ? estadoDaProvaRP(d) : null;
  const temRp = !!d && d.rp_gravado !== null;
  const temItens = !!d && d.tem_itens;
  const repetidas = d ? d.possiveis_duplicadas.length : 0;

  return (
    <GradeKpis titulo={`Destaques de ${periodo}`} carregando={carregando} atualizando={atualizando}>
      <Kpi icone={<FileText size={16} aria-hidden />} rotulo="RP do mês" carregando={carregando}
        valor={temRp ? <span title={brl(d.rp_gravado!)}>{brlResumido(d.rp_gravado!)}</span> : "—"}
        detalhe={temRp ? contabil(d.rp_gravado!) : "nada gravado"} />

      <Kpi icone={<ArrowDownToLine size={16} aria-hidden />} rotulo="Receitas líquidas" carregando={carregando}
        valor={temItens ? <span title={brl(d.receitas.liquido)}>{brlResumido(d.receitas.liquido)}</span> : "—"}
        detalhe={temItens ? `${d.receitas.qtd} ${d.receitas.qtd === 1 ? "nota" : "notas"}, sem PIS/COFINS` : "sem notas gravadas"} />

      <Kpi icone={<ArrowUpFromLine size={16} aria-hidden />} rotulo="Despesas líquidas" carregando={carregando}
        valor={temItens ? <span title={brl(d.despesas.liquido)}>{brlResumido(d.despesas.liquido)}</span> : "—"}
        detalhe={temItens ? `${d.despesas.qtd} ${d.despesas.qtd === 1 ? "nota" : "notas"}, sem PIS/COFINS` : "sem notas gravadas"} />

      <Kpi icone={<Scale size={16} aria-hidden />} rotulo="Prova real" carregando={carregando}
        valor={repetidas > 0
          ? <span className="inline-flex items-center gap-1 text-amber-300"><AlertTriangle size={18} aria-hidden />nota repetida</span>
          : situacao === "confere" || situacao === "diverge"
            ? <Conferencia confere={situacao === "confere"}>{situacao === "confere" ? "Confere" : "Não confere"}</Conferencia>
            : <span className="text-zinc-400">{situacao === "so_total" ? "sem conta" : "sem RP gravado"}</span>}
        detalhe={repetidas > 0
          ? `${textoQtdRepetidas(repetidas)}${d?.diferenca != null && d.diferenca !== 0 ? ` · diferença ${contabil(d.diferenca)}` : ""}`
          : situacao === "confere" || situacao === "diverge"
            ? `${situacao === "diverge" && d && qtdNaoLidos(d) > 0 ? `${qtdNaoLidos(d)} ${qtdNaoLidos(d) === 1 ? "PDF não lido" : "PDFs não lidos"} · ` : ""}${d?.diferenca == null ? "" : `diferença ${contabil(d.diferenca)}`}`
            : situacao === "so_total" ? "gravado só com o total" : "processe o mês no Painel do Ciclo"} />
    </GradeKpis>
  );
}
