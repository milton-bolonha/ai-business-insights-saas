# Relatório de Diagnóstico – AI SaaS (Love Writers)

**Data:** 13 de Março de 2026  
**Versão Next.js:** 16.0.7  
**Build:** Webpack  

---

## 1. Resumo Executivo

O projeto enfrenta três grupos principais de problemas:

1. **Erro no console:** Tile não encontrado no `workspaceStore` ao atualizar o conteúdo após geração
2. **401 Unauthorized:** API `/api/workspace/books` rejeita acesso ao workspace antes de ele existir no MongoDB
3. **Advertências de stack:** Next.js 16 (middleware deprecated, `baseline-browser-mapping` desatualizado)

---

## 2. Problema Principal: "Tile not found"

### 2.1 Sintoma

```
[DEBUG] workspaceStore updateTile: Tile not found "tile_3b39af6e-3d16-4270-a3dc-c9e300b3d4ed"
```

**Call stack:**
- `workspaceStore.ts` linha 1063: `updateTileInDashboard`
- `AdminContainer.tsx` linha 158: `generateNextTile` (SequentialWriter)

### 2.2 Fluxo Envolvido

1. **SequentialWriter** (`AdminContainer.tsx`, linhas 90–184):
   - `useEffect` com deps `[currentWorkspace, currentDashboard, content]`
   - Quando o workspace usa template `template_love_writers`:
     - Localiza o próximo tile vazio (`content === null` ou `""`)
     - Chama `/api/generate/tile` (chamada assíncrona ~40s)
     - Ao retornar, chama `updateTileInDashboard(workspaceId, dashboardId, nextTile.id, { content })`

2. **workspaceStore.updateTileInDashboard** (`workspaceStore.ts`, linhas 1025–1067):
   - Procura o tile em `dashboard.tiles` por `tileId`
   - Se não encontrar → `console.error` "Tile not found"
   - A atualização não é aplicada

### 2.3 Hipótese de Causa Raiz

**Race condition:** durante a geração (~40s), o `refreshWorkspaces` pode rodar e substituir os dados do dashboard.

- O servidor retorna workspaces/dashboards com **0 tiles** (MongoDB ainda não tem tiles do Love Writers)
- A lógica de merge tenta preservar tiles locais quando `localDash.tiles.length > serverDash.tiles.length`
- Se `refreshWorkspaces` rodar em paralelo (ex.: `onRehydrateStorage`, `usePaymentFlow`, sync-usage), o merge pode falhar em alguns cenários e o dashboard ficar sem tiles

### 2.4 Arquivos e Funções Relevantes

| Arquivo | Função / Trecho | Papel |
|---------|-----------------|-------|
| `src/containers/admin/AdminContainer.tsx` | `useEffect` (~90–184) | `generateNextTile` – orquestra a geração sequencial |
| `src/containers/admin/AdminContainer.tsx` | Linha 157–162 | Chama `updateTileInDashboard` após a API retornar |
| `src/lib/stores/workspaceStore.ts` | `updateTileInDashboard` (1025–1067) | Atualiza o tile; hoje só loga quando não encontra |
| `src/lib/stores/workspaceStore.ts` | `refreshWorkspaces` (234–426) | Merge server + local; pode sobrescrever tiles durante a geração |
| `src/lib/stores/workspaceStore.ts` | `onRehydrateStorage` (~1142–1145) | Dispara `refreshWorkspaces` na reidratação |

---

## 3. Problema 401: Workspace não existe no MongoDB

### 3.1 Sintoma

```
[authorizeWorkspaceAccess] DB result: Not found
[Security] Security event detected: { type: 'unauthorized_access', ... }
GET /api/workspace/books?workspaceId=session_7718890d-036d-47c7-82ee-7827690a9dda 401
```

Depois:

```
[api/workspace/create] Workspace created: session_7718890d-036d-47c7-82ee-7827690a9dda
POST /api/workspace/create 200
```

### 3.2 Causa

Ordem das operações:

1. Usuário abre `/admin?workspaceId=session_7718890d...` (ex.: após onboarding)
2. `BookLibrarySection` monta e `useBooks(workspaceId)` chama `GET /api/workspace/books`
3. A rota usa `getAuthAndAuthorize(workspaceId)` → `authorizeWorkspaceAccess`
4. O workspace ainda **não foi criado no MongoDB** (ou o `workspace/create` ainda não terminou)
5. `authorizeWorkspaceAccess` retorna `authorized: false` → 401
6. `workspace/create` roda depois (onboarding ou outro fluxo) e cria o workspace

### 3.3 Arquivos e Funções

| Arquivo | Função / Trecho | Papel |
|---------|-----------------|-------|
| `src/app/api/workspace/books/route.ts` | `GET` (linhas 6–47) | Chama `getAuthAndAuthorize` antes de buscar livros |
| `src/lib/auth/authorize.ts` | `authorizeWorkspaceAccess` (10–56) | Verifica workspace no MongoDB (members) ou localStorage (guests) |
| `src/lib/state/query/book.queries.ts` | `useBooks` | Faz fetch em `/api/workspace/books` com `workspaceId` |
| `src/components/love-writers/BookLibrarySection.tsx` | Linha 23 | `useBooks(workspaceId)` – pode chamar antes do workspace existir |
| `src/app/api/workspace/create/route.ts` | `POST` | Cria workspace + dashboard no MongoDB (sem tiles) |

---

## 4. Outros Pontos

### 4.1 Next.js e Dependências

