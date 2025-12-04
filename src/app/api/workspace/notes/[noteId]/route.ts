import { NextRequest, NextResponse } from "next/server";

import type { Note } from "@/lib/types";
import { getAuth } from "@/lib/auth/get-auth";
import { authorizeResourceAccess } from "@/lib/auth/authorize";
import { db } from "@/lib/db/mongodb";
import { loadWorkspacesWithDashboards, updateDashboard } from "@/lib/storage/dashboards-store";
import { invalidateResourceCache } from "@/lib/cache/invalidation";
import { audit } from "@/lib/audit/logger";
import type { NoteDocument } from "@/lib/db/models/Note";

// Runtime: Node.js (required for MongoDB)
export const runtime = 'nodejs';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ noteId: string }> }
) {
  try {
    const { noteId } = await params;
    const { userId } = await getAuth();
    const body = await request.json().catch(() => null);
    
    const workspaceId = typeof body?.workspaceId === "string" ? body.workspaceId : "";
    const dashboardId = typeof body?.dashboardId === "string" ? body.dashboardId : "";

    if (!workspaceId || !dashboardId) {
      return NextResponse.json(
        { error: "workspaceId and dashboardId are required" },
        { status: 400 }
      );
    }

    // Security: Authorize access to resource
    const auth = await authorizeResourceAccess(
      workspaceId,
      dashboardId,
      noteId,
      "notes",
      userId
    );

    if (!auth.authorized) {
      return NextResponse.json(
        { error: auth.error || "Unauthorized" },
        { status: 403 }
      );
    }

    const title = typeof body?.title === "string" ? body.title.trim() : "";
    const content = typeof body?.content === "string" ? body.content.trim() : "";

    if (userId) {
      // 🟢 MEMBER: Update in MongoDB
      await db.updateOne<NoteDocument>(
        "notes",
        { id: noteId, userId, workspaceId, dashboardId },
        {
          $set: {
            title: title || undefined,
            content: content || undefined,
            updatedAt: new Date(),
          },
        }
      );

      // Invalidate cache
      await invalidateResourceCache("notes", dashboardId, workspaceId);

      // Audit log (update is logged as create for simplicity)
      await audit.createNote(noteId, dashboardId, userId, request);

      return NextResponse.json({
        success: true,
        note: {
          id: noteId,
          title,
          content,
        },
      });
    } else {
      // 🟡 GUEST: Update in localStorage
      const workspaces = loadWorkspacesWithDashboards();
      const workspace = workspaces.find((w) => w.id === workspaceId);
      
      if (!workspace) {
        return NextResponse.json(
          { error: "Workspace not found" },
          { status: 404 }
        );
      }

      const dashboard = workspace.dashboards.find((d) => d.id === dashboardId);
      
      if (!dashboard) {
        return NextResponse.json(
          { error: "Dashboard not found" },
          { status: 404 }
        );
      }

      const note = dashboard.notes?.find((n: Note) => n.id === noteId);

      if (!note) {
        return NextResponse.json(
          { error: "Note not found" },
          { status: 404 }
        );
      }

      const updatedNote = {
        ...note,
        title: title || note.title,
        content: content || note.content,
        updatedAt: new Date().toISOString(),
      };

      const updatedNotes = (dashboard.notes || []).map((n: Note) =>
        n.id === noteId ? updatedNote : n
      );

      updateDashboard(workspaceId, dashboardId, {
        notes: updatedNotes,
      });

      return NextResponse.json({
        success: true,
        note: updatedNote,
      });
    }
  } catch (error) {
    console.error("[API] /api/workspace/notes/[noteId] PATCH - Error:", error);
    return NextResponse.json(
      {
        error: "Failed to update note",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ noteId: string }> }
) {
  try {
    const { noteId } = await params;
    const { userId } = await getAuth();
    const body = await request.json().catch(() => ({}));
    
    const workspaceId = typeof body?.workspaceId === "string" ? body.workspaceId : "";
    const dashboardId = typeof body?.dashboardId === "string" ? body.dashboardId : "";

    if (!workspaceId || !dashboardId) {
      return NextResponse.json(
        { error: "workspaceId and dashboardId are required" },
        { status: 400 }
      );
    }

    // Security: Authorize access to resource
    const auth = await authorizeResourceAccess(
      workspaceId,
      dashboardId,
      noteId,
      "notes",
      userId
    );

    if (!auth.authorized) {
      return NextResponse.json(
        { error: auth.error || "Unauthorized" },
        { status: 403 }
      );
    }

    if (userId) {
      // 🟢 MEMBER: Delete from MongoDB
      const deleted = await db.deleteOne<NoteDocument>("notes", {
        id: noteId,
        userId,
        workspaceId,
        dashboardId,
      });

      if (!deleted) {
        return NextResponse.json(
          { error: "Note not found" },
          { status: 404 }
        );
      }

      // Invalidate cache
      await invalidateResourceCache("notes", dashboardId, workspaceId);

      // Audit log
      await audit.deleteNote(noteId, dashboardId, userId, request);

      return NextResponse.json({
        success: true,
        message: `Note ${noteId} deleted`,
      });
    } else {
      // 🟡 GUEST: Delete from localStorage
      const workspaces = loadWorkspacesWithDashboards();
      const workspace = workspaces.find((w) => w.id === workspaceId);
      const dashboard = workspace?.dashboards.find((d) => d.id === dashboardId);

      if (!dashboard) {
        return NextResponse.json(
          { error: "Dashboard not found" },
          { status: 404 }
        );
      }

      const updatedNotes = dashboard.notes?.filter((n: Note) => n.id !== noteId) || [];

      updateDashboard(workspaceId, dashboardId, {
        notes: updatedNotes,
      });

      // Audit log
      await audit.deleteNote(noteId, dashboardId, null, request);

      return NextResponse.json({
        success: true,
        message: `Note ${noteId} deleted`,
      });
    }
  } catch (error) {
    console.error("[API] /api/workspace/notes/[noteId] DELETE - Error:", error);
    return NextResponse.json(
      {
        error: "Failed to delete note",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

