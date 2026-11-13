# Resumo da semana — 06 a 13/11/2026

Fonte: `git log` do front (48 commits) e do back (29 commits) desde 06/11. Em uma frase: o sistema
ganhou **prova real em todas as contas**, o **Painel do Ciclo** passou a conferir com a planilha e
gerar o relatório do trimestre, a **regra do PR no SR** foi corrigida e o back foi **reorganizado**.

| Dia | Front | Back |
|---|---|---|
| **06/11** | Pasta por arrastar ou `.zip`; auditar a CGR mês a mês no Painel; menu Dashboard → PMPV → Painel; PR do trimestre preenchido sozinho no PMPV; paginação HeroUI; `AGENTS.md` e crítica de design | PR e PV regravados ao salvar Auditoria, CGF, RET ou RP; material de estudo em `docs/estudo` |
| **07/11** | — | Agentes Luiz e Daluz |
| **09/11** | Fórmula + prova real + histórico clicável em Auditoria, CGF, RPV, PMPV, RET e PV; card Composição da tarifa (MB e tarifa média); SR no Painel; Comparar com a planilha no Painel | Prova real de Auditoria, CGF, RPV, PMPV e RET; margem regulatória anual e tarifa média |
| **10/11** | Telas RP, SCG e SR com fórmula e prova real; "Está coerente"; Dashboard em círculos; texto do "Como funciona" | Prova real do RP, SCG e SR; histórico do SR |
| **11/11** | Aviso "Possível duplicata" com "Tirar do cálculo" (RP, RET, Auditoria); toasts de sucesso; comparar só pela pasta do ciclo; botão do relatório do trimestre em Word; Comparar antes do SR | Duplicata por valor; `.zip` do mês não vira empresa "Nota Fiscal"; relatório trimestral em Word |
| **12/11** | PMPV lembra as linhas ao trocar de página; SCG "gravado desatualizado"; textos amigáveis na Auditoria; toast único de erro no Processar; Dashboard mensal/trimestral/anual; relatório usa a planilha escolhida | Salvar módulo grava o SCG + reparo do histórico + SR automático; ano de 2 dígitos na pasta (`out-25`); **regra do PR no SR = trimestre do próprio mês**; campo `erros` nas rotas do ciclo; rota `planilha/conferir`; relatório com veredito, conferência e auditoria por empresa |
| **13/11** | **PMPV: a tabela acompanha o trimestre** com os dados salvos no banco (`163a860`) | **Repositório organizado** (`92d9a73`): docs em `docs/`, arquivos locais em `_local/`, `backups/`, `Excel/referencia/`; **`Src/Services` por etapa** (`tarifa`, `auditoria`, `cgf`, `ret`, `rp`, `apuracao`, `comparacao`); `ARCHITECTURE.md` reescrito; rota `GET /pmpv/sessao-do-trimestre` (`96df2e3`) |

**Problemas de dados achados e explicados na semana**
- **CGF de Out–Dez/2025 diferente da NT:** PMPV errado no banco (Out 1,9501 → certo 2,1502; Nov e Dez 2,1154). Corrigido no banco local; **no servidor ainda falta corrigir o de Out/2025**.
- **RP de Dez/2025:** falta o PDF da nota PFP de R$ 58.261,99 (linha 170 da aba "Verificação EAT - EC e PEN", "inserida a posteriori pela Copergás").
- **SR puxando o PR do trimestre anterior:** a regra antiga (3 meses antes) estava errada; corrigida em `d917c5a`.
- **PMPV mostrava as mesmas empresas em todo trimestre:** a tabela era por "Mês 1/2/3"; corrigido em `163a860`.

**Testes:** back com **835 testes passando** (13/11). Front: `tsc`, lint e build sem erro; a tela PMPV foi testada clicando num Chrome headless isolado. O `npm test` continua quebrado (`reading 'config'`).

**Ficou para a próxima semana:** conferir o deploy de `96df2e3` e `163a860`; corrigir no servidor o PMPV Out/2025, o SR Jul–Set/25 e os PRs Nov–Jan (−0,0210) e Fev–Abr (−0,0321); decidir as correções da revisão (bloquear "Salvar PR" sem SR, meses com ano nas telas PR e PV); quadro "Conferência do mês" (contagem de arquivos e alertas de valor fora do normal); abrir as telas do `.exe` depois da reorganização.

