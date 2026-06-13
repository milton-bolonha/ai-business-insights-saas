# LicitaFlow (io_editais)

Este módulo foi criado para o I/O SaaS e lida com a análise de editais de licitação, checklists de viabilidade e elaboração de propostas guiadas por inteligência artificial.

## Estrutura do Módulo

- **`components/`**: Contém todos os componentes visuais do módulo (PainelTab, EditalTab, ChecklistTab, PropostaTab, ChatIA, etc.). Estes componentes utilizam o design system baseado em TailwindCSS.
- **`hooks/`**: Contém a lógica de estado e as chamadas simuladas de banco de dados (`useLicitaFlow.ts`). Mantemos a lógica separada dos componentes para facilitar a testabilidade.
- **`types/`**: (Opcional) Interfaces TypeScript que definem a estrutura dos editais e seções.

## Ponto de Entrada
O ponto de entrada principal do módulo é o `<IoEditaisBoard />`, que será carregado de forma assíncrona pelo `AdminContainer.tsx`.

## Próximos Passos
- Integrar com banco de dados real e endpoints de IA.
- Expandir as análises de risco.
