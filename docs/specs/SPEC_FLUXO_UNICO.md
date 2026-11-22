# Spec — Fluxo único: um caminho, um próximo passo, um lugar para gravar

Data: 21/11/2026 · Status: **proposta, aguardando aprovação do Leandro** (decisões na seção 9)
Time: **José** (front) · **Choco** (back; nas fases 1 a 4 não há trabalho obrigatório para ele, ver seção 7)
Base: commit `93e39db` (front) e `02cfd99` (back); `git status` limpo nos dois. O topo do `plano.md` ainda dizia "sem commit" para o `93e39db`: o plano estava velho, vale o git.

Veredito: o analista novo se perde porque o mesmo caminho é contado de **cinco** jeitos, o "o que faço agora" está no fim da página, e o ato de gravar está espalhado por dez botões em oito telas, alguns sem confirmação nenhuma. Os cálculos não mudam. Esta spec reordena, junta e remove; quase nada é texto novo.

---

## 0. Auditoria conferida contra o código (o que se sustenta e o que não)

| # | Achado do Leandro | Veredito | Evidência |
|---|---|---|---|
| 1 | Três ordens do mesmo caminho | **Sustenta, e é pior: são cinco** | (a) menu `modulos.ts:60-65`; (b) cabeçalho "Etapa N de 11" `PageHeader.tsx:55`, `ORDEM_DO_CICLO` `modulos.ts:56-58`; (c) Painel `Ciclo/index.tsx:173-229`, 10 passos + "Entregas" numerada 11 (`:594`); (d) back `GET /ciclo/situacao` com 5 passos (`pmpv_anterior, pasta_scg, sr, pr_pv, tarifa_media`, `schemas/ciclo.py`); (e) "Como funciona" com 5 passos diferentes (`ComoFunciona/PassoAPasso.tsx:15-27`). O "RET" é a etapa 4 no Painel e a 5 no cabeçalho; o "11" é Excel Final no cabeçalho e Entregas no Painel. Extra: Anterior/Próxima do cabeçalho vai para `alvo.to` (`PageHeader.tsx:73`) e **perde `?de=ciclo` e o trimestre**: a tela seguinte abre no mês de hoje. |
| 2 | `/` abre o Dashboard | **Sustenta** | `router/index.tsx:34` (`index: DashboardPage`); login e cadastro mandam para `/` (`Login.tsx:15`, `Cadastro.tsx:33`, `RequireAuth.tsx:36`); Painel é o 4º item do menu. |
| 3 | "Próximo passo" no fim | **Sustenta** | Ordem real da página (`Ciclo/index.tsx:448-616`): aviso de cascata, período, Importar pasta (com Conferência, mapa e Processar dentro), Comparar planilha, card do SR, e só então "Etapas do ciclo" com a etiqueta "Próximo" (`:564`) e o botão "Fazer agora" (`:581`). São cinco blocos de ação antes do que diz o que fazer. |
| 4 | Telas "prometem ler" | **Só em parte** | Os cabeçalhos de Auditoria, CGF, RET e RP **já** dizem "use o Painel do Ciclo" (`Auditoria/index.tsx:68`, `CGF/index.tsx:74`, `RET/index.tsx:71`, `Conciliacao/index.tsx:75`): a `descricao` passada sobrepõe o `proposito` (`PageHeader.tsx:28`). O `proposito` de `modulos.ts:31-40` ainda diz "Leia as notas…" e é texto morto, mas vira a verdade na primeira tela que esquecer a `descricao`. O que falta de verdade: o orientador é só texto (sem botão), o estado vazio ("Nenhum mês auditado.", `Auditoria/index.tsx:154`; igual em CGF `:140`, RET `:135`, RP `:152`) não leva a lugar nenhum, e o RPV diz "salve a diferença" (`modulos.ts:36`) quando ele é automático. **Achado novo:** 7 arquivos mortos (`pages/{Auditoria,CGF,RET,Conciliacao,SCG}/LeituraDoMes.tsx`, `pages/{RPV,SR}/EntradaManual.tsx`, 2.445 linhas), sem nenhum import, só citados em comentário. |
| 5 | Gravar em vários lugares, duas confirmações | **Sustenta, com nuance** | São 11 pontos de gravação (seção 4). As "duas confirmações" protegem coisas diferentes: a 1ª grava o que o analista acabou de ler (módulos); a 2ª grava SR/PR/PV, números que ele nunca viu. Com o back atual a 2ª não pode vir antes da 1ª (a cascata calcula sobre o **gravado**). **Achado mais grave:** `/sr`, `/pr`, `/pv`, `/scg` e `/pmpv` gravam **sem nenhuma janela de confirmação** (`ModalAviso` aparece 0 vezes nesses arquivos) e `/sr` grava a tabela editável sem a checagem "Gravar com divergências" que o card do Painel tem (`SRDoTrimestre.tsx:170-209`). |
| 6a | Entregas depende da planilha de outro bloco | **Sustenta, e tem um bug** | `Ciclo/index.tsx:598-604`. `planilhaRel` é estado do Painel que **nunca é zerado ao trocar de trimestre** (`irPara`, `:322`), enquanto o `CompararPlanilha` remonta pela `key` (`:537`) e mostra "sem planilha". Resultado: "O relatório compara as notas com a planilha X" com X de **outro trimestre**, e o relatório oficial sai comparado com a planilha errada. |
| 6b | Pasta perdida ao recarregar | **Parcial** | Já lembra os nomes e, se arrastada no Chrome com permissão ainda válida, relê (`Ciclo/index.tsx:288-299`, `utils/pasta.ts:62`). Reautorizar "em um clique" **não existe de propósito**: `requestPermission` foi retirado porque dispara o aviso do Chrome (`utils/pasta.ts:21-24`). O que falta é só deixar o próximo passo óbvio (aviso em `:515-520` não tem botão). |
| 6c | Siglas sem explicação | **Sustenta** | `dicaDe` só é usado no `title` do menu (`Sidebar.tsx:85`), SR, SCG e Dashboard; passos, cartões e avisos do Painel usam "RPV", "VP", "SCG" soltos. |
| 6d | Formatos de período | **Sustenta** | Painel: `"Jan – Mar"` com travessão (`Ciclo/index.tsx:51`); ciclo `"Nov - Jan"` com hífen (`:52`, `PR/index.tsx:23`); avisos `"Jul a Set/2026"` (`avisos.ts:87`); chaves do back com dois anos diferentes para o mesmo trimestre (PR: ano do último mês, "Nov - Jan/2027"; PV: ano do primeiro, "Nov - Jan/2026"; `PR/index.tsx:59`). |
| 6e | Passo PMPV em meses civis × tela em trimestre do ciclo | **Sustenta** | `Ciclo/index.tsx:184-185` mostra Abr, Mai, Jun; a tela PMPV edita um trimestre do ciclo por vez, e Abr–Jun cai em **dois** (Fev–Abr e Mai–Jul). O link já abre no trimestre do 1º mês que falta (`93e39db`), mas o passo continua prometendo "o PMPV do trimestre apurado" como se fosse uma tarefa só. |

