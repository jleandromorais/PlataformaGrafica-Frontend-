/** O bloco "Próximo passo" do topo do Painel do Ciclo: qual é o título, o texto e o ÚNICO botão
 * para cada situação (tabela da seção 3 de docs/specs/SPEC_FLUXO_UNICO.md).
 *
 * Função pura. NÃO decide qual é o próximo passo nem o que está bloqueado: isso continua em
 * `proximoPasso.ts` (a ordem e as regras de bloqueio moram lá e em `utils/etapasDoCiclo.ts`);
 * aqui só se transforma esse resultado em texto e ação. Os links vêm prontos de quem chama (`linkDe`),
 * para este módulo não depender do roteador. */
import { GLOSSARIO, tituloDe } from "../../utils/glossario";
import { etapaDaChave, rotuloDaEtapa } from "../../utils/etapasDoCiclo";
import { ID_APROVACAO } from "../../utils/aprovacao";
import type { Bloqueio, ChavePasso, DestinoBloqueio, EntradaPasso, ResultadoCiclo } from "./proximoPasso";

// Ids dos blocos da página: os botões "rolar" levam até eles.
export const ID_PASTA = "importar-pasta";         // bloco recolhível "Processar a pasta" (área de soltar)
export const ID_PROCESSAR = "processar-trimestre"; // o Processar, depois de aberto
export const ID_COMPARAR = "comparar-planilha";    // "Comparar com a planilha" e o campo da planilha oficial
export const ID_SR = "sr-do-trimestre";            // card do SR
export { ID_APROVACAO };                           // bloco "Aguardando sua aprovação" (mora em utils/aprovacao.ts)
export const ID_ENTREGAS = "entregas";
export const idDoPasso = (chave: ChavePasso) => `passo-${chave}`;

export type TipoDeAcao = "rolar" | "link" | "abrir-processar" | "recarregar";
export interface AcaoDoBloco {
  tipo: TipoDeAcao;
  rotulo: string;
  /** rolar e abrir-processar: id da seção; link: o endereço; recarregar: vazio. */
  alvo: string;
}

export type CasoDoBloco =
  | "erro" | "aprovar" | "pasta" | "pasta-de-novo" | "processar" | "pmpv" | "scg" | "sr" | "pr-pv" | "bloqueado" | "pronto";

export interface BlocoProximoPasso {
  caso: CasoDoBloco;
  /** "Passo 4 de 9" (da lista única); null onde não há um passo (aprovar, pronto, erro...). */
  passo: string | null;
  /** Nome por extenso do passo ("RET — Recuperação de Encargos de Transporte"). */
  etapa: string | null;
  titulo: string;
  texto: string;
  acao: AcaoDoBloco | null;
  /** Até 3 passos que vêm depois, só os nomes. */
  depois: string[];
  /** Passo da lista que "Ver motivo" mostra; null quando não há passo. */
  verMotivo: ChavePasso | null;
}

export interface EntradaBloco {
  /** A carga do Painel falhou: o bloco não chuta passo. */
  erro: boolean;
  proximo: ChavePasso | null;
  bloqueios: ResultadoCiclo["bloqueios"];
  /** Os passos do Painel, na ordem (a mesma entrada de calcularProximoPasso). */
  passos: EntradaPasso[];
  temPasta: boolean;
  /** Os arquivos da pasta estão na memória (depois de recarregar a página só ficam os nomes). */
  temArquivos: boolean;
  nomePasta: string;
  /** O trimestre ABERTO tem SR, PR ou PV desatualizado e o analista já pode aprovar (sem pendência que trave). */
  aguardandoAprovacao: boolean;
  /** Do back novo (GET /ciclo/situacao); null ou ausente no back antigo. */
  selic?: { fechada?: boolean; fecha_em?: string | null } | null;
  rotulos: {
    /** "Jul a Set/2026": o trimestre civil apurado. */
    apurado: string;
    /** "Nov/2026 a Jan/2027": o trimestre do ciclo que o PR e o PV definem. */
    ciclo: string;
    /** "Fev a Abr": o 1º trimestre do ciclo sem PMPV (botão do passo 1); null se não há. */
    pmpvPendente: string | null;
  };
  /** Endereço da tela que resolve o bloqueio ou abre o passo (já com o trimestre do Painel). */
  linkDe: (destino: DestinoBloqueio) => string;
}

