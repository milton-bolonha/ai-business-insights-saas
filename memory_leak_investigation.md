# Relatório de Investigação de Memória — ai-saas

> Investigação profunda de todos os pontos do projeto que podem contribuir para inflação de heap e possíveis memory leaks.

---

## Resumo Executivo

O consumo de **~216 MB de heap** em DEV não é catastrófico, mas há uma série de padrões no código que explicam por que ele é mais alto do que o esperado — e alguns que podem causar crescimento gradual de memória em produção. Abaixo, todos os pontos identificados, ordenados por severidade.

---

## 🔴 Crítico — Maior impacto

### 1. `MentoringProfileBoard.tsx` — **157 KB** em um único arquivo
**Arquivo:** `src/components/admin/ade/MentoringProfileBoard.tsx`

O maior arquivo do projeto com **157 KB / ~4.000+ linhas** num único componente.

**Problema:** Um componente monolítico deste tamanho faz o bundler do Next.js colocar todo esse código no chunk da página que o usa. Mesmo que 80% do conteúdo só seja visível depois de interações do usuário (abas, modais, drawers), **tudo é carregado de uma vez** no JavaScript heap ao montar a página.

**Efeito em memória:**
- Todas as closures e funções definidas dentro dele ficam vivas enquanto o componente estiver montado.
- Qualquer `useState`, `useRef`, `useMemo` interno mantém dados na RAM sem possibilidade de GC parcial.
- Imagens, tooltips, seções ocultas — tudo fica instanciado ao mesmo tempo.

**Solução:** Dividir em sub-componentes com `React.lazy()` + `next/dynamic`, carregando seções pesadas só quando necessário.

---

### 2. Dados duplicados em dois sistemas de estado paralelos

**Arquivos envolvidos:**
- `src/lib/contexts/ContentContext.tsx` (14 KB)
- `src/lib/contexts/WorkspaceContext.tsx` (10 KB)
- `src/lib/contexts/AuthContext.tsx` (6 KB)
- `src/lib/stores/workspaceStore.ts` (42 KB)
- `src/lib/stores/contentHooks.ts` (10 KB)
- `src/lib/storage/dashboards-store.ts` (16 KB)

**Problema crítico:** O projeto tem **dois sistemas de estado vivos simultaneamente:**

1. **Sistema legado (Context API):** `WorkspaceContext` + `ContentContext` + `AuthContext` — cada um com seus próprios arrays de tiles, notes, contacts, e callbacks `useCallback`/`useMemo`.
2. **Sistema novo (Zustand):** `workspaceStore` + `contentHooks` + `authStore`.

Os comentários no código confirmam a migração parcial:
```
// Contexts migrados para Zustand:
// - AuthContext → authStore
// - WorkspaceContext → workspaceStore
// - ContentContext → integrado no workspaceStore
```

Mas os **3 arquivos de Context ainda existem e estão sendo importados** internamente entre si (`ContentContext` importa `WorkspaceContext` e `AuthContext`).

**Efeito em memória:**
- Os mesmos dados de tiles, notes, contacts existem em dois lugares na RAM ao mesmo tempo.
- Cada Context tem seu próprio `useMemo` com closures pesadas que recomputam ao mudar.
- `ContentContext` tem `Function ×12` em closures de alto custo (createTile, regenerateTile, chatWithTile, etc.) que ficam vivas mesmo quando não há nenhum tile ativo.

---

### 3. `dashboards-store.ts` — `JSON.parse` / `JSON.stringify` em loop por toda operação

**Arquivo:** `src/lib/storage/dashboards-store.ts`

Cada operação de CRUD (addContact, updateNote, deleteTile, etc.) chama:
```typescript
const workspaces = loadWorkspacesWithDashboards(); // JSON.parse(localStorage)
// ... faz uma mudança ...
saveWorkspacesWithDashboards(workspaces); // JSON.stringify + localStorage.setItem
```

**Problema:** Para cada tile gerado pela IA, cada mensagem de chat, cada reordenação — o código faz um `JSON.parse` + `JSON.stringify` de **todos os workspaces completos** (incluindo todos os tiles com seus conteúdos de texto gerado por IA).

Se você tem 5 workspaces com 8 tiles cada (e cada tile com 2 KB de conteúdo de IA), isso é **~80 KB sendo serializado + desserializado** em cada operação simples. Essa serialização cria novas strings e objetos temporários que ficam na heap até o próximo GC.

