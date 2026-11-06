# Painel do Ciclo comentado

**Data:** 06/11/2026
**Arquivos estudados:** `Front_end/src/pages/Ciclo/index.tsx` (a tela) e `Front_end/src/pages/Ciclo/Processar.tsx` (o botão Processar), com as ajudantes que eles usam diretamente: `utils/pastaCiclo.ts`, `utils/pasta.ts`, `utils/lembrar.ts` e `utils/periodoNaUrl.ts`.

> **Nota:** as linhas citadas valem para a versão do código de hoje (06/11/2026). Se alguém mexer nos arquivos, os números podem mudar. Na dúvida, procure pelo nome da função.
> Todos os valores de exemplo são fictícios (R$ 1.000,00, 100 m³).

---

## Para que serve a tela

O Painel do Ciclo (endereço `/ciclo`) é a **sala de controle do trimestre**. O analista escolhe o ano e o trimestre, e a tela mostra uma lista de conferência com o que já foi feito e o que falta em cada mês. As etapas são Auditoria CGR, CGF, RET, RP, SCG, SR, PR e PV.

Também dá para apontar a **pasta do ciclo** no computador (por exemplo, `SCG-26`). A tela lê só os nomes dos arquivos, monta um mapa do que encontrou e oferece o botão **Processar**. Esse botão envia os arquivos de vários meses à API, mostra a prévia e só grava o que o analista confirmar.

A tela não faz nenhuma conta que vá para o banco. Ela só pergunta ao back-end "como está cada etapa?", mostra a resposta e leva os arquivos até lá.

Pense num **quadro de avisos de obra**: cada linha é uma etapa, com um sinal verde (pronto), amarelo (atenção) ou cinza (falta), e um botão "Fazer agora" que leva até a sala certa.

## Mapa da tela (de cima para baixo)

```
+------------------------------------------------------+
| Título "Painel do Ciclo"                             |
| [Alerta vermelho, se deu erro]                       |
+------------------------------------------------------+
| < 2026 >   [Jan–Mar] [Abr–Jun] [Jul–Set] [Out–Dez]   |  <- 1. seletor de trimestre
| Apura Abr/2026 a Jun/2026 -> PR e PV de Ago a Out    |
| ========----  (barra de progresso)                   |
+------------------------------------------------------+
| Importar da pasta do ciclo      [Escolher pasta]     |  <- 2. pasta do ciclo
|   (janela de explicação antes do seletor)            |
|   Mapa: etapa x mês  -> [Processar Abr a Jun]        |
|   +------------------------------------------------+ |
|   | Painel do Processar (Processar.tsx)            | |  <- 3. processar -> conferir -> gravar
|   | [x] Auditoria · Abr/2026   ...  R$ 1.000,00    | |
|   | [Processar 12 etapa(s)-mês]  [Cancelar]        | |
|   +------------------------------------------------+ |
+------------------------------------------------------+
| Etapas do ciclo                                      |  <- 4. lista de conferência
|  1 (ok)  Auditoria CGR    Abr: R$ 1.000,00 ...  Ver  |
|  2 (!)   CGF ...                        Fazer agora  |
|  ...                                                 |
|  9  Entregas   [Baixar minuta da NT] [Excel Final]   |
+------------------------------------------------------+
```

## Como as peças conversam

```
index.tsx (a tela)
 ├─ periodoNaUrl.ts  -> lê e escreve o trimestre no endereço; monta os links "Fazer agora"
 ├─ lembrar.ts       -> guarda-volumes do navegador (pasta escolhida, prévia do Processar)
 ├─ pasta.ts         -> abre o seletor de pasta e lista os nomes dos arquivos
 ├─ pastaCiclo.ts    -> pelos nomes, diz "este arquivo é da etapa X, mês Y"
 ├─ api/             -> as perguntas ao back-end (situação de cada etapa)
 └─ Processar.tsx    -> envia os arquivos, mostra a prévia e grava o que for confirmado
```

---

# Parte 1 — As ajudantes, em poucas palavras

Antes de abrir a tela, vale conhecer as quatro "ajudantes" que ela chama o tempo todo.

### periodoNaUrl.ts — o mês fica no endereço

```ts
export function linkDoCiclo(rota: string, cicloInicio: string, periodo?: { chave: Chave; valor: string }) {
  const p = new URLSearchParams();
  if (periodo) p.set(periodo.chave, periodo.valor); // ex.: periodo=Mai/2026
  p.set("de", "ciclo");                             // a tela de destino mostra "Voltar ao Painel"
  p.set("ciclo", cicloInicio);                      // para voltar ao mesmo trimestre
  return `${rota}?${p}`;                            // "/cgf?periodo=Mai/2026&de=ciclo&ciclo=Abr/2026"
}
```

Esta ajudante fica em `utils/periodoNaUrl.ts:9–15`. Ela tem mais duas funções:
- `usePeriodoDaUrl` (linhas 18–22) lê o período do endereço quando a tela abre;
- `useManterPeriodoNaUrl` (linhas 26–32) reescreve o endereço sempre que o trimestre muda.

Isso permite recarregar a página ou mandar o link para um colega sem perder o trimestre. É como escrever o número da sala no próprio crachá de visitante.

### lembrar.ts — o guarda-volumes do navegador

Fica em `utils/lembrar.ts` e tem três funções:
- `lembrar(chave)` (linha 31) busca algo;
- `guardar(chave, valor)` (linha 39) guarda;
- `esquecer(chave)` (linha 47) apaga.

Tudo fica **no navegador desta pessoa, neste computador**, num pequeno banco chamado IndexedDB. Nada vai ao servidor. Se o navegador bloquear (por exemplo, numa janela anônima), a tela continua funcionando, só não lembra.

### pasta.ts — o seletor de pasta

Esta ajudante (`utils/pasta.ts`) cuida de escolher e reler a pasta.
- **Navegadores modernos:** no Chrome e no Edge, `escolherChavePasta()` (linhas 61–69) abre o seletor moderno e devolve uma **chave da pasta**. A chave pode ser guardada e reaberta depois com `reabrirPasta()` (linhas 73–78).
- **Só os nomes:** `lerPastaDaChave()` (linhas 56–58) lista os nomes de todos os arquivos, sem abrir nenhum. Abrir milhares de arquivos levaria minutos. Por isso, eles só são abertos na hora de enviar, com `abrirArquivo()` (linha 38).
- **Qual seletor usar:** `navegadorLembraPasta` (linha 40) diz se o navegador tem o seletor moderno.

### pastaCiclo.ts — quem é quem, só pelo nome

Esta ajudante (`utils/pastaCiclo.ts`) descobre etapa e mês de cada arquivo sem abri-lo.
- **Um arquivo:** `classificar(caminho, ano)` (linhas 103–156) olha o caminho de um arquivo, como `RPV/CGR/04 abr-26 Notas Fiscais/x.xml`. Pelo nome das pastas, ela descobre **a etapa** (aqui, Auditoria) e **o mês** (aqui, Abr/2026). Quando não tem certeza, deixa um aviso.
- **O trimestre inteiro:** `mapaDoTrimestre(caminhos, meses)` (linhas 216–258) faz isso para todos os arquivos. Depois monta uma célula para cada etapa e mês, com quantos arquivos achou, os avisos e um sinal (`ok`, `atencao` ou `falta`).

É como um **porteiro que separa a correspondência** só lendo o envelope, sem abrir as cartas.

---

# Parte 2 — `index.tsx`, bloco por bloco

### Importações — linhas 1–29

```tsx
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react"; // ferramentas do React
import { Link } from "react-router-dom";                 // link entre telas, sem recarregar
import { apurarPR, getHistoricoSCG, /* ... */ } from "../../api"; // perguntas ao back-end
import { NOMES_ETAPA, mapaDoTrimestre /* ... */ } from "../../utils/pastaCiclo"; // porteiro da pasta
import { mesesDoPRDoCivil } from "../../utils/periodos"; // trimestre -> meses do PR
import { ProcessarTrimestre, type Retomada } from "./Processar"; // o painel do Processar
import { linkDoCiclo, useManterPeriodoNaUrl, usePeriodoDaUrl } from "../../utils/periodoNaUrl";
import { esquecer, guardar, lembrar } from "../../utils/lembrar"; // guarda-volumes
import { escolherChavePasta, lerPastaDaChave, navegadorLembraPasta, reabrirPasta /* ... */ } from "../../utils/pasta";
// ... ícones, Modal, Alert, Skeleton, tipos e o título da página
```

**Para quê:** é a **lista de ingredientes**. Cada `import { X } from "caminho"` traz uma peça de outro arquivo. Nada acontece aqui ainda.

**Termos:** algumas peças são **componentes**, pedaços de tela reaproveitáveis, como uma peça de Lego (`ProcessarTrimestre`, `Link`). Outras são funções da **API**, o guichê interno que leva os pedidos ao back-end (`getHistoricoSCG`). As que começam com `use` são **hooks**: ferramentas do React que dão memória e reações a uma tela. Cada uma é explicada quando aparece.

---

### Constantes — linhas 31–40

