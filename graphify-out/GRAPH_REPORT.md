# Graph Report - Front_end  (2026-11-23)

## Corpus Check
- 213 files · ~169,469 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 3 file(s) not represented in the graph (top: .example 1, (none) 1, .css 1)

## Summary
- 1615 nodes · 5159 edges · 85 communities (80 shown, 5 thin omitted)
- Extraction: 98% EXTRACTED · 2% INFERRED · 0% AMBIGUOUS · INFERRED: 126 edges (avg confidence: 0.93)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `13cfe3bc`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- ProvaRealRP.tsx
- CGF/index.tsx
- Processar.tsx
- ComparacaoPlanilha.tsx
- package.json
- AuthContext.tsx
- PMPV/index.tsx
- Dashboard/index.tsx
- api/index.ts
- types/index.ts
- soltarPasta.ts
- Ciclo/index.tsx
- PRDoTrimestre.tsx
- PR/index.tsx
- proximoPasso.ts
- CicloPage
- Sidebar.tsx
- blocoProximoPasso.ts
- periodos.ts
- modulos.ts
- SRDoTrimestre.tsx
- Sigla.tsx
- compilerOptions
- etapasDoCiclo.ts
- compilerOptions
- mensagemDeErro
- pasta.ts
- zipCiclo.ts
- auditoriaDoMes.ts
- prAutomatico.ts
- Badge.tsx
- 3. Inconsistências concretas por camada
- trimestreSugerido
- Spec — Fluxo único: um caminho, um próximo passo, um lugar para gravar
- tsconfig.json
- vercel.json
- O componente `CicloPage` — linhas 177–465
- pastaCiclo.ts
- num
- Parte 3 — `Processar.tsx`, bloco por bloco
- react
- brl
- Conferencia
- ProvaRealSR.tsx
- Spec — Painel do Ciclo: planilha conferida, diferenças amigáveis e Auditoria antes do SR
- SR/index.tsx
- EsqueletoBlocos
- usePreviaCascata.tsx
- CompararPlanilha.tsx
- 3. Layout / fluxo de UI (espelhando `tela_pr.py`)
- Spec — Erros amigáveis em CGF, Auditoria CGR e RPV
- Spec — Módulo PV (`src/pages/PV/index.tsx`)
- AuditarMes.tsx
- etapas
- SCG/index.tsx
- dataHora
- PLANO DE EXECUÇÃO — 16/11/2026 (consolida as seções abaixo; nada começa sem OK do Leandro)
- plano.md
- Spec — Módulo SR (`src/pages/SR/index.tsx`)
- CartaoTarifaMedia.tsx
- conferenciaPlanilha.ts
- Plano de 12/11/2026 (registro do que foi feito e do que ficou)
- PLANO DE 17/11/2026 (terça-feira, no trabalho)
- PreviaCascata.tsx
- ConferenciaDoMes.tsx
- PV/index.tsx
- useProvaRealDoMes.ts
- Paginacao
- Product
- Plano de implementação das decisões de 13/11
- Plano de 13/11/2026 (atualizado à tarde)
- Plano de automação do ciclo — 16/11/2026 (Amanda + Hero, aguardando OK)
- Parte 1 — As ajudantes, em poucas palavras
- Crítica — Conta Gráfica ARPE (Front_end: Dashboard, Auditoria CGR, SCG, Ciclo, sidebar)
- README.md
- incluirNota.ts
- Parecer da Amanda: perfis, revisão e pacote de aprovação (16/11/2026, recomendações)
- Plano do ciclo mais didático — 16/11/2026 (parecer da Amanda, aguardando OK)
- getPMPVMensal
- Plano de visual do front — 16/11/2026 (aguardando OK do Leandro)
- ModalAviso.tsx
- lucide-react
- ListaProblemas.tsx
- linhasDivergentes.ts

## God Nodes (most connected - your core abstractions)
1. `brl()` - 103 edges
2. `react` - 82 edges
3. `num()` - 79 edges
4. `mensagemDeErro()` - 70 edges
5. `lucide-react` - 66 edges
6. `CicloPage()` - 63 edges
7. `PMPVPage()` - 59 edges
8. `Button()` - 54 edges
9. `Alert()` - 48 edges
10. `ProcessarTrimestre()` - 47 edges

## Surprising Connections (you probably didn't know these)
- `useEffect 3: carregar as etapas — linhas 232–239` --references--> `mensagemDeErro()`  [INFERRED]
  docs/estudo/painel-do-ciclo.md → src/api/client.ts
- `2. Regras (as mesmas do `9863c4c`)` --references--> `mensagemDeErro()`  [INFERRED]
  docs/specs/SPEC_ERROS.md → src/api/client.ts