---

# Plano de 13/11/2026 (atualizado à tarde)

Pull do back feito: `main` em `b63e49e`, sem conflito. Ordem sugerida: 0 → 1 → 2; depois 3 e 4.

## Situação agora
- **Back no GitHub (main) desde 12/11:** `d917c5a` (regra do PR no SR + campo `erros` nas rotas do ciclo), `c616b86` (**fase B**: rota `/auditoria/planilha/conferir` e `notas_em_ambas`, que agora estão no GitHub), `847a180` / `a29b671` / `03de487` / `b63e49e` (relatório do trimestre em Word: veredito, quadro de conferência, auditoria por empresa, comparação com a planilha, modo escuro, sem −R$ 0,00), `f73d995` (dashboard: CGR por empresa mês a mês).
- **Front no GitHub:** `6b23152` (um só toast de erro no Processar, com o campo `erros` do back). Só falta commitar este `docs/plano.md`.
- **Fase B desbloqueada:** com a `c616b86` dá para seguir com as fases D e E.
- **Banco local:** PMPV de Out–Dez/2025 corrigido (Out 2,1502; Nov e Dez 2,1154), com cópia em `pmpv_data.backup_20261112_pmpv.db`. O `seed/pmpv_data.db` mudou só neste computador e **não vai para commit**.

## Regras confirmadas em 12–13/11
- **Trimestres:** a tarifa (PMPV, PR, PV) usa Nov–Jan, Fev–Abr, Mai–Jul e Ago–Out. A apuração (SCG, SR) usa trimestres civis (Jan–Mar…). O SR de um trimestre civil alimenta o PR do trimestre que começa 2 meses depois (SR Jul–Set/25 → PR Nov/25–Jan/26; SR Out–Dez/25 → PR Fev–Abr/26).
- **PR de cada mês no SR:** é o PR do trimestre da tarifa do **próprio mês**. A regra antiga (3 meses antes) estava errada e foi corrigida em `d917c5a`.
- **Ano nas chaves:** a tela PR usa o ano do **último** mês ("Nov–Jan/2026" = Nov/25–Jan/26). A tela PV usa o ano do **primeiro** mês ("Nov–Jan/2025" = Nov/25–Jan/26).
- **Valores da planilha (NT_05/2026):**
  - PR Mai–Jul/25 = 0,0292; Ago–Out/25 = 0,0116; Nov/25–Jan/26 = −0,0210; Fev–Abr/26 = −0,0321; Ago–Out/26 = 0,0135.
  - PV Nov/25–Jan/26 = 2,0944; PV Fev–Abr/26 = 1,9667.
- **RP Dez/2025:** a diferença é a nota PFP de R$ 58.261,99 (linha 170 da aba "Verificação EAT - EC e PEN", "inserida a posteriori pela Copergás"). O PDF dela não está na pasta.

## 0. Antes de tudo
- [ ] **Conferir o deploy** do back no Railway (`b63e49e`) e do front na Vercel (`6b23152`). Só então mover os cartões de "Em teste" para "Em produção".
- [ ] Commitar este `docs/plano.md`.
- [ ] Rodar `pytest` no back depois do pull (não foi rodado).

## 1. Dados do servidor (Leandro, no site, nesta ordem)
- [ ] PMPV de **Out/2025 → 2,1502** (no servidor ainda está 1,9501).
- [ ] SR **2025 › Jul–Set**: Jul com PR 0,0292, Ago e Set com 0,0116; total perto de R$ 98.775,10 → Salvar SR.
- [ ] PR **2026 › Nov–Jan** → Recalcular (−0,0210) → Salvar PR.
- [ ] Conferir na tela PV a linha **Nov–Jan/2025 = 2,0944**. Se não aparecer, gravar pela tela PV (PMPV 2,1154 + PR −0,0210).
- [ ] PR **2026 › Fev–Abr** → Recalcular (−0,0321) → Salvar PR.
- [ ] Pedir à Copergás o PDF da nota PFP de R$ 58.261,99 (RP Dez/2025).