```tsx
const PANEL = "rounded-xl border border-white/[0.07] bg-panel"; // molde visual dos 3 cartões
const MEMORIA_PASTA = "ciclo:pasta";                             // armário da pasta escolhida
const memoriaProcessar = (raiz: string, inicio: string) =>
  `ciclo:processar:${raiz}:${inicio}`;                           // armário da prévia do Processar
interface PastaGuardada { raiz: string; caminhos: string[]; chave?: ChavePasta } // o que vai no armário
const MESES = ["Jan", "Fev", "Mar", /* ... */ "Dez"];            // nomes curtos dos meses
const TRIMESTRES = ["Jan – Mar", "Abr – Jun", "Jul – Set", "Out – Dez"]; // rótulos dos 4 botões
const FISCAIS: Record<string, string> = { Nov: "Nov - Jan", Fev: "Fev - Abr", Mai: "Mai - Jul", Ago: "Ago - Out" };
```

**PANEL (linha 31):** é um carimbo de estilo usado nos três cartões da tela. Assim, não é preciso repetir a mesma frase três vezes.

**Memória (linhas 33–37):** são os números dos armários no guarda-volumes (`lembrar.ts`). Há um armário para a pasta escolhida e um para cada pasta + trimestre do Processar.

**Template string:** na linha 35, o texto entre crases é uma **template string**, um texto com lacunas `${...}`. Com a pasta `SCG-26` e o início `Abr/2026`, ele vira `ciclo:processar:SCG-26:Abr/2026`.

**Tabelas fixas (linhas 38–40):** `FISCAIS` traduz o primeiro mês do PR para o nome da faixa que o back-end usa. Por exemplo, `Ago` vira `"Ago - Out"`.

---

### Tipo `Dados` — linhas 42–52

```tsx
interface Dados {
  auditoria: AuditoriaHistoricoLinha[]; // meses com Auditoria (CGR) gravada
  cgf: CGFHistoricoLinha[];             // meses com CGF gravado
  ret: RETHistoricoLinha[];             // ... RET
  concilia: ConciliaHistoricoLinha[];   // ... RP (conciliação)
  scg: SCGHistoricoLinha[];             // ... SCG
  srSalvo: Record<string, unknown>[];   // linhas do SR salvo no trimestre
  pr: PRApuracao | null;                // PR calculado agora (null = não deu)
  prSalvo: number | null;               // PR gravado
  pv: PVTrimestre | null;               // PV do trimestre
}
```

**Para quê:** é o **formulário padrão** com tudo o que a tela precisa saber do back-end.

**Como:** `interface` é um modelo do **TypeScript** (JavaScript com conferência de tipos). Os colchetes `[]` querem dizer "lista de", e `| null` quer dizer "ou vazio". Se alguém escrever um campo errado, o editor avisa na hora, como um corretor ortográfico.

---

### `carregar()` — linhas 54–65

```tsx
async function carregar(meses: string[], mesesPR: string[]): Promise<Dados> {
  const label = FISCAIS[mesesPR[0].split("/")[0]];                // "Ago/2026" -> "Ago" -> "Ago - Out"
  const vazio = <T,>(p: Promise<T>, padrao: T) => p.catch(() => padrao); // se falhar, usa um padrão
  const [auditoria, cgf, ret, concilia, scg, srSalvo, pr, prSalvo, pv] = await Promise.all([
    getHistoricoAuditoria(), getHistoricoCGF(), getHistoricoRET(), getHistoricoConcilia(), getHistoricoSCG(),
    vazio(buscarTrimestreSR(`${meses[0]}_${meses[2]}`), []),       // SR: se falhar, lista vazia
    vazio<PRApuracao | null>(apurarPR(mesesPR), null),             // PR: se falhar, null
    // ... prSalvo e pv, no mesmo esquema
  ]);
  return { auditoria, cgf, ret, concilia, scg, srSalvo, pr, prSalvo, pv };
}
```

**Para quê:** é o **mensageiro que faz nove perguntas ao back-end** e volta com as respostas reunidas num `Dados`.

**async/await e Promise:** um pedido à API demora. Uma **Promise** é um "vale de retirada": a resposta vai chegar. Numa função `async`, o `await` quer dizer "espere aqui até o vale virar resposta".

**Promise.all:** em vez de ir a nove guichês um depois do outro, ele manda nove pessoas ao mesmo tempo e espera todas voltarem.

**`vazio(...)`:** as quatro últimas perguntas podem falhar sem derrubar a tela. Nesse caso, a etapa aparece como "falta". Se uma das cinco primeiras falhar, aparece o alerta vermelho.

---

### Tipo `Etapa_` — linhas 69–75

```tsx
interface Etapa_ {
  titulo: string;      // "Auditoria CGR"
  descricao: string;   // a frase pequena embaixo do título
  situacao: Situacao;  // "ok" | "atencao" | "falta"
  detalhe: ReactNode;  // pedaço de tela com os valores de cada mês
  link: string;        // destino do botão "Fazer agora"/"Ver"
}
```

**Para quê:** é a **ficha de cada linha** da lista "Etapas do ciclo". Toda etapa, mensal ou trimestral, vira essa mesma ficha. Assim, o desenho da lista não precisa saber de que etapa se trata.

**Como:** `ReactNode` quer dizer "qualquer coisa que se pode desenhar". O `link` é uma **rota**, o endereço de uma tela (por exemplo, `/cgf?periodo=Mai/2026`).

---

### `porMes()` — linhas 77–113

```tsx
const linhas = meses.map((m) => ({ m, l: lista.find((x) => x.periodo === m) })); // registro de cada mês
const alertas = linhas.map(({ l }) => (l && alerta ? alerta(l) : null));         // algo estranho?
const faltam = linhas.filter(({ l }) => !l).length;                              // quantos faltam
// ...
return {
  situacao: faltam ? "falta" : alertas.some(Boolean) ? "atencao" : "ok",          // cor do sinal
  pendente: linhas.find(({ l }, i) => !l || alertas[i])?.m,                       // 1º mês com problema
  detalhe: ( /* chips "Abr: R$ 1.000,00", "Mai: falta"... */ ),
};
```

**Para quê:** é o **conferente mensal**. Para cada um dos três meses, ele verifica se há registro gravado e se algo pede atenção. Depois devolve três coisas: a cor do sinal, o primeiro mês pendente e as etiquetinhas ("chips") de cada mês.

**map, filter, find:** são verbos de lista.
- `map` é "para cada item, faça isto";
- `filter` é "fique só com os que passam no teste";
- `find` é "me dê o primeiro que passa".

**Ternário `? :`:** a linha 87 se lê assim: "se falta mês, é *falta*; senão, se tem alerta, é *atenção*; senão, é *ok*". É um "se/senão" numa linha. O `?.` da linha 89 quer dizer "se existir": se nenhum mês tiver problema, o resultado é vazio, e não um erro.

**Os chips (linhas 90–111):** essa parte é **JSX**, um HTML escrito dentro do código. Cada chip vira um link para aquele mês (linhas 95–98) ou um texto simples (linha 100). As linhas 105–109 escrevem o **motivo** de cada alerta por extenso. O `new Set(...)` tira os motivos repetidos.

---

### `etapaMensal()` — linhas 115–121

```tsx
function etapaMensal(titulo, descricao, rota, lista, meses, valor, alerta?): Etapa_ {
  const linkDoMes = (m: string) => linkDoCiclo(rota, meses[0], { chave: "periodo", valor: m }); // link do mês
  const { pendente, ...resto } = porMes(lista, meses, valor, alerta, linkDoMes); // confere os 3 meses
  return { titulo, descricao, ...resto, link: linkDoMes(pendente ?? meses[0]) }; // vai ao 1º pendente
}
```

**Para quê:** é o **atalho para montar uma etapa mensal**. Ele chama o `porMes` e define que "Fazer agora" leva ao primeiro mês com problema. Se nenhum tiver problema, leva ao primeiro mês do trimestre.

**Como:** os `...` (*spread*) querem dizer "despeje aqui os campos que sobraram". O `??` quer dizer "se for vazio, use isto".

---

### `etapas()` — linhas 123–167

```tsx
const srTotal = d.srSalvo.reduce((s, l) => s + Number(l.sr_selic ?? 0), 0);         // soma do SR
const prDifere = d.pr && d.prSalvo !== null && Math.abs(d.prSalvo - d.pr.pr) > 1e-9; // salvo ≠ calculado?
return [
  etapaMensal("Auditoria CGR", "NF de compra ...", "/auditoria", d.auditoria, meses, (l) => brl(l.cgr_gravado)),
  etapaMensal("CGF — Volume Faturado", /* ... */ (l) => (l.volume_devolucoes ? null
    : "Devoluções = 0: confira se a planilha de devoluções entrou.")),             // alerta do CGF
  { titulo: "RET — Encargos de transporte", /* ... */ ...porMes(d.ret, meses, (l) => brl(l.ret_gravado)) },
  // ... RP (linhas 137–139), SCG (140–141)
  { titulo: "SR — Saldo Remanescente", situacao: d.srSalvo.length ? "ok" : "falta", /* ... */ },
  // ... PR (148–157) e PV (158–165)
];
```

**Para quê:** é a **lista de conferência completa**: 8 linhas, na ordem do trabalho do analista.

**Mensais (linhas 130–141):** Auditoria, CGF, RP e SCG usam `etapaMensal`, cada uma com a sua regra de alerta:
- CGF: devoluções vieram zeradas;
- RP: o gravado difere da soma dos itens em mais de R$ 1;
- SCG: o back-end avisou que os módulos não batem.

