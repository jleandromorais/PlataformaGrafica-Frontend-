import { Link } from "react-router-dom";
import { EmptyState } from "./EmptyState";
import { classesDoBotao } from "./estilosBotao";
import { MODULOS } from "../layout/modulos";

/** Estado vazio das telas de consulta (CGR, CGF, RET, RP): diz onde o valor é gravado
 * e leva até lá. A única ação possível aqui é abrir o Painel do Ciclo. */
export function SemGravacaoAinda({ sigla, passo }: { sigla: "CGR" | "CGF" | "RET" | "RP"; passo: string }) {
  return (
    <EmptyState
      label={`Nenhum ${sigla} gravado ainda.`}
      hint={`O ${sigla} é gravado pelo Painel do Ciclo, no passo ${passo}.`}
      acao={<Link to={MODULOS.ciclo.to} className={classesDoBotao("primary", "md")}>Abrir o Painel do Ciclo</Link>}
    />
  );
}
