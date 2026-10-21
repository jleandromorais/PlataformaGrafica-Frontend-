> **Status:** implementado (back: `tests/test_api_cgf.py` e `tests/test_api_auditoria.py`
> cobrem os catálogos §4.1 e §5.1). Continua o commit `9863c4c` (erros amigáveis em
> Login, Cadastro e PMPV). Mexe no front (`Front_end`) e no back (`plataforma-conta-grafica`).
> Desvio do plano: as funções do lote da Auditoria mantiveram a assinatura (o desktop
> as usa) e ganharam um parâmetro opcional `problemas: list`.

# Spec — Erros amigáveis em CGF, Auditoria CGR e RPV

Telas:
- CGF — `src/pages/CGF/index.tsx` · `Src/api/routers/cgf.py` · `Src/Services/servicos_cgf.py`
- Auditoria CGR — `src/pages/Auditoria/index.tsx` · `Src/api/routers/auditoria.py` · `Src/Services/servicos_auditoria_lote.py`
- RPV — `src/pages/RPV/index.tsx` · `Src/api/routers/rpv.py`

---

## 1. Problema

O usuário não tem como saber o que deu errado. Caso real (CGF, Set/2026):

- Arquivos: `NF faturadas e complementares 09.26.xlsx`, `NF devolvidas 09.26.xlsx`, `NF canc.rejeitadas.deneg.xlsx`.
- A tela mostrou: *"Estes arquivos foram ignorados porque o nome não diz o tipo (faturada, cancelada ou devolução): NF canc.rejeitadas.deneg.xlsx."*
- Ao mesmo tempo, mostrou **Canceladas = 0,0000 m³** e um CGF em R$ pronto para salvar.

O que falta na mensagem:
1. **O motivo exato.** A regra procura `cancelad`/`denegad`, e o nome tem `canc.` e `deneg`. A mensagem não diz quais palavras são aceitas.
2. **A consequência.** Não fica claro que as canceladas entraram como zero e que o resultado está incompleto.
3. **O que fazer.** Renomear o arquivo? Para quê?

E há erros que a tela nem mostra: só aparecem no log (recolhido) ou são descartados.

| Onde | Hoje | Efeito |
|---|---|---|
| CGF, planilha que não abre | `logs: "[ERRO] Erro ao ler /tmp/cgf_xxx/arq.xlsx: <erro do pandas>"` | Volume some sem aviso; o log expõe o caminho temporário do servidor |
| CGF, coluna não encontrada | `logs: "[!] Coluna 'Volume Faturado' ausente. Ignorado."` | Faturado = 0 sem aviso |
| Auditoria, XML com erro ou de tipo desconhecido | `auditar_xml` devolve `None` | A nota some; "N XMLs lidos" não bate com as linhas |
| Auditoria, PDF com erro de OCR | `continue` | A nota some sem aviso |
| Auditoria, planilha de comparação corrompida | exceção do pandas → HTTP 500 | "Erro interno no servidor" |
| Auditoria, empresa escolhida que não está na pasta | filtrada em silêncio | A empresa some do resultado |

## 2. Regras (as mesmas do `9863c4c`)

- **R1. O que houve, onde, o que fazer.** Toda mensagem cita o arquivo, a coluna ou a empresa envolvida e termina com a ação.
- **R2. A consequência no número.** Se algo foi ignorado, diga qual total ficou incompleto (ex.: "Canceladas ficou em 0").
- **R3. Gravidade certa.**
  - `erro`: o resultado está errado ou incompleto. Bloqueia o **Salvar** até o usuário corrigir ou confirmar.
  - `aviso`: o resultado vale, mas merece conferência.
  - `info`: só contexto.
- **R4. Nada só no log.** O log continua existindo para debug, mas todo `[ERRO]` ou `[!]` vira também um item estruturado na resposta.
- **R5. Sem detalhe interno.** Nada de caminho temporário, stack trace ou mensagem crua do pandas no texto principal. O detalhe técnico, se útil, vai em `tecnico` (§3), exibido em letra menor.
- **R6. A linha técnica continua.** Erros HTTP seguem passando por `mensagemDeErro` (`src/api/client.ts`), que já acrescenta `(HTTP 422 · POST /cgf/processar)`.

## 3. Contrato novo: `problemas`

As respostas de `POST /cgf/processar` e `POST /auditoria/processar` ganham:

```ts
// src/types/index.ts
export interface ProblemaArquivo {
  arquivo: string;                       // nome ou caminho relativo, nunca o caminho do servidor
  empresa?: string;                      // Auditoria
  gravidade: "erro" | "aviso" | "info";
  codigo: string;                        // estável, para teste e para o front decidir a UI (ver §4 e §5)
  mensagem: string;                      // pt-BR, segue R1–R2
  tecnico?: string;                      // opcional, ex.: "colunas encontradas: Data, Produto, Qtd"
}
```

