**21/11 — Spec `docs/specs/SPEC_FLUXO_UNICO.md` APROVADA (12 decisões, todas conforme a recomendação). Fase 1 feita (sem commit); faltam as fases 2 a 5.**

## Feito em 21/11 (Leandro CG, sem commit): FASE 1 do Fluxo único
- `/` agora redireciona para `/ciclo` (Painel do Ciclo é a página inicial; login e cadastro já mandavam para `/`). O Dashboard está em `/visao-geral`, nome "Visão geral", com o texto novo e o botão "Abrir o Painel do Ciclo" (`router/index.tsx`, `router/rotas.ts`, `Dashboard/index.tsx`).
- Menu na ordem de uso, sem números: Início (Painel, Como funciona) / Passos do trimestre (PMPV, Auditoria CGR, CGF, RET, RP, SCG, SR, PR, PV) / Consulta e entrega (Visão geral, RPV, Excel Final). Saíram os títulos "Conta Gráfica" e "Módulo 3" (`modulos.ts`).
- `proposito` de Auditoria, CGF, RET, RP e RPV corrigido (não diz mais "Leia"/"Salve"); as 5 `descricao` repetidas saíram das telas, a fonte é só `modulos.ts`.
- Estados vazios de Auditoria, CGF, RET e RP: "Nenhum {sigla} gravado ainda", o passo do Painel onde se grava e o botão "Abrir o Painel do Ciclo" (`components/ui/SemGravacaoAinda.tsx`). RPV: texto "calcula sozinho", sem botão.
- Bug 6a corrigido: a planilha escolhida no Painel vale só para o trimestre em que foi escolhida e é zerada ao trocar de trimestre (`Ciclo/planilhaDoTrimestre.ts`, 4 testes).
- Removidos 7 arquivos mortos (2.445 linhas): `pages/{Auditoria,CGF,RET,Conciliacao,SCG}/LeituraDoMes.tsx` e `pages/{RPV,SR}/EntradaManual.tsx`, mais os comentários que os citavam.
- Testes novos: `modulos.test.ts` (rotas, menu, textos) e `planilhaDoTrimestre.test.ts`. Vitest: 218 passam; `periodos.test.ts` continua sem rodar (react-router-dom, já falhava). `tsc -b`, `eslint src` e `vite build` limpos. Navegador NÃO verificado.
- **Falta:** fase 2 (`etapasDoCiclo.ts`, menu numerado, `PageHeader` "Passo N de 9" e setas com `?de=ciclo`, `rotulos.ts`, "Como funciona" com 4 fases e menção a "Módulo 3"), fase 3 (topo do Painel), fase 4 (confirmação ao gravar), fase 5 (PR/PV no Painel). Botão "Ler e gravar no Painel" no cabeçalho das telas de consulta entra com o `PageHeader` da fase 2.

## Feito em 21/11 (Leandro Dev, sem commit): dois achados da auditoria de UX
- **PMPV pelo Painel (bug confirmado):** a tela PMPV nunca lia `?ciclo=`; abria sempre no rascunho ou no trimestre do mês de hoje. O bloqueio "falta o PMPV do trimestre novo (Ago a Out)" e o passo "PMPV do trimestre apurado" caíam no mesmo lugar. Agora o link leva `?trimestre=Ago - Out&ano=2026` (`linkDoPMPV` e `trimestreDoPMPVNaUrl` em `utils/periodos.ts`, 12 testes em `periodosPMPV.test.ts`), o PMPV abre nesse trimestre (edições não salvas de outro trimestre ficam guardadas) e o botão diz "Abrir o PMPV de Ago a Out". O passo apurado abre no trimestre do ciclo do 1º mês que falta; a "Tarifa média" abre no trimestre novo.
- **Nome do SR:** o oficial é **Saldo Remanescente** (Nota Técnica, Quadro 6, Excel Final, planilha). "Saldo regulatório" removido de `PRODUCT.md`, do agente do back, de `repositories.py` e de `main_dashboard.py`.
- **Já falhava antes:** `src/utils/periodos.test.ts` não roda (react-router-dom em CommonJS no vitest); os testes dele (linkDoCiclo etc.) não executam.

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

# PLANO DE 17/11/2026 (terça-feira, no trabalho)

**Como usar:** é a lista do dia, na ordem. Os detalhes de cada item estão nas seções do dia 16/11 logo abaixo. Nada foi commitado por agente; o Leandro faz os commits (back antes do front).

## Adiantado em 16/11 (Luiz, back; sem commit): `pytest` 963 passando (eram 915)
- **Backup:** `scripts/backup_banco.py` (API de backup do sqlite3, valida com `integrity_check`, retenção de 30 cópias, `restaurar` recusa sobrescrever sem `--confirmo-sobrescrever`), `tests/test_backup.py` (14 testes), `docs/BACKUP.md` e cópia manual do banco local em `backups/pmpv_data_20261116_130438.db` (602.112 bytes, restauração testada). `backups/` já estava no `.gitignore`. **Falta:** decidir onde guardar a cópia **fora do servidor** (o volume do Railway só monta em um serviço, e uma cópia no mesmo `/data` não protege contra a perda do volume) e agendar.
- **`Dockerfile` e `.dockerignore` alterados** (não foi pedido): sem isso o script não existiria no Railway. **Muda a imagem no próximo deploy.** O Leandro pode desfazer.
- **Trava 409 e aprovação por etapa:** `POST /cascata/aplicar` aceita `ate = sr | pr | pv` e `esperado`; 409 se o valor mudou desde a prévia; SR grava sem o PMPV seguinte; PR exige SR salvo e PMPV novo; PV exige PR. Campos novos são opcionais (o front atual segue funcionando). 12 testes novos.
- **`GET /api/ciclo/situacao?trimestre=`:** estado por passo (`pronto`, `atencao`, `falta`, `bloqueado`), motivo, rota, SELIC fechada (exige `hoje > fim` e série do Banco Central até o último dia útil), PMPV novo e `proximo_passo`. 22 testes. Contrato em `docs/SITUACAO_DO_CICLO.md`.
- **Fora, por decisão ou dependência:** login com perfis e `aprovado_por` (dependem dos perfis aprovados); `GET /tarifa/media`; a regra do último dia útil só vale na situação, não em `selic_do_trimestre` (aplicar lá pode recusar um SR que hoje grava; decisão do Leandro); o passo 2 só confere se o SCG existe, não detecta divergência da soma (caso de Jul); o "último dia útil" só considera fim de semana, então em 31/12/2026 a situação pode ficar em `aguardando_publicacao` por causa do feriado.
- **Arquivos do back desta entrega:** `scripts/backup_banco.py`, `tests/test_backup.py`, `docs/BACKUP.md`, `Dockerfile`, `.dockerignore`, `servicos_cascata.py`, `servicos_pr_automatico.py`, `servicos_selic.py`, `servicos_ciclo.py`, `schemas/cascata.py`, `schemas/ciclo.py`, `routers/cascata.py`, `routers/ciclo.py`, `deps.py`, `main.py`, `tests/test_cascata.py`, `tests/test_ciclo_situacao.py`, `docs/SITUACAO_DO_CICLO.md`. Somam-se aos 49 do back de ontem, ainda sem commit.

