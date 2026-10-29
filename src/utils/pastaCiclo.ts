/** Reconhece, pelo caminho de cada arquivo, a qual etapa do ciclo e a qual mês
 * ele pertence — sem abrir o arquivo. Segue a organização da pasta do ciclo
 * (ex.: SCG-26): "RPV/CGR/01 jan-26 Notas Fiscais", "RPV/CGF/total mensal
 * 01-2026", "RET/.../EAT jan26", "RP/Jan-26/Receita-…", "RP/TOP/02 - fev26 TOP".
 *
 * Nunca adivinha calado: o que não tem certeza vai em `avisos`.
 */

export type Etapa = "auditoria" | "cgf" | "ret" | "conciliacao";
export type Categoria = "receita" | "despesa";

export const NOMES_ETAPA: Record<Etapa, string> = {
  auditoria: "Auditoria CGR (NF de compra)",
  cgf: "CGF (planilhas de NF faturadas)",
  ret: "RET (encargos de transporte)",
  conciliacao: "RP — Conciliação (penalidades)",
};

const MESES = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
const NOMES: Record<string, number> = {
  jan: 0, janeiro: 0, fev: 1, fevereiro: 1, mar: 2, marco: 2, abr: 3, abril: 3, mai: 4, maio: 4,
  jun: 5, junho: 5, jul: 6, julho: 6, ago: 7, agosto: 7, set: 8, setembro: 8, out: 9, outubro: 9,
  nov: 10, novembro: 10, dez: 11, dezembro: 11,
};
const EXTENSOES: Record<Etapa, string[]> = {
  auditoria: ["xml", "pdf"],
  cgf: ["xlsx", "xls", "csv"],
  ret: ["pdf"],
  conciliacao: ["pdf"],
};

const semAcento = (s: string) => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

/** Mês e ano de um trecho do caminho: "01 jan-26", "jan26", "total mensal 01-2026",
 * "56. Agosto 2026", "02 fev -26". Ano ausente ("06 jun") → ano null. */
export function mesDoTexto(texto: string): { mes: number; ano: number | null } | null {
  // Data completa (ex.: "OneDrive_1_14-07-2026", dia em que foi baixado) não diz o mês da pasta.
  const t = semAcento(texto).replace(/(?<!\d)\d{1,2}[-./]\d{1,2}[-./]\d{2,4}(?!\d)/g, " ");
  // Intervalo ("RET-jan-mar-26", "jan a mar"): pasta de trimestre, não de um mês.
  const M = "(?:jan|fev|mar|abr|mai|jun|jul|ago|set|out|nov|dez)";
  if (new RegExp(String.raw`(?:^|[^a-z])${M}[a-z]*\s*(?:-|a|ate)\s*${M}(?![a-z])`).test(t)) return null;
  const nome = t.match(/(?:^|[^a-z])(janeiro|fevereiro|marco|abril|maio|junho|julho|agosto|setembro|outubro|novembro|dezembro|jan|fev|mar|abr|mai|jun|jul|ago|set|out|nov|dez)(?![a-z])\s*[-./ ]?\s*(\d{4}|\d{2})?(?!\d)/);
  if (nome) {
    const ano = nome[2] ? (nome[2].length === 2 ? 2000 + Number(nome[2]) : Number(nome[2])) : null;
    return { mes: NOMES[nome[1]], ano };
  }
  const num = t.match(/(?:^|[^\d])(0[1-9]|1[0-2])\s*[-./]\s*(20\d{2}|\d{2})(?!\d)/);
  if (num) return { mes: Number(num[1]) - 1, ano: num[2].length === 2 ? 2000 + Number(num[2]) : Number(num[2]) };
  return null;
}

function etapaDoSegmento(seg: string): Etapa | null {
  const t = semAcento(seg);
  if (/^rp\b|penalidade|\btop\b|receita|despesa/.test(t)) return "conciliacao";
  if (/^ret\b|\beat\b|encargos? de transporte/.test(t)) return "ret";
  if (/\bcgf\b|total mensal/.test(t)) return "cgf";
  if (/\bcgr\b|notas fiscais|\bnfs?\b/.test(t)) return "auditoria";
  return null;
}

/** Vale a pasta mais próxima do arquivo ("RP/abr-26/07 jul-26 NFs.zip" são notas de
 * compra, não penalidade); se uma pasta acima for de outra etapa, ela volta em
 * `pastaDeOutraEtapa` para virar aviso. */
function etapaDoCaminho(segs: string[]): { etapa: Etapa; indice: number; categoria?: Categoria; pastaDeOutraEtapa?: string } | null {
  const etapas = segs.map(etapaDoSegmento);
  let i = etapas.length - 1;
  while (i >= 0 && !etapas[i]) i--;
  if (i < 0) return null;
  const etapa = etapas[i]!;
  const raiz = etapas.findIndex(Boolean);
  const pastaDeOutraEtapa = etapas[raiz] !== etapa ? segs[raiz] : undefined;
  if (etapa !== "conciliacao") return { etapa, indice: i, pastaDeOutraEtapa };
  // TOP não recuperável é receita mesmo dentro da pasta de despesa.
  const receita = /\btop\b|receita/.test(semAcento(segs.slice(1).join("/")));
  return { etapa, indice: i, categoria: receita ? "receita" : "despesa", pastaDeOutraEtapa };
}

