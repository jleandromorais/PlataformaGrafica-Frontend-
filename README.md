<div align="center">

<h1>Plataforma Conta Gráfica — Site</h1>

<p><strong>Telas web da apuração de Conta Gráfica do gás canalizado</strong><br/>
<em>ARPE — Agência de Regulação de Pernambuco</em></p>

<p>
  <img src="https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=black" alt="React"/>
  <img src="https://img.shields.io/badge/TypeScript-6-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript"/>
  <img src="https://img.shields.io/badge/Vite-8-646CFF?style=for-the-badge&logo=vite&logoColor=white" alt="Vite"/>
  <img src="https://img.shields.io/badge/Tailwind-4-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white" alt="Tailwind"/>
  <img src="https://img.shields.io/badge/Deploy-Vercel-000000?style=for-the-badge&logo=vercel&logoColor=white" alt="Vercel"/>
</p>

</div>

---

## 📋 Visão geral

Site em React que substitui o app desktop no dia a dia. Todos os cálculos ficam no backend — a **API FastAPI** do repositório [plataforma-conta-grafica](https://github.com/jleandromorais/plataforma-conta-grafica), publicada no Railway. Este repositório só exibe, envia arquivos e deixa o usuário conferir antes de gravar.

- **Site:** https://plataforma-grafica-frontend.vercel.app (publica a branch `main`)
- **Login:** e-mail e senha (token JWT guardado no navegador)

## 🧭 Telas

| Grupo | Tela | Rota | O que faz |
|---|---|---|---|
| Início | **Painel do Ciclo** | `/ciclo` | As 8 etapas do trimestre com ✅/⚠/◌ e o motivo de cada ⚠; "Fazer agora" abre a tela já no período certo; lê a pasta do ciclo (ex.: `SCG-26`) e mostra o que achou por etapa e mês |
| | Dashboard | `/` | Evolução histórica |
| | PMPV | `/pmpv` | Preço médio de venda e VP do trimestre |
| Conta Gráfica | Auditoria CGR | `/auditoria` | NF-e/CT-e de compra (XML/PDF) e comparação com a NT ou a planilha |
| | CGF | `/cgf` | Planilhas de NF faturadas, canceladas e devolvidas |
| | RPV | `/rpv` | `RPV = CGR − CGF` |
| | RET | `/ret` | PDFs de encargos de transporte (EAT + EC) |
| | RP — Conciliação | `/conciliacao` | Receitas (inclui TOP) e despesas de penalidade |
| | SCG | `/scg` | `SCG = RPV + RET + RP`, gravado × módulos |
| | SR | `/sr` | Quadro 6 do trimestre civil; **SELIC preenchida pelo Banco Central** |
| Consolidação | PR | `/pr` | Quadro 7 da Nota Técnica |
| | PV | `/pv` | Quadro 8: `PV = PMPV + PR` |
| Exportação | Excel Final | `/excel-final` | Excel no visual da ARPE e **minuta da Nota Técnica (.docx)** |

**Dois tipos de trimestre:** SCG/SR usam o civil (Jan–Mar, Abr–Jun…); PMPV/PR/PV usam o do setor (Nov–Jan, Fev–Abr, Mai–Jul, Ago–Out). O civil apurado define o PR 2 meses depois (Abr–Jun → Ago–Out).

**Período no endereço:** as telas aceitam `?periodo=Mai/2026` (mensais) ou `?trimestre=Abr/2026` (1º mês do trimestre), e com `?de=ciclo&ciclo=Abr/2026` mostram "Voltar ao Painel do Ciclo". Contrato em `src/utils/periodoNaUrl.ts`.

## 🚀 Rodar no computador

Pré-requisitos: Node 22+ e a API rodando (ver o README do backend).

```powershell
npm install
copy .env.example .env      # VITE_API_URL=http://localhost:8080/api
npm run dev                 # http://localhost:5173
```

Atalho para subir **API + site** juntos, com uma cópia do banco: `iniciar_web.bat` na pasta `Plataforma/` (um nível acima deste repositório).

| Comando | O que faz |
|---|---|
| `npm run dev` | Servidor de desenvolvimento |
| `npm run build` | Checagem de tipos (`tsc -b`) + build de produção |
| `npm test` | Testes (Vitest), roda uma vez e sai |
| `npm run lint` | ESLint |

## 🗂️ Estrutura

```
src/
├── api/            # client.ts (axios + mensagens de erro em pt-BR), index.ts (uma função por rota), auth.ts
├── auth/           # AuthContext, RequireAuth
├── components/     # layout/ (Layout, Sidebar, "Voltar ao Painel") e ui/ (Alert, Button, Card...)
├── pages/          # uma pasta por tela (Ciclo, SR, PR, PV, CGF, ...)
├── router/         # rotas
├── types/          # tipos das respostas da API
└── utils/          # periodos, periodoNaUrl, pastaCiclo (reconhecedor da pasta), format, glossario
```

**Mensagens de erro:** `mensagemDeErro(erro, padrão)` em `src/api/client.ts` gera "ação: motivo"; o detalhe técnico fica recolhido em "Detalhes técnicos" no `<Alert>`.

## 🧪 Testes

```powershell
npm test
```

- `src/utils/pastaCiclo.test.ts` — reconhecedor da pasta do ciclo: mês pelo nome, CGF pelo nome da planilha, "substituídas" e zips ignorados, avisos, mapa do trimestre, com nomes reais da `SCG-26` (só nomes, sem arquivos)
- `src/utils/periodos.test.ts` — período no endereço e trimestre civil → trimestre do PR

## ☁️ Deploy

- **Vercel** publica a `main` sozinha. Variável: `VITE_API_URL` = URL da API no Railway + `/api`.
- O trabalho é feito numa branch (`feat/...`) e vai para a `main` quando aprovado. Como o site depende da API, publique o **backend primeiro** quando os dois mudarem juntos.
- Na API (Railway), `CORS_ORIGINS` precisa incluir a URL do site.

## 🤝 Contribuição

1. Branch a partir da `main`: `git checkout -b feat/minha-mudanca`
2. Antes do commit: `npm run build`, `npm test` e `npm run lint`
3. Commits em português: `feat(sr): ...`, `fix(ciclo): ...`
4. As specs (BMAD) de cada história ficam anexadas ao cartão no Trello do projeto