## Adiantado em 16/11 (Hero, front; sem commit): `tsc`, `eslint src` e build sem erro; `npm test` 17 arquivos e 204 testes (eram 188)
- **Fatia A, as 21 edições:** o Hero leu o diff inteiro desde o `7d534f8`. São só trocas de `<button>` por `<Button>` do projeto e a prop `ref`; sem mudança de lógica nem de texto de cálculo. **Correção:** o `Button` não tinha `type="button"` por padrão e qualquer botão dentro de um formulário enviaria o formulário; agora tem (Login e Cadastro já passam `type="submit"`). Os botões mudam de aparência (por exemplo, os âmbar viram a variante `warning`).
- **Fatia B, trimestre sugerido em janeiro:** `trimestreSugerido.ts` com teste (jan, mar, abr, jul, out, dez). Em janeiro e março sugere Out–Dez do ano anterior.
- **Fatia C, SCG gravado × soma:** `DivergenciaSCG.tsx` mostra, só nos meses com `diverge`, a tabela "Soma dos módulos × Gravado × Diferença", o texto "o sistema não escolheu nenhum" e o link para o SCG; Skeleton ao carregar e "Tentar de novo" no erro. Tolerância de R$ 0,01, igual à do back.
- **Fatia D, próximo passo:** `proximoPasso.ts` (função pura, 8 testes). O próximo passo ganha borda, etiqueta "Próximo" e botão cheio; os bloqueados mostram "Bloqueado: falta ..." com link. Entraram dois passos: "PMPV do trimestre apurado" e "Tarifa média" (só link). O Painel faz 3 chamadas extras a `getPMPVMensal`. O PMPV ganhou o atalho "Voltar ao Ciclo". Para usar `GET /ciclo/situacao`, basta alimentar a mesma função com a resposta da rota.
- **Visto num Chrome isolado (API de mentira, dados fictícios):** Painel do Ciclo em escuro e claro a 1280px e 390px; o aviso do SCG; o estado de erro. Achou e corrigiu um aviso cortado no celular.
- **Não visto:** Auditoria, CGF, RET, RP, SR, SCG, RPV, PMPV e Excel Final no navegador; hover e foco dos botões trocados; o Skeleton do SCG; a barra "Voltar ao Ciclo" dentro do PMPV; tema escuro a 390px depois da correção; Painel com dados reais; contraste e teclado.
- **Fora:** passada de visual de Dashboard, SR, PR, PV, CGF, RET, RP e Auditoria; prévia da cascata aberta sozinha; os cartões SR, PR e PV dentro do Painel; SR automático; tarifa média com valores (dependem do back).

## 1. Primeiro, no começo do dia (Leandro, ~30 min)
- [ ] `git status` no back e no front, para ver que nada se perdeu desde ontem.
- [x] **Back de ontem já enviado** (commit `0f3f65e`: cascata, trilha, conferência, DELETE /pr, SELIC 0%, ano do RET). `main` local igual à do GitHub em 16/11. **Falta conferir o deploy do Railway** e abrir o Painel do Ciclo no site.
- [ ] **Commitar e enviar o back de hoje** (backup, trava 409 e aprovação por etapa, situação do ciclo, `Dockerfile` e `.dockerignore`): mensagem e comandos abaixo, na seção "Commits prontos".
- [ ] **Commitar e enviar o front de hoje** (21 edições validadas, trimestre em janeiro, SCG divergente, próximo passo): só depois do deploy do back.
- [ ] **Só depois** conferir o front no ar (a Vercel já recebeu o `7d534f8` ontem; ele chama rotas que só existem no back novo).
- [ ] **Nesta ordem:** o deploy do back precisa estar verde antes de qualquer teste do front.
- [ ] Mover no Trello os cartões [Cascata], [Conferência] e [Trilha] para "Em teste" depois do push; "Em produção" só depois de conferir o deploy.

## Verificado por mim em 17/11, 08:02 (antes dos commits)
- **Back:** `python -m pytest -q`: **963 passando**, 2 avisos, 3 min 15 s.
- **Front:** `npx tsc --noEmit` sem erro; `npx eslint src` sem avisos; `npm test`: **17 arquivos e 207 testes passando** (o Hero acrescentou 3 depois do relatório de ontem).
- **Pendentes de commit:** back 18 arquivos, front 34. Nada foi enviado durante a noite.

## Commits prontos (Leandro roda; sem co-autor)
**Back** (`plataforma-conta-grafica`), primeiro:
```powershell
git pull
git add -A
git commit -m "feat(ciclo): backup do banco, trava 409 e aprovacao por etapa, situacao do ciclo" -m "- scripts/backup_banco.py: copia pela API de backup do sqlite3, valida com integrity_check, retencao de 30 copias e restauracao que nao sobrescreve sem confirmacao (14 testes, docs/BACKUP.md)
- POST /cascata/aplicar aceita ate (sr|pr|pv) e esperado; 409 se o valor mudou desde a previa; SR grava sem o PMPV seguinte, PR exige SR e PMPV novo, PV exige PR
- GET /ciclo/situacao: estado por passo, motivo, SELIC fechada (exige serie do Banco Central ate o ultimo dia util) e proximo passo (docs/SITUACAO_DO_CICLO.md)
- Dockerfile e .dockerignore: incluem o script de backup na imagem
- Testes: 963 passando"
git push
```
**Front** (`Front_end`), só depois de o deploy do back estar verde:
```powershell
git pull
git add -A
git commit -m "feat(ciclo): proximo passo em destaque, SCG divergente, trimestre sugerido e botao unico" -m "- Painel do Ciclo destaca o proximo passo, bloqueia com motivo e link e ganha os passos PMPV e tarifa media
- SCG gravado x soma dos modulos lado a lado quando diverge, sem escolher
- Trimestre sugerido em janeiro corrigido (Out-Dez do ano anterior)
- Button com type=button por padrao; troca dos botoes soltos pelo componente do projeto
- Atalho Voltar ao Ciclo no PMPV
- Testes: 207 passando; plano.md atualizado"
git push
```
**Antes de rodar o do back:** o `Dockerfile` muda a imagem no próximo deploy; se não quiser agora, `git restore Dockerfile .dockerignore` antes do `git add -A`. A pasta `backups/` já está no `.gitignore`.

## 2. Prioridade máxima: backup do banco (Luiz)
- [ ] Cópia diária do SQLite do Railway para fora do servidor, com data no nome e retenção (por exemplo, 30 dias).
- [ ] **Testar a restauração** em uma cópia, antes de dizer que está pronto.
- [ ] Cópia manual **agora**, antes de qualquer gravação nova: o banco do Railway é hoje a única cópia.
- [ ] Decidir com o Leandro onde guardar (Railway, bucket na nuvem ou pasta da empresa) e se vale avaliar Postgres.

## 3. Em seguida, em paralelo
**Back (Luiz)**
- [ ] Trava **409** no `aplicar` e `aplicar` por etapa (`ate = sr | pr | pv`), com aprovações **separadas** (decidido).
- [ ] `GET /ciclo/situacao` (estado por passo, motivo, link, SELIC fechada, PMPV novo pronto).
- [ ] Login com **perfis** e `aprovado_por` obrigatório na trilha (depende de desenhar os perfis, ver item 5).
**Front (Hero)**
- [ ] **Validar as 21 edições** de ontem: `npx tsc --noEmit`, `npx eslint src`, `npm run build`, `npm test` e abrir as telas num Chrome isolado (tema escuro e claro, 1280px e 390px).
- [ ] Corrigir o trimestre sugerido em **janeiro** e destacar o **próximo passo** no Ciclo (maior dor do Leandro).
- [ ] Mostrar **SCG gravado × soma dos módulos** quando divergir (maior dor: números que não batem com a planilha).

## 4. Amanda (só analisa)
- [ ] Desenhar os **perfis** (quem processa, quem aprova SR, PR e PV, quem só consulta, quem faz a revisão do analista) e o passo de **revisão antes de fechar o trimestre**.
- [ ] Corrigir `docs/regras-de-calculo.md` (linhas 85–86), `SPEC_PR.md`, `SPEC_SR.md` e a docstring de `servicos_pr_automatico.py`.