- `Adiantado em 16/11 (Hero, front; sem commit): `tsc`, `eslint src` e build sem erro; `npm test` 17 arquivos e 204 testes (eram 188)` --references--> `getPMPVMensal()`  [INFERRED]
  docs/plano.md → src/api/index.ts
- `9. Riscos e o que NÃO muda` --references--> `getPMPVMensal()`  [INFERRED]
  docs/specs/SPEC_FLUXO_UNICO.md → src/api/index.ts
- `Importações — linhas 1–29` --references--> `getHistoricoSCG()`  [INFERRED]
  docs/estudo/painel-do-ciclo.md → src/api/index.ts

## Import Cycles
- None detected.

## Communities (85 total, 5 thin omitted)

### Community 0 - "ProvaRealRP.tsx"
Cohesion: 0.17
Nodes (23): removerNotaRP(), estadoDaProvaRP(), EstadoProvaRP, filtrarItens(), FiltroItens, itemNaoLido(), ORIENTACAO_REPETIDA, ORIENTACAO_RP (+15 more)

### Community 1 - "CGF/index.tsx"
Cohesion: 0.18
Nodes (32): periodoNaUrl.ts — o mês fica no endereço, getHistoricoAuditoria(), getHistoricoCGF(), getHistoricoConcilia(), getHistoricoRET(), getHistoricoRPV(), getProvaRealCGF(), getProvaRealRET() (+24 more)

### Community 2 - "Processar.tsx"
Cohesion: 0.14
Nodes (34): 11. Conciliação — MÉDIA (`src/pages/Conciliacao/index.tsx`), previaCascata(), processarCGF(), processarConcilia(), processarRET(), salvarAuditoria(), salvarCGF(), salvarConcilia() (+26 more)

### Community 3 - "ComparacaoPlanilha.tsx"
Cohesion: 0.14
Nodes (24): incluirNotaAuditoria(), ComparacaoPlanilha(), FiltroAtivo(), IncluirNota(), textoDaNota(), cgrDaNota(), cgrDifere(), empresaDa() (+16 more)

### Community 4 - "package.json"
Cohesion: 0.05
Nodes (50): dependencies, fflate@^0.8.3, @heroui/react@^3.2.7, @heroui/styles@^3.2.7, lucide-react@^1.14.0, react@^19.2.5, react-dom@^19.2.5, react-router-dom@^7.14.2 (+42 more)

### Community 5 - "AuthContext.tsx"
Cohesion: 0.20
Nodes (12): authApi, CadastroPayload, Sessao, Usuario, api, App(), AuthCtx, AuthProvider() (+4 more)

### Community 6 - "PMPV/index.tsx"
Cohesion: 0.05
Nodes (59): 0. Pré-requisito, 10. PMPV — MÉDIA (`src/pages/PMPV/index.tsx`), 12. Infraestrutura de dados (transversal), 1. SR — CONCLUÍDO (`src/pages/SR/index.tsx`), 2. Dashboard — CONCLUÍDO (`src/pages/Dashboard/index.tsx`), 3. PR — CONCLUÍDO (`src/pages/PR/index.tsx`), 4. PV — CONCLUÍDO (`src/pages/PV/index.tsx`), 5. RPV — ALTA (`src/pages/RPV/index.tsx`) (+51 more)

### Community 7 - "Dashboard/index.tsx"
Cohesion: 0.06
Nodes (65): 10. Decisão: onde vão "Parcela de recuperação" / "SR", 11. Arquivos a alterar, 12. Definition of Done, 1. Por que isso é crítico, 2. Contrato de API (já pronto, backend não precisa de mudanças), 3. Layout geral (espelhando `dashboard_resumo.py`, adaptado a web), 4. Seção "Último mês" — 6 KPI cards, 5. Gráfico de linha — PMPV mensal (R$/m³) (+57 more)

### Community 8 - "api/index.ts"
Cohesion: 0.06
Nodes (17): gerarRelatorioTrimestral(), getProvaRealAuditoria(), NotaRemovida, removerDocumentoRET(), CascataAPartirDe, ComCascata, PMPVCalculoRequest, PMPVHistoricoLinha (+9 more)

### Community 9 - "types/index.ts"
Cohesion: 0.06
Nodes (35): Carregado, AuditoriaConferenciaEmpresa, AuditoriaEmpresa, AuditoriaItem, CGFCalcularRsResponse, CGFColunas, ConciliaItem, ConferenciaEtapa (+27 more)

### Community 10 - "soltarPasta.ts"
Cohesion: 0.23
Nodes (10): alca(), Entrada, EntradaArquivo, EntradaPasta, lerEntrada(), lerFilhos(), lerPastaSolta(), pastaDoSeletor() (+2 more)

### Community 11 - "Ciclo/index.tsx"
Cohesion: 0.11
Nodes (23): Testes por fase (Vitest; módulos puros, sem `react-router` neles), VarianteAviso, atalhoDoSCG(), TomDoAtalho, AvisoPasta, Dados, EsqueletoEtapas(), memoriaProcessar() (+15 more)