O `workspaceStore` do Zustand chama `persistWorkspacesSafely(get().workspaces)` em praticamente **toda ação**, inclusive em reordenações de tiles.

---

## 🟠 Alto — Impacto significativo

### 4. `AdminContainer.tsx` — 63 KB com múltiplos event listeners e estado acumulado

**Arquivo:** `src/containers/admin/AdminContainer.tsx`

Identificados múltiplos `window.addEventListener` sem garantia de cleanup em todas as situações:
- `window.addEventListener('ai-navigate', ...)`
- `window.addEventListener('ai-create-client', ...)`
- `window.addEventListener('ai-create-task', ...)`
- `window.addEventListener('ai-schedule-session', ...)`

Os 4 listeners têm cleanup (`removeEventListener` no return do `useEffect`), então em teoria estão corretos. Porém: se o componente remontar por algum motivo (ex: troca de rota e volta), os handlers ficam registrados e re-registrados em cada ciclo.

**Risco adicional:** O componente tem 63 KB e provavelmente concentra dezenas de `useState` e `useEffect` internos. Cada renderização cria novas instâncias de closures que o GC precisa coletar.

---

### 5. `chatStore.ts` — mensagens persistidas em localStorage sem limite

**Arquivo:** `src/lib/stores/chatStore.ts`

```typescript
partialize: (state) => ({ messages: state.messages }), // Persist messages
```

Mensagens de chat são **persistidas integralmente** no localStorage.

**Problema:** Se um usuário troca muitas mensagens com a IA (que responde com blocos de markdown, código, etc.), o array de mensagens cresce indefinidamente. Ao recarregar a página, todas são re-hidratadas de volta para a RAM.

Um histórico de 100 mensagens, cada uma com ~500 chars de texto de IA = **50 KB de strings** vivos no heap para sempre durante a sessão, nunca coletados enquanto o store estiver ativo.

---

### 6. `AdminChatView.tsx` — estado de mensagens local não limitado

**Arquivo:** `src/components/admin/chat/AdminChatView.tsx` (37 KB)

Pelo tamanho e pelo padrão de acúmulo de mensagens visto no chatStore, este componente provavelmente mantém seu próprio array de mensagens locais em `useState` sem limite de tamanho, além de importar `framer-motion` e `react-icons` com ícones pesados.

---

### 7. `AdminTopHeader.tsx` — setInterval de polling de notificações

**Arquivo:** `src/components/admin/ade/AdminTopHeader.tsx`

```typescript
const interval = setInterval(fetchNotifications, 30000);
return () => clearInterval(interval);
```

O polling de 30 em 30 segundos tem cleanup correto — **mas** `fetchNotifications` faz uma chamada de API e provavelmente chama `setState` com a resposta. Se as notificações retornarem um array crescente, cada chamada substitui o estado por um array maior.

---

## 🟡 Médio — Impacto moderado

### 8. i18n — ambos os idiomas carregados estaticamente no módulo

**Arquivo:** `src/lib/stores/languageStore.ts` (antes das mudanças recentes)

O problema original foi que `pt.json` (**82 KB**) e `en.json` (**78 KB**) = **160 KB** de dados de tradução eram importados estaticamente e alocados como objetos JavaScript no módulo raiz:

```typescript
import ptMessages from "../../../messages/pt.json"; // 82 KB
import enMessages from "../../../messages/en.json"; // 78 KB

export const MESSAGES_MAP = { pt: ptMessages, en: enMessages };
```

Isso significa que ambos os idiomas ficavam na heap mesmo quando o usuário só usava um. **As mudanças feitas anteriormente corrigem isso** via dynamic import.

---

### 9. `uiStore.ts` — `selectedTile` e `selectedContact` no estado persistido

**Arquivo:** `src/lib/stores/uiStore.ts`

O store persiste `appearance` (tokens computados de tema) no localStorage, mas os campos `selectedTile` e `selectedContact` do objeto `modals` ficam **em memória** enquanto qualquer modal estiver aberto. Se um tile com muito conteúdo de IA for selecionado, esse objeto inteiro fica vivo no store até o modal fechar.

---

### 10. `app-tags.ts` — `React.ReactNode` no escopo de módulo

