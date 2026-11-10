import type { MouseEvent, ReactNode } from "react";
import { Link } from "react-router-dom";
import { ChevronDown } from "lucide-react";
import { PageHeader } from "../../components/layout/PageHeader";
import { MODULOS } from "../../components/layout/modulos";
import { GLOSSARIO } from "../../utils/glossario";
import { DiagramaCiclo } from "./DiagramaCiclo";
import { TabelaTelas } from "./TabelaTelas";
import { AsContas } from "./AsContas";

const SECOES = [
  { id: "o-que-e", titulo: "O que é o sistema" },
  { id: "volta-do-ciclo", titulo: "A volta do ciclo" },
  { id: "onde-fica", titulo: "Onde fica cada coisa" },
  { id: "as-contas", titulo: "As contas" },
  { id: "prova-real", titulo: "A prova real" },
  { id: "quando-nao-bate", titulo: "Quando algo não bate" },
  { id: "sozinho", titulo: "O que o sistema faz sozinho" },
  { id: "ordem", titulo: "A ordem importa" },
  { id: "pegadinhas", titulo: "Pegadinhas que confundem quem está começando" },
  { id: "glossario", titulo: "Glossário" },
];

const GLOSSARIO_EXTRA: [string, string][] = [
  ["SELIC", "Taxa de juros do Banco Central. No SR, é a SELIC acumulada do mês até o fim do trimestre, calculada com as taxas diárias, e corrige os saldos."],
  ["MB", "Margem de distribuição: a parte da tarifa que é ganho da Copergás. É anual e definida pelo regulador."],
  ["TOP", "Um tipo de nota. A nota de TOP não recuperável (a pasta ou o nome do arquivo tem \"TOP\") entra no RP como receita, mesmo vinda da pasta de despesas."],
  ["PFP", "Um tipo de nota de penalidade (aparece como NDPFP no nome do arquivo)."],
];

const TERMOS_DO_GLOSSARIO: [string, string][] = [
  ...(["PMPV", "PV", "PR", "VP", "VF", "SR", "SCG", "RPV", "RET", "RP", "CGR", "CGF", "EAT", "EC"] as const)
    .map((s): [string, string] => [s, GLOSSARIO[s as keyof typeof GLOSSARIO].nome]),
  ...GLOSSARIO_EXTRA,
];

/** Rola até a seção respeitando "menos movimento" e leva o foco junto (para leitor de tela). */
function irParaSecao(e: MouseEvent<HTMLAnchorElement>, id: string) {
  const alvo = document.getElementById(id);
  if (!alvo) return;
  e.preventDefault();
  const reduzir = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  alvo.scrollIntoView({ behavior: reduzir ? "auto" : "smooth", block: "start" });
  alvo.focus({ preventScroll: true });
  history.replaceState(null, "", `#${id}`);
}

function Secao({ id, titulo, children }: { id: string; titulo: string; children: ReactNode }) {
  return (
    <section aria-labelledby={`${id}-t`} className="flex flex-col gap-4">
      <h2 id={id} tabIndex={-1} className="scroll-mt-6 text-xl font-bold tracking-tight text-white focus:outline-none">
        <span id={`${id}-t`}>{titulo}</span>
      </h2>
      {children}
    </section>
  );
}

const P = "max-w-3xl text-[0.95rem] leading-relaxed text-zinc-300";
const FOCO = "rounded underline underline-offset-2 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-400";

/** Recolhível: o título é o botão; funciona só com teclado. */
function Recolhivel({ titulo, children }: { titulo: string; children: ReactNode }) {
  return (
    <details className="group rounded-xl border border-white/[0.07] bg-panel">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 rounded-xl px-5 py-4 text-base font-semibold text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-400 [&::-webkit-details-marker]:hidden">
        {titulo}
        <ChevronDown size={18} className="shrink-0 text-zinc-400 transition-transform group-open:rotate-180" aria-hidden />
      </summary>
      <div className="border-t border-white/[0.07] px-5 py-4">{children}</div>
    </details>
  );
}

