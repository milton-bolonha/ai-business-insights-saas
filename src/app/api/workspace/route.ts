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

    // Verify ownership before delete (implicit in deleteOne filter, but good for audit)
    const result = await db.deleteOne("workspaces", { _id: new ObjectId(workspaceId), userId });

    if (result.deletedCount === 1) {
      await auditLog("delete_workspace", "Workspace deleted via API", {
        userId,
        details: { workspaceId }
      });
      console.log("[api/workspace] ✅ Workspace deletado do MongoDB (member)");
      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json({ error: "Workspace not found or not authorized" }, { status: 404 });
    }

  } catch (error) {
    console.error("[api/workspace] ❌ Erro ao deletar do MongoDB:", error);
    return NextResponse.json({ error: "Failed to delete workspace" }, { status: 500 });
  }
}