---

## 1. Uma fonte única de etapas

### Problema
Cinco listas, três numerações. Quem passa do Painel para a tela do RET lê "Etapa 5 de 11" depois de ter lido "4" no Painel.

### Regra
> Existe **uma** lista de etapas, em `src/utils/etapasDoCiclo.ts` (módulo puro, sem importar `react-router`: `utils/periodos.test.ts` não roda por causa disso). Menu, cabeçalho, Painel e "Como funciona" **leem dela**. Ninguém mais numera nada.

### A lista (9 passos numerados + 3 itens sem número)
| Nº | Chave | Nome | Onde se trabalha | Tipo |
|---|---|---|---|---|
| 1 | `pmpv` | PMPV dos meses apurados | tela `/pmpv` (digitação) | passo |
| 2 | `auditoria` | Auditoria CGR | Painel (Processar / Auditar mês) | passo |
| 3 | `cgf` | CGF | Painel (Processar) | passo |
| 4 | `ret` | RET | Painel (Processar) | passo |
| 5 | `rp` | RP | Painel (Processar) | passo |
| 6 | `scg` | SCG | automático; `/scg` só quando diverge | passo |
| 7 | `sr` | SR, Saldo Remanescente | Painel (card do SR) | passo |
| 8 | `pr` | PR | `/pr` hoje; card do Painel na fase 5 | passo |
| 9 | `pv` | PV | `/pv` hoje; card do Painel na fase 5 | passo |
| sem nº | `rpv` | RPV | automático (CGR − CGF), só consulta | automático |
| sem nº | `tarifa` | Tarifa média | leitura; fecha no PMPV do trimestre novo | fechar |
| sem nº | `entregas` | Entregas (minuta da NT, relatório, Excel Final) | Painel e `/excel-final` | fechar |

Por que assim: os 9 numerados são exatamente a numeração que o Painel já usa (1 a 9), então a tela principal **não muda de número**; só menu e cabeçalho se alinham a ela. O RPV é calculado ao gravar CGR e CGF (`RPV/index.tsx:1-6`: a entrada manual está morta), então numerá-lo faz o analista procurar uma ação que não existe. Tarifa média e Entregas não são "trabalho", são conclusão.

### Comportamento
1. **Menu** (`GRUPOS_DO_MENU`), na ordem de uso e com o número ao lado da sigla:
   ```
   Início
     Painel do Ciclo        (entrada)
     Como funciona
   Passos do trimestre
     1 PMPV      2 Auditoria CGR   3 CGF   4 RET   5 RP
     6 SCG       7 SR              8 PR    9 PV
   Consulta e entrega
     Visão geral             RPV (automático)      Excel Final
   ```
   Os títulos "Conta Gráfica" e "Módulo 3 · Consolidação" saem do menu (viram texto do "Como funciona"): "Módulo 3" não diz nada a quem chega.
2. **Cabeçalho** (`PageHeader`): no lugar de "Etapa 5 de 11" com setas, uma etiqueta "Passo 4 de 9" (ou "Calculado sozinho" no RPV, "Entrega" no Excel Final) e o botão **"Painel do Ciclo"**. As setas Anterior/Próxima ficam só se carregarem `?de=ciclo&ciclo=<1º mês>` (hoje perdem o trimestre); se o Leandro preferir, saem (decisão 7).
3. **Painel**: `etapas()` passa a montar a lista a partir de `ETAPAS_DO_CICLO` (chave, número, nome, rota); só o estado e o detalhe de cada passo continuam sendo calculados lá. "Entregas" deixa de ser o item "11" e vira o bloco "Ao fechar" (tarifa média + entregas), sem número.
4. **Como funciona**: `PassoAPasso` passa a listar os 9 passos agrupados em 4 fases (Preparar, Processar a pasta, Trimestre, Fechar) com os mesmos números.
5. **Back**: continua com os 5 macropassos dele. O front **não mostra** a numeração do back; só usa `proximo_passo` (hoje mapeado em `proximoPasso.ts:72`, onde `pasta_scg` cai no cálculo local, o que está certo). Ver seção 7 para a extensão opcional.

### Estados
Estado de cada etapa continua `ok | atencao | falta` + bloqueio (`proximoPasso.ts`); a lista só entrega identidade, número e rota. Rota inexistente para uma chave = erro de TypeScript (tipo `ChaveEtapa` fechado).

