export interface DashboardData {
  periodo_apuracao: string;
  periodo_recuperacao: string;
  versao_cg: string;

  saldo_a_recuperar: number;
  saldo_cg_atualizado: number;
  saldo_remanescente: number;

  scg: number;
  rpv: number;
  ret: number;
  rp: number;

  sr_total: number;
  sr_por_mes: { mes: string; valor: number }[];

  parcela_recuperacao: number;
  volume_prospectivo: number;

  historico_parcela: { periodo: string; valor: number }[];
}

export const mockDashboard: DashboardData = {
  periodo_apuracao: "JANEIRO/2025 A MARÇO/2025",
  periodo_recuperacao: "MAIO/2025 A JULHO/2025",
  versao_cg: "CG11",

  saldo_a_recuperar: 4171444.04,
  saldo_cg_atualizado: 3982584.92,
  saldo_remanescente: 188859.12,

  scg: 3982585,
  rpv: -1190242.74,
  ret: 5172827.66,
  rp: 0,

  sr_total: 188859,
  sr_por_mes: [
    { mes: "Jan/25", valor: 126264.56 },
    { mes: "Fev/25", valor: 21115.75 },
    { mes: "Mar/25", valor: 41478.81 },
  ],

  parcela_recuperacao: 0.0292,
  volume_prospectivo: 142876000,

  historico_parcela: [
    { periodo: "Mai/24", valor: 0.0135 },
    { periodo: "Jun/24", valor: -0.0051 },
    { periodo: "Jul/24", valor: -0.1111 },
    { periodo: "Ago/24", valor: -0.0514 },
    { periodo: "Set/24", valor: -0.1167 },
    { periodo: "Out/24", valor: 0.1423 },
    { periodo: "Nov/24", valor: 0.0754 },
    { periodo: "Dez/24", valor: 0.0104 },
    { periodo: "Jan/25", valor: 0.0188 },
    { periodo: "Fev/25", valor: 0.0106 },
    { periodo: "Mar/25", valor: 0.0292 },
    { periodo: "Abr/25", valor: 0.0116 },
    { periodo: "Mai/25", valor: -0.0210 },
    { periodo: "Jun/25", valor: -0.0121 },
  ],
};
