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
| **13/11** | **PMPV: a tabela acompanha o trimestre** com os dados salvos no banco (`163a860`); toast ao enviar a Memória de Cálculo (`fbd20e2`); **Salvar PR travado com pendências**, erros em várias linhas e chamada morta a `/pr/trimestral` removida (`ad570a8`) | **Repositório organizado** (`92d9a73`): docs em `docs/`, arquivos locais em `_local/`, `backups/`, `Excel/referencia/`; **`Src/Services` por etapa** (`tarifa`, `auditoria`, `cgf`, `ret`, `rp`, `apuracao`, `comparacao`); `ARCHITECTURE.md` reescrito; rota `GET /pmpv/sessao-do-trimestre` (`96df2e3`); **servidor recalcula PR e SR ao salvar e recusa dados zerados**, `/pr/trimestral` removida (`abf1074`) |

**Problemas de dados achados e explicados na semana**
- **CGF de Out–Dez/2025 diferente da NT:** PMPV errado no banco (Out 1,9501 → certo 2,1502; Nov e Dez 2,1154). Corrigido no banco local; **no servidor ainda falta corrigir o de Out/2025**.
- **RP de Dez/2025:** falta o PDF da nota PFP de R$ 58.261,99 (linha 170 da aba "Verificação EAT - EC e PEN", "inserida a posteriori pela Copergás").
- **SR puxando o PR do trimestre anterior:** a regra antiga (3 meses antes) estava errada; corrigida em `d917c5a`.
- **PMPV mostrava as mesmas empresas em todo trimestre:** a tabela era por "Mês 1/2/3"; corrigido em `163a860`.

**Testes:** back com **860 testes passando** (13/11, depois do `abf1074`). Front: `tsc`, lint e build sem erro; a tela PMPV foi testada clicando num Chrome headless isolado. O `npm test` continua quebrado (`reading 'config'`).

**Ficou para a próxima semana:** conferir o deploy de `96df2e3`, `abf1074`, `163a860`, `fbd20e2` e `ad570a8`; corrigir no servidor o PMPV Out/2025, o SR Jul–Set/25 e os PRs Nov–Jan (−0,0210) e Fev–Abr (−0,0321); decidir as correções da revisão que sobraram (meses com ano nas telas PR e PV, cascata, desktop); quadro "Conferência do mês" (contagem de arquivos e alertas de valor fora do normal); abrir as telas do `.exe` depois da reorganização.

---

# Andamento de 16/11/2026 (o que foi feito e o que está em curso)

Conferido em 16/11 contra o código: **nenhuma seção do plano de 13/11 existia**. Nesse dia o Luiz (back) e o Hero (front)
começaram a implementar em paralelo. Nada foi commitado; os commits ficam com o Leandro (back antes do front).
**Back concluído pelo Luiz (16/11):** seções 1, 2, 3, 5, 6, 7 e 8 e o ano do RET. `pytest -q`: **915 passando, 0 falhas** (eram 860).
**Front concluído pelo Hero (16/11):** etapas 1 e 2. `tsc` e `build` sem erro; `eslint src` com 0 problemas (o lint do projeto todo mantém os 21 erros antigos, só em `.heroui-docs` e `.claude`); **`npm test`: 14 arquivos e 188 testes passando** (eram 175, e o comando voltou a funcionar com `vitest.config.ts` e `pool: 'vmThreads'`).
- Feito: prévia da cascata (`PreviaCascata`, `usePreviaCascata`) em todos os Salvar; aviso de cascata pendente no Painel e no Dashboard; duplicata com número, valor, volume e vencimento; card "Conferência do mês"; seção "Alterações" (trilha) em SCG, SR, PV e PR; toast de erro em lista e divergência como aviso amarelo; coluna "Meses" na tela PV; tipos alinhados com o back; fases D e E (cards clicáveis, "Batem", toast com "Ver diferenças", ✓/✗ nos meses).
- **Não verificado:** nada foi visto no navegador nem rodado contra o back real. Falta o teste no Chrome headless isolado. O PV só aparece na trilha se a lógica de chaves do `pv_resultados` estiver certa; o Hero não confirmou.
- Pendente: marcar os itens das seções 1 a 8 como feitos depois do teste no navegador.

