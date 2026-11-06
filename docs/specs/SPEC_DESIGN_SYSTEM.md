# Spec — Design System / Polimento Visual do Front-end

> **Atualização 2026-08-04 (noite):** Todas as 11 páginas de módulo, o
> `Layout`/`Sidebar`, e os componentes base (`Card`, `StatCard`, `Button`,
> `Input`, `Select`, `Table`, `Badge`, `EmptyState`, `MetricCard`) migrados
> para uma paleta única: fundo `#050505`, cards `#0d0d0f` com gradiente
> sutil `from-white/[0.025]`, bordas `border-white/[0.07]`, títulos de
> seção `text-base font-semibold text-white` + subtítulo `text-sm
> text-zinc-500`, labels uppercase `text-[0.7rem] tracking-[0.08em]
> text-zinc-500`. Botões passaram de fills sólidos saturados para
> borda+fundo translúcido (`border-{cor}-500/25 bg-{cor}-500/10`), badges
> idem. §3.1 (fundo `#0f172a`/`#1e293b`, 13 cores de acento sem padrão) e
> a nota de "Sidebar mais polida" (§2) descrevem o estado **anterior** a
> essa migração — mantidos como histórico. Nenhuma página com `slate-*`
> hardcoded restante (confirmado por grep em `src/pages` e
> `src/components`).

Auditoria feita em 2026-08-04 sobre o estado real do código
(`src/index.css`, `src/components/ui/*`, `src/components/layout/*`, e as 11
páginas de módulo). Objetivo: levantar o que falta para o front sair de
"protótipo funcional com Tailwind solto" para "produto profissional
coerente" — sem inventar trabalho novo de UI, só formalizar e consertar o
que já existe de forma inconsistente.

Nota de honestidade: não é possível avaliar visualmente esta interface sem
rodar no navegador — esta spec é baseada em leitura de código (classes
Tailwind, estrutura de componentes, paleta declarada), não em captura de
tela. Onde a leitura de código não é suficiente para julgar (espaçamento
fino, hierarquia tipográfica real, contraste efetivo), sinalizo como "a
confirmar visualmente" em vez de afirmar.

---

## 1. Achado principal: não existe design system, existe Tailwind ad-hoc

Cada página declara suas próprias cores, sem nenhuma fonte única. Evidência
concreta, comparando 3 arquivos que reconstruí nesta sessão com o resto:

| Módulo | Cor na Sidebar (`Sidebar.tsx`) | Cor usada de fato na página |
|---|---|---|
| SR | `text-cyan-400` | resultado usa verde/vermelho/âmbar condicional, card com borda `cyan-500/20` — ok, mas nada declara isso como "a cor do SR" |
| PR | `text-pink-400` | ícone `text-amber-400`, resultado com borda `amber-500/20` — **cor diferente da sidebar** |
| PV | `text-teal-400` | ok, mantive teal — mas por escolha manual meta, não por regra |
| CGF | `text-emerald-400` | ícone emerald — bate |
| SCG | `text-red-400` | badges usam `blue/green/purple/yellow` por campo (CGR/CGF/RPV/RET/RP), sem relação com o vermelho da sidebar |

Cada dev (inclusive eu, ao reconstruir SR/PR/PV nesta sessão) escolheu cores
"que pareciam certas" na hora, sem consultar uma paleta central. Isso é
esperado sem um design system — não é erro de execução, é ausência de
sistema.

**Impacto real**: a navegação perde uma pista visual importante (usuário
associa cor→módulo na sidebar, mas a cor não se repete dentro da página),
e a paleta cresce sem controle (contei pelo menos 9 cores de acento
diferentes usadas hoje: sky, blue, emerald, violet, orange, yellow, pink,
teal, indigo, red, cyan, amber, purple — 13, na verdade, mais que os 11
módulos).

## 2. O que já existe de bom (não descartar)

- Base sólida: Tailwind v4 + tema escuro consistente (`#0f172a`/`#020617`
  como fundo, `#1e293b` como card) — a decisão de fundo/superfície está
  correta e é seguida em quase todo lugar.
- Componentes compartilhados já existem (`Card`, `StatCard`, `Button`,
  `Input`, `Select`, `Badge`, `Table`) — a base de reuso está lá, só falta
  usá-la com uma paleta disciplinada por trás.
- Sidebar com estado ativo bem resolvido (glow, dot indicador, ícone com
  wrapper) — é o componente mais polido do projeto hoje.
- Scrollbar customizada, gradiente radial no body — atenção a detalhe que
  já existe, não precisa reinventar.

## 3. Inconsistências concretas por camada

### 3.1 Paleta de acento (crítico)
- **Ação**: definir uma paleta de 6-8 cores de acento (uma por família de
  indicador de negócio: volume, valor monetário positivo, valor monetário
  negativo, alerta, neutro/informativo, ação primária) e mapear os 11
  módulos para essas cores de forma fixa — não uma cor por módulo
  arbitrária, mas por **papel semântico** do dado mostrado.
