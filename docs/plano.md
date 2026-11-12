# Plano de amanhã (12/11/2026)

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
