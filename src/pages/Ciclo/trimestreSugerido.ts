/** Trimestre civil que o Painel abre sozinho: o último já terminado.
 * `tri` é 0 = Jan–Mar, 1 = Abr–Jun, 2 = Jul–Set, 3 = Out–Dez.
 * Em janeiro, fevereiro e março o último terminado é Out–Dez do ANO ANTERIOR
 * (antes o código caía em Jan–Mar do mesmo ano, que ainda nem acabou). */
export function trimestreSugerido(hoje: Date): { ano: number; tri: number } {
  const atual = Math.floor(hoje.getMonth() / 3);
  return atual === 0
    ? { ano: hoje.getFullYear() - 1, tri: 3 }
    : { ano: hoje.getFullYear(), tri: atual - 1 };
}
