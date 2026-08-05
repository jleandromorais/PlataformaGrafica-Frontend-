# Plano de Execução — Design System de Verdade

> **Status:** proposta, nada implementado. Escrito em 2026-08-05 a partir de
> leitura do código real (`src/index.css`, `src/theme.ts`,
> `src/components/**`, as 11 páginas em `src/pages/**`).
>
> Relação com `SPEC_DESIGN_SYSTEM.md`: aquele documento é a **auditoria**
> (o que está errado). Este é o **plano de execução** (como consertar, em
> que ordem, com que critério de aceite). A auditoria já foi parcialmente
> executada — `Alert`, `EmptyState`, `theme.ts` e a migração de paleta
> existem. Este plano trata do que sobrou, que é o mais estrutural.
>
> **Limitação declarada:** não avaliei a interface no navegador. Todo
> julgamento aqui é sobre estrutura de código (duplicação, fonte de
> verdade, acoplamento), não sobre estética. Itens que exigem olho humano
> estão marcados como `[confirmar visualmente]`.

---

## 1. Diagnóstico: o problema não é falta de padrão, é padrão sem mecanismo

Isto é importante para não repetir o erro. A auditoria anterior concluiu
"não existe design system" e a resposta foi criar `src/theme.ts` +
padronizar classes. O resultado é que **o padrão existe e é bom, mas nada
o torna obrigatório**. Ele é aplicado por disciplina, copiando e colando.

Evidência dura, por `grep` no código atual:

| Padrão que "existe" | Como é aplicado hoje | Ocorrências |
|---|---|---|
| Superfície de card | string Tailwind copiada literalmente | **44** em 13 arquivos |
| Wrapper de página (`min-h-screen bg-[#050505] px-6 py-8 sm:px-10`) | copiado | **11** de 11 páginas |
| `max-w-[1600px]` | copiado | **11** |
| Header de página (ícone 9x9 + `h1 text-[1.75rem]`) | copiado | **10** |
| Cor de acento do módulo | hex inline em `style={{}}` | **11** páginas |

E o `theme.ts`, que deveria ser a fonte de verdade, é importado em apenas
**4 arquivos** (`SR`, `PR`, `PV`, `Alert`) — e só a função
`colorForValue`. O `semantic` é usado por 1 arquivo. O `moduleColor`, que é
o mapa oficial de cor por módulo, é usado por **zero** arquivos: a Sidebar
tem sua própria cópia embutida no array `nav` (`Sidebar.tsx:8-18`) e cada
página tem o hex equivalente hardcoded no `style`.

Ou seja: existem **três fontes de verdade** para "qual é a cor do módulo
PR" — `theme.ts:41` diz `text-pink-400`, `Sidebar.tsx:15` diz
`text-pink-400`, e `PR/index.tsx:191` diz `#f472b6`. Hoje elas concordam
por sorte. Elas vão divergir na primeira alteração, exatamente como a
auditoria anterior documentou que já aconteceu antes.

### 1.1 Causa raiz: Tailwind v4 sem `@theme`

`src/index.css` tem `@import "tailwindcss"` e depois só CSS cru (`body`,
scrollbar). **Não existe bloco `@theme`.** Por isso não existe
`bg-background`, `text-foreground`, `border-border` — e por isso todo mundo
escreve `bg-[#0d0d0f]` e `border-white/[0.07]` na mão. O projeto tem
Tailwind v4 mas usa como se fosse v3 sem config: valores arbitrários em
toda parte.

Isso é a peça que falta. Enquanto os tokens não existirem no CSS, nenhuma
quantidade de disciplina resolve — o caminho mais curto para o dev
continuará sendo copiar a string do arquivo vizinho.

### 1.2 Sintoma mais grave: PMPV forkou os componentes base

`PMPV/index.tsx` tem **21** ocorrências da classe de superfície porque
redefine localmente um `Card` (linha 43) e um `StatCard` (linha 61) que já
existem em `components/ui/Card.tsx` — com a mesma classe, copiada. Ainda
tem um mapa local de cores em hex (linhas 54-58).

Isso é a consequência previsível de (1) não haver token e (2) o `Card`
compartilhado não atender algum caso — o dev copia em vez de estender.
`Dashboard` fez o mesmo em menor escala (6 ocorrências + 8 constantes
`COR_*` em hex, linhas 36-43).

Há também **três** componentes de card de métrica com a mesma aparência e
APIs diferentes: `StatCard` (`ui/Card.tsx`, props `label/value/sub/color`),
`MetricCard` (`components/MetricCard.tsx`, props
`title/value/valueColor/bg`), e o `StatCard` local do PMPV. O `MetricCard`
chega a aceitar a superfície inteira como prop string (`bg = "rounded-2xl
border..."`), o que é o oposto de um design system.

---

## 2. Objetivo e não-objetivos

**Objetivo:** tornar o padrão visual *estruturalmente inevitável* — o
caminho mais curto para o dev deve ser o caminho certo. Nenhuma mudança de
identidade visual: o resultado final deve ser pixel-equivalente ao atual.