export type TipoCGF = "faturada" | "cancelada" | "devolucao";

/** Mesmas palavras de ServicosCGF.tipo_do_nome (backend): é o nome da planilha
 * que diz o tipo, não a pasta. */
export function tipoPlanilhaCGF(nome: string): TipoCGF | null {
  const n = semAcento(nome);
  if (/faturad|complementar/.test(n)) return "faturada";
  if (/canc|deneg|rejeitad/.test(n)) return "cancelada";
  if (/devolu|devolv/.test(n)) return "devolucao";
  return null;
}

export interface ArquivoClassificado {
  caminho: string;
  etapa: Etapa;
  categoria?: Categoria;
  tipoCGF?: TipoCGF;
  periodo: string | null; // "Jan/2026"
  conjunto: string;       // pasta que agrupa os arquivos daquele mês
  zip: boolean;
  avisos: string[];
}

/** Classifica um caminho relativo à pasta escolhida. `anoPadrao` completa nomes sem
 * ano ("06 jun") — e isso vira aviso. Arquivos que não são de nenhuma etapa → null. */
export function classificar(caminho: string, anoPadrao: number): ArquivoClassificado | null {
  const segs = caminho.split("/").filter(Boolean);
  const nome = segs[segs.length - 1];
  const ext = nome.toLowerCase().split(".").pop() ?? "";
  if (nome.startsWith("~$")) return null; // arquivo temporário do Office
  // Versões antigas guardadas em "substituídas"/"Substituídos" (mesma regra do backend).
  if (segs.slice(0, -1).some((x) => semAcento(x).includes("substitu"))) return null;
  const zip = ext === "zip";
  // Planilha de NF do CGF: o nome do arquivo decide, esteja onde estiver.
  const tipoCGF = EXTENSOES.cgf.includes(ext) ? tipoPlanilhaCGF(nome) : null;
  const pelaPasta = etapaDoCaminho(segs.slice(0, -1).concat(zip ? [nome] : []));
  const e = tipoCGF
    ? { etapa: "cgf" as Etapa, indice: segs.length - 2, categoria: undefined,
        pastaDeOutraEtapa: pelaPasta && pelaPasta.etapa !== "cgf" ? segs.find((x) => etapaDoSegmento(x)) : undefined }
    : pelaPasta;
  if (!e) return null;
  // No CGF só contam as planilhas de NF (ex.: "Relatório Finan 02.26.xlsx" fica de fora).
  if (!zip && (!EXTENSOES[e.etapa].includes(ext) || (e.etapa === "cgf" && !tipoCGF))) return null;

  const avisos: string[] = [];
  if (e.pastaDeOutraEtapa) avisos.push(`Está na pasta “${e.pastaDeOutraEtapa}”, mas parece ser de ${NOMES_ETAPA[e.etapa]}.`);
  // O mês vem do nome da planilha do CGF ("NF Faturadas 01.26") ou da pasta mais
  // próxima do arquivo que tenha mês no nome.
  const pastas = zip ? segs : segs.slice(0, -1);
  let achado: { mes: number; ano: number | null } | null = tipoCGF ? mesDoTexto(nome.replace(/\.[^.]+$/, "")) : null;
  let idx = achado ? pastas.length : -1;
  for (let i = pastas.length - 1; i >= 0 && !achado; i--) {
    achado = mesDoTexto(pastas[i].replace(/\.zip$/i, ""));
    if (achado) idx = i;
  }
  if (achado && achado.ano === null) {
    // ano de uma pasta acima (ex.: "RP/Jan-26/…") ou o do trimestre escolhido
    for (let i = idx - 1; i >= 0 && achado.ano === null; i--) achado.ano = mesDoTexto(pastas[i])?.ano ?? null;
    if (achado.ano === null) {
      achado.ano = anoPadrao;
      avisos.push(`“${pastas[idx]}” não tem o ano no nome; considerei ${anoPadrao}.`);
    }
  }
  const periodo = achado ? `${MESES[achado.mes]}/${achado.ano}` : null;
  if (!periodo) avisos.push("Não achei o mês no nome da pasta.");
  // Mês da pasta-mãe diferente do mês do arquivo: provável arquivo fora do lugar.
  if (achado && idx > 0) {
    for (let i = idx - 1; i >= 1; i--) {
      const mae = mesDoTexto(pastas[i]);
      if (mae && (mae.mes !== achado.mes || (mae.ano && mae.ano !== achado.ano))) {
        avisos.push(`Está dentro de “${pastas[i]}”, mas parece ser de ${periodo}.`);
        break;
      }
    }
  }
  // Sem mês: agrupa pela pasta da etapa ("CGR/09 -nf"), não por subpasta de empresa.
  const conjunto = pastas.slice(0, (idx >= 0 ? idx : e.indice) + 1).join("/").replace(/\.zip$/i, "");
  return { caminho, etapa: e.etapa, categoria: e.categoria, tipoCGF: tipoCGF ?? undefined, periodo, conjunto, zip, avisos };
}