O **RET** (linhas 134–136) usa o `porMes` direto e o link vai sem mês, porque a tela do RET tira o mês dos próprios arquivos.

**Trimestrais (linhas 142–165):** SR, PR e PV não têm chips de mês.
- O PR fica amarelo se o valor calculado agora for diferente do salvo. Isso acontece, por exemplo, quando alguém regravou um SCG depois.
- O PV segue a mesma lógica.
- O `1e-9` é uma folga minúscula, para não acusar diferença por arredondamento.

**reduce (linha 125):** ele "dobra" uma lista num valor só. Aqui, soma o SR de todas as linhas, começando do zero.

---

### `ICONE` — linhas 169–173

```tsx
const ICONE: Record<Situacao, ReactNode> = {
  ok: <CheckCircle2 size={18} className="text-emerald-400" aria-label="Pronto" />,                // verde
  atencao: <AlertTriangle size={18} className="text-amber-300" aria-label="Precisa de atenção" />, // amarelo
  falta: <CircleDashed size={18} className="text-zinc-500" aria-label="Falta" />,                 // cinza
};
```

**Para quê:** é a **legenda do semáforo**. Esse mesmo ícone aparece na lista de etapas e no mapa da pasta. O `aria-label` é o texto que um leitor de tela (usado por quem tem deficiência visual) lê em voz alta.

---

## O componente `CicloPage` — linhas 177–465

Um **componente** é uma função que devolve um pedaço de tela. `CicloPage` é a tela inteira. Ela usa peças menores, como `MapaPasta` e `ProcessarTrimestre`.

### Qual trimestre mostrar — linhas 178–186

```tsx
const hoje = new Date();
const daUrl = usePeriodoDaUrl("trimestre");                     // lê ?trimestre=Abr/2026
const inicio = daUrl && daUrl.mes % 3 === 0 ? daUrl : null;     // só 1º mês de trimestre (Jan, Abr, Jul, Out)
const [ano, setAno] = useState(inicio?.ano ?? hoje.getFullYear());
const [tri, setTri] = useState(inicio ? inicio.mes / 3 : Math.max(0, Math.floor(hoje.getMonth() / 3) - 1));
const meses = useMemo(() => [0, 1, 2].map((i) => `${MESES[tri * 3 + i]}/${ano}`), [ano, tri]); // ["Abr/2026","Mai/2026","Jun/2026"]
const mesesPR = useMemo(() => mesesDoPRDoCivil(meses[2]), [meses]); // ["Ago/2026","Set/2026","Out/2026"]
useManterPeriodoNaUrl("trimestre", meses[0]);                   // escreve o trimestre no endereço
```

**Para quê:** decidir **qual trimestre abrir**. Se o endereço traz `?trimestre=Abr/2026`, abre esse. É o que acontece quando alguém volta de outra tela pelo "Voltar ao Painel". Se não traz, abre o **trimestre anterior ao de hoje**, que normalmente é o que está sendo apurado.

**Estado / useState:** o **estado** é a **memória de curto prazo** da tela, como um post-it na mesa. `useState` devolve o valor (`ano`) e a caneta para trocá-lo (`setAno`). Usar a caneta faz a tela se redesenhar.

**useMemo:** é uma **conta guardada**, só refeita quando os ingredientes (`ano`, `tri`) mudam.

**Meses do PR:** `mesesDoPRDoCivil` (`utils/periodos.ts:22`) diz que o PR começa 2 meses depois do fim do trimestre apurado. Assim, a apuração de Abr–Jun/2026 define o PR e o PV de Ago, Set e Out/2026.

**Curiosidade:** de janeiro a março, a conta da linha 183 dá 0. Ou seja, a tela abre em Jan–Mar do ano atual, e não em Out–Dez do ano anterior.

### Os estados da tela — linhas 188–202

```tsx
const [dados, setDados] = useState<Dados | null>(null);  // respostas do carregar()
const [carregando, setCarregando] = useState(true);       // mostra o esqueleto enquanto espera
const [erro, setErro] = useState<string | null>(null);   // texto do alerta vermelho
const [caminhos, setCaminhos] = useState<string[] | null>(null); // NOMES dos arquivos da pasta
const [arquivos, setArquivos] = useState<Map<string, ArquivoDaPastaCiclo>>(new Map()); // ACESSO aos arquivos
const [processando, setProcessando] = useState(false);   // painel do Processar aberto?
const [versao, setVersao] = useState(0);                  // sobe 1 ao gravar -> recarrega a lista
// ... raiz, chavePasta, retomar, lendoPasta, avisoPasta, gerandoNT
const inputPasta = useRef<HTMLInputElement>(null);        // alça do seletor de pasta antigo
```

**Para quê:** são os **post-its da mesa**: se está carregando, se deu erro, que pasta foi escolhida, se o Processar está aberto...

**Dois detalhes:**
- **`caminhos` e `arquivos` são separados.** A tela pode lembrar os nomes, o que basta para desenhar o mapa, sem ter permissão para abrir os arquivos, o que é preciso para enviar.
- **`versao` é um truque.** Ninguém lê o número em si, mas, quando ele muda, a lista de etapas é recarregada.

**useRef:** é um post-it que **não redesenha a tela**. Aqui ele guarda a alça do campo escondido de escolher pasta.

### useEffect 1: lembrar a última pasta — linhas 204–218

```tsx
useEffect(() => {
  lembrar<PastaGuardada>(MEMORIA_PASTA).then(async (g) => { // abre o guarda-volumes
    if (!g) return;                                         // nunca escolheu pasta
    setRaiz(g.raiz); setCaminhos(g.caminhos); setChavePasta(g.chave); // já dá para desenhar o mapa
    if (!g.chave) return;                                   // navegador sem chave: para aqui
    setLendoPasta(true);
    const lida = await reabrirPasta(g.chave, false).catch(() => null); // tenta reler SEM perguntar
    if (lida) setArquivos(lida.arquivos);
    setLendoPasta(false);
  });
}, []);                                                     // [] = só uma vez, ao abrir a tela
```

**useEffect:** é uma **ação automática**: "quando X acontecer, faça Y". A lista no fim diz o que vigiar. Uma lista vazia (`[]`) quer dizer "só ao abrir a tela".

**Para quê:** ao abrir, a tela **lembra a pasta da última vez** e já desenha o mapa. Se o navegador tinha dado permissão permanente, os arquivos são relidos sem perguntar. Se não tinha, aparece o aviso amarelo "Reabrir" (linhas 400–407).

### useEffect 2: retomar o Processar — linhas 220–230

```tsx
useEffect(() => {
  if (!raiz) return;                                         // sem pasta, nada a retomar
  let vigente = true;                                        // "este pedido ainda vale?"
  lembrar<Retomada>(memoriaProcessar(raiz, meses[0])).then((r) => {
    if (!vigente) return;                                    // já trocou de trimestre: ignora
    setRetomar(r ?? null);
    setProcessando(!!r);                                     // havia prévia? reabre o painel
  });
  return () => { vigente = false; };                         // faxina: invalida o pedido antigo
}, [raiz, meses]);
```

**Para quê:** se o analista recarregou a página no meio de um Processar, o painel **volta onde parou**.

**O truque do `vigente`:** se a pessoa troca de trimestre rápido, uma resposta antiga pode chegar atrasada. A "faxina" (`return () => ...`) risca o pedido velho, como numa comanda de restaurante quando o cliente muda de ideia.

### useEffect 3: carregar as etapas — linhas 232–239

```tsx
useEffect(() => {
  let vigente = true;
  carregar(meses, mesesPR)                                   // as 9 perguntas ao back-end
    .then((d) => { if (vigente) { setDados(d); setErro(null); setCarregando(false); } })
    .catch((e) => { if (vigente) { setErro(mensagemDeErro(e, "Não foi possível carregar a situação do ciclo.")); setCarregando(false); } });
  return () => { vigente = false; };
}, [meses, mesesPR, versao]);                                // trocou trimestre OU gravou -> recarrega
```

**Para quê:** **enche a lista de etapas**. Ele roda ao abrir a tela, ao trocar de trimestre e quando `versao` muda, ou seja, depois que o Processar grava.

**Como:** `.then` é "quando chegar, faça isto" e `.catch` é "se der erro, faça aquilo". `mensagemDeErro` traduz o erro técnico para português.

### irPara — linhas 241–246

```tsx
const irPara = (novoAno: number, novoTri: number) => {
  setCarregando(true);   // mostra o esqueleto
  setProcessando(false); // fecha o Processar
  setAno(novoAno);       // troca o ano...
  setTri(novoTri);       // ...e o trimestre -> meses muda -> o useEffect 3 recarrega
};
```

**Para quê:** é o que acontece ao clicar nas setas do ano ou num botão de trimestre. Ele só troca os post-its. O resto (meses, endereço e carga) acontece sozinho, em cadeia, pelos efeitos.

### Contas que dependem do estado — linhas 248–250

```tsx
const lista = dados ? etapas(dados, meses, mesesPR) : [];             // as 8 fichas (ou nada)
const prontas = lista.filter((e) => e.situacao === "ok").length;     // quantas verdes
const mapa = caminhos ? mapaDoTrimestre(caminhos, meses) : null;     // mapa etapa × mês
```

**Para quê:** essas linhas preparam o que vai ser desenhado:
- a lista de etapas;
- o número de prontas, usado na barra e no texto "4 de 8 etapas prontas";
- o mapa da pasta, que o porteiro `mapaDoTrimestre` monta a partir **só dos nomes**.

