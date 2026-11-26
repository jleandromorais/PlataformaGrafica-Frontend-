# Plano atual

Só o plano em andamento. Planos antigos ficam em `docs/plano-historico/` (um arquivo por mês, ex.: `2026-11.md`).

## PR MANUAL NO SR (25/11, a pedido do usuário)
- [x] Back: `POST /pr/manual` (PR + motivo obrigatório, 4 casas, trava em 5 R$/m³), `DELETE /pr/manual` (voltar ao automático; simula sem `aplicar`), colunas `origem/motivo/usuario_nome` em `pr_resultados`, trilha com origem "manual", `GET /pr` devolve origem/motivo/data; o SR lê o PR manual como `pr_origem="manual"` e a proposta aceita `pr_digitado` (prévia, segue bloqueando até gravar). `tests/test_pr_manual.py`.
- [x] Front: `/sr` ganha "Informar PR" na célula do mês sem PR salvo (`pages/SR/PRManualDoMes.tsx`, `utils/prManual.ts`): o valor entra na prévia na hora, "Usar o estimado" desfaz, gravar pede motivo e confirmação, depois mostra "PR manual · valor · motivo · data" e "Voltar ao automático".
- [ ] Falta (cortado a pedido): ligar o campo ao cartão `Ciclo/SRDoTrimestre.tsx` (o back já aceita `pr_digitado`; `propostaSRTrimestre(meses, prDigitado)` já existe) e ver no navegador (disco cheio).
- Atenção: aprovar a cascata do SR podia regravar o PR por cima do manual (bug B1, em correção).

## RESUMO DO QUE FOI FEITO EM 25/11 (atualizado no fim do dia)

**Já em produção (push feito, back e front na `main`):**
- **Gravar o mês depois de conferir:** bloco "Passo final: gravar o mês" no fim do Comparar e no passo 2; "Incluir esta nota" recusa mês nunca gravado (422); histórico traz `qtd_digitadas`/`cgr_digitadas`; notas digitadas reincluídas por padrão ao regravar; aviso de pasta de outro trimestre.
- **PR manual na tela `/sr`:** "Informar PR" no mês sem PR salvo, prévia do SR na hora, gravação com motivo e confirmação, "Voltar ao automático" (`POST/DELETE /pr/manual`, colunas `origem/motivo/usuario_nome` em `pr_resultados`).
- **Excel Final e minuta:** A4, SELIC com "%", "Resumo" no início, Quadro 9 (Tarifa Média = PV + MB 0,5410), Quadro 10 (conferência), siglas "PR (ago/26-out/26)", aba "Conferência" e cabeçalho congelado.
- **Comparar mais fluido:** "ver quais ↓"/"Ver →" rolam e destacam; erro amigável (sem "HTTP 422 · POST"); frase do passo final coerente com divergência; tela preta corrigida (só o `<main>` rola).
- **Uma decisão só sobre a nota faltante:** no Comparar do Painel o "Incluir esta nota" virou "decidir no passo final ↓" (a `/auditoria` avulsa mantém o botão).
- **Painel do Ciclo numa página só:** os 9 passos empilhados, trilha horizontal fixa no topo (clica e rola; marca o passo à vista) e rolagem automática ao próximo passo depois de gravar.

**Conferido pelo usuário na web:** tudo funcionando; PR Fev–Abr = −0,0321 já estava gravado lá. O banco local estava desatualizado (por isso falhou só no local). O deploy não sobrescreve o banco da web (o seed só entra com volume vazio).

**Diagnósticos:** erro 500 em Set/2026 local era disco cheio (`Errno 28`), não bug.

**Revisão de bugs (fim do dia):** achados B1–B4 abaixo (em correção pelo leandro-cg) e mais dois baixos, deixados para depois:
- B5: o aviso "incluída à mão antes" aparece em todas as notas faltantes quando o mês tem ao menos uma digitada (o back só manda a quantidade; precisa mandar a lista).
- B6: `Layout.tsx` trava a rolagem da página inteira; conferir telas longas no celular.

## PLANO DE 26/11 (o que ficou pendente de 25/11)
**Já feito em 25/11:** correção de B1–B4 commitada, no ar e conferida na web.

1. **Bugs da 2ª revisão** (seção abaixo; só front, nenhum mexe em número):
   - [x] N1 (médio) `/sr` mostra o PR antigo como "PR manual" quando o SR foi gravado antes do PR manual. (26/11: célula mostra o valor manual do banco + aviso âmbar "o SR gravado usa PR X; o PR manual é Y"; `srDesatualizado` em `utils/prManual.ts`, testado.)
   - [x] N2 (baixo) texto do aviso das notas digitadas no `GravarMes` manda usar botão que não existe mais. (26/11: `textoDasDigitadasApagadas` em `gravarDoMes.ts`, texto por caso, testado.)
   - [x] N3 (baixo) reinclusão automática da nota digitada pode não ligar se o histórico chegar depois. (26/11: a decisão inicial é reaplicada quando o histórico/comparação chega, só se o analista ainda não escolheu.)
2. **Antes de mostrar ao chefe:**
   - [ ] Conferir em produção: `VITE_API_URL`, `CORS_ORIGINS`, `JWT_SECRET`, `PERMITIR_CADASTRO=0`, `PERFIS_ATIVOS`.
     - 26/11 (testado por fora, sem gravar nada): `VITE_API_URL` ok (bundle aponta para o Railway); `CORS_ORIGINS` ok (só o site da Vercel; origem estranha leva 400); rotas sem token dão 401.
     - **`PERMITIR_CADASTRO` está ABERTO** (`POST /auth/cadastro` chega na validação, não dá 403): qualquer pessoa cria conta. Pôr `PERMITIR_CADASTRO=0` no Railway.
     - `/docs` e `/openapi.json` públicos (mostram todas as rotas). Avaliar fechar em produção.
     - `JWT_SECRET` e `PERFIS_ATIVOS`: não dá para ver por fora; conferir no painel do Railway (o seed não traz segredo nem usuários).
   - [ ] Backup do banco da web.
   - [ ] Passar as telas (Painel, Comparar, `/sr`, Excel e minuta) no tema escuro e no estreito (Chrome headless isolado).