```py
# Src/api/schemas/comum.py (novo)
class ProblemaArquivo(BaseModel):
    arquivo: str
    empresa: str | None = None
    gravidade: Literal["erro", "aviso", "info"]
    codigo: str
    mensagem: str
    tecnico: str | None = None
```

- `CGFProcessarResponse.arquivos_ignorados` continua por compatibilidade, mas o front passa a usar `problemas`.
- **Componente novo:** `src/components/ui/ListaProblemas.tsx`. Agrupa os problemas por gravidade (erro → aviso → info), mostra arquivo em negrito, a mensagem, e `tecnico` em `text-xs text-zinc-500`. Ele substitui o `setErro(...)` de texto corrido nas duas telas.

## 4. CGF

### 4.1 Catálogo

| ID | `codigo` | Gravidade | Quando | Mensagem |
|---|---|---|---|---|
| CGF-1 | `tipo_nao_reconhecido` | erro | nome sem palavra de tipo | **{arquivo}**: não sei se é faturada, cancelada ou devolução. O nome precisa conter *faturada*, *complementar*, *cancelada*, *denegada*, *devolução* ou *devolvida*. Este arquivo ficou de fora: **{total afetado} pode estar incompleto**. Renomeie e envie de novo. |
| CGF-2 | `planilha_ilegivel` | erro | `ler_tabela` falhou | **{arquivo}**: não consegui abrir a planilha. Ela pode estar corrompida, protegida por senha ou aberta em outro programa. Salve de novo no Excel (.xlsx) e envie. `tecnico`: tipo da exceção, sem caminho. |
| CGF-3 | `coluna_ausente` | erro | `_resolver_coluna` → `None` | **{arquivo}** ({tipo}): não achei a coluna **"{coluna}"**. {Total} deste arquivo ficou em 0. Confira o nome em "Colunas das planilhas". `tecnico`: `colunas encontradas: A, B, C…` |
| CGF-4 | `coluna_por_apelido` | info | coluna achada por apelido | **{arquivo}**: usei a coluna "{real}" no lugar de "{configurada}". |
| CGF-5 | `sem_faturadas` | erro | nenhuma planilha faturada válida | Nenhuma planilha de **faturadas** foi lida: o volume final ficaria só com canceladas/devoluções. Envie a planilha "NF faturadas e complementares". |
| CGF-6 | `tipo_ausente` | aviso | nenhuma planilha de canceladas (ou devoluções) | Nenhuma planilha de **{canceladas\|devoluções}** enviada: esse total ficou em 0. Se o mês não teve {tipo}, pode seguir. |
| CGF-7 | `consumo_nao_encontrado` | info | nenhuma linha de consumo próprio | Nenhuma linha "{val_fat_consumo}" na coluna "{col_fat_consumo}": consumo próprio = 0. |
| CGF-8 | `planilha_vazia` | aviso | `df` sem linhas | **{arquivo}**: a planilha está vazia; nada foi somado. |

As duas mensagens de `ValueError` que já existem ficam como estão: extensão inválida e "Envie ao menos uma planilha".

### 4.2 Reconhecer abreviações (CGF-1, causa raiz do caso real)

Aceitar também `canc` e `deneg` (cobre `canc.rejeitadas.deneg`), e `rejeitad`, que é tipo cancelada/denegada.

- Back: `_PALAVRAS_TIPO` em `Src/api/routers/cgf.py` e os `if` de `processar_arquivos` em `servicos_cgf.py`.
- Front: `tipoDoArquivo` em `src/pages/CGF/index.tsx`.
- **As duas listas precisam ficar iguais.** Extrair para uma constante em cada lado, com comentário apontando a outra.
- Ordem de teste mantida: faturada/complementar → cancelada → devolução. Assim, "complementar" nunca cai em cancelada.

### 4.3 Antes de processar (front)

- O chip **"Não reconhecido"** já aparece na lista de arquivos. Adicionar um `title`/tooltip com a mesma explicação do CGF-1.
- Se houver arquivo não reconhecido, o botão **Processar** continua habilitado, mas mostra um aviso inline acima dele: *"1 arquivo não será lido (nome sem tipo). Renomeie ou remova antes de processar."*

### 4.4 Depois de processar (front)

- Trocar o `setErro(...arquivos_ignorados...)` por `<ListaProblemas problemas={r.problemas} />`.
- Com algum problema de gravidade `erro`, o **Salvar** fica desabilitado, com `title`: *"Corrija os problemas acima e processe de novo."*
- Cada chip de arquivo ganha o estado pós-processamento: ✓ lido, ⚠ aviso, ✕ erro.

## 5. Auditoria CGR

### 5.1 Catálogo

