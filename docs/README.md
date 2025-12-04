# 📜 Scripts Directory

Scripts utilitários para gerenciamento do banco de dados e manutenção.

## 🗄️ **MongoDB Indexes**

### **create-indexes.ts**

Cria todos os índices necessários no MongoDB para otimizar performance de queries.

**Uso:**
```bash
npm run create-indexes
# ou
npm run db:indexes
```

**Requisitos:**
- Variável de ambiente `MONGODB_URI` configurada
- Permissões de criação de índices no MongoDB

**O que faz:**
- Cria índices compostos para queries frequentes (userId + dashboardId)
- Cria índices de ordenação (createdAt, orderIndex)
- É idempotente - pode rodar múltiplas vezes sem problemas
- Pula índices que já existem

**Índices criados:**
- `contacts`: userId+dashboardId, userId+workspaceId, createdAt
- `notes`: userId+dashboardId, userId+workspaceId, createdAt
- `tiles`: userId+dashboardId, userId+workspaceId, createdAt, orderIndex
- `workspaces`: userId, sessionId (unique, sparse)

---

## 🔐 **Segurança**

⚠️ **Importante:** O script de criação de índices requer:
- Acesso ao MongoDB (connection string)
- Permissões de criação de índices
- Não exponha `MONGODB_URI` publicamente

---

## 📚 **Referências**

- [MongoDB Index Best Practices](https://docs.mongodb.com/manual/indexes/)
- [Compound Indexes](https://docs.mongodb.com/manual/core/index-compound/)
- [Index Creation](https://docs.mongodb.com/manual/reference/method/db.collection.createIndex/)