- Hoje o problema não é "muitas cores", é "cores sem significado
  consistente": `text-emerald-400` às vezes significa "positivo", às vezes
  "CGF", às vezes "sucesso de ação" — três significados para a mesma cor em
  telas diferentes.
- Recomendação: seguir o padrão já estabelecido nas páginas que reconstruí
  (SR, PR, Dashboard) onde cor é sempre semântica (`emerald` = resultado
  positivo, `red` = resultado negativo, `amber` = neutro/zero/aviso, `sky`
  = ação/informação) e generalizar isso para as páginas antigas (CGF, SCG,
  RET, Auditoria, Conciliação, PMPV), que hoje usam cor por "gosto do
  módulo" em vez de por papel do dado.

### 3.2 Tipografia
- Não há escala tipográfica declarada em nenhum lugar central — cada página
  usa `text-xl`, `text-2xl`, `text-3xl` conforme "parece bom" no momento.
- **Ação**: declarar 4-5 níveis (título de página, título de card, valor
  destacado/KPI, corpo, legenda/metadado) e usar consistentemente. Hoje
  título de página varia entre `text-xl font-bold` (SR, PR, PV, Dashboard) —
  esse já é consistente entre as páginas que reconstruí — mas os `StatCard`
  legados (CGF, RET, SCG, Auditoria) usam tamanhos e pesos que não foram
  auditados contra esse padrão.

### 3.3 Componente `Table` está isolado
- `Table.tsx` existe e é genérico, mas só é usado em RET
  (`import { Table }`). PR (que reconstruí) usa uma tabela HTML crua
  (`<table>` inline) para a decomposição trimestral porque `Table` não
  suporta `<tfoot>`/rodapé de totais, que a decomposição de PR precisa.
- **Ação**: estender `Table` para suportar `footer`/linha de totais, e
  migrar a tabela inline de PR para usá-lo — evita duas implementações de
  tabela divergindo em padding, bordas, hover.

### 3.4 Estados de loading/erro/vazio não são um componente
- Cada página que reconstruí (SR, PR, PV, Dashboard) tem seu próprio bloco
  inline de erro (`<div className="rounded-lg border border-red-500/40 ...">`)
  e aviso (`border-sky-500/40`) — copiado e colado 4 vezes com o mesmo
  Tailwind, sem extrair componente.
- **Ação**: extrair `<Alert variant="error"|"info"|"warning">` para
  `components/ui/`. Baixo esforço, alto ganho de consistência — hoje se
  quisermos mudar o estilo de alerta de erro, são 4+ lugares para editar.
- Estado vazio ("Nenhum período calculado ainda", "Nenhuma sessão", listas
  vazias) também está duplicado como texto solto em cada página — merece um
  `<EmptyState icon label />` pequeno.

### 3.5 Botões desabilitados com tooltip de dependência
- Introduzi nesta sessão o padrão de `<Button disabled title="Requer fluxo
  de Excel Final (Módulo 9) — pendente">` em SR, PR e PV. Isso é bom (não
  finge que a feature funciona), mas o `title` nativo do HTML é uma
  tooltip pobre visualmente (sem estilo, delay do navegador, não some em
  mobile). Vale um componente `<Tooltip>` leve se o produto for para
  frente — mas é baixa prioridade frente aos itens 3.1-3.4.

### 3.6 Densidade de informação e grid responsivo
- Páginas mais recentes (Dashboard, PR) já usam `grid` responsivo bem
  (`sm:grid-cols-3 lg:grid-cols-6` nos KPIs do Dashboard). Páginas legadas
  (CGF, Auditoria) usam `lg:grid-cols-2` fixo sem considerar telas maiores
  — a confirmar visualmente se isso deixa muito espaço vazio em monitores
  wide, mas a estrutura de classe sugere que sim.

### 3.7 Ícones sem padrão de tamanho
- `lucide-react` é usado em todo lugar, mas o tamanho varia sem regra
  aparente: `size={22}` no título (padrão, repetido), `size={16}` em
  botões, `size={14}` em botões menores, `size={13}` em alguns lugares
  legados (PMPV) — não é grave, mas vale documentar os 3 tamanhos-padrão
  (header 22, botão 16, botão compacto 14) para não crescer mais variações.

## 4. O que falta para "parecer profissional" (além de consistência)

Isso é a parte que vai além de arrumar o que já existe:

### 4.1 Feedback de ação assíncrona
- Hoje o padrão de loading é só o spinner dentro do próprio `Button`
  (`loading` prop) — funciona, mas não há feedback de sucesso além de um
  `<Alert>` de texto que fica na tela até a próxima ação. Produtos
  profissionais usam toast/snackbar temporário para "Salvo com sucesso" em
  vez de um bloco fixo que o usuário precisa notar e ignorar manualmente.