### aplicarPasta — linhas 252–263

```tsx
const aplicarPasta = async (pasta: PastaLida, chave?: ChavePasta) => {
  await esquecer(memoriaProcessar(pasta.raiz, meses[0])); // joga fora a prévia antiga desta pasta
  const nomes = [...pasta.arquivos.keys()];               // só os nomes
  setRetomar(null); setProcessando(false);                // fecha o Processar
  setRaiz(pasta.raiz); setCaminhos(nomes);                // atualiza o mapa
  setArquivos(pasta.arquivos); setChavePasta(chave);
  guardar(MEMORIA_PASTA, { raiz: pasta.raiz, caminhos: nomes, chave } satisfies PastaGuardada); // para a próxima vez
};
```

**Para quê:** é o **ponto comum** depois de escolher uma pasta, seja pelo seletor moderno, seja pelo antigo. Ele zera a prévia velha, atualiza o mapa e guarda tudo no guarda-volumes. O `satisfies` pede ao TypeScript para conferir o formato antes de guardar.

### escolherPasta (seletor antigo) — linhas 265–272

```tsx
const escolherPasta = (files: FileList | null) => {
  if (!files?.length) return;                                // cancelou
  const lista = Array.from(files).map((f) => ({ f,
    rel: (f.webkitRelativePath || f.name).split("/").slice(1).join("/") })); // tira a pasta raiz do caminho
  aplicarPasta({
    raiz: (files[0].webkitRelativePath || files[0].name).split("/")[0],      // "SCG-26"
    arquivos: new Map(lista.map((x) => [x.rel, x.f])),                        // caminho -> arquivo
  });
};
```

**Para quê:** é usado nos navegadores **sem** o seletor moderno. O código tira o nome da pasta raiz do começo de cada caminho (`SCG-26/abr-26/x.xml` vira `abr-26/x.xml`) e monta um `Map`. O `Map` funciona como uma **agenda**: você procura pelo caminho e acha o arquivo.

### escolherPastaLembrada (Chrome/Edge) — linhas 274–286

```tsx
const escolherPastaLembrada = async () => {
  try {
    const chave = await escolherChavePasta();          // abre o seletor moderno
    if (!chave) return;                                // cancelou
    setLendoPasta(true);                               // esqueleto do mapa
    await aplicarPasta(await lerPastaDaChave(chave), chave); // lista os nomes e aplica
  } catch (e) {
    setErro(mensagemDeErro(e, "Não foi possível ler a pasta."));
  } finally {
    setLendoPasta(false);                              // tira o esqueleto, dando certo ou não
  }
};
```

**Para quê:** no Chrome e no Edge, o seletor devolve uma **chave** que pode ser guardada e reaberta na próxima visita.

**try / catch / finally:** é "tente; se der erro, trate; e, **de qualquer jeito**, no fim faça isto".

### reabrir — linhas 288–300

```tsx
const reabrir = async () => {
  if (!chavePasta) return;
  setLendoPasta(true);
  try {
    const lida = await reabrirPasta(chavePasta, true); // true = pode mostrar o pedido de permissão
    if (lida) setArquivos(lida.arquivos);              // ganhou acesso aos arquivos de novo
  } catch (e) { setErro(mensagemDeErro(e, "Não foi possível reabrir a pasta.")); }
  finally { setLendoPasta(false); }
};
```

**Para quê:** é o botão amarelo **"Reabrir SCG-26"**. O navegador só devolve a permissão de leitura depois de um clique da pessoa. Por segurança, o pedido de permissão precisa vir logo após um clique.

### continuarPasta — linhas 302–308

```tsx
const continuarPasta = () => {
  setAvisoPasta(false);                              // fecha a janela de explicação
  if (navegadorLembraPasta) escolherPastaLembrada(); // Chrome/Edge: seletor moderno
  else inputPasta.current?.click();                  // outros: "clica" no campo escondido
};
```

**Para quê:** é o **"Continuar"** da janela de explicação. Ele escolhe qual seletor abrir, e precisa fazer isso **dentro do clique**, senão o navegador bloqueia. É como um porteiro que só abre a porta se você tocar a campainha.

### fecharProcessar e semArquivos — linhas 310–317

```tsx
const fecharProcessar = () => {
  esquecer(memoriaProcessar(raiz, meses[0])); // apaga a prévia guardada
  setRetomar(null);
  setProcessando(false);                      // fecha o painel
};
const semArquivos = !!caminhos && arquivos.size === 0; // lembra os nomes, mas não tem os arquivos
```

**Para quê:**
- `fecharProcessar` limpa a prévia quando o analista fecha o painel.
- `semArquivos` responde "tenho os nomes, mas nada para enviar?". Se sim, aparece o aviso "Reabrir", e o Processar não deixa enviar. O `!!` transforma qualquer coisa em verdadeiro ou falso.

### gerarNT — linhas 319–329

```tsx
const gerarNT = async () => {
  setGerandoNT(true);                                         // botão vira "Gerando…"
  try {
    salvarArquivo(await gerarMinutaNotaTecnica(meses[2]),     // pede o .docx à API
      `Minuta_NT_Repasse_${mesesPR[0].replace("/", "-")}_a_${mesesPR[2].replace("/", "-")}.docx`);
  } catch (e) {
    setErro(mensagemDeErro(e, "Não foi possível gerar a minuta da Nota Técnica."));
  } finally {
    setGerandoNT(false);
  }
};
```

**Para quê:** é o botão **"Baixar minuta da NT"**. O caminho é este:
1. você clica;
2. a tela chama `gerarMinutaNotaTecnica()`;
3. a API monta o Word com os números do banco;
4. o navegador baixa o arquivo, com um nome como `Minuta_NT_Repasse_Ago-2026_a_Out-2026.docx`.

---

### O desenho da tela (JSX) — linhas 331–464

Tudo depois do `return (` é **JSX**. As chaves `{ }` encaixam valores no meio do HTML.

#### Alerta de erro — linha 336

```tsx
{erro && <Alert variant="error">{erro}</Alert>}   {/* só aparece se houver erro */}
```

**`&&`:** quer dizer "**se** houver erro, mostre o alerta; se não, nada". Funciona como um interruptor.

**props:** `variant="error"` é uma **prop**, a instrução que se passa a uma peça ("seja um alerta vermelho").

#### Seletor de ano e trimestre — linhas 338–363

```tsx
<button aria-label="Ano anterior" onClick={() => irPara(ano - 1, tri)}>   {/* seta < */}
<span>{ano}</span>                                                         {/* 2026 */}
{TRIMESTRES.map((t, i) => (
  <button key={t} role="radio" aria-checked={tri === i} onClick={() => irPara(ano, i)}
    className={`... ${tri === i ? "bg-sky-500/20 text-sky-200" : "text-zinc-400 ..."}`}>{t}</button> // destaca o escolhido
))}
<p>Apura <b>{meses[0]} a {meses[2]}</b> → define o PR e o PV de <b>{mesesPR[0]} a {mesesPR[2]}</b>
  {dados && !carregando && <span>· {prontas} de {lista.length} etapas prontas</span>}</p>
<div style={{ width: `${(prontas / lista.length) * 100}%` }} />           {/* barra de progresso */}
```

**Para quê:** é o **calendário do topo**. A frase lembra a regra do negócio: o trimestre apurado define o PR e o PV de outro trimestre. A barra verde cresce com as etapas prontas: com 4 de 8, fica pela metade.

**`key`:** quando o `map` desenha vários itens, o React pede uma etiqueta única para cada um, para saber quem é quem ao redesenhar.

#### Botão de pasta e campo escondido — linhas 366–385

```tsx
<button onClick={() => setAvisoPasta(true)} disabled={lendoPasta}>       {/* abre a explicação primeiro */}
  <FolderOpen size={16} /> {caminhos ? "Escolher outra pasta" : "Escolher pasta"}
</button>
{!navegadorLembraPasta && (
  <input ref={inputPasta} type="file" className="hidden" multiple
    webkitdirectory="" directory=""                                       // escolhe pasta, não arquivo
    onChange={(e) => { escolherPasta(e.target.files); e.target.value = ""; }} />
)}
```

**Para quê:** o botão **não abre o seletor direto**. Primeiro mostra uma explicação. O campo escondido só existe nos navegadores sem seletor moderno, e é "clicado" pelo `continuarPasta`.

#### Janela de explicação — linhas 386–398

```tsx
<Modal aberto={avisoPasta} onFechar={() => setAvisoPasta(false)} titulo="Ler a pasta do ciclo"
  rodape={<>
    <button onClick={continuarPasta}>Continuar</button>             {/* segue para o seletor */}
    <button onClick={() => setAvisoPasta(false)}>Cancelar</button>
  </>}>
  <p>... O sistema olha só os nomes dos arquivos ... Nada é enviado nem gravado agora.</p>
  <p>... o Chrome mostra um aviso de segurança dele ... É normal: clique em Ver arquivos ...</p>
</Modal>
```

**Para quê:** é a **recepcionista** que avisa antes: "o Chrome vai pedir licença, é normal". Isso evita que o analista se assuste e cancele.

#### Esqueleto, aviso de reabrir, mapa e Processar — linhas 399–416