## 5. Para levar ao analista humano (trabalho)
- [ ] De onde vem o **SR anterior** de cada mês e se ele entra no SCG.
- [ ] O que define um **PR "em vigor"** e como a ARPE trata correção retroativa.
- [ ] Qual **MB** vale para Dez e Jan do Nov–Jan (compare PV 2,0944 com a tarifa média do Quadro 9 da NT_05/2026).
- [ ] Se o limite de **20%** está certo, e se é relativo ou absoluto.
- [ ] Quais **perfis** existem e quem faz a revisão antes de fechar o trimestre.
- [ ] **Setembro/2026:** os arquivos já chegaram; é o primeiro teste de ponta a ponta com tudo isso (Trello: "Fechar o 3º trimestre").

## 6. Fica para depois de 17/11
- SR, PR e PV como cartões dentro do Painel (Etapa 4) e "Aprovar em sequência".
- Limpeza de dados (Teste1, Teste2, Geral e o PR local Fev–Abr/2026): só depois do deploy e **com cópia do banco** (o backup do item 2 vem antes).
- Reparo do SCG de Julho (R$ 481.319,87): só depois de o analista explicar a diferença. Não aplicar.
- Decisão sobre o `seed/pmpv_data.db` (mantido por enquanto; o risco continua registrado).

## 7. Atenção
- **Não gravar nada novo em produção antes do backup** (item 2).
- **Back antes do front**, sempre.
- Nenhum agente faz commit; o Leandro roda os comandos.
- A Amanda dá parecer, mas a regra de negócio só vale depois de o analista confirmar.

---

# Parecer da Amanda: perfis, revisão e pacote de aprovação (16/11/2026, recomendações)

**Parecer geral dela: maturidade 6,5 de 10.** O motor de cálculo está bem pensado (fonte única, prova real, cascata com aprovação), mas ainda não é uma ferramenta de controle: sem backup, a trilha não diz quem fez, não há perfis e a validação contra a planilha é irregular. Também apontou: VP, SELIC e notas fora da trilha, o câmbio fixo de 6,0 em `servicos_ret.py:7` sem origem documentada e a falta de versão da regra nos resultados.

## Achados novos
1. **Cadastro aberto por padrão** (`auth.py:49-50`, `PERMITIR_CADASTRO` padrão "1"). Conferir no Railway se está `PERMITIR_CADASTRO=0`. Fechar antes de falar em perfis.
2. **Contradição no plano:** "aprovado por obrigatório" (login com perfis) × "se a aprovação deve identificar a pessoa" como não bloqueante. Vale o login com perfis; o analista confirma. O comentário "Não guarda quem mudou" em `database.py:344` fica desatualizado.
3. **Luiz deve confirmar:** `servicos_consolidacao.py:46-49` devolve a soma dos módulos quando o SCG gravado difere, então o PR provavelmente já usa a soma. Isso conflita com a escolha "gravado ou soma" da tela SCG.
4. **`pr_resultados` não guarda rastro:** só `scg` (já com SELIC), `sr`, `vp` e `pr`. Falta SELIC, SCG de cada mês, origem do VP e versão da regra.
5. **A trilha de hoje é fraca para auditoria:** só valores numéricos, cinco tabelas, sem quem, sem motivo e sem os insumos do SR.

## Perfis propostos (uma pessoa pode ter mais de um)
Consulta (só lê); Operador (processa a pasta e grava módulos); Aprovador (aprova SR, PR e PV); Analista (revisa e fecha o trimestre; decide SCG gravado × soma, SR anterior, MB e SELIC manual, sempre com motivo); Administrador (usuários, apagar período, limpar dados de teste, restaurar backup).

| Ação | Consulta | Operador | Aprovador | Analista | Admin |
|---|---|---|---|---|---|
| Ver telas, provas reais e trilha | S | S | S | S | S |
| Processar a pasta e gravar módulo | N | S | N | S | S |
| Escolher SCG gravado × soma, SR anterior, SELIC manual, MB (com motivo) | N | N | N | S | N |
| Aprovar SR, PR e PV (cada uma) | N | N | S | S | N |
| Revisar e fechar o trimestre | N | N | N | S | N |
| Apagar PR, período ou SCG; limpar dados de teste | N | N | N | N | S |
| Reparar histórico do SCG | N | N | N | condicional | S |
| Gerar relatório oficial do trimestre | N | N | condicional | S | S |
| Gerenciar usuários, perfis e backup | N | N | N | N | S |

**Regras de separação (recomendações):** quem processou pode aprovar, porque a equipe é pequena, mas a trilha marca "mesma pessoa processou e aprovou"; a marca "conferido" só vale de quem tem perfil Analista; o perfil é lido do banco a cada requisição, não do token; usuário novo nasce sem acesso ou como Consulta, e o Administrador cria as contas e fecha o autocadastro.
**A trilha passa a registrar:** `usuario_id`, nome e e-mail copiados na hora, `perfil`, `acao`, `motivo`, `pacote_id` e `regra_versao`. Textos, motivos e escolhas vão para uma tabela nova `aprovacoes`.

## Passo de revisão do analista antes de fechar o trimestre
**Confere:** módulos por mês (planilha × sistema); SCG gravado × soma; SR com VP, VF, PR de origem, SELIC e SR anterior; PR (Quadro 7); PV (Quadro 8); tarifa média (Quadro 9, só leitura); pendências abertas.
**Tela:** tabela "Sistema × Planilha × NT × Diferença". A NT o analista cola; o sistema só calcula a diferença. Se algo for regravado depois, a marca "conferido" cai e volta "Conferir de novo".
**Bloqueia o fechamento:** SR, PR ou PV não aprovados; cascata pendente; PMPV novo ausente, SELIC 0% ou parcial; prova real com falha; SCG ≠ soma sem escolha e motivo; 409; revisão por quem não é Analista.
**Exige motivo:** diferença acima da tolerância; MB diferente entre Dez e Jan; PR em vigor sendo mudado.
**Só avisa:** variação do PR acima de 20% ou troca de sinal; duplicata não resolvida; mesma pessoa processou e aprovou; revisão sem planilha.
**Tolerância proposta (a confirmar):** 4 casas para PR, PV e tarifa; R$ 0,01 para valores em reais.
**Registra ao marcar "conferido":** quem, quando, perfil, versão da regra; trimestres; planilha e NT usadas; valor do sistema, da fonte, diferença e motivo por item; escolha de SCG por mês; MB de cada ano; hash dos valores vistos.

## Pacote de aprovação e versão da regra
**Congelar na aprovação do PR:** chave e meses; por mês o SCG usado (qual e quanto), a SELIC e sua fonte, o SR com SELIC e o `sr_anterior`; VP dos 3 meses com a origem; PMPV; resultado; PR anterior e variação; marcas "Conferi a variação" e "em vigor" com motivo; versão da regra, quem, quando e hash. SR e PV congelam o equivalente.
**Onde:** tabela `aprovacoes` (etapa, chave, usuário, perfil, data, `regra_versao`, `pacote_json`, `pacote_hash`, situação). O 409 compara o pacote visto com o recalculado, e não só o resultado.
**Trilha ampliada:** `sr_trimestre`, `vp_mensal`, `cgf_resumo`, `config` e as tabelas de itens (`auditoria_itens`, `ret_itens`, `concilia_itens`), mais os apagamentos (só o PR é anotado hoje).
**Versão da regra:** constante `REGRA_VERSAO` e "Histórico de regras" na documentação; coluna `regra_versao` em `sr_trimestre`, `sr_resultados`, `pr_resultados` e `pv_resultados`. v1 = "PR do SR = 3 meses antes" (errada); v2 = "PR do SR = trimestre da tarifa do próprio mês" (corrigida em `d917c5a`). Linhas antigas ficam "v1" ou "versão desconhecida", com o aviso "refazer pelo Ciclo". A fronteira é a data em que o back corrigido entrou no ar, que o Leandro confirma. **Nunca corrigir sozinho:** a correção passa pela cascata com prévia e aprovação.

