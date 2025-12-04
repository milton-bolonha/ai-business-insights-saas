# 🏗️ Arquitetura do Sistema - AI SaaS

## 📋 **Visão Geral**

Este documento descreve a arquitetura completa do sistema, incluindo gerenciamento de estado, persistência de dados, cache, integrações e **segurança**.

---

## 🎯 **Stack Tecnológico**

### **Frontend**

- **Next.js 16** (App Router)
- **React 19**
- **TypeScript**
- **Tailwind CSS 4**

### **Estado e Dados**

- **Zustand** - Estado global UI (authStore, workspaceStore, uiStore)
- **TanStack Query** - Server state management (queries e mutations)
- **XState** - Máquinas de estado para fluxos complexos
- **localStorage** - Persistência para guests
- **MongoDB** - Persistência para members

### **Cache**

- **Redis** (Vercel KV ou Upstash) - Cache serverless para members

### **Autenticação**

- **Clerk** - Autenticação e gerenciamento de usuários

### **Segurança**

- **Rate Limiting** - Proteção contra abuso usando Redis
- **CSP + Secure Headers** - Headers de segurança no Next.js
- **Audit Logging** - Logs imutáveis de ações críticas
- **Security Monitoring** - Detecção de eventos de segurança
- **File Validation** - Validação segura de uploads

---

## 🧩 **Arquitetura de Estado**

### **1. Zustand Stores (Estado Global UI)**

#### **authStore** (`src/lib/stores/authStore.ts`)

- **Responsabilidade**: Autenticação, limites de uso, status de membro
- **Persistência**: localStorage (apenas dados de guest)
- **Estado**:
  - `user`: Dados do usuário (Clerk)
  - `usage`: Contadores de uso (tileChat, contactChat, regenerate, etc.)
  - `limits`: Limites por tipo de usuário (GUEST_LIMITS vs MEMBER_LIMITS)
  - `isMember`, `isGuest`: Getters computados
- **Ações**:
  - `canPerformAction(action)`: Verifica se ação é permitida
  - `consumeUsage(action)`: Consome uso e retorna resultado
  - `startCheckout()`: Inicia checkout Stripe

#### **workspaceStore** (`src/lib/stores/workspaceStore.ts`)

- **Responsabilidade**: Workspaces, dashboards e conteúdo (tiles, notes, contacts)
- **Persistência**: localStorage (guests) ou MongoDB (members via API)
- **Estado**:
  - `workspaces`: Array de workspaces
  - `currentWorkspace`: Workspace ativo
  - `currentDashboard`: Dashboard ativo
- **Ações**:
  - `createWorkspace`, `updateWorkspace`, `deleteWorkspace`
  - `createDashboard`, `updateDashboard`, `deleteDashboard`
  - `switchWorkspace`, `setActiveDashboard`
  - `initializeWorkspaceFromHome`: Cria workspace a partir do formulário da home

#### **uiStore** (`src/lib/stores/uiStore.ts`)

- **Responsabilidade**: Estado da UI (modais, tema, seleções)
- **Persistência**: Não persiste (estado temporário)
- **Estado**:
  - `modals`: Estado de abertura/fechamento de modais
  - `appearance`: Tokens de tema ADE
  - `selectedTile`, `selectedContact`: Seleções atuais

### **2. TanStack Query (Server State)**

#### **Queries** (`src/lib/state/query/`)

- **tile.queries.ts**: `useCreateTile`, `useRegenerateTile`, `useDeleteTile`, `useReorderTiles`, `useChatWithTile`
- **contact.queries.ts**: `useCreateContact`, `useUpdateContact`, `useDeleteContact`, `useChatWithContact`
- **note.queries.ts**: `useCreateNote`, `useUpdateNote`, `useDeleteNote`
- **workspace.queries.ts**: `useWorkspace`, `useCreateWorkspace`, `useDeleteWorkspace`

#### **Características**:

- ✅ **Optimistic Updates**: Atualizações otimistas para melhor UX
- ✅ **Error Handling**: Todas as mutations têm `onError` callbacks
- ✅ **Cache Invalidation**: Invalidação automática após mutations
- ✅ **Guest/Member Differentiation**: Lógica condicional baseada em `userId`

### **3. XState (Fluxos Complexos)**

#### **Máquinas Implementadas** (`src/lib/state/machines/`)

- **onboarding.machine.ts**: Wizard multi-step para criação de workspace
- **tileGeneration.machine.ts**: Geração de tiles com progresso
- **tileChat.machine.ts**: Chat com tiles (histórico, attachments)

#### **Uso**:

- Máquinas são usadas diretamente com `useMachine` do `@xstate/react`
- Não estão integradas com Zustand (usadas isoladamente em componentes)

---

## 💾 **Persistência de Dados**