**Não-objetivos (explícito, para o diff não crescer):**
- Não redesenhar nada. `[confirmar visualmente]` no fim, mas a intenção é
  refactor puro.
- Não introduzir shadcn/ui, Radix ou qualquer lib de componentes. Decisão
  grande, precisa ser pedida.
- Não mexer em fetch, cálculo ou estado. Essas são as outras frentes
  (camada de dados, cálculo no backend) e devem virar PRs separados.
- Não implementar light mode.
- Não tocar em `TASKS.md` (integração dos módulos ao backend).

---

## 3. Plano, em 6 fases

Cada fase é um PR independente e verificável. A ordem importa: a fase 1
habilita todas as outras.

### Fase 1 — Tokens no `@theme` (habilita o resto)

Declarar em `src/index.css` os tokens que hoje são valores arbitrários
espalhados. Extraídos dos valores **já em uso**, sem inventar cor nova:

```css
@theme {
  /* superfícies — hoje: #050505, #0a0a0b, #0d0d0f, #111113, #141414 */
  --color-background: #050505;
  --color-surface: #0d0d0f;
  --color-surface-raised: #111113;
  --color-sidebar: #0a0a0b;
  --color-border: oklch(1 0 0 / 7%);      /* white/[0.07] */
  --color-border-strong: oklch(1 0 0 / 14%);

  /* texto — hoje: text-white, zinc-300/400/500/600 */
  --color-foreground: #f8fafc;
  --color-muted-foreground: #a1a1aa;
  --color-subtle-foreground: #71717a;

  /* papéis semânticos — espelham o semantic de theme.ts */
  --color-positive: …; --color-negative: …;
  --color-warning:  …; --color-info:     …;

  --radius-card: 1rem;   /* rounded-2xl */
  --font-sans: 'Inter', …;
}
```

Ponto de atenção: hoje há 5 tons de fundo escuro muito próximos
(`#050505`, `#0a0a0b`, `#0d0d0f`, `#111113`, `#141414`). Provavelmente 3
bastam — mas **não vou colapsar sem confirmar visualmente**, porque a
diferença sutil entre `#0d0d0f` (card) e `#111113` (botão dentro do card)
pode ser intencional para dar profundidade. Fase 1 só nomeia o que existe.

Não muda nenhum componente ainda. Diff pequeno, risco zero.

### Fase 2 — `theme.ts` deixa de ser strings de classe

Hoje `theme.ts` guarda `"text-emerald-400"`. Isso obriga cada consumidor a
interpolar string em `className`, e torna impossível usar o mesmo valor num
`style` ou num gráfico Recharts — que é justamente por que o Dashboard tem
8 constantes hex próprias.

Proposta: `theme.ts` passa a expor **um mapa único de módulo → token**, com
a cor vindo do CSS (`var(--color-module-pr)`), servindo os três consumos:

| Consumo | Hoje | Depois |
|---|---|---|
| Sidebar | array `nav` com cor embutida | lê do mapa |
| Header da página | hex em `style={{}}` | lê do mapa |
| Recharts (Dashboard) | `COR_CGR = "#3987e5"` | lê do mapa |

Isso mata a divergência de três fontes descrita em §1. `moduleColor` sai de
zero consumidores para todos.

### Fase 3 — `PageShell` + `PageHeader`

Extrair os dois blocos copiados 10-11 vezes para
`components/layout/PageShell.tsx`:

```tsx
<PageShell module="cgf" title="CGF"
           subtitle="Conta Gráfica Faturada — volume faturado por período"
           icon={BarChart2} actions={<Button…/>}>
  {…}
</PageShell>
```

Elimina de cada página: o wrapper `min-h-screen`, o `max-w-[1600px]`, o
`flex flex-col gap-6`, o ícone 9x9 com hex inline, o `h1`, o subtítulo com
`ml-12`. São ~12 linhas por página × 11 páginas.

Detalhe que o `PageShell` conserta de graça: hoje `min-h-screen` está
dentro de cada página **e** o `Layout` já usa `h-screen overflow-hidden`
(`Layout.tsx:7`) — duas declarações de altura total aninhadas. Com o shell,
a altura vira responsabilidade de um único lugar. `[confirmar
visualmente]` se isso altera o comportamento de scroll.

### Fase 4 — Consolidar os cards de métrica

Um único componente. `StatCard` (`ui/Card.tsx`) é o mais usado e tem a API
mais limpa — ele vence. Então:
1. `MetricCard` e o `StatCard` local do PMPV são removidos, chamadas
   migradas para `StatCard`.
2. A prop `bg` do `MetricCard` (superfície como string) morre com ele.
3. Se algum caso do PMPV/Dashboard não couber no `StatCard`, ele ganha a
   prop — não um fork. Precisa checar caso a caso na execução.

Depois disso, a classe de superfície deve existir em **1 lugar**
(`ui/Card.tsx`), não 44.

### Fase 5 — Escalas fechadas (tipografia e ícones)