export default function ComoFuncionaPage() {
  return (
    <div className="px-4 py-6 sm:px-8 lg:px-10 lg:py-8">
      <div className="mx-auto flex w-full max-w-[1100px] flex-col gap-10">
        <PageHeader modulo="comofunciona"
          descricao="Leia isto uma vez, antes de usar o PMPV e o Painel do Ciclo. Em poucos minutos você entende o caminho do dinheiro e onde conferir cada número." />

        <nav aria-label="Nesta página" className="rounded-xl border border-white/[0.07] bg-panel p-5">
          <p className="text-sm font-semibold text-white">Nesta página</p>
          <ol className="mt-2 grid list-decimal gap-x-8 gap-y-1 pl-5 text-sm text-zinc-300 marker:text-zinc-500 sm:grid-cols-2 lg:grid-cols-3">
            {SECOES.map((s) => (
              <li key={s.id}>
                <a href={`#${s.id}`} onClick={(e) => irParaSecao(e, s.id)} className={FOCO}>{s.titulo}</a>
              </li>
            ))}
          </ol>
        </nav>

        <Secao id="o-que-e" titulo="O que é o sistema">
          <p className={P}>A tarifa do gás tem duas partes.</p>
          <ul className={`${P} list-disc space-y-1 pl-5 marker:text-zinc-500`}>
            <li><strong className="text-white">O preço do gás (o PV).</strong> Ele só repassa o que a Copergás paga aos supridores.</li>
            <li><strong className="text-white">A margem de distribuição (MB).</strong> É o que a Copergás ganha.</li>
          </ul>
          <p className={P}>
            A Conta Gráfica cuida da primeira parte. Ela garante que a Copergás não ganhe nem perca com o preço do gás.
          </p>
          <p className={P}>
            Todo trimestre, o sistema compara o que foi previsto com o que aconteceu de verdade. Depois calcula o saldo (o que sobrou ou faltou).
            Por fim, transforma esse saldo num ajuste de preço, o PR, para o trimestre seguinte.
          </p>
        </Secao>

        <Secao id="volta-do-ciclo" titulo="A volta do ciclo">
          <p className={P}>O trabalho anda em círculo. O fim de um trimestre vira o começo do seguinte.</p>
          <DiagramaCiclo />
          <div className="max-w-3xl rounded-xl border border-sky-500/30 bg-sky-500/10 p-4 text-sm leading-relaxed text-zinc-200">
            <p className="font-semibold text-white">Dois trimestres diferentes</p>
            <ul className="mt-1 list-disc space-y-1 pl-5 marker:text-sky-400">
              <li>O trimestre <strong className="text-white">apurado</strong> é o que passou, o que você está conferindo.</li>
              <li>O trimestre em que o PR <strong className="text-white">vale</strong> é o seguinte: o ciclo apura um trimestre e aplica o resultado a partir de 2 meses depois do fim dele.</li>
            </ul>
            <p className="mt-2">Exemplos:</p>
            <ul className="mt-1 list-disc space-y-0.5 pl-5 marker:text-sky-400">
              <li>Jan–Mar vira o PR de Mai–Jul.</li>
              <li>Abr–Jun vira o PR de Ago–Out.</li>
              <li>Jul–Set vira o PR de Nov–Jan (do ano seguinte).</li>
              <li>Out–Dez vira o PR de Fev–Abr (do ano seguinte).</li>
            </ul>
          </div>
        </Secao>

        <Secao id="onde-fica" titulo="Onde fica cada coisa">
          <p className={P}>Cada tela tem um papel. Clique no nome para abrir.</p>
          <TabelaTelas />
        </Secao>

        <Secao id="as-contas" titulo="As contas">
          <p className={P}>Cada conta abaixo traz a fórmula, o que ela quer dizer e um exemplo com números inventados.</p>
          <AsContas />
        </Secao>

        <Secao id="prova-real" titulo="A prova real">
          <p className={P}>
            Em cada tela, o sistema refaz a conta do mês com os números que estão gravados. Depois compara o resultado com o valor gravado.
          </p>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4">
              <h3 className="text-sm font-semibold text-white">O que &quot;confere&quot; quer dizer</h3>
              <p className="mt-1 text-sm leading-relaxed text-zinc-200">
                O valor gravado é igual à conta refeita com os itens gravados. Vale também para &quot;está coerente&quot;.
              </p>
            </div>
            <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4">
              <h3 className="text-sm font-semibold text-white">O que NÃO quer dizer</h3>
              <p className="mt-1 text-sm leading-relaxed text-zinc-200">
                Não garante que os itens (as notas, os volumes) sejam os certos. Por isso, compare sempre a quantidade de itens e o total com a sua planilha.
              </p>
            </div>
          </div>
          <h3 className="text-base font-semibold text-white">Os quatro estados</h3>
          <ul className={`${P} list-disc space-y-1 pl-5 marker:text-zinc-500`}>
            <li><strong className="text-white">Confere.</strong> Tudo bate.</li>
            <li><strong className="text-white">Não confere.</strong> Reprocesse o mês no <Link to={MODULOS.ciclo.to} className={FOCO}>Painel do Ciclo</Link>.</li>
            <li><strong className="text-white">Mês gravado só com o total.</strong> Não dá para abrir a conta.</li>
            <li><strong className="text-white">Mês ainda não gravado.</strong> Não há o que conferir.</li>
          </ul>
          <h3 className="text-base font-semibold text-white">Alertas especiais</h3>
          <ul className={`${P} list-disc space-y-1 pl-5 marker:text-zinc-500`}>
            <li>
              <strong className="text-white">Nota repetida</strong> (no RP). O processamento junta a original e a &quot;Atualizada&quot; quando o nome do arquivo tem PFP ou TOPNREC e o mesmo número, e mantém a &quot;Atualizada&quot;.
              Ele não junta: arquivo sem PFP/TOPNREC no nome; nota &quot;cancelada&quot; (entra negativa); a mesma nota nas duas pastas (receitas e despesas).
              O botão Salvar não refaz essa limpeza: quem avisa as repetidas é a prova real. O mês gravado vale pelas notas que estavam lá na hora de gravar.
            </li>
            <li><strong className="text-white">PDF não lido com valor 0</strong> (no RP).</li>
            <li><strong className="text-white">Fontes desatualizadas</strong> (no SR).</li>
          </ul>
        </Secao>

        <Secao id="quando-nao-bate" titulo="Quando algo não bate">
          <Recolhivel titulo="Ver o roteiro em seis passos">
            <ol className={`${P} list-decimal space-y-2 pl-5 marker:font-semibold marker:text-zinc-400`}>
              <li>Abra a tela do módulo e clique no mês. Veja a prova real.</li>
              <li>Confira de onde vem o número. O <Link to={MODULOS.scg.to} className={FOCO}>SCG</Link> mostra &quot;De onde vêm os números&quot; de CGR, CGF, RET e RP.</li>
              <li>Compare com a sua planilha.</li>
              <li>Corrija o dado e reprocesse <strong className="text-white">só aquele mês</strong> no Painel do Ciclo: desmarque tudo e marque só a etapa-mês.</li>
              <li>Confira o resultado antes de gravar. O sistema avisa quando há divergência, e cabe ao analista analisar os dados antes de gravar.</li>
              <li>Depois de gravar, olhe o <Link to={MODULOS.pr.to} className={FOCO}>PR</Link> e o <Link to={MODULOS.pv.to} className={FOCO}>PV</Link> do trimestre seguinte.</li>
            </ol>
          </Recolhivel>
        </Secao>

        <Secao id="sozinho" titulo="O que o sistema faz sozinho">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-xl border border-white/[0.07] bg-panel p-5">
              <h3 className="text-base font-semibold text-white">Faz sozinho</h3>
              <ul className="mt-2 list-disc space-y-1.5 pl-5 text-sm leading-relaxed text-zinc-300 marker:text-emerald-400">
                <li>Ao gravar Auditoria, CGF, RET, RP, SCG ou SR, regrava sozinho o PR e o PV afetados. O RPV e o SCG são recalculados pelo próprio salvar.</li>
                <li>Ao gravar o PMPV ou o PR, regrava só o PV.</li>
                <li>É tudo ou nada: se faltar algum dado (SR do trimestre apurado, SCG de algum mês, VP, PMPV), nada de PR e PV é regravado e o sistema diz o que falta. O que você já gravou fica gravado.</li>
                <li>Busca a SELIC no Banco Central.</li>
              </ul>
            </div>
            <div className="rounded-xl border border-white/[0.07] bg-panel p-5">
              <h3 className="text-base font-semibold text-white">Não faz</h3>
              <ul className="mt-2 list-disc space-y-1.5 pl-5 text-sm leading-relaxed text-zinc-300 marker:text-amber-400">
                <li>Não inventa dado que falta. Sem o PMPV do trimestre não há VP: o SR bloqueia e avisa.</li>
                <li>Não grava nada sem você confirmar no Painel.</li>
                <li>Não dispara a cadeia quando você grava o RPV à mão ou o SCG à mão.</li>
                <li>Não confere a SELIC nessa cadeia: um SR salvo com SELIC 0 gera um PR com 0. Confira a SELIC antes de gravar o SR.</li>
                <li>Quem bloqueia a gravação do SR quando falta dado é a tela, não o servidor. Por isso, grave o SR pelo card do SR ou pela tela SR.</li>
                <li>Não corrige planilha.</li>
              </ul>
            </div>
          </div>
        </Secao>

        <Secao id="ordem" titulo="A ordem importa">
          <ol className={`${P} list-decimal space-y-1 pl-5 marker:font-semibold marker:text-zinc-400`}>
            <li><Link to={MODULOS.pmpv.to} className={FOCO}>PMPV</Link> do trimestre primeiro. Ele traz o VP.</li>
            <li><Link to={MODULOS.ciclo.to} className={FOCO}>Painel do Ciclo</Link>. Ele traz CGF, RET, RP e o SCG.</li>
            <li><Link to={MODULOS.sr.to} className={FOCO}>SR</Link>.</li>
            <li><Link to={MODULOS.pr.to} className={FOCO}>PR</Link> e <Link to={MODULOS.pv.to} className={FOCO}>PV</Link>.</li>
          </ol>
          <p className={P}>Se uma etapa disser que falta algo, ela diz qual tela resolve.</p>
        </Secao>

        <Secao id="pegadinhas" titulo="Pegadinhas que confundem quem está começando">
          <ul className={`${P} list-disc space-y-3 pl-5 marker:text-amber-400`}>
            <li><strong className="text-white">Duas grades de trimestre.</strong> O trimestre civil (Jan–Mar, Abr–Jun, Jul–Set, Out–Dez) vale para CGR, CGF, RET, RP, SCG e SR. O trimestre do ciclo (Nov–Jan, Fev–Abr, Mai–Jul, Ago–Out) vale para PMPV, PR e PV. O PR de Mai–Jul usa o SCG e o SR de Jan–Mar.</li>
            <li><strong className="text-white">O ano da chave muda.</strong> No PMPV e no PV, o ano é o do primeiro mês (Nov–Jan/2025 = Nov/2025, Dez/2025 e Jan/2026). No PR, o ano é o do último mês (Nov–Jan/2026). Só difere no Nov–Jan.</li>
            <li><strong className="text-white">A ordem importa.</strong> O SR de um mês usa o PR do trimestre fiscal do mês de 3 meses antes. O PR usa o SR salvo do trimestre apurado. Sem PR salvo, o SR não pode ser gravado. Sem SR salvo, não sai o PR.</li>
            <li><strong className="text-white">Cuidado com os sinais.</strong> RP = despesas − receitas: fica negativo quando as receitas (TOP incluído) são maiores. A devolução entra negativa no CGR. RPV = CGR − CGF. O SR fica negativo quando o volume faturado passa do previsto (VF &gt; VP).</li>
            <li><strong className="text-white">Processar não grava; Salvar grava.</strong> &quot;Processar&quot; só mostra e nunca grava. &quot;Salvar&quot; usa os itens que a tela enviou (não lê os arquivos de novo), grava e depois regrava em cadeia o PR e o PV. Se faltar dado, o que você salvou fica, mas o PR e o PV não, e o sistema diz o que falta.</li>
            <li><strong className="text-white">Nem toda gravação dispara a cadeia.</strong> Gravar o RPV ou o SCG à mão não atualiza PR e PV. Gravar o PMPV ou o PR atualiza só o PV.</li>
            <li><strong className="text-white">A SELIC do SR é a acumulada.</strong> É a do mês até o fim do trimestre, não a taxa do mês, e só existe depois que o trimestre fecha.</li>
            <li><strong className="text-white">Arredondamento e o que fica fora.</strong> PMPV, PR e PV têm 4 casas, e o volume tem 2 antes de multiplicar. Notas canceladas e consumo próprio não entram no volume final do CGF. Nota de despesa que já está no RET entra no RP com valor 0, mas só se o RET já tiver sido salvo.</li>
          </ul>
        </Secao>

        <Secao id="glossario" titulo="Glossário">
          <Recolhivel titulo="Ver as siglas">
            <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm leading-relaxed">
              {TERMOS_DO_GLOSSARIO.map(([sigla, nome]) => (
                <div key={sigla} className="contents">
                  <dt className="font-semibold text-white">{sigla}</dt>
                  <dd className="text-zinc-300">
                    {nome}
                    {sigla === "VP" && ". O volume que se espera vender no trimestre."}
                    {sigla === "VF" && ". O volume que foi faturado de fato."}
                  </dd>
                </div>
              ))}
            </dl>
          </Recolhivel>
        </Secao>
      </div>
    </div>
  );
}