### Community 12 - "PRDoTrimestre.tsx"
Cohesion: 0.28
Nodes (13): salvarPR(), cor(), Linha(), PRDoTrimestre(), tarifa(), avisosDeDivergenciaDoPV(), chaveDoPR(), chaveDoPV() (+5 more)

### Community 13 - "PR/index.tsx"
Cohesion: 0.13
Nodes (27): Feito em 22/11 (Leandro CG, sem commit): FASE 5 do Fluxo único (PR e PV no Painel; /sr, /pr e /pv só consulta; `etapas` no back), apurarPR(), gerarExcelFinalGeral(), gerarMinutaNotaTecnica(), getCoberturaExcelFinal(), getPR(), getPVTrimestre(), PageHeader() (+19 more)

### Community 14 - "proximoPasso.ts"
Cohesion: 0.13
Nodes (22): entrada(), aplicarEtapasDoBack(), EtapaDoBack, EtapasDoBack, etapasDoBack(), SITUACAO, CHAVES, etapa() (+14 more)

### Community 15 - "CicloPage"
Cohesion: 0.17
Nodes (21): salvarPVTrimestre(), BotaoEscolherPasta(), Button(), Props, classesDoBotao(), Size, sizes, Variant (+13 more)

### Community 16 - "Sidebar.tsx"
Cohesion: 0.20
Nodes (14): Layout(), Brand(), Sidebar(), SidebarProps, SiglasDaTela(), colorForValue(), moduleColor, roleForValue() (+6 more)

### Community 17 - "blocoProximoPasso.ts"
Cohesion: 0.15
Nodes (22): blocoDoProximoPasso(), dataBR(), EntradaBloco, etapaPorExtenso(), ID_COMPARAR, ID_ENTREGAS, ID_PASTA, ID_PR (+14 more)

### Community 18 - "periodos.ts"
Cohesion: 0.11
Nodes (29): Feito em 21/11 (Leandro CG, sem commit): FASE 2 do Fluxo único, Feito em 21/11 (Leandro Dev, sem commit): dois achados da auditoria de UX, vitest, DetalheDoPMPV(), mesCurto(), trimestresDoCicloTocados(), TrimestreTocado, ID_CARTAO (+21 more)

### Community 19 - "modulos.ts"
Cohesion: 0.10
Nodes (18): ChaveModulo, GRUPOS_DO_MENU, MODULOS, noMenu, Props, CARD_VINHO, AsContas(), Conta (+10 more)

### Community 20 - "SRDoTrimestre.tsx"
Cohesion: 0.14
Nodes (26): propostaSRTrimestre(), salvarTrimestreSR(), ConfirmarGravacao(), LinhaDoResumo, LinhaDoMes(), SRDoTrimestre(), tarifa(), SRProposta (+18 more)

### Community 21 - "Sigla.tsx"
Cohesion: 0.19
Nodes (17): Feito em 22/11 (Leandro CG, sem commit): PONTOS EM ABERTO do Fluxo único, Modulo, Sigla(), VistasContext, SRTrimestreCalculo, dicaDe(), GLOSSARIO, Sigla (+9 more)

### Community 22 - "compilerOptions"
Cohesion: 0.11
Nodes (18): compilerOptions, allowImportingTsExtensions, erasableSyntaxOnly, jsx, lib, module, moduleDetection, moduleResolution (+10 more)

### Community 23 - "etapasDoCiclo.ts"
Cohesion: 0.17
Nodes (18): enviar(), destino(), PassoAPasso(), TEXTO, ChaveEtapa, ChaveNumerada, etapaDaChave(), EtapaDoCiclo (+10 more)

### Community 24 - "compilerOptions"
Cohesion: 0.11
Nodes (17): compilerOptions, allowImportingTsExtensions, erasableSyntaxOnly, lib, module, moduleDetection, moduleResolution, noEmit (+9 more)

### Community 25 - "mensagemDeErro"
Cohesion: 0.19
Nodes (13): ErroValidacao, juntar(), linhaTecnica(), mensagemDeErro(), NOMES_CAMPOS, textoValidacao(), TIPOS_VALIDACAO, getSCGComparacao() (+5 more)

### Community 26 - "pasta.ts"
Cohesion: 0.20
Nodes (10): pasta.ts — o seletor de pasta, PastaGuardada, ArquivoDaPastaCiclo, ChavePasta, lerChave(), lerPasta(), lerPastaDaChave(), PastaLida (+2 more)

### Community 27 - "zipCiclo.ts"
Cohesion: 0.43
Nodes (5): fflate, abridorEmLote(), EntradaZip, estruturaDoZip(), lerZipDaPasta()