```tsx
{lendoPasta && <EsqueletoMapa />}                                   {/* lendo: formas cinzas */}
{semArquivos && !lendoPasta && (
  <p>Lembrei a pasta <b>{raiz}</b> da última vez. ...
    {chavePasta ? <button onClick={reabrir}>Reabrir {raiz}</button> // Chrome/Edge: um clique
                : <span>Escolha a pasta de novo.</span>}</p>)}      // outros: escolher de novo
{mapa && !lendoPasta && (
  <MapaPasta mapa={mapa} meses={meses} raiz={raiz} total={caminhos!.length}
    processar={dados && !processando ? () => setProcessando(true) : undefined} />)}
{mapa && !lendoPasta && processando && dados && (
  <ProcessarTrimestre key={`${raiz}-${meses[0]}`} /* ... */ onGravado={() => setVersao((v) => v + 1)} onFechar={fecharProcessar} />)}
```

**Para quê:** são quatro peças que se alternam:
- lendo a pasta: esqueleto;
- tem os nomes, mas não a permissão: aviso amarelo;
- tem mapa: a tabela;
- clicou em Processar: o painel do Processar (Parte 3).

**Como:**
- Vários `&&` em sequência valem como "e... e... e...".
- O mapa só recebe `processar` se os dados já chegaram e o painel está fechado. Caso contrário, o botão fica cinza.
- O `onGravado` sobe a `versao`, e é isso que atualiza a lista sozinha depois de gravar.
- O `key` com pasta e trimestre faz o painel **começar do zero** se um dos dois mudar.

#### Lista de etapas — linhas 420–443

```tsx
{carregando ? (
  <EsqueletoEtapas />                                              // esperando a API
) : (
  <ol>
    {lista.map((e, i) => (
      <li key={e.titulo}>
        <span>{i + 1}</span> {ICONE[e.situacao]}                    {/* número e semáforo */}
        <p>{e.titulo}</p> <p>{e.descricao}</p> <div>{e.detalhe}</div> {/* chips dos meses */}
        <Link to={e.link}>{e.situacao === "ok" ? "Ver" : "Fazer agora"}</Link>
      </li>
    ))}
```

**Para quê:** desenha as **8 fichas** de `etapas()`. Se a etapa está verde, o botão diz "Ver" e fica discreto. Se não está, diz "Fazer agora" e fica azul.

#### Entregas — linhas 444–458

```tsx
<li>
  <span>{lista.length + 1}</span> <FileText size={18} />            {/* sempre a 9ª linha */}
  <p>Entregas</p> <p>Minuta da Nota Técnica e Excel Final do ciclo</p>
  <button onClick={gerarNT} disabled={gerandoNT}>
    {gerandoNT ? "Gerando…" : "Baixar minuta da NT"}
  </button>
  <Link to="/excel-final">Excel Final</Link>
</li>
```

**Para quê:** é o **balcão de saída** do ciclo. O botão fica desabilitado enquanto a minuta é gerada, para ninguém clicar duas vezes.

---

### EsqueletoEtapas e EsqueletoMapa — linhas 471–492 e 495–513

```tsx
function EsqueletoEtapas() {
  return (
    <div role="status">
      <span className="sr-only">Consultando as etapas do ciclo…</span>  {/* só o leitor de tela lê */}
      {[0, 1, 2, 3, 4].map((i) => (                                      // 5 linhas "de mentira"
        <div key={i}>
          <Skeleton className="h-4 w-2/5" />                             {/* barra cinza no lugar do título */}
          {/* ... */}
```

**Para quê:** enquanto a resposta não chega, aparecem **formas cinzas no lugar exato** do conteúdo. É como reservar as cadeiras antes dos convidados chegarem, para a tela não dar um "pulo" depois. `EsqueletoMapa` faz o mesmo para a tabela da pasta.

---

### MapaPasta — linhas 517–595

#### Entradas e contas — linhas 517–524

```tsx
function MapaPasta({ mapa, meses, raiz, total, processar }: {     // props vindas do CicloPage
  mapa: ReturnType<typeof mapaDoTrimestre>; meses: string[]; raiz: string; total: number;
  processar?: () => void;                                          // ausente = botão cinza
}) {
  const [aberta, setAberta] = useState<CelulaMapa | null>(null);   // célula com detalhes abertos
  const etapasMapa: Etapa[] = ["auditoria", "cgf", "ret", "conciliacao"]; // as 4 linhas
  const celula = (e: Etapa, m: string) => mapa.celulas.find((c) => c.etapa === e && c.periodo === m)!;
  const problemas = mapa.celulas.filter((c) => c.situacao !== "ok").length;
```

**Para quê:** desenha o **mapa da pasta**: 4 etapas (só as que vêm de arquivos) × 3 meses. O único estado próprio dele é `aberta`, que guarda qual quadradinho foi clicado.

#### Resumo e pastas sem mês — linhas 527–537

```tsx
<p><b>{raiz}</b>: {num(total)} arquivos lidos ·{" "}
  {problemas ? <span>{problemas} ponto(s) para conferir</span> : <span>tudo encontrado</span>}
  {" "}· {num(mapa.ignorados)} de outros meses ignorados</p>
{mapa.semMes.length > 0 && (
  <p>(alerta) {mapa.semMes.length === 1 ? "Esta pasta não tem" : "Estas pastas não têm"} o mês no nome ...
    Renomeie com mês e ano (ex.: “09 set-26 NFs”).</p>)}
```

**Para quê:** mostra um resumo do tipo "SCG-26: 1.000 arquivos lidos · 2 pontos para conferir · 500 de outros meses ignorados" (números fictícios). Se alguma pasta não tem o mês no nome, a tela avisa e sugere como renomear.

#### A tabela — linhas 538–568

```tsx
{etapasMapa.map((e) => (
  <tr key={e}>
    <td>{NOMES_ETAPA[e]}</td>                                      {/* "Auditoria CGR (NF de compra)" */}
    {meses.map((m) => {
      const c = celula(e, m);                                      // quadradinho etapa × mês
      return (
        <td key={m}><button onClick={() => setAberta(aberta === c ? null : c)}> {/* abre/fecha */}
          {ICONE[c.situacao]}
          <span>{c.situacao === "falta" ? "não achei" : `${num(c.arquivos)} arquivo(s)`}</span>
        </button></td>);
    })}
  </tr>))}
```

**Para quê:** é uma **planilha de presença** com o semáforo e "100 arquivo(s)" ou "não achei" em cada célula. Clicar abre os detalhes, e clicar de novo fecha. São dois `map` encaixados: um para as linhas e, dentro dele, outro para as colunas.

#### Detalhes da célula — linhas 569–583

```tsx
{aberta && (
  <div>
    <p>{NOMES_ETAPA[aberta.etapa]} · {aberta.periodo}</p>          {/* "CGF ... · Mai/2026" */}
    {aberta.conjuntos.length > 0 && <ul>{/* (pasta) onde achou os arquivos */}</ul>}
    {aberta.avisos.map((a) => <p key={a}>(alerta) {a}</p>)}         {/* pedem ação */}
    {aberta.notas.map((a) => <p key={a}>{a}</p>)}                   {/* só informam */}
    {aberta.situacao === "falta" && <p>Não encontrei arquivos desta etapa para {aberta.periodo}. ...</p>}
  </div>)}
```

**Para quê:** é a **gaveta que abre** embaixo da tabela. Ela mostra as pastas onde os arquivos estavam e os avisos do porteiro. Os avisos são gerados em `pastaCiclo.ts:233–243`, como "Falta a planilha de devoluções" ou "Não achei a pasta de receitas deste mês".

#### Botão Processar — linhas 584–592

```tsx
<button type="button" disabled={!processar} onClick={processar}>  {/* sem "processar" = cinza */}
  Processar {meses[0]} a {meses[2]}
</button>
<span>Envia estes arquivos para cada etapa, mostra o resultado e só grava o que você confirmar. ...</span>
```

**Para quê:** abre o painel do Processar. O caminho completo está na Parte 3.

---

# Parte 3 — `Processar.tsx`, bloco por bloco

**Para que serve:** é a **esteira de produção do trimestre**. Para cada etapa (Auditoria, CGF, RET, RP) e cada mês, ele pega os arquivos da pasta e manda para a mesma API que as telas individuais usam. Depois mostra o resultado ao lado do valor já gravado e só grava o que o analista deixar marcado.

São três momentos:
1. **prévia**: escolher o que enviar;
2. **revisão**: conferir;
3. **gravação**.

### Cabeçalho e importações — linhas 1–25

```tsx
/** S3 — "Processar" do Painel do Ciclo: envia a pasta do trimestre para cada etapa-mês
 * com os mesmos /processar e /salvar das telas, mostra o resultado e só grava o que o
 * usuário confirmar. ... */
import {
  calcularCGFRs, diferencasAuditoria, getPMPVMensal, processarAuditoria, processarCGF, processarConcilia, processarRET,
  salvarAuditoria, salvarCGF, salvarConcilia, salvarRET,           // um "processar" e um "salvar" por etapa
} from "../../api";
import { abrirArquivo, type ArquivoDaPastaCiclo } from "../../utils/pasta"; // abre o arquivo só na hora
import { arquivosDaCelula, classificar, envioDaAuditoria, envioDaPastaDoMes /* ... */ } from "../../utils/pastaCiclo";
```

