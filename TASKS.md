# Tasks — Front-end (React + Vite + TS)

Fonte de verdade de negócio: `Src/Views/tela_*.py` (telas Tkinter atuais) +
`Src/Services/servicos_*.py` (cálculos). O front React precisa ficar
**fiel a essas views** — campos, fluxos, fórmulas e ações — antes de qualquer
integração com o backend FastAPI. Auditoria feita em 2026-08-04 comparando
cada `Src/Views/tela_*.py` com a página React correspondente encontrou
divergências estruturais, não só ausência de integração real.

Gravidade por módulo:

| Módulo | Estado | Gravidade |
|---|---|---|
| SR | Breakdown usa campos (CGR/CGF/RPV) que **não existem** na fórmula real (VP/VF/PR/SELIC) | Crítica |
| Dashboard | Modelo de indicadores diferente do Tkinter (parcela/SR inventados vs CGR/RET/CGF/RP/RPV/SCG real) | Crítica |
| PR | Só 3 cards estáticos, fórmula não implementada | Crítica |
| PV | Só 3 cards estáticos, zero interatividade | Crítica |
| RPV | Só visualização, sem inputs | Alta |
| CGF | Muito simplificado: faltam configs, abas, VP, logs | Alta |
| Auditoria | Sem seleção de empresas dinâmica, sem soma trimestral, sem divergências | Alta |
| SCG | Falta modo Trimestral, dados mockados | Média-Alta |
| RET | Fórmula ok mas taxa PIS/COFINS hardcoded (risco), faltam abas/colunas | Média-Alta |
| PMPV | Funcional mas fórmulas mock, faltam popups/importação real | Média |
| Conciliação | Próxima do Tkinter, faltam Excel Final e badge OCR | Média |

## Design system (transversal)
Spec detalhada (paleta semântica, componentes a extrair, priorização):
`SPEC_DESIGN_SYSTEM.md`. Achado principal: não há design system — cada
página escolhe cores/tamanhos "no olho", sem fonte única. Prioridade
sugerida: (1) paleta semântica, (2) extrair `<Alert>`/`<EmptyState>`,
(3) `Table` com footer, (4) toast de confirmação. Executar em paralelo com
as tasks de módulo abaixo, não como bloco isolado no fim.

## 0. Pré-requisito
- [x] Backend FastAPI parcial no ar (`Src/api/`, rodar com
      `uvicorn Src.api.main:app --reload --port 8080` a partir de
      `plataforma-conta-grafica/`). Prontos: PMPV (básico), SCG, PR, PV,
      RPV, SR-sessão, Dashboard, Config. **Pendente**: CGF, Auditoria,
      Conciliação, RET, SR-trimestre, PMPV-trimestre-ativo,
      PMPV-importar-memoria — exigem Repository/Use Case novos (ver
      `plataforma-conta-grafica/SPEC_BACKEND_FASTAPI.md` §5 e §8).
      Front deve copiar `.env.example` → `.env` (já criado) para apontar
      `VITE_API_URL=http://localhost:8080/api`.

## 1. SR — CONCLUÍDO (`src/pages/SR/index.tsx`)
Spec detalhada (layout, fluxo, fórmula, gap de backend, contrato de tipos): `SPEC_SR.md`.
Backend (4 endpoints em `Src/api/routers/sr.py`) e front implementados e
testados (tsc + vite build limpos nos arquivos tocados).
- [x] Remover breakdown mockado por CGR/CGF/RPV — **não fazia parte da fórmula real**.
- [x] Reconstruir com os campos reais por mês: VP (m³), VF (m³), PR (R$/m³),
      SELIC mensal (%), SR anterior (R$).
- [x] Implementar fórmula real: `diferença = VP − VF`; `SR parcela = diferença × PR`;
      `SR c/SELIC = SR_parcela × (1 + SELIC%) + SR_anterior`; total = soma dos 3 meses.
- [x] Trimestre customizável (ano + combo mês 1/2/3).
- [x] Adicionar seletor "Carregar VP e VF do banco" (sessão PMPV) + botão recarregar.
- [x] Botões: "Calcular SR", "Salvar no BD", "Limpar". "Excel Final (Módulo 9)"
      deixado desabilitado com tooltip — depende de fluxo de exportação/registro
      de execução ainda não implementado no backend (fora do escopo desta task).
      Decisão tomada: sem auto-save silencioso (diferente do Tkinter original) —
      persistência só via clique explícito em "Salvar no BD".

