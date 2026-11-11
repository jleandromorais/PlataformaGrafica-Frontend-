# Spec — Painel do Ciclo: planilha conferida, diferenças amigáveis e Auditoria antes do SR

Data: 11/11/2026 · Status: **aprovado pelo Leandro em 11/11/2026** (decisões na seção 6)
Time: **José** (front — React + HeroUI + /impeccable) · **Choco** (back — FastAPI; é o antigo Luiz, o agente foi renomeado)

---

## 0. Ponto de partida (o que já existe, commits de hoje)

| Já tem | Onde | Por que não basta |
|---|---|---|
| Toast "Planilha carregada" | `src/pages/Ciclo/CompararPlanilha.tsx:186` | Aparece **só ao escolher o arquivo**, sem abrir a planilha. Diz "carregada" mesmo se ela estiver errada, corrompida ou sem a aba do mês. |
| Toast da pasta do ciclo (verde/amarelo) | `src/pages/Ciclo/index.tsx:82` | Ok, fica como está. É o modelo a seguir. |
| Contadores clicáveis ("Só na planilha", "Valor diferente"…) | `src/pages/Auditoria/ComparacaoPlanilha.tsx:132-161` | Só os contadores. O resumo, a tabela do CGR, os supridores e o toast de diferença não levam a lugar nenhum. |
| Resumo em linguagem simples | `src/pages/Auditoria/comparacaoResumo.ts` | Ainda é seco e técnico ("Há divergências" em vermelho, "Auditoria − planilha", "alíquota", "OCR") e não diz **o que fazer**. |
| Ordem do Painel | `src/pages/Ciclo/index.tsx:479-487` | Hoje: Importar pasta → **SR** → Comparar planilha → Etapas. A Auditoria aparece depois do SR. |

---

## 1. Avisar com toast quando a planilha subiu certinho

**Dono:** Choco (endpoint) → José (tela). 

### Comportamento
1. O analista escolhe a planilha (.xlsx).
2. Aparece "Conferindo a planilha…" (spinner no lugar do nome do arquivo) e o servidor **abre** a planilha, sem auditar nada e sem gravar.
3. Resultado em toast + uma linha fixa abaixo do nome do arquivo:

| Situação | Toast | Linha na tela |
|---|---|---|
| Abriu e tem os 3 meses do trimestre | ✅ verde: **"Planilha pronta para comparar"** · "Achei Jul, Ago e Set/2026 (modelo por nota)." | "✓ Jul · ✓ Ago · ✓ Set" |
| Abriu, mas falta mês | ⚠ amarelo: **"Planilha lida, mas falta Set/2026"** · "Dá para comparar Jul e Ago." | "✓ Jul · ✓ Ago · ✗ Set (sem aba)" |
| Não abriu / não é a planilha da Conta Gráfica | ❌ vermelho: **"Não consegui abrir esta planilha"** · motivo do servidor | Mensagem + botão "Escolher outra" |

4. Os botões "Comparar Jul / Ago / Set" ganham o mesmo ✓/✗; mês sem aba fica desabilitado com o motivo no `title`.
5. Trocar de trimestre com a planilha já escolhida refaz a conferência (sem novo upload, se o arquivo ainda estiver na memória).

### Back (Choco)
- `POST /auditoria/planilha/conferir` — multipart: `planilha`, `meses` (ex.: `Jul/2026,Ago/2026,Set/2026`).
- Reaproveita a leitura que `_comparar` já faz (`Src/api/routers/auditoria.py:62`), sem itens de nota.
- Resposta:
  ```json
  { "ok": true, "modelo": "por_nota", "modelo_rotulo": "…",
    "meses": [{ "periodo": "Jul/2026", "tem": true, "abas": ["JUL-26"], "qtd_notas": 42 }],
    "aviso": null }
  ```
- Erro de leitura → 200 com `ok: false` e `aviso` em português (mesmo texto que hoje vai para `planilhaIlegivel`). Nada de 500.
- Testes: planilha boa, planilha sem um mês, arquivo que não é .xlsx, xlsx de outra coisa.

### Front (José)
- `src/api/index.ts`: `conferirPlanilha(planilha, meses)` + tipo em `src/types`.
- `CompararPlanilha.tsx`: estado `conferencia` (`conferindo | pronta | parcial | erro`); trocar o `avisarSucesso("Planilha carregada")` pelo toast do resultado.
- Teste unitário da função que monta título/descrição do toast a partir da resposta.