| ID | `codigo` | Gravidade | Quando | Mensagem |
|---|---|---|---|---|
| AUD-1 | `xml_invalido` | aviso | `parse_nfe`/`parse_cte` devolve `erro` | **{empresa} / {arquivo}**: XML não pôde ser lido ({motivo curto}). A nota não entrou no CGR. |
| AUD-2 | `xml_tipo_desconhecido` | info | `detectar_tipo_xml` não é NF-e nem CT-e | **{empresa} / {arquivo}**: não é NF-e nem CT-e; ignorado. (Evento, cancelamento etc.) |
| AUD-3 | `pdf_ocr_falhou` | aviso | `parse_pdf_ocr` devolve `erro` | **{empresa} / {arquivo}**: não consegui ler o PDF ({motivo}). Se a nota importa, envie o XML. |
| AUD-4 | `empresa_nao_encontrada` | aviso | empresa escolhida fora da pasta | A empresa **{empresa}** foi marcada, mas não há subpasta com esse nome. Ela não foi auditada. |
| AUD-5 | `empresa_sem_notas` | aviso | subpasta sem XML/PDF | **{empresa}**: a pasta não tem XML nem PDF. |
| AUD-6 | `planilha_comparacao_ilegivel` | erro (só da comparação) | `carregar_planilha_comparacao` falha | Não consegui abrir a planilha de comparação **{arquivo}**. A auditoria foi feita, mas sem comparação. Salve como .xlsx e tente de novo. |

- **AUD-6 não pode virar 500.** Envolver a leitura em `try/except` e devolver o erro em `aviso_comparacao` ou em `problemas`. As notas auditadas são preservadas.
- Mudança de assinatura: `auditar_xml` passa a devolver `XMLItem | ProblemaArquivo`, e `auditar_empresa`/`auditar_pasta` passam a devolver também `list[ProblemaArquivo]`. O desktop usa essas funções, então **conferir quem chama** antes de mudar (`grep -rn "auditar_pasta\|auditar_empresa" Src`).
- Resumo no topo do resultado: *"412 XMLs e 3 PDFs lidos · 409 notas auditadas · 6 arquivos com problema (ver lista)"*. Assim a conta fecha.

## 6. RPV

Hoje é a tela em melhor estado. Ajustes pontuais, todos no front:

| ID | Hoje | Novo |
|---|---|---|
| RPV-1 | "Corrija os valores inválidos antes de salvar." | **CGR**: "1.2.3" não é um valor válido. Use o formato 1.234.567,89. (Um erro por campo, embaixo do input, com borda vermelha.) |
| RPV-2 | "Preencha ao menos um dos valores (CGR ou CGF)." | Mantém, e acrescenta: *"O CGR vem da Auditoria CGR e o CGF da tela CGF. Se já salvou lá, o valor aparece aqui sozinho."* |
| RPV-3 | Erro do histórico usa o mesmo `setErro` e apaga um erro de salvar | Histórico com erro próprio, mostrado dentro do painel Histórico |

## 7. Critérios de aceite

- **AC1:** caso real do §1. O arquivo `NF canc.rejeitadas.deneg.xlsx` é reconhecido como Canceladas, tanto no chip quanto no back.
- **AC2:** um arquivo `NF qualquer.xlsx` gera o CGF-1, com as palavras aceitas e o total afetado. O Salvar fica bloqueado.
- **AC3:** uma planilha faturada sem a coluna "Volume Faturado" gera o CGF-3, com as colunas encontradas em `tecnico`. O Salvar fica bloqueado.
- **AC4:** um .xlsx corrompido gera o CGF-2. Nenhuma mensagem contém `/tmp`, `C:\` ou `cgf_`.
- **AC5:** enviar só faturadas gera o CGF-6 (aviso) para canceladas e devoluções. O Salvar continua liberado.
- **AC6:** na Auditoria, um XML malformado gera o AUD-1 com empresa e arquivo. A contagem "lidos × auditadas × com problema" fecha.
- **AC7:** na Auditoria, uma planilha de comparação corrompida não dá 500. A auditoria volta normalmente, com o AUD-6.
- **AC8:** no RPV, o valor "1.2.3" mostra o RPV-1 embaixo do campo CGR.
- **AC9:** toda mensagem dos catálogos §4.1 e §5.1 cita arquivo, empresa ou coluna (R1).

## 8. Testes

- Back, CGF (`tests/test_api_cgf.py`): um teste por `codigo` do §4.1, com planilhas montadas em `tmp_path` via pandas. Verificar `codigo`, `gravidade` e que `arquivo` não contém diretório.
- Back, Auditoria (`tests/test_api_auditoria.py`): XML malformado (AUD-1), XML de evento (AUD-2), empresa inexistente (AUD-4), planilha de comparação corrompida (AUD-6, status 200).
- **Atenção:** os testes de API precisam sobrescrever `usuario_atual`, como foi feito em `tests/test_api_pmpv.py`. Sem isso, todos dão 401.
- Front: `npx tsc -p tsconfig.app.json --noEmit` e `eslint` limpos. Conferência manual no navegador com os arquivos do §1.

## 9. Fora de escopo

- Escolher o tipo do arquivo manualmente num dropdown no chip. Fica como evolução se a regra de nome continuar falhando.
- Traduzir mensagens de erro do OCR/pandas além de um "motivo curto".
- Outras telas (RET, Conciliação, SCG, SR, PR, PV, Excel Final). Elas seguem o mesmo padrão depois.
