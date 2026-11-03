import { MENOS, num } from "../../utils/format";

/** Valor em reais com "R$" e centavos menores e em cor secundária; sinal e
 * parte inteira herdam tamanho e cor do elemento pai. Tamanhos em em, para
 * acompanhar qualquer tamanho de fonte do card. */
export function Valor({ valor, secundaria = "text-zinc-500" }: { valor: number; secundaria?: string }) {
  const [inteiro, centavos] = num(Math.abs(valor), 2).split(",");
  return (
    <span className="num whitespace-nowrap">
      {valor < 0 && MENOS}
      <span className={`mr-[0.25em] text-[0.6em] ${secundaria}`}>R$</span>
      {inteiro}
      <span className={`text-[0.7em] ${secundaria}`}>,{centavos}</span>
    </span>
  );
}