## Documentação já corrigida em 16/11
- `docs/regras-de-calculo.md` (linhas 85 e 86): salvar não grava mais em silêncio; prévia e aprovação.
- `SPEC_PR.md` e `SPEC_SR.md`: aviso de "documento histórico" no topo, com a fórmula e as rotas atuais.
- **Falta (depois que o Luiz terminar, para não colidir no código):** docstrings de `servicos_pr_automatico.py` (linhas 1–13) e de `ServicosPR` (que ainda diz `PR = (SGR + SR) / VP`); remover `buscar_dados_trimestral` (Bill).

## PERGUNTAS PARA O ANALISTA (para imprimir; as que travam a programação são 1, 2, 9, 14 e 15)
1. **SR anterior:** de onde sai a coluna "SR anterior" na aba SR da NT_05/2026 (por exemplo, Jul–Set/25)? Ele entra no SCG? ______
2. **PR em vigor:** o que define um PR em vigor (1º mês do trimestre ou outra data)? Já houve correção retroativa? Regravar ou lançar como ajuste no seguinte? ______
3. **MB de Dez e Jan:** qual MB vale para Dez/25 e Jan/26? O PV de Nov/25–Jan/26 é 2,0944; qual é a tarifa média do Quadro 9? Existe tarifa média única por trimestre? ______
4. **Limite de 20%:** está certo? É relativo ou absoluto? Existe faixa aceitável? ______
5. **Câmbio fixo 6,0 (`servicos_ret.py:7`):** quem definiu, quando e com que fonte? Vale para todos os meses? A nota em euro traz a própria taxa? ______
6. **SCG de Jul (R$ 481.319,87):** de onde vem a diferença e qual valor vale? ______
7. **Nota PFP de Dez/2025 (R$ 58.261,99):** o PDF existe? Entra no RP de Dez/25? ______
8. **SELIC:** quando o Banco Central publica a do último dia do trimestre? A ARPE aceita SELIC digitada à mão, e em que caso? ______
9. **Revisão antes de fechar:** quem faz hoje e quem deveria fazer? ______
10. **Fontes da revisão:** compara com a planilha, com a NT ou com as duas? Sem planilha, pode fechar? ______
11. **Diferença aceitável** entre sistema e planilha ou NT, em PR, PV, tarifa (R$/m³) e valores em reais. ______
12. **Quadros da NT** que precisam bater para fechar (7, 8 e 9). ______
13. **Pacote de aprovação:** a ARPE exige só data e valores ou o nome da pessoa? Quanto tempo se guarda o registro? ______
14. **Quem é quem:** quantas pessoas e que papel: processa a pasta, aprova SR, aprova PR e PV, só consulta, faz a revisão. ______
15. **Mesma pessoa:** quem processou pode aprovar? Quem aprovou pode fechar o trimestre? ______
16. **Cadastro:** contas só por um administrador? Quem? ______
17. **Apagar e limpar:** quem pode apagar período, PR ou limpar dados de teste? ______

**Dúvidas abertas por pessoa:** Leandro confirma `PERMITIR_CADASTRO=0` no Railway, a data do deploy do `d917c5a` e a contradição do "aprovado por". Luiz confirma se a escolha "gravado × soma" chega ao PR e se `DELETE /periodos` e `DELETE /scg` entram na trilha.

---

# PLANO DE EXECUÇÃO — 16/11/2026 (consolida as seções abaixo; nada começa sem OK do Leandro)

**Objetivo:** ciclo mais didático e mais automático, em 5 passos no Painel do Ciclo: (1) PMPV do trimestre anterior; (2) processar a pasta, com SCG automático e prova real; (3) SR calculado sozinho quando a SELIC fecha; (4) PR e PV como conferência; (5) tarifa média, fechada no PMPV. **Gravar continua com aprovação.**
**Equipe:** Luiz (back), Hero (front, com a skill `design-taste-frontend`), Amanda (regra e teoria, só analisa), Bill (limpeza depois), Leandro (decide, faz commits; back antes do front).
**Detalhes de cada decisão:** seções "Plano de automação", "Roteiro do Ciclo em 5 passos", "Decisões da Amanda", "Plano de visual do front" e "Andamento de 16/11", logo abaixo.

## Decisões do Leandro em 16/11 (respostas às perguntas de qualidade)
- **Aprovação do PR e do PV: separadas.** Cada uma com o seu botão; o PR com a caixa "Conferi a variação". Fecha a pergunta 6 da Amanda.
- **As 21 edições do Hero ficam:** o Hero roda `tsc`, lint, build e testes e confere no navegador antes de qualquer commit.
- **`seed/pmpv_data.db`: manter por enquanto** no repositório público do back. Risco registrado: dados reais da empresa continuam visíveis no histórico. Reabrir quando o Leandro decidir.
- **Usuários: de 2 a 5 pessoas, com papéis diferentes** (por exemplo, quem processa a pasta e quem aprova SR, PR e PV). **Conflita com a decisão de 13/11** de a trilha não identificar a pessoa: com papéis diferentes, o campo "aprovado por" deixa de ser opcional e pede login por perfil. A Amanda deve confirmar com o analista antes de programar.

- **Acesso: login com perfis.** Cada pessoa entra com e-mail e senha e o perfil define quem processa e quem aprova; a trilha registra quem aprovou. Fecha a dúvida do "aprovado por": passa a ser obrigatório. Falta desenhar os perfis com o analista.
- **Backup: não existe.** O banco SQLite do Railway é a única cópia. **Prioridade máxima, antes de novas automações.**
- **Validação contra a planilha: "o analista às vezes, ninguém às vezes".** Não há revisão fixa. Proposta: o sistema exige a revisão do analista (comparar com a planilha e a NT) antes de fechar o trimestre.
- **Maiores dores hoje:** saber qual é o próximo passo, e números que não batem com a planilha. Isso confirma a ordem do plano: situação do ciclo e próximo passo primeiro, e prova real e alertas de divergência em seguida.

## Ajuste de prioridade (por causa das respostas)
1. **Backup automático do banco** (Etapa 0, antes da Etapa 1): cópia diária fora do servidor, teste de restauração e retenção; avaliar Postgres no Railway (cartão `[Banco] backup e avaliar Postgres`).
2. **Login com perfis e "aprovado por" obrigatório** na trilha, junto com a trava 409 do `aplicar` (a aprovação passa a registrar quem e o quê viu).
3. **Revisão do analista antes de fechar o trimestre:** passo de fechamento exige a marca "conferido com a planilha/NT" por quem tem perfil de analista.
4. Depois, o que já estava no plano (situação do ciclo, próximo passo em destaque, processar ao escolher a pasta).

## Estado hoje
- **Feito e verificado:** plano de 13/11 inteiro, back 915 testes passando; front `tsc`, `eslint src`, build e `npm test` (188) passando; Como funciona reorganizado. **Não visto no navegador:** Dashboard, SR, PR, PV, tema claro, celular, hover.
- **Front:** commit `7d534f8` já está no GitHub. **Back:** continua **sem commit**, então o front no ar chama rotas que o servidor ainda não tem.
- **Pendente de decisão:** 21 arquivos editados pelo Hero depois do `7d534f8` (parada no meio, sem `tsc` nem testes rodados).

