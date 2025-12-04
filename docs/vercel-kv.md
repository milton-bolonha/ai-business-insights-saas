# 🚀 Vercel KV (Redis) - Arquitetura de Persistência Completa

## 📋 **VISÃO GERAL**

Este documento descreve a arquitetura completa de persistência de dados para o sistema SaaS, diferenciando entre **Guests** (localStorage) e **Members** (MongoDB + Redis Cache).

---

## 🎯 **ARQUITETURA PROPOSTA**

### **Fluxo de Dados por Tipo de Usuário**

```
┌─────────────────────────────────────────────────────────────┐
│                    REQUISIÇÃO DO CLIENTE                     │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        ▼
            ┌───────────────────────┐
            │   getAuth() Check     │
            │  userId ? member : guest │
            └───────────┬───────────┘
                        │
        ┌───────────────┴───────────────┐
        │                               │
        ▼                               ▼
┌───────────────┐              ┌───────────────┐
│    GUEST      │              │    MEMBER     │
│               │              │               │
│ • localStorage│              │ • MongoDB     │
│ • Session     │              │ • User-scoped  │
│ • No auth     │              │ • Full CRUD   │
└───────┬───────┘              └───────┬───────┘
        │                               │
        │                               │
        └───────────────┬───────────────┘
                        │
                        ▼
            ┌───────────────────────┐
            │   CACHE LAYER         │
            │                       │
            │ • Vercel KV (Redis)   │
            │ • Shared data cache   │
            │ • TTL-based invalidation│
            └───────────────────────┘
```

---

## 🔧 **VERCEL KV SETUP**

### **Opção 1: Upstash Redis (Marketplace - Recomendado)**

**Upstash** é a solução de Redis serverless mais popular no Vercel Marketplace.

#### **Passo 1: Criar Upstash Database**

