# I/O Editais - Arquitetura e Documentação Técnica

Este documento descreve a infraestrutura, capacidades e arquitetura do módulo `io-editais`, responsável por realizar análise de editais de licitação utilizando a inteligência artificial (OpenAI Assistants API).

## 1. Visão Geral do Módulo

O **I/O Editais** é um sistema completo para automação de análise de risco e viabilidade em editais públicos. Seu objetivo principal é ler PDFs longos e extrair estruturadamente 4 grandes pilares:
1. **Dados Gerais** (Modalidade, Prazos, Órgão Comprador)
2. **Visão Geral Estratégica** (Objeto, Destaques, Alertas Críticos)
3. **Checklist de Viabilidade/Habilitação** (Documentos e Exigências Específicas)
4. **Análise de Proposta e Financeira** (Preços de Referência, Pagamentos e Garantias)

A regra de ouro do módulo é: *"O objetivo da análise não é descobrir como participar, mas descobrir se vale a pena participar"*.

## 2. Capacidades de IA e OpenAI Agents

A fundação do módulo é baseada na **Assistants API da OpenAI** (v2), integrada diretamente com o ecossistema do workspace do usuário. 

### Fluxo de Criação e Knowledge Base
1. **Upload e Vector Store**: Quando o usuário faz o upload de um edital em PDF via painel (rota `/api/io-editais/smart-upload`), o backend intercepta o arquivo e o envia para a OpenAI.
2. **Vector Store**: Um `Vector Store` dedicado é criado (ou atualizado) na OpenAI para anexar o PDF.
3. **Assistente**: Um Assistente da OpenAI é criado (ou recuperado), e a `tool_resources.file_search.vector_store_ids` é associada a ele.
4. **Knowledge Base (MongoDB)**: O arquivo é salvo localmente na base de dados (`knowledgeBases`) com status de processamento (`processing`).

### Capacidades de Análise (`/analyze`)
- **Prompting Profundo**: Ao chamar a análise (`/api/io-editais/analyze`), enviamos ao Assistente um `MASTER_CHECKLIST` (de 50 critérios) que serve como lei marcial. O Assistente é forçado a varrer o documento (usando `file_search`) avaliando cada critério.
- **Saída Estruturada via Delimitadores**: Em vez de usar JSON estruturado (que limita a quantidade de caracteres por campo e causa encerramentos prematuros em textos muito longos), utilizamos **Delimitadores Customizados** (`===TIPO===`, `===GERAL===`, etc).
- **Extração de Citações Reais**: Durante o streaming e pós-processamento, a API da OpenAI devolve "anotações" (annotations). O backend (`analyze/route.ts`) intercepta a matriz `annotation.file_citation.quote` e extrai exatamente **o trecho literal do PDF que o modelo leu** para chegar àquela conclusão.
- **Citações Injetadas**: Esses trechos são convertidos em sintaxe Markdown especial `[Trecho Extraído](#citation "texto real")`, que é capturada pelo Frontend (`SmartOverviewCards.tsx`) para exibir o texto original do PDF em Tooltips contextuais bonitos (Hover-cards), tornando a IA altamente auditável.

## 3. Componentes de Frontend

O Frontend é modular e utiliza Next.js App Router (React Server Components + Client Components):

- **`IoEditaisBoard.tsx`**: O container mestre que engloba as abas de navegação (Visão Geral, Checklist, Proposta e Chat).
- **`SmartOverviewCards.tsx`**: Motor de renderização Markdown embutido com `react-markdown` e `remark-gfm` (para tabelas de preços/serviços perfeitas). Ele também possui o parser de `Tooltip` de Citações customizado.
- **`ChecklistTab.tsx`**: Um Kanban interativo e um Checklist em Lista. A IA gera dezenas de tarefas macro ("A Fazer") dinâmicas, que o usuário pode arrastar entre colunas (To Do, Doing, Done) via API nativa do HTML5 Drag-and-Drop. O progresso é persistido como notas atreladas ao Dashboard daquele Workspace.
- **`ChatIA.tsx`**: Interface de conversação via Server-Sent Events (SSE). Permite conversar diretamente sobre o Edital usando a mesma `thread_id` da análise. Suporta auto-scrolling fluido e parsing em tempo real.

## 4. Internacionalização (i18n)
O módulo `io-editais` conta com suporte multilinguagem integrado ao sistema nativo:
- As strings hardcoded e lógicas estruturais da interface estão mapeadas no `useTranslation` hook local do app (`src/lib/hooks/useTranslation.ts`).
- Chaves principais ficam armazenadas dentro de `messages/pt.json` e `messages/en.json` sob o namespace `ioEditais`.

## 5. Rotas de API Específicas

1. **`POST /api/io-editais/smart-upload`**: Cria assistente, vector_store, anexa o arquivo e devolve o agentId e kbId.
2. **`POST /api/io-editais/analyze`**: Rota pesada de processamento (maxDuration elevado). Cria a thread, aplica o prompt mestre, realiza extração usando RegEx de delimitadores e atualiza o MongoDB com os resultados divididos e as citações injetadas.
3. **`POST /api/openai/chat/stream`**: Endpoint responsável pelo WebStream, devolvendo resposta de chat e anotações em tempo real para a aba "Chat & Análises".

## 6. Persistência de Dados (MongoDB)
Todo edital se torna um `KnowledgeBase` e pode ser acessado através de seu `_id`. A análise gerada é guardada sob `knowledgeBase.analysis`.
O estado Kanban (quem marcou qual checklist) é salvo em `dashboard.notes`, atrelando o progresso especificamente ao Workspace ativo, garantindo privacidade e sessões colaborativas.
