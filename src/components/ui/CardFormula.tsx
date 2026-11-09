import type { ReactNode } from "react";
import { Card } from "@heroui/react";
import { Sigma } from "lucide-react";
import { CARD_VINHO } from "./estilosCard";

/** Um termo da fórmula explicado em uma linha (ex.: "ICMS" → "alíquota da nota"). */
export interface TermoFormula {
  termo: ReactNode;
  explicacao: ReactNode;
}

/** Rótulo pequeno de cada bloco do card ("Termos", "Regras"). */
const ROTULO = "text-[0.7rem] font-semibold uppercase tracking-wide text-vinho-mudo";

/** Card (vinho) com a fórmula da tela, para todas as telas da Conta Gráfica.
 *  - `formula`: a conta principal, em destaque (fonte monoespaçada, uma linha por parte);
 *  - `aplicada` (opcional): a mesma conta com os números do mês, logo abaixo;
 *    `tituloAplicada` diz de que mês são; `atualizando` esmaece enquanto chega o mês novo;
 *  - `termos`: cada pedaço da fórmula explicado em linguagem simples;
 *  - `regras`: o que entra e o que fica fora (ex.: "frete comum fica fora");
 *  - `descricao` (opcional): uma frase curta abaixo do título.
 * Só mostra: não calcula nada. Quem monta os números é a tela. */
export function CardFormula({
  titulo = "Fórmula", descricao, formula, aplicada, tituloAplicada, atualizando = false,
  termos = [], regras = [], className = "",
}: {
  titulo?: string;
  descricao?: ReactNode;
  formula: ReactNode[];
  aplicada?: ReactNode[];
  tituloAplicada?: ReactNode;
  atualizando?: boolean;
  termos?: TermoFormula[];
  regras?: ReactNode[];
  className?: string;
}) {
  return (
    <Card<"section"> render={(props) => <section {...props} />} aria-labelledby="card-formula-titulo"
      className={`${CARD_VINHO} ${className}`}>
      <Card.Header>
        <Card.Title<"h2"> render={(props) => <h2 {...props} />} id="card-formula-titulo"
          className="flex items-center gap-2 text-base font-semibold text-vinho-titulo">
          <Sigma size={16} aria-hidden /> {titulo}
        </Card.Title>
        {descricao && <Card.Description className="mt-0.5 text-xs text-vinho-texto">{descricao}</Card.Description>}
      </Card.Header>

      <Card.Content className="gap-0">
        {/* A conta em si: monoespaçada para os símbolos (Σ, ×, −) ficarem alinhados. */}
        <div className="mt-4 rounded-lg border border-vinho-borda bg-vinho-caixa px-4 py-3 font-mono text-sm leading-relaxed text-vinho-titulo">
          {formula.map((linha, i) => <p key={i}>{linha}</p>)}

          {aplicada && aplicada.length > 0 && (
            // A mesma conta com os números do mês, separada por um filete.
            <div aria-busy={atualizando}
              className={`mt-3 whitespace-pre-wrap border-t border-vinho-borda pt-3 tabular-nums transition-opacity ${atualizando ? "opacity-50" : ""}`}>
              {tituloAplicada && <p className="mb-1 font-sans text-[0.7rem] font-semibold uppercase tracking-wide text-vinho-mudo">{tituloAplicada}</p>}
              {aplicada.map((linha, i) => <p key={i}>{linha}</p>)}
            </div>
          )}
        </div>

        {termos.length > 0 && (
          <div className="mt-4">
            <p className={ROTULO}>O que é cada termo</p>
            {/* Termo em fonte normal (não mono), compacto: termo à esquerda, explicação ao lado. */}
            <dl className="mt-1.5 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-[0.8rem] leading-5">
              {termos.map((t, i) => (
                <div key={i} className="contents">
                  <dt className="font-semibold text-vinho-titulo">{t.termo}</dt>
                  <dd className="text-vinho-texto">{t.explicacao}</dd>
                </div>
              ))}
            </dl>
          </div>
        )}
      </Card.Content>

      {regras.length > 0 && (
        <Card.Footer className="mt-4 flex-col items-stretch border-t border-vinho-borda pt-3">
          <p className={ROTULO}>Regras</p>
          <ul className="mt-1.5 list-disc space-y-0.5 pl-4 text-xs leading-relaxed text-vinho-texto marker:text-vinho-mudo">
            {regras.map((r, i) => <li key={i}>{r}</li>)}
          </ul>
        </Card.Footer>
      )}
    </Card>
  );
}
