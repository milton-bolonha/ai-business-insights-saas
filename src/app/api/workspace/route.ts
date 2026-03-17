import { NextRequest, NextResponse } from "next/server";
import { getAuth } from "@/lib/auth/get-auth";
import { getWorkspaceById } from "@/lib/storage/dashboards-store";

// Runtime: Node.js (required for MongoDB)
export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const workspaceId = searchParams.get("workspaceId");
  const { userId } = await getAuth();

  if (!workspaceId) {
    return NextResponse.json({ error: "workspaceId is required" }, { status: 400 });
  }

  // Member-only route - Middleware guarantees auth
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { db } = await import("@/lib/db/mongodb");
    const { workspaceDocumentToSnapshot } = await import("@/lib/db/models/Workspace");
    // eslint-disable-next-line @typescript-eslint/consistent-type-imports
    type WorkspaceDocument = import("@/lib/db/models/Workspace").WorkspaceDocument;

    const workspaceDoc = await db.findOne<WorkspaceDocument>("workspaces", {
      _id: workspaceId,
      userId, // Security: Filter by userId
    });

    if (workspaceDoc) {
      const workspace = workspaceDocumentToSnapshot(workspaceDoc);
      return NextResponse.json(workspace, {
        headers: {
          "Cache-Control": "no-store",
        },
      });
    }

    return NextResponse.json({ error: "Workspace not found" }, { status: 404 });

  } catch (error) {
    console.error("[api/workspace] Error loading workspace:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const workspaceId = searchParams.get("workspaceId");

  if (!workspaceId) {
    return NextResponse.json({ error: "workspaceId is required" }, { status: 400 });
  }

  const { userId } = await getAuth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { db } = await import("@/lib/db/mongodb");
    const { ObjectId } = await import("mongodb");
    const { auditLog } = await import("@/lib/audit/logger");

    // Workspace id from client is typically sessionId (e.g. session_xxx)
    const workspaceFilter = workspaceId.startsWith("session_")
      ? { sessionId: workspaceId, userId }
      : { _id: new ObjectId(workspaceId), userId };

    const workspaceDoc = await db.findOne("workspaces", workspaceFilter);
    if (!workspaceDoc) {
      return NextResponse.json({ error: "Workspace not found or not authorized" }, { status: 404 });
    }

    const effectiveWorkspaceId = (workspaceDoc as { sessionId?: string }).sessionId ?? workspaceId;

    // Cascade delete: books, tiles, contacts, notes, dashboards, workspace
    const delFilter = { workspaceId: effectiveWorkspaceId, userId };
    await db.deleteMany("books", delFilter);
    await db.deleteMany("tiles", delFilter);
    await db.deleteMany("contacts", delFilter);
    await db.deleteMany("notes", delFilter);
    await db.deleteMany("dashboards", delFilter);
    await db.deleteOne("workspaces", workspaceFilter);

    await auditLog("delete_workspace", "Workspace and related data deleted via API", {
      userId,
      details: { workspaceId: effectiveWorkspaceId }
    });
    console.log("[api/workspace] ✅ Workspace e dados relacionados deletados do MongoDB");
    return NextResponse.json({ success: true });

  } catch (error) {
    console.error("[api/workspace] ❌ Erro ao deletar do MongoDB:", error);
    return NextResponse.json({ error: "Failed to delete workspace" }, { status: 500 });
  }
}