**"Como funciona" e visual (Hero, 16/11):** tela reorganizada em "O mês, passo a passo" (5 passos com botão), "Se algo não bater" (6 passos) e 6 abas HeroUI para consulta; textos atualizados (prévia e aprovação da cascata, SELIC 0% recusada, regra do PR no SR pelo próprio mês, Conferência do mês, Alterações, SR e PR fora do desktop); `DiagramaCiclo.tsx` removido. Passada de visual com a skill `design-taste-frontend` (só o que serve a sistema interno): botão único (`estilosBotao.ts`), card sobe 2px, alvos de toque de 44px em telas de toque, raio `rounded-lg` nos controles do Ciclo, PMPV e SR. `tsc`, `eslint src`, build e `npm test` (188) passam. Visto no Chrome headless isolado (dados fictícios): Como funciona, Painel do Ciclo e PMPV só com estado vazio. **Não visto:** Dashboard, SR, PR, PV, tema claro, celular, hover e troca de aba. Passos 2, 3 e 5 abrem `/ciclo`, pois a Conferência e a prévia pendente moram nele.

| Seção do plano | Quem | Estado em 16/11 |
|---|---|---|
| 1. PR recusa SELIC 0% | Luiz | editado (`servicos_pr.py`); teste em `test_pr_salvar_servidor.py` |
| 2. Cascata com prévia e aprovação (back) | Luiz | criados `servicos_cascata.py`, `routers/cascata.py`, `schemas/cascata.py`, `tests/test_cascata.py`; rotas de salvar ajustadas |
| 3. Duplicata com detalhes | Luiz | editado (`duplicatas.py`, schema, serviços de lote, `test_duplicatas.py`) |
| 4. Aprovação da cascata e duplicata (front) | Hero | criados `PreviaCascata.tsx`, `AvisoCascataPendente.tsx`, hooks; `AvisoPossivelDuplicata.tsx` editado |
| 5. Conferência do mês | Luiz e Hero | back: `/dashboard/conferencia` e `test_dashboard_conferencia.py`; front: `ConferenciaDoMes.tsx` no Painel do Ciclo |
| 6. Aposentar SR e PR do desktop | Luiz | editado (`main_dashboard.py`) |
| 7. Apagar um PR | Luiz | `DELETE /pr` em `routers/pr.py` e `tests/test_pr_apagar.py` |
| 8. Trilha de alterações | Luiz | `routers/trilha.py`, `servicos_trilha.py`, tabela em `database.py`, `tests/test_trilha.py`; falta a seção "Alterações" no front |
| 9. Dados (limpeza) | Leandro | **não feita de propósito**: só depois do deploy, com cópia do banco |

**Também em curso (front, Hero):** `vitest.config.ts` para consertar o `npm test`; toast de erro em itens; coluna "Meses" na tela PV;
alinhar tipos com o back; fases D e E da spec de Auditoria.
**Back, o que mudou (contrato para o front)**
- `GET /api/cascata/previa`, `GET /api/cascata/pendente`, `POST /api/cascata/aplicar`; campo `cascata` nos salvar (Auditoria, CGF, conciliação, RET, SCG, SR, PR, PMPV), com `pr_automatico` e `pv_automatico` mantidos com `atualizado=false`.
- **`POST /api/pmpv/mensal/{periodo}` deixou de ser 204** e agora devolve 200 com `{ cascata }`. O front não pode esperar corpo vazio.
- `detalhes` nas duplicatas; `GET /api/dashboard/conferencia`; `DELETE /api/pr` (simula sem `aplicar`); `GET /api/trilha`.
- Ano do RET: sem ano no caminho, o documento fica sem mês e o analista escolhe o período; nunca usa o ano de hoje. Corrigido de passagem o `` que escondia o ano em `JANEIRO_2026`.
- Desktop: SR e PR viraram "Em breve".

**Ressalvas do back**
- Cascata de vários trimestres seguidos: a prévia do 2º SR lê o PR velho gravado, e o `aplicar` grava em ordem. A resposta do `aplicar` mostra o que foi gravado de fato.
- `aplicar` grava SR, PR e PV em transações separadas; se algo mudar no meio, para com 422 e o já gravado fica.
- `/cascata/pendente` consulta o Banco Central para a SELIC e pode demorar se ele estiver fora do ar.
- Código antigo sem uso (`atualizar_dos_meses`, `atualizar_*_sem_falhar`, `atualizar_pv_do_pr`) pode ser removido pelo Bill depois do deploy do front.
- O `pmpv_data.db` da raiz ganhou a tabela vazia `historico_alteracoes` (0 linhas, nenhum dado mudou), criada quando algo abre o banco padrão sem `PLATAFORMA_DB`. `seed/pmpv_data.db` e `plataforma_pmpv.db` não foram tocados.
- Desktop não foi aberto para conferir os cards "Em breve".

