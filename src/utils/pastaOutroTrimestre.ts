/** Pasta trazida de outro trimestre: em vez de uma tela cheia de "não achei", uma frase que diz o que houve,
 * o que fazer e leva ao trimestre certo. Só lógica de texto: quem lê a pasta é `mapaDoTrimestre`. */
import { faixaDosMeses } from "./rotulos";
import { MESES_ABREV, lerPeriodo } from "./periodos";

export interface AvisoOutroTrimestre {
  titulo: string;
  passo: string;
  /** O trimestre civil da pasta (`tri` 0 a 3, como o Painel guarda), para o botão que leva até ele. */
  trimestre: { ano: number; tri: number; rotulo: string };
}

const ordem = (p: string) => { const d = lerPeriodo(p); return d ? d.ano * 12 + d.mes : 0; };

/** `mesesDaPasta`: meses que o sistema reconheceu nos nomes da pasta. Sem aviso quando algum deles é do trimestre aberto
 * (a pasta serve, só traz meses a mais) ou quando nenhum mês foi reconhecido (o aviso de "pasta sem mês" já cobre). */
export function avisoDePastaDeOutroTrimestre(mesesAbertos: string[], mesesDaPasta: string[]): AvisoOutroTrimestre | null {
  const meses = [...new Set(mesesDaPasta)].filter((m) => lerPeriodo(m)).sort((a, b) => ordem(a) - ordem(b));
  if (!meses.length || meses.some((m) => mesesAbertos.includes(m))) return null;
  const { ano, mes } = lerPeriodo(meses[0])!;
  const tri = Math.floor(mes / 3);
  const doTrimestre = [0, 1, 2].map((i) => `${MESES_ABREV[tri * 3 + i]}/${ano}`);
  const rotulo = faixaDosMeses(doTrimestre);
  const abertos = faixaDosMeses(mesesAbertos);
  return {
    titulo: `Esta pasta é de ${faixaDosMeses(meses)} e o trimestre aberto é ${abertos}.`,
    passo: `Abra o trimestre ${rotulo} ou traga a pasta de ${abertos}.`,
    trimestre: { ano, tri, rotulo },
  };
}