### Community 28 - "auditoriaDoMes.ts"
Cohesion: 0.21
Nodes (13): Tipo `Celula` — linhas 37–54, diferencasAuditoria(), processarAuditoria(), auditarMes(), AuditoriaDoMes, Celula, AuditoriaComparacao, AuditoriaDiferencas (+5 more)

### Community 29 - "prAutomatico.ts"
Cohesion: 0.39
Nodes (6): PRAutomatico, PVAutomatico, tarifa(), MESES, textoPRAutomatico(), textoPVAutomatico()

### Community 30 - "Badge.tsx"
Cohesion: 0.40
Nodes (3): BadgeProps, BadgeVariant, styles

### Community 31 - "3. Inconsistências concretas por camada"
Cohesion: 0.07
Nodes (25): 1. Achado principal: não existe design system, existe Tailwind ad-hoc, 2. O que já existe de bom (não descartar), 3.1 Paleta de acento (crítico), 3.2 Tipografia, 3.3 Componente `Table` está isolado, 3.4 Estados de loading/erro/vazio não são um componente, 3.5 Botões desabilitados com tooltip de dependência, 3.6 Densidade de informação e grid responsivo (+17 more)

### Community 33 - "Spec — Fluxo único: um caminho, um próximo passo, um lugar para gravar"
Cohesion: 0.05
Nodes (39): 0. Auditoria conferida contra o código (o que se sustenta e o que não), 10. Decisões para o Leandro, 1. Uma fonte única de etapas, 2. Página inicial e papel do Dashboard, 3. "Próximo passo" no topo do Painel, 4. Onde se grava: mapa completo e regra única, 5. Telas de consulta (itens 4 e 6c), 7. Back (Choco) (+31 more)

### Community 36 - "O componente `CicloPage` — linhas 177–465"
Cohesion: 0.07
Nodes (30): A tabela — linhas 538–568, Alerta de erro — linha 336, aplicarPasta — linhas 252–263, Botão de pasta e campo escondido — linhas 366–385, Botão Processar — linhas 584–592, Contas que dependem do estado — linhas 248–250, continuarPasta — linhas 302–308, Detalhes da célula — linhas 569–583 (+22 more)

### Community 37 - "pastaCiclo.ts"
Cohesion: 0.15
Nodes (24): ICONE, ArquivoClassificado, arquivosDaCelula(), Categoria, CelulaMapa, classificar(), empresasDosCaminhos(), empresasSoPdf() (+16 more)

### Community 38 - "num"
Cohesion: 0.21
Nodes (20): removerNotaAuditoria(), brlResumido(), contabil(), participacao(), textoParticipacao(), KpisDoMes(), NotasDigitadas(), ProvaReal() (+12 more)

### Community 39 - "Parte 3 — `Processar.tsx`, bloco por bloco"
Cohesion: 0.08
Nodes (26): atualizar, alternar e abrir — linhas 144–157, Botões do rodapé — linhas 391–416, Cabeçalho e importações — linhas 1–25, Contadores e "Selecionar tudo" — linhas 290–306, Estados de uma linha e regras fixas — linhas 27–35, Exercícios, Fase e retomada — linhas 56–68, Fase, freio e memória automática — linhas 134–142 (+18 more)

### Community 40 - "react"
Cohesion: 0.18
Nodes (18): react, react-router-dom, SEPARADOR_DETALHE, useAuth(), RequireAuth(), SomenteVisitante(), Alert(), AlertProps (+10 more)

### Community 41 - "brl"
Cohesion: 0.19
Nodes (18): Feito em 22/11 (Leandro): GRAPHIFY instalado e grafo do código gerado nos dois repositórios, AvisoPossivelDuplicata(), Props, textoDoDetalhe(), estadoDaProvaRET(), EstadoProvaRET, ORIENTACAO_RET, base (+10 more)

### Community 42 - "Conferencia"
Cohesion: 0.23
Nodes (15): Conferencia(), Fechamento(), LinhaFechamento, OrigemDoValor(), estadoDaProvaSCG(), EstadoProvaSCG, linkDoModulo(), ORIENTACAO_SCG (+7 more)

### Community 43 - "ProvaRealSR.tsx"
Cohesion: 0.19
Nodes (19): AVISO_DESATUALIZADO, CampoDesatualizado, camposDesatualizados(), estadoDaProvaSR(), estadoDasFontes(), EstadoFontes, EstadoProvaSR, MESES (+11 more)

### Community 44 - "Spec — Painel do Ciclo: planilha conferida, diferenças amigáveis e Auditoria antes do SR"
Cohesion: 0.10
Nodes (20): 0. Ponto de partida (o que já existe, commits de hoje), 1. Avisar com toast quando a planilha subiu certinho, 2.1 Cards interativos: clicou no erro, foi para o erro, 2. Mensagem de diferença muito mais amigável, 3. Auditoria vem antes do SR, 4. Ordem de execução, 5. Fora do escopo, 6. Decisões do Leandro (11/11/2026) (+12 more)