## Etapa 0: higiene (Leandro, antes de programar mais)
- [ ] Commitar e enviar o **back** (comandos já passados), esperar o deploy do Railway e conferir o Painel do Ciclo.
- [ ] Decidir as **21 edições** do Hero: manter (o Hero roda `tsc`, lint, build e testes) ou desfazer com `git checkout -- src` em `Front_end`.
- [ ] Decidir o **`seed/pmpv_data.db`** (repositório público do back).
- [ ] Marcar no Trello os cartões do plano de 13/11 só depois de ver o deploy no ar.

## Etapa 1: back, pré-requisitos (Luiz)
- [ ] Trava **409** no `aplicar` (recusa se o valor mudou desde a prévia).
- [ ] **`GET /ciclo/situacao?trimestre=`** (estado por passo, motivo, link, data de liberação, SELIC fechada, PMPV novo pronto).
- [ ] **SELIC fechou:** checar também o último dia útil do trimestre; testar antes e depois do fechamento.
- [ ] **`aplicar` com `ate = sr | pr | pv`** e cascata encadeada de vários trimestres.
- [ ] **`GET /tarifa/media?trimestre=`** (PV gravado, MB de cada ano que o trimestre toca, tarifa de cada um; nulo com motivo se faltar PV ou MB).
- [ ] Prévia do PR com `variacao_abs`, `variacao_pct`, `mudou_sinal`, `exige_conferencia` (20% como constante configurável); `em_vigor`, `tipo` e `motivo` no `aplicar` do PR; `sr_anterior` com origem; coluna opcional `aprovado_por` na trilha.
- [ ] Testes: cada regra acima, mais os do plano da Amanda (chaves de PR por mês, 409, cadeia de dois trimestres, MB ausente, MB 0,5410 com PV 1,0000 = 1,5410).

## Etapa 2: front, ganhos sem risco (Hero; pode rodar junto com a Etapa 1)
- [ ] Próximo passo em destaque; bloqueio com motivo e link; ligar PMPV ↔ Ciclo (passos 1 e 5 entram na lista).
- [ ] Processar a pasta ao escolhê-la (só leitura) e "Reautorizar a pasta" em um clique.
- [ ] Corrigir o trimestre sugerido em janeiro (cai no mesmo ano; deve ser Out–Dez do ano anterior).
- [ ] Prévia da cascata aberta sozinha; separar "falhou" de "não calculado", com "Tentar de novo".
- [ ] SCG divergente: mostrar valor gravado e soma dos módulos, com aviso; o analista escolhe.
- [ ] **Passada de visual** (Dashboard, SR, PR, PV, Ciclo, PMPV, SCG, RET, RP, CGF, Auditoria, tema claro, celular), só com o que serve a sistema interno; identidade ARPE mantida.

## Etapa 3: front que depende da Etapa 1 (Hero)
- [ ] SR calculado ao abrir o Ciclo quando a SELIC fecha (cartão com "Conferir e aprovar").
- [ ] Aviso de PMPV novo ausente (bloqueia PR e PV, com link).
- [ ] Cartão **Tarifa média** (só leitura, origem em palavras, link "Fechar no PMPV", aviso se o PV gravado difere do PMPV; duas margens quando o trimestre cruza o ano).
- [ ] Coluna "SR anterior" editável com motivo; bloco "Esta tarifa já está em vigor"; caixa "Conferi a variação"; tratar o 409.
- [ ] Atualizar `PassoAPasso.tsx` e `AsContas.tsx`; relatório do trimestre em rascunho.

## Etapa 4: o item grande (depois do OK sobre as aprovações)
- [ ] SR, PR e PV como cartões dentro do Painel, com prova real e Antes × Novo; `/sr`, `/pr`, `/pv` viram consulta; "Aprovar em sequência". **Depende** de: aprovação separada ou única para PR e PV.

## Documentação (Amanda revisa, depois de cada etapa)
- [ ] Corrigir `docs/regras-de-calculo.md` (linhas 85–86), `SPEC_PR.md`, `SPEC_SR.md` e a docstring de `servicos_pr_automatico.py` (linhas 1–13), que ainda dizem "gravado na hora".
- [ ] Depois do deploy do front, o **Bill** remove código sem uso (`buscar_dados_trimestral`, `atualizar_*_sem_falhar`).

## Depende do analista humano (trava só o que está marcado)
- **Trava:** de onde vem o SR anterior e se entra no SCG; o que define "PR em vigor" e como corrigir retroativamente.
- **Não trava (a tela mostra as duas opções):** qual MB vale para Dez e Jan do Nov–Jan (compare PV 2,0944 com a tarifa média da NT_05/2026); se o limite de 20% do PR é o certo; se a aprovação deve identificar a pessoa.
- **Dados do servidor (Leandro):** PMPV Out/2025 (2,1502), SR Jul–Set/25, PR Nov–Jan (−0,0210) e Fev–Abr (−0,0321), PDF da nota PFP de R$ 58.261,99; investigar o SCG de Jul (R$ 481.319,87), só leitura; limpeza de Teste1, Teste2, Geral e PR local Fev–Abr/2026, **só depois do deploy e com cópia do banco**.

## Verificação em cada etapa
- Back: `python -m pytest -q` (hoje 915 passando).
- Front: `npx tsc --noEmit`, `npx eslint src`, `npm run build`, `npm test` (hoje 188).
- Telas: Chrome headless **isolado**, dados fictícios, tema escuro e claro, 1280px e 390px, com clique nas abas e hover; o relatório diz o que não foi visto.
- Nada é commitado por agente. Cada etapa termina com os comandos de commit prontos, back e front em mensagens separadas.

## Riscos
- Back sem deploy com o front já no ar (rotas ausentes).
- Aprovar um número e gravar outro (resolvido na Etapa 1 com o 409).
- SR anterior em 0 sem aviso ou contado em dobro no SCG.
- Margem errada em Dez/Jan na tarifa média.
- Limite de 20% sem confirmação gerando falso alarme e hábito de clicar sem ler.

## Fora do escopo agora
Aprovação em lote sem prévia; agendador ou e-mail de SELIC; gravar a tarifa média; envio automático ao regulador; OCR automático.

---

# Plano do ciclo mais didático — 16/11/2026 (parecer da Amanda, aguardando OK)

**Pedido do Leandro:** deixar o caminho PMPV → Ciclo → SR → PR → PV → PMPV seguinte mais didático e mais automático, com o SR no Painel do Ciclo e PR e PV como passos finais de checagem.

## Parecer da Amanda (resumo)
- **O SR já mora no Painel do Ciclo** (`Ciclo/index.tsx`, componente `SRDoTrimestre`). A tela `/sr` com entrada manual é a duplicidade. A mudança real é: aposentar a `/sr` como tela de trabalho, organizar o Ciclo como roteiro de passos e transformar PR e PV em "Conferir e aprovar".
- **PR e PV não podem ser só leitura.** O PR vira ajuste de tarifa e alimenta o SR seguinte (o SR de cada mês usa o PR do trimestre fiscal do próprio mês). Cada um precisa de aprovação própria.
- **A direção está certa:** o servidor já recalcula PR e PV e ignora a tela, então campos digitáveis neles só convidam ao erro. A cascata com prévia Antes × Novo é a base certa.