Documentar e aplicar o que já é quase padrão:
- **Tipografia**, 5 níveis: título de página `text-[1.75rem] font-bold`
  (já consistente em 10 páginas), título de card `text-base
  font-semibold`, KPI `text-2xl font-bold tabular-nums`, corpo `text-sm`,
  label `text-[0.7rem] uppercase tracking-[0.08em]`. Vira token/classe, não
  convenção oral.
- **Ícones**, 3 tamanhos: 22 (header), 16 (botão), 14 (compacto). Hoje há
  **8** tamanhos distintos em uso — `16` (38×), `14` (12×), `22` (5×), e
  então `13`, `12`, `15`, `18`, `28` com 1-2 usos cada. Esses últimos são
  ruído, não intenção.

### Fase 6 — Varredura final e trava

- `grep` deve retornar **zero** para: hex em `style={{}}` de cor de módulo,
  `bg-[#0…]`, `border-white/[0.0…]` fora de `ui/`.
- Adicionar ao ESLint uma regra bloqueando valor arbitrário de cor Tailwind
  em `src/pages/**` (permitido só em `src/components/ui/**` e
  `index.css`). **Esta é a única fase que impede a regressão** — sem ela,
  em três meses estamos de volta ao estado atual.

---

## 4. Ordem, esforço, e o que cada fase compra

| # | Fase | Esforço | Reversível? | Sem ela… |
|---|---|---|---|---|
| 1 | Tokens no `@theme` | Baixo | Sim, trivial | nada mais é possível |
| 2 | `theme.ts` → tokens | Baixo | Sim | cor do módulo continua com 3 fontes |
| 3 | `PageShell`/`PageHeader` | Médio (11 arquivos) | Sim | ~130 linhas duplicadas ficam |
| 4 | Consolidar cards | Médio | Sim | 3 componentes iguais divergindo |
| 5 | Escalas | Baixo | Sim | inconsistência fina permanece |
| 6 | Varredura + ESLint | Baixo | Sim | **tudo regride** |

Fases 1+2 dão para fazer juntas num PR pequeno. A 3 é o maior diff (mas
mecânico e repetitivo). A 6 é a que garante que o trabalho dura.

---

## 5. Riscos e como mitigo

| Risco | Mitigação |
|---|---|
| Refactor visual "sem mudança" que muda algo | Fases pequenas; screenshot antes/depois de cada página no navegador; nenhum valor novo de cor na fase 1 |
| Diff de 11 arquivos difícil de revisar (fase 3) | Aplicar em 2 páginas primeiro (`CGF` simples + `Dashboard` complexa) e validar o padrão antes de propagar |
| Conflito com as outras frentes (camada de dados, cálculo) | Este plano não toca fetch, estado nem fórmula. PRs disjuntos. Se as duas frentes andarem juntas, fazer esta primeiro (o diff dela é mecânico; a outra é lógica) |
| Backend fora do ar impede validar | Nenhuma fase depende de dado real; páginas mockadas renderizam igual |
| `@theme` mal escrito quebra o build inteiro | Fase 1 isolada, verificada com `pnpm build` antes de qualquer outra |

---

## 6. Definition of Done

- [ ] `src/index.css` tem bloco `@theme` com superfícies, texto, papéis
      semânticos, radius e fonte.
- [ ] `theme.ts` é a única fonte de cor de módulo, consumida por Sidebar,
      headers de página e Recharts.
- [ ] Nenhuma cor de módulo em `style={{}}` nas páginas.
- [ ] `PageShell`/`PageHeader` adotados nas 11 páginas.
- [ ] Um único card de métrica; `MetricCard.tsx` e o fork do PMPV
      removidos.
- [ ] Classe de superfície de card existe em 1 arquivo (hoje: 44
      ocorrências / 13 arquivos).
- [ ] 3 tamanhos de ícone (hoje: 8).
- [ ] Regra de ESLint barrando cor arbitrária em `src/pages/**`.
- [ ] `pnpm build` verde e as 11 rotas verificadas no navegador contra
      screenshot anterior.

---

## 7. Fora deste plano, mas registrado (não perder de vista)

Estes itens apareceram na leitura e são **mais graves** que design system.
Não entram aqui para não misturar escopo, mas devem virar plano próprio:

1. **Fórmula financeira duplicada no front.** `SR/index.tsx` tem
   `calcularLocal()` reimplementando o cálculo do backend; `PR`/`PV`
   recalculam localmente; `RET` tem PIS/COFINS `0.0465` hardcoded. Duas
   fontes de verdade para dinheiro.
2. **Mock indistinguível de dado real.** `RPV` exibe `3982585` e
   `5172827.66` fixos no código; `SCG` e `Auditoria` idem. Usuário não tem
   como saber que é falso.
3. **Sem camada de dados.** Cada página repete `useState` +
   `try/catch` + flags manuais; `api/client.ts` só faz `console.error`.
   Sem cache, retry, cancelamento ou erro tipado.
4. **`DELETE /scg` sem confirmação** em app financeiro.
5. **Sem `ErrorBoundary`, sem rota 404** (o router não tem catch-all),
   botões icon-only sem `aria-label`, sidebar fixa de 260px sem colapso.