### Aceite
- Em nenhuma tela o mesmo passo tem dois números; teste: para cada chave de `ETAPAS_DO_CICLO`, o número no menu, no cabeçalho e no Painel é o mesmo (teste do módulo + teste que importa `GRUPOS_DO_MENU` e confere).
- Abrir o RET pelo Painel mostra "Passo 4 de 9" e o Painel mostra "4".
- Nenhum link do cabeçalho abre a tela sem o trimestre do Painel quando veio do Painel.

---

## 2. Página inicial e papel do Dashboard

### Problema
Quem entra cai em gráficos. O que ele precisa fazer está num item do menu depois de "PMPV".

### Comportamento
1. `/` redireciona para `/ciclo` (`<Navigate replace>`), inclusive depois de login e cadastro (que já mandam para `/`; nada a mudar neles).
2. O Dashboard passa a `/visao-geral`, no grupo "Consulta e entrega", nome **"Visão geral"** (já é o título dele). Links antigos para `/` caem no Painel.
3. Papel dele, escrito no cabeçalho: "Resultados gravados, mês a mês. Para trabalhar o trimestre, use o Painel do Ciclo." e o botão "Abrir o Painel do Ciclo" nas ações.
4. Continua com o aviso geral de SR/PR/PV desatualizado (`AvisoCascataPendente`); é consulta, não decisão nova.

### Aceite
Login leva ao Painel já no trimestre sugerido; `/` e `/visao-geral` funcionam; o item do menu "Painel do Ciclo" está ativo em `/ciclo`; o Dashboard continua sem gravar nada.

---

## 3. "Próximo passo" no topo do Painel

### Problema
O que fazer agora está no fim, depois de cinco blocos de ação. Há vários botões do mesmo peso ("ou escolha o .zip", "Processar", "Calcular SR", "Fazer agora" por linha).

### Nova ordem da página
1. Cabeçalho (título e texto do Painel).
2. **Trimestre** (ano, 4 botões, frase "Apura … → define o PR e o PV de …", progresso "3 de 9 passos"). Fica no topo porque tudo abaixo depende dele.
3. **Bloco "Próximo passo"** (novo): 1 botão principal.
4. **"Aguardando sua aprovação"** (só aparece se existir): a prévia da cascata do trimestre aberto, com "Aprovar e gravar" (seção 4).
5. **Passos do trimestre** (a lista numerada que hoje fica no fim, agora com os blocos de trabalho **dentro** do passo a que pertencem, recolhidos por padrão e abertos quando for o próximo passo):
   - Passos 2 a 5: "Processar a pasta" (Importar pasta, Conferência do mês, mapa, Processar) e, no passo 2, "Comparar com a planilha (opcional)".
   - Passo 7: o card do SR.
6. **Ao fechar**: Tarifa média e Entregas.

Blocos de trabalho viram **subordinados** ao passo: some a lista de blocos soltos e a página passa a ter uma coluna só de "o que está acontecendo".

### Mockup do novo topo
```
Painel do Ciclo
Passo a passo do trimestre, na ordem: o que já está pronto, o que falta e onde fazer.

  2026  [<] [>]    ( Jan-Mar )( Abr-Jun )( [Jul a Set]  sugerido )( Out-Dez )
  Apura Jul a Set/2026 (trimestre civil)  ->  define o PR e o PV de Nov/2026 a Jan/2027 (trimestre do ciclo)
  3 de 9 passos prontos  [======--------------]

 +-------------------------------------------------------------------------+
 | PROXIMO PASSO  -  passo 4 de 9                                          |
 | RET - Recuperação de Encargos de Transporte                             |
 | Falta o RET de Ago e Set. Traga a pasta do ano e processe.              |
 |                                                                         |
 |  [ Trazer a pasta SCG-26 ]            Depois: RP, SCG, SR   Ver motivo > |
 +-------------------------------------------------------------------------+
 +-------------------------------------------------------------------------+
 | AGUARDANDO SUA APROVACAO (só aparece quando houver)                     |
 | O SR, o PR e o PV de Nov a Jan/2027 ficaram desatualizados.             |
 | Antes (gravado) -> Novo (calculado)           [ Aprovar e gravar ]      |
 +-------------------------------------------------------------------------+

  Passos do trimestre
  [ok] 1  PMPV dos meses apurados          Jul 2,1502  Ago 2,1154  Set 2,1154      Ver
  [ok] 2  Auditoria CGR                    Jul R$ ...  Ago R$ ...  Set R$ ...      Ver
  [ok] 3  CGF                              ...                                      Ver
  [>]  4  RET           PROXIMO            Jul R$ ...  Ago falta   Set falta        (botao acima)
  [ ]  5  RP                               ...                                      Fazer
  [ ]  6  SCG                              ...
  [bl] 7  SR            Bloqueado: falta o SCG de Ago, Set                          Abrir o SCG
  [bl] 8  PR            Bloqueado: falta o PMPV do trimestre novo (Nov a Jan)       Abrir o PMPV
  [bl] 9  PV            ...
        > Processar a pasta (passos 2 a 5)        [recolhido; abre sozinho no passo atual]
        > Comparar com a planilha (opcional, passo 2)
        > SR do trimestre (passo 7)
  Ao fechar:  Tarifa média (leitura)   Entregas: minuta da NT | relatório | Excel Final
```
Legenda: `[ok]` pronto, `[>]` próximo, `[ ]` falta, `[bl]` bloqueado (cadeado + motivo, como hoje).

### O botão do bloco
`proximoPasso.ts` fica como está (função pura, 8 testes). Entra um módulo novo, também puro, `blocoProximoPasso.ts`:
`blocoDoProximoPasso({ proximo, bloqueios, temPasta, temArquivos, selic, aguardandoAprovacao }) -> { titulo, texto, acao: { rotulo, tipo: "rolar" | "link" | "abrir-processar", alvo } | null, depois: string[] }`