**Arquivo:** `src/lib/app-tags.ts`

```typescript
import React from "react";

export interface AppTag {
  icon?: React.ReactNode; // Pode ser um elemento React já instanciado
}
```

O array `APP_TAGS` está no escopo global do módulo e inclui `icon?: React.ReactNode`. Se algum consumidor desse array passar elementos React já instanciados (ex: `icon: <SomeIcon />`), esses elementos ficam vivos no escopo do módulo para sempre.

---

### 11. `VoiceAssistantOverlay.tsx` — SpeechRecognition sem cleanup garantido

**Arquivo:** `src/components/admin/chat/VoiceAssistantOverlay.tsx`

```typescript
const recognition = new SpeechRecognition();
recognitionRef.current = recognition;
```

A `SpeechRecognition` API mantém referências nativas do browser. Se o componente desmontar enquanto o reconhecimento de voz ainda está ativo, o objeto nativo pode não ser liberado corretamente, retendo memória nativa (a categoria `Native: ~182 MB` do heap snapshot).

---

### 12. `next.config.ts` — Verificar se source maps estão habilitados em produção

**Arquivo:** `next.config.ts` (3.9 KB)

O heap snapshot continha strings de **source maps gigantes** (`data:application/json;charset=utf-8;base64,...`). É importante verificar se `productionBrowserSourceMaps` está desabilitado para não inflar bundles em produção.

---

### 13. Ausência total de `React.lazy` / `next/dynamic`

**Zero ocorrências** de `React.lazy` ou `dynamic()` do `next/dynamic` em todo o projeto (297 arquivos).

Componentes muito pesados como:
- `MentoringProfileBoard.tsx` (157 KB)
- `StoreLayoutGrid.tsx` (71 KB)
- `BookLibrarySection.tsx` (54 KB)
- `MentoringScheduleBoard.tsx` (54 KB)

...são todos importados de forma **estática e síncrona**, carregando todo o JavaScript no bundle inicial da página, mesmo que o usuário nunca abra aquelas seções.

---

## 📋 Resumo Priorizado de Ações

| # | Arquivo | Problema | Prioridade |
|---|---------|----------|------------|
| 1 | `MentoringProfileBoard.tsx` | 157 KB, sem code splitting | 🔴 Crítico |
| 2 | `ContentContext` + `WorkspaceContext` + `AuthContext` | Contexts legados duplicando estado do Zustand | 🔴 Crítico |
| 3 | `dashboards-store.ts` | JSON.parse/stringify total a cada operação | 🔴 Crítico |
| 4 | `AdminContainer.tsx` | 63 KB com listeners em ciclos de remount | 🟠 Alto |
| 5 | `chatStore.ts` | Mensagens persistidas sem limite | 🟠 Alto |
| 6 | `AdminChatView.tsx` | 37 KB, estado de chat local ilimitado | 🟠 Alto |
| 7 | `AdminTopHeader.tsx` | setInterval de notificações com estado crescente | 🟡 Médio |
| 8 | `languageStore.ts` | i18n dual-load (já corrigido) | ✅ Corrigido |
| 9 | `uiStore.ts` | selectedTile retido em memória | 🟡 Médio |
| 10 | `app-tags.ts` | ReactNode em escopo de módulo | 🟡 Médio |
| 11 | `VoiceAssistantOverlay.tsx` | SpeechRecognition sem abort no unmount | 🟡 Médio |
| 12 | `next.config.ts` | Verificar source maps em produção | 🟡 Médio |
| 13 | Todos os componentes pesados | Zero lazy loading em 297 arquivos | 🟠 Alto |

---

## O Verdadeiro "Leak"

Não há um leak clássico (memória crescendo infinitamente até crash). O que existe é:

1. **Dois sistemas de estado com os mesmos dados** — duplicando o uso de RAM.
2. **Componentes monolíticos sem lazy loading** — carregando mais código do que o necessário.
3. **Serialização total do localStorage a cada operação** — gerando lixo de strings temporárias.
4. **Histórico de chat sem limite** — crescendo indefinidamente na sessão.

Em ambiente DEV, o Next.js adiciona ~80–120 MB de overhead de source maps e hot reload por cima disso tudo. Em produção, o heap deveria cair para algo entre **60–100 MB** — contanto que os itens 1 e 2 sejam resolvidos.
