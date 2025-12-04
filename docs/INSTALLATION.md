# 🚀 Guia de Instalação - Arquitetura de Persistência

Este guia passo-a-passo te ajuda a configurar a arquitetura completa de persistência de dados (Guest vs Member) com MongoDB e Redis Cache.

---

## 📋 **PRÉ-REQUISITOS**

- ✅ Conta no [Vercel](https://vercel.com)
- ✅ Conta no [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) (ou MongoDB local)
- ✅ Projeto Next.js configurado
- ✅ Clerk configurado para autenticação

---

## 🔧 **PASSO 1: Configurar Redis Cache (Vercel KV ou Upstash)**

### **Opção A: Vercel KV (Nativo)**

1. Acesse o [Vercel Dashboard](https://vercel.com/dashboard)
2. Vá em **Storage** → **Create Database**
3. Selecione **KV** (Key-Value)
4. Configure:
   - **Name:** `ai-saas-kv`
   - **Region:** Escolha mais próximo dos seus usuários
5. Após criar, o Vercel automaticamente adiciona estas variáveis:
   - `KV_REST_API_URL`
   - `KV_REST_API_TOKEN`
   - `KV_REST_API_READ_ONLY_TOKEN`
   - `KV_URL`

### **Opção B: Upstash Redis (Marketplace - Recomendado)**

1. Acesse o [Vercel Dashboard](https://vercel.com/dashboard)
2. Vá em **Storage** → **Marketplace**
3. Selecione **Upstash** → **Serverless Redis**
4. Clique em **Create Database**
5. Configure:
   - **Name:** `ai-saas-redis`
   - **Region:** Escolha mais próximo dos seus usuários
   - **Type:** Free tier (até 10K requests/dia) ou Paid
6. Após criar, o Vercel automaticamente adiciona estas variáveis:
   - `UPSTASH_REDIS_REST_URL`
   - `UPSTASH_REDIS_REST_TOKEN`

---

## 📦 **PASSO 2: Instalar Dependências**

```bash
# Instalar Vercel KV (se usar Opção A)
npm install @vercel/kv

# OU instalar Upstash Redis (se usar Opção B)
npm install @upstash/redis

# Ou instalar ambos (o código detecta automaticamente qual usar)
npm install @vercel/kv @upstash/redis
```

---

## 🔐 **PASSO 3: Configurar Environment Variables**

Adicione as variáveis de ambiente no seu `.env.local` (desenvolvimento) e no Vercel Dashboard (produção):

### **Para Vercel KV:**
```env
KV_REST_API_URL=https://...
KV_REST_API_TOKEN=...
KV_REST_API_READ_ONLY_TOKEN=...
KV_URL=redis://...
```

### **Para Upstash Redis:**
```env
UPSTASH_REDIS_REST_URL=https://...
UPSTASH_REDIS_REST_TOKEN=...
```

### **Variáveis já configuradas:**
```env
# MongoDB
MONGODB_URI=mongodb+srv://...

# Clerk
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
```

---

## ✅ **PASSO 4: Verificar Implementação do Cache**

O código já está implementado em `src/lib/cache/redis.ts`. Ele detecta automaticamente qual cliente Redis está disponível:

- ✅ Se `KV_REST_API_URL` e `KV_REST_API_TOKEN` existem → usa Vercel KV
- ✅ Se `UPSTASH_REDIS_REST_URL` e `UPSTASH_REDIS_REST_TOKEN` existem → usa Upstash
- ✅ Se nenhum estiver disponível → cache desabilitado (app continua funcionando)

**Verificar se está funcionando:**

1. Inicie o servidor de desenvolvimento:
   ```bash
   npm run dev
   ```

2. Procure no console por:
   ```
   [Cache] ✅ Using Vercel KV
   ```
   ou
   ```
   [Cache] ✅ Using Upstash Redis
   ```

3. Se aparecer:
   ```
   [Cache] ⚠️ No Redis client available - caching will be disabled
   ```
   Verifique se as variáveis de ambiente estão configuradas corretamente.

---

## 🗄️ **PASSO 5: Configurar Índices MongoDB**

### **Opção A: Script Automático (Recomendado) 🚀**

Crie os índices automaticamente usando o script incluído:

```bash
# Instalar tsx se ainda não tiver
npm install --save-dev tsx

# Executar script de criação de índices
npm run create-indexes
```

O script é **idempotente** - pode rodar múltiplas vezes sem problemas. Ele:
- ✅ Cria todos os índices necessários
- ✅ Pula índices que já existem
- ✅ Mostra resumo de índices criados
- ✅ Verifica conexão antes de executar

**O que o script cria:**
- `contacts`: userId+dashboardId, userId+workspaceId, createdAt
- `notes`: userId+dashboardId, userId+workspaceId, createdAt
- `tiles`: userId+dashboardId, userId+workspaceId, createdAt, orderIndex
- `workspaces`: userId, sessionId (unique, sparse)

### **Opção B: Manual (MongoDB Shell)**

Se preferir criar manualmente, execute no MongoDB Shell ou MongoDB Compass:

```bash
# Via MongoDB Shell
mongosh "mongodb+srv://user:password@cluster.mongodb.net/database"
```

```javascript
// Selecionar o database
use dashboard-engine

// Índices para Contacts
db.contacts.createIndex({ userId: 1, dashboardId: 1 }, { name: "idx_contacts_user_dashboard" });
db.contacts.createIndex({ userId: 1, workspaceId: 1 }, { name: "idx_contacts_user_workspace" });
db.contacts.createIndex({ createdAt: -1 }, { name: "idx_contacts_created" });

// Índices para Notes
db.notes.createIndex({ userId: 1, dashboardId: 1 }, { name: "idx_notes_user_dashboard" });
db.notes.createIndex({ userId: 1, workspaceId: 1 }, { name: "idx_notes_user_workspace" });
db.notes.createIndex({ createdAt: -1 }, { name: "idx_notes_created" });

// Índices para Tiles
db.tiles.createIndex({ userId: 1, dashboardId: 1 }, { name: "idx_tiles_user_dashboard" });
db.tiles.createIndex({ userId: 1, workspaceId: 1 }, { name: "idx_tiles_user_workspace" });
db.tiles.createIndex({ createdAt: -1 }, { name: "idx_tiles_created" });
db.tiles.createIndex({ orderIndex: 1 }, { name: "idx_tiles_order" });

// Índices para Workspaces
db.workspaces.createIndex({ userId: 1 }, { name: "idx_workspaces_user" });
db.workspaces.createIndex({ sessionId: 1 }, { name: "idx_workspaces_session", unique: true, sparse: true });
```

### **Verificar Índices Criados:**

```bash
# Via script (mostra todos)
npm run create-indexes

# Ou via MongoDB Shell
db.contacts.getIndexes()
db.notes.getIndexes()
db.tiles.getIndexes()
```

### **API Route (Produção)**

Para criar índices via API em produção (com autenticação):

```bash
POST /api/db/create-indexes
Headers: Authorization: Bearer <ADMIN_SECRET>
```

Configure `ADMIN_SECRET` no `.env.local`:
```env
ADMIN_SECRET=your-secret-key-here
```

---

## 🧪 **PASSO 6: Testar a Implementação**

### **Teste 1: Verificar Cache Funcionando**

1. Crie um contact como **Member** (usuário autenticado)
2. Verifique os logs do servidor:
   ```
   [API] /api/workspace/contacts - Contact saved to MongoDB
   [Cache] Invalidated contacts cache for dashboard ...
   ```

3. Busque os contacts novamente:
   ```
   [API] /api/workspace/contacts - Serving from cache
   ```

### **Teste 2: Verificar Guest vs Member**

1. **Como Guest:**
   - Crie um contact
   - Verifique que salva em `localStorage` (não no MongoDB)
   - Logs devem mostrar: `Contact saved to localStorage`

2. **Como Member:**
   - Faça login
   - Crie um contact
   - Verifique que salva no MongoDB
   - Logs devem mostrar: `Contact saved to MongoDB`

### **Teste 3: Verificar Invalidação de Cache**

1. Crie um contact como Member
2. Edite o contact
3. Verifique que o cache foi invalidado:
   ```
   [Cache] Invalidated contacts cache for dashboard ...
   ```

---

## 🐛 **TROUBLESHOOTING**

### **Problema: Cache não está funcionando**

**Sintomas:**
- Logs mostram: `[Cache] ⚠️ No Redis client available`
- Sempre busca do MongoDB (nunca do cache)

**Soluções:**
1. Verifique se as variáveis de ambiente estão configuradas:
   ```bash
   # No terminal
   echo $KV_REST_API_URL
   echo $UPSTASH_REDIS_REST_URL
   ```

2. Reinicie o servidor de desenvolvimento após adicionar variáveis

3. Verifique se as dependências estão instaladas:
   ```bash
   npm list @vercel/kv @upstash/redis
   ```

### **Problema: Erro ao conectar no MongoDB**

**Sintomas:**
- Erro: `MONGODB_CIRCUIT_OPEN`
- Timeout ao conectar

**Soluções:**
1. Verifique a connection string no `.env.local`
2. Verifique se o IP está na whitelist do MongoDB Atlas
3. Verifique se o usuário tem permissões de leitura/escrita

### **Problema: Contacts/Notes não aparecem para Members**

**Sintomas:**
- Dados aparecem para Guests mas não para Members

**Soluções:**
1. Verifique se o `workspaceId` está sendo passado nas queries
2. Verifique se os índices MongoDB foram criados
3. Verifique os logs do servidor para erros

---

## 📊 **MONITORAMENTO**

### **Verificar Cache Hit Rate**

Adicione logs customizados para monitorar cache hits:

```typescript
// Em src/lib/cache/redis.ts
export const cache = {
  // ... existing code
  async get<T>(key: string): Promise<T | null> {
    // ... existing code
    if (cached) {
      console.log(`[Cache] ✅ HIT: ${key}`);
    } else {
      console.log(`[Cache] ❌ MISS: ${key}`);
    }
    // ... rest of code
  },
};
```

### **Verificar Performance MongoDB**

No MongoDB Atlas Dashboard:
1. Vá em **Performance Advisor**
2. Verifique queries lentas
3. Adicione índices sugeridos

---

## ✅ **CHECKLIST FINAL**

Antes de considerar a instalação completa:

- [ ] Redis cache configurado (Vercel KV ou Upstash)
- [ ] Dependências instaladas (`@vercel/kv` ou `@upstash/redis`)
- [ ] Environment variables configuradas
- [ ] Cache funcionando (logs mostram "Using Vercel KV" ou "Using Upstash Redis")
- [ ] Índices MongoDB criados
- [ ] Teste Guest funcionando (salva em localStorage)
- [ ] Teste Member funcionando (salva no MongoDB)
- [ ] Cache invalidation funcionando
- [ ] Performance aceitável (< 200ms para queries)

---

## 🚀 **PRÓXIMOS PASSOS**

Após completar a instalação:

1. **Monitorar performance** no Vercel Dashboard
2. **Ajustar TTL** do cache conforme necessário (`src/lib/cache/redis.ts`)
3. **Adicionar mais índices** MongoDB se necessário
4. **Configurar alertas** para cache misses altos

---

## 📚 **REFERÊNCIAS**

- [Vercel KV Docs](https://vercel.com/docs/storage/vercel-kv)
- [Upstash Redis Docs](https://docs.upstash.com/redis)
- [MongoDB Indexes Guide](https://docs.mongodb.com/manual/indexes/)
- [Next.js Environment Variables](https://nextjs.org/docs/basic-features/environment-variables)

---

**Dúvidas?** Consulte o arquivo `vercel-kv.md` para detalhes da arquitetura completa! 🎉

