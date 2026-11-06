> **Status backend (2026-08-04):** `GET /api/dashboard?ano=` já implementado
> e testado contra `pmpv_data.db` real (`Src/api/routers/dashboard.py` +
> `Src/application/use_cases/dashboard_use_cases.py`), retornando o modelo
> correto (CGR/RET/CGF/RP/RPV/SCG mensais + PMPV). Esta task é **só front**.

# Spec — Dashboard (`src/pages/Dashboard/index.tsx`)

Referente à task:

> ## 2. Dashboard — CRÍTICO
> - [ ] Realinhar modelo de dados ao `dashboard_resumo.py`: indicadores reais
>       são CGR, RET, CGF, RP, RPV, SCG mensais + PMPV — não "parcela de
>       recuperação"/"SR total"/"cobertura do SCG".
> - [ ] Filtro de Ano + botão recarregar.
> - [ ] 6 KPI cards "Último Mês" com variação % vs mês anterior.
> - [ ] Gráfico de linha: PMPV mensal.
> - [ ] Gráfico de linha: SCG mensal com linha de referência zero.
> - [ ] Gráfico de barras: CGR vs CGF por período.
> - [ ] Gráfico de barras empilhadas: composição do SCG por trimestre.
> - [ ] Decidir se "parcela de recuperação"/"SR" merece dashboard próprio.
> - [ ] Remover `mockDashboard.ts` só depois do modelo corrigido.

Base factual: `Src/Views/dashboard_resumo.py` (fonte de verdade de UX/regra) +
`Src/api/routers/dashboard.py` + `Src/api/schemas/dashboard.py` (contrato já
implementado) + estado atual de `src/pages/Dashboard/index.tsx` e
`src/data/mockDashboard.ts` (a serem substituídos).

---

## 1. Por que isso é crítico

A página atual mostra "Saldo a recuperar", "Parcela de recuperação",
"SR total", "Cobertura do SCG" e "Média histórica" — nenhum desses conceitos
existe em `dashboard_resumo.py`. São indicadores dos módulos PR/SR
disfarçados de dashboard principal. O dashboard real do Tkinter é centrado
em **6 indicadores mensais** (CGR, RET, CGF, RP, RPV, SCG) + a série de
**PMPV mensal**, com filtro de ano.

## 2. Contrato de API (já pronto, backend não precisa de mudanças)

```
GET /api/dashboard?ano=2026   (ano é opcional — omitido = "Todos os anos")
```

```ts
interface KpiMensal {
  periodo: string;         // "Jan/2026"
  cgr: number;
  ret: number;
  cgf: number;
  rp: number;
  rpv: number;
  scg: number;
  variacao_scg_pct: number | null; // vs mês anterior, só no ultimo_mes
}

interface SeriePonto {
  periodo: string;
  valor: number;
}

interface DashboardResponse {
  ano_filtro: string | null;
  ultimo_mes: KpiMensal | null;
  historico: KpiMensal[];      // ordenado cronologicamente
  serie_pmpv: SeriePonto[];
  serie_scg: SeriePonto[];
}
```

⚠️ O backend hoje **não** retorna a composição trimestral (§5 abaixo) nem os
dados brutos para o gráfico de barras CGR×CGF — mas `historico` já contém
tudo necessário para montar os três gráficos no front (ver §5, §6, §7): não
é preciso endpoint novo, é agregação client-side sobre `historico`.

## 3. Layout geral (espelhando `dashboard_resumo.py`, adaptado a web)

```
┌─────────────────────────────────────────────────────────────┐
│ 📊 Dashboard                          Ano: [Todos os anos ▾] [🔄] │
│ Período mais recente: Jul/2026                                │
├─────────────────────────────────────────────────────────────┤
│ ÚLTIMO MÊS                                                     │
│ [CGR] [RET] [CGF] [RP] [RPV] [SCG]   ← 6 KPI cards            │
├─────────────────────────────────────────────────────────────┤
│ EVOLUÇÃO HISTÓRICA                                             │
│ [Gráfico linha: PMPV mensal]  [Gráfico linha: SCG mensal]     │
│ [Gráfico barras: CGR vs CGF por período]                       │
│ [Gráfico barras empilhadas: composição SCG por trimestre]     │
└─────────────────────────────────────────────────────────────┘
```