**Para quê:** o comentário do topo resume a regra mais importante: **o Processar não tem cálculo próprio**. Ele usa os mesmos pedidos `processar...` e `salvar...` das telas de cada etapa. Por isso o resultado é igual ao que sairia indo tela por tela.

---

### Estados de uma linha e regras fixas — linhas 27–35

```tsx
type Estado = "pronta" | "bloqueada" | "vazia" | "processando" | "processada" | "erro" | "gravando" | "gravada";
const JA_NO_RET = "JA_NO_RET";              // despesa que já entrou no RET: vale 0 no RP
const zipSemCategoria = (caminho: string) =>
  !/receita|despesa|(^|[^a-z])top([^a-z]|$)/.test(caminho.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase());
```

**Para quê:** `Estado` é a **etiqueta de andamento** de cada linha da tabela. Pense numa ficha de oficina, que vai de "pronta" a "processada" e depois a "gravada", ou para em "erro" ou "bloqueada".

**zipSemCategoria:** confere se um `.zip` do RP diz no caminho se é receita, despesa ou TOP. Se não disser, o back-end contaria tudo como despesa. Por isso a linha fica bloqueada (linha 128).

---

### Tipo `Celula` — linhas 37–54

```tsx
interface Celula {
  etapa: Etapa; periodo: string;        // ex.: "cgf", "Mai/2026"
  arquivos: ArquivoClassificado[];      // os arquivos desta etapa-mês
  gravado: number | null;               // valor já salvo (R$), se houver
  estado: Estado;                       // etiqueta de andamento
  motivo?: string; avisos: string[];    // por que travou / o que conferir
  escolhida: boolean;                   // caixinha marcada?
  valor?: number; detalhe?: string;     // resultado do processamento
  cgf?: { /* ... */ }; ret?: RETResultado; auditoria?: AuditoriaResultado; concilia?: ConciliaResultado; // resposta guardada p/ gravar
  // ... soPdf, diferencas (só Auditoria)
}
```

**Para quê:** é a **ficha de cada linha** do painel: uma etapa num mês. A ficha guarda a resposta completa da API (`cgf`, `ret`...). Assim, na hora de gravar, ela manda exatamente o que o analista conferiu, sem processar de novo.

---

### Fase e retomada — linhas 56–68

```tsx
type Fase = "previa" | "processando" | "revisao" | "gravando" | "fim";
export interface Retomada { celulas: Celula[]; fase: Fase } // o que vai para o guarda-volumes

function retomada(r: Retomada): Retomada {
  const celulas = r.celulas.map((c): Celula =>
    c.estado === "processando" ? { ...c, estado: "pronta" }          // não terminou: processa de novo
    : c.estado === "gravando" ? { ...c, estado: "processada" } : c); // não se sabe se gravou: confira de novo
  if (r.fase !== "processando" && r.fase !== "gravando") return { celulas, fase: r.fase };
  return { celulas, fase: celulas.some((c) => c.estado === "processada") ? "revisao" : "previa" };
}
```

**Para quê:** `Fase` é o **momento do painel inteiro**. Se a página foi recarregada no meio, `retomada()` **volta um passo, por segurança**:
- o que estava "processando" volta a "pronta";
- o que estava "gravando" volta a "processada", para o analista conferir e gravar de novo.

É como reler a última página de um livro quando você não lembra se terminou.

---

### precisaAtencao — linhas 70–77

```tsx
function precisaAtencao(c: Celula) {
  if (c.estado === "erro" || c.estado === "bloqueada") return true;      // travou: atenção
  if (c.estado !== "processada" && c.estado !== "gravada") return false;
  const difere = c.gravado !== null && c.valor !== undefined && Math.abs(c.valor - c.gravado) > 1; // > R$ 1
  return difere || c.avisos.length > 0 || !!c.diferencas || (c.etapa === "conciliacao" && !c.escolhida);
}
```

**Para quê:** decide quais linhas ganham o botão **"Conferir em ..."**, que leva à tela da etapa naquele mês. A regra é: erro, bloqueio, aviso, ou resultado diferente do gravado em mais de R$ 1. Exemplo: gravado R$ 1.000,00 e agora R$ 1.005,00 pede atenção. A linha do RP também ganha o botão quando fica desmarcada (o que acontece, por exemplo, se algum PDF não foi lido).

---

### ORDEM, ROTA e ICONE — linhas 79–89

```tsx
const ORDEM: Etapa[] = ["auditoria", "cgf", "ret", "conciliacao"];   // ordem das linhas
const ROTA: Record<Etapa, string> = { auditoria: "/auditoria", cgf: "/cgf", ret: "/ret", conciliacao: "/conciliacao" };
const ICONE: Partial<Record<Estado, ReactNode>> = {
  processando: <Loader2 className="animate-spin text-sky-300" /* ... */ />, // girando
  gravada: <CheckCircle2 className="text-emerald-400" /* ... */ />,         // verde
  erro: <XCircle className="text-red-300" /* ... */ />,                     // vermelho
  // ... gravando, processada, bloqueada
};
```

**Para quê:** são tabelas fixas: em que ordem as etapas aparecem, para qual endereço cada uma leva e qual ícone cada estado mostra. O `Partial` quer dizer que nem todo estado tem ícone. Os que não têm (pronta, vazia) recebem um círculo tracejado (linha 358).

---

### Props do ProcessarTrimestre — linhas 91–106

```tsx
export function ProcessarTrimestre({
  meses, caminhos, arquivos, memoria, retomar, semArquivos, auditoria, cgf, ret, concilia, onGravado, onFechar,
}: {
  memoria: string;            // armário da prévia no guarda-volumes
  retomar: Retomada | null;   // prévia de antes de recarregar
  semArquivos: boolean;       // sem permissão: não há o que enviar
  // ... auditoria/cgf/ret/concilia = o que já está gravado (vem do Painel)
  onGravado: () => void;      // avisa o Painel que gravou (sobe a "versao")
  onFechar: () => void;
}) {
```

**Para quê:** são as **instruções que o Painel entrega** ao Processar: os meses, os nomes e os arquivos da pasta, o que já está gravado e dois "telefones" para avisar o Painel (`onGravado` e `onFechar`).

**Como:** funções passadas como props, como `onGravado`, permitem que a peça de dentro chame a de fora. É como deixar um ramal para ser avisado quando o serviço terminar.

---

### Montar as linhas iniciais — linhas 107–133

```tsx
const reconhecidos = useMemo(() => caminhos.map((c) => classificar(c, ano)).filter(/* ... */), [caminhos, ano]);
const [inicio] = useState(() => (retomar ? retomada(retomar) : null)); // havia prévia guardada?
const [celulas, setCelulas] = useState<Celula[]>(() => inicio?.celulas ??
  ORDEM.flatMap((etapa) => meses.map((periodo): Celula => {             // 4 etapas × 3 meses = 12 linhas
    const { pastas, zipsSoltos } = arquivosDaCelula(reconhecidos, etapa, periodo);
    // ... "salvo" = valor já gravado desta etapa-mês (linhas 117–121)
    if (!lista.length) return { ...base, estado: "vazia" };            // sem arquivos
    if (etapa === "cgf" && !pastas.length) return { ...base, estado: "bloqueada", motivo: "Só há .zip: ..." };
    // ... RP com .zip sem categoria também bloqueia (linhas 128–130)
    return { ...base, estado: "pronta", escolhida: gravado === null }; // marcada só se ainda não foi gravada
  })),
);
```

**Para quê:** prepara a **tabela de 12 linhas** (4 etapas × 3 meses). Se havia prévia guardada, usa a prévia. Se não, monta cada linha: classifica os arquivos (pelo porteiro `pastaCiclo`), busca o valor já gravado e define o estado inicial.

**Regra importante (linha 131):** linhas que **já têm valor gravado começam desmarcadas**. Assim, ninguém sobrescreve um mês pronto sem querer.

**Como:** o `flatMap` é um `map` que "achata" o resultado. Em vez de 4 listas de 3, fica uma lista só de 12.

---

### Fase, freio e memória automática — linhas 134–142

```tsx
const [fase, setFase] = useState<Fase>(inicio?.fase ?? "previa");
const parar = useRef(false);                     // o freio "Parar depois desta"

useEffect(() => {
  if (fase === "fim") esquecer(memoria);         // terminou: nada a retomar
  else guardar(memoria, { celulas, fase } satisfies Retomada); // senão, guarda a cada mudança
}, [celulas, fase, memoria]);
```

**Para quê:** a cada mudança numa linha, a prévia vai para o guarda-volumes. É por isso que recarregar a página não perde o que já foi processado. `parar` é um **freio de mão**: um `useRef` que pode ser puxado no meio do processamento sem redesenhar a tela.

---

### atualizar, alternar e abrir — linhas 144–157

```tsx
const atualizar = (alvo: Celula, mudanca: Partial<Celula>) =>
  setCelulas((cs) => cs.map((c) => (c.etapa === alvo.etapa && c.periodo === alvo.periodo ? { ...c, ...mudanca } : c)));
const alternar = (c: Celula) => atualizar(c, { escolhida: !c.escolhida }); // marca/desmarca
async function abrir(c: Celula, caminho: (a, f) => string, so?: (a) => boolean) {
  const lista = await Promise.all(c.arquivos.filter((a) => !so || so(a)).map(async (a) => {
    const item = arquivos.get(a.caminho);        // procura na agenda
    if (!item) return null;
    const f = await abrirArquivo(item);          // SÓ AGORA abre o arquivo do disco
    return { arquivo: f, caminho: caminho(a, f) };
  }));
  return lista.filter(/* ... sem os nulos */);
}
```

