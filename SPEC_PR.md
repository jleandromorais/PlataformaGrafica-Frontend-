> **Status backend:** `GET /pr/{periodo}`, `POST /pr/trimestral`,
> `POST /pr/salvar`, `GET /pr/periodos` já implementados e testados
> (`Src/api/routers/pr.py`, `ServicosPR`). Falta 1 endpoint novo:
> `GET /pr/sr-anteriores` (expõe `PRRepository.listar_sr`, hoje só usado
> internamente) — necessário para popular os campos de SR anterior (§4).
> Sem endpoint novo para "Excel Final" (mesmo caso do SR — depende de
> `registrar_execucao_excel_final`/`ExcelConsolidado`, fora de escopo, ver §7).

# Spec — Módulo PR (`src/pages/PR/index.tsx`)

Referente à task:

> ## 3. PR — CRÍTICO
> - [ ] Reconstruir a página inteira — hoje são só 3 StatCards estáticos.
> - [ ] Campos: seletor Trimestre + Ano, botão "Carregar Trimestre do Banco",
>       SCG (R$) editável, SR atual, 4 campos de SR anteriores (2º SR anterior,
>       1º SR anterior mês 1/2, SR adicional), VP (m³) editável.
> - [ ] Implementar fórmula real: `PR = Σ (SCG_m + SR_m) / VP_m` (mês a mês, normalizado).
> - [ ] Tabela de decomposição trimestral (SCG_m, SR_m, VP_m por mês).
> - [ ] Histórico de PR por período.
> - [ ] Botões: "Salvar PR no banco", "Excel Final", "Atualizar histórico", "Limpar".

Base factual: `Src/Views/tela_pr.py` (fonte de verdade de UX/fluxo) +
`Src/Services/servicos_pr.py` (`ServicosPR`) + `Src/api/routers/pr.py`
(endpoints já implementados).

---

## 1. Por que isso é crítico

A página atual (`PR/index.tsx`) é só 3 `StatCard` estáticos com valores
fixos — não é um formulário, não calcula nada, não tem nenhum input. É a
página com maior gap entre "o que existe" e "o que o negócio usa" (junto com
PV e RPV).

## 2. Fórmula

```
PR = (SCG + ΣSR) / VP
```

- **SCG** = saldo da conta gráfica (com SELIC) do trimestre atual.
- **ΣSR** = SR atual do trimestre + soma dos SRs de até 4 trimestres
  anteriores (rótulos fixos, ver §4).
- **VP** = volume prospectivo total do trimestre.

Quando carregado do banco (botão "Carregar Trimestre do Banco"), o PR usa a
fórmula **normalizada mês a mês**, mais precisa que a fórmula simples acima:

```
PR = Σ (SCG_m + SR_m) / VP_m   (para cada um dos 3 meses do trimestre)
```

Isso já está implementado no backend (`ServicosPR.buscar_dados_trimestral`,
exposto em `POST /pr/trimestral`) — o front não recalcula essa fórmula, só
exibe o resultado (`dados.pr`) e a decomposição mês a mês (`dados.meses`).

A fórmula simples (`PR = (SCG + ΣSR) / VP`) só é usada para o **recálculo em
tempo real** enquanto o usuário edita os campos manualmente, antes de
carregar do banco ou depois de ajustar valores — replicar
`ServicosPR.calcular_pr` (`(scg + sr) / vp`, ou `0.0` se `vp == 0`), que já
está exposta no schema de PR (mesma fórmula usada no back).

## 3. Layout / fluxo de UI (espelhando `tela_pr.py`)

### 3.1 Seleção de trimestre
- **Combo Trimestre**: valores de `TRIMESTRES_FISCAIS` (`Nov - Jan`, `Fev - Abr`,
  `Mai - Jul`, `Ago - Out`) — consumir via `GET /config/trimestres-fiscais`
  (já existe), não hardcode (mesmo princípio já aplicado em outras specs).
  Default: trimestre que contém o mês atual (replicar
  `next(k for k, v in TRIMESTRES.items() if mes_idx in v)`).