### Community 45 - "SR/index.tsx"
Cohesion: 0.18
Nodes (19): buscarSelicSR(), buscarTrimestreSR(), carregarTrimestreSR(), getHistoricoSR(), getProvaRealSR(), buscarProvaDoTrimestre(), buscarTrimestre(), calcularLocal() (+11 more)

### Community 46 - "EsqueletoBlocos"
Cohesion: 0.22
Nodes (14): @heroui/react, EsqueletoBlocos(), EsqueletoKpi(), CARD_KPI, CARD_PAINEL, Kpi(), m3(), ProvaRealPMPV() (+6 more)

### Community 47 - "usePreviaCascata.tsx"
Cohesion: 0.26
Nodes (12): cascataPendente(), AvisoCascataPendente(), useIrParaAprovacao(), usePreviaCascata(), AguardandoAprovacao(), Cascata, cascataTemParaAprovar(), EVENTO_CASCATA_APROVADA (+4 more)

### Community 48 - "CompararPlanilha.tsx"
Cohesion: 0.20
Nodes (16): conferirPlanilha(), AcaoDoAviso, avisarEnviando(), concluirAviso(), descricaoEmLista(), fecharAviso(), ID_QUADRO_COMPARACAO, irParaSecao() (+8 more)

### Community 49 - "3. Layout / fluxo de UI (espelhando `tela_pr.py`)"
Cohesion: 0.11
Nodes (17): 1. Por que isso é crítico, 2. Fórmula, 3.1 Seleção de trimestre, 3.2 Bloco SCG, 3.3 Bloco ΣSR — SR atual + 4 SRs anteriores, 3.4 Bloco VP, 3.5 Resultado, 3.6 Decomposição trimestral (só aparece após "Carregar Trimestre do Banco") (+9 more)

### Community 50 - "Spec — Erros amigáveis em CGF, Auditoria CGR e RPV"
Cohesion: 0.12
Nodes (15): 1. Problema, 2. Regras (as mesmas do `9863c4c`), 3. Contrato novo: `problemas`, 4.1 Catálogo, 4.2 Reconhecer abreviações (CGF-1, causa raiz do caso real), 4.3 Antes de processar (front), 4.4 Depois de processar (front), 4. CGF (+7 more)

### Community 51 - "Spec — Módulo PV (`src/pages/PV/index.tsx`)"
Cohesion: 0.12
Nodes (15): 1. Por que isso é crítico, 2. Fórmula, 3.1 Barra de período, 3.2 Fonte dos valores, 3.3 Dois cards de input lado a lado, 3.4 Resultado, 3.5 Botões de ação, 3.6 Histórico de PV por período (+7 more)

### Community 52 - "AuditarMes.tsx"
Cohesion: 0.23
Nodes (14): ArquivoDaPasta, AreaSoltarPasta(), ListaProblemas(), Valor(), AuditarMes(), bloqueioDe(), Envio, Fase (+6 more)

### Community 53 - "etapas"
Cohesion: 0.20
Nodes (15): `carregar()` — linhas 54–65, Constantes — linhas 31–40, `etapaMensal()` — linhas 115–121, `etapas()` — linhas 123–167, `ICONE` — linhas 169–173, Importações — linhas 1–29, Parte 2 — `index.tsx`, bloco por bloco, `porMes()` — linhas 77–113 (+7 more)

### Community 54 - "SCG/index.tsx"
Cohesion: 0.25
Nodes (13): getHistoricoSCG(), getProvaRealSCG(), salvarSCG(), SeletorMes(), buscarProvaDoMes(), Campo, CAMPOS, cor() (+5 more)

### Community 55 - "dataHora"
Cohesion: 0.27
Nodes (13): getTrilha(), AlteracoesDaTrilha(), nomeDoCampo(), NOMES_DE_CAMPO, ORIGENS, valorEmTexto(), dif(), LinhaAtual() (+5 more)

### Community 56 - "PLANO DE EXECUÇÃO — 16/11/2026 (consolida as seções abaixo; nada começa sem OK do Leandro)"
Cohesion: 0.14
Nodes (14): Ajuste de prioridade (por causa das respostas), Decisões do Leandro em 16/11 (respostas às perguntas de qualidade), Depende do analista humano (trava só o que está marcado), Documentação (Amanda revisa, depois de cada etapa), Estado hoje, Etapa 0: higiene (Leandro, antes de programar mais), Etapa 1: back, pré-requisitos (Luiz), Etapa 2: front, ganhos sem risco (Hero; pode rodar junto com a Etapa 1) (+6 more)