**Ainda não feito**
- Seção "Alterações" (trilha) nas provas reais de SCG, SR, PR e PV.
- Conferir o contrato real das rotas do back contra o front.
- Rodar `pytest`, `tsc`, lint, build e `npm test`, e registrar aqui o resultado.
- Reorganizar a tela "Como funciona" (mais simples, com passo a passo; texto atualizado para a cascata) e passar o visual das telas com a skill `design-taste-frontend`, aproveitando só o que serve a um sistema interno.
- Investigar o SCG de Jul (R$ 481.319,87, só leitura) e preparar a limpeza de dados em simulação.

**Dependem do Leandro**
- Acertos no servidor: PMPV Out/2025 (2,1502), SR Jul–Set/25, PR Nov–Jan e Fev–Abr; PDF da nota PFP de R$ 58.261,99 com a Copergás.
- Deploy do back antes do front; conferir os cartões do Trello antes de mover para "Em produção".
- Decidir o `seed/pmpv_data.db`: está versionado no repositório público do back e foi alterado de novo em `7ab3b70`.
- Aplicar (ou não) o reparo do SCG e a limpeza de dados, depois de ver a simulação.

---

# Plano de implementação das decisões de 13/11

**Por quê:** hoje vários "Salvar" (Auditoria, CGF, RET, RP, SCG, SR, PR, PMPV) regravam SR, PR e PV sozinhos e em
silêncio (`Src/Services/tarifa/servicos_pr_automatico.py`). A decisão de 13/11 é que nada que vem depois seja
sobrescrito sem prévia e aprovação. Entram também: PR recusa SELIC 0%, aviso de duplicata com contexto, limpeza de
dados de teste, aposentar SR e PR do desktop, quadro "Conferência do mês" no Painel do Ciclo e trilha de alterações.

**Ordem:** 1 → 2 → 3 (back) → 4 (front) → 5, 6 e 7 em paralelo → 8 (trilha) → 9 (dados).
O Leandro faz os commits; o back vai para o ar antes do front.

## 1. PR recusa SELIC 0% (back, pequeno)
- [ ] `servicos_pr.py`, `apurar_trimestre`: se o mês tem SR salvo e `selic_mensal` = 0, acrescentar pendência.
  Reusar o texto do SR (`salvar_trimestre_conferido`): trimestre aberto → "ainda não fechou (fecha em …)";
  fechado → "Busque a SELIC do Banco Central ou digite-a à mão".
- [ ] Cobre de uma vez `POST /pr/salvar`, `POST /pr/apurar` e o PR automático.
- [ ] Teste em `tests/test_pr_salvar_servidor.py`: SELIC 0 → 422, nada gravado.

## 2. Cascata sem gravar: prévia e aprovação (back, o maior)
- [ ] `atualizar_sr_do_mes`, `atualizar_do_mes` e `_gravar_pv` ganham `gravar: bool = True`. Com `False`, calculam
  e devolvem o valor antes e o novo, sem escrever. A conta continua num lugar só.
- [ ] Corrigir o furo: ao gravar, `atualizar_sr_do_mes` passa a usar `salvar_trimestre_conferido`. Hoje usa
  `salvar_trimestre` e pula a recusa de PR, VP e SELIC zerados.
- [ ] Serviço novo `Src/Services/tarifa/servicos_cascata.py`:
  - `previa(periodos)` → por trimestre: `{trimestre_sr, sr_antes, sr_novo, chave_pr, pr_antes, pr_novo, pv_antes, pv_novo, desatualizado, pendencias[]}`.
  - `aplicar(periodos)` → recalcula de novo e grava SR → PR → PV. Nunca grava valores vindos da tela.
- [ ] Rotas novas em `Src/api/routers/cascata.py`:
  - `GET /cascata/previa?periodos=Jul/2026&periodos=Ago/2026`
  - `GET /cascata/pendente` → só os trimestres desatualizados, para o aviso geral.
  - `POST /cascata/aplicar {periodos}` → 422 com as pendências se houver alguma; nada gravado nesse caso.