const MESES_DO_PROCESSAR: ChavePasso[] = ["auditoria", "cgf", "ret", "rp"];

/** ["Ago/2026", "Set/2026"] → "Ago e Set"; três → "Jul, Ago e Set". */
function listaDeMeses(meses: string[]): string {
  const m = meses.map((x) => x.split("/")[0]);
  return m.length <= 1 ? m.join("") : `${m.slice(0, -1).join(", ")} e ${m[m.length - 1]}`;
}

/** "2026-09-30" → "30/09". O que não for essa data volta como veio. */
export function dataBR(iso: string | null | undefined): string {
  if (!iso) return "";
  const m = /^\d{4}-(\d{2})-(\d{2})$/.exec(iso);
  return m ? `${m[2]}/${m[1]}` : iso;
}

const maiuscula = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
const nomeDoPasso = (c: ChavePasso) => { const e = etapaDaChave(c); return e.sigla ?? e.nome; };

function etapaPorExtenso(c: ChavePasso): string {
  const e = etapaDaChave(c);
  return e.sigla && e.sigla in GLOSSARIO ? tituloDe(e.sigla as keyof typeof GLOSSARIO) : e.nome;
}

const ROTULO_DO_BLOQUEIO: Partial<Record<DestinoBloqueio, string>> = { pmpv_novo: "Abrir o PMPV do trimestre novo" };