### Community 57 - "plano.md"
Cohesion: 0.15
Nodes (12): Decisões da Amanda para o ciclo — 16/11/2026 (recomendações, ainda sem confirmação humana), Feito em 21/11 (Leandro CG, sem commit): FASE 1 do Fluxo único, Feito em 21/11 (Leandro CG, sem commit): FASE 3 do Fluxo único (topo do Painel), Feito em 21/11 (Leandro CG, sem commit): FASE 4 do Fluxo único (gravar com confirmação), Feito em 22/11 (Leandro CG, commit `73ae079` no back): ERRO "sem conexão" ao gerar a minuta da NT, O que bloqueia a programação (precisa do analista humano), O que muda no código por causa dessas decisões, Plano de 13/11/2026 — versão da manhã (registro) (+4 more)

### Community 58 - "Spec — Módulo SR (`src/pages/SR/index.tsx`)"
Cohesion: 0.15
Nodes (12): 1. Por que isso é crítico, 2. Fórmula (fonte: `tela_sr.py`, `TelaSR._calcular`), 3.1 Painel "Carregar VP e VF do banco", 3.2 Seleção de trimestre, 3.3 Linhas de mês (uma por mês do trimestre), 3.4 Resultado total, 3.5 Botões de ação, 3. Layout / fluxo de UI (espelhando `tela_sr.py`) (+4 more)

### Community 59 - "CartaoTarifaMedia.tsx"
Cohesion: 0.27
Nodes (10): getTarifaMedia(), TarifaMediaDoCiclo(), descreverTarifaMedia(), faixaDaChave(), frase(), LinhaDaTarifa, ORIGEM_DA_MB, TarifaMediaDescrita (+2 more)

### Community 60 - "conferenciaPlanilha.ts"
Cohesion: 0.28
Nodes (11): curto(), DesfechoDaConferencia, juntar(), listaDeMeses(), MODELOS, ResultadoDaConferencia, resultadoDaConferencia(), mes() (+3 more)

### Community 61 - "Plano de 12/11/2026 (registro do que foi feito e do que ficou)"
Cohesion: 0.17
Nodes (12): processarUma — Auditoria (linhas 160–188), 0. Antes de tudo (5 min), 1. Testar **Setembro/2026** de ponta a ponta (Leandro + José), 2. Relatório de divergências de Setembro, 3. Aviso de "Possível duplicata" mais esperto (Choco → José), 4. Fases da spec que continuam (SPEC_AUDITORIA_AMIGAVEL.md), 5. Pendências antigas (de 06/11, em `PROXIMOS_PASSOS.md`), Andamento de hoje (12/11/2026) (+4 more)

### Community 62 - "PLANO DE 17/11/2026 (terça-feira, no trabalho)"
Cohesion: 0.17
Nodes (12): 1. Primeiro, no começo do dia (Leandro, ~30 min), 2. Prioridade máxima: backup do banco (Luiz), 3. Em seguida, em paralelo, 4. Amanda (só analisa), 5. Para levar ao analista humano (trabalho), 6. Fica para depois de 17/11, 7. Atenção, Adiantado em 16/11 (Hero, front; sem commit): `tsc`, `eslint src` e build sem erro; `npm test` 17 arquivos e 204 testes (eram 188) (+4 more)

### Community 63 - "PreviaCascata.tsx"
Cohesion: 0.26
Nodes (11): 4. Front: aprovação da cascata e aviso de duplicata, Andamento de 16/11/2026 (o que foi feito e o que está em curso), aplicarCascata(), dinheiro(), Linha, linhasDe(), mudou(), PreviaCascata() (+3 more)

### Community 64 - "ConferenciaDoMes.tsx"
Cohesion: 0.24
Nodes (10): axios@^1.15.2, axios, getConferenciaDoMes(), EsqueletoLista(), ConferenciaDoMes(), NOMES, textoVariacao(), totalEmTexto() (+2 more)

### Community 65 - "PV/index.tsx"
Cohesion: 0.29
Nodes (10): getHistoricoPV(), getProvaRealPV(), Card(), CardProps, anoOk(), buscarProvaDoTrimestre(), PVPage(), Trimestre (+2 more)

### Community 66 - "useProvaRealDoMes.ts"
Cohesion: 0.27
Nodes (8): GradeKpis(), EstadoProva, KpisPV(), corDoValor(), KpisRPV(), ProvaRealAuditoria, ProvaRealPV, ProvaRealRPV

### Community 67 - "Paginacao"
Cohesion: 0.29
Nodes (9): Paginacao(), PaginacaoProps, ItemPagina, OpcoesPaginacao, paginaDoIndice(), paginasVisiveis(), RotuloItem, MESES (+1 more)

### Community 68 - "Product"
Cohesion: 0.18
Nodes (10): Brand Commitments, Capabilities and Constraints, Evidence on Hand, Operating Context, Platform, Positioning, Product, Product Principles (+2 more)

