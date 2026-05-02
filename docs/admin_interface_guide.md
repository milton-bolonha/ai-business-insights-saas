# Guia de Modos de Visualização e App Tags do Admin

Este documento detalha o funcionamento, a arquitetura e como realizar modificações no sistema de visualização dupla e nas "App Tags" (abas de navegação) do painel administrativo.

## 1. Arquitetura de Visualização Dupla

O painel administrativo opera em dois modos principais, gerenciados pelo componente central `AdminContainer.tsx`.

### Modos de Visualização
- **Modo Chat IA (Padrão)**: Focado em uma experiência conversacional e imersiva. A barra lateral é ocultada e o conteúdo principal ocupa toda a largura, com uma interface de chat flutuante na parte inferior.
- **Modo Menu (Tradicional)**: Interface clássica com barra lateral de navegação fixa (`AdminNavigation`) e cabeçalho completo.

### Gerenciamento de Estado
O estado `viewMode` (`'chat' | 'menu'`) no `AdminContainer` controla qual interface é exibida:
- Se `chat`, o componente `AdminChatView` é passado para a prop `chatOverlay` do `AdminShellAde`.
- Se `menu`, o componente `AdminNavigation` é passado para a prop `navigation`.

---

## 2. O Sistema de App Tags

As **App Tags** são as abas horizontais exibidas na interface do Chat IA. Elas permitem que o usuário mude o contexto do dashboard (mudando o que é exibido no centro da tela) sem sair da experiência de chat.

### Definição e Localização
As tags são geradas dinamicamente com base no template do Workspace atual. A lógica reside na função `getWorkspaceNavItems` dentro de:
`src/components/admin/chat/AdminChatView.tsx`

### Como Adicionar ou Modificar uma App Tag
Para alterar as abas disponíveis:

1. Abra o arquivo `src/components/admin/chat/AdminChatView.tsx`.
2. Localize a função `getWorkspaceNavItems(templateId: string)`.
3. Adicione um novo item ao array de retorno seguindo o formato:
   ```typescript
   { 
       id: "meu_novo_id", 
       label: "Nome da Aba", 
       icon: MeuIcone 
   }
   ```
4. **Importante**: O `id` deve estar presente no tipo `NavTab` e possuir uma lógica de renderização correspondente no `AdminContainer.tsx` para que o conteúdo seja exibido.

### Interação e Comportamento
- **Scroll Horizontal**: As tags suportam navegação por arrasto (Drag to Scroll) para facilitar o uso em dispositivos touch ou com mouse.
- **Sincronização**: Ao clicar em uma tag, a função `onTabChange` é disparada, atualizando o `activeTab` no `AdminContainer`. Isso altera instantaneamente o componente exibido no fundo (ex: mudando de "Biblioteca" para "Insights").
- **Auto-recolhimento**: Ao selecionar uma tag, a interface do chat faz um *slide down* automático para dar foco ao novo conteúdo carregado.

---

## 3. Integração de Configurações no Chat

No Modo Chat IA, as funções do cabeçalho original são integradas ao seletor de Workspaces (Chooser) para manter a interface limpa:
- **Credits**: Visualização de saldo.
- **ML Sync**: Link de sincronização mestre com Mercado Livre.
- **Settings**: Abre os detalhes do Workspace atual.
- **Color Switcher**: Permite a troca da cor de fundo em tempo real.
- **User Profile**: Acesso às configurações de conta do Clerk.

---

## 4. Arquivos Relevantes

| Arquivo | Função |
| :--- | :--- |
| `src/containers/admin/AdminContainer.tsx` | Controlador principal de estado (viewMode, activeTab). |
| `src/components/admin/chat/AdminChatView.tsx` | UI do Chat, definições de App Tags e menus flutuantes. |
| `src/components/admin/ade/AdminShellAde.tsx` | Layout base que organiza o overlay do chat e o conteúdo. |
| `src/components/admin/ade/AdminTopHeader.tsx` | Cabeçalho superior (ocultado condicionalmente no modo chat). |

## 5. Dicas de Customização

- **Cores Dinâmicas**: O chat utiliza `backdrop-blur-md` com opacidade para se adaptar à cor de fundo definida pelo usuário.
- **Animações**: As transições entre os modos de recolhimento do chat utilizam `framer-motion` para garantir um efeito premium de *slide up/down*.