export type Situacao = "ok" | "atencao" | "falta";

export interface CelulaMapa {
  etapa: Etapa;
  periodo: string;
  situacao: Situacao;
  arquivos: number;
  conjuntos: string[];
  avisos: string[]; // pedem atenção
  notas: string[];  // só informam (ex.: .zip repetido ignorado)
}

/** Arquivos de uma etapa-mês: os que não são .zip e os .zip "soltos". Um .zip com o
 * mesmo nome de uma pasta presente (ou de uma pasta acima dela, como "fev-26.zip" ao
 * lado de "fev-26/") é cópia: fica de fora. É o que o mapa conta e o "Processar" envia. */
export function arquivosDaCelula(reconhecidos: ArquivoClassificado[], etapa: Etapa, periodo: string) {
  const daqui = reconhecidos.filter((a) => a.etapa === etapa && a.periodo === periodo);
  const pastas = daqui.filter((a) => !a.zip);
  const zips = daqui.filter((a) => a.zip);
  const ehCopia = (z: ArquivoClassificado) =>
    pastas.some((p) => p.conjunto === z.conjunto || p.caminho.startsWith(z.caminho.replace(/\.zip$/i, "") + "/"));
  const zipsSoltos = zips.filter((z) => !ehCopia(z));
  return { daqui, pastas, zipsSoltos, copias: zips.length - zipsSoltos.length };
}

/** Caminho para enviar ao backend a partir da pasta do mês ("EAT 07 jul26/x.pdf") e o
 * nome da pasta logo acima (a "raiz" do envio), como se o usuário tivesse escolhido
 * essa pasta na tela da etapa. O backend lê EAT/EC, empresa e mês desses nomes. */
export function envioDaPastaDoMes(a: ArquivoClassificado): { caminho: string; raiz: string } {
  const acima = a.conjunto.split("/").filter(Boolean).slice(0, -1);
  return { caminho: a.caminho.split("/").slice(acima.length).join("/"), raiz: acima[acima.length - 1] ?? "" };
}

/** Mapa do trimestre: para cada etapa × mês, o que foi encontrado. Arquivos de
 * outros meses entram só na contagem de `ignorados`. */
export function mapaDoTrimestre(caminhos: string[], meses: string[]): {
  celulas: CelulaMapa[];
  ignorados: number;
  semEtapa: number;
  semMes: string[]; // pastas de alguma etapa sem mês no nome (ex.: "09 -nf")
} {
  const ano = Number(meses[0].split("/")[1]);
  const lista = caminhos.map((c) => classificar(c, ano));
  const reconhecidos = lista.filter((x): x is ArquivoClassificado => !!x);
  const etapas: Etapa[] = ["auditoria", "cgf", "ret", "conciliacao"];
  const celulas: CelulaMapa[] = [];
  for (const etapa of etapas) {
    for (const periodo of meses) {
      const { daqui, pastas, zipsSoltos, copias } = arquivosDaCelula(reconhecidos, etapa, periodo);
      const avisos = [...new Set(daqui.flatMap((a) => a.avisos))];
      const conjuntos = [...new Set(daqui.map((a) => a.conjunto))];
      const notas: string[] = copias ? ["Havia um .zip igual à pasta; usei a pasta."] : [];
      if (zipsSoltos.length) avisos.push(`${zipsSoltos.length} arquivo(s) .zip: o sistema vai extrair antes de processar.`);
      if (etapa === "conciliacao" && pastas.length) {
        const cats = new Set(pastas.map((a) => a.categoria));
        if (!cats.has("receita")) avisos.push("Não achei a pasta de receitas deste mês.");
        if (!cats.has("despesa")) avisos.push("Não achei a pasta de despesas deste mês.");
      }
      if (etapa === "cgf" && pastas.length) {
        const tipos = new Set(pastas.map((a) => a.tipoCGF));
        if (!tipos.has("faturada")) avisos.push("Falta a planilha de NF faturadas: é dela que sai o volume faturado.");
        if (!tipos.has("devolucao")) avisos.push("Falta a planilha de devoluções: sem ela o VF fica maior.");
        if (!tipos.has("cancelada")) notas.push("Sem planilha de canceladas (só informativa: não muda o VF).");
      }
      const arquivos = pastas.length + zipsSoltos.length;
      celulas.push({
        etapa, periodo, arquivos, conjuntos, avisos, notas,
        situacao: arquivos === 0 ? "falta" : avisos.length ? "atencao" : "ok",
      });
    }
  }
  return {
    celulas,
    ignorados: reconhecidos.filter((a) => !a.periodo || !meses.includes(a.periodo)).length,
    semEtapa: lista.length - reconhecidos.length,
    semMes: [...new Set(reconhecidos.filter((a) => !a.periodo).map((a) => a.conjunto))],
  };
}