| Situação | Título | Texto | Botão |
|---|---|---|---|
| Há cascata do trimestre para aprovar | "Aprove o SR, o PR e o PV" | "Você gravou algo que mudou o que vem à frente. Nada é gravado sem a sua aprovação." | "Revisar e aprovar" (rola até o bloco 4) |
| Próximo é 2 a 5, sem pasta | "Traga a pasta do ano" | "O sistema lê só os nomes dos arquivos e mostra o que achou para {meses}." | "Trazer a pasta {nome}" (abre o .zip ou rola até a área de soltar) |
| Próximo é 2 a 5, pasta lembrada sem arquivos | "Traga a pasta de novo" | "Lembrei a pasta {raiz}, mas o navegador não guarda os arquivos depois de recarregar a página." | "Trazer a pasta de novo" |
| Próximo é 2 a 5, com arquivos | "Processe {nome do passo}" | "Falta {meses}. Você confere o resultado antes de gravar." | "Processar {meses}" |
| Próximo é 1 | "Calcule o PMPV de {trimestre do ciclo}" | "O CGF usa o PMPV. Falta {meses}." | "Abrir o PMPV de {Fev a Abr}" |
| Próximo é 6 | "Confira o SCG de {meses}" | "Os módulos e o valor gravado não batem." | "Abrir o SCG" |
| Próximo é 7 | "Calcule o SR de {faixa}" | "Usa o VP, o VF, o PR e a SELIC do Banco Central." | "Calcular o SR" (rola até o card) |
| Próximo é 8 ou 9 | "Confira o {PR/PV} de {faixa}" | "Nada é gravado sem a sua confirmação." | "Abrir o {PR/PV}" |
| Nada a fazer porque tudo que resta está bloqueado | "Nada a fazer agora" | motivo do primeiro bloqueio; SELIC aberta: "A SELIC de Jul a Set fecha em {dd/mm}" (de `situacao.selic.fecha_em`) | link do bloqueio |
| Tudo pronto | "Trimestre completo" | "Falta só baixar as entregas." | "Ir para as entregas" |

"Depois:" lista até 3 chaves seguintes, só nomes. "Ver motivo" abre o texto do bloqueio já existente.

### Estados
- **Carregando**: esqueleto do bloco (mesmo formato), sem botão (`EsqueletoBlocos`).
- **Erro ao carregar** (`erro` do Painel): alerta com "Tentar de novo" (hoje não há; `Ciclo/index.tsx:317-319`). O bloco mostra "Não consegui ver a situação do trimestre".
- **Back antigo** (`getSituacaoCiclo` devolve null): cálculo local, como hoje.
- **Trimestre sem dado nenhum**: o primeiro passo é o próximo; texto normal.
- **Celular (390 px)**: o botão ocupa a largura toda; "Depois" e "Ver motivo" descem.

### Aceite
- O bloco "Próximo passo" é o primeiro bloco de ação da página (abaixo só do seletor de trimestre), em desktop e celular.
- Existe exatamente um botão `solid` fora do bloco por tela inicial do Painel: os demais viram `ghost` ou `primary` secundários.
- Para cada linha da tabela acima há um teste em `blocoProximoPasso.test.ts`.
- O botão leva ao lugar certo sem rolagem manual (teste de componente ou verificação no navegador).

---

## 4. Onde se grava: mapa completo e regra única

### Todos os pontos de gravação (lidos do código)
| # | Onde | Botão | O que grava | O que dispara | Confirmação hoje |
|---|---|---|---|---|---|
| 1 | Painel > Processar (`Processar.tsx:320`) | "Gravar N etapa(s)-mês" | CGR, CGF (e RPV), RET, RP de cada mês marcado; o back recalcula o SCG do mês | prévia da cascata (SR, PR, PV) | janela só se substitui valor ou há divergência |
| 2 | Painel > Auditar {mês} (`AuditarMes.tsx:179`) | "Gravar" | CGR de 1 mês (e RPV, SCG) | prévia da cascata | janela sempre |
| 3 | Painel > Comparar com a planilha (`ComparacaoPlanilha.tsx:446`) | "Incluir esta nota" | nota digitada no CGR do mês | CGR, RPV, SCG; prévia da cascata | nenhuma |
| 4 | Telas Auditoria, RET, RP (`AvisoPossivelDuplicata`, `ProvaReal*`) | "Tirar do cálculo" | remove nota ou documento e regrava o valor do mês | SCG; prévia da cascata | confirmação em linha |
| 5 | Painel > card do SR (`SRDoTrimestre.tsx:62`) | "Gravar o SR de {faixa}" | SR dos 3 meses | prévia do PR e do PV | janela sempre, com divergência dita |
| 6 | Painel, aviso geral, ou prévia dentro de 9 telas (`PreviaCascata.tsx:63`) | "Aprovar e gravar" | SR, PR e PV recalculados no servidor (`POST /cascata/aplicar`, com 409 e 422) | nada | o próprio botão |
| 7 | `/scg` (`SCG/index.tsx:178`) | "Salvar SCG de {mês}" | SCG com os 4 valores escolhidos | prévia da cascata | **nenhuma** |
| 8 | `/sr` (`SR/index.tsx:270`) | "Salvar SR do trimestre" | SR com a tabela editável | prévia do PR e do PV | **nenhuma** e sem checagem de divergência |
| 9 | `/pr` (`PR/index.tsx:120`) | "Salvar PR" | PR do trimestre do ciclo | prévia do PV | **nenhuma** |
| 10 | `/pv` (`PV/index.tsx:186`) | "Salvar PV do trimestre" | PV (repete nos 3 meses) | nada | **nenhuma** |
| 11 | `/pmpv` (`PMPV/index.tsx:658`, `:691`) | "Salvar sessão"; "Salvar margem" | sessão e PMPV de cada mês; MB do ano | prévia do PV; recálculo da tarifa média na tela | **nenhuma** |

