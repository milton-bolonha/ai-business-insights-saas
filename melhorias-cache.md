# Plano de Melhorias: Cache e Refetch Automático

## 📋 **ANÁLISE ATUAL**

### **O que já existe:**

#### 1. **Cache Redis (Parcial)**
- ✅ **Usado em:** `/api/workspace/contacts` e `/api/workspace/notes`
- ❌ **Não usado em:** `/api/workspace/list` (busca direta no MongoDB)
- **TTL:** 5 minutos (contacts/notes), 10 minutos (tiles)

#### 2. **Cache Client-Side (Zustand)**
- ✅ Dados em memória no `workspaceStore`
- ✅ Guests: `localStorage` como backup
- ✅ Members: dados do servidor mantidos em memória

#### 3. **Refetch Automático (Limitado)**
- ✅ `WorkspaceSync` roda quando usuário vira member
- ❌ **Não há refetch em window focus ou reconnect**
- ⚠️ `refreshWorkspaces()` é manual (apenas ao carregar página)

---

## 🎯 **O QUE O TANSTACK QUERY ADICIONARIA**

### **1. Cache Client-Side Inteligente**
- **Hoje:** Dados vêm do Zustand (sempre do store)
- **Com TanStack Query:** Cache por query key, deduplicação de requests, invalidação granular

**Ganho:** ⚠️ **Médio** - Zustand já mantém dados em memória, mas sem deduplicação

### **2. Refetch Automático**
- **Hoje:** Não há refetch em window focus/reconnect
- **Com TanStack Query:** `refetchOnWindowFocus: true` e `refetchOnReconnect: true` funcionariam

**Ganho:** ✅ **Alto** - Dados podem ficar desatualizados se usuário deixar aba aberta

### **3. Retry Automático**
- **Hoje:** Mutations não têm retry
- **Com TanStack Query:** Retry configurado (até 3x para erros de rede)

**Ganho:** ⚠️ **Médio** - Útil para falhas temporárias de rede

### **4. Request Deduplication**
- **Hoje:** Múltiplos componentes podem fazer mesmo fetch
- **Com TanStack Query:** Deduplica automaticamente

**Ganho:** ⚠️ **Baixo** - Zustand já centraliza dados

### **5. Optimistic Updates**
- **Hoje:** Algumas mutations já fazem updates otimistas manualmente
- **Com TanStack Query:** Suporte nativo com rollback

**Ganho:** ⚠️ **Baixo** - Já implementado manualmente

---

## 📊 **COMPARAÇÃO DIRETA**

| Recurso | Hoje | Com TanStack Query | Ganho |
|---------|------|-------------------|-------|
| **Cache server-side** | Redis (parcial) | Redis (igual) | ❌ Nenhum |
| **Cache client-side** | Zustand | TanStack Query + Zustand | ⚠️ Baixo |
| **Refetch window focus** | ❌ Não | ✅ Sim | ✅ **Alto** |
| **Refetch reconnect** | ❌ Não | ✅ Sim | ✅ **Alto** |
| **Retry automático** | ❌ Não | ✅ Sim | ⚠️ Médio |
| **Deduplicação requests** | Manual | Automático | ⚠️ Baixo |
| **Loading states** | Manual | Automático | ⚠️ Médio |
| **Error states** | Manual | Automático | ⚠️ Médio |

---

## 🎯 **CONCLUSÃO**

**Ganho Real:** ⚠️ **Médio-Alto** (principalmente por refetch automático)

### **O que você ganharia:**
1. ✅ **Refetch automático** em window focus/reconnect (**Alto**)
2. ⚠️ **Retry automático** em falhas de rede (**Médio**)
3. ⚠️ **Loading/error states** automáticos (**Médio**)
4. ⚠️ **Cache mais granular** e invalidação precisa (**Baixo-Médio**)

### **O que não mudaria muito:**
- ❌ Cache server-side (Redis continua igual)
- ❌ Performance geral (Zustand já é eficiente)
- ⚠️ Complexidade (aumentaria um pouco)

---

## 🚀 **OPÇÕES DE IMPLEMENTAÇÃO**

### **OPÇÃO 1: Implementação Completa com TanStack Query** ⭐

#### **Passo 1: Usar queries existentes**

Modificar `src/lib/stores/contentHooks.ts` para usar queries:

```typescript
// Em vez de:
const tiles = currentDashboard?.tiles || [];

// Usar:
const { data: tiles = [], isLoading } = useTiles(currentDashboard?.id || '');
```

#### **Passo 2: Integrar com Zustand**

Manter sincronização entre TanStack Query e Zustand:

```typescript
// Em useTiles, após fetch bem-sucedido:
onSuccess: (data) => {
  // Atualizar Zustand store
  useWorkspaceStore.getState().setTiles(currentDashboard.id, data);
}
```

#### **Passo 3: Adicionar refetch automático**

Já configurado no `queryClient`:
- `refetchOnWindowFocus: true`
- `refetchOnReconnect: true`
- `refetchOnMount: true`

#### **Passo 4: Expandir cache Redis**

Adicionar cache Redis em `/api/workspace/list`:

```typescript
// src/app/api/workspace/list/route.ts
import { cache, cacheKeys, CACHE_TTL } from "@/lib/cache/redis";

export async function GET() {
  const { userId } = await getAuth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Verificar cache
  const cacheKey = cacheKeys.workspaces(userId);
  const cached = await cache.get<WorkspaceWithDashboards[]>(cacheKey);
  if (cached) {
    return NextResponse.json({ workspaces: cached });
  }

  // Buscar do MongoDB
  const workspaces = await fetchWorkspacesFromMongo(userId);

  // Salvar no cache
  await cache.set(cacheKey, workspaces, CACHE_TTL.workspaces);

  return NextResponse.json({ workspaces });
}
```