**Para quê:**
- `atualizar` troca só os campos de **uma linha**, como apagar e reescrever uma célula da planilha.
- `alternar` é a caixinha de marcar.
- `abrir` é o momento em que os arquivos são **realmente abertos**, só os daquela etapa e mês, logo antes do envio. Até então, só os nomes eram conhecidos.

---

### processarUma — Auditoria (linhas 160–188)

```tsx
if (c.etapa === "auditoria") {
  const envio = await abrir(c, (a) => envioDaAuditoria(a).caminho);
  const r = await processarAuditoria({ arquivos: envio, pastaRaiz, empresas: [], modo: "XML", periodo: c.periodo, planilha: null });
  const erros = (r.problemas ?? []).filter((p) => p.gravidade === "erro");
  if (erros.length) return { estado: "erro", motivo: erros.map((p) => p.mensagem).join(" ") };
  if (r.periodo_detectado && r.periodo_detectado !== c.periodo) return { estado: "erro", /* notas de outro mês */ };
  // ... junta avisos repetidos ("3× ...") e conta PDFs não lidos (linhas 171–180)
  const diferencas = /* se difere do gravado em > R$ 1, pergunta à API onde está a diferença */;
  return { estado: "processada", auditoria: r, valor: r.totais.cgr_liquido, avisos, diferencas,
    escolhida: c.escolhida && !naoLidos, /* ... */ };
}
```

**Para quê:** manda as notas de compra à API, como a tela da Auditoria faria. Ele **recusa** dois casos: quando há erro e quando as notas parecem de outro mês.

**Desmarca sozinho** se algum PDF não foi lido. Nesse caso, a nota ficaria fora do CGR, então só deve ser gravada se o analista decidir. Se o resultado diferir do gravado, pede à API a lista de **onde** está a diferença (`OndeDifere`, no fim do arquivo).

### processarUma — CGF (linhas 189–205)

```tsx
if (c.etapa === "cgf") {
  const pmpv = (await getPMPVMensal(c.periodo).catch(() => ({ pmpv: 0 }))).pmpv || 0;
  if (!pmpv) return { estado: "bloqueada", motivo: `Falta o PMPV de ${c.periodo}: salve o PMPV do trimestre antes.` };
  const r = await processarCGF((await abrir(c, (_, f) => f.name)).map((x) => x.arquivo), COLUNAS_PADRAO_CGF);
  // ... avisos: devoluções = 0, planilhas de outro mês (linhas 194–199)
  const rs = await calcularCGFRs(c.periodo, r.volume_final, pmpv); // o back-end calcula o R$
  return { estado: "processada", cgf: { r, pmpv }, valor: rs.cgf_rs ?? undefined, avisos,
    detalhe: `VF ${num(r.volume_final, 0)} m³ = faturado ... − devoluções ...` };
}
```

**Para quê:** o CGF **depende do PMPV do mês**. Sem PMPV salvo, a linha fica bloqueada. Com PMPV, as planilhas vão à API, que devolve o volume. Depois, uma segunda pergunta (`calcularCGFRs`) transforma o volume em R$.

Repare que **até a conta em R$ é feita no back-end**. O detalhe mostra algo como "VF 100 m³ = faturado 120 − devoluções 20" (fictício).

### processarUma — RP / Conciliação (linhas 206–226)

```tsx
if (c.etapa === "conciliacao") {
  const envio = (cat: "receita" | "despesa") => abrir(c, (a) => envioDaPastaDoMes(a).caminho, (a) => a.categoria === cat);
  const receitas = await envio("receita");     // TOP entra aqui (receita)
  const despesas = await envio("despesa");
  const r = await processarConcilia(receitas, despesas);
  const naoLidos = r.itens.filter((i) => i.status !== "OK" && i.status !== JA_NO_RET).length;
  // ... avisos: PDFs não lidos, sem OCR, sem pasta de receitas/despesas, despesas já no RET (linhas 215–221)
  return { estado: "processada", concilia: r, valor: r.totais.rp, avisos, escolhida: c.escolhida && !naoLidos, /* ... */ };
}
```

**Para quê:** separa os PDFs em **receitas** e **despesas**, como os dois campos da tela do RP, e manda os dois montes à API. O TOP é tratado como receita, e o porteiro (`pastaCiclo.ts:73–75`) e o back-end seguem a mesma regra.

Despesas que **já entraram no RET** ficam fora do RP, e um aviso conta quantas. PDFs não lidos contam R$ 0,00 e desmarcam a linha.

### processarUma — RET (linhas 227–241)

```tsx
const envio = await abrir(c, (a) => envioDaPastaDoMes(a).caminho);
const raiz = c.arquivos[0] ? envioDaPastaDoMes(c.arquivos[0]).raiz : "";
const r = await processarRET(envio, raiz);
const outros = r.meses.filter((m) => m.periodo !== c.periodo).map((m) => m.periodo); // leu outro mês?
const mes = r.meses.find((m) => m.periodo === c.periodo);
if (outros.length || !mes) return { estado: "erro", /* "lidos como ..., não Mai/2026. Use a tela RET." */ };
return { estado: "processada", ret: r, valor: mes.ret, avisos, /* detalhe: documentos, EAT, EC */ };
```

**Para quê:** o RET é a última opção, porque é o que sobra depois dos três `if`. Ele manda os documentos de transporte como se a pasta do mês tivesse sido escolhida na tela RET. Se a API disser que os documentos são **de outro mês**, a linha vira erro e manda o analista para a tela RET, em vez de gravar no mês errado.

---

### processar() — linhas 243–256

```tsx
async function processar() {
  parar.current = false;
  setFase("processando");
  for (const c of celulas.filter((x) => x.escolhida && x.estado === "pronta")) { // só as marcadas e prontas
    if (parar.current) break;                                     // puxaram o freio
    atualizar(c, { estado: "processando", motivo: undefined });
    try { atualizar(c, await processarUma(c)); }                  // uma de cada vez
    catch (e) { atualizar(c, { estado: "erro", motivo: mensagemDeErro(e, /* ... */) }); }
  }
  setFase("revisao");                                             // nada gravado ainda
}
```

**Para quê:** é a **esteira**: uma linha de cada vez, na ordem. Diferente do `Promise.all` do Painel, aqui é de propósito **um por vez**, para não sobrecarregar o servidor com arquivos pesados. Um erro numa linha não derruba as outras. No fim, o painel passa para "revisão", e **nada foi gravado ainda**.

**for...of:** é "para cada item da lista, faça isto". O `break` sai do laço no meio.

### gravar() — linhas 258–288

```tsx
async function gravar() {
  setFase("gravando");
  for (const c of celulas.filter((x) => x.escolhida && x.estado === "processada")) { // só o que foi conferido e marcado
    if (parar.current) break;
    atualizar(c, { estado: "gravando" });
    try {
      if (c.auditoria) { const s = await salvarAuditoria(c.periodo, c.auditoria.itens); atualizar(c, { estado: "gravada", valor: s.cgr_liquido }); }
      else if (c.cgf) { /* salvarCGF com volumes e PMPV (linhas 268–274) */ }
      // ... else if RET (275–277), else if RP (278–281)
    } catch (e) { atualizar(c, { estado: "erro", motivo: /* ... */ }); }
  }
  setFase("fim");
  onGravado();                                                    // avisa o Painel -> a lista se atualiza
}
```

**Para quê:** é o **"salvar" de verdade**. Ele manda ao banco a mesma resposta que o analista viu na revisão e mostra o valor que o banco confirmou. No fim, liga para o Painel (`onGravado`), que recarrega a lista de etapas com os sinais novos.

---

### Contadores e "Selecionar tudo" — linhas 290–306

```tsx
const aProcessar = celulas.filter((c) => c.escolhida && c.estado === "pronta").length;  // texto do botão
const aGravar = celulas.filter((c) => c.escolhida && c.estado === "processada").length;
const ocupado = fase === "processando" || fase === "gravando";
const podeMarcar = (c: Celula) => !ocupado && fase !== "fim" &&
  ((fase === "previa" && c.estado === "pronta") || (fase === "revisao" && c.estado === "processada"));
const todasMarcadas = marcaveis.length > 0 && marcaveis.every((c) => c.escolhida);
const marcarTodas = () => { const valor = !todasMarcadas;                              // tudo marcado? desmarca tudo
  setCelulas((cs) => cs.map((c) => (podeMarcar(c) ? { ...c, escolhida: valor } : c))); };
```

**Para quê:** são as contas para os botões ("Processar 12 etapa(s)-mês") e as regras das caixinhas:
- na **prévia**, só se marcam as linhas prontas;
- na **revisão**, só as processadas;
- enquanto está ocupado, nada se marca.

A caixinha do cabeçalho marca ou desmarca tudo. Quando só algumas estão marcadas, ela mostra um tracinho (linha 329).

---

### O desenho do painel (JSX) — linhas 308–418

#### Título e frase de cada fase — linhas 310–319