Sem botão na interface (só API, ok): apagar SCG, `DELETE /pr`, reparar histórico do SCG, SCG manual.
Vocabulário: o Painel diz "Gravar", as telas dizem "Salvar".

### Regra única
> **Quem lê arquivo ou calcula o que vem à frente grava no Painel do Ciclo, no passo dele. As telas dos módulos são de consulta e prova real. Duas telas gravam na própria tela, porque o que se grava é digitação ou decisão e não vem de arquivo: PMPV (preços, volumes, MB) e SCG (escolher gravado × soma).** E toda gravação, onde for, passa pelo mesmo tipo de confirmação.

Aplicação por tela:
| Tela | Papel | Muda |
|---|---|---|
| `/auditoria`, `/cgf`, `/ret`, `/conciliacao`, `/rpv` | consulta | já é; o cabeçalho ganha o botão "Painel do Ciclo" e o estado vazio também (item 5 abaixo). |
| `/scg`, `/pmpv` | trabalho (decisão e digitação) | mantêm o botão, **ganham a janela de confirmação** padrão e o texto "Gravar". Ao voltar, "Voltar ao Ciclo" (já existe). |
| `/sr` | consulta (fase 5) | fase 4: janela de confirmação e a mesma checagem de divergência do card; fase 5: vira consulta e o botão some. Decisão 5. |
| `/pr`, `/pv` | consulta (fase 5) | fase 4: janela de confirmação; fase 5: cards no Painel e as telas viram consulta. |

### Uma só confirmação, sem mentir
Hoje, para um mês limpo (sem substituição nem divergência), já são **2 cliques e 1 decisão real**: "Gravar" e "Aprovar e gravar"; com substituição são 3. As duas decisões existem por motivo e continuam duas:

1. **Decisão A: "grave o que eu li"** (módulos, SCG, SR no Painel). Janela só quando há algo a avisar, como já é no Processar; as telas sem janela passam a ter a mesma regra (nunca a janela vazia).
2. **Decisão B: "aprove o que vem à frente"** (SR, PR, PV recalculados). Vira **um bloco só no Painel**, "Aguardando sua aprovação", alimentado por `GET /cascata/previa?periodos=<meses do trimestre aberto>` (já existe; sem rota nova). O que muda: a prévia **não aparece mais embutida em 9 lugares** (Processar, card do SR, Comparar planilha, "Tirar do cálculo", `/scg`, `/sr`, `/pr`, `/pmpv`, aviso geral); as telas que gravam mostram um toast e uma linha "O SR, o PR e o PV ficaram desatualizados. [Revisar e aprovar no Painel]" (leva ao bloco, com `?aprovar=1`).
3. Texto novo na janela da Decisão A, quando a cascata for afetada: "Depois de gravar, você vai aprovar o SR, o PR e o PV no Painel. Nada à frente é gravado sem isso."

Juntar A e B numa janela só exigiria **simular a cascata antes de gravar os módulos**, o que o back não faz (a prévia calcula sobre o gravado). Não recomendo agora (decisão 4).

### Estados
- Falha parcial no Processar: continua como hoje (tabela com erro por etapa-mês).
- 409 na aprovação: texto atual ("Os dados mudaram desde a prévia. Nada foi gravado.") + "Refazer a prévia", agora dentro do bloco do Painel.
- 422: pendências em lista (já existe), com link para o passo que resolve.
- Sem cascata pendente: o bloco 4 não existe (não ocupa lugar).

### Aceite
- Os 11 pontos usam o mesmo componente de confirmação (`ModalAviso` com título "Gravar {o quê}?" e o resumo Antes × Passa a ser), exceto os que não têm nada a substituir nem a avisar.
- `/sr` recusa gravar com divergência sem a janela "Gravar com divergências".
- Em nenhuma tela a prévia da cascata é renderizada fora do Painel; as outras mostram o link.
- O verbo é "Gravar" em todos os botões (grep de "Salvar" nos botões de `pages/` = 0, exceto "Salvar margem" se mantida).

---

## 5. Telas de consulta (itens 4 e 6c)

### Textos (substituem `proposito` e as `descricao` repetidas; uma fonte só: `modulos.ts`)
| Tela | Texto do cabeçalho |
|---|---|
| Auditoria CGR | "Consulte o CGR gravado de cada mês e abra a conta (prova real). Para ler as notas (NF-e e CT-e) e gravar, use o Painel do Ciclo." |
| CGF | "Consulte o CGF gravado e a conta de cada mês. Para ler as planilhas de NF e gravar, use o Painel do Ciclo." |
| RPV | "O RPV é CGR − CGF e se calcula sozinho quando o CGR e o CGF são gravados. Aqui você só consulta." |
| RET | "Consulte o RET gravado de cada mês e abra a conta. Para ler os PDFs de encargos (EAT e EC) e gravar, use o Painel do Ciclo." |
| RP | "Consulte o RP gravado de cada mês, com todas as notas. Para ler os PDFs de penalidades e gravar, use o Painel do Ciclo." |

As quatro `descricao` soltas nas telas somem; passam a vir de `proposito`. Os textos já eram assim; o ganho é não haver duas verdades.

