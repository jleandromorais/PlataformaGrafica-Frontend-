import {
  LayoutDashboard, Calculator, BarChart2, FileSearch,
  FileText, Zap, TrendingUp, DollarSign, PieChart, Activity, Layers, FileSpreadsheet,
  Route, BookOpen, type LucideIcon,
} from "lucide-react";
import { GLOSSARIO, type Sigla } from "../../utils/glossario";
import { ROTA_INICIAL, ROTA_VISAO_GERAL } from "../../router/rotas";

/** Uma tela da plataforma: menu, cabeçalho e "próxima etapa" leem daqui. */
export interface Modulo {
  key: string;
  to: string;
  icon: LucideIcon;
  /** Nome curto, sem a sigla (ex.: "Custo do Gás Faturado"). */
  nome: string;
  sigla?: Sigla;
  /** O que a pessoa faz nesta tela, em linguagem simples. */
  proposito?: string;
}

const m = (key: string, to: string, icon: LucideIcon, nome: string, sigla?: Sigla, proposito?: string): Modulo =>
  ({ key, to, icon, nome, sigla, proposito });

export const MODULOS = {
  ciclo: m("ciclo", ROTA_INICIAL, Route, "Painel do Ciclo", undefined,
    "Tudo o que o trimestre precisa, na ordem: o que já está pronto, o que falta e onde fazer."),
  dashboard: m("dashboard", ROTA_VISAO_GERAL, LayoutDashboard, "Visão geral", undefined,
    "Resultados gravados, mês a mês. Para trabalhar o trimestre, use o Painel do Ciclo."),
  comofunciona: m("comofunciona", "/como-funciona", BookOpen, "Como funciona", undefined,
    "Entenda o caminho do ciclo, as contas e como conferir cada número, antes de começar."),
  pmpv: m("pmpv", "/pmpv", Calculator, GLOSSARIO.PMPV.nome, "PMPV",
    "Calcule o preço médio de venda do trimestre com os preços e volumes de cada empresa."),
  auditoria: m("auditoria", "/auditoria", FileSearch, "Auditoria CGR", undefined,
    "Consulte o CGR gravado de cada mês e abra a conta (prova real). Para ler as notas (NF-e e CT-e) e gravar, use o Painel do Ciclo."),
  cgf: m("cgf", "/cgf", BarChart2, GLOSSARIO.CGF.nome, "CGF",
    "Consulte o CGF gravado e a conta de cada mês. Para ler as planilhas de NF e gravar, use o Painel do Ciclo."),
  rpv: m("rpv", "/rpv", PieChart, GLOSSARIO.RPV.nome, "RPV",
    "O RPV é CGR − CGF e se calcula sozinho quando o CGR e o CGF são gravados. Aqui você só consulta."),
  ret: m("ret", "/ret", Zap, GLOSSARIO.RET.nome, "RET",
    "Consulte o RET gravado de cada mês e abra a conta. Para ler os PDFs de encargos (EAT e EC) e gravar, use o Painel do Ciclo."),
  conciliacao: m("conciliacao", "/conciliacao", FileText, GLOSSARIO.RP.nome, "RP",
    "Consulte o RP gravado de cada mês, com todas as notas. Para ler os PDFs de penalidades e gravar, use o Painel do Ciclo."),
  scg: m("scg", "/scg", Layers, GLOSSARIO.SCG.nome, "SCG",
    "Junte RPV, RET e RP do mês, escolha o valor certo onde houver divergência e salve."),
  sr: m("sr", "/sr", Activity, GLOSSARIO.SR.nome, "SR",
    "Calcule, mês a mês e com SELIC, o que ficou por recuperar no trimestre."),
  pr: m("pr", "/pr", TrendingUp, GLOSSARIO.PR.nome, "PR",
    "Converta o saldo a recuperar em R$/m³ para cobrar no trimestre seguinte."),
  pv: m("pv", "/pv", DollarSign, GLOSSARIO.PV.nome, "PV",
    "Some o PMPV e o PR para chegar ao preço de venda do trimestre."),
  excel: m("excel", "/excel-final", FileSpreadsheet, "Excel Final Consolidado", undefined,
    "A planilha consolidada da Conta Gráfica (Módulo 9), com todos os módulos e todos os anos gravados."),
} satisfies Record<string, Modulo>;

export type ChaveModulo = keyof typeof MODULOS;

/** Ordem de trabalho do ciclo: é a sequência do "Anterior / Próxima" dos cabeçalhos. */
export const ORDEM_DO_CICLO: ChaveModulo[] = [
  "pmpv", "auditoria", "cgf", "rpv", "ret", "conciliacao", "scg", "sr", "pr", "pv", "excel",
];

/** Menu na ordem de uso: onde começar, os passos do trimestre e, por fim, consulta e entrega. */
export const GRUPOS_DO_MENU: { titulo?: string; itens: ChaveModulo[] }[] = [
  { titulo: "Início", itens: ["ciclo", "comofunciona"] },
  { titulo: "Passos do trimestre", itens: ["pmpv", "auditoria", "cgf", "ret", "conciliacao", "scg", "sr", "pr", "pv"] },
  { titulo: "Consulta e entrega", itens: ["dashboard", "rpv", "excel"] },
];