Duas seções nomeadas exatamente como no Tkinter (`_secao("ÚLTIMO MÊS", ...)`,
`_secao("EVOLUÇÃO HISTÓRICA", ...)`), cada uma com uma faixa/label de seção.

## 4. Seção "Último mês" — 6 KPI cards

Cada card (fonte: `PainelResumo._kpi_card` / `_atualizar_kpis`):
- Ícone + título: 🔍 CGR, ⚡ RET, 📋 CGF, 📄 RP, 🧾 RPV, 💼 SCG.
- Valor formatado em BRL (usar `brl()` já existente em `utils/format.ts`).
- Linha de variação: `▲ +X,X% vs {periodo_anterior}` (verde) ou
  `▼ -X,X% vs {periodo_anterior}` (vermelho), calculada como
  `(atual - anterior) / abs(anterior) * 100`. Omitir se não houver mês
  anterior ou se o valor anterior for zero (evita divisão por zero —
  já tratado no backend: `variacao_scg_pct` vem pronto para SCG, mas os
  outros 5 KPIs (CGR/RET/CGF/RP/RPV) precisam da mesma conta no front,
  comparando `historico[historico.length-1]` com `historico[historico.length-2]`).
- Se `ultimo_mes` for `null` (nenhum período calculado): mostrar estado
  vazio "Nenhum período calculado ainda", sem os 6 cards.

## 5. Gráfico de linha — PMPV mensal (R$/m³)

- Fonte: `serie_pmpv` (já vem pronta da API).
- Eixo Y formatado com 4 casas decimais (padrão PMPV, ver `brl(v, 4)` se o
  helper suportar, ou formatação manual `R$ ${v.toFixed(4)}`).
- Tooltip mostrando período + valor.
- Sem linha de referência zero (PMPV não cruza zero na prática).

## 6. Gráfico de linha — SCG mensal

- Fonte: `serie_scg` (já vem pronta da API).
- **Com linha de referência zero** (`ReferenceLine y={0}`) — replicar o
  padrão já usado no gráfico atual de "Parcela de Recuperação" (`Dashboard/index.tsx`
  linha ~227), que já tem exatamente esse componente Recharts pronto para
  reaproveitar.
- Cor sugerida: roxo/violeta (paleta `_COR_M3 = "#8e44ad"` no Tkinter).

## 7. Gráfico de barras — CGR vs CGF por período

- Fonte: `historico` (mapear `{periodo, cgr, cgf}` de cada item).
- Barras agrupadas (não empilhadas), duas séries: CGR (azul) e CGF (verde).
- Usar `recharts` `<BarChart>` com duas `<Bar dataKey="cgr">` / `<Bar dataKey="cgf">`.
- Legenda visível (CGR / CGF).

## 8. Gráfico de barras empilhadas — composição do SCG por trimestre

Esse é o único gráfico que exige **agregação client-side** não trivial —
replicar `PainelResumo._agrupar_trimestres` (fonte: `dashboard_resumo.py`
linhas 466-482):

```ts
import { TRIMESTRES_CIVIS } from — buscar via GET /config/trimestres-civis (já existe)
// ou hardcode local temporário, mas preferir consumir o endpoint de config
// para não duplicar a regra de negócio (mesmo princípio da task de PMPV/RET).

function agruparTrimestres(historico: KpiMensal[], trimestresCivis: {label: string, meses: string[]}[]) {
  const porMes = new Map(historico.map(h => [h.periodo, h]));
  const anos = [...new Set(historico.map(h => Number(h.periodo.split("/")[1])))].sort();
  const resultado = [];
  for (const ano of anos) {
    for (const tri of trimestresCivis) {
      const periodosTri = tri.meses.map(m => `${m}/${ano}`);
      const itens = periodosTri.map(p => porMes.get(p)).filter(Boolean) as KpiMensal[];
      if (!itens.length) continue;
      resultado.push({
        trimestre: `${tri.label} ${ano}`,
        cgr: itens.reduce((s, i) => s + i.cgr, 0),
        ret: itens.reduce((s, i) => s + i.ret, 0),
        rp:  itens.reduce((s, i) => s + i.rp, 0),
        rpv: itens.reduce((s, i) => s + i.rpv, 0),
      });
    }
  }
  return resultado;
}
```

