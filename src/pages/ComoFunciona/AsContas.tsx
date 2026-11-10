import type { ReactNode } from "react";
import { CARD_VINHO } from "../../components/ui/estilosCard";

interface Conta {
  sigla: string;
  nome: string;
  formula: ReactNode;
  explica: ReactNode[];
  exemplo: ReactNode;
}

const CONTAS: Conta[] = [
  { sigla: "CGR", nome: "Custo do Gás Realizado",
    formula: "CGR = soma das compras sem tributos − devoluções",
    explica: [
      "Entram as NF-e de compra e os CT-e de gasoduto (TAG e Mastergás). O frete de outras transportadoras fica fora.",
      "Compra sem tributos = valor × (1 − ICMS) × (1 − 9,25%).",
    ],
    exemplo: "Nota de R$ 1.000,00 com ICMS de 12%: 1.000 × 0,88 × 0,9075 = R$ 798,60." },
  { sigla: "CGF", nome: "Custo do Gás Faturado",
    formula: "CGF = volume final × PMPV do mês",
    explica: ["Volume final = volume faturado (já sem consumo próprio) − devoluções."],
    exemplo: "100 m³ faturados − 5 m³ devolvidos = 95 m³. Com PMPV de R$ 8,00: 95 × 8 = R$ 760,00." },
  { sigla: "RPV", nome: "Recuperação de Preço de Venda",
    formula: "RPV = CGR − CGF",
    explica: ["É a diferença entre o que a Copergás pagou e o que ela cobrou pelo gás."],
    exemplo: "798,60 − 760,00 = R$ 38,60." },
  { sigla: "RET", nome: "Recuperação de Encargos de Transporte",
    formula: "RET = EAT × (1 − 9,25%) + EC",
    explica: ["O sistema desconta o PIS/COFINS (9,25%) só do EAT, não do EC."],
    exemplo: "EAT de R$ 100,00 e EC de R$ 20,00: 100 × 0,9075 + 20 = R$ 110,75." },
  { sigla: "RP", nome: "Recuperação das Penalidades",
    formula: "RP = (despesas − receitas) × (1 − 9,25%)",
    explica: [
      "Nota de TOP não recuperável conta como receita, mesmo na pasta de despesas.",
      "Despesa que já está no RET vale 0.",
      "A pasta \"Substituídos\" fica de fora.",
      "A mesma nota não pode aparecer duas vezes.",
    ],
    exemplo: "Despesas de R$ 300,00 e receitas de R$ 100,00: (300 − 100) × 0,9075 = R$ 181,50." },
  { sigla: "SCG", nome: "Saldo da Conta Gráfica",
    formula: "SCG = RPV + RET + RP",
    explica: ["É o saldo do mês."],
    exemplo: "38,60 + 110,75 + 181,50 = R$ 330,85." },
  { sigla: "SR", nome: "Saldo Remanescente",
    formula: "SR do mês = (VP − VF) × PR × (1 + SELIC) + SR anterior",
    explica: [
      "SR do trimestre = soma dos 3 meses.",
      "A SELIC é a acumulada do mês até o fim do trimestre, vinda do Banco Central.",
      "O PR de cada mês é o do trimestre fiscal que contém o mês de 3 meses antes. Exemplo: janeiro usa o PR de ago–out do ano anterior.",
    ],
    exemplo: "VP de 100 m³, VF de 90 m³, PR de R$ 2,00, SELIC de 1% e SR anterior zero: 10 × 2 × 1,01 = R$ 20,20." },
  { sigla: "PR", nome: "Parcela de Recuperação",
    formula: "PR = (SCG com SELIC + SR com SELIC) ÷ VP do trimestre do PR",
    explica: ["Transforma o saldo total em um ajuste de preço por m³."],
    exemplo: "Saldo total de R$ 1.000,00 ÷ 500 m³ de VP = R$ 2,00 por m³." },
  { sigla: "PMPV", nome: "Preço Médio Ponderado de Venda",
    formula: "PMPV = Σ(preço × volume) ÷ Σ volume",
    explica: ["Preço = molécula + transporte + logística. O símbolo Σ quer dizer \"a soma de todos\"."],
    exemplo: "Empresa A: R$ 8,00 e 60 m³. Empresa B: R$ 9,00 e 40 m³. (480 + 360) ÷ 100 = R$ 8,40." },
  { sigla: "PV", nome: "Preço de Venda",
    formula: "PV = PMPV + PR",
    explica: ["Tarifa = PV + MB. A MB é anual: o valor é definido pelo regulador. O sistema já conhece a de 2026; para outros anos o analista digita e fica salva."],
    exemplo: "8,40 + 2,00 = R$ 10,40. Com MB de R$ 1,50, a tarifa é R$ 11,90." },
];

/** Bloco "As contas": só mostra, não calcula. Os números são fictícios. */
export function AsContas() {
  return (
    <div className={CARD_VINHO}>
      <p className="text-sm leading-relaxed text-vinho-texto">
        Os números abaixo são inventados, só para você ver a conta andando. O cálculo de verdade é feito pelo sistema, nunca pela tela.
      </p>
      <ul className="mt-4 flex flex-col gap-3">
        {CONTAS.map((c) => (
          <li key={c.sigla} className="rounded-lg border border-vinho-borda bg-vinho-caixa px-4 py-3">
            <h3 className="text-sm font-semibold text-vinho-titulo">{c.sigla} — {c.nome}</h3>
            <p className="mt-1.5 font-mono text-sm leading-relaxed text-vinho-titulo">{c.formula}</p>
            {c.explica.length > 0 && (
              <ul className="mt-2 list-disc space-y-0.5 pl-4 text-[0.8rem] leading-relaxed text-vinho-texto marker:text-vinho-mudo">
                {c.explica.map((e, i) => <li key={i}>{e}</li>)}
              </ul>
            )}
            <p className="mt-2 text-[0.8rem] leading-relaxed text-vinho-texto">
              <span className="font-semibold text-vinho-titulo">Exemplo: </span>{c.exemplo}
            </p>
          </li>
        ))}
      </ul>
    </div>
  );
}
