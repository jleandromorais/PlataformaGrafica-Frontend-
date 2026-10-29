import type { CGFColunas } from "../types";

/** Colunas das planilhas de NF do CGF (mesmos padrões da tela desktop). A tela CGF
 * deixa trocar; o "Processar" do Painel do Ciclo usa sempre estas. */
export const COLUNAS_PADRAO_CGF: CGFColunas = {
  col_fat_volume: "Volume Faturado",
  col_fat_consumo: "Produto",
  val_fat_consumo: "consumo proprio",
  col_canc_volume: "Volume Canc/Deneg",
  col_dev_volume: "Volume Devolução",
};
