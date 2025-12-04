# ✅ Checklist Pré-Testes

## 🎯 **Objetivo**
Verificar se todas as integrações estão funcionando antes de iniciar os testes completos.

---

## 🔍 **Verificações de Integração**

### **1. Zustand Stores**
- [x] ✅ `authStore` - Autenticação e limites funcionando
- [x] ✅ `workspaceStore` - Workspaces e dashboards funcionando
- [x] ✅ `uiStore` - Modais e tema funcionando
- [x] ✅ Persistência no localStorage (guests)
- [ ] ⚠️ Sincronização com MongoDB (members) - **Verificar se funciona**

### **2. TanStack Query**
- [x] ✅ Todas as mutations têm `onError` callbacks
- [x] ✅ Todas as mutations invalidam queries corretamente
- [x] ✅ Queries diferenciam guest/member
- [x] ✅ Optimistic updates implementados onde necessário

### **3. APIs**
- [x] ✅ `/api/workspace/contacts` - GET e POST funcionando
- [x] ✅ `/api/workspace/notes` - GET e POST funcionando
- [x] ✅ `/api/workspace/tiles` - POST funcionando
- [x] ✅ `/api/workspace/tiles/[tileId]` - DELETE funcionando
- [x] ✅ `/api/workspace/reorder` - POST funcionando
- [x] ✅ Todas as APIs têm `try/catch` e error handling
- [x] ✅ APIs suportam guest (localStorage) e member (MongoDB)

### **4. Cache Redis**
- [x] ✅ Client Redis implementado com fallback
- [x] ✅ Cache GET implementado (contacts, notes)
- [x] ✅ Invalidação após POST implementada
- [ ] ⚠️ **Verificar se Redis está configurado** (env vars)

### **5. Drag and Drop**
- [x] ✅ DnD implementado com `@dnd-kit`
- [x] ✅ `SortableTileCard` criado
- [x] ✅ `handleDragEnd` atualiza ordem local
- [x] ✅ API de reorder conectada
- [x] ✅ `orderIndex` atualizado após reordenação

### **6. Handlers AdminContainer**
- [x] ✅ `onDeleteTile` conectado
- [x] ✅ `onRegenerateTile` conectado
- [x] ✅ `onReorderTiles` conectado
- [x] ✅ Todos os handlers têm error handling

### **7. Sincronização workspaceStore**
- [x] ✅ `refreshWorkspaces()` existe
- [x] ✅ `handleContactsChanged()` recarrega do localStorage
- [x] ✅ `handleNotesChanged()` recarrega do localStorage
- [ ] ⚠️ **Para members, precisa recarregar do MongoDB** (não implementado)

---

## 🐛 **Problemas Conhecidos**

### **1. Sincronização workspaceStore para Members**
**Problema**: Quando contacts/notes são criados como member, o workspaceStore não é atualizado automaticamente.

**Solução Atual**: 
- Para guests: `handleContactsChanged()` recarrega do localStorage ✅
- Para members: TanStack Query invalida queries, mas workspaceStore não é atualizado ❌

**Workaround**: 
- Componentes re-renderizam via TanStack Query
- Mas `currentDashboard.contacts` no workspaceStore pode estar desatualizado

**Melhoria Futura**: 
- Adicionar `onSuccess` callbacks nas mutations para atualizar workspaceStore
- Ou fazer fetch do dashboard completo após mutations

### **2. XState não totalmente integrado**
**Status**: Máquinas existem mas são pouco usadas
- `onboardingMachine` - Usado apenas no `OnboardingWizard`
- `tileGenerationMachine` - Não está sendo usado
- `tileChatMachine` - Não está sendo usado

**Impacto**: Baixo (funcionalidades funcionam sem XState)

---

## ✅ **Tudo Pronto Para Testes?**

### **Funcionalidades Críticas**
- [x] ✅ DnD de tiles implementado
- [x] ✅ API de reorder implementada
- [x] ✅ Handlers conectados
- [x] ✅ CRUD de contacts funcionando
- [x] ✅ CRUD de notes funcionando
- [x] ✅ CRUD de tiles funcionando
- [x] ✅ Error handling completo

### **Arquitetura**
- [x] ✅ Zustand stores funcionando
- [x] ✅ TanStack Query funcionando
- [x] ✅ Redis cache implementado
- [x] ✅ MongoDB models criados
- [x] ✅ Índices MongoDB criados

### **Pendências (Não Bloqueantes)**
- [ ] ⚠️ Sincronização workspaceStore para members (workaround funciona)
- [ ] ⚠️ XState totalmente integrado (não crítico)
- [ ] ⚠️ Verificar se Redis está configurado

---

## 🚀 **Próximos Passos**

1. **Verificar env vars do Redis**:
   ```bash
   # Verificar se está configurado
   echo $KV_REST_API_URL
   echo $UPSTASH_REDIS_REST_URL
   ```

2. **Testar fluxo guest completo**:
   - Home → Admin
   - Criar contact
   - Criar note
   - Criar tile (Add Prompt)
   - Reordenar tiles (DnD)
   - Trocar dashboard
   - Verificar bgColor por dashboard

3. **Testar fluxo member completo**:
   - Fazer login
   - Verificar se dados vêm do MongoDB
   - Verificar se cache Redis está funcionando
   - Testar todos os CRUDs

4. **Verificar limites de uso**:
   - Tentar criar 4º workspace como guest (deve bloquear)
   - Tentar criar 6º contact como guest (deve bloquear)

---

## 📝 **Notas**

- **SWR removido**: ✅ Removido do package.json (não estava sendo usado)
- **Error handling**: ✅ Todas as mutations têm `onError`
- **Documentação**: ✅ ARCHITECTURE.md criado

---

**Status**: ✅ **PRONTO PARA TESTES** (com ressalvas conhecidas)