## 2. Correções da revisão (Luiz, Hero e Jose), esperando OK do Leandro
**Críticas:**
- [ ] Bloquear **Salvar PR sem SR** do trimestre (hoje ele salva com SR = 0). (Recomendado.)
- [ ] `/pr/salvar` e `/sr/trimestre/salvar` aceitam 0 e valores que o servidor não conferiu: o servidor deve recalcular.
- [ ] `/pr/trimestral` ainda usa a fórmula antiga e o front ainda chama essa rota (`api/index.ts:343`).
- [ ] SR: a proposta fica velha (`SRDoTrimestre`), e trocar de trimestre rápido mistura os dados de um com os do outro.
- [ ] Desktop (`tela_sr.py`, `tela_pr.py`): usa a fórmula antiga e salva a cada tecla.

**Importantes:**
- [ ] Recalcular em cascata (PMPV → SR → PR → PV) quando um valor de base muda.
- [ ] PR com SELIC 0 sem avisar ninguém.
- [ ] Mostrar os meses com o ano nas telas PR e PV ("Nov/25 – Jan/26"). (Recomendado: resolve a confusão das duas convenções de ano.)
- [ ] Coluna "Meses" na tabela da tela PV (Hero).
- [ ] Pendências com link para a tela onde se resolve; observação no PMPV e no RP digitados à mão.
- [ ] O toast de erro junta as linhas com "\n" num item só; a divergência aparece em vermelho, como se fosse erro.
- [ ] Tipos do front diferentes do back (item I11 da revisão).

**Dados locais estranhos:** PR Fev–Abr/2026 = 0,0876 e Mai–Jul/2026 = 0; `cgf_resumo` Mai/2026 com `volume_final` = 100; SR Jan–Mar/26 com SELIC 0 e PRs antigos; períodos de lixo "Teste1", "Teste2" e "Geral".

## 3. Reparo do SCG em produção (pendente desde 12/11)
- [ ] `POST /api/scg/reparar-historico` **sem** `aplicar` (simulação); conferir Jul, Ago e Set com o Leandro.
- [ ] Jul: gravado −R$ 996.608,54 × calculado −R$ 1.477.928,41 (diferença R$ 481.319,87, no CGR ou no RP). Só aplicar com o OK dele.
- [ ] Copiar o banco do Railway antes de `aplicar=true`.

## 4. Quando der
- [ ] Decidir se o PR e o SR automáticos passam a **só avisar** em vez de sobrescrever o que já está salvo (preferência de 12/11: mostrar a prévia e pedir aprovação).
- [ ] Fases D (cards clicáveis, card "Batem") e E (toast real da planilha), agora que a B está no GitHub.
- [ ] Verificar no navegador (Chrome headless isolado): PMPV lembra o rascunho, SCG Ago sem R$ 0,00, hover do card vinho, toast de erro do Processar.
- [ ] Renomear as planilhas "Notas de Faturamento" do CGF de Jan, Fev, Abr e Mai/2025, ou ampliar `tipoPlanilhaCGF`.
- [ ] RET: `servicos_ret.py:88` ainda usa o ano de hoje quando não acha o ano no caminho.
- [ ] Limpar os períodos inválidos (`DELETE /api/periodos/{nome}`: simulação → cópia do banco → `?aplicar=true`).
- [ ] Corrigir o `npm test` (falha em todos os arquivos com `reading 'config'`).
- [ ] Teste ponta a ponta de Setembro e relatório de divergências (seções abaixo).

---

# Plano de 13/11/2026 — versão da manhã (registro)

- Commit e push de 12/11 feitos. Pasta SCG-25.1 organizada; duplicatas em `SCG-25.1 - duplicata fora do ciclo`.
- Bug do ano de 2 dígitos (`10 out-25` lido como 2026) corrigido em `782d5dd`.
- A seção "SR muda ao Recarregar do banco" desta versão usava valores errados (Fev–Abr = −0,0001; Nov–Jan = −0,0321). Os certos estão em "Regras confirmadas em 12–13/11", acima. A causa real era a regra de 3 meses antes, corrigida em `d917c5a`.

---

# Plano de 12/11/2026 (registro do que foi feito e do que ficou)

Resumo de hoje: Auditoria subiu antes do SR no Painel (front), e o back ganhou a rota
`/auditoria/planilha/conferir` e o campo `notas_em_ambas`. Spec completa em `SPEC_AUDITORIA_AMIGAVEL.md`.

## Histórico desde 01/11/2026 (onde estamos)