- Empilhado: CGR + RET + RP + RPV (nessa ordem, de baixo para cima — igual
  ao Tkinter, `segmentos = [("CGR", ...), ("RET", ...), ("RP", ...), ("RPV", ...)]`).
- Rótulo do total (= SCG do trimestre) acima de cada barra.
- Cores (já validadas no Tkinter, paleta categórica): CGR `#3987e5`, RET
  `#c98500`, RP `#9085e9`, RPV `#199e70`.
- Usar `<BarChart>` do Recharts com `stackId="scg"` nas 4 `<Bar>`.

## 9. Filtro de Ano

- Componente `<Select>` (já existe em `components/ui/Input.tsx`) com opção
  "Todos os anos" + anos distintos presentes em `historico`. Abordagem mais
  simples: chamar `GET /dashboard` sem filtro uma vez no mount para
  descobrir os anos disponíveis a partir de `historico`, e refazer a chamada
  com `?ano=X` a cada mudança de seleção.
- Botão "🔄 Recarregar" — refaz a chamada atual (mesmo `ano` selecionado).

## 10. Decisão: onde vão "Parcela de recuperação" / "SR"

A task original pede para decidir isso com o negócio. Meu entendimento após
mapear PR e SR como módulos próprios (`SPEC_SR.md`, `Front_end/TASKS.md` §3
e §4): esses indicadores **não pertencem ao Dashboard principal** — eles já
têm páginas dedicadas (PR, SR). Recomendação: remover completamente do
Dashboard nesta task (não criar um dashboard secundário agora — isso é
escopo novo, não parte desta correção). Se o usuário validar que quer um
resumo rápido de PR/SR em algum lugar, isso vira uma task separada
explicitamente escopada, não um apêndice desta.

## 11. Arquivos a alterar

- **`src/data/mockDashboard.ts`**: apagar (só depois do novo modelo estar
  funcionando — ver Definition of Done).
- **`src/types/index.ts`**: substituir `DashboardData` pelo novo formato
  (`KpiMensal`, `SeriePonto`, `DashboardResponse` — espelhando §2).
- **`src/api/index.ts`**: `getDashboard` já existe
  (`api.get<DashboardData>('/dashboard/${periodo}')`) mas usa path errado —
  o endpoint real é `GET /dashboard?ano=`, sem período no path. Corrigir
  assinatura: `getDashboard(ano?: string)`.
- **`src/pages/Dashboard/index.tsx`**: reescrever do zero seguindo §3-§9.

## 12. Definition of Done
- [ ] `types/index.ts` com `KpiMensal`/`SeriePonto`/`DashboardResponse`
      substituindo `DashboardData` (grep antes de remover — confirmar que
      nada mais no front referencia o formato antigo).
- [ ] `api/index.ts`: `getDashboard(ano?: string)` batendo em `GET /dashboard`
      com query param, não mais path param.
- [ ] Front: 6 KPI cards com variação % (§4).
- [ ] Front: gráfico de linha PMPV mensal (§5).
- [ ] Front: gráfico de linha SCG mensal com linha zero (§6).
- [ ] Front: gráfico de barras CGR vs CGF (§7).
- [ ] Front: gráfico de barras empilhadas composição SCG por trimestre (§8),
      usando `GET /config/trimestres-civis` (já existe) em vez de hardcode.
- [ ] Front: filtro de Ano + botão recarregar (§9).
- [ ] Nenhum resquício de "parcela de recuperação"/"SR total"/"cobertura do
      SCG" no Dashboard (§10 — decisão tomada: remover, não substituir por
      dashboard secundário nesta task).
- [ ] `mockDashboard.ts` removido.
- [ ] `tsc --noEmit` e `vite build` limpos nos arquivos tocados.
- [ ] Smoke test manual: `GET /api/dashboard` real retorna dado (já
      confirmado nesta sessão — 13 meses de histórico em `pmpv_data.db`),
      página carrega sem erro no navegador com backend rodando.