## 2. Dashboard — CONCLUÍDO (`src/pages/Dashboard/index.tsx`)
Spec detalhada: `SPEC_DASHBOARD.md`. Backend e front implementados e
testados (tsc + vite build limpos; smoke test contra `pmpv_data.db` real
com 13 meses de histórico).
- [x] Realinhar modelo de dados ao `dashboard_resumo.py`: indicadores reais são
      CGR, RET, CGF, RP, RPV, SCG mensais + PMPV — não "parcela de recuperação"/"SR total"/"cobertura do SCG" (conceitos removidos, não existiam nesta tela).
- [x] Adicionar filtro de Ano (com opção "Todos os anos") + botão recarregar.
- [x] 6 KPI cards "Último Mês": CGR, RET, CGF, RP, RPV, SCG com variação % vs mês anterior (▲/▼).
- [x] Gráfico de linha: PMPV mensal (R$/m³).
- [x] Gráfico de linha: SCG mensal com linha de referência zero.
- [x] Gráfico de barras: CGR vs CGF por período.
- [x] Gráfico de barras empilhadas: composição do SCG por trimestre (CGR + RET + RP + RPV), agregado client-side via `GET /config/trimestres-civis`.
- [x] Decisão tomada (SPEC_DASHBOARD.md §10): "parcela de recuperação"/"SR"
      removidos do Dashboard — já têm páginas próprias (PR, SR); nenhum
      dashboard secundário criado nesta task.
- [x] `mockDashboard.ts` removido, junto com `components/Dashboard.tsx`
      (componente órfão não referenciado por nada, também usava o mock).

## 3. PR — CONCLUÍDO (`src/pages/PR/index.tsx`)
Spec detalhada: `SPEC_PR.md`. Backend (novo endpoint `GET /pr/sr-anteriores`)
e front implementados e testados (tsc + vite build limpos; smoke test
contra `pmpv_data.db` real).
- [x] Reconstruir a página inteira — antes eram só 3 StatCards estáticos.
- [x] Campos: seletor Trimestre + Ano, botão "Carregar Trimestre do Banco",
      SCG (R$) editável, SR atual, 4 campos de SR anteriores (2º SR anterior,
      1º SR anterior mês 1/2, SR adicional), VP (m³) editável.
- [x] Implementar fórmula real: `PR = Σ (SCG_m + SR_m) / VP_m` (mês a mês,
      normalizado) via `POST /pr/trimestral`; recálculo local em tempo real
      usa a fórmula simples `(SCG+ΣSR)/VP`, igual ao Tkinter.
- [x] Tabela de decomposição trimestral (SCG_m, SR_m, VP_m por mês).
- [x] Histórico de PR por período (via `GET /pr/periodos`).
- [x] Botões: "Salvar PR no banco", "Atualizar histórico", "Limpar". "Excel
      Final" desabilitado com tooltip — mesma pendência de infraestrutura de
      exportação do módulo SR (fora de escopo). Sem auto-save silencioso
      (mesma decisão do SR).

## 4. PV — CONCLUÍDO (`src/pages/PV/index.tsx`)
Spec detalhada: `SPEC_PV.md`. Backend (novo endpoint `POST /pv/periodos`) e
front implementados e testados (tsc + vite build limpos; smoke test contra
`pmpv_data.db` real, incluindo criação/limpeza de período de teste).
Durante a implementação corrigi um bug transversal: `GET /{modulo}/{periodo}`
em PR, PV, RPV e SCG quebrava com períodos no formato "Mes/Ano" (path param
não decodifica `%2F`) — todos migrados para query param `?periodo=`, mesmo
padrão já usado em SR. `POST /scg/calcular` também tinha um bug separado
(duplicidade de `periodo` no retorno), corrigido junto.
- [x] Reconstruir a página inteira — antes eram só 3 StatCards estáticos.
- [x] Seletor de Período + botão "Novo período".
- [x] Botão "Carregar do Banco de Dados", campos PMPV e PR editáveis.
- [x] Fórmula `PV = PMPV + PR` — cálculo real via `POST /pv/salvar`,
      recálculo local em tempo real.
- [x] Histórico de PV por período (lista de nomes; `GET /pv/periodos` não
      retorna PMPV/PR/PV agregados, só o período — confirmado no smoke test,
      documentado em SPEC_PV.md §6).
