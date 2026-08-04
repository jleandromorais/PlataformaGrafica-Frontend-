> **Status backend (2026-08-04):** os 4 endpoints do §4 estão implementados
> e smoke-testados contra `pmpv_data.db` real (`Src/api/routers/sr.py`):
> `POST /sr/trimestre/carregar`, `POST /sr/trimestre/calcular`,
> `POST /sr/trimestre/salvar`, `GET /sr/trimestre?label=...` (query param, não
> path — barras do formato "Jan/2026_Mar/2026" quebrariam um path param).
> `SRRepository` (port), `SqliteSRRepository` e `SRUseCases` também prontos.
> Pendente: front (`SR/index.tsx`, §3) e a decisão sobre auto-save
> silencioso (§3.5).

# Spec — Módulo SR (`src/pages/SR/index.tsx`)

Referente à task:

> ## 1. SR — CRÍTICO (`src/pages/SR/index.tsx`)
> - [ ] Remover breakdown mockado por CGR/CGF/RPV — não faz parte da fórmula real.
> - [ ] Reconstruir com os campos reais por mês: VP (m³), VF (m³), PR (R$/m³), SELIC mensal (%), SR anterior (R$).
> - [ ] Implementar fórmula real: diferença = VP − VF; SR parcela = diferença × PR;
>       SR c/SELIC = SR_parcela × (1 + SELIC%) + SR_anterior; total = soma dos 3 meses.
> - [ ] Trimestre customizável (ano + combo mês 1/2/3) — hoje fixo em Jan-Mar.
> - [ ] Adicionar seletor "Carregar VP e VF do banco" (sessão PMPV) + botão recarregar.
> - [ ] Botões: "Calcular SR", "Salvar no BD", "Excel Final (Módulo 9)", "Limpar".

Base factual: `Src/Views/tela_sr.py` (fonte de verdade de UX/fluxo) +
`Src/Database/database.py` (`salvar_sr`, `salvar_sr_trimestre`,
`buscar_sr_trimestre`, `listar_sr_trimestres`, `buscar_sr`,
`listar_sessoes_com_volumes`, `carregar_dados_mes`, `buscar_cgf_resumo`) +
`Src/Services/servicos_sr.py` (`ServicosSR`, hoje só cobre sessão VP/VF, não
o trimestre).

---

## 1. Por que isso é crítico

O `SR/index.tsx` atual mostra um breakdown por **CGR/CGF/RPV** — campos que
**não existem** na fórmula real de SR. O cálculo verdadeiro usa **VP, VF, PR,
SELIC mensal e SR anterior**, por mês, dentro de um trimestre. Isso não é uma
falta de integração — é um modelo de dados inventado que precisa ser
descartado, não estendido.

## 2. Fórmula (fonte: `tela_sr.py`, `TelaSR._calcular`)

Por mês, dentro do trimestre selecionado:

```
diferenca  = VP − VF
sr_parcela = diferenca × PR
sr_selic   = sr_parcela × (1 + SELIC% / 100) + SR_anterior
```

`SR TOTAL` = soma de `sr_selic` dos 3 meses do trimestre.

Cabeçalho da tela original resume assim:
`SR = (VP − VF) × PR × (1 + SELIC) + SR anterior`.

## 3. Layout / fluxo de UI (espelhando `tela_sr.py`)

### 3.1 Painel "Carregar VP e VF do banco"
- **Combo "Sessão PMPV"**: lista sessões salvas no módulo PMPV, formato
  label: `{nome}  —  VP: {vp formatado}  [{data_criacao curta}]`.
  Fonte: `GET /sr/sessoes` (já existe no backend, `ServicosSR.listar_sessoes`).
- Botão **"⚡ Carregar VP/VF"**: para a sessão selecionada, preenche cada
  linha de mês do trimestre com:
  - `VP` = soma de `volume` de `carregar_dados_mes(sessao_id, mes_index)` (mês 1/2/3 da sessão PMPV)
  - `VF` = `volume_final` de `cgf_resumo` do período correspondente (0 se não houver)
  - `PR` = `pr` salvo em `sr_resultados` para o período; se zero e VP > 0,
    fallback calculado como `(SCG_do_periodo + SR_do_periodo) / VP`
  - Dispara recálculo automático ao final.
- Botão **"🔄"**: recarrega a lista de sessões (`GET /sr/sessoes`).

### 3.2 Seleção de trimestre
- Campo **Ano** (input numérico, texto livre, aceita 2 ou 4 dígitos — igual
  ao padrão usado em outros módulos).