### Estado vazio (hoje só "Nenhum mês auditado." etc.)
Título: "Nenhum {CGR} gravado ainda." Texto: "O {CGR} é gravado pelo Painel do Ciclo, no passo {2, Auditoria CGR}." Botão: **"Abrir o Painel do Ciclo"** (`ghost` não: `primary`, é a única ação possível), com `?de=ciclo&ciclo=` quando a tela souber o trimestre. Usa o `EmptyState` existente. Vale para Auditoria, CGF, RET, RP.

### Botão no cabeçalho
Nas telas de consulta, `acoes` ganha "Ler e gravar no Painel" (link). Para quem abriu a tela para consultar, ele não atrapalha; para quem veio procurar onde gravar, é a resposta.

### Limpeza
Remover os 7 arquivos mortos (`LeituraDoMes.tsx` x5, `EntradaManual.tsx` x2) e os comentários que os citam. Antes: `grep` confirma zero imports (feito); depois: `tsc` e `eslint` limpos. Funções da API que só eles usavam (`salvarRPV`, `processarCGF` etc.) **ficam** (decisão do José depois, não é desta spec).

### Siglas no ponto de uso (6c)
- Helper puro `siglaNoPrimeiroUso(sigla, jaVistas) -> { texto, dica }`: primeira vez na tela, "RET (Recuperação de Encargos de Transporte)"; depois, "RET" com a dica.
- Componente `<Sigla s="RET" />` que usa o helper e põe `title` + foco por teclado (a dica não pode depender de passar o mouse, a ferramenta é de mesa mas o Painel abre no celular). Verificar em `.heroui-docs` se o `Tooltip` do HeroUI v3 serve; senão `<abbr>` com popover ao tocar.
- Onde: títulos dos passos e dos cartões do Painel, cabeçalhos das telas, avisos de bloqueio ("falta o SCG de Jul" vira "falta o SCG (Saldo da Conta Gráfica) de Jul" só no primeiro). Não vai em tabela densa.

### Aceite
- Nenhum `proposito` de `modulos.ts` diz "Leia" ou "Salve" para tela que não lê nem grava (teste que varre `MODULOS` conferindo o tipo da tela).
- Os 4 estados vazios têm o botão e o texto acima.
- Nenhuma sigla de `GLOSSARIO` aparece em título de passo sem o nome por extenso na primeira ocorrência da tela (teste do helper).

---

## 6. Itens menores

### 6a. Entregas e a planilha (inclui o bug)
- **Corrigir já:** zerar `planilhaRel` ao trocar de trimestre (`irPara`). Um teste de lógica pura ("planilha escolhida num trimestre não vale para outro") em `Ciclo/planilhaDoTrimestre.ts`.
- **Reorganizar:** a planilha oficial do trimestre vira **um campo só**, "Planilha oficial do trimestre (opcional)", no passo 2 (junto de "Comparar com a planilha"), e "Entregas" apenas lê dela. Texto em Entregas: "O relatório compara as notas com a planilha {nome}." ou, sem ela, "Sem planilha, o relatório só confere o sistema com ele mesmo. [Escolher a planilha]" (o botão rola até o passo 2).
- Aceite: trocar de trimestre limpa o nome da planilha em Entregas; o relatório nunca sai com planilha de outro trimestre.

### 6b. Pasta perdida ao recarregar
Mantém o comportamento (limite do navegador, não há como contornar sem o aviso do Chrome). O que muda: o aviso em `Ciclo/index.tsx:515-520` vira o próprio bloco "Próximo passo" com o botão "Trazer a pasta de novo" (seção 3), e o mapa continua mostrando o que foi lembrado, rotulado "pasta lembrada, sem arquivos". Aceite: depois de recarregar, a ação para continuar é um clique visível sem ler texto.

### 6c. Siglas
Ver seção 5.

### 6d. Formato de período
- Uma função só, `rotuloDoPeriodo(meses | chave, tipo)` em `utils/rotulos.ts` (pura), com a regra: mesmo ano "Jul a Set/2026"; anos diferentes "Nov/2026 a Jan/2027". É a `faixaDosMeses` de `avisos.ts:87` movida e generalizada.
- Sempre que as duas grades aparecerem juntas, etiqueta: "Jul a Set/2026 (civil)" e "Nov/2026 a Jan/2027 (ciclo)". Os botões do Painel ("Jan – Mar") e do PR/PV ("Nov - Jan") passam a "Jan a Mar" e "Nov a Jan".
- **Só exibição:** as chaves gravadas (`"Nov - Jan/2027"` no PR, `"Nov - Jan/2026"` no PV) **não mudam**. A tela nunca mostra a chave crua; mostra os meses reais, o que acaba com a dúvida de qual ano é "Nov - Jan".
- Aceite: teste da função para os 8 trimestres (4 civis, 4 do ciclo, incluindo os que cruzam o ano); grep de `" – "` e `" - "` em rótulos de trimestre nas telas = 0.

### 6e. PMPV do trimestre apurado
Dividir o passo 1 em **um item por trimestre do ciclo tocado**, usando `trimestreFiscalDoMes` (já existe e é testado):
```
1  PMPV dos meses apurados
   Fev a Abr/2026 (cobre Abr)     PMPV 2,0944     pronto        [Ver]
   Mai a Jul/2026 (cobre Mai, Jun) falta           [Abrir o PMPV de Mai a Jul]
```
O passo só fica `ok` quando todos os trimestres tocados estão prontos; o link do passo continua abrindo o 1º que falta. Sem back: o dado vem do mesmo `getPMPVMensal` por mês que o Painel já faz. Aceite: **todo** trimestre civil toca dois do ciclo (Jan–Mar: Nov–Jan e Fev–Abr; Abr–Jun: Fev–Abr e Mai–Jul; Jul–Set: Mai–Jul e Ago–Out; Out–Dez: Ago–Out e Nov–Jan), então o passo sempre mostra dois itens; o teste cobre os 4 trimestres civis. Isso mostra que "o PMPV do trimestre apurado" nunca foi uma tarefa só.

