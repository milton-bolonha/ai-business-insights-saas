import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";

import type { Note } from "@/lib/types";
import { getAuth } from "@/lib/auth/get-auth";
import { addNoteToDashboard, loadWorkspacesWithDashboards } from "@/lib/storage/dashboards-store";
import { audit } from "@/lib/audit/logger";
import { checkRateLimitMiddleware } from "@/lib/middleware/rate-limit";

// Runtime: Node.js (required for MongoDB)
// export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  console.log("[API] HIT: /api/workspace/notes POST");

  const rate = await checkRateLimitMiddleware(request, "/api/workspace/notes");
  if (!rate.allowed && rate.response) return rate.response;

  const body = await request.json().catch(() => null);
  const { userId } = await getAuth();
  let usageService: typeof import("@/lib/saas/usage-service") | null = null;

  const title = typeof body?.title === "string" ? body.title.trim() : "";
  const content = typeof body?.content === "string" ? body.content.trim() : "";
  const dashboardId = typeof body?.dashboardId === "string" ? body.dashboardId.trim() : "";
  const workspaceId = typeof body?.workspaceId === "string" ? body.workspaceId.trim() : "";

  if (!title) {
    return NextResponse.json({ error: "Title is required" }, { status: 400 });
  }

  if (!content) {
    return NextResponse.json({ error: "Content is required" }, { status: 400 });
  }

  if (!dashboardId) {
    return NextResponse.json({ error: "dashboardId is required" }, { status: 400 });
  }

  try {
    if (userId) {
      usageService = await import("@/lib/saas/usage-service");
      const limit = await usageService.checkLimit(userId, "notesCount");
      if (!limit.allowed) {
        return NextResponse.json(
          {
            error:
              limit.reason ??
              "Note limit reached. Upgrade your plan to create more notes.",
          },
          { status: 429 }
        );
      }
    }

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

      const { db } = await import("@/lib/db/mongodb");
      const { noteToDocument } = await import("@/lib/db/models/Note");
      const { invalidateResourceCache } = await import("@/lib/cache/invalidation");

      const noteDoc = noteToDocument(noteData, userId, workspaceId, dashboardId);
      const insertedId = await db.insertOne("notes", {
        ...noteDoc,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      // Invalidate cache
      await invalidateResourceCache("notes", dashboardId, workspaceId);

      // Audit log
      await audit.createNote(insertedId, dashboardId, userId, request);

      if (usageService) {
        await usageService.incrementUsage(userId, "notesCount", 1);
      }

      console.log("[API] /api/workspace/notes - Note saved to MongoDB", {
        noteId: insertedId,
        userId,
        workspaceId,
        dashboardId,
      });

      return NextResponse.json({
        success: true,
        note: { ...noteData, id: insertedId },
      });
    } else {
      // 🟡 GUEST: Salvar no localStorage
      const workspaces = loadWorkspacesWithDashboards();
      const workspace = workspaces.find((w) => w.id === workspaceId);

      if (workspace) {
        addNoteToDashboard(workspace.id, dashboardId, noteData);

        // Audit log
        await audit.createNote(noteId, dashboardId, null, request);

        console.log("[API] /api/workspace/notes - Note saved to localStorage", {
          noteId,
          workspaceId: workspace.id,
          dashboardId,
        });
      } else {
        return NextResponse.json({ error: "Workspace not found" }, { status: 404 });
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

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const dashboardId = searchParams.get("dashboardId");
  const workspaceId = searchParams.get("workspaceId");
  const { userId } = await getAuth();

  if (!dashboardId) {
    return NextResponse.json({ error: "dashboardId is required" }, { status: 400 });
  }

  try {
    if (userId) {
      // 🟢 MEMBER: Buscar do MongoDB
      if (!workspaceId) {
        return NextResponse.json(
          { error: "workspaceId is required for members" },
          { status: 400 }
        );
      }

      // Try cache first
      const { cache, cacheKeys, CACHE_TTL } = await import("@/lib/cache/redis");
      const cacheKey = cacheKeys.notes.dashboard(dashboardId);
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
      const { db } = await import("@/lib/db/mongodb");
      const { noteDocumentToNote } = await import("@/lib/db/models/Note");
      // eslint-disable-next-line @typescript-eslint/consistent-type-imports
      type NoteDocument = import("@/lib/db/models/Note").NoteDocument;

      const notes = await db.find<NoteDocument>("notes", {
        userId,
        workspaceId,
        dashboardId,
      });

      const mappedNotes = notes.map(noteDocumentToNote);

      // Cache for configured TTL
      await cache.set(cacheKey, mappedNotes, CACHE_TTL.notes);

      return NextResponse.json(mappedNotes, {
        headers: {
          "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120",
        },
      });
    } else {
      // 🟡 GUEST: Buscar do localStorage
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

