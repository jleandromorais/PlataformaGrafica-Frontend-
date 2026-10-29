import {
  LayoutDashboard, Calculator, BarChart2, FileSearch,
  FileText, Zap, TrendingUp, DollarSign, PieChart, Activity, Layers, FileSpreadsheet,
  Route, type LucideIcon,
} from "lucide-react";
import { GLOSSARIO, type Sigla } from "../../utils/glossario";

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
  ciclo: m("ciclo", "/ciclo", Route, "Painel do Ciclo", undefined,
    "Tudo o que o trimestre precisa, na ordem: o que já está pronto, o que falta e onde fazer."),
  dashboard: m("dashboard", "/", LayoutDashboard, "Dashboard"),
  pmpv: m("pmpv", "/pmpv", Calculator, GLOSSARIO.PMPV.nome, "PMPV",
    "Calcule o preço médio de venda do trimestre com os preços e volumes de cada empresa."),
  auditoria: m("auditoria", "/auditoria", FileSearch, "Auditoria CGR", undefined,
    "Leia as notas de compra do mês (NF-e e CT-e) para chegar ao custo realizado do gás."),
  cgf: m("cgf", "/cgf", BarChart2, GLOSSARIO.CGF.nome, "CGF",
    "Leia as planilhas de NF do mês para chegar ao volume e ao custo faturados."),
  rpv: m("rpv", "/rpv", PieChart, GLOSSARIO.RPV.nome, "RPV",
    "Compare o custo realizado (CGR) com o faturado (CGF) do mês e salve a diferença."),
  ret: m("ret", "/ret", Zap, GLOSSARIO.RET.nome, "RET",
    "Leia os PDFs de encargos de transporte (EAT e EC) e salve o RET de cada mês."),
  conciliacao: m("conciliacao", "/conciliacao", FileText, GLOSSARIO.RP.nome, "RP",
    "Leia as notas de penalidade do mês (receitas e despesas) e salve o saldo."),
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

export const GRUPOS_DO_MENU: { titulo?: string; itens: ChaveModulo[] }[] = [
  { itens: ["ciclo", "dashboard", "pmpv"] },
  { titulo: "Conta Gráfica", itens: ["auditoria", "cgf", "rpv", "ret", "conciliacao", "scg", "sr"] },
  { titulo: "Módulo 3 · Consolidação", itens: ["pr", "pv"] },
  { titulo: "Exportação", itens: ["excel"] },
];