2b. **Segurança** (varredura de 26/11; spec em `plataforma-conta-grafica/docs/specs/SPEC_SEGURANCA.md`). Crítico: cadastro aberto + perfis desligados = qualquer um grava/apaga.
   - [ ] **Fase 0 (Leandro, no Railway, antes do push da fase 1):** backup do `/data`; `EMAILS_PERMITIDOS` com o seu e-mail se ele não for @arpe.pe.gov.br (senão você perde o acesso); `PERMITIR_CADASTRO=0`; `JWT_SECRET` aleatório; conferir a lista de usuários (`GET /api/usuarios`) atrás de conta estranha; dar os perfis e só então `PERFIS_ATIVOS=1`.
   - [x] **Fase 1 (back), 26/11:** só e-mails `@arpe.pe.gov.br` e `teste@gmail.com` (cadastro, login e toda requisição); cadastro fechado por padrão; limite de tentativas (5 erros/15 min por e-mail); limites do upload (zip-bomba, 200 MB por arquivo, 2 GB por envio); `/docs` só com `API_DOCS=1`; aviso sem `JWT_SECRET`; pasta temporária apagada no erro. pytest 1126 verdes. Falta o commit e o push do Leandro.
   - [x] **Fase 2 (front), 26/11:** cabeçalhos de segurança no `vercel.json` (CSP, `frame-ancestors`, `nosniff`; script do tema foi para `public/tema.js`); sem internet ao abrir não desconecta mais (tela "Tentar de novo"); "Criar conta" só com o cadastro aberto (rota pública `GET /api/auth/cadastro-aberto` no back). vitest 448 verdes, build ok, Chrome headless isolado sem erro de CSP. Subir o back ANTES do front.
   - [ ] **Fase 3 (decisão do Leandro):** repositório do back privado (recomendado) ou tirar o `seed/pmpv_data.db` do histórico; `pip-audit` e `npm audit`.
3. **Se sobrar tempo:**
   - [ ] B5: o back mandar a LISTA das notas digitadas no histórico (hoje só a quantidade), para o aviso "incluída à mão antes" ficar exato.
   - [ ] B6: conferir telas longas no celular (o `Layout.tsx` trava a rolagem da página).
   - [ ] Ligar o PR manual no cartão do SR do Painel (`Ciclo/SRDoTrimestre.tsx`).
   - [ ] Balanceamento no front: grupo "Abate o CGR (−)", negativos no "Incluir esta nota" (item 4 do plano de 25/11).
   - [ ] Estorno ND 550499 na spec do balanceamento (item 3 do plano de 25/11).
4. **Sem prazo:** diferença de R$ 1.019.232,55 no SCG de julho; regravar Jul/26 depois do fechamento de Out; Saturno MMBTU→m³; nota faltante no "Processar em lote".

## CORREÇÃO DOS BUGS ACHADOS EM 25/11 (revisão do que subiu)
- [x] B1 (grave) Cascata do SR regrava o PR manual por cima: se o PR salvo é `origem="manual"`, a cascata NÃO regrava o PR (mantém o manual e avisa na prévia "PR manual mantido: motivo"); só `DELETE /pr/manual` volta ao automático. Teste pytest.
- [x] B2 (médio) Excel Final e minuta recalculam o PR e ignoram o manual: com PR salvo manual, Quadro 7/aba PR usam o valor manual e escrevem "PR informado à mão: motivo"; Quadro 10 não acusa "Diverge" por isso. Teste pytest.
- [x] B3 (médio) `/sr` com SR já gravado não mostra o PR manual nem "Voltar ao automático": buscar a origem do PR também quando o SR vem do salvo.
- [x] B4 (baixo) Dois "Informar PR" para a mesma chave (Mai e Jun): só o 1º mês da chave mostra o campo; ids únicos.

## BUGS DA 2ª REVISÃO (25/11, depois do deploy de B1–B4; só front, nenhum mexe em número)
- [ ] N1 (médio) `/sr` com SR gravado ANTES do PR manual: a célula mostra "PR manual · <PR antigo do SR gravado>" em vez do valor digitado, e não avisa que o SR ficou para trás. Mostrar o PR manual vindo do banco (`carregarTrimestreSR`, campo `pr`) e avisar "o SR gravado usa PR X; o PR manual é Y: aprove o SR de novo no Painel". (`pages/SR/index.tsx`, `buscarTrimestre`)
- [ ] N2 (baixo) `Ciclo/GravarMes.tsx`, aviso das notas digitadas que serão apagadas: diz "inclua de novo depois, com 'Incluir esta nota'", mas no Painel esse botão virou "decidir no passo final", e se a nota real já chegou na pasta, incluir de novo duplicaria (o back recusa). Texto por caso: escolheu "Seguir sem" → "a nota digitada sai do CGR"; nota real chegou na pasta → "a nota digitada é trocada pela nota real".
- [ ] N3 (baixo, confirmar) `GravarMes.tsx`: `decisao`/`motivo` iniciais (`decisaoInicial`) só são calculados na montagem; se o histórico (`linha`) chegar depois, a nota digitada não vem marcada para voltar e seria apagada ao regravar. Confirmar se o histórico sempre chega antes; se não, aplicar a decisão inicial quando `linha` chegar (sem sobrescrever escolha do analista).