- [x] Botões: "Salvar PV no banco", "Atualizar histórico". "Excel Final"
      desabilitado com tooltip (mesma pendência de SR/PR). Sem auto-save
      silencioso (mesma decisão).

## 5. RPV — ALTA (`src/pages/RPV/index.tsx`)
- [ ] Adicionar inputs: seletor de mês/ano + botão "Aplicar", campos CGR e CGF editáveis.
- [ ] Botão "Carregar do Banco de Dados".
- [ ] Indicador de sinal (▲ CGR>CGF / ▼ CGR<CGF / = Equilíbrio).
- [ ] Histórico de RPV por período.
- [ ] Botões: "Salvar RPV no banco", "Excel Final (Módulo 9)", "Atualizar histórico".
- [ ] Fórmula `RPV = CGR − CGF` já está correta, só falta virar interativa.

## 6. CGF — ALTA (`src/pages/CGF/index.tsx`)
- [ ] Seletor visual de período (grade de meses + navegação de ano) em vez de texto livre.
- [ ] Campos de configuração: "Coluna CFOP (opcional)", "Coluna volume canceladas",
      "Coluna volume devoluções".
- [ ] Campo PMPV manual + botão "Carregar do banco".
- [ ] Estrutura em abas: Resumo / Configuração / Logs.
- [ ] Painel de log de processamento.
- [ ] Exibir a fórmula completa: `Volume Final = Faturado − Canceladas − Devoluções − Consumo Próprio`
      (hoje só mostra "Volume Cancelado", falta Devoluções e Consumo Próprio).
- [ ] Mostrar VP mensal/trimestral.
- [ ] Botão "Adicionar ao Excel Final (Módulo 9)" — ausente.

## 7. Auditoria — ALTA (`src/pages/Auditoria/index.tsx`)
- [ ] Seletor de mês/ano em grade visual com navegação de ano.
- [ ] Indicador de status OCR ("🟢/🔴 Tesseract ativo/inativo").
- [ ] Lista dinâmica de empresas detectadas na pasta, com checkboxes de seleção.
- [ ] Radio "Conta Gráfica" / "Outra planilha" para tipo de Excel de comparação.
- [ ] Painel "CGR Apurado" com 3 cards: Bruto total / ICMS deduzido / CGR Líquido
      (hoje só mostra NF-e, CT-e, CGR líquido — falta ICMS deduzido separado).
- [ ] Painel "Soma Trimestral" (3 meses + total).
- [ ] Seção de divergências (notas só na auditoria vs só na planilha).
- [ ] Corrigir cálculo do CGR líquido: no negócio real considera apenas empresas
      que "integram CGR" (ex. TAG, Mastergás), deduz PIS/COFINS + ICMS, e trata
      devoluções como valores negativos — hoje o front só soma `cgr_liquido` bruto dos itens.
- [ ] Mostrar coluna PIS/COFINS na tabela de itens (hoje só mostra ICMS).

## 8. SCG — MÉDIA-ALTA (`src/pages/SCG/index.tsx`)
- [ ] Adicionar modo "Trimestral" (além de Automático/Manual) — tabela mensal
      detalhada com CGR, CGF, RPV, RET, RP, SCG por mês + total.
- [ ] Botão "Usar trimestre ativo" (carrega trimestre salvo pelo módulo PMPV).
- [ ] Badges dinâmicos por linha (BD / Manual / Calc) — hoje fixo em "BD".
- [ ] Botão "Excluir" período.
- [ ] Botão "Retirar Excel Final" (remove execução ativa).
- [ ] Conectar dados reais via `_buscar_dados_fontes`-equivalente: CGR de
      auditoria (respeitando regra de "empresas que integram CGR"), CGF de
      consolidação, RP de conciliação — hoje são 2 períodos fixos mockados.

## 9. RET — MÉDIA-ALTA (`src/pages/RET/index.tsx`)
- [ ] Taxa PIS/COFINS hoje hardcoded em `0.0465` no front — deve vir do backend
      (`RegrasRET.calcular_ret`), não fixa, para não divergir se a taxa mudar.