**Aceite:** o toast verde só aparece quando o servidor realmente abriu a planilha e achou os meses.

---

## 2. Mensagem de diferença muito mais amigável

**Dono:** José (texto e tela) · Choco revisa os textos que vêm prontos do back (`explicacoes`, `motivos`, `explicacao`, veredito).

### Princípios do texto
1. **Primeiro a calma:** "Nada foi gravado. Isto é só uma conferência."
2. **Depois o tamanho:** quanto e para que lado, em uma frase.
3. **Depois o porquê**, agrupado, em até 3 itens (o resto em "ver mais").
4. **Sempre um próximo passo** em botão.
5. Vermelho só para dinheiro que não fecha; o resto é âmbar. Nunca "DIVERGENTE" em maiúsculas.

### Antes → depois
| Hoje | Proposta |
|---|---|
| Selo vermelho "Há divergências" | "**3 pontos para conferir**" (âmbar) / "**Tudo confere**" (verde) |
| "O CGR das notas está R$ 12.340,00 abaixo da planilha." | "**As notas somam R$ 12.340,00 a menos que a planilha em Set/2026.** Quase tudo (R$ 12.000,00) vem de 2 notas da TAG que estão na planilha mas não vieram na pasta." |
| "Auditoria − planilha" (coluna) | "Diferença (notas − planilha)" |
| "TAG: 2 notas estão na planilha e não vieram nos arquivos (R$ 12.000,00)." | "**Faltam 2 notas da TAG na pasta** (R$ 12.000,00). Elas estão na planilha. → *Ver as notas* · *Incluir no CGR*" |
| "Só a alíquota difere (CGR igual)" | "Mesmo valor nos dois lados; só a alíquota foi escrita diferente. **Não muda o total.**" |
| "Confira estes PDFs (3)" | "3 PDFs foram lidos por imagem (OCR) e podem ter erro de leitura. → *Ver quais*" |
| "R$ 340,00 da diferença não aparece nas notas listadas: veja a conferência por supridor." | "R$ 340,00 não se explica pelas notas. Costuma ser arredondamento ou nota lançada em outro mês. → *Ver por supridor*" |
| `OndeDifere` (Auditar mês): "Diferença de R$ X para o gravado. Onde está:" | "**Lendo de novo, o CGR de Set ficou R$ X diferente do que está gravado.** Veja onde:" |

### Estrutura nova do quadro (topo de `ComparacaoPlanilha`)
```
┌──────────────────────────────────────────────────────────────┐
│ ⚠ 3 pontos para conferir em Set/2026      Nada foi gravado.  │
│ As notas somam R$ 12.340,00 a menos que a planilha.          │
│                                                              │
│ • Faltam 2 notas da TAG na pasta (R$ 12.000,00)    [Ver →]   │
│ • 1 nota com valor diferente (R$ 340,00)           [Ver →]   │
│ • 3 PDFs lidos por imagem, confira                 [Ver →]   │
│                                                              │
│ [Ver todas as diferenças]   [Comparar de novo]               │
└──────────────────────────────────────────────────────────────┘
```

### Onde mexer
- `comparacaoResumo.ts`: `Resumo.itens` deixa de ser `string[]` e vira `{ texto, valor?, gravidade: "dinheiro" | "conferir", secao }` (a `secao` liga com o item 2.1). Testes em `comparacaoResumo.test.ts` atualizados.
- `ComparacaoPlanilha.tsx`: novo cabeçalho do resumo, rótulos das tabelas, cores.
- `CompararPlanilha.tsx` → `avisarResultado`: mesmo tom ("Set/2026: 3 pontos para conferir").
- `Processar.tsx` → `OndeDifere`: mesmo padrão de frase.
- Choco: revisar no back as frases de `explicacoes`/`motivos` (sem jargão, sem maiúsculas, com sujeito "as notas"/"a planilha").

**Aceite:** um analista que nunca viu a tela entende, só pelo topo, quanto deu de diferença, por quê e o que clicar.

---

## 2.1 Cards interativos: clicou no erro, foi para o erro

**Dono:** José.

### Regra única
> **Todo card, linha ou item que mostra um problema é clicável e leva direto ao detalhe dele** (rola, abre o que estiver fechado e destaca por ~2 s). Card sem problema não é clicável.

