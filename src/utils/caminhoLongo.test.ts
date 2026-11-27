import { describe, expect, it } from "vitest";
import { avisoDeCaminhosLongos, LIMITE_CAMINHO_NA_PASTA } from "./caminhoLongo";

const longo = (n: number, nome = "nota.pdf") => `${"a/".repeat(Math.ceil((n - nome.length) / 2))}${nome}`.slice(-n);

describe("aviso de caminho longo", () => {
  it("pasta curta (como a SCG-27, até 141 caracteres) não avisa", () => {
    expect(avisoDeCaminhosLongos([
      "SCG-27/RP/out-26/Receita-10 out-26 (Receita)/ORIZON BIOMETANO - 06 2026 - NDENCND04128.pdf",
      longo(141),
    ])).toBeNull();
    expect(avisoDeCaminhosLongos([])).toBeNull();
    expect(avisoDeCaminhosLongos([longo(LIMITE_CAMINHO_NA_PASTA)])).toBeNull();
  });

  it("um caminho acima do limite avisa no singular, com o tamanho e o que fazer", () => {
    const a = avisoDeCaminhosLongos(["x/curto.pdf", longo(230, "ND_Penalidade.pdf")]);
    expect(a?.qtd).toBe(1);
    expect(a?.maior).toBe(230);
    expect(a?.exemplo).toBe("ND_Penalidade.pdf");
    expect(a?.titulo).toBe("1 arquivo tem o caminho longo demais (230 caracteres só dentro da pasta).");
    expect(a?.passo).toContain("260 caracteres");
    expect(a?.passo).toContain("carregue a pasta de novo");
  });

  it("vários: plural com o maior", () => {
    const a = avisoDeCaminhosLongos([longo(210), longo(250, "b.pdf"), longo(205)]);
    expect(a?.qtd).toBe(3);
    expect(a?.titulo).toBe("3 arquivos têm o caminho longo demais (até 250 caracteres só dentro da pasta).");
    expect(a?.exemplo).toBe("b.pdf");
  });
});
