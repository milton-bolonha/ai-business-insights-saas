# Arquitetura do OS System

A arquitetura do módulo de Ordens de Serviço (OS System) foi desenhada com três pilares centrais: **Desacoplamento**, **Fluxo de Estados Finito (FSM)** e **Performance no Next.js**.

## 1. Abordagem Baseada em Módulos (Modular Architecture)

Em vez de espalhar os componentes do OS pelos diretórios genéricos do sistema (`src/components/...`), decidimos adotar a "Screaming Architecture". Tudo o que o domínio OS precisa está centralizado em `src/modules/os-system/`.

Isso garante que:
- Mutações no motor de orçamentos não quebrem as ferramentas do AI Blog.
- O componente mestre seja carregado com `React.lazy()` (Dynamic Import) na rota `/admin/page.tsx` somente se a "App Tag" selecionada pelo workspace for a de Sistema Operacional (`template_os_system`).
- Apenas empresas (Workspaces) que utilizam a vertente de Assistência Técnica terão este JavaScript processado no navegador de seus usuários.

## 2. Entidade de Domínio e Ciclo de Vida

O ciclo de vida da Ordem de Serviço foi mapeado linearmente. A transição de estados é contínua e previsível.

### A. Tipagem Estrita
A entidade `OSEntity` (presente em `types/OSEntity.ts`) atua como a interface mestre de banco de dados e tipagem Typescript.
Estados mapeados (`OSStatus`):
`intake` -> `diagnosis` -> `quote_pending` -> `quote_approved` -> `in_production` -> `ready_for_pickup` -> `delivered` -> `archived`.

### B. Divisão de Contêineres de UI
A UI principal, `OSSystemBoard.tsx`, orquestra as seguintes frentes:
1. **OSIntakeForm**: Entrada de aparelhos (Intake).
2. **DiagnosisPanel**: Descobertas do técnico, que disparam a necessidade de um orçamento (`quote_pending`).
3. **QuoteBuilder**: Motor financeiro e matemático (Cálculos de Peças, Mão de Obra e Margem Percentual de Lucro), avançando para (`quote_approved`).
4. **ProductionQueueBoard**: Fila Kanban da bancada técnica com Checklist de Qualidade.
5. **PickupQueue & SignatureCapture**: Gatilho anti-fraude para liberação.

## 3. Gestão de Estado

Atualmente, o estado é centralizado ("Lifting State Up") em `OSSystemBoard`. O fluxo se dá por:
*   **Top-down:** O componente mestre desce a entidade `OSEntity` via Props para os painéis isolados.
*   **Bottom-up:** O painel filho invoca callbacks restritos (`onUpdateStatus`, `onSaveDiagnosis`) para solicitar a mutação da árvore de dados sem mutá-la diretamente, promovendo o princípio da imutabilidade no React.

No futuro, para escalar com multi-usuários, a camada central acionará o `useWorkspaceStore` via Zustand ou chamadas REST com React Query (Supabase/MongoDB), persistindo no banco de dados.
