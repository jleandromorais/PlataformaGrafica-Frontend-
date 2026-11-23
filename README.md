# Plataforma Conta Gráfica ARPE — Site

Site (React) para apurar a **Conta Gráfica do gás canalizado** da Copergás, usado pelos analistas da **ARPE — Agência de Regulação de Pernambuco**.

- **Site em produção:** https://plataforma-grafica-frontend.vercel.app (a Vercel publica a branch `main`)
- **Acesso:** login com e-mail e senha
- **Back-end (API FastAPI):** repositório [plataforma-conta-grafica](https://github.com/jleandromorais/plataforma-conta-grafica)

## O que é

Substitui a digitação manual e a cópia de planilhas na rotina mensal da Conta Gráfica. O analista aponta a pasta de notas do trimestre, o sistema lê as notas (XML/PDF), calcula e mostra **de onde veio cada número**. Nada é gravado sem o analista conferir a prévia. No fim saem o **Excel Final** (visual da ARPE) e a **minuta da Nota Técnica** (Word).

**Todos os cálculos ficam no back-end.** Este repositório só mostra, envia arquivos e deixa o analista conferir antes de gravar.

## O ciclo: 9 passos e o fechamento

A tela inicial é o **Painel do Ciclo** (`/ciclo`). Ele mostra o trimestre, o estado de cada passo (feito, atenção, falta) com o motivo, e o botão **"Fazer agora"** abre a tela já no período certo. A lista dos passos está em `src/utils/etapasDoCiclo.ts`.

**Layout do Painel (duas colunas):** no alto, o trimestre (civil apurado e o do ciclo de PR/PV) e o contador de passos prontos; logo abaixo, a faixa do **Próximo passo** e, quando há algo a aprovar, a faixa de aprovação. Abaixo, a **trilha** à esquerda (um passo por linha: número, estado, sigla; cadeado = bloqueado, com o motivo ao passar o mouse; o próximo leva a etiqueta "Próximo") e, no fim dela, o bloco **Ao fechar** (tarifa média só leitura e entregas: minuta da NT, relatório, Excel Final). À direita fica o **passo aberto**: por padrão o próximo; passos 2 a 5 mostram "Processar a pasta" e "Comparar com a planilha"; SR, PR e PV mostram o cartão próprio de cada um. Os blocos de trabalho ficam montados e só escondidos ao trocar de passo, então pasta, prévia e planilha não se perdem. Links `?abrir=sr|pr|pv` abrem o passo e `?aprovar=1` rola até a aprovação. Abaixo de 1024px a trilha vira uma faixa horizontal rolável logo acima do passo aberto, e o "Ao fechar" desce para o fim. Código: `src/pages/Ciclo/index.tsx`, `passoSelecionado.ts` (qual passo abre) e `components/ui/useIrParaSecao.ts` (evento `ciclo:abrir-painel`).

| Fase | Passo | O que é |
|---|---|---|
| Preparar | 1. PMPV | Preço médio ponderado por volume dos meses apurados |
| Processar a pasta | 2. Auditoria CGR | NF-e/CT-e de compra (XML/PDF) comparadas com a planilha oficial |
| | 3. CGF | Volume faturado (planilhas de NF faturadas, canceladas e devolvidas) |
| | 4. RET | Encargos de transporte (PDFs; EAT + EC) |
| | 5. RP | Conciliação de receitas e despesas de penalidade |
| Trimestre | 6. SCG | Saldo da Conta Gráfica: `SCG = RPV + RET + RP` (com `RPV = CGR − CGF`, calculado sozinho) |
| | 7. SR | Saldo Remanescente, com a SELIC acumulada buscada no Banco Central |
| | 8. PR | Parcela de Recuperação (Quadro 7 da Nota Técnica) |
| | 9. PV | Preço de venda: `PV = PMPV + PR` (Quadro 8) |
| Fechar | Tarifa média | Fecha na tela do PMPV, depois que o PV do trimestre novo está gravado |
| | Entregas | Minuta da Nota Técnica, relatório do trimestre e Excel Final |

SR, PR e PV são gravados pelo Painel, cada um com a sua aprovação; as telas `/sr`, `/pr` e `/pv` são de consulta.

**Dois tipos de trimestre que nunca se misturam:**
- **Civil** (Jan–Mar, Abr–Jun, Jul–Set, Out–Dez): SCG, CGR, CGF, RET, RP e SR.
- **Do ciclo** (Nov–Jan, Fev–Abr, Mai–Jul, Ago–Out): PMPV, PR e PV.

O trimestre civil apurado define o PR 2 meses depois (ex.: Abr–Jun → Ago–Out). Regras em `src/utils/periodos.ts`.

## Telas

| Rota | Tela |
|---|---|
| `/ciclo` | Painel do Ciclo (início) |
| `/visao-geral` | Visão geral e evolução histórica |
| `/como-funciona` | Explicação dos passos e glossário de siglas |
| `/pmpv`, `/auditoria`, `/cgf`, `/ret`, `/conciliacao`, `/scg` | Passos 1 a 6 |
| `/rpv` | RPV (calculado sozinho) |
| `/sr`, `/pr`, `/pv` | Consulta de SR, PR e PV |
| `/excel-final` | Excel Final e minuta da Nota Técnica |
| `/login`, `/cadastro` | Acesso |

As telas aceitam o período no endereço: `?periodo=Mai/2026` (mensais) ou `?trimestre=Abr/2026` (1º mês do trimestre). Contrato em `src/utils/periodoNaUrl.ts`.

## Stack

React 19 · TypeScript 6 · Vite 8 · Tailwind 4 · HeroUI v3 · React Router 7 · Axios · Recharts · Vitest · ESLint. Tema escuro por padrão.

## Rodar no computador

Pré-requisitos: Node 22+ e a API rodando (ver o README do back-end).

```powershell
npm install
copy .env.example .env      # VITE_API_URL=http://localhost:8080/api
npm run dev                 # http://localhost:5173
```

Para subir **API e site juntos** (com uma cópia do banco, sem risco para os dados oficiais): `iniciar_web.bat` na pasta `Plataforma/`, um nível acima deste repositório. Com `-Real` usa o banco real.

## Comandos

| Comando | O que faz |
|---|---|
| `npm run dev` | Servidor de desenvolvimento |
| `npm run build` | Checagem de tipos (`tsc -b`) e build de produção |
| `npm test` | Testes (Vitest), roda uma vez e sai |
| `npm run lint` | ESLint |
| `npm run preview` | Serve o build local |

## Testes

```powershell
npm test
```

Vitest, em arquivos `*.test.ts` ao lado do código (33 arquivos, 382 testes em 23/11/2026). A lógica de decisão das telas fica em módulos puros e testáveis, por exemplo `src/pages/Ciclo/proximoPasso.ts`, `src/utils/periodos.ts` e `src/utils/pastaCiclo.ts`.

Antes de commitar: `npm run build`, `npm test` e `npm run lint`.

## Deploy

- **Vercel** publica a `main` sozinha (`vercel.json` reescreve todas as rotas para `index.html`).
- Variável na Vercel: `VITE_API_URL` = URL da API + `/api` (ex.: `https://SEU-BACK/api`).
- Na API, `CORS_ORIGINS` precisa incluir a URL do site.
- O site depende da API: quando os dois mudam juntos, publique o **back-end primeiro**.

## Estrutura de pastas

```
src/
├── api/          # client.ts (axios + mensagens de erro em pt-BR), index.ts (uma função por rota), auth.ts
├── auth/         # AuthContext, RequireAuth
├── components/   # layout/ (Layout, Sidebar, modulos.ts) e ui/ (Alert, Modal, Card, ...)
├── pages/        # uma pasta por tela; Ciclo/ tem o Painel e os cartões de SR, PR e PV
├── router/       # rotas
├── types/        # tipos das respostas da API (espelham os schemas do back)
└── utils/        # etapasDoCiclo, periodos, periodoNaUrl, pastaCiclo, format, glossario, siglas
docs/             # plano.md (andamento) e specs/ (uma spec por mudança de fluxo)
```

**Arquivos centrais** (mapa do código gerado com o graphify, `graphify-out/GRAPH_REPORT.md`, conferido no código): `utils/format.ts` (`brl()` e `num()`, usados em quase toda tela), `api/client.ts` (`mensagemDeErro()`), `pages/Ciclo/index.tsx` (`CicloPage`, o Painel), `pages/Ciclo/proximoPasso.ts` (qual é o próximo passo), `pages/PMPV/index.tsx` e `components/ui/` (`Button`, `Alert`).

Mais contexto: `PRODUCT.md` (para quem é e para quê), `docs/plano.md` (o que foi feito e o que falta) e `docs/specs/`.

## Contribuição

1. Branch a partir da `main`: `git checkout -b feat/minha-mudanca`
2. Rode build, testes e lint (acima).
3. Commits em português: `feat(sr): ...`, `fix(ciclo): ...`