- [ ] Seletor de mês/ano em grade visual em vez de texto livre.
- [ ] Estrutura em abas: Resumo / Dados Detalhados / Logs / Sem Valores.
- [ ] Lista "Sem Valores" (PDFs sem valores extraídos).
- [ ] Adicionar colunas faltantes na tabela: Quantidade e Valor Unitário
      (hoje só mostra Tipo, Nº ND, Vencimento, Valor Total, Arquivo).
- [ ] Revisar os 3 botões de ação (Salvar RET no SCG / Exportar Excel / Salvar
      no banco) contra o fluxo real do Tkinter (Salvar no Banco vs Excel Final
      Módulo 9 são conceitos distintos, hoje confusos no front).

## 10. PMPV — MÉDIA (`src/pages/PMPV/index.tsx`)
- [ ] Trocar `calcular()` mockado (`setTimeout` + valores fixos) pela chamada
      real `calcularPMPV(payload)`.
- [ ] Trimestre padrão deve ser calculado dinamicamente a partir do mês atual
      (hoje fixo em "Nov - Jan"); usar `TRIMESTRES_FISCAIS` do backend
      (`Src/common/periodos.py`) como fonte única, não hardcode duplicado no front.
- [ ] Checkbox "Ano Bissexto" (`chk_biss`) — ausente.
- [ ] Corrigir modelo de dados da tabela: separar "QDC (m³/dia)" (input) de
      "Volume (m³)" (calculado = QDC × dias do mês, considerando bissexto) —
      hoje o front trata os dois como um único campo.
- [ ] Validação de Conta Gráfica (formato numérico, não vazio) e mensagens de
      erro em tempo real — hoje aceita qualquer number sem validar.
- [ ] Popup detalhado de Volume Prospectivo por mês (`_popup_vp`).
- [ ] Botão "Copiar" linha de um mês para outro (`_popup_copy`).
- [ ] Botão "Novo" (zerar sessão).
- [ ] Modal de confirmação no "Adicionar ao Excel Final" com resumo (trimestre,
      PMPV, CG, preço final, VP) — hoje é mock genérico.
- [ ] Implementar `salvarPMPV`, importação real de memória de cálculo (Excel),
      e exportação — hoje todos são `alert(...)`.

## 11. Conciliação — MÉDIA (`src/pages/Conciliacao/index.tsx`)
- [ ] Badge de status OCR ("MOTOR OCR ATIVO" / "OCR NÃO ENCONTRADO").
- [ ] Botão "Adicionar ao Excel Final (Módulo 9)" — ausente (só existe "Salvar
      Saldo (RP) no SCG").
- [ ] Corrigir formatação de período padrão para bater com `%b/%Y` (ex:
      "Dez/2025") — hoje usa `toLocaleDateString` com replace que pode gerar
      formato divergente (ex. "ago. de 2026").
- [ ] Conectar `processarConcilia`/`salvarConcilia` reais (fórmula
      `saldo = despesa − receita` já está correta, só falta integração).

## 12. Infraestrutura de dados (transversal)
- [ ] `.env`/`.env.example` com `VITE_API_URL` (confirmar porta real do FastAPI).
- [ ] React Query (ou SWR) para cache/loading/retry — hoje cada página gerencia
      estado manualmente.
- [ ] Tratamento de erro padrão (toast/banner) a partir de `src/api/client.ts`
      (hoje só `console.error`).
- [ ] Tipar respostas de erro da API (hoje `any`).
- [ ] Componente de upload compartilhado (drag & drop + progress) para
      CGF/Auditoria/Conciliação/RET.
- [ ] Testes de componente (Vitest + Testing Library) priorizando os módulos
      com fórmula própria (PMPV, SR, PR, RPV) para travar a regra de negócio.
- [ ] Lint/build limpos como gate antes de cada módulo ser considerado pronto.

## Ordem sugerida
1. **Corrigir modelo de dados incorreto primeiro** (§1 SR, §2 Dashboard) — são
   bugs de especificação, não só ausência de integração; continuar construindo
   em cima deles agrava o retrabalho.
2. Reconstruir páginas vazias (§3 PR, §4 PV, §5 RPV) — hoje não são funcionais.
3. Completar módulos de upload (§6 CGF, §7 Auditoria) — maior gap de campos.
4. §8 SCG, §9 RET — ajustes pontuais de regra de negócio e UI.
5. §10 PMPV, §11 Conciliação — já são os mais maduros, finalizar por último.
6. §12 Infraestrutura — pode começar em paralelo desde o início (não bloqueia
   as correções de modelo de dados).
