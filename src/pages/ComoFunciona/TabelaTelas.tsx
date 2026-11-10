import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { MODULOS } from "../../components/layout/modulos";

interface Linha {
  nome: string;
  to: string;
  serve: ReactNode;
  dados: ReactNode;
  grava: ReactNode;
}

const CONFERENCIA = "Mostra a fórmula, a prova real do mês e o histórico. Clicar num mês abre a prova real dele.";

const LINHAS: Linha[] = [
  { nome: "PMPV", to: MODULOS.pmpv.to,
    serve: "Calcula e salva o preço e o volume previsto (VP) do trimestre.",
    dados: "Memória de Cálculo ou digitação.", grava: "A própria tela." },
  { nome: "Painel do Ciclo", to: MODULOS.ciclo.to,
    serve: "Mostra o que está pronto e o que falta no trimestre. Tem o card do SR e a comparação com a planilha.",
    dados: "A pasta do trimestre, que você envia.", grava: "O botão Processar grava Auditoria, CGF, RET e RP." },
  ...([
    ["Auditoria CGR", MODULOS.auditoria.to, "Não grava aqui: a leitura das notas e a gravação são no Painel do Ciclo."],
    ["CGF", MODULOS.cgf.to, "Não grava aqui: as planilhas são processadas e gravadas no Painel do Ciclo."],
    ["RPV", MODULOS.rpv.to, "Não grava: é recalculado sozinho quando o CGR e o CGF são gravados."],
    ["RET", MODULOS.ret.to, "Não grava aqui: os PDFs são processados e gravados no Painel do Ciclo."],
    ["RP", MODULOS.conciliacao.to, "Não grava aqui: os PDFs são processados e gravados no Painel do Ciclo."],
    ["SCG", MODULOS.scg.to, "A própria tela, no botão Salvar do mês (o SCG também é recalculado ao gravar os módulos)."],
    ["SR", MODULOS.sr.to, "A própria tela (Salvar SR do trimestre) ou o card do SR no Painel do Ciclo."],
    ["PR", MODULOS.pr.to, "A própria tela (Salvar PR). Também é regravado sozinho quando o SCG ou o SR mudam."],
    ["PV", MODULOS.pv.to, "A própria tela (Salvar PV do trimestre). Também é regravado sozinho quando o PMPV ou o PR mudam."],
  ] as const).map(([nome, to, grava]): Linha => ({
    nome, to, serve: CONFERENCIA, dados: "O que já está gravado.", grava,
  })),
  { nome: "Excel Final e Nota Técnica", to: MODULOS.excel.to,
    serve: "As entregas do ciclo: a planilha consolidada e a minuta do documento.",
    dados: "Os meses já gravados.", grava: "Não grava: só gera os arquivos." },
  { nome: "Dashboard", to: MODULOS.dashboard.to,
    serve: "Visão geral dos meses gravados.", dados: "O que já está gravado.", grava: "Não grava." },
];

export function TabelaTelas() {
  return (
    <div className="overflow-x-auto rounded-xl border border-white/[0.07] bg-panel" tabIndex={0} role="region" aria-label="Tabela das telas (role para o lado se precisar)">
      <table className="w-full min-w-[40rem] border-collapse text-left text-sm">
        <caption className="sr-only">Cada tela, para que serve, de onde vêm os dados e quem grava</caption>
        <thead>
          <tr className="border-b border-white/[0.07] text-xs text-zinc-400">
            <th scope="col" className="px-4 py-3 font-semibold">Tela</th>
            <th scope="col" className="px-4 py-3 font-semibold">Para que serve</th>
            <th scope="col" className="px-4 py-3 font-semibold">De onde vêm os dados</th>
            <th scope="col" className="px-4 py-3 font-semibold">Quem grava</th>
          </tr>
        </thead>
        <tbody>
          {LINHAS.map((l) => (
            <tr key={l.nome} className="border-b border-white/[0.05] align-top last:border-0">
              <th scope="row" className="px-4 py-3 font-semibold text-white">
                <Link to={l.to} className="rounded underline-offset-2 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-400">{l.nome}</Link>
              </th>
              <td className="px-4 py-3 leading-relaxed text-zinc-300">{l.serve}</td>
              <td className="px-4 py-3 leading-relaxed text-zinc-300">{l.dados}</td>
              <td className="px-4 py-3 leading-relaxed text-zinc-300">{l.grava}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