### Community 69 - "Plano de implementação das decisões de 13/11"
Cohesion: 0.20
Nodes (10): 1. PR recusa SELIC 0% (back, pequeno), 2. Cascata sem gravar: prévia e aprovação (back, o maior), 3. Duplicata com contexto (back), 5. Conferência do mês no Painel do Ciclo, 6. Aposentar SR e PR do desktop, 7. Apagar um PR (back, para a limpeza), 8. Trilha de alterações, 9. Dados (depois do deploy, com cópia do banco antes) (+2 more)

### Community 70 - "Plano de 13/11/2026 (atualizado à tarde)"
Cohesion: 0.22
Nodes (9): 0. Antes de tudo, 1. Dados do servidor (Leandro, no site, nesta ordem), 2. Correções da revisão (Luiz, Hero e Jose), esperando OK do Leandro, 3. Reparo do SCG em produção (pendente desde 12/11), 4. Quando der, 5. Decisões do Leandro (13/11, tarde), Plano de 13/11/2026 (atualizado à tarde), Regras confirmadas em 12–13/11 (+1 more)

### Community 71 - "Plano de automação do ciclo — 16/11/2026 (Amanda + Hero, aguardando OK)"
Cohesion: 0.22
Nodes (9): Alertas (só avisam, nunca agem), Fase 0: pré-requisitos no back (Luiz) antes de liberar qualquer aprovação rápida, Fase 1: ganhos só no front, sem risco de dado (Hero), Fase 2: depende da Fase 0, Fase 3: o item grande, Limites do HeroUI v3 (conferido em `.heroui-docs`), Nunca automático (Amanda), Perguntas em aberto (+1 more)

### Community 72 - "Parte 1 — As ajudantes, em poucas palavras"
Cohesion: 0.25
Nodes (7): Como as peças conversam, lembrar.ts — o guarda-volumes do navegador, Mapa da tela (de cima para baixo), Painel do Ciclo comentado, Para que serve a tela, Parte 1 — As ajudantes, em poucas palavras, pastaCiclo.ts — quem é quem, só pelo nome

### Community 73 - "Crítica — Conta Gráfica ARPE (Front_end: Dashboard, Auditoria CGR, SCG, Ciclo, sidebar)"
Cohesion: 0.25
Nodes (7): Crítica — Conta Gráfica ARPE (Front_end: Dashboard, Auditoria CGR, SCG, Ciclo, sidebar), Especificidade, Menores, Nota (Nielsen) — 22/40, Aceitável, Perguntas, Personas, Problemas prioritários

### Community 74 - "README.md"
Cohesion: 0.25
Nodes (7): 🤝 Contribuição, ☁️ Deploy, 🗂️ Estrutura, 🚀 Rodar no computador, 🧭 Telas, 🧪 Testes, 📋 Visão geral

### Community 75 - "incluirNota.ts"
Cohesion: 0.46
Nodes (6): NotaParaIncluir, numero(), pedidoDeInclusao(), podeIncluirNota(), nota, NotaSoNaPlanilha

### Community 76 - "Parecer da Amanda: perfis, revisão e pacote de aprovação (16/11/2026, recomendações)"
Cohesion: 0.29
Nodes (7): Achados novos, Documentação já corrigida em 16/11, Pacote de aprovação e versão da regra, Parecer da Amanda: perfis, revisão e pacote de aprovação (16/11/2026, recomendações), Passo de revisão do analista antes de fechar o trimestre, Perfis propostos (uma pessoa pode ter mais de um), PERGUNTAS PARA O ANALISTA (para imprimir; as que travam a programação são 1, 2, 9, 14 e 15)

### Community 77 - "Plano do ciclo mais didático — 16/11/2026 (parecer da Amanda, aguardando OK)"
Cohesion: 0.29
Nodes (7): Automatizar com segurança (só lê ou calcula), Fluxo proposto no Painel do Ciclo (cada passo mostra por que existe, o que entra, o que sai e quem aprova), O que fazer hoje (proposta, nada começa antes do OK), Parecer da Amanda (resumo), Perguntas em aberto, Plano do ciclo mais didático — 16/11/2026 (parecer da Amanda, aguardando OK), Riscos que a Amanda apontou (resolver antes de automatizar mais)

### Community 78 - "getPMPVMensal"
Cohesion: 0.29
Nodes (7): 6. Itens menores, 6a. Entregas e a planilha (inclui o bug), 6b. Pasta perdida ao recarregar, 6c. Siglas, 6d. Formato de período, 6e. PMPV do trimestre apurado, getPMPVMensal()

### Community 79 - "Plano de visual do front — 16/11/2026 (aguardando OK do Leandro)"
Cohesion: 0.33
Nodes (6): Como será verificado, Decisões que dependem do Leandro, Já editado antes da pausa (16/11, ~10:29), O que NÃO muda, O que será editado (ordem proposta), Plano de visual do front — 16/11/2026 (aguardando OK do Leandro)