Fonte: `git log --since=2026-11-01` do front (49 commits) e do back (33 commits).
Em 01–02/11 não houve commits; tudo começa em 03/11.

| Dia | Front | Back |
|---|---|---|
| **03/11** | Tema escuro como padrão; valores mais legíveis (R$ menor, selos ✓/✗); `PRODUCT.md`; **Painel do Ciclo**: Auditoria CGR e RP dentro do "Processar"; PR/PV atualizados ao salvar SCG/SR | Documentação oficial (negócio, arquitetura, fórmulas, deploy); CGF com volume final de 2 casas; auditoria aponta **onde o CGR difere** do gravado; PR e PV regravados ao salvar SCG/SR |
| **04/11** | "Onde está a diferença" da Auditoria no Processar | Script que encurta nomes de nota com caminho acima de 260 caracteres |
| **05/11** | Painel lembra a pasta e a prévia ao recarregar; mapa da pasta lê só os nomes; aviso "conferir" antes de gravar | — |
| **06/11** | PV atualizado ao salvar PMPV/PR; **Auditar a CGR mês a mês**; pasta por arrastar ou `.zip` (sem aviso do Chrome); paginação HeroUI; menu Dashboard, PMPV, Ciclo; `AGENTS.md` e crítica de design | PR e PV regravados ao salvar Auditoria/CGF/RET/RP; PV regravado ao salvar PMPV/PR; material de estudo do back |
| **07/11** | — | Agentes Luiz (depois Choco) e Daluz adicionados |
| **09/11** | Fórmula + prova real + histórico clicável em Auditoria, CGF e RPV; prova real do PMPV; card de tarifa/margem; **SR no Painel**; tela PV; tela RET; "Comparar com a planilha" no Painel | Prova real de Auditoria/CGF/RPV, PMPV e RET; SR com PR de 3 meses antes; margem regulatória e tarifa média |
| **10/11** | Telas RP, SCG e SR (fórmula, prova real, histórico); "Está coerente" no lugar de "Está certo"; Dashboard em círculos; texto do "Como funciona" | Prova real de RP, SCG e SR; back dos serviços |
| **11/11** | Possível duplicata com "Tirar do cálculo" (RP, RET, Auditoria); toasts de sucesso no Ciclo e PMPV; comparar só pela pasta do ciclo; contadores clicáveis; relatório do trimestre em Word; **Auditoria antes do SR** (`b5537cc`) | Possível duplicata por valor; `.zip` do mês não vira empresa "Nota Fiscal"; relatório trimestral em Word |

Ainda **não commitado** (fase B de hoje, no back): rota `/auditoria/planilha/conferir`, campo
`notas_em_ambas` e `tests/test_api_auditoria_conferir.py`. O último commit do back é `8c86d00`.

Linha do tempo em uma frase: 03–06/11 montou o **Painel do Ciclo** (processar pela pasta);
09–10/11 deu a **prova real** a todas as contas; 11/11 trouxe **avisos, duplicatas e relatório**,
e agora entra a conferência da planilha. Setembro é o primeiro teste com tudo isso junto.

## Andamento de hoje (12/11/2026)

**Feito no front (fase C, sem commit ainda):**
- Selo do quadro: "Há divergências" virou "N pontos para conferir" (âmbar; vermelho só quando o total não fecha).
- Frase do topo: "As notas somam R$ X a menos/mais que a planilha."
- `Resumo.itens` agora é `{ texto, gravidade }` (`dinheiro` = vermelho, `conferir` = âmbar), com frases novas: "Faltam N notas da EMPRESA na pasta…", "…só o volume ou a alíquota foi escrito diferente. Não muda o total."
- Aviso "Nada foi gravado: isto é só uma conferência." no quadro; coluna "Diferença (notas − planilha)".
- Toast de `CompararPlanilha` no mesmo tom ("Set/2026: N pontos para conferir"); `OndeDifere` em `Processar.tsx` reescrito; texto do Comparar agora diz "Antes de seguir para o SR…".
- Arquivos: `comparacaoResumo.ts` (+ `.test.ts`), `ComparacaoPlanilha.tsx`, `CompararPlanilha.tsx`, `Processar.tsx`.
- Conferido: `tsc` sem erros; lint com os mesmos 21 erros de antes (nenhum novo).
- **Não conferido:** `npm test` falha em todos os 13 arquivos, também sem as mudanças ("Cannot read properties of undefined (reading 'config')"). Problema de ambiente do vitest a investigar; os testes de `comparacaoResumo.test.ts` foram atualizados mas não rodaram.