- [ ] As rotas que hoje regravam em silêncio passam a só devolver a prévia no campo novo `cascata`:
  Auditoria (`salvar`, `remover-nota`, `incluir-nota`), CGF `salvar`, conciliação (`salvar`, `remover-nota`),
  RET (`salvar`, `remover-documento`), SCG `salvar`, SR `trimestre/salvar`, PR `salvar`, PMPV `salvar` e `mensal`.
- [ ] O salvar explícito continua gravando o próprio valor (Salvar PR grava o PR). Só o que vem depois vai para a prévia.
- [ ] Os campos antigos `pr_automatico` e `pv_automatico` ficam por um ciclo, sempre com `atualizado = false`,
  para o front antigo não quebrar. Remover depois do deploy do front.
- [ ] Testes novos em `tests/test_cascata.py`: a prévia não muda o banco; aplicar grava SR → PR → PV; aplicar com
  pendência → 422 sem gravar; salvar a Auditoria não muda mais `pr_resultados`. Ajustar `tests/test_pv_automatico.py`.

## 3. Duplicata com contexto (back)
- [ ] `Src/common/duplicatas.py` devolve também `detalhes: [{id, nome, numero, valor, volume?, vencimento?}]`.
  Volume vem de `auditoria_itens.volume_total`; vencimento de `ret_itens.data_vencimento`; RP só número e valor.
- [ ] Schema `Src/api/schemas/duplicatas.py` ganha `detalhes` opcional.
- A data de emissão lida do PDF fica para depois (decisão de 13/11).

## 4. Front: aprovação da cascata e aviso de duplicata
- [ ] Componente novo `src/components/ui/PreviaCascata.tsx` (HeroUI, consultar `.heroui-docs` antes): tabela
  Antes × Novo para SR, PR e PV, pendências em lista, botão **Aprovar e gravar** e toast.
- [ ] Mostrar depois de cada Salvar que devolva `cascata.desatualizado`, e num aviso no topo do Painel do Ciclo e do
  Dashboard usando `/cascata/pendente`.
- [ ] `src/api/index.ts` e tipos: `previaCascata`, `cascataPendente`, `aplicarCascata`.
- [ ] `AvisoPossivelDuplicata.tsx`: cada nota mostra número, valor e, quando houver, volume ou vencimento.

## 5. Conferência do mês no Painel do Ciclo
- [ ] Back: `GET /dashboard/conferencia?periodo=Set/2026` em `Src/api/dashboard_extra.py`. Reusar a consulta de
  empresas por mês sobre `auditoria_itens` e fazer a mesma sobre `ret_itens.empresa`.
  - Por etapa (CGR, CGF, RET, RP): `total`, `total_anterior`, `variacao_pct`, `fora_do_normal` (variação acima de 20%).
  - CGR e RET também trazem `empresas_faltando` (mandaram no mês anterior e não neste). CGF e RP: só a variação do total.
- [ ] Front: card "Conferência do mês" em `src/pages/Ciclo/index.tsx`, perto do Processar.
- [ ] Teste `tests/test_dashboard_conferencia.py`: empresa faltando; variação de 25% marca, de 15% não.

## 6. Aposentar SR e PR do desktop
- [ ] `Src/main_dashboard.py`: tirar os botões de SR e PR da barra lateral e pôr `"comando": None` nos dois cards
  (viram "Em breve"). `tela_sr.py` e `tela_pr.py` ficam no repositório, sem acesso pelo menu.

## 7. Apagar um PR (back, para a limpeza)
- [ ] `DELETE /pr?periodo=Fev - Abr/2026` no mesmo padrão de `DELETE /periodos`: sem `aplicar` só simula; com
  `aplicar=true` apaga a linha de `pr_resultados`. Teste simples.

## 8. Trilha de alterações
- [ ] Tabela nova `historico_alteracoes(id, tabela, periodo, campo, valor_antigo, valor_novo, origem, data_hora)`,
  sem identificar a pessoa.
- [ ] Gravar a linha nos métodos de salvar de `pr_resultados`, `sr_resultados`, `pv_resultados`, `consolidacao` e
  `pmpv_mensal`: ler o valor antigo antes de gravar e registrar só se mudou.