### Community 80 - "ModalAviso.tsx"
Cohesion: 0.53
Nodes (4): Texto(), Modal(), ICONE, ModalAviso()

### Community 82 - "ListaProblemas.tsx"
Cohesion: 0.40
Nodes (4): ESTILO, ORDEM, semantic, ProblemaArquivo

### Community 83 - "linhasDivergentes.ts"
Cohesion: 0.50
Nodes (4): LinhaDivergente, ROTULOS, SCGPeriodo, SCGValores

## Knowledge Gaps
- **5 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `brl()` connect `brl` to `ProvaRealRP.tsx`, `CGF/index.tsx`, `Processar.tsx`, `ComparacaoPlanilha.tsx`, `PMPV/index.tsx`, `Dashboard/index.tsx`, `Ciclo/index.tsx`, `PRDoTrimestre.tsx`, `PR/index.tsx`, `SRDoTrimestre.tsx`, `mensagemDeErro`, `num`, `Conferencia`, `ProvaRealSR.tsx`, `SR/index.tsx`, `EsqueletoBlocos`, `CompararPlanilha.tsx`, `AuditarMes.tsx`, `etapas`, `SCG/index.tsx`, `dataHora`, `Plano de 12/11/2026 (registro do que foi feito e do que ficou)`, `PreviaCascata.tsx`, `ConferenciaDoMes.tsx`, `PV/index.tsx`, `useProvaRealDoMes.ts`?**
  _High betweenness centrality (0.078) - this node is a cross-community bridge._
- **Are the 2 inferred relationships involving `brl()` (e.g. with `Feito em 22/11 (Leandro): GRAPHIFY instalado e grafo do código gerado nos dois repositórios` and `4. Seção "Último mês" — 6 KPI cards`) actually correct?**
  _`brl()` has 2 INFERRED edges - model-reasoned connections that need verification._
- **Should `Processar.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.13949579831932774 - nodes in this community are weakly interconnected._
- **Why does `mensagemDeErro()` connect `mensagemDeErro` to `CGF/index.tsx`, `Processar.tsx`, `ComparacaoPlanilha.tsx`, `PMPV/index.tsx`, `Dashboard/index.tsx`, `Ciclo/index.tsx`, `PRDoTrimestre.tsx`, `PR/index.tsx`, `CicloPage`, `SRDoTrimestre.tsx`, `etapasDoCiclo.ts`, `O componente `CicloPage` — linhas 177–465`, `num`, `react`, `brl`, `SR/index.tsx`, `CompararPlanilha.tsx`, `Spec — Erros amigáveis em CGF, Auditoria CGR e RPV`, `AuditarMes.tsx`, `SCG/index.tsx`, `dataHora`, `PreviaCascata.tsx`, `ConferenciaDoMes.tsx`, `PV/index.tsx`, `useProvaRealDoMes.ts`?**
  _High betweenness centrality (0.076) - this node is a cross-community bridge._
- **Are the 3 inferred relationships involving `mensagemDeErro()` (e.g. with `useEffect 3: carregar as etapas — linhas 232–239` and `Feito em 22/11 (Leandro): GRAPHIFY instalado e grafo do código gerado nos dois repositórios`) actually correct?**
  _`mensagemDeErro()` has 3 INFERRED edges - model-reasoned connections that need verification._
- **Should `ComparacaoPlanilha.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.1354679802955665 - nodes in this community are weakly interconnected._
- **Why does `react` connect `react` to `ProvaRealRP.tsx`, `CGF/index.tsx`, `Processar.tsx`, `ComparacaoPlanilha.tsx`, `package.json`, `AuthContext.tsx`, `PMPV/index.tsx`, `Dashboard/index.tsx`, `Ciclo/index.tsx`, `PRDoTrimestre.tsx`, `PR/index.tsx`, `CicloPage`, `Sidebar.tsx`, `modulos.ts`, `SRDoTrimestre.tsx`, `Sigla.tsx`, `mensagemDeErro`, `3. Inconsistências concretas por camada`, `pastaCiclo.ts`, `num`, `brl`, `Conferencia`, `ProvaRealSR.tsx`, `SR/index.tsx`, `EsqueletoBlocos`, `usePreviaCascata.tsx`, `CompararPlanilha.tsx`, `AuditarMes.tsx`, `SCG/index.tsx`, `dataHora`, `CartaoTarifaMedia.tsx`, `PreviaCascata.tsx`, `ConferenciaDoMes.tsx`, `PV/index.tsx`, `useProvaRealDoMes.ts`, `Paginacao`, `ModalAviso.tsx`, `lucide-react`?**
  _High betweenness centrality (0.063) - this node is a cross-community bridge._