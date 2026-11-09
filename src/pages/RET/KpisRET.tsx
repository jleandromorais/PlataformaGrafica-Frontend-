/** Linha de destaques (KPIs) do RET do mês aberto. Só mostra o que veio do backend
 * (GET /ret/prova-real); não recalcula nada. */
import { Landmark, Receipt, Scale, Truck } from "lucide-react";
import { Conferencia } from "../../components/ui/Conferencia";
import { GradeKpis, Kpi } from "../../components/ui/KpiCard";
import type { EstadoProva } from "../../components/ui/useProvaRealDoMes";
import { brl } from "../../utils/format";
import { brlResumido, contabil } from "../Auditoria/formatoProva";
import type { ProvaRealRET } from "../../types";
import { estadoDaProvaRET } from "./estadoProva";

export function KpisRET({ periodo, estado }: { periodo: string | null; estado: EstadoProva<ProvaRealRET> }) {
  const { dados: d, carregando, atualizando, erro } = estado;
  if (!periodo || erro) return null; // sem mês ou com erro: o aviso fica no card da prova real

  const situacao = d ? estadoDaProvaRET(d) : null;
  const temRet = !!d && d.ret_gravado !== null;
  const temItens = !!d && d.tem_itens;

  return (
    <GradeKpis titulo={`Destaques de ${periodo}`} carregando={carregando} atualizando={atualizando}>
      <Kpi icone={<Truck size={16} aria-hidden />} rotulo="RET do mês" carregando={carregando}
        valor={temRet ? <span title={brl(d.ret_gravado!)}>{brlResumido(d.ret_gravado!)}</span> : "—"}
        detalhe={temRet ? contabil(d.ret_gravado!) : "nada gravado"} />

      <Kpi icone={<Receipt size={16} aria-hidden />} rotulo="EAT líquido" carregando={carregando}
        valor={temItens ? <span title={brl(d.eat_liquido)}>{brlResumido(d.eat_liquido)}</span> : "—"}
        detalhe={temItens ? `${d.qtd_eat} ${d.qtd_eat === 1 ? "documento" : "documentos"}, sem PIS/COFINS` : "sem documentos gravados"} />

      <Kpi icone={<Landmark size={16} aria-hidden />} rotulo="EC" carregando={carregando}
        valor={temItens ? <span title={brl(d.ec)}>{brlResumido(d.ec)}</span> : "—"}
        detalhe={temItens ? `${d.qtd_ec} ${d.qtd_ec === 1 ? "documento" : "documentos"}` : "sem documentos gravados"} />

      <Kpi icone={<Scale size={16} aria-hidden />} rotulo="Prova real" carregando={carregando}
        valor={situacao === "confere" || situacao === "diverge"
          ? <Conferencia confere={situacao === "confere"}>{situacao === "confere" ? "Confere" : "Não confere"}</Conferencia>
          : <span className="text-zinc-400">{situacao === "so_total" ? "sem conta" : "sem RET gravado"}</span>}
        detalhe={situacao === "confere" || situacao === "diverge"
          ? (d?.diferenca === null || d?.diferenca === undefined ? "" : `diferença ${contabil(d.diferenca)}`)
          : situacao === "so_total" ? "gravado só com o total" : "processe o mês no Painel do Ciclo"} />
    </GradeKpis>
  );
}