- [ ] `GET /trilha?periodo=&tabela=` e, no front, uma seção "Alterações" na prova real de SCG, SR, PR e PV.

## 9. Dados (depois do deploy, com cópia do banco antes)
- [ ] Local e servidor: apagar os períodos `Teste1`, `Teste2` e `Geral` (simulação → cópia → `?aplicar=true`).
- [ ] Local: apagar o PR de Fev–Abr/2026 e salvar o PR de novo. O servidor recalcula; o esperado é −0,0321.
- [ ] Reparo do SCG de julho: **não aplicar**. Levantar se a diferença de R$ 481.319,87 está no CGR ou no RP e levar ao analista.

## Verificação
- Back: `python -m pytest -q` (860 passando em 13/11) mais os testes novos de cada seção.
- Banco local: salvar a Auditoria de um mês e conferir que `pr_resultados` e `pv_resultados` não mudaram e que a
  resposta traz `cascata.desatualizado`. Aprovar pela tela e ver os valores gravados e a trilha registrada.
- Front: `npx tsc --noEmit`, lint e build. Testar Painel do Ciclo, SCG, PR e Prova real de RET e RP num Chrome
  headless isolado.
- Desktop: abrir o `main_dashboard.py` e ver SR e PR como "Em breve".

---

# Plano de 13/11/2026 (atualizado à tarde)

Pull do back feito: `main` em `b63e49e`, sem conflito. Ordem sugerida: 0 → 1 → 2; depois 3 e 4.

## Situação agora
- **Back no GitHub (main) desde 12/11:** `d917c5a` (regra do PR no SR + campo `erros` nas rotas do ciclo), `c616b86` (**fase B**: rota `/auditoria/planilha/conferir` e `notas_em_ambas`, que agora estão no GitHub), `847a180` / `a29b671` / `03de487` / `b63e49e` (relatório do trimestre em Word: veredito, quadro de conferência, auditoria por empresa, comparação com a planilha, modo escuro, sem −R$ 0,00), `f73d995` (dashboard: CGR por empresa mês a mês).
- **Back de 13/11 (11:59):** `abf1074`. O servidor refaz a conta ao salvar o PR e o SR e grava o valor dele, ignorando os números da tela. Recusa com 422, sem gravar nada, quando falta SR, SCG, VP ou PMPV, quando o PR ou o VP do mês é zero, ou quando a SELIC é 0%. A rota `/pr/trimestral` foi removida.
- **Front no GitHub:** `6b23152` (um só toast de erro no Processar, com o campo `erros` do back); de 13/11: `163a860` (PMPV por trimestre), `fbd20e2` (toast da Memória de Cálculo) e `ad570a8` (Salvar PR travado com pendências, erros em várias linhas, chamada a `/pr/trimestral` removida).
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
- [ ] **Conferir o deploy** do back no Railway (`abf1074`) e do front na Vercel (`ad570a8`). Só então mover os cartões de "Em teste" para "Em produção".
- [ ] Commitar este `docs/plano.md`.
- [x] Rodar `pytest` no back: 860 passando (13/11, depois do `abf1074`).

## 1. Dados do servidor (Leandro, no site, nesta ordem)
- [ ] PMPV de **Out/2025 → 2,1502** (no servidor ainda está 1,9501).
- [ ] SR **2025 › Jul–Set**: Jul com PR 0,0292, Ago e Set com 0,0116; total perto de R$ 98.775,10 → Salvar SR.
- [ ] PR **2026 › Nov–Jan** → Recalcular (−0,0210) → Salvar PR.
- [ ] Conferir na tela PV a linha **Nov–Jan/2025 = 2,0944**. Se não aparecer, gravar pela tela PV (PMPV 2,1154 + PR −0,0210).
- [ ] PR **2026 › Fev–Abr** → Recalcular (−0,0321) → Salvar PR.
- [ ] Pedir à Copergás o PDF da nota PFP de R$ 58.261,99 (RP Dez/2025).