1. Acesse o [Vercel Dashboard](https://vercel.com/dashboard)
2. Vá em **Storage** → **Marketplace**
3. Selecione **Upstash** → **Serverless Redis**
4. Clique em **Create Database**
5. Configure:
   - **Name:** `ai-saas-redis`
   - **Region:** Escolha mais próximo dos seus usuários
   - **Type:** Free tier (até 10K requests/dia) ou Paid

#### **Passo 2: Instalar Dependências**

```bash
npm install @upstash/redis
```

#### **Passo 3: Configurar Environment Variables**

O Vercel automaticamente adiciona estas variáveis após criar o database:

```env
UPSTASH_REDIS_REST_URL=https://...
UPSTASH_REDIS_REST_TOKEN=...
```

#### **Passo 4: Criar Client Redis**

```typescript
// src/lib/cache/redis.ts
import { Redis } from "@upstash/redis";

export const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

// Helper functions
export const cache = {
  async get<T>(key: string): Promise<T | null> {
    try {
      const data = await redis.get(key);
      return data ? (data as T) : null;
    } catch (error) {
      console.warn("[Cache] Redis get failed:", error);
      return null;
    }
  },

  async set<T>(key: string, data: T, ttlSeconds?: number): Promise<void> {
    try {
      if (ttlSeconds) {
        await redis.setex(key, ttlSeconds, JSON.stringify(data));
      } else {
        await redis.set(key, JSON.stringify(data));
      }
    } catch (error) {
      console.warn("[Cache] Redis set failed:", error);
    }
  },

  async del(key: string): Promise<void> {
    try {
      await redis.del(key);
    } catch (error) {
      console.warn("[Cache] Redis del failed:", error);
    }
  },

  async invalidatePattern(pattern: string): Promise<void> {
    try {
      // Upstash não suporta KEYS diretamente, use tags ou estrutura de chaves
      // Exemplo: contacts:dashboard:123 → contacts:dashboard:*
      const keys = await redis.keys(pattern);
      if (keys.length > 0) {
        await redis.del(...keys);
      }
    } catch (error) {
      console.warn("[Cache] Redis invalidatePattern failed:", error);
    }
  },
};
```

---

### **Opção 2: Vercel KV (Nativo - Se Disponível)**

Se o Vercel oferecer KV nativo (não apenas no Marketplace):

```bash
npm install @vercel/kv
```

```typescript
// src/lib/cache/vercel-kv.ts
import { kv } from "@vercel/kv";

export const cache = {
  async get<T>(key: string): Promise<T | null> {
    try {
      const data = await kv.get<T>(key);
      return data;
    } catch (error) {
      console.warn("[Cache] Vercel KV get failed:", error);
      return null;
    }
  },

  async set<T>(key: string, data: T, ttlSeconds?: number): Promise<void> {
    try {
      if (ttlSeconds) {
        await kv.setex(key, ttlSeconds, data);
      } else {
        await kv.set(key, data);
      }
    } catch (error) {
      console.warn("[Cache] Vercel KV set failed:", error);
    }
  },

  async del(key: string): Promise<void> {
    try {
      await kv.del(key);
    } catch (error) {
      console.warn("[Cache] Vercel KV del failed:", error);
    }
  },
};
```

**Environment Variables:**

```env
KV_URL=redis://...
KV_REST_API_URL=https://...
KV_REST_API_TOKEN=...
```

---

## 🗄️ **MODELOS MONGODB EXPANDIDOS**

### **1. ContactDocument**

```typescript
// src/lib/db/models/Contact.ts
import type { Document } from "mongodb";
import type { Contact } from "@/lib/types";

export interface ContactDocument extends Document {
  _id?: string;
  userId: string; // Clerk user ID (required for security)
  workspaceId: string;
  dashboardId: string;
  name: string;
  jobTitle?: string;
  linkedinUrl?: string;
  email?: string;
  phone?: string;
  company?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export function contactToDocument(
  contact: Contact,
  userId: string,
  workspaceId: string,
  dashboardId: string
): Omit<ContactDocument, "_id" | "createdAt" | "updatedAt"> {
  return {
    userId,
    workspaceId,
    dashboardId,
    name: contact.name,
    jobTitle: contact.jobTitle,
    linkedinUrl: contact.linkedinUrl,
    email: contact.email,
    phone: contact.phone,
    company: contact.company,
    notes: contact.notes,
  };
}

export function contactDocumentToContact(doc: ContactDocument): Contact {
  return {
    id: doc._id?.toString() || doc.id || `contact_${Date.now()}`,
    name: doc.name,
    jobTitle: doc.jobTitle,
    linkedinUrl: doc.linkedinUrl,
    email: doc.email,
    phone: doc.phone,
    company: doc.company,
    notes: doc.notes,
    createdAt: doc.createdAt.toISOString(),
  };
}
```

### **2. NoteDocument**

```typescript
// src/lib/db/models/Note.ts
import type { Document } from "mongodb";
import type { Note } from "@/lib/types";

export interface NoteDocument extends Document {
  _id?: string;
  userId: string;
  workspaceId: string;
  dashboardId: string;
  title: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
}

export function noteToDocument(
  note: Note,
  userId: string,
  workspaceId: string,
  dashboardId: string
): Omit<NoteDocument, "_id" | "createdAt" | "updatedAt"> {
  return {
    userId,
    workspaceId,
    dashboardId,
    title: note.title,
    content: note.content,
  };
}

export function noteDocumentToNote(doc: NoteDocument): Note {
  return {
    id: doc._id?.toString() || doc.id || `note_${Date.now()}`,
    title: doc.title,
    content: doc.content,
    createdAt: doc.createdAt.toISOString(),
    updatedAt: doc.updatedAt.toISOString(),
  };
}
```

### **3. TileDocument**

```typescript
// src/lib/db/models/Tile.ts
import type { Document } from "mongodb";
import type { Tile } from "@/lib/types";

export interface TileDocument extends Document {
  _id?: string;
  userId: string;
  workspaceId: string;
  dashboardId: string;
  title: string;
  content: string;
  prompt: string;
  templateId?: string;
  category: string;
  model: string;
  orderIndex: number;
  totalTokens?: number;
  attempts?: number;
  history?: any[];
  createdAt: Date;
  updatedAt: Date;
}

export function tileToDocument(
  tile: Tile,
  userId: string,
  workspaceId: string,
  dashboardId: string
): Omit<TileDocument, "_id" | "createdAt" | "updatedAt"> {
  return {
    userId,
    workspaceId,
    dashboardId,
    title: tile.title,
    content: tile.content,
    prompt: tile.prompt,
    templateId: tile.templateId,
    category: tile.category,
    model: tile.model,
    orderIndex: tile.orderIndex,
    totalTokens: tile.totalTokens,
    attempts: tile.attempts,
    history: tile.history,
  };
}

export function tileDocumentToTile(doc: TileDocument): Tile {
  return {
    id: doc._id?.toString() || doc.id || `tile_${Date.now()}`,
    title: doc.title,
    content: doc.content,
    prompt: doc.prompt,
    templateId: doc.templateId,
    category: doc.category,
    model: doc.model,
    orderIndex: doc.orderIndex,
    totalTokens: doc.totalTokens,
    attempts: doc.attempts,
    history: doc.history,
    createdAt: doc.createdAt.toISOString(),
    updatedAt: doc.updatedAt.toISOString(),
  };
}
```

---

## 🔄 **APIS REFATORADAS COM LÓGICA CONDICIONAL**

### **1. Contacts API - Guest vs Member**

```typescript
// src/app/api/workspace/contacts/route.ts
import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { getAuth } from "@/lib/auth/get-auth";
import { db } from "@/lib/db/mongodb";
import {
  contactToDocument,
  contactDocumentToContact,
} from "@/lib/db/models/Contact";
import { addContactToDashboard } from "@/lib/storage/dashboards-store";
import { cache } from "@/lib/cache/redis";
import type { Contact } from "@/lib/types";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const { userId } = await getAuth();

  const name = typeof body?.name === "string" ? body.name.trim() : "";
  const jobTitle =
    typeof body?.jobTitle === "string" ? body.jobTitle.trim() : "";
  const linkedinUrl =
    typeof body?.linkedinUrl === "string" ? body.linkedinUrl.trim() : "";
  const dashboardId =
    typeof body?.dashboardId === "string" ? body.dashboardId.trim() : "";
  const workspaceId =
    typeof body?.workspaceId === "string" ? body.workspaceId.trim() : "";

  if (!name) {
    return NextResponse.json({ error: "Name is required" }, { status: 400 });
  }

  if (!dashboardId) {
    return NextResponse.json(
      { error: "dashboardId is required" },
      { status: 400 }
    );
  }

  try {
    const now = new Date().toISOString();
    const contactId = `contact_${randomUUID()}`;

    const contactData: Contact = {
      id: contactId,
      name,
      jobTitle,
      linkedinUrl,
      email: body?.email || "",
      phone: body?.phone || "",
      company: body?.company || "",
      notes: body?.notes || "",
      createdAt: now,
    };

    if (userId) {
      // 🟢 MEMBER: Salvar no MongoDB
      if (!workspaceId) {
        return NextResponse.json(
          { error: "workspaceId is required for members" },
          { status: 400 }
        );
      }

      const contactDoc = contactToDocument(
        contactData,
        userId,
        workspaceId,
        dashboardId
      );
      const insertedId = await db.insertOne("contacts", {
        ...contactDoc,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      // Invalidate cache
      await cache.del(`contacts:dashboard:${dashboardId}`);
      await cache.del(`contacts:workspace:${workspaceId}`);

      console.log("[API] /api/workspace/contacts - Contact saved to MongoDB", {
        contactId: insertedId,
        userId,
        dashboardId,
      });

      return NextResponse.json({
        success: true,
        contact: { ...contactData, id: insertedId },
      });
    } else {
      // 🟡 GUEST: Salvar no localStorage
      const { loadWorkspacesWithDashboards } = await import(
        "@/lib/storage/dashboards-store"
      );
      const workspaces = loadWorkspacesWithDashboards();
      const workspace = workspaces.find((w) => w.id === workspaceId);

      if (workspace) {
        addContactToDashboard(workspace.id, dashboardId, contactData);
        console.log(
          "[API] /api/workspace/contacts - Contact saved to localStorage",
          {
            contactId,
            workspaceId: workspace.id,
            dashboardId,
          }
        );
      } else {
        return NextResponse.json(
          { error: "Workspace not found" },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        contact: contactData,
      });
    }
  } catch (error) {
    console.error("[API] /api/workspace/contacts - Error:", error);
    return NextResponse.json(
      {
        error: "Failed to create contact",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const dashboardId = searchParams.get("dashboardId");
  const workspaceId = searchParams.get("workspaceId");
  const { userId } = await getAuth();

  if (!dashboardId) {
    return NextResponse.json(
      { error: "dashboardId is required" },
      { status: 400 }
    );
  }

  try {
    if (userId) {
      // 🟢 MEMBER: Buscar do MongoDB (com cache)
      if (!workspaceId) {
        return NextResponse.json(
          { error: "workspaceId is required for members" },
          { status: 400 }
        );
      }

      // Try cache first
      const cacheKey = `contacts:dashboard:${dashboardId}`;
      const cached = await cache.get<Contact[]>(cacheKey);
      if (cached) {
        console.log("[API] /api/workspace/contacts - Serving from cache");
        return NextResponse.json(cached, {
          headers: {
            "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120",
          },
        });
      }

      // Fetch from MongoDB
      const contacts = await db.find("contacts", {
        userId,
        workspaceId,
        dashboardId,
      });

      const mappedContacts = contacts.map((doc: any) =>
        contactDocumentToContact(doc)
      );

      // Cache for 5 minutes
      await cache.set(cacheKey, mappedContacts, 300);

      return NextResponse.json(mappedContacts, {
        headers: {
          "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120",
        },
      });
    } else {
      // 🟡 GUEST: Buscar do localStorage (não pode ser cacheado server-side)
      const { loadWorkspacesWithDashboards } = await import(
        "@/lib/storage/dashboards-store"
      );
      const workspaces = loadWorkspacesWithDashboards();
      const workspace = workspaces.find((w) => w.id === workspaceId);

      if (!workspace) {
        return NextResponse.json([]);
      }

      const dashboard = workspace.dashboards.find((d) => d.id === dashboardId);
      const contacts = dashboard?.contacts || [];

      return NextResponse.json(contacts, {
        headers: {
          "Cache-Control": "private, no-store", // Guests não devem ser cacheados
        },
      });
    }
  } catch (error) {
    console.error("[API] /api/workspace/contacts - Error:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch contacts",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
```

### **2. Notes API - Guest vs Member**

```typescript
// src/app/api/workspace/notes/route.ts
import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { getAuth } from "@/lib/auth/get-auth";
import { db } from "@/lib/db/mongodb";
import { noteToDocument, noteDocumentToNote } from "@/lib/db/models/Note";
import { addNoteToDashboard } from "@/lib/storage/dashboards-store";
import { cache } from "@/lib/cache/redis";
import type { Note } from "@/lib/types";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const { userId } = await getAuth();

  const title = typeof body?.title === "string" ? body.title.trim() : "";
  const content = typeof body?.content === "string" ? body.content.trim() : "";
  const dashboardId =
    typeof body?.dashboardId === "string" ? body.dashboardId.trim() : "";
  const workspaceId =
    typeof body?.workspaceId === "string" ? body.workspaceId.trim() : "";

  if (!title) {
    return NextResponse.json({ error: "Title is required" }, { status: 400 });
  }

  if (!content) {
    return NextResponse.json({ error: "Content is required" }, { status: 400 });
  }

  if (!dashboardId) {
    return NextResponse.json(
      { error: "dashboardId is required" },
      { status: 400 }
    );
  }

  try {
    const now = new Date().toISOString();
    const noteId = `note_${randomUUID()}`;

    const noteData: Note = {
      id: noteId,
      title,
      content,
      createdAt: now,
      updatedAt: now,
    };

    if (userId) {
      // 🟢 MEMBER: Salvar no MongoDB
      if (!workspaceId) {
        return NextResponse.json(
          { error: "workspaceId is required for members" },
          { status: 400 }
        );
      }

      const noteDoc = noteToDocument(
        noteData,
        userId,
        workspaceId,
        dashboardId
      );
      const insertedId = await db.insertOne("notes", {
        ...noteDoc,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      // Invalidate cache
      await cache.del(`notes:dashboard:${dashboardId}`);
      await cache.del(`notes:workspace:${workspaceId}`);

      console.log("[API] /api/workspace/notes - Note saved to MongoDB", {
        noteId: insertedId,
        userId,
        dashboardId,
      });

      return NextResponse.json({
        success: true,
        note: { ...noteData, id: insertedId },
      });
    } else {
      // 🟡 GUEST: Salvar no localStorage
      const { loadWorkspacesWithDashboards } = await import(
        "@/lib/storage/dashboards-store"
      );
      const workspaces = loadWorkspacesWithDashboards();
      const workspace = workspaces.find((w) => w.id === workspaceId);

      if (workspace) {
        addNoteToDashboard(workspace.id, dashboardId, noteData);
        console.log("[API] /api/workspace/notes - Note saved to localStorage", {
          noteId,
          workspaceId: workspace.id,
          dashboardId,
        });
      } else {
        return NextResponse.json(
          { error: "Workspace not found" },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        note: noteData,
      });
    }
  } catch (error) {
    console.error("[API] /api/workspace/notes - Error:", error);
    return NextResponse.json(
      {
        error: "Failed to create note",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const dashboardId = searchParams.get("dashboardId");
  const workspaceId = searchParams.get("workspaceId");
  const { userId } = await getAuth();

  if (!dashboardId) {
    return NextResponse.json(
      { error: "dashboardId is required" },
      { status: 400 }
    );
  }

  try {
    if (userId) {
      // 🟢 MEMBER: Buscar do MongoDB (com cache)
      if (!workspaceId) {
        return NextResponse.json(
          { error: "workspaceId is required for members" },
          { status: 400 }
        );
      }

      // Try cache first
      const cacheKey = `notes:dashboard:${dashboardId}`;
      const cached = await cache.get<Note[]>(cacheKey);
      if (cached) {
        console.log("[API] /api/workspace/notes - Serving from cache");
        return NextResponse.json(cached, {
          headers: {
            "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120",
          },
        });
      }

      // Fetch from MongoDB
      const notes = await db.find("notes", {
        userId,
        workspaceId,
        dashboardId,
      });

      const mappedNotes = notes.map((doc: any) => noteDocumentToNote(doc));

      // Cache for 5 minutes
      await cache.set(cacheKey, mappedNotes, 300);

      return NextResponse.json(mappedNotes, {
        headers: {
          "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120",
        },
      });
    } else {
      // 🟡 GUEST: Buscar do localStorage
      const { loadWorkspacesWithDashboards } = await import(
        "@/lib/storage/dashboards-store"
      );
      const workspaces = loadWorkspacesWithDashboards();
      const workspace = workspaces.find((w) => w.id === workspaceId);

      if (!workspace) {
        return NextResponse.json([]);
      }

      const dashboard = workspace.dashboards.find((d) => d.id === dashboardId);
      const notes = dashboard?.notes || [];

      return NextResponse.json(notes, {
        headers: {
          "Cache-Control": "private, no-store",
        },
      });
    }
  } catch (error) {
    console.error("[API] /api/workspace/notes - Error:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch notes",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
```

---

## 🔄 **TANSTACK QUERIES ATUALIZADAS**

### **Contacts Query - Guest vs Member**

```typescript
// src/lib/state/query/contact.queries.ts
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "@/lib/stores/authStore";
import { loadWorkspacesWithDashboards } from "@/lib/storage/dashboards-store";

export function useContacts(dashboardId: string, workspaceId?: string) {
  const { user } = useAuthStore();
  const isMember = user?.role === "member";

  return useQuery({
    queryKey: [
      "contacts",
      dashboardId,
      workspaceId,
      isMember ? "member" : "guest",
    ],
    queryFn: async () => {
      if (isMember && workspaceId) {
        // 🟢 MEMBER: API (com cache Redis)
        const response = await fetch(
          `/api/workspace/contacts?dashboardId=${dashboardId}&workspaceId=${workspaceId}`
        );
        if (!response.ok) throw new Error("Failed to fetch contacts");
        return response.json();
      } else {
        // 🟡 GUEST: localStorage direto (sem API)
        const workspaces = loadWorkspacesWithDashboards();
        const workspace = workspaces.find((w) =>
          w.dashboards.some((d) => d.id === dashboardId)
        );
        const dashboard = workspace?.dashboards.find(
          (d) => d.id === dashboardId
        );
        return dashboard?.contacts || [];
      }
    },
    enabled: !!dashboardId && (isMember ? !!workspaceId : true),
  });
}

export function useCreateContact() {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const isMember = user?.role === "member";

  return useMutation({
    mutationFn: async ({
      dashboardId,
      workspaceId,
      contactData,
    }: {
      dashboardId: string;
      workspaceId?: string;
      contactData: {
        name: string;
        jobTitle?: string;
        linkedinUrl?: string;
        email?: string;
        phone?: string;
        company?: string;
        notes?: string;
      };
    }) => {
      console.log("[DEBUG] contact.queries.useCreateContact executing:", {
        dashboardId,
        workspaceId,
        contactData,
        isMember,
      });

      if (isMember && workspaceId) {
        // 🟢 MEMBER: API
        const response = await fetch("/api/workspace/contacts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            dashboardId,
            workspaceId,
            ...contactData,
          }),
        });
        if (!response.ok) {
          console.error(
            "[DEBUG] contact.queries.useCreateContact failed:",
            response.status
          );
          throw new Error("Failed to create contact");
        }
        const result = await response.json();
        console.log(
          "[DEBUG] contact.queries.useCreateContact success:",
          result
        );
        return result;
      } else {
        // 🟡 GUEST: localStorage direto (via API para consistência)
        const response = await fetch("/api/workspace/contacts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            dashboardId,
            workspaceId,
            ...contactData,
          }),
        });
        if (!response.ok) throw new Error("Failed to create contact");
        return response.json();
      }
    },
    onSuccess: (data, { dashboardId, workspaceId }) => {
      console.log("[DEBUG] contact.queries.useCreateContact onSuccess:", {
        data,
        dashboardId,
      });
      queryClient.invalidateQueries({
        queryKey: ["contacts", dashboardId, workspaceId],
      });
    },
    onError: (error) => {
      console.error("[DEBUG] contact.queries.useCreateContact onError:", error);
    },
  });
}
```

---

## 📊 **ESTRATÉGIA DE CACHE**

### **Cache Keys Estruturados**

```typescript
// Padrão de chaves para cache
const cacheKeys = {
  contacts: {
    dashboard: (dashboardId: string) => `contacts:dashboard:${dashboardId}`,
    workspace: (workspaceId: string) => `contacts:workspace:${workspaceId}`,
  },
  notes: {
    dashboard: (dashboardId: string) => `notes:dashboard:${dashboardId}`,
    workspace: (workspaceId: string) => `notes:workspace:${workspaceId}`,
  },
  tiles: {
    dashboard: (dashboardId: string) => `tiles:dashboard:${dashboardId}`,
    workspace: (workspaceId: string) => `tiles:workspace:${workspaceId}`,
  },
};
```

### **TTL (Time To Live) Recomendados**

```typescript
const CACHE_TTL = {
  contacts: 300, // 5 minutos
  notes: 300, // 5 minutos
  tiles: 600, // 10 minutos (mudam menos)
  workspaces: 1800, // 30 minutos
};
```

### **Invalidação de Cache**

```typescript
// src/lib/cache/invalidation.ts
import { cache } from "./redis";

export async function invalidateDashboardCache(
  dashboardId: string,
  workspaceId: string
): Promise<void> {
  await Promise.all([
    cache.del(`contacts:dashboard:${dashboardId}`),
    cache.del(`notes:dashboard:${dashboardId}`),
    cache.del(`tiles:dashboard:${dashboardId}`),
    cache.del(`contacts:workspace:${workspaceId}`),
    cache.del(`notes:workspace:${workspaceId}`),
    cache.del(`tiles:workspace:${workspaceId}`),
  ]);
}
```

---

## ✅ **CHECKLIST DE IMPLEMENTAÇÃO**

### **Fase 1: Setup Infraestrutura**

- [ ] Criar Upstash Redis no Vercel Marketplace
- [ ] Instalar `@upstash/redis`
- [ ] Configurar environment variables
- [ ] Criar `src/lib/cache/redis.ts`

### **Fase 2: Modelos MongoDB**

- [ ] Criar `src/lib/db/models/Contact.ts`
- [ ] Criar `src/lib/db/models/Note.ts`
- [ ] Criar `src/lib/db/models/Tile.ts`
- [ ] Adicionar índices no MongoDB:
  ```javascript
  db.contacts.createIndex({ userId: 1, dashboardId: 1 });
  db.notes.createIndex({ userId: 1, dashboardId: 1 });
  db.tiles.createIndex({ userId: 1, dashboardId: 1 });
  ```

### **Fase 3: Refatorar APIs**

- [ ] Refatorar `/api/workspace/contacts/route.ts` (POST + GET)
- [ ] Refatorar `/api/workspace/notes/route.ts` (POST + GET)
- [ ] Refatorar `/api/workspace/tiles/route.ts` (POST + GET)
- [ ] Adicionar lógica condicional guest vs member
- [ ] Implementar cache Redis nas rotas GET

### **Fase 4: Atualizar Queries**

- [ ] Atualizar `useContacts` para diferenciar guest/member
- [ ] Atualizar `useNotes` para diferenciar guest/member
- [ ] Atualizar `useTiles` para diferenciar guest/member
- [ ] Adicionar `workspaceId` nas queries de members

### **Fase 5: Atualizar Components**

- [ ] Verificar `AdminContainer` passa `workspaceId` para queries
- [ ] Verificar `HomeContainer` cria workspace corretamente
- [ ] Atualizar `useContent` hook para usar queries atualizadas
- [ ] Testar fluxo completo guest e member

### **Fase 6: Cache Invalidation**

- [ ] Criar `src/lib/cache/invalidation.ts`
- [ ] Adicionar invalidação após mutations
- [ ] Testar cache hit/miss rates

---

## 🎯 **BENEFÍCIOS DA ARQUITETURA**

### **Performance**

- ✅ **Redis Cache:** Reduz latência de queries MongoDB
- ✅ **CDN Edge:** Dados próximos aos usuários
- ✅ **localStorage:** Instantâneo para guests

### **Escalabilidade**

- ✅ **Guests:** Zero servidor, dados locais
- ✅ **Members:** MongoDB escalável horizontalmente
- ✅ **Cache:** Redis serverless no Vercel

### **Segurança**

- ✅ **Members:** Dados isolados por `userId`
- ✅ **Guests:** Dados efêmeros, sem conta
- ✅ **Cache:** Não armazena dados sensíveis

### **Custo**

- ✅ **Guests:** Gratuito (localStorage)
- ✅ **Members:** Pago por uso (MongoDB)
- ✅ **Cache:** Incluso no Vercel Pro+ ou Upstash Free tier

---

## 📚 **REFERÊNCIAS**

- [Upstash Redis Docs](https://docs.upstash.com/redis)
- [Vercel Storage Marketplace](https://vercel.com/docs/storage)
- [Next.js Caching Best Practices](https://nextjs.org/docs/app/building-your-application/caching)
- [Redis Caching Patterns](https://redis.io/docs/manual/patterns/)

---

## 🚀 **PRÓXIMOS PASSOS**

1. **Criar Upstash Redis** no Vercel Dashboard
2. **Instalar dependências** (`@upstash/redis`)
3. **Implementar modelos MongoDB** expandidos
4. **Refatorar APIs** com lógica condicional
5. **Atualizar queries** TanStack
6. **Testar fluxo completo** guest e member

**Esta arquitetura garante persistência correta para ambos os tipos de usuário!** 🎉