- **Campo Ano**: input numérico, default = ano atual.
- Botão **"⚡ Carregar Trimestre do Banco"**: dispara o fluxo completo do §4.
- Botão **"🗑 Limpar"**: zera todos os campos e o resultado.

### 3.2 Bloco SCG
- Campo único **"SCG (R$)"**, editável, recalcula PR em tempo real ao digitar.

### 3.3 Bloco ΣSR — SR atual + 4 SRs anteriores
Campos, nesta ordem exata (rótulos do Tkinter):
1. **SR atual (trimestre em cálculo) R$** — preenchido automaticamente ao
   carregar do banco (soma dos SRs dos 3 meses do trimestre selecionado).
2. **2º SR anterior (ex: NOV/25–JAN/26) R$**
3. **1º SR anterior — mês 1 (ex: FEV/26) R$**
4. **1º SR anterior — mês 2 (ex: MAR/26) R$**
5. **SR adicional R$**

Todos editáveis, todos recalculam PR em tempo real ao digitar.
Abaixo do bloco: label **"Saldo Total a Recuperar: {SCG + ΣSR formatado}"**
(cor verde se ≥ 0, vermelho se < 0).

### 3.4 Bloco VP
- Campo único **"VP (m³)"**, editável, recalcula PR em tempo real ao digitar.

### 3.5 Resultado
Card em destaque: **"PR = (SCG + ΣSR) / VP = {valor formatado, 4 casas}"**
- Cor condicional: âmbar se VP=0 (com aviso "⚠ VP = 0 → PR = 0"), verde se
  PR > 0 (aviso "▲ Resultado positivo"), vermelho se PR < 0
  (aviso "▼ Resultado negativo").

### 3.6 Decomposição trimestral (só aparece após "Carregar Trimestre do Banco")
Tabela com colunas: Período | SCG (R$) | SR (R$) | VP (m³) | Parcela PR.
Uma linha por mês do trimestre (`dados.meses`), + linha de rodapé com
"PR TRIMESTRAL" = `dados.pr`.

### 3.7 Botões de ação
- **"💾 Salvar PR no banco"**: valida que ao menos um dos 3 valores (SCG,
  ΣSR, VP) é diferente de zero; persiste via `POST /pr/salvar` com
  `{periodo: trimestre_label, scg, sr: soma_sr, vp}`; mostra resumo
  (SCG, SR atual, SRs anteriores, ΣSR total, saldo total, VP, PR).
- **"➕ Excel Final (Módulo 9)"**: mesma validação, persiste e depois chama
  fluxo de exportação — **fora de escopo** desta task (ver §7, mesmo
  tratamento dado ao SR: desabilitar com tooltip).
- **"🔄 Atualizar histórico"**: recarrega a lista de histórico (§3.8).
- (Limpar já coberto em §3.1)

### 3.8 Histórico de PR por período
Lista/tabela read-only com todos os períodos salvos: Período, SGR/SCG, SR,
VP, PR, Atualizado em. Fonte: `GET /pr/periodos` + buscar detalhe de cada um,
ou preferencialmente adicionar um endpoint que já retorne a lista completa
formatada (ver §5 — `gerar_texto_historico` do Service já monta isso como
texto, mas o front deveria consumir dados estruturados, não texto pré-formatado).

⚠️ **Auto-save silencioso**: igual ao SR, o Tkinter salva automaticamente o
PR trimestral ao carregar do banco (`_carregar_trimestre`, ao final), sem
confirmação. **Decisão** (mesma tomada no SR, `SPEC_SR.md` §3.5): não
replicar auto-save silencioso — persistência só via clique explícito em
"Salvar PR no banco".

---

## 4. Fluxo "Carregar Trimestre do Banco" (detalhado)

1. Calcula os 3 períodos do trimestre selecionado (`{mes}/{ano}`, com Nov/Dez
   pertencendo ao ano anterior do trimestre fiscal — mesma lógica de
   `labels_trimestre` já implementada em `sr_use_cases.py`, mas usando
   `TRIMESTRES_FISCAIS` em vez de livre escolha de meses).