**Também feito hoje (sem commit):** o aviso "Possível duplicata" saiu da tela Auditoria CGR (`src/pages/Auditoria/ProvaReal.tsx`), a pedido do Leandro, porque o Painel do Ciclo já trata isso. RP e RET continuam com o aviso. A confirmar: o Painel não usa `AvisoPossivelDuplicata` em `Processar.tsx`; ver se há outro jeito de tratar duplicatas lá.

**Foco do dia (plano aprovado): PMPV persistente + SCG/SR automáticos.** Detalhes em `C:\Users\jose.demorais\.claude\plans\unified-forging-graham.md`.

| Item | O quê | Quem | Estado |
|---|---|---|---|
| A | Back: salvar CGR/CGF/RET/RP grava a coluna `scg` (`recalcular_scg`) + reparo do histórico | Luiz | em andamento |
| B | Back: SR do trimestre recalculado depois do SCG; com pendência nada é gravado | Luiz | em andamento |
| C | Front: tela SCG (botão "Salvar" destrava quando o `scg` cru difere; card mostra "não gravado" em vez de R$ 0,00) | Jose | em andamento |
| D | Front: PMPV lembra linhas e resultado ao trocar de página (IndexedDB, `src/utils/lembrar.ts`) | Jose | em andamento |

Diagnóstico (lido no código, ainda **não confirmado no banco**):
- **Ago/2026 com SCG 0,00:** a coluna `scg` crua nunca foi gravada. Só a tela SCG a grava; os outros módulos gravam só o RPV. A tabela mostra −R$ 511.536,40 porque recalcula na leitura.
- **Jul/2026 −R$ 996.608,54 gravado × −R$ 1.477.928,41 calculado:** CGF e RET são iguais nos dois lados; a diferença (R$ 481.319,87) está no CGR ou no RP (RP calculado −R$ 1.644.014,95). Fechar com uma consulta à coluna crua do banco antes de rodar o reparo.
- **Set/2026 "Nada a salvar":** a tela só compara os 4 campos já recalculados, nunca a coluna crua.

Antes de rodar o reparo em produção: confirmar com o Leandro, porque ele muda números gravados.

**Atenção — código fora do Git:** o Leandro diz que a fase C já está na Vercel, mas ela **não está no GitHub** (front em `8371a64`, back em `8c86d00`, fetch e pull sem novidades). Antes de commitar a versão desta máquina, achar a original (outro computador, ou deploy por CLI) e dar push, para não haver conflito.

**Bloqueado:**
- Fase B (rota `/auditoria/planilha/conferir` e `notas_em_ambas`): não existe no back deste computador, apesar de o plano marcar "feita". Sem ela não dá para fazer a fase E nem o card "Batem" (fase D).
- Seção 1 (teste de Setembro) e seção 3 (duplicatas): dependem de arquivos reais e de decisão do Leandro.

## 0. Antes de tudo (5 min)
- [ ] Confirmar que o **back foi commitado e está no ar** (o front novo depende dele). **12/11: não está no GitHub.**
- [ ] Ver se o commit do front `b5537cc` (ordem Comparar → SR) já está na Vercel.

## 1. Testar **Setembro/2026** de ponta a ponta (Leandro + José)
Objetivo: rodar o ciclo real de Set/2026 e anotar tudo que não bate.

| Passo | O que fazer | Onde |
|---|---|---|
| 1 | Trazer a pasta SCG-26 (arrastar ou .zip) e abrir o trimestre **Jul–Set** | Painel do Ciclo → Importar da pasta |
| 2 | Ler o mapa: setembro tem arquivos de Auditoria, CGF, RET e RP? Anotar o que "não achei" | Mapa da pasta |
| 3 | **Processar Jul a Set** e conferir a prévia antes de gravar | Processar |
| 4 | Escolher a planilha da Conta Gráfica e **Comparar Set** | Comparar com a planilha |
| 5 | Abrir a **Prova real de Set** em Auditoria, RET, RP, SCG e SR | telas de cada etapa |
| 6 | Anotar cada divergência na tabela da seção 2 | — |