export function blocoDoProximoPasso(e: EntradaBloco): BlocoProximoPasso {
  const base = { passo: null, etapa: null, depois: [] as string[], verMotivo: null };

  if (e.erro) {
    return { ...base, caso: "erro", titulo: "Não consegui ver a situação do trimestre",
      texto: "Sem isso eu não sei dizer o próximo passo. Nada foi gravado.",
      acao: { tipo: "recarregar", rotulo: "Tentar de novo", alvo: "" } };
  }

  if (e.aguardandoAprovacao) {
    return { ...base, caso: "aprovar", titulo: "Aprove o SR, o PR e o PV",
      texto: "Você gravou algo que mudou o que vem à frente. Nada é gravado sem a sua aprovação.",
      acao: { tipo: "rolar", rotulo: "Revisar e aprovar", alvo: ID_APROVACAO } };
  }

  const contaveis = e.passos.filter((p) => !p.soLink);
  const pendentes = contaveis.filter((p) => p.situacao !== "ok");
  // A tarifa média só se fecha no PMPV: o back pode apontá-la, mas ela não é um passo a processar.
  const proximo: ChavePasso | null = e.proximo && e.proximo !== "tarifa"
    ? e.proximo
    : pendentes.find((p) => !e.bloqueios[p.chave])?.chave ?? null;
  const primeiroBloqueio = pendentes.map((p) => ({ chave: p.chave, b: e.bloqueios[p.chave] })).find((x) => x.b)?.b as Bloqueio | undefined;
  const porChave = new Map(e.passos.map((p) => [p.chave, p]));
  const meses = (c: ChavePasso) => porChave.get(c)?.mesesQueFaltam ?? [];
  const link = (a: AcaoDoBloco["tipo"], rotulo: string, alvo: string): AcaoDoBloco => ({ tipo: a, rotulo, alvo });

  const fimDoCaminho = (): BlocoProximoPasso => {
    if (!pendentes.length) {
      return { ...base, caso: "pronto", titulo: "Trimestre completo", texto: "Falta só baixar as entregas.",
        acao: link("rolar", "Ir para as entregas", ID_ENTREGAS) };
    }
    const selicAberta = e.selic?.fechada === false;
    const partes: string[] = [];
    if (selicAberta) {
      const data = dataBR(e.selic?.fecha_em);
      partes.push(`A SELIC de ${e.rotulos.apurado} ${data ? `fecha em ${data}` : "ainda não fechou"}.`);
    }
    if (primeiroBloqueio) {
      partes.push(selicAberta ? `Enquanto isso, ${primeiroBloqueio.motivo}.` : `${maiuscula(primeiroBloqueio.motivo)}.`);
    }
    // O título não pode contradizer o botão: com uma ação possível, o título diz qual é.
    const acao = primeiroBloqueio
      ? link("link", ROTULO_DO_BLOQUEIO[primeiroBloqueio.destino] ?? "Abrir", e.linkDe(primeiroBloqueio.destino))
      : null;
    const titulo = !primeiroBloqueio ? "Nada a fazer agora"
      : primeiroBloqueio.destino === "pmpv_novo" ? `Calcule o PMPV de ${e.rotulos.ciclo}`
      : "Falta um passo anterior";
    return { ...base, caso: "bloqueado", titulo,
      texto: partes.join(" ") || "O que falta depende de algo que ainda não está pronto.", acao };
  };

  if (!proximo) return fimDoCaminho();
  // SR com a SELIC do trimestre ainda aberta: não dá para calcular, então não é "o que fazer agora".
  if (proximo === "sr" && e.selic?.fechada === false) return fimDoCaminho();

  const pos = contaveis.findIndex((p) => p.chave === proximo);
  const depois = contaveis.slice(pos + 1).filter((p) => p.situacao !== "ok").slice(0, 3).map((p) => nomeDoPasso(p.chave));
  const dele = { passo: rotuloDaEtapa(proximo), etapa: etapaPorExtenso(proximo), depois, verMotivo: proximo };

  if (MESES_DO_PROCESSAR.includes(proximo)) {
    if (!e.temPasta) {
      return { ...dele, caso: "pasta", titulo: "Traga a pasta do ano",
        texto: `O sistema lê só os nomes dos arquivos e mostra o que achou para ${e.rotulos.apurado}.`,
        acao: link("rolar", `Trazer a pasta ${e.nomePasta}`, ID_PASTA) };
    }
    if (!e.temArquivos) {
      return { ...dele, caso: "pasta-de-novo", titulo: "Traga a pasta de novo",
        texto: `Lembrei a pasta ${e.nomePasta}, mas o navegador não guarda os arquivos depois de recarregar a página.`,
        acao: link("rolar", "Trazer a pasta de novo", ID_PASTA) };
    }
    const faltam = meses(proximo);
    return { ...dele, caso: "processar", titulo: `Processe ${etapaDaChave(proximo).nome}`,
      texto: `${faltam.length ? `Falta ${listaDeMeses(faltam)}.` : `Há ponto para conferir em ${e.rotulos.apurado}.`} Você confere o resultado antes de gravar.`,
      acao: link("abrir-processar", `Processar ${e.rotulos.apurado}`, ID_PROCESSAR) };
  }

  if (proximo === "pmpv") {
    const trimestre = e.rotulos.pmpvPendente;
    return { ...dele, caso: "pmpv", titulo: trimestre ? `Calcule o PMPV de ${trimestre}` : "Calcule o PMPV dos meses apurados",
      texto: `O CGF usa o PMPV.${meses("pmpv").length ? ` Falta ${listaDeMeses(meses("pmpv"))}.` : ""}`,
      acao: link("link", trimestre ? `Abrir o PMPV de ${trimestre}` : "Abrir o PMPV", e.linkDe("pmpv")) };
  }

  if (proximo === "scg") {
    const faltou = porChave.get("scg")?.situacao === "falta";
    return { ...dele, caso: "scg",
      titulo: faltou ? `Grave o SCG de ${listaDeMeses(meses("scg"))}` : `Confira o SCG de ${e.rotulos.apurado}`,
      texto: faltou ? "O SCG se calcula com o CGR, o CGF, o RET e o RP gravados. Abra a tela para gravar." : "Os módulos e o valor gravado não batem.",
      acao: link("link", "Abrir o SCG", e.linkDe("scg")) };
  }

  if (proximo === "sr") {
    return { ...dele, caso: "sr", titulo: `Calcule o SR de ${e.rotulos.apurado}`,
      texto: "Usa o VP, o VF, o PR e a SELIC do Banco Central.",
      acao: link("rolar", "Calcular o SR", ID_SR) };
  }

  // PR ou PV
  const sigla = proximo === "pr" ? "PR" : "PV";
  return { ...dele, caso: "pr-pv", titulo: `Confira o ${sigla} de ${e.rotulos.ciclo}`,
    texto: "Nada é gravado sem a sua confirmação.",
    acao: link("link", `Abrir o ${sigla}`, e.linkDe(proximo as DestinoBloqueio)) };
}