2. Chama `POST /pr/trimestral` com `{periodos}` → preenche SCG, VP, SR atual
   com os totais retornados (`dados.scg`, `dados.vp`, `dados.sr`).
3. Chama `GET /pr/sr-anteriores` (**endpoint novo**, ver §5) → filtra os SRs
   cujo período não está nos 3 meses do trimestre atual → preenche os 4
   campos de SR anterior com os primeiros 4 resultados (0 se não houver).
4. Preenche a tabela de decomposição (§3.6) com `dados.meses`.
5. Se `scg == 0 && sr == 0 && vp == 0`: mostrar aviso "Nenhum valor
   encontrado no banco para os meses selecionados. Execute SCG e SR e salve
   no banco primeiro." (sem bloquear a tela).
6. Se `dados.meses_sem_vp` não vazio: mostrar aviso "Os meses a seguir não
   têm VP cadastrado: {lista}. A parcela foi calculada usando o VP total do
   trimestre como fallback."

## 5. Endpoint novo necessário

`GET /pr/sr-anteriores` → `list[{periodo: string, sr: number}]`
- Fonte: `PRRepository.listar_sr()` (já implementado, usado internamente por
  `ServicosPR.obter_todos_periodos`, mas nunca exposto como rota própria).
- Router: adicionar em `Src/api/routers/pr.py`.
- Sem Use Case novo necessário — é leitura direta do repositório já pronto.

## 6. Contrato de tipos TS (novo, `types/index.ts`)

```ts
export interface PRMesDecomposicao {
  periodo: string;
  scg: number;
  sr: number;
  vp: number;
  parcela_pr: number;
  vp_sem_dado: boolean;
}

export interface PRTrimestralResultado {
  scg: number;
  sr: number;
  vp: number;
  pr: number;
  meses: PRMesDecomposicao[];
  meses_sem_vp: string[];
}

export interface PRSrAnterior {
  periodo: string;
  sr: number;
}

// PRResultado (já existe em types/index.ts) permanece igual:
// { periodo?, scg, sr, vp, pr } — usado por GET /pr/{periodo}.
```

## 7. Fora de escopo (mesmo tratamento do SR)
- "Excel Final (Módulo 9)": botão presente na UI, desabilitado com tooltip
  explicando a dependência (`registrar_execucao_excel_final` +
  `ExcelConsolidado`, infraestrutura de exportação não implementada no
  backend). Não fingir que funciona.
- Auto-save silencioso: não replicado (§3.7, decisão já tomada).

## 8. Definition of Done
- [ ] Backend: `GET /pr/sr-anteriores` implementado e testado contra
      `pmpv_data.db` real.
- [ ] Front: `PR/index.tsx` reconstruído com todos os campos (§3), sem
      nenhum resquício de `StatCard` estático.
- [ ] Front: trimestre via `GET /config/trimestres-fiscais` (não hardcode).
- [ ] Front: fluxo "Carregar Trimestre do Banco" completo (§4), incluindo os
      dois avisos condicionais (sem dados / meses sem VP).
- [ ] Front: tabela de decomposição trimestral (§3.6).
- [ ] Front: histórico de PR por período (§3.8), como dados estruturados
      (não reaproveitar `gerar_texto_historico` — texto pré-formatado não é
      reutilizável numa tabela React sem parsing).
- [ ] Front: recálculo local em tempo real usando `ServicosPR.calcular_pr`
      (fórmula simples), com o backend (`POST /pr/trimestral`) como fonte de
      verdade ao carregar do banco.
- [ ] Decisão sobre auto-save já tomada e aplicada (§3.7 — sem auto-save).
- [ ] `types/index.ts` atualizado conforme §6.
- [ ] `tsc --noEmit` e `vite build` limpos nos arquivos tocados.
- [ ] Smoke test manual: `POST /pr/trimestral` com trimestre real do banco
      (`pmpv_data.db` já tem dados de SCG/SR salvos, confirmado em specs
      anteriores) retorna decomposição não vazia.
