# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Analistas da ARPE (Agência de Regulação de Pernambuco) que apuram e fiscalizam a Conta Gráfica da Copergás, distribuidora de gás canalizado de Pernambuco. Eles leem números o dia inteiro. O trabalho é:

- **Conferir as notas:** NF-e e CT-e dos supridores e transportadores.
- **Fechar os cálculos:** fecham mês a mês e trimestre a trimestre os componentes da Conta Gráfica.
- **Produzir os documentos oficiais:** o Excel Final e a minuta da Nota Técnica do repasse tarifário.

Mais de um analista usa a plataforma.

## Product Purpose

Apurar a Conta Gráfica do gás canalizado: PMPV, CGR, CGF, RET, RP, RPV, SCG, SR, PR e PV. Isso substitui a digitação manual e as cópias de planilha:

- **Leitura automática das notas:** lê as notas fiscais em XML e PDF, com OCR quando necessário.
- **Banco único:** grava os resultados num banco que todos os analistas compartilham.
- **Documentos prontos:** gera o Excel Final e a Nota Técnica.

O sucesso tem duas partes:

1. **Bater com a planilha oficial:** os números conferem, centavo a centavo, com a planilha oficial de referência, o modelo de Conta Gráfica do Alexandre. Toda divergência aparece de forma explícita: qual nota, qual supridor, quanto e por quê.
2. **Rastreabilidade:** dá para dizer de onde veio cada número (nota, planilha, mês, quem salvou) e defender a Nota Técnica.

## Positioning

É a ferramenta interna do próprio regulador. Ela reproduz as fórmulas da Nota Técnica a partir dos documentos fiscais primários e confronta o resultado com a planilha oficial. Não é um produto genérico de BI nem uma planilha.

## Operating Context

- **Ambiente:** dashboard financeiro interno, usado em mesa de trabalho por analistas. Não é landing page nem SaaS. A prioridade é legibilidade e densidade de informação, não impacto visual.
- **Rotina mensal:** recebe as pastas de NFs por supridor (Petrobras, Brava, Eneva, Galp, GNLink, Orizon, Petrorecôncavo, TAG, Mastergás…). Depois roda a Auditoria CGR, compara com a planilha, salva o mês e confere a consolidação.
- **Duas grades de trimestre que não se misturam:**
  - Conta Gráfica (SCG, CGR, CGF, RET, RP, SR): trimestre civil (Jan–Mar, Abr–Jun…).
  - Parcela de Recuperação (PR, PV, PMPV): trimestre do ciclo tarifário (Nov–Jan, Fev–Abr, Mai–Jul, Ago–Out).
- **Saídas oficiais:** Excel Final consolidado (visual ARPE) e minuta da Nota Técnica em Word.
- **Versões em uso:** a versão web (React na Vercel + API FastAPI no Railway) convive com o app desktop legado (CustomTkinter). Os cálculos ficam num só lugar, `Src/Services`, que as duas usam.

## Capabilities and Constraints

- **Módulos:** Dashboard, PMPV, Auditoria CGR, CGF (volume faturado), RPV, RET (encargos), RP (conciliação de penalidades), SCG (consolidação), SR (saldo regulatório), PR, PV, Excel Final e Ciclo.
- **Termos fixos:** os termos e siglas seguem a Nota Técnica: CGR = Σ compra sem tributos das NF-e e dos CT-e de gasoduto; SCG = RPV + RET + RP + SRant; PR = SCG / VP; PV = PMPV + PR.
- **Dados sigilosos:** valores e notas da Copergás são restritos. Tudo fica atrás de login e nada pode ficar público.
- **Comparação de valores:** precisa apontar divergências por nota e por supridor, com valores, e não apenas "bate / não bate".
- **Banco:** SQLite num volume persistente; o servidor roda em uma só instância.

## Brand Commitments

- **Nome:** "Conta Gráfica ARPE".
- **Logo:** o símbolo e o logo da ARPE ficam no menu, no favicon e no login (`public/arpe-logo.png`, `public/arpe-logo-escuro.png`, `public/arpe-simbolo.png`).
- **Visual:** o usuário rejeita aparência "com cara de IA" e quer uma ferramenta de trabalho sóbria e humana.
- **Tema:** escuro é o padrão (decisão de 03/11/2026); o claro ARPE fica como opção no menu.
- **Idioma:** toda a interface é em português do Brasil.

## Evidence on Hand

- **Planilha oficial de referência:** `plataforma-conta-grafica/Novo modelo Alexandre Conta gráfica - Calculador - rev9 - com cálculo da PR e PMPV.xlsx`. Ela tem as notas detalhadas de Jan/2024 a Jun/2026 e o CGR mensal até Set/2026.
- **Pastas reais de NFs por mês:** `SCG-26/RPV - Recuperação do Preço de Venda/CGR/`.
- **Banco com o histórico:** `plataforma-conta-grafica/pmpv_data.db`, com resultados de 2025–2026.
- **Ausências que não podem ser inventadas:** não há depoimentos, métricas de uso nem números de produtividade. Exemplos e telas devem usar dados reais ou deixar claro que são fictícios.

## Product Principles

1. **O número certo vem antes de tudo:** nenhum valor aparece sem vir de `Src/Services`. Quando dois lados divergem, a divergência fica visível em vez de escondida.
2. **Todo número tem origem:** o analista consegue descer do total até a nota, a linha da planilha e o mês que o produziram.
3. **Densidade legível:** a tela serve a quem compara números o dia inteiro. Alinhamento, hierarquia e leitura rápida valem mais que efeito.
4. **Dizer o que fazer:** erros e avisos explicam o motivo e o próximo passo em português simples.
5. **Sigilo por padrão:** nenhum dado da distribuidora fica acessível sem login.
