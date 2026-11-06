> **Status backend:** `GET /pv/{periodo}`, `POST /pv/salvar`, `GET /pv/periodos`
> já implementados e testados (`Src/api/routers/pv.py`, `ServicosPV`). Falta
> 1 endpoint novo: `POST /pv/periodos` (expõe `ServicosPV.criar_periodo`,
> já implementado no Service, só não roteado) — necessário para o botão
> "Novo período" (§3.1).

# Spec — Módulo PV (`src/pages/PV/index.tsx`)

Referente à task:

> ## 4. PV — CRÍTICO
> - [ ] Reconstruir a página inteira — hoje são só 3 StatCards estáticos.
> - [ ] Seletor de Período + botão "Novo período".
> - [ ] Botão "Carregar do Banco de Dados", campos PMPV e PR editáveis.
> - [ ] Fórmula `PV = PMPV + PR` (já correta no mock, precisa virar cálculo real).
> - [ ] Histórico de PV por período.
> - [ ] Botões: "Salvar PV no banco", "Excel Final (Módulo 9)", "Atualizar histórico".

Base factual: `Src/Views/tela_pv.py` (fonte de verdade de UX/fluxo) +
`Src/Services/servicos_pv.py` (`ServicosPV`) + `Src/api/routers/pv.py`
(endpoints já implementados).

Este é o módulo mais simples entre os que ainda faltam reconstruir (PR, PV,
RPV) — sem trimestre, sem decomposição, sem SR anterior. Dois campos, uma
soma.

---

## 1. Por que isso é crítico

A página atual (`PV/index.tsx`) é só 3 `StatCard` estáticos com valores
fixos — igual ao estado anterior de PR, sem nenhum input real.

## 2. Fórmula

```
PV = PMPV + PR
```

- **PMPV** = preço médio mensal (R$/m³), salvo no módulo PMPV
  (`pmpv_mensal`).
- **PR** = preço regulatório final (R$/m³), salvo no módulo PR
  (`pr_resultados`).

Fórmula pura: `ServicosPV.calcular_pv(pmpv, pr) = (pmpv or 0) + (pr or 0)`.
Sem casos especiais (diferente de PR, que zera quando VP=0).

## 3. Layout / fluxo de UI (espelhando `tela_pv.py`)

### 3.1 Barra de período
- **Combo Período**: lista todos os períodos existentes na consolidação
  (`GET /pv/periodos`). Ao trocar de período, dispara `_ao_mudar_periodo`:
  busca dados salvos (`GET /pv/{periodo}`) e preenche os campos PMPV/PR se
  existirem.
- Botão **"➕ Novo período"**: abre um prompt pedindo o nome do período
  (ex: "Dez/2025" ou "Jan/2026"), cria via `POST /pv/periodos`
  (**endpoint novo**, ver §5), recarrega a lista e seleciona o novo período.

### 3.2 Fonte dos valores
- Botão **"⚡ Carregar do Banco de Dados"**: busca `GET /pv/{periodo}` para
  o período selecionado.
  - Se não houver período selecionado: aviso "Selecione um período primeiro."
  - Se os dados vierem com `pmpv == 0 && pr == 0`: aviso "Nenhum valor
    encontrado para '{periodo}'. Execute os módulos PMPV e PR e salve no banco."
  - Caso contrário: preenche os campos e mostra confirmação com os 3 valores
    (PMPV, PR, PV).
- Botão **"🗑 Limpar"**: zera os campos PMPV e PR e o resultado.

### 3.3 Dois cards de input lado a lado
- **Card PMPV** (borda azul): subtítulo "Preço médio mensal (R$/m³)",
  campo único "PMPV (R$/m³)", 4 casas decimais, editável.
- **Card PR** (borda roxa): subtítulo "Preço regulatório final (R$/m³)",
  campo único "PR (R$/m³)", 4 casas decimais, editável.
- Ambos recalculam o resultado em tempo real ao digitar.

### 3.4 Resultado
Card em destaque: **"PV = PMPV + PR = {valor formatado, 4 casas}"**
- Cor condicional: verde se PV > 0, vermelho se PV < 0, âmbar se = 0.

### 3.5 Botões de ação
- **"💾 Salvar PV no banco"**: valida que há período selecionado e que ao
  menos um dos 2 valores é diferente de zero; persiste via
  `POST /pv/salvar` com `{periodo, pmpv, pr}`; mostra resumo (PMPV, PR, PV).
- **"➕ Excel Final (Módulo 9)"**: mesma validação, persiste e depois chama
  fluxo de exportação — **fora de escopo** desta task (mesmo tratamento
  dado a SR e PR: desabilitar com tooltip).
- **"🔄 Atualizar histórico"**: recarrega a lista de histórico (§3.6).

### 3.6 Histórico de PV por período
Lista/tabela read-only: Período, PMPV, PR, PV, Atualizado em.
Fonte: `GET /pv/periodos` (retorna `list[dict]` já com os campos completos,
diferente de PR que só retorna `list[str]` — conferir formato exato no
smoke test antes de implementar, ver §6).

⚠️ **Auto-save silencioso**: igual a SR e PR, o Tkinter salva
automaticamente a cada recálculo (`_recalcular`, ao final), se houver
período selecionado e algum valor não-zero. **Decisão** (mesma já tomada
para SR e PR): não replicar — persistência só via clique explícito em
"Salvar PV no banco".

---

## 4. Diferenças em relação a PR/SR (mais simples)

- Sem seleção de trimestre — período é uma string livre (mês/ano ou
  trimestre, dependendo de como o usuário nomeou ao criar).
- Sem decomposição mês a mês — é sempre um único período, um único cálculo.
- Sem "SR anterior" ou campos múltiplos — só 2 inputs.

## 5. Endpoint novo necessário

`POST /pv/periodos` → `{nome: string}` → 201, sem corpo (ou retorna o nome
criado).
- Fonte: `ServicosPV.criar_periodo(nome)` (já implementado — delega a
  `ServicosConsolidacao().criar_periodo(nome.strip())`).
- Router: adicionar em `Src/api/routers/pv.py`.
- Sem Use Case novo necessário.

## 6. Contrato de tipos TS

```ts
// PVResultado já existe em types/index.ts: { pmpv, pr, pv } — sem mudança.

export interface PVPeriodoHistorico {
  periodo: string;
  pmpv: number;
  pr: number;
  pv: number;
  data_atualizacao: string | null;
}
```

⚠️ Confirmar no smoke test se `GET /pv/periodos` já retorna esses campos
completos (o router hoje devolve `list[dict]` de `ServicosPV.obter_periodos`,
que na verdade delega a `ServicosConsolidacao().obter_periodos()` — isso
retorna os períodos da **consolidação geral**, não necessariamente com PMPV/PR/PV
preenchidos). Se vier incompleto, o front precisa buscar `GET /pv/{periodo}`
para cada período do histórico (N+1 chamadas) ou aceitar mostrar só o nome
do período na lista de histórico, sem os valores — decidir durante a
implementação, com base no que a API realmente devolve.

## 7. Fora de escopo (mesmo tratamento de SR e PR)
- "Excel Final (Módulo 9)": desabilitado com tooltip.
- Auto-save silencioso: não replicado.

## 8. Definition of Done
- [ ] Backend: `POST /pv/periodos` implementado e testado contra
      `pmpv_data.db` real.
- [ ] Front: `PV/index.tsx` reconstruído com todos os campos (§3), sem
      nenhum resquício de `StatCard` estático.
- [ ] Front: seletor de período + criar novo período.
- [ ] Front: "Carregar do Banco de Dados" com os 2 avisos condicionais
      (sem período selecionado / sem dados encontrados).
- [ ] Front: recálculo local em tempo real (`PMPV + PR`).
- [ ] Front: histórico de PV por período — formato confirmado contra a API
      real antes de implementar (§6).
- [ ] Sem auto-save silencioso (§3.6, decisão já tomada nos módulos anteriores).
- [ ] `types/index.ts` com `PVPeriodoHistorico` se necessário (conforme §6).
- [ ] `tsc --noEmit` e `vite build` limpos nos arquivos tocados.
- [ ] Smoke test manual contra `pmpv_data.db` real (já há períodos com PV
      salvo, confirmado indiretamente nas specs anteriores de PR/SCG).