---

## 7. Back (Choco)

**Nas fases 1 a 4 nada é obrigatório.** Tudo o que a spec precisa já existe:
- `GET /ciclo/situacao?trimestre=` (estado por passo, `proximo_passo`, `selic.fecha_em`, `pmpv_novo`): `routers/ciclo.py`, `docs/SITUACAO_DO_CICLO.md`.
- `GET /cascata/previa?periodos=…&a_partir_de=&ate=` (aceita qualquer mês, não só os recentes) para o bloco "Aguardando sua aprovação" do trimestre aberto; `GET /cascata/pendente` (só os 4 trimestres mais recentes com SCG) fica para o aviso geral.
- `POST /cascata/aplicar` com `ate` e `esperado` (409 e 422): `routers/cascata.py`.
- `GET /trilha?periodo=&tabela=`: usado nas telas de consulta; não muda.
- Salvar de cada módulo já devolve `cascata` (prévia) sem gravar SR/PR/PV: `routers/auditoria.py:201`, `scg.py:104`, `sr.py:105`, `pr.py:69`, `pmpv.py:77`.

**Opcional, só fase 5 (trazer o back para a mesma lista de 9 passos e tirar do front as 11 chamadas do `carregar`):**
`GET /ciclo/situacao` ganha o campo `etapas` (aditivo; `passos` e `proximo_passo` ficam como estão):
```json
"etapas": [
  { "numero": 1, "chave": "pmpv", "estado": "pronto|atencao|falta|bloqueado",
    "motivo": "frase em português", "rota": "/pmpv",
    "meses_que_faltam": ["Mai/2026"],
    "trimestres_do_ciclo": [{ "rotulo": "Fev a Abr/2026", "pronto": true }] }
]
```
Chaves = as do front (`pmpv, auditoria, cgf, ret, rp, scg, sr, pr, pv`). Testes (pytest, `tests/test_ciclo_situacao.py`): ordem e numeração fixas; estado de cada passo coerente com os históricos gravados; `meses_que_faltam` só nos mensais; `trimestres_do_ciclo` para Abr–Jun devolve 2 e para Jul–Set devolve 2; campo ausente não quebra o front antigo; nenhuma rota nova grava.
Não é necessário se o Leandro quiser manter o cálculo no front; é a forma de ter **uma** fonte também no servidor.

---

## 8. Fases (pequenas e independentes; cada uma termina com `tsc`, `eslint src`, build e `npm test` verdes e comandos de commit prontos)

| Fase | O quê | Quem | Esforço | Risco | Depende de |
|---|---|---|---|---|---|
| **1** | Entrada e textos: `/` -> `/ciclo`, Dashboard em `/visao-geral`, menu na nova ordem (sem números ainda), `proposito` corrigido e `descricao` repetida removida, estados vazios com botão, bugfix 6a (`planilhaRel` zerado ao trocar de trimestre), remoção dos 7 arquivos mortos | José | meio dia | baixo (rotas e texto; nenhum cálculo) | nada |
| **2** | Fonte única: `etapasDoCiclo.ts` + testes; menu numerado; `PageHeader` ("Passo N de 9", botão Painel, setas com `?de=ciclo`); `Painel.etapas()` e "Como funciona" leem dela; `rotulos.ts` (6d) | José | 1 dia | baixo-médio (muitos arquivos, pouca lógica) | 1 |
| **3** | Topo do Painel: bloco "Próximo passo" + `blocoProximoPasso.ts` + testes; nova ordem da página; blocos subordinados aos passos; 6a (campo da planilha), 6b (botão de pasta de novo), 6e (passo PMPV por trimestre do ciclo) | José | 1,5 dia | médio (mexe na tela mais usada; verificar no navegador, claro e escuro, 1280 e 390 px) | 2 |
| **4** | Gravar: janela padrão em `/scg`, `/sr`, `/pr`, `/pv`, `/pmpv`; "Gravar" no lugar de "Salvar"; bloco "Aguardando sua aprovação" único no Painel; telas de gravação mostram toast + link em vez da prévia embutida; `/sr` com a checagem de divergência | José | 1,5 dia | **médio-alto** (mexe em gravação; ver riscos) | 3 |
| **5** | PR e PV como cards do Painel (com prova real e Antes × Novo), `/sr`, `/pr`, `/pv` viram consulta, "Aprovar em sequência" (`aplicar` com `ate`); opcional `etapas` no back | José, Choco (opcional) | 3 a 4 dias | alto | decisões 4 e 5; 4 |

A fase 1 é a primeira porque é barata, reversível e já tira a entrada errada e os textos que mentem. A 4 vem antes da 5 porque corrige o buraco (gravar sem confirmar) sem esperar o item grande.

### Testes por fase (Vitest; módulos puros, sem `react-router` neles)
- F1: teste do mapa de rotas (`/` redireciona; `/visao-geral` existe); teste de `planilhaDoTrimestre`; teste que varre `MODULOS` e acusa `proposito` com "Leia"/"Salve" em tela de consulta.
- F2: `etapasDoCiclo.test.ts` (9 numerados únicos e consecutivos, chaves únicas, rotas começando com `/`, cada chave de `ChavePasso` existe); teste de consistência com `GRUPOS_DO_MENU`; `rotulos.test.ts` (8 trimestres, ano cruzado).
- F3: `blocoProximoPasso.test.ts` (uma linha por situação da tabela da seção 3, mais back antigo e erro); `trimestresDoCicloTocados.test.ts` (Jan–Mar, Abr–Jun, Jul–Set e Out–Dez); `proximoPasso.test.ts` continua como está.
- F4: `confirmarGravacao.test.ts` (quando pede janela: substitui, diverge, nada); teste do texto "Depois de gravar…" só quando a cascata é afetada.
- Verificação visual (F3 e F4) num Chrome isolado, dados fictícios; o relatório diz o que não foi visto.

---

## 9. Riscos e o que NÃO muda

**Não muda:** nenhum cálculo (CGR, CGF, RPV, RET, RP, SCG, SR, PR, PV, PMPV, tarifa média) nem a ordem deles; nenhuma rota do back nas fases 1 a 4; as chaves gravadas de período (`"Nov - Jan/2027"` no PR, `"Nov - Jan/2026"` no PV, `"Jan/2026_Mar/2026"` no SR); a regra **"nada é gravado em mês de ciclo sem o analista conferir a prévia"**: SR, PR e PV continuam só gravando por `POST /cascata/aplicar` ou pelas gravações com janela, sempre com 409 e 422; os dois trimestres (civil e do ciclo) continuam separados, só passam a ter nomes iguais em toda parte.

| Risco | Efeito | Contenção |
|---|---|---|
| Tirar a prévia embutida das telas (fase 4) faz o analista esquecer de aprovar | SR, PR e PV ficam desatualizados | toast **e** linha fixa na tela que gravou; aviso geral no Painel e na Visão geral continua; bloco "Aguardando" sobe para o topo do Painel e conta no "Próximo passo" |
| Mudar a `/` quebra favoritos e a volta do login | tela inesperada | redirecionamento permanente; `/visao-geral` preserva o Dashboard; `de` do login continua valendo |
| Renomear "Salvar" para "Gravar" confunde quem decorou | pequeno | só texto; a regra do "Como funciona" já usa "gravar" |
| Painel mais longo ao subordinar blocos | rolagem | blocos recolhidos por padrão, abrem no passo atual |
| Estado do passo 1 por trimestre do ciclo faz mais chamadas | lentidão | reaproveita as 3 chamadas de `getPMPVMensal` que já existem |
| `utils/periodos.test.ts` já não roda (react-router) | testes novos "passam" sem rodar | módulos novos não importam `react-router`; checar que o `npm test` conta os arquivos novos |
| Remover arquivos mortos | alguém usava por fora | zero imports (grep); o git guarda; `tsc` e `eslint` na saída |
| Fase 5 muda o lugar onde o analista aprova PR e PV | aprovação separada precisa seguir separada | decisão do Leandro de 16/11 (SR, PR e PV com aprovações próprias) é pré-requisito; botões separados, "em sequência" é só atalho |

---

## 10. Decisões para o Leandro

1. **RPV sem número, marcado "calculado sozinho"?** Recomendo **sim**: ele não tem ação do analista. Alternativa: um passo próprio (e o Painel passa a ter uma linha a mais que nunca precisa de clique).
2. **Numeração 1 a 9, com Tarifa média e Entregas em "Ao fechar" (sem número)?** Recomendo **sim**: mantém o Painel como está e alinha menu e cabeçalho a ele.
3. **O Painel do Ciclo vira a página inicial e o Dashboard vira "Visão geral" em `/visao-geral`?** Recomendo **sim**.
4. **Aprovação da cascata em um lugar só (bloco do Painel), com as telas mostrando toast e link, em vez da prévia embutida em 9 telas?** Recomendo **sim**. A alternativa (manter a prévia onde se grava) é mais cômoda no momento e é a causa de a aprovação estar espalhada. Juntar a Decisão A e a B numa janela só exige um simulador novo no back: **não recomendo agora**.
5. **`/sr`, `/pr` e `/pv` viram só consulta (fase 5), com a gravação nos cartões do Painel?** Recomendo **sim**, mas só depois da fase 4 (que já fecha o buraco da gravação sem confirmação). É a pergunta 7 do plano de 16/11 que ficou sem resposta.
6. **Menu: tirar os títulos "Conta Gráfica" e "Módulo 3 · Consolidação" e agrupar por "Passos do trimestre"?** Recomendo **sim**; os nomes de módulo vão para o "Como funciona". Se a ARPE exige ver "Módulo 3" na tela, mantenho como dica ao passar o mouse.
7. **Cabeçalho: manter as setas Anterior/Próxima (agora levando o trimestre) ou trocar por só "Painel do Ciclo"?** Recomendo **trocar**: as setas convidam a ler tela por tela, e quem trabalha segue o Painel. Se preferir manter, entram com `?de=ciclo`.
8. **"Gravar" em vez de "Salvar" em todos os botões?** Recomendo **sim**, é o termo que o Painel já usa e o que o "Como funciona" explica.
9. **Período sempre como "Jul a Set/2026", com a etiqueta "(civil)" ou "(ciclo)" quando as duas grades aparecem juntas?** Recomendo **sim**; as chaves gravadas não mudam.
10. **O passo "PMPV" do Painel vira um item por trimestre do ciclo tocado (Abr–Jun mostra dois)?** Recomendo **sim**; é o que a tela PMPV realmente exige.
11. **Remover os 7 arquivos mortos (2.445 linhas) na fase 1?** Recomendo **sim**; o git guarda. Se quiser guardá-los "por segurança", que fique numa pasta fora de `src/`.
12. **O campo "Planilha oficial do trimestre" passa a ser um só, no passo 2, lido também por Entregas?** Recomendo **sim**; hoje a planilha de outro trimestre pode alimentar o relatório oficial sem aviso.

Perguntas que não fiz porque a resposta é técnica: a posição exata dos blocos recolhidos, o nome do componente `Sigla` e se a dica usa `Tooltip` ou `abbr`. Decido na implementação, com o `impeccable` para o polimento visual.