### Mapa de cliques
| Onde o usuário clica | Vai para |
|---|---|
| Item do resumo (ex.: "Faltam 2 notas da TAG") | Lista "Só na planilha", **filtrada pela TAG** |
| Contadores (já existe) | Mesmo comportamento, agora com o hook comum |
| Linha da tabela do CGR com diferença | "Mostrar diferenças" dos supridores, **já aberto** |
| Supridor com diferença na conferência por supridor | O cartão "Por que difere" daquele supridor |
| Toast "tem diferenças" | Botão **"Ver diferenças"** no toast (`actionProps` da HeroUI) → rola até o quadro |
| Card verde **"Batem"** | Lista "Notas que conferem" (fechada por padrão, abre ao clicar). **Exceção aprovada** à regra "só problema é clicável" |

> Fora desta entrega (decisão do Leandro): o ⚠ dos chips do Painel continua abrindo a tela da etapa sem `?foco=diferencas`.

### Back para o card "Batem" (Choco)
Hoje a comparação devolve só `qtd_em_ambas` (número). Acrescentar `notas_em_ambas: [{ empresa, tipo, numero, linha_excel, cgr_liquido, cgr_planilha }]` na resposta (`Src/Services/comparador_conta_grafica.py` e `comparador_modelo_alexandre.py`, passando por `routers/auditoria.py`). Campo novo e opcional: front antigo continua funcionando. Front: tipo em `src/types/index.ts:164` e nova seção `"batem"` no hook.

### Como
- Extrair `abrirSecao`/`realce` (`ComparacaoPlanilha.tsx:36-49`) para um hook `useIrParaSecao()` em `src/components/ui/`, usado na Comparação e no toast.
- O toast chama o mesmo hook: o quadro de comparação expõe o id da seção raiz.
- Acessibilidade: `<button>` de verdade, `aria-label` "… Mostrar quais", foco vai para o título da seção ao chegar, `prefers-reduced-motion` desliga a rolagem suave.

**Aceite:** a partir de qualquer número/frase de problema, no máximo **1 clique** até ver as notas responsáveis.

---

## 3. Auditoria vem antes do SR

**Dono:** José. Mudança só de ordem em `src/pages/Ciclo/index.tsx:479-487`.

Ordem proposta do Painel (segue a ordem real do ciclo):
1. Período (ano / trimestre)
2. Importar da pasta do ciclo
3. **Comparar com a planilha (Auditoria)** ← sobe
4. **SR do trimestre** ← desce
5. Etapas do ciclo + Entregas

- Manter as `key` com prefixo (`comparar-…`, `sr-…`): o comentário da linha 480 explica o bug de card duplicado.
- O texto de `CompararPlanilha` ("Terminado o ciclo, confira…") muda para "Antes de seguir para o SR, confira o CGR de um mês contra a planilha…".

**Aceite:** abrindo o Painel, a Auditoria aparece antes do SR, em desktop e celular.

---

## 4. Ordem de execução

| Fase | O quê | Quem | Depende de |
|---|---|---|---|
| A | Item 3 (ordem) | José | — (rápido, sai primeiro) |
| B | Endpoint `planilha/conferir` + `notas_em_ambas` na comparação + testes | Choco | — (em paralelo com A) |
| C | Item 2 (textos + `Resumo.itens` com `secao`) | José | — |
| D | Item 2.1 (hook + cliques + toast com ação; card "Batem" quando B estiver pronto) | José | C (e B para "Batem") |
| E | Item 1 no front (toast real da planilha + ✓/✗ nos meses) | José | B |
| F | Revisão de textos do back | Choco | C |

Ao fim de cada fase: `npm run build`, `npm test`, `npm run lint` no front (`pytest` no back) e os comandos git prontos no chat para o Leandro commitar.

## 5. Fora do escopo
- Mudar como a comparação é calculada (só texto, ordem e navegação).
- Telas RET, RP, SCG (o padrão de clique pode ir para elas depois).
- Toast da pasta do ciclo (já está bom).
- `?foco=diferencas` vindo do ⚠ do Painel (fica para depois).
- Checklist de "marcar como conferido".

## 6. Decisões do Leandro (11/11/2026)
1. **Ordem:** só trocar Comparar ↔ SR. Etapas continuam no fim.
2. **Item 1:** rota nova no back (`/auditoria/planilha/conferir`); toast verde só com a planilha realmente aberta.
3. **Tom:** calmo e guiado: âmbar, "N pontos para conferir", "Nada foi gravado", um botão de próximo passo por motivo, vermelho só onde o dinheiro não fecha.
4. **Cliques:** quadro da comparação inteiro + toast com "Ver diferenças" + card "Batem" (abre as notas que conferem). ⚠ do Painel fica fora.