### **Guest Users (localStorage)**

- **Armazenamento**: `localStorage` via `dashboards-store.ts`
- **Chave**: `insights_workspaces`
- **Estrutura**: Workspaces → Dashboards → Tiles/Notes/Contacts
- **Sincronização**: Imediata (escrita direta no localStorage)

### **Member Users (MongoDB)**

- **Armazenamento**: MongoDB Atlas
- **Collections**: `workspaces`, `dashboards`, `tiles`, `contacts`, `notes`
- **Modelos**: `src/lib/db/models/` (ContactDocument, NoteDocument, TileDocument)
- **Índices**: Criados programaticamente via `scripts/create-indexes.ts`

### **Cache Redis (Members)**

- **Implementação**: `src/lib/cache/redis.ts`
- **Suporte**: Vercel KV (prioridade) ou Upstash Redis (fallback)
- **TTL**:
  - Contacts: 5 minutos
  - Notes: 5 minutos
  - Tiles: 10 minutos
  - Workspaces: 30 minutos
- **Invalidação**: Automática após mutations via `invalidateResourceCache`

### **Audit Logs (MongoDB)**

- **Collection**: `audit_logs`
- **Armazenamento**: MongoDB (imutável)
- **Índices**: Otimizados para queries por usuário, evento, recurso e timestamp
- **Eventos Rastreados**: Login, CRUD operations, pagamentos, rate limits, security violations

---

## 🔄 **Fluxo de Dados**

### **Criação de Contact/Note (Guest)**

```
1. Usuário preenche formulário
2. AdminContainer → content.createContact()
3. useContent → useCreateContact mutation
4. API POST /api/workspace/contacts
5. API salva em localStorage via addContactToDashboard()
6. AdminContainer.handleContactsChanged() recarrega do localStorage
7. workspaceStore atualizado via refreshWorkspaces()
```

### **Criação de Contact/Note (Member)**

```
1. Usuário preenche formulário
2. AdminContainer → content.createContact()
3. useContent → useCreateContact mutation
4. API POST /api/workspace/contacts
5. API salva no MongoDB
6. API invalida cache Redis
7. TanStack Query invalida queries
8. Componente re-renderiza com dados atualizados
```

### **Reordenação de Tiles**

```
1. Usuário arrasta tile (DnD)
2. TileGridAde.handleDragEnd() atualiza ordem local
3. TileGridAde chama onReorderTiles(order)
4. AdminContainer → content.reorderTiles()
5. useContent → useReorderTiles mutation
6. API POST /api/workspace/reorder
7. API atualiza orderIndex no MongoDB/localStorage
8. API invalida cache (se member)
9. workspaceStore atualizado via refreshWorkspaces()
```

---

## 🔐 **Segurança**

### **1. Rate Limiting** (`src/lib/middleware/rate-limit.ts`)

**Características**:

- ✅ Rate limiting baseado em IP (guests) ou userId (members)
- ✅ Usa Redis para tracking distribuído
- ✅ Limites configuráveis:
  - **Public**: 10 req/min
  - **Authenticated**: 100 req/min
  - **Critical** (AI, payments): 5 req/min