**Prós:**
- ✅ Refetch automático completo
- ✅ Retry automático
- ✅ Loading/error states automáticos
- ✅ Cache granular e invalidação precisa

**Contras:**
- ⚠️ Mais complexidade (2 sistemas de cache)
- ⚠️ Mais código para manter
- ⚠️ Possível duplicação de dados (TanStack Query + Zustand)

---

### **OPÇÃO 2: Alternativa Simples (Recomendada)** ⭐⭐⭐

#### **Passo 1: Adicionar refetch em window focus**

Criar hook `useAutoRefresh.ts`:

```typescript
// src/containers/admin/hooks/useAutoRefresh.ts
import { useEffect } from "react";
import { useAuthStore } from "@/lib/stores/authStore";
import { useWorkspaceStore } from "@/lib/stores/workspaceStore";

export function useAutoRefresh() {
  const { isMember } = useAuthStore();
  const refreshWorkspaces = useWorkspaceStore((state) => state.refreshWorkspaces);

  useEffect(() => {
    if (!isMember) return;

    const handleFocus = () => {
      console.log("[AutoRefresh] Window focused - refreshing workspaces");
      refreshWorkspaces();
    };

    const handleOnline = () => {
      console.log("[AutoRefresh] Network reconnected - refreshing workspaces");
      refreshWorkspaces();
    };

    window.addEventListener("focus", handleFocus);
    window.addEventListener("online", handleOnline);

    return () => {
      window.removeEventListener("focus", handleFocus);
      window.removeEventListener("online", handleOnline);
    };
  }, [isMember, refreshWorkspaces]);
}
```

#### **Passo 2: Usar hook no AdminContainer**

```typescript
// src/containers/admin/AdminContainer.tsx
import { useAutoRefresh } from "./hooks/useAutoRefresh";

export function AdminContainer() {
  // ... código existente
  
  // Adicionar auto-refresh
  useAutoRefresh();
  
  // ... resto do código
}
```

#### **Passo 3: Adicionar retry simples nas mutations**

Criar helper para retry:

```typescript
// src/lib/utils/retry.ts
export async function retry<T>(
  fn: () => Promise<T>,
  maxAttempts = 3,
  delay = 1000
): Promise<T> {
  let lastError: Error;
  
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      
      // Não retry em erros 4xx (client errors)
      if (error && typeof error === 'object' && 'status' in error) {
        const status = (error as { status: number }).status;
        if (status >= 400 && status < 500) {
          throw error;
        }
      }
      
      if (attempt < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, delay * attempt));
      }
    }
  }
  
  throw lastError!;
}
```

Usar em mutations críticas:

```typescript
// src/lib/state/query/tile.queries.ts
import { retry } from "@/lib/utils/retry";

export function useCreateTile() {
  return useMutation({
    mutationFn: async (variables) => {
      return retry(async () => {
        const response = await fetch("/api/workspace/tiles", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(variables),
        });
        if (!response.ok) throw new Error("Failed to create tile");
        return response.json();
      });
    },
    // ... resto
  });
}
```

#### **Passo 4: Expandir cache Redis**

Adicionar cache Redis em `/api/workspace/list` (mesmo código da Opção 1, Passo 4).

**Prós:**
- ✅ Simples e direto
- ✅ Menos complexidade
- ✅ Mantém arquitetura atual (Zustand como fonte de verdade)
- ✅ Refetch automático funcional
- ✅ Retry opcional onde necessário

**Contras:**
- ⚠️ Não tem loading/error states automáticos (mas já existem manualmente)
- ⚠️ Não tem deduplicação automática (mas Zustand já centraliza)

---

## 📝 **CHECKLIST DE IMPLEMENTAÇÃO**

### **Opção 1: TanStack Query Completo**
- [ ] Modificar `useContent` para usar queries
- [ ] Integrar queries com Zustand store
- [ ] Adicionar cache Redis em `/api/workspace/list`
- [ ] Testar refetch automático
- [ ] Testar retry automático
- [ ] Verificar loading/error states
- [ ] Documentar nova arquitetura

### **Opção 2: Alternativa Simples (Recomendada)**
- [ ] Criar `useAutoRefresh.ts` hook
- [ ] Adicionar `useAutoRefresh()` no `AdminContainer`
- [ ] Criar helper `retry.ts` (opcional)
- [ ] Adicionar retry em mutations críticas (opcional)
- [ ] Adicionar cache Redis em `/api/workspace/list`
- [ ] Testar refetch em window focus
- [ ] Testar refetch em reconnect
- [ ] Documentar melhorias

---

## 🎯 **RECOMENDAÇÃO FINAL**

**Recomendo a Opção 2 (Alternativa Simples)** porque:

1. ✅ **Menos complexidade** - Mantém arquitetura atual
2. ✅ **Ganho real** - Resolve o problema principal (refetch automático)
3. ✅ **Fácil de manter** - Código simples e direto
4. ✅ **Sem duplicação** - Zustand continua como fonte de verdade
5. ✅ **Escalável** - Pode adicionar TanStack Query depois se necessário

A Opção 1 (TanStack Query completo) faz sentido se você:
- Quiser loading/error states automáticos
- Precisar de cache muito granular
- Tiver muitas queries diferentes
- Quiser deduplicação automática de requests

---

## 📚 **REFERÊNCIAS**

- **TanStack Query Docs:** https://tanstack.com/query/latest
- **Zustand Docs:** https://zustand-demo.pmnd.rs/
- **Redis Cache:** `src/lib/cache/redis.ts`
- **Workspace Store:** `src/lib/stores/workspaceStore.ts`
- **Content Hooks:** `src/lib/stores/contentHooks.ts`