- 3 combos de mês (**Mês 1, Mês 2, Mês 3**), valores de `MESES_ABREVS`
  (`Jan..Dez`), com defaults `Jan/Fev/Mar` — mas livremente combináveis
  (diferente do PMPV, aqui não há restrição de trimestre fixo).
- Botão **"Aplicar trimestre"**: reconstrói as 3 linhas de mês com os labels
  calculados (mês/ano), tratando virada de ano quando o mês seguinte tem
  índice menor que o anterior (ex.: Nov→Dez→Jan cruza o ano).
- Lógica de rótulo de período (replicar exatamente,
  `TelaSR._get_trimestre_labels`):
  ```
  para cada mes na lista [m1, m2, m3]:
    idx = índice do mês em MESES_ABREVS
    se i > 0 e idx < idx_do_mes_anterior: ano_atual += 1
    label = "{mes}/{ano_atual}"
  ```

### 3.3 Linhas de mês (uma por mês do trimestre)
Cabeçalho: nome do mês (label calculado, ex. "Jan/2026").
Campos editáveis por linha:
| Campo | Tipo | Placeholder |
|---|---|---|
| VP (m³) | number | 0,00 |
| VF (m³) | number | 0,00 |
| PR (R$/m³) | number | 0,0000 |
| SELIC mensal (%) | number | 0,0000 |
| SR anterior (R$) | number | 0,00 |

Campo calculado (read-only): **SR parcela (R$)** = `sr_selic` do mês, cor
condicional (verde se > 0, vermelho se < 0, âmbar se = 0).
Recalcula em tempo real a cada edição de qualquer campo da linha (debounce
opcional, mas o Tkinter original recalcula a cada tecla).

### 3.4 Resultado total
Card em destaque: **"SR TOTAL = {valor formatado}"** (cor condicional igual
às linhas) + linha de detalhe mostrando o SR de cada mês
(`"Jan/2026: R$ X   |   Fev/2026: R$ Y   |   Mar/2026: R$ Z"`).

### 3.5 Botões de ação
- **"⚡ Calcular SR"**: recalcula todas as linhas + total (mesma lógica do
  recálculo automático — o botão existe para forçar recálculo mesmo sem
  editar campos, ex. após carregar do banco).
- **"💾 Salvar no BD"**: pede período de referência (input/modal, default =
  label do último mês do trimestre), então persiste:
  - `sr_resultados` do período total (VP/VF somados, PR=0, SR=total)
  - `sr_resultados` de cada mês individual (VP, VF, PR, SR do mês)
  - `sr_trimestre` (todas as linhas do trimestre, upsert por `trimestre+mes`)
- **"➕ Excel Final (Módulo 9)"**: mesmo fluxo de persistência do "Salvar",
  mais chamada de exportação/registro de execução do Excel consolidado.
  Bloqueado se todas as linhas tiverem VP=0 e VF=0 (mostrar aviso).
- **"🗑 Limpar"**: reseta as linhas do trimestre atual (reaplica trimestre
  vazio) e zera o total.

⚠️ **Auto-save silencioso**: o Tkinter original salva automaticamente em
`sr_resultados`/`sr_trimestre` a cada recálculo, sem confirmação, se
qualquer linha tiver VP ou VF > 0 (`TelaSR._calcular`, ao final). Decidir com
o negócio se o front replica esse comportamento (risco de sobrescrever dados
sem o usuário perceber) ou se transforma isso em uma ação explícita
("Salvar rascunho automaticamente" com indicador visual, por exemplo). Não
implementar auto-save silencioso sem essa decisão.

---

## 4. Bloqueio de backend — este módulo não pode ser só front

`GET /sr/sessoes`, `GET /sr/sessoes/{id}/vp-vf` e `POST /sr/calcular` (SR de
UM mês, puro) **já existem** (`Src/api/routers/sr.py`, implementados na
rodada anterior). Mas a página inteira depende de **SR-trimestre**, que
ainda não tem endpoint — está marcado como `TODO(spec §4.10/§5.5)` em
`Src/api/routers/sr.py` e `SPEC_BACKEND_FASTAPI.md`.

Falta criar, antes de conectar esta página de verdade:

1. **`SRRepository` (port, `Src/domain/ports/repositories.py`)**: estender
   com `salvar_sr_trimestre(trimestre, meses)`, `buscar_sr_trimestre(trimestre)`,
   `listar_sr_trimestres()`, `salvar_sr(periodo, vp, vf, pr, sr)`,
   `buscar_sr(periodo)`, `buscar_cgf_resumo(periodo)`, `carregar_dados_mes(sessao_id, mes)`.
2. **`SqliteSRRepository`**: implementar os métodos acima (wrappers finos
   sobre `DatabasePMPV`, mesmo padrão de `SqliteConsolidacaoRepository`).
