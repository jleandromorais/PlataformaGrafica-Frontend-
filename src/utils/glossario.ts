/** Nome por extenso e fórmula de cada indicador da Conta Gráfica — uma fonte só para menu,
 * títulos e legendas. Nomes conforme a NT e a Resolução ARPE 304 (RP: art. 14). */
export type Termo = { nome: string; formula?: string };

export const GLOSSARIO = {
  CGR: { nome: "Custo do Gás Realizado", formula: "compra do gás sem tributos (NF-e + CT-e de gasoduto), devoluções abatidas" },
  CGF: { nome: "Custo do Gás Faturado", formula: "CGF = PMPV × VF" },
  RPV: { nome: "Recuperação de Preço de Venda", formula: "RPV = CGR − CGF" },
  RET: { nome: "Recuperação de Encargos de Transporte", formula: "RET = Σ EAT × (1 − PIS/COFINS) + Σ EC" },
  RP: { nome: "Recuperação das Penalidades", formula: "RP = (Σ despesas − Σ receitas) × (1 − PIS/COFINS)" },
  SCG: { nome: "Saldo da Conta Gráfica", formula: "SCG = RPV + RET + RP" },
  SR: { nome: "Saldo Remanescente", formula: "SR = (VP − VF) × PR × (1 + SELIC) + SR anterior" },
  PR: { nome: "Parcela de Recuperação", formula: "PR = (SCG com SELIC + SR com SELIC do trimestre apurado) ÷ VP do trimestre do PR" },
  PMPV: { nome: "Preço Médio Ponderado de Venda", formula: "PMPV = Σ(Pᵢ·Vᵢ) / ΣVᵢ" },
  PV: { nome: "Preço de Venda", formula: "PV = PMPV + PR" },
  VP: { nome: "Volume Prospectivo" },
  VF: { nome: "Volume Faturado" },
  EAT: { nome: "Encargo de Transporte" },
  EC: { nome: "Encargo de Capacidade" },
} as const satisfies Record<string, Termo>;

export type Sigla = keyof typeof GLOSSARIO;

/** "RET — Recuperação de Encargos de Transporte" */
export const tituloDe = (sigla: Sigla) => `${sigla} — ${GLOSSARIO[sigla].nome}`;

/** Texto para tooltip: nome e, quando houver, a fórmula. */
export const dicaDe = (sigla: Sigla) => {
  const t: Termo = GLOSSARIO[sigla];
  return t.formula ? `${tituloDe(sigla)}. ${t.formula}` : tituloDe(sigla);
};