## 2. Correções da revisão (Luiz, Hero e Jose), esperando OK do Leandro
**Críticas:**
- [x] Bloquear **Salvar PR sem SR** do trimestre. Feito em 13/11: o back recusa (`abf1074`) e o front trava o botão com as pendências (`ad570a8`).
- [x] `/pr/salvar` e `/sr/trimestre/salvar` agora recalculam no servidor e recusam PR, VP ou SELIC zerados (`abf1074`).
- [x] `/pr/trimestral` removida do back (`abf1074`) e a chamada saiu do front (`ad570a8`).
- [ ] SR: a proposta fica velha (`SRDoTrimestre`), e trocar de trimestre rápido mistura os dados de um com os do outro.
- [ ] Desktop (`tela_sr.py`, `tela_pr.py`): usa a fórmula antiga e salva a cada tecla.

**Importantes:**
- [ ] Recalcular em cascata (PMPV → SR → PR → PV) quando um valor de base muda.
- [ ] PR com SELIC 0 sem avisar ninguém.
- [x] ~~Mostrar os meses com o ano nas telas PR e PV~~. Decisão de 13/11: não fazer.
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
- [x] Decidido em 13/11: o PR e o SR automáticos passam a **só avisar** (ver seção 5).
- [ ] Fases D (cards clicáveis, card "Batem") e E (toast real da planilha), agora que a B está no GitHub.
- [ ] Verificar no navegador (Chrome headless isolado): PMPV lembra o rascunho, SCG Ago sem R$ 0,00, hover do card vinho, toast de erro do Processar.
- [ ] Renomear as planilhas "Notas de Faturamento" do CGF de Jan, Fev, Abr e Mai/2025, ou ampliar `tipoPlanilhaCGF`.
- [ ] RET: `servicos_ret.py:88` ainda usa o ano de hoje quando não acha o ano no caminho.
- [ ] Limpar os períodos inválidos (`DELETE /api/periodos/{nome}`: simulação → cópia do banco → `?aplicar=true`).
- [ ] Corrigir o `npm test` (falha em todos os arquivos com `reading 'config'`).
- [ ] Teste ponta a ponta de Setembro e relatório de divergências (seções abaixo).

## 5. Decisões do Leandro (13/11, tarde)
Respondidas em 13/11. Cada decisão vira uma tarefa abaixo dela.

**Regras de cálculo**
- **PR com SELIC 0%:** recusar, como no SR.
  - [ ] Back: `salvar_apurado` do PR recusa (422) quando algum mês tem SELIC 0%.
- **Cascata (PMPV → SR → PR → PV):** mostrar a prévia dos novos valores ao lado dos antigos e só gravar depois da aprovação.
  - [ ] Back: rota de prévia da cascata, sem gravar. Front: tela de aprovação.
- **PR e SR automáticos:** não sobrescrevem o valor salvo; só avisam que ele ficou desatualizado.
  - [ ] Back: trocar a regravação automática de PR, SR e PV (ao salvar módulos) por um aviso de "desatualizado".

**Dados e correções**
- **Reparo do SCG de Jul:** investigar e pedir ao analista para verificar. Não aplicar ainda.
  - [ ] Descobrir se a diferença de R$ 481.319,87 está no CGR ou no RP e levar ao analista.
- **NF-e GNlink de Ago/2026 (265, 255, 443, 444):** são notas diferentes; todas entram no cálculo.
- **Aviso de duplicata:** continua avisando por valor igual, mas mostra a data e o volume de cada nota.
  - [ ] Back: devolver data e volume das notas no aviso. Front: mostrar esses dados no aviso.
- **Limpeza:** apagar "Teste1", "Teste2", "Geral" e o PR local Fev–Abr/2026 = 0,0876, com cópia do banco antes.
  - [ ] Simulação → cópia do banco → `?aplicar=true`.
- **Setembro/2026:** os arquivos já chegaram. O teste de ponta a ponta (seção abaixo) pode ser feito.

**Uso no dia a dia**
- **App desktop:** aposentar as telas SR e PR do `.exe`.
  - [ ] Desativar `tela_sr.py` e `tela_pr.py` no menu do desktop.
- **Trilha de alterações:** registrar data, hora, valor antigo e valor novo, sem identificar a pessoa.
- **Relatório de divergências de Setembro:** usar o relatório do trimestre em Word e melhorar o que faltar nele.
- **Meses com ano nas telas PR e PV:** não fazer. Os nomes ficam como estão.
- **Conferência do mês:** avisar quando uma empresa que mandou arquivo no mês anterior não mandou neste.
- **Valor fora do normal:** marcar quando CGR, CGF, RET ou RP variar mais de **20%** em relação ao mês anterior.

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
