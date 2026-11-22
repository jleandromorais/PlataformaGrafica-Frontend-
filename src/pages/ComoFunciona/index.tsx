import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { Tabs } from "@heroui/react";
import { PageHeader } from "../../components/layout/PageHeader";
import { MODULOS } from "../../components/layout/modulos";
import { GLOSSARIO } from "../../utils/glossario";
import { PassoAPasso } from "./PassoAPasso";
import { TabelaTelas } from "./TabelaTelas";
import { AsContas } from "./AsContas";

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

const P = "max-w-3xl text-[0.95rem] leading-relaxed text-zinc-300";
const FOCO = "rounded underline underline-offset-2 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-400";
const CAIXA = "rounded-xl border border-white/[0.07] bg-panel p-5";

function Titulo({ id, children }: { id: string; children: ReactNode }) {
  return <h2 id={id} className="text-xl font-bold tracking-tight text-white">{children}</h2>;
}

/** Aba "O que é o sistema". */
function OQueE() {
  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-3">
        <p className={P}>A tarifa do gás tem duas partes.</p>
        <ul className={`${P} list-disc space-y-1 pl-5 marker:text-zinc-500`}>
          <li><strong className="text-white">O preço do gás (o PV).</strong> Repassa o que a Copergás paga aos supridores.</li>
          <li><strong className="text-white">A margem de distribuição (MB).</strong> É o que a Copergás ganha.</li>
        </ul>
        <p className={P}>
          A Conta Gráfica cuida da primeira parte: a Copergás não ganha nem perde com o preço do gás.
          Todo trimestre o sistema compara o previsto com o real, calcula o saldo e o transforma num ajuste de preço, o PR, para o trimestre seguinte.
        </p>
      </div>

      <div className="rounded-xl border border-sky-500/30 bg-sky-500/10 p-4 text-sm leading-relaxed text-zinc-200">
        <p className="font-semibold text-white">Dois trimestres diferentes</p>
        <ul className="mt-1 list-disc space-y-1 pl-5 marker:text-sky-400">
          <li>O trimestre <strong className="text-white">apurado</strong> é o que passou, o que você confere.</li>
          <li>O PR <strong className="text-white">vale</strong> no trimestre seguinte, a partir de 2 meses depois do fim do apurado.</li>
        </ul>
        <p className="mt-2">Jan–Mar vira o PR de Mai–Jul. Abr–Jun vira Ago–Out. Jul–Set vira Nov–Jan (do ano seguinte). Out–Dez vira Fev–Abr (do ano seguinte).</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className={CAIXA}>
          <h3 className="text-base font-semibold text-white">O sistema faz</h3>
          <ul className="mt-2 list-disc space-y-1.5 pl-5 text-sm leading-relaxed text-zinc-300 marker:text-emerald-400">
            <li>Lê as notas e as planilhas e mostra o resultado antes de gravar.</li>
            <li>Recalcula o RPV e o SCG ao gravar.</li>
            <li>Depois de gravar, o Painel mostra o bloco &quot;Aguardando sua aprovação&quot; com o SR, o PR e o PV: o valor gravado (Antes) ao lado do calculado (Novo).</li>
            <li>Busca a SELIC no Banco Central.</li>
            <li>Marca na Conferência do mês o que variou mais de 20% e as empresas que mandaram no mês anterior e não neste.</li>
          </ul>
        </div>
        <div className={CAIXA}>
          <h3 className="text-base font-semibold text-white">O sistema não faz</h3>
          <ul className="mt-2 list-disc space-y-1.5 pl-5 text-sm leading-relaxed text-zinc-300 marker:text-amber-400">
            <li>Não grava SR, PR e PV em silêncio. Só grava depois que você clica em Aprovar em sequência ou grava o passo no cartão dele, no Painel.</li>
            <li>Não grava nada sem você confirmar.</li>
            <li>Não grava o SR nem o PR com SELIC 0%.</li>
            <li>Não inventa dado que falta. Sem o PMPV do trimestre não há VP: o SR bloqueia e avisa.</li>
            <li>Não corrige planilha.</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

function ProvaReal() {
  return (
    <div className="flex flex-col gap-4">
      <p className={P}>
        Em cada tela, o sistema refaz a conta do mês com os números gravados e compara com o valor gravado.
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
            Não garante que os itens (notas, volumes) sejam os certos. Compare a quantidade de itens e o total com a sua planilha.
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
      <ul className={`${P} list-disc space-y-2 pl-5 marker:text-zinc-500`}>
        <li>
          <strong className="text-white">Nota repetida</strong> (no RP). O processamento junta a original e a &quot;Atualizada&quot; quando o nome do arquivo tem PFP ou TOPNREC e o mesmo número, e mantém a &quot;Atualizada&quot;.
          Não junta: arquivo sem PFP/TOPNREC no nome; nota &quot;cancelada&quot; (entra negativa); a mesma nota nas duas pastas.
          O Gravar não refaz essa limpeza: quem avisa as repetidas é a prova real.
        </li>
        <li><strong className="text-white">PDF não lido com valor 0</strong> (no RP).</li>
        <li><strong className="text-white">Fontes desatualizadas</strong> (no SR).</li>
        <li><strong className="text-white">Alterações</strong> (SCG, SR, PR e PV). Lista a data, a hora, o valor antigo e o novo. Não identifica a pessoa.</li>
      </ul>
    </div>
  );
}

function Pegadinhas() {
  return (
    <ul className={`${P} list-disc space-y-3 pl-5 marker:text-amber-400`}>
      <li><strong className="text-white">Duas grades de trimestre.</strong> O trimestre civil (Jan–Mar, Abr–Jun, Jul–Set, Out–Dez) vale para CGR, CGF, RET, RP, SCG e SR. O do ciclo (Nov–Jan, Fev–Abr, Mai–Jul, Ago–Out) vale para PMPV, PR e PV. O PR de Mai–Jul usa o SCG e o SR de Jan–Mar.</li>
      <li><strong className="text-white">O ano da chave muda.</strong> No PMPV e no PV, o ano é o do primeiro mês (Nov–Jan/2025 = Nov/2025, Dez/2025 e Jan/2026). No PR, é o do último mês (Nov–Jan/2026). Só difere no Nov–Jan.</li>
      <li><strong className="text-white">A ordem importa.</strong> O SR de cada mês usa o PR do trimestre fiscal do próprio mês. O PR usa o SR salvo do trimestre apurado. Sem PR salvo, o SR não grava. Sem SR salvo, não sai o PR.</li>
      <li><strong className="text-white">Cuidado com os sinais.</strong> RP = despesas − receitas: fica negativo quando as receitas (TOP incluído) são maiores. A devolução entra negativa no CGR. RPV = CGR − CGF. O SR fica negativo quando VF &gt; VP.</li>
      <li><strong className="text-white">Processar não grava; Gravar grava só aquele módulo.</strong> &quot;Processar&quot; só mostra. &quot;Gravar&quot; usa os itens que a tela enviou (não lê os arquivos de novo) e pede confirmação quando troca um valor já gravado ou há divergência. O SR, o PR e o PV só mudam quando você os grava no cartão de cada um, ou clica em Aprovar em sequência no bloco &quot;Aguardando sua aprovação&quot; do Painel.</li>
      <li><strong className="text-white">Prévia vazia não é erro.</strong> Se nada mudou no SR, PR e PV, não há o que aprovar.</li>
      <li><strong className="text-white">SELIC 0% trava.</strong> O SR e o PR não gravam com SELIC 0%. A SELIC do SR é a acumulada, do mês até o fim do trimestre, e só existe depois que o trimestre fecha.</li>
      <li><strong className="text-white">Arredondamento e o que fica fora.</strong> PMPV, PR e PV têm 4 casas, e o volume tem 2 antes de multiplicar. Notas canceladas e consumo próprio não entram no volume final do CGF. Despesa que já está no RET entra no RP com valor 0, mas só se o RET já estiver salvo.</li>
      <li><strong className="text-white">SR e PR só existem aqui.</strong> Os dois saíram do app desktop.</li>
    </ul>
  );
}

function Glossario() {
  return (
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
  );
}

const ABAS: { id: string; titulo: string; conteudo: ReactNode }[] = [
  { id: "o-que-e", titulo: "O que é o sistema", conteudo: <OQueE /> },
  { id: "as-contas", titulo: "As contas", conteudo: <AsContas /> },
  { id: "onde-fica", titulo: "Onde fica cada coisa", conteudo: <TabelaTelas /> },
  { id: "prova-real", titulo: "Prova real", conteudo: <ProvaReal /> },
  { id: "pegadinhas", titulo: "Pegadinhas", conteudo: <Pegadinhas /> },
  { id: "glossario", titulo: "Glossário", conteudo: <Glossario /> },
];

export default function ComoFuncionaPage() {
  return (
    <div className="px-4 py-6 sm:px-8 lg:px-10 lg:py-8">
      <div className="mx-auto flex w-full max-w-[1100px] flex-col gap-10">
        <PageHeader modulo="comofunciona"
          descricao="O trimestre em nove passos. O resto fica nas abas, para consultar quando precisar." />

        <section aria-labelledby="passos-t" className="flex flex-col gap-4">
          <Titulo id="passos-t">O trimestre, passo a passo</Titulo>
          <PassoAPasso />
        </section>

        <section aria-labelledby="nao-bate-t" className="flex flex-col gap-4">
          <Titulo id="nao-bate-t">Se algo não bater</Titulo>
          <ol className={`${CAIXA} grid gap-x-8 gap-y-2 text-sm leading-relaxed text-zinc-300 sm:grid-cols-2 [&>li]:ml-5 [&>li]:list-decimal [&>li]:marker:font-semibold [&>li]:marker:text-zinc-400`}>
            <li>Abra a tela e clique no mês. Veja a prova real.</li>
            <li>Confira de onde vem o número. O <Link to={MODULOS.scg.to} className={FOCO}>SCG</Link> mostra a origem de CGR, CGF, RET e RP.</li>
            <li>Compare com a sua planilha.</li>
            <li>Reprocesse <strong className="text-white">só aquele mês</strong> no <Link to={MODULOS.ciclo.to} className={FOCO}>Painel do Ciclo</Link>: desmarque tudo e marque só a etapa-mês.</li>
            <li>Confira o resultado antes de gravar. A decisão é sua.</li>
            <li>Depois de gravar, aprove no Painel o SR, o <Link to={MODULOS.pr.to} className={FOCO}>PR</Link> e <Link to={MODULOS.pv.to} className={FOCO}>PV</Link>.</li>
          </ol>
        </section>

        <section aria-labelledby="consulta-t" className="flex flex-col gap-4">
          <Titulo id="consulta-t">Para consultar</Titulo>
          <Tabs defaultSelectedKey="o-que-e" className="w-full">
            <Tabs.ListContainer>
              <Tabs.List aria-label="Assuntos de consulta">
                {ABAS.map((a) => (
                  <Tabs.Tab key={a.id} id={a.id}>
                    {a.titulo}
                    <Tabs.Indicator />
                  </Tabs.Tab>
                ))}
              </Tabs.List>
            </Tabs.ListContainer>
            {ABAS.map((a) => (
              <Tabs.Panel key={a.id} id={a.id} className="px-0 pt-5">{a.conteudo}</Tabs.Panel>
            ))}
          </Tabs>
        </section>
      </div>
    </div>
  );
}