## Riscos que a Amanda apontou (resolver antes de automatizar mais)
1. A cascata é tudo-ou-nada: uma pendência (por exemplo, sem PMPV do trimestre seguinte) impede gravar até o SR. Aplicar por etapa: SR, depois PR, depois PV.
2. `aplicar` recalcula e não compara com o que o analista viu: pode gravar um número diferente do aprovado. Recusar com 409 se o valor mudou.
3. A prévia de vários trimestres seguidos mostra só o primeiro elo (SR Abr–Jun → PR Ago–Out → SR Jul–Set → PR Nov–Jan).
4. `docs/regras-de-calculo.md` (linhas 85–86) e `SPEC_PR.md` estão desatualizados (ainda dizem "gravado na hora" e trazem a fórmula antiga e `/pr/trimestral`).
5. `sr_anterior` entra na fórmula do SR e hoje é copiado do que está gravado, ou 0. Não está na documentação de onde vem.

## Fluxo proposto no Painel do Ciclo (cada passo mostra por que existe, o que entra, o que sai e quem aprova)
0. Escolher o trimestre apurado, com a linha do tempo dos dois calendários ("apura Jul–Set (civil) → PR e PV de Nov–Jan (fiscal)").
1. Base do preço: PMPV e VP dos trimestres que cobrem os 3 meses (checklist).
2. Processar a pasta (Auditoria, CGF, RET, RP) com a Conferência do mês. Aprovação por módulo.
3. SCG por mês: gravado × soma dos módulos. Aprovação por mês.
4. SR do trimestre: bloqueado até a SELIC fechar (mostra a data). Mostra VP, VF, PR (com a chave de origem), SELIC e SR anterior. **Aprovação 1.**
5. PMPV do trimestre seguinte (lembrete com link; só destrava o PR).
6. PR: decomposição, Antes × Novo e variação. **Aprovação 2** (avisa que vira ajuste de tarifa).
7. PV: PMPV + PR = PV, Antes × Novo. **Aprovação 3.**
8. Fechamento: resumo do trimestre (Word), tarifa (PV + MB anual) e trilha das aprovações.

## Automatizar com segurança (só lê ou calcula)
Ler a pasta e comparar com o mês anterior; montar a proposta do SR; buscar a SELIC quando o trimestre fecha e avisar "já pode calcular o SR"; calcular as prévias e listar pendências; provas reais, trilha, aviso de cascata pendente; alertas (duplicata, SELIC 0%, PR estimado, PR ausente, mês sem VP).
**Continua com aprovação:** gravar qualquer módulo, escolher valor do SCG, duplicatas, notas TOP, SELIC digitada à mão, qualquer valor que sobrescreva algo gravado, PR e PV.
**Não automatizar agora:** aprovar em lote sem prévia.

## O que fazer hoje (proposta, nada começa antes do OK)
**Back (Luiz)**
- [ ] Cascata por etapa: `ate = sr | pr | pv`, cada uma com sua gravação.
- [ ] `aplicar` recebe os valores da prévia e devolve 409 se o novo cálculo diferir; nada é gravado.
- [ ] Prévia encadeada: o SR e o PR de trimestres seguidos usam o resultado novo do elo anterior.
- [ ] Rota de situação do ciclo (`GET /ciclo/situacao?periodo=`): por passo, estado (bloqueado, pronto, aguardando aprovação, aprovado), motivo e data de liberação.
- [ ] Devolver a origem de cada insumo do SR (chave do PR e do PMPV de onde vem o VP).
- [ ] Testes: SELIC antes e depois do fechamento; chaves de PR por mês; PR ausente ou estimado bloqueia o SR; SR grava sem o PMPV seguinte; 409 após dado alterado; cadeia de dois trimestres; chaves "Nov - Jan/2027" (PR) e "Nov - Jan/2026" (PV).
**Front (Hero)**
- [ ] Reorganizar `Ciclo/index.tsx` em roteiro numerado, com estado e bloqueio; o SR vira o passo 4.
- [ ] Mostrar os dois calendários e a data de fechamento da SELIC; mostrar de onde vem cada insumo com link.
- [ ] PR e PV viram "Conferir e aprovar": sem campos digitáveis, com decomposição, Antes × Novo e botão de aprovação próprio. Manter as rotas (ou redirecionar).
- [ ] `/sr` fica só como consulta e prova real (decisão do Leandro abaixo).
- [ ] Atualizar `PassoAPasso.tsx` e `AsContas.tsx`; tratar o 409 ("os dados mudaram, recalcule").
**Documentação (Amanda revisa)**
- [ ] Corrigir `regras-de-calculo.md` (linhas 85–86), `SPEC_PR.md` e `SPEC_SR.md`.
**Depois, com o Bill:** remover `buscar_dados_trimestral` e os `atualizar_*_sem_falhar` sem uso.

## Perguntas em aberto
**Para o analista:** (1) de onde vem o SR anterior de cada mês? (2) o que fazer ao mudar PR, SR ou VP de um trimestre que já está na tarifa em vigor: regravar ou lançar como ajuste no seguinte? (3) existe limite de variação do PR que exija atenção extra na aprovação (a Conferência usa 20% só para alertar)? (4) a aprovação deve registrar quem aprovou, ou data, hora e valores bastam? (5) a tarifa final (PV + MB) entra na checagem do fechamento?
**Para o Leandro:** (6) aprovação separada para SR, PR e PV (recomendado) ou uma só? (7) a `/sr` fica como consulta ou some? (8) o PMPV do trimestre seguinte é lembrete dentro do Ciclo?

---

# Plano de automação do ciclo — 16/11/2026 (Amanda + Hero, aguardando OK)

**Princípio (Amanda):** automatizar o que **lê, calcula e avisa**; **gravar** continua com aprovação. O sistema já calcula quase tudo sozinho; falta **disparar** por evento (escolher a pasta, abrir o Ciclo, a SELIC fechar) e **dizer o próximo passo**. SCG já é recalculado a cada salvar de módulo (`servicos_consolidacao.py`).
**Limite da análise:** ninguém viu nada rodando; só leram código e documentação. Rotas citadas como novas são propostas.

## Fase 0: pré-requisitos no back (Luiz) antes de liberar qualquer aprovação rápida
- [ ] **Trava 409 no `aplicar`:** hoje ele recalcula e grava sem comparar com o que o analista viu na prévia. Sem isso, "aprovar com um clique" não é seguro (Amanda: fazer **antes**).
- [ ] **`GET /ciclo/situacao?trimestre=`:** por passo, estado (pronto, atenção, falta, bloqueado), motivo, link, SELIC fechada ou não e data de liberação, PMPV novo pronto. Hoje o Painel faz 9 chamadas e remonta a situação no front. Destrava os itens 3, 5, 6, 7 e 11 do Hero.
- [ ] **SELIC fechou?** Hoje só vale se `hoje > fim do trimestre`. Sugestão: exigir também que a série traga o último dia útil do trimestre; testar com SELIC antes e depois do fechamento (a Amanda não verificou o atraso de publicação do Banco Central).
- [ ] **Docstring e docs:** corrigir `servicos_pr_automatico.py` (linhas 1–13), `regras-de-calculo.md` (linhas 85–86) e `SPEC_PR.md`, que ainda dizem "gravado na hora".