- **Ação** (esforço médio): introduzir um sistema de toast simples
  (biblioteca leve tipo `sonner`, ou um componente próprio com
  auto-dismiss) para confirmações de salvamento, substituindo os `aviso`
  fixos em SR/PR/PV/Dashboard por notificações que somem sozinhas.

### 4.2 Skeleton loading em vez de tela vazia
- Ao trocar de página ou período, os campos ficam em zero/vazio até a
  resposta chegar (ex.: Dashboard mostra "—" ou 0 nos KPIs por uma fração
  de segundo antes do fetch completar). Um skeleton (placeholder cinza
  pulsante) no lugar dá sensação de app mais responsivo/maduro.

### 4.3 Confirmação de ações destrutivas
- `apagarSCG`/`DELETE /scg` já existe no backend, mas não vi (nas páginas
  que li) nenhum padrão de modal de confirmação antes de deletar — isso é
  crítico para um app financeiro. Precisa ser verificado especificamente
  quando a página de SCG for revisada (ainda usa mock).

### 4.4 Acessibilidade básica
- Não vi nenhum uso de `aria-label` em botões só-com-ícone (ex.: botão de
  recarregar `<RefreshCw />` sem texto, no Dashboard e SR) — leitores de
  tela não conseguem descrever a ação. Baixo esforço, adicionar `aria-label`
  nos botões icon-only.
- Contraste de texto `text-slate-500`/`text-slate-600` sobre fundo escuro:
  a confirmar visualmente se passa WCAG AA (suspeita de contraste baixo em
  textos de metadado, comum em temas escuros feitos rápido).

### 4.5 Responsividade mobile real
- O layout assume sidebar fixa de 260px sempre visível
  (`Sidebar.tsx`, `w-[260px]`) — não há nenhum toggle/collapse para tela
  estreita. Para uma ferramenta interna B2B isso pode ser aceitável (uso
  majoritariamente desktop), mas vale confirmar com o negócio se mobile é
  um requisito antes de investir nisso.

## 5. Priorização sugerida (esforço × impacto)

| Prioridade | Item | Esforço | Por quê primeiro |
|---|---|---|---|
| 1 | Paleta semântica única (§3.1) | Médio | Base de tudo — sem isso, cada página nova reintroduz o mesmo problema |
| 2 | Extrair `<Alert>` e `<EmptyState>` (§3.4) | Baixo | Alto reuso imediato, várias páginas já duplicam esse código |
| 3 | Estender `Table` com footer, migrar PR (§3.3) | Baixo | Remove uma divergência concreta já identificada |
| 4 | Toast para confirmações (§4.1) | Médio | Maior salto percebido de "profissional" pelo usuário final |
| 5 | Escala tipográfica documentada (§3.2) | Baixo (doc) / Médio (aplicar) | Consistência visual fina |
| 6 | Skeleton loading (§4.2) | Médio | Polish, não bloqueia uso |
| 7 | Acessibilidade básica (§4.4) | Baixo | Correto fazer, mas não bloqueia entrega |
| 8 | Confirmação de ações destrutivas (§4.3) | Baixo, mas depende de auditar SCG primeiro | Importante mas escopo ainda não mapeado (SCG é mock) |
| 9 | Responsividade mobile (§4.5) | Alto | Só se o negócio confirmar que é requisito |

## 6. O que esta spec **não** cobre (fora de escopo)
- Redesenho visual do zero (nova identidade, novo layout de sidebar) — o
  que existe hoje já é uma base decente, o problema é consistência, não a
  direção geral.
- Migração de biblioteca de componentes (ex.: trocar Tailwind puro por
  shadcn/ui, Radix, etc.) — decisão maior, precisa ser explicitamente
  pedida pelo usuário, não assumida aqui.
- Dark/light mode toggle — hoje é 100% dark, não há sinal de que light mode
  seja necessário.

## 7. Definition of Done (se esta spec for executada)
- [ ] Paleta semântica documentada (arquivo `src/theme.ts` ou similar) com
      mapeamento explícito papel→cor, referenciada por todas as páginas.
- [ ] `<Alert>` e `<EmptyState>` extraídos para `components/ui/`, adotados
      em SR/PR/PV/Dashboard (e novos módulos daqui pra frente).
- [ ] `Table` com suporte a footer; tabela inline de PR migrada.
- [ ] Sistema de toast substituindo os avisos fixos de confirmação.
- [ ] Botões icon-only com `aria-label`.
- [ ] Auditoria de contraste em textos `slate-500`/`slate-600` (ferramenta
      tipo axe DevTools ou Lighthouse, não estimativa).
- [ ] Páginas legadas (CGF, Auditoria, RET, Conciliação, SCG, PMPV)
      migradas para a paleta semântica ao serem reconstruídas com dados
      reais (não é retrabalho isolado — acontece junto com as tasks já
      existentes no `TASKS.md` de conectar cada módulo ao backend).