```tsx
<h3>{fase === "previa" ? `Processar ${meses[0]} a ${meses[2]}` : fase === "fim" ? "Pronto"
  : fase === "revisao" ? "Confira antes de gravar" : "Processando…"}</h3>
<p>
  {fase === "previa" && "Escolha o que enviar. Nada é gravado agora: ..."}
  {fase === "revisao" && "Compare com o que já está gravado. Desmarque o que não quiser gravar."}
  {fase === "fim" && `${gravadas} gravada(s)${comErro ? ` · ${comErro} com problema (veja abaixo)` : ""}. ...`}
  {/* ... processando, gravando */}
</p>
```

**Para quê:** o título e a frase **mudam a cada fase** e dizem ao analista em que ponto ele está e se algo já foi gravado. São vários ternários e `&&` encadeados.

#### Linhas da tabela — linhas 341–386

```tsx
{celulas.map((c) => {
  const regrava = c.escolhida && c.gravado !== null && c.estado !== "gravada"; // vai substituir o gravado?
  return (
    <tr key={`${c.etapa}-${c.periodo}`}>
      <td><input type="checkbox" checked={c.escolhida} disabled={!podeMarcar(c)} onChange={() => alternar(c)} /> ...</td>
      <td>{c.arquivos.length || "—"}</td>                               {/* Arquivos */}
      <td>{c.gravado === null ? "—" : brl(c.gravado)}</td>             {/* Já gravado */}
      <td>{c.valor === undefined ? "—" : brl(c.valor)}</td>            {/* Resultado */}
      <td>{/* situação, detalhe, avisos, OndeDifere e o link "Conferir em ..." (linhas 356–381) */}</td>
```

**Para quê:** cada linha mostra, lado a lado, **"Já gravado"** e **"Resultado"**, que é a comparação que o analista precisa fazer. Exemplo: Já gravado R$ 1.000,00 e Resultado R$ 1.000,00.

A coluna "Situação" explica em português o estado da linha. Ela avisa quando gravar vai **substituir** um valor existente (`regrava`) e, se preciso, mostra o link "Conferir em CGF · Mai/2026" (linhas 373–380).

#### Botões do rodapé — linhas 391–416

```tsx
{fase === "previa" && (
  <button onClick={processar} disabled={!aProcessar || semArquivos}>Processar {aProcessar} etapa(s)-mês</button>)}
{fase === "revisao" && (
  <button onClick={gravar} disabled={!aGravar}>Gravar {aGravar} etapa(s)-mês</button>)}
{ocupado && (
  <button onClick={() => { parar.current = true; }}>Parar depois desta</button>)}  {/* puxa o freio */}
{!ocupado && (
  <button onClick={onFechar}>{fase === "fim" ? "Fechar" : "Cancelar"}</button>)}
```

**Para quê:** em cada fase aparece só o botão que faz sentido:
- **Processar** na prévia;
- **Gravar** na revisão;
- **Parar depois desta** enquanto trabalha (termina a linha atual e para);
- **Fechar/Cancelar** quando está parado.

O Processar fica cinza se a pasta está sem permissão (`semArquivos`).

---

### SITUACAO e OndeDifere — linhas 421–467

```tsx
const SITUACAO = { so_no_gravado: "só no gravado", so_no_processado: "só no processado", valor_diferente: "valor diferente" };
function OndeDifere({ d, total }: { d: AuditoriaDiferencas; total: number }) {
  return (
    <span>
      <span>Diferença de {brl(total)} para o gravado. Onde está:</span>  {/* ex.: R$ 5,00 */}
      {d.resumo.map((l) => <span key={l}>{l}</span>)}                   {/* resumo por empresa */}
      {d.notas.length > 0 && (
        <details><summary>Ver as {d.notas.length} nota(s)</summary>     {/* recolhível */}
          <table>{/* nota · situação · gravado · agora · diferença */}</table>
        </details>)}
    </span>);
}
```

**Para quê:** quando a Auditoria processada difere da gravada, esse quadro mostra **onde está a diferença**: primeiro um resumo por empresa e, ao abrir, nota por nota. Para cada nota, indica se ela está só no gravado, só no processado ou com valor diferente. É como um extrato de conciliação bancária: em vez de "não bate", mostra qual lançamento não bate.

---

## Glossário

| Termo | Em linguagem simples |
|---|---|
| **Componente** | Função que devolve um pedaço de tela. É uma peça de Lego (`CicloPage`, `MapaPasta`, `ProcessarTrimestre`). |
| **props** | Instruções passadas a um componente (`meses`, `onGravado`). Podem ser valores ou "ramais" (funções) para avisar quem chamou. |
| **JSX** | HTML escrito dentro do código. As chaves `{ }` encaixam valores. |
| **Estado / useState** | Memória de curto prazo da tela (post-it). `[x, setX]`: valor e caneta. Usar a caneta redesenha a tela. |
| **useEffect** | Ação automática: "quando X mudar, faça Y". `[]` = só ao abrir. Pode ter uma "faxina" no `return`. |
| **useMemo** | Conta guardada, refeita só quando os ingredientes mudam. |
| **useRef** | Post-it que não redesenha a tela (alça do campo escondido, freio "parar"). |
| **Hook** | Ferramenta do React que começa com `use`. |
| **Rota** | Endereço de uma tela (`/ciclo`, `/cgf?periodo=Mai/2026`). |
| **API** | Guichê interno que leva os pedidos da tela ao back-end (cálculos e banco). |
| **async / await** | `async` marca uma função que espera coisas demoradas. `await` = "espere a resposta aqui". |
| **Promise** | Vale de retirada: a resposta vai chegar. `.then` = quando chegar; `.catch` = se der erro. |
| **Promise.all** | Vários pedidos ao mesmo tempo, esperando todos voltarem. |
| **for...of / break** | "Para cada item, faça isto", um por vez. `break` sai no meio. |
| **try / catch / finally** | Tente; se der erro, trate; no fim, sempre faça isto. |
| **map / filter / find** | Transformar cada item / ficar só com alguns / achar o primeiro. |
| **flatMap / reduce / every / some** | Achatar listas de listas / juntar num valor só / "todos passam?" / "algum passa?". |
| **Ternário `? :`** | "Se/senão" numa linha: `condição ? seSim : seNão`. |
| **`&&` no JSX** | Interruptor: só mostra a peça se a condição for verdadeira. |
| **`?.` e `??`** | "Se existir" / "se for vazio, use isto". |
| **`!!`** | Transforma qualquer coisa em verdadeiro ou falso. |
| **Template string** | Texto entre crases com lacunas `${...}`. |
| **Spread `...`** | "Despeje aqui todos os campos ou itens". |
| **interface / tipo** | Formulário padrão do TypeScript: que campos um objeto tem. |
| **Map / Set** | Agenda (chave leva a valor) / lista sem repetidos. |
| **key** | Etiqueta única de cada item desenhado por `map`. |
| **Esqueleto (Skeleton)** | Formas cinzas no lugar do conteúdo enquanto carrega. |
| **IndexedDB** | Pequeno banco dentro do navegador, usado pelo guarda-volumes (`lembrar.ts`). |

---

## Exercícios

**1.** Quantos pedidos a função `carregar()` do Painel faz ao back-end, e eles saem um de cada vez ou todos juntos? E no `processar()` do Processar?

<details>
<summary>Resposta</summary>

O `carregar()` faz **nove** pedidos, **todos juntos**, num `Promise.all` (`index.tsx:57–63`). O `processar()` trabalha **uma etapa-mês de cada vez**, num `for...of` (`Processar.tsx:246–254`), para não sobrecarregar o servidor e para poder ser freado com "Parar depois desta".
</details>

**2.** Se o trimestre escolhido é Abr–Jun/2026, para quais meses vale o PR mostrado na tela? Em que linha isso é calculado?

<details>
<summary>Resposta</summary>

Para **Ago, Set e Out/2026**. O cálculo está em `index.tsx:185` (`mesesDoPRDoCivil(meses[2])`), que soma 2, 3 e 4 meses ao último mês apurado (`utils/periodos.ts:22`).
</details>

**3.** Ao abrir o Processar, por que algumas caixinhas já vêm desmarcadas?

<details>
<summary>Resposta</summary>

Porque a linha 131 do `Processar.tsx` marca uma etapa-mês só se ela **ainda não tem valor gravado** (`escolhida: gravado === null`). Isso evita sobrescrever um mês já pronto sem querer. Linhas vazias ou bloqueadas também não podem ser marcadas.
</details>

**4.** Depois que o Processar grava, como a lista "Etapas do ciclo" fica sabendo que precisa se atualizar?

<details>
<summary>Resposta</summary>

O `gravar()` termina chamando `onGravado()` (`Processar.tsx:287`). No Painel, essa prop faz `setVersao((v) => v + 1)` (`index.tsx:415`). Como `versao` está na lista vigiada pelo useEffect de `index.tsx:239`, o `carregar()` roda de novo e a lista é redesenhada.
</details>

**5.** O analista recarregou a página no meio da gravação. O que acontece com as linhas que estavam "gravando"?

<details>
<summary>Resposta</summary>

A prévia estava no guarda-volumes (`Processar.tsx:139–142`). Ao reabrir, o Painel a busca (`index.tsx:221–230`), e a função `retomada()` (`Processar.tsx:63–68`) volta essas linhas para **"processada"**. O painel abre na fase **"revisão"**, para o analista conferir e gravar de novo, porque não dá para saber se aquela gravação chegou a acontecer.
</details>