3. **`SRUseCases` (novo, `Src/application/use_cases/sr_use_cases.py`)**:
   - `calcular_trimestre(labels_meses, linhas) -> list[dict]` — aplica a
     fórmula (§2) linha a linha, retorna os 10 campos de `sr_trimestre`
     (`mes, vp, vf, pr, selic_mensal, diferenca, sr_parcela, sr_selic, sr_anterior, total`).
   - `carregar_vp_vf_pr(sessao_id, labels_meses) -> list[dict]` — replica
     `TelaSR._carregar_do_banco` (soma volume por mês da sessão PMPV, busca
     `cgf_resumo.volume_final`, busca/calcula PR de fallback).
   - `salvar_trimestre(trimestre_label, periodo_referencia, linhas_calculadas)` —
     replica `TelaSR._salvar` (grava total + cada mês em `sr_resultados`,
     grava `sr_trimestre`).
4. **Endpoints novos** (`Src/api/routers/sr.py`) — ✅ implementados:
   - `POST /sr/trimestre/carregar` — `{sessao_id, labels_meses}` →
     `list[{mes, vp, vf, pr}]` (usa `carregar_vp_vf_pr`).
   - `POST /sr/trimestre/calcular` — `{linhas: [{mes, vp, vf, pr, selic_mensal, sr_anterior}]}`
     → `{linhas: [...calculadas], total}` (usa `calcular_trimestre`, sem persistir).
   - `POST /sr/trimestre/salvar` — `{labels_meses, periodo_referencia, linhas}`
     → `{total}` (usa `salvar_trimestre`).
   - `GET /sr/trimestre?label={trimestre_label}` — retorna linhas salvas
     (`buscar_sr_trimestre`), para reabrir um trimestre já calculado. Usa
     query param (não path param) porque `trimestre_label` contém `/`
     (ex: `Jan/2026_Mar/2026`), que quebraria o roteamento como segmento de path.

Este trabalho de backend é pré-requisito funcional desta task — sem ele o
componente React pode ser construído (UI, cálculo local para feedback
imediato), mas os botões "Carregar do banco", "Salvar no BD" e "Excel Final"
ficam sem endpoint para chamar.

---

## 5. Contrato de tipos TS (substituindo o `SRResultado` atual em `types/index.ts`)

```ts
// Remove o formato antigo baseado em CGR/CGF/RPV.
export interface SRLinhaMes {
  mes: string;            // label "Jan/2026"
  vp: number;
  vf: number;
  pr: number;
  selic_mensal: number;
  sr_anterior: number;
  // calculados (read-only, vêm do backend):
  diferenca?: number;
  sr_parcela?: number;
  sr_selic?: number;
  total?: number;
}

export interface SRSessaoPMPV {
  id: number;
  nome: string;
  data_criacao: string;
  vp: number;
  vf: number;
}

export interface SRTrimestreResultado {
  trimestre_label: string;   // ex: "Jan/2026_Mar/2026"
  linhas: SRLinhaMes[];
  total: number;
}
```

## 6. Definition of Done desta task
- [x] Backend: `SRRepository` estendido + `SqliteSRRepository` + `SRUseCases`
      + 4 endpoints novos de trimestre (ver §4), testados contra `pmpv_data.db`
      real (`GET /sr/trimestre?label=Jan/2026_Mar/2026` retornou os 3 meses
      salvos hoje no banco; `POST /sr/trimestre/calcular` validado manualmente
      contra a fórmula; `POST /sr/trimestre/carregar` testado com sessão real).
- [ ] Front: `SR/index.tsx` reconstruído com os campos reais (§3), sem
      nenhum resquício de CGR/CGF/RPV.
- [ ] Front: trimestre customizável (ano + 3 combos de mês livres).
- [ ] Front: carregar sessão PMPV → preencher VP/VF/PR automaticamente.
- [ ] Front: cálculo local em tempo real (feedback imediato) usando a mesma
      fórmula do backend — decidir se o cálculo "ao vivo" roda no cliente
      (replicando a fórmula em TS) ou sempre via `POST /sr/trimestre/calcular`
      (mais fiel à fonte única, mas depende de round-trip a cada tecla).
      Recomendação: replicar a fórmula em TS para feedback instantâneo, mas
      usar sempre o backend como fonte de verdade no momento de salvar.
- [ ] Decisão tomada e documentada sobre auto-save silencioso (§3.5, nota).
- [ ] `types/index.ts` atualizado conforme §5, sem quebrar outras páginas
      que não referenciam `SRResultado` hoje (confirmar grep antes de remover).