- ✅ Fail-open: Se Redis falhar, permite requisição (não bloqueia app)
- ✅ Headers de resposta: `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `Retry-After`

**Integração**:

- Integrado no `src/middleware.ts` para todas as rotas `/api/*`
- Audit logging automático quando rate limit é excedido

### **2. Content Security Policy (CSP) + Secure Headers** (`next.config.ts`)

**Headers Implementados**:

- ✅ **Content-Security-Policy**: Proteção contra XSS
- ✅ **X-Frame-Options**: `SAMEORIGIN` (previne clickjacking)
- ✅ **X-Content-Type-Options**: `nosniff` (previne MIME sniffing)
- ✅ **Referrer-Policy**: `strict-origin-when-cross-origin`
- ✅ **Permissions-Policy**: Desabilita features desnecessárias
- ✅ **Strict-Transport-Security**: HSTS para HTTPS

**Aplicação**: Todos os headers aplicados a todas as rotas (`/:path*`)

### **3. Audit Logging** (`src/lib/audit/logger.ts`)

**Características**:

- ✅ Sistema de logging estruturado e imutável
- ✅ Armazenamento no MongoDB (collection `audit_logs`)
- ✅ Índices otimizados para queries rápidas
- ✅ Eventos rastreados:
  - Login/logout
  - Criação/deleção de workspaces, dashboards, tiles, contacts, notes
  - Pagamentos (checkout, success, failed)
  - Rate limit exceeded
  - Security violations
  - API errors

**Funções de Conveniência**:

- `audit.login()`, `audit.logout()`
- `audit.createWorkspace()`, `audit.deleteWorkspace()`
- `audit.createTile()`, `audit.deleteTile()`
- `audit.createContact()`, `audit.deleteContact()`
- `audit.createNote()`, `audit.deleteNote()`
- `audit.rateLimitExceeded()`
- `audit.securityViolation()`
- `audit.apiError()`

**Integração**: Integrado em todas as APIs críticas

### **4. Security Monitoring** (`src/lib/monitoring/security.ts`)

**Características**:

- ✅ Detecção de eventos de segurança
- ✅ Níveis de severidade: low, medium, high, critical
- ✅ Integração com audit logging
- ✅ Funções de monitoramento:
  - `detectSuspiciousLogin()` - Padrões de login suspeitos
  - `detectUnusualUsage()` - Uso anormal de API
  - `monitorRateLimit()` - Violações de rate limit
  - `monitorUnauthorizedAccess()` - Tentativas de acesso não autorizado

**Integração**:

- Integrado em `src/lib/auth/authorize.ts` - Monitora tentativas de acesso não autorizado
- Integrado em `src/lib/middleware/rate-limit.ts` - Monitora rate limit violations

### **5. Secure File Handling** (`src/lib/security/file-validator.ts`)

**Características**:

- ✅ Validação de tipo de arquivo (MIME type)
- ✅ Validação de extensão
- ✅ Limite de tamanho (configurável, padrão 10MB)
- ✅ Sanitização de filename (previne path traversal)
- ✅ Renomeação automática (previne colisões e ataques)

**Integração**:

- Integrado em `src/components/admin/ade/BulkUploadModal.tsx`
- Validação antes de processar uploads

### **6. Authorization** (`src/lib/auth/authorize.ts`)

**Características**:

- ✅ Validação de acesso a workspaces
- ✅ Validação de acesso a dashboards
- ✅ Validação de acesso a recursos (tiles, contacts, notes)
- ✅ Separação clara entre members (MongoDB) e guests (localStorage)
- ✅ Security monitoring integrado

**Funções**:

- `authorizeWorkspaceAccess()` - Valida acesso a workspace
- `authorizeDashboardAccess()` - Valida acesso a dashboard
- `authorizeResourceAccess()` - Valida acesso a recurso
- `getAuthAndAuthorize()` - Conveniência para APIs

---

## ⚠️ **Pontos de Atenção**

### **1. Sincronização workspaceStore após Mutations**

- **Problema**: Quando contacts/notes são criados via API, o workspaceStore não é atualizado automaticamente
- **Solução Atual**: `AdminContainer` tem `handleContactsChanged()` e `handleNotesChanged()` que recarregam do localStorage
- **Limitação**: Funciona apenas para guests (localStorage). Para members, precisa recarregar do MongoDB
- **Melhoria Futura**: Adicionar `onSuccess` callbacks nas mutations para atualizar workspaceStore diretamente

### **2. XState não está totalmente integrado**

- **Status**: Máquinas existem mas são usadas isoladamente
- **Uso Atual**: Apenas `OnboardingWizard` usa `onboardingMachine`
- **Oportunidade**: Integrar máquinas com Zustand via `zustand-middleware-xstate` (futuro)

### **3. Persistência Condicional**

- **Guest**: Tudo em localStorage
- **Member**: Tudo em MongoDB + cache Redis
- **Transição**: Quando guest vira member, dados precisam ser migrados (não implementado)

---

## 📊 **Diagrama de Arquitetura**

```
┌─────────────────────────────────────────────────────────────┐
│                        Frontend (React)                      │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   Zustand    │  │ TanStack    │  │   XState     │      │
│  │   Stores     │  │   Query     │  │  Machines    │      │
│  │              │  │             │  │              │      │
│  │ • authStore  │  │ • Queries   │  │ • onboarding │      │
│  │ • workspace  │  │ • Mutations │  │ • tileGen    │      │
│  │ • uiStore    │  │ • Cache     │  │ • tileChat   │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│         │                 │                  │              │
│         └─────────────────┼──────────────────┘              │
│                           │                                  │
│                    ┌──────▼──────┐                          │
│                    │  useContent │                          │
│                    │    Hook     │                          │
│                    └──────┬──────┘                          │
└───────────────────────────┼──────────────────────────────────┘
                            │
                            │ HTTP Requests
                            │
┌───────────────────────────▼──────────────────────────────────┐
│                    Next.js API Routes                        │
├──────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────────────────────────────────────────────┐   │
│  │              Middleware Layer                        │   │
│  │  • Rate Limiting (Redis)                            │   │
│  │  • Authentication (Clerk)                           │   │
│  │  • Security Monitoring                              │   │
│  └──────────────────────────────────────────────────────┘   │
│                           │                                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │   /api/      │  │   /api/      │  │   /api/      │     │
│  │ workspace/   │  │ workspace/  │  │ workspace/   │     │
│  │  contacts    │  │   notes     │  │    tiles     │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
│         │                 │                  │             │
│         └─────────────────┼──────────────────┘             │
│                           │                                 │
│                    ┌──────▼──────┐                         │
│                    │   getAuth()  │                         │
│                    │  (userId?)  │                         │
│                    └──────┬──────┘                         │
│                           │                                 │
│              ┌────────────┴────────────┐                   │
│              │                         │                   │
│      ┌───────▼──────┐         ┌───────▼──────┐           │
│      │   Guest      │         │    Member    │           │
│      │ localStorage │         │   MongoDB    │           │
│      └──────────────┘         └───────┬──────┘           │
│                                       │                   │
│              ┌───────────────────────┼──────────────┐   │
│              │                       │              │   │
│      ┌───────▼──────┐      ┌───────▼──────┐  ┌────▼──┐│
│      │ Audit Logs   │      │ Redis Cache │  │ Rate  ││
│      │ (MongoDB)    │      │ (Upstash)   │  │ Limit ││
│      └──────────────┘      └─────────────┘  │(Redis)││
│                                             └────────┘│
└───────────────────────────────────────────────────────────┘
```

---

## 🧪 **Checklist de Integração**

### **✅ Implementado**

- [x] Zustand stores (authStore, workspaceStore, uiStore)
- [x] TanStack Query mutations com error handling
- [x] Redis cache com fallback (Vercel KV → Upstash)
- [x] MongoDB models e índices
- [x] Persistência condicional (guest vs member)
- [x] DnD de tiles com @dnd-kit
- [x] API de reorder implementada
- [x] Handlers conectados no AdminContainer
- [x] **Rate Limiting** - Proteção contra abuso
- [x] **CSP + Secure Headers** - Headers de segurança
- [x] **Audit Logging** - Logs imutáveis de ações críticas
- [x] **Security Monitoring** - Detecção de eventos de segurança
- [x] **Secure File Handling** - Validação de uploads
- [x] **Authorization** - Sistema de autorização em camadas

### **⚠️ Parcialmente Implementado**

- [ ] XState machines (existem mas pouco usadas)
- [ ] Sincronização workspaceStore após mutations (funciona para guests, limitado para members)

### **❌ Não Implementado**

- [ ] Migração de dados guest → member
- [ ] Integração XState com Zustand
- [ ] SSR-safe stores (vanilla createStore)

---

## 📝 **Próximos Passos**

1. **Testes Completos**: Testar todos os fluxos (guest e member)
2. **Melhorar Sincronização**: Adicionar callbacks para atualizar workspaceStore após mutations
3. **Integrar XState**: Usar máquinas em mais lugares (tile generation, chat)
4. **SSR Optimization**: Migrar para vanilla createStore para melhor SSR
5. **Fase 2 de Segurança**: Zero Trust interno, melhorias de file handling
6. **Fase 3 de Segurança**: 2FA, encryption at rest, data minimization

---

## 🔒 **Conformidade com Princípios de Segurança**

### **✅ Implementado (9/20)**

1. ✅ **Defense in Depth** - Múltiplas camadas de segurança
2. ✅ **Least Privilege** - Usuários só acessam seus recursos
3. ✅ **Input Validation** - Validação em todas as APIs
4. ✅ **Error Handling Seguro** - Erros não expõem informações sensíveis
5. ✅ **Rate Limiting** - Proteção contra abuso
6. ✅ **Audit Logging** - Logs imutáveis de ações críticas
7. ✅ **Secure by Default** - CSP + Headers de segurança
8. ✅ **Security Monitoring** - Detecção de eventos de segurança
9. ✅ **Secure File Handling** - Validação de uploads

### **⚠️ Parcialmente Implementado (5/20)**

10. ⚠️ **Zero Trust** - APIs validam, mas não todas as rotas internas
11. ⚠️ **Separation of Concerns** - Bom, mas pode melhorar
12. ⚠️ **Authorization Hardening** - Básico, falta RBAC/ABAC
13. ⚠️ **Secure Secrets Management** - Usa Vercel Env, mas sem rotação
14. ⚠️ **DB Hardening** - Índices criados, falta validação de schema

### **❌ Não Implementado (6/20)**

15. ❌ **CIA Triad completo** - Falta encrypt-at-rest
16. ❌ **Authentication Hardening** - Falta 2FA
17. ❌ **Secure Dependency Management** - Scripts criados, falta CI/CD
18. ❌ **Data Minimization Policy** - Não implementado
19. ❌ **Encryption Everywhere** - Falta encrypt-at-rest
20. ❌ **Content Security Policy** - Implementado, mas pode ser mais restritivo

---

**Última atualização**: 2025-01-XX
**Versão**: 2.0.0 (com segurança)