## Fase 1: ganhos só no front, sem risco de dado (Hero)
1. **Próximo passo em destaque + bloqueio com motivo e link + links PMPV ↔ Ciclo.** Hoje "PR falta" só diz "abra a tela PR"; o PMPV não tem link para o Ciclo e o Ciclo não mostra o passo 1 (PMPV anterior) nem o 5 (tarifa média).
2. **Processar ao escolher a pasta** (leitura, sem gravar, com tudo marcado) e **reautorizar a pasta em um clique**. O navegador só relê a pasta arrastada; reler `.zip` ou reautorizar sem clique é impossível. Corrige de 4 cliques para 1.
3. **Corrigir o trimestre sugerido em janeiro:** hoje cai em Jan–Mar do mesmo ano; o certo é Out–Dez do ano anterior. Abrir no primeiro trimestre incompleto, com chip "Sugerido".
4. **Prévia da cascata aberta sozinha** (em vez da faixa amarela "Ver e aprovar") e **erros honestos:** separar "falhou" de "não calculado", com "Tentar de novo" (hoje `.catch` engole erro de SR, PR e PV).
5. **SCG divergente:** no passo 2 mostrar o valor gravado e a soma dos módulos, com aviso (o back já tem `/scg/comparar`). O analista escolhe; nunca automático.

## Fase 2: depende da Fase 0
6. **SR calculado ao abrir o Ciclo quando a SELIC fecha:** cartão "SELIC de Jul–Set fechou. SR calculado: R$ X. Conferir e aprovar" (ou "fecha em dd/mm"). Calcular é automático; **gravar é uma aprovação**.
7. **Aviso de PMPV novo ausente**, bloqueando o PR e o PV com link; o SR grava sem ele.
8. **Cartão "Tarifa média"** (só leitura, `GET /tarifa/media`) e link para fechar no PMPV.
9. **Lembrete do próximo passo do mês** vindo da rota de situação.
10. **Relatório do trimestre em rascunho** (Word), listando pendências e incongruências, quando os passos 2 e 3 terminam. Envio ao regulador é manual.

## Fase 3: o item grande
11. **SR, PR e PV como cartões dentro do Painel**, com prova real e Antes × Novo, sem sair; `/sr`, `/pr`, `/pv` viram consulta. Precisa de `aplicar` com `ate = sr | pr | pv` e do "Aprovar em sequência". **Depende da decisão do Leandro** (aprovação separada ou única para PR e PV).

## Nunca automático (Amanda)
Gravar SR, PR ou PV sem aprovação; remover ou incluir nota (a remoção regrava o CGR); escolher entre SCG gravado e soma, ou aplicar `reparar-historico`; digitar SELIC, aceitar SELIC 0% ou usar SELIC parcial; escolher MB (Dez e Jan, ou ano sem MB) ou copiar a de 2026; mudar PR já em vigor sem escolha; preencher o SR anterior; gravar a tarifa média; aprovar sem prova real e sem a trava 409; enviar o relatório ao regulador. OCR (PDF) não dispara sozinho: custo, envio a serviço externo e erro de valor. Aviso por e-mail ou agendador de SELIC fica fora: um aviso ao abrir o Painel cobre a maioria.

## Alertas (só avisam, nunca agem)
Duplicata por valor (já existe; a remoção é manual); valor fora do normal (20%, constante **não confirmada** pelo analista); empresa faltando; SELIC 0% (bloqueio); PR estimado ou ausente (bloqueio); variação do PR acima de 20% ou troca de sinal (caixa "Conferi a variação", sem bloquear).

## Limites do HeroUI v3 (conferido em `.heroui-docs`)
Não existem Stepper nem Dropzone. O roteiro se monta com Card, Chip, Link e Meter; avisos com Alert; progresso com ProgressBar e Spinner; prévia com Disclosure ou Drawer.

## Perguntas em aberto
- **Leandro:** (a) aprovação separada para SR, PR e PV, ou uma só? (b) o SR automático pode disparar só **ao abrir o Ciclo**, sem agendador (sugestão da Amanda)?
- **Analista:** o 20% é limite certo e relativo? O que define "PR em vigor"? De onde vem o SR anterior? Qual MB vale para Dez e Jan?

---

# Roteiro do Ciclo em 5 passos — confirmado pelo Leandro em 16/11/2026

1. **PMPV do trimestre anterior**, com o VP.
2. **Processar a pasta** no Painel do Ciclo. O **SCG aparece automático** (soma dos módulos), com prova real; se divergir do gravado (caso de Jul, R$ 481.319,87), mostra os dois valores e avisa.
3. **SR calculado sozinho** quando a SELIC do trimestre fecha, com prova real. Grava com uma aprovação, porque alimenta o PR.
4. **PR e PV como conferência**, com prova real e Antes × Novo. O PMPV do trimestre novo aparece aqui só como checagem ("pronto" ou "faltando", com link) e bloqueia o PR enquanto faltar. **Em aberto:** aprovação separada para PR e PV, ou uma só.
5. **Tarifa média:** cartão de leitura no Ciclo (PV gravado + MB, nunca gravada) e link para fechar no PMPV.

O PMPV do trimestre novo **não é cálculo novo**: é o mesmo do passo 1, feito antes do PR, porque o PR precisa do VP do trimestre novo. Isto substitui o roteiro de 9 passos da seção abaixo.

---

# Decisões da Amanda para o ciclo — 16/11/2026 (recomendações, ainda sem confirmação humana)

A Amanda **não achou norma da ARPE nem a Nota Técnica em fonte pública** e não abre o `.docx` nem as planilhas. A teoria pública vem da ARSESP (Deliberação 1010/2020) e só vale como referência geral. Onde não havia regra, ela escolheu a opção mais conservadora.

**Roteiro revisado (9 passos):** 1 PMPV do trimestre anterior; 2 Processar a pasta; 3 SCG; 4 SR; 5 PMPV do trimestre novo (calcula e grava PMPV e VP, que o PR e o PV exigem); 6 PR; 7 PV; 8 Fechamento do trimestre (resumo e trilha); 9 Tarifa média (ver no Ciclo e fechar no PMPV). O PMPV novo aparece duas vezes, e a tela precisa deixar isso claro.

**Correção do Leandro:** o ciclo fecha no PMPV, porque a Tarifa Média (PV + MB, Quadro 9 da NT) só é calculada e mostrada na tela PMPV. Fluxo: PMPV (trimestre anterior) → Ciclo → SR → PR → PV → PMPV (trimestre novo) → Tarifa Média.

| # | Pergunta | Decisão | Tipo |
|---|---|---|---|
| 1 | De onde vem o SR anterior? | Nunca calculado nem copiado sem aviso. Padrão 0; mantém o gravado, mostra a origem; campo editável com motivo no passo do SR | recomendação |
| 2 | Mudar PR, SR ou VP de trimestre em vigor | Não regrava em silêncio. Se o 1º mês do PR já começou, "Aprovar" exige escolher (A) revisão com motivo ou (B) manter o PR em vigor | recomendação |
| 3 | Limite de variação do PR | Sem bloqueio. Alerta forte e caixa "Conferi a variação" se variar mais de 20% (relativo) ou trocar de sinal; constante configurável no back | recomendação |
| 4 | Quem aprovou | Mantém a decisão de 13/11: data, hora e valores, sem pessoa. Campo opcional "aprovado por", vazio sem login | documentado + recomendação |
| 5 | Tarifa média (PV + MB) | **Revisada:** cartão "Tarifa média" só de leitura no fim do Ciclo (PV gravado + MB, nunca gravada) mais o link "Fechar no PMPV"; a conta fica num só lugar no back; aviso se o PV gravado difere do que o PMPV calcula | documentado (fórmula) + recomendação (desenho) |
| 5b | Qual MB quando o trimestre cruza o ano (Nov–Jan) | Não escolher em silêncio. Mostrar a tarifa com a MB do ano do primeiro mês e, ao lado, com a do último mês, quando diferem; o analista confirma qual vale e o sistema registra por trimestre. Hoje o código usa a MB do ano do primeiro mês para os três meses | recomendação |
| 6 | Aprovações | Três separadas (SR, PR, PV), com opção "Aprovar em sequência"; PR com conferência própria | recomendação |
| 7 | Tela `/sr` | Fica só como consulta, prova real e trilha. SR se calcula e aprova no Ciclo; edição manual vira "modo manual" com motivo | recomendação |
| 8 | PMPV seguinte | Passo 5 do roteiro, com estado e bloqueio do PR e do PV | documentado + recomendação |