Pergunta aberta: os arquivos de setembro já estão na pasta? Se não, este teste só dá para
fazer depois que a Copergás mandar as notas.

## 2. Relatório de divergências de Setembro
Formato: uma tabela por etapa, preenchida durante o teste.

| Etapa | Item (nota/empresa) | Valor nos arquivos | Valor na planilha | Diferença | Causa provável | O que fazer |
|---|---|---|---|---|---|---|
| Auditoria CGR | | | | | | |
| CGF | | | | | | |
| RET | | | | | | |
| RP | | | | | | |
| SCG | | | | | | |

Causas para classificar cada linha (ajuda a achar padrão):
1. Nota **só na planilha** (fornecedor não mandou) → candidata a "Incluir esta nota".
2. Nota **só nos arquivos** (não lançada na planilha).
3. **Mesma nota** lida com número ou empresa diferente (par automático).
4. Só **volume ou alíquota** difere, CGR igual (não muda o total).
5. **PDF não lido** (OCR) ou lido com erro.
6. **Possível duplicata** (mesmo valor, ver seção 3).
7. Arredondamento (até R$ 1).

Entrega: o relatório pode sair de duas formas, a decidir amanhã:
- **A)** preencher a tabela acima à mão e salvar como `RELATORIO_DIVERGENCIAS_SET26.md` (rápido).
- **B)** usar o botão **"Baixar relatório do trimestre"** (Word, já existe no Painel) e anexar o que ele trouxer.
  Conferir se ele já lista as divergências da Auditoria; se não, é o gancho para uma melhoria.

## 3. Aviso de "Possível duplicata" mais esperto (Choco → José)
Hoje o aviso dispara com mesmo tipo + mesma empresa + mesmo valor (`Src/common/duplicatas.py`).
Em Ago/2026 apareceu para 4 NF-e da GNlink (265, 255, 443, 444, R$ 102.449,60 no total) que
podem ser notas diferentes com o mesmo valor.

- [ ] **Leandro:** abrir esses 4 documentos e dizer se são cópias ou notas diferentes.
- [ ] **Choco:** ver quais campos o back já guarda por nota (data de emissão, volume, chave).
- [ ] **Decisão:** só avisar quando valor **e** (data ou volume) forem iguais? Ou manter o
  aviso e acrescentar nele a data e o volume de cada nota, para o analista decidir na hora?
  (A segunda opção é mais segura: não esconde nada e dá o contexto.)
- [ ] Se a decisão for mudar a regra: testes em `tests/` do back cobrindo "mesmo valor,
  datas diferentes" (não avisa) e "mesmo valor, mesma data" (avisa).

## 4. Fases da spec que continuam (SPEC_AUDITORIA_AMIGAVEL.md)
| Fase | O quê | Quem | Estado |
|---|---|---|---|
| A | Auditoria antes do SR | José | feita |
| B | Rota `planilha/conferir` + `notas_em_ambas` | Choco | dita "feita", mas **ausente do GitHub** (12/11) |
| C | Mensagens de diferença amigáveis | José | feita em 12/11 (falta commit e rodar `npm test`) |
| D | Cards clicáveis, toast com "Ver diferenças", card "Batem" | José | depois de C |
| E | Toast real da planilha + ✓/✗ nos meses | José | pode ir em paralelo com C |
| F | Revisar textos do back | Choco | depois de C |

Sugestão de ordem amanhã: **1 e 2 de manhã** (o teste de setembro mostra quais mensagens
mais precisam melhorar), **C + E à tarde**, **3** se sobrar tempo.

## 5. Pendências antigas (de 06/11, em `PROXIMOS_PASSOS.md`)
- [ ] Opcional: tirar o aviso do Chrome também das telas Auditoria/RET/RP.
- [ ] Opcional: Choco corrigir a rota `/auditoria/diferencas` que acessa o banco direto.
- [ ] Opcional: commitar `.claude/agents` do back.
- [ ] Opcional: investigar avisos do `npm audit` (pacote fflate).
- [ ] Plano da Daluz (organizar `src/pages/Ciclo`), ainda sem aprovação.

## Regras do dia
- O Leandro commita; Claude entrega os comandos prontos, **back e front em mensagens separadas**.
- Back vai para o ar antes do front.
- Nada é gravado em setembro sem o analista conferir a prévia.