- **Next.js 16.0.7:** Aviso de versão desatualizada
- **Middleware deprecated:** Next.js recomenda usar `proxy` em vez de `middleware`
- **baseline-browser-mapping:** Dados com mais de dois meses; sugestão: `npm i baseline-browser-mapping@latest -D`

### 4.2 Logs do Console

- `contentTiles: 0` no AdminContainer mesmo após geração
- `[DEBUG] saveWorkspacesWithDashboards: saving to localStorage` com `count: 16`
- `[SequentialWriter] Completed tile: I. The Before (Destiny)` – geração conclui, mas o tile não é encontrado na store

---

## 5. Mudanças em Andamento (Git Status)

### 5.1 Arquivos Modificados

| Arquivo | Contexto |
|---------|----------|
| `package.json`, `package-lock.json` | Dependências |
| `src/app/api/generate/route.ts` | Geração de conteúdo |
| `src/app/api/generate/tile/route.ts` | Geração de tiles |
| `src/app/api/migrate-guest-data/route.ts` | Migração guest → member |
| `src/app/api/workspace/create/route.ts` | Criação de workspace |
| `src/components/admin/AdminOnboardingHandler.tsx` | Fluxo de onboarding |
| `src/components/admin/ade/AdminTopHeader.tsx` | Header admin |
| `src/containers/admin/AdminContainer.tsx` | Container principal + SequentialWriter |
| `src/containers/admin/hooks/useGuestDataMigration.ts` | Migração automática |
| `src/lib/auth/authorize.ts` | Autorização de workspace/dashboard |
| `src/lib/auth/get-auth.ts` | Autenticação |
| `src/lib/db/migration-helpers.ts` | Helpers de migração |
| `src/lib/middleware/rate-limit.ts` | Rate limiting |
| `src/lib/saas/usage-service.ts` | Uso de créditos |
| `src/lib/state/query/index.ts` | React Query |
| `src/lib/stores/workspaceStore.ts` | Store de workspaces e tiles |
| `src/middleware.ts` | Middleware Next.js |

### 5.2 Arquivos Novos (untracked)

| Arquivo | Contexto |
|---------|----------|
| `src/app/api/generate/book-stream/` | API de stream para livros |
| `src/app/api/workspace/books/` | CRUD de livros por workspace |
| `src/components/love-writers/` | UI Love Writers (BookLibrarySection, BookWriterView) |
| `src/lib/db/books.ts` | Acesso a livros no banco |
| `src/lib/db/models/Book.ts` | Modelo de livro |
| `src/lib/hooks/useBookStream.ts` | Hook de stream de livro |
| `src/lib/state/query/book.queries.ts` | Queries de livros |

---

## 6. Fluxo Love Writers (visão geral)

```
[Home] → Onboarding (Love Writers)
    ↓
handleLoveWritersCreation (AdminOnboardingHandler)
    ↓
getGuestTemplate("template_love_writers") → 6 arcs (tiles)
    ↓
resolveTemplateTiles + processPromptVariables
    ↓
Tiles criados com id: `tile_${crypto.randomUUID()}`, content: null
    ↓
initializeWorkspaceFromHome(workspaceSnapshot)
    ↓
getOrCreateWorkspaceFromWorkspaceSnapshot → dashboards com tiles
    ↓
workspace/create (MongoDB) → workspace + dashboard (sem tiles)
    ↓
refreshWorkspaces → merge server + local
    ↓
Redirect /admin?workspaceId=session_xxx
    ↓
AdminContainer monta
    ↓
SequentialWriter useEffect → gera tile 1, 2, ... até 6
    ↓
Para cada tile: POST /api/generate/tile → updateTileInDashboard
```

---

## 7. Sugestões de Correção

### 7.1 Tile not found

1. **Proteger o merge durante geração:** desabilitar `refreshWorkspaces` ou ignorar merge de tiles enquanto `isGenerating` for true.
2. **addTileToDashboard como fallback:** se o tile não existir em `updateTileInDashboard`, criar o tile em vez de apenas logar.
3. **Debounce em refreshWorkspaces:** evitar chamadas durante geração ativa.

### 7.2 401 em /api/workspace/books

1. **Garantir workspace criado antes de books:** garantir que `workspace/create` rode antes de montar `BookLibrarySection` ou chamar `useBooks`.
2. **Auto-criar na API:** se o workspace não existir e o usuário for membro, chamar `workspace/create` internamente ou retornar `{ books: [] }` sem 401.
3. **Retry em useBooks:** em caso de 401, aguardar/retentar após o workspace ser criado (ex.: invalidando query após `workspace/create`).

### 7.3 Dependências

1. Atualizar `baseline-browser-mapping`
2. Planejar migração de `middleware` para `proxy` (Next.js)
3. Revisar upgrade de Next.js (compatibilidade e breaking changes)

---

## 8. Referências de Código

- **SequentialWriter:** `src/containers/admin/AdminContainer.tsx` linhas 90–184
- **updateTileInDashboard:** `src/lib/stores/workspaceStore.ts` linhas 1025–1067
- **refreshWorkspaces + merge:** `src/lib/stores/workspaceStore.ts` linhas 322–382
- **authorizeWorkspaceAccess:** `src/lib/auth/authorize.ts` linhas 10–56
- **workspace/create:** `src/app/api/workspace/create/route.ts`
- **BookLibrarySection + useBooks:** `src/components/love-writers/BookLibrarySection.tsx`, `src/lib/state/query/book.queries.ts`