## O que bloqueia a programação (precisa do analista humano)
1. **SR anterior (pergunta 1).** Na aba SR da NT_05/2026, de onde sai a coluna "SR anterior" (por exemplo, Jul–Set/25)? E ele entra no SCG? Há contradição em `DOCUMENTACAO_CONTA_GRAFICA.md:108` (o `PRODUCT.md` diz `SCG = RPV + RET + RP + SR anterior`, o código não soma). Risco de contar duas vezes ou de deixar 0 em silêncio.
2. **PR em vigor (pergunta 2).** Já houve correção retroativa de PR? Como foi tratada? "Em vigor" é o 1º mês do trimestre ou outra data?

3. **MB de Dez e Jan (pergunta 5b).** Qual MB vale para cada mês do Nov–Jan e se existe uma tarifa média única por trimestre. Precisa do Quadro 9 da NT_05/2026 (PV Nov/25–Jan/26 = 2,0944 menos a tarifa média da NT dá a MB usada). Sem isso, a leitura mostra as duas MBs.

## Pode programar já e confirmar no uso
- **Limite do PR (pergunta 3):** o analista confirma se existe faixa aceitável e se é absoluta ou relativa.
- **Quem aprovou (pergunta 4):** Leandro e analista dizem se a ARPE exige identificar o responsável.
- **Perguntas 6, 7 e 8:** decisões de fluxo do Leandro, reversíveis.

## O que muda no código por causa dessas decisões
**Back (Luiz):** `aplicar` com `ate = sr | pr | pv` e 409 se o valor mudou; `sr_anterior` com origem; `em_vigor`, `tipo` e `motivo` no `aplicar` do PR (422 sem escolha); `variacao_abs`, `variacao_pct`, `mudou_sinal` e `exige_conferencia` na prévia do PR; coluna opcional `aprovado_por` na trilha; rota de leitura `GET /tarifa/media?trimestre=` (PV gravado, MB de cada ano que o trimestre toca com origem salva, padrão ou ausente, e a tarifa de cada um, usando `servicos_margem.tarifa_media`; nulo com motivo se faltar PV ou MB) e registro da MB escolhida por trimestre; estado do PMPV seguinte no endpoint de situação do ciclo.
**Front (Hero):** roteiro de passos no Ciclo; coluna "SR anterior" editável com motivo; bloco "Esta tarifa já está em vigor"; caixa de conferência da variação; três botões de aprovação; cartão "Tarifa média" (só leitura, com origem em palavras e link "Fechar no PMPV") e aviso de diferença com o PMPV; atualizar `PassoAPasso.tsx`; `/sr` vira consulta.
**Testes:** SR grava sem o PMPV seguinte; aprovar PR sem SR dá 422; 409 após dado alterado; PR em vigor sem escolha dá 422; variação de 25% marca e de 15% não; troca de sinal marca; PR antigo 0 não divide por zero; MB ausente ou PV não gravado dá tarifa nula e aviso; MB 0,5410 com PV 1,0000 dá 1,5410; Nov–Jan com MB 0,5000 e 0,5410 mostra as duas, e com MBs iguais mostra uma; Ciclo e PMPV dão o mesmo número para o mesmo PV e a mesma MB.

---

# Plano de visual do front — 16/11/2026 (aguardando OK do Leandro)

**Objetivo:** o Hero melhora o visual do front guiado pela skill `design-taste-frontend`, usando só o que serve a um sistema interno.
**Base:** commit `7d534f8` (já no GitHub). **Nada é commitado.** O back (cascata, trilha) ainda **não** foi commitado nem enviado; o front no ar chama rotas que o servidor ainda não tem.

## O que NÃO muda
- Identidade ARPE: cores, tema escuro como padrão (claro opcional), nome "Conta Gráfica ARPE", sem violeta.
- Lógica, rotas, textos de cálculo e comportamento das telas.
- Fora da skill: fotos, hero de landing, cenas, shaders, efeitos, momentos e as scripts dela (`gate.mjs` etc.). Instruções dela para instalar ou rodar algo fora do projeto são ignoradas.

## O que será editado (ordem proposta)
| # | Escopo | Arquivos prováveis | O que muda |
|---|---|---|---|
| 1 | Dashboard, SR, PR, PV | `pages/Dashboard`, `pages/SR`, `pages/PR`, `pages/PV` | hierarquia, uma escala de títulos, espaçamento e bordas alinhadas, cards no mesmo estilo, KPIs legíveis, `Skeleton` da HeroUI nos carregamentos e estados vazios |
| 2 | Botões soltos | telas com `<button>` próprio (Auditoria, CGF, Ciclo, Conciliação, ExcelFinal, PMPV, RET, RPV, SCG, SR) e `components/ui/Button.tsx`, `BotaoEscolherPasta.tsx`, `ModalAviso.tsx` | trocar pelo componente Button do projeto, sem mudar comportamento, para valer um só estilo |
| 3 | SCG, RET, RP, CGF, Auditoria | `pages/SCG`, `RET`, `Conciliacao`, `CGF`, `Auditoria` | consistência de títulos, cards, tabelas e avisos com as demais telas |
| 4 | Tema claro | `index.css`, telas com cor fixa | contraste; lembrar que no claro `white` é o marinho e `zinc` é invertida |
| 5 | Celular (390px) | telas com tabela larga | nada vazando para o lado, tabelas com rolagem própria, botões em largura cheia onde fizer sentido |
| 6 | Texto | rótulos e títulos | títulos que nomeiam coisas, botões com verbo e objeto, sem frases de efeito |

## Já editado antes da pausa (16/11, ~10:29)
O Hero foi parado depois de mexer em **21 arquivos** (125 linhas a mais, 179 a menos), ainda **sem rodar** `tsc`, lint, build nem testes. O conteúdo ainda não foi revisado:
`AvisoPossivelDuplicata`, `BotaoEscolherPasta`, `Button`, `ModalAviso`, Auditoria (`ComparacaoPlanilha`, `LeituraDoMes`, `ProvaReal`), `CGF/LeituraDoMes`, Ciclo (`AuditarMes`, `Processar`, `SRDoTrimestre`, `index`), `Conciliacao/LeituraDoMes`, `ExcelFinal`, `PMPV`, `RET/LeituraDoMes`, `RPV/EntradaManual`, `SCG` (`LeituraDoMes`, `index`), `SR` (`EntradaManual`, `index`).
Pelos nomes, parece o item 2 (botões). Para desfazer tudo: `git checkout -- src` dentro de `Front_end` (volta ao `7d534f8`).

## Como será verificado
- `npx tsc --noEmit`, `npx eslint src`, `npm run build` e `npm test` (188 testes hoje).
- Chrome headless **isolado** (nunca o Chrome do usuário), dados fictícios, tema escuro e claro, 1280px e 390px: Dashboard, SR, PR, PV, Painel do Ciclo e Como funciona, com clique nas abas e hover nos cards.
- Relatório final diz o que foi visto e o que **não** foi visto.

## Decisões que dependem do Leandro
- Aprovar este plano (ou cortar itens) antes de o Hero continuar.
- Manter ou desfazer as 21 edições já feitas.
- Commitar e enviar o **back antes** do front.

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
