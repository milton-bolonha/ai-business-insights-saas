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

  // Members: Try MongoDB first (scoped by userId for security)
  if (userId) {
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
        console.log("[api/workspace] ✅ Workspace carregado do MongoDB (member)");
        return NextResponse.json(workspace, {
          headers: {
            "Cache-Control": "no-store",
          },
        });
      }
    } catch (error) {
      // MongoDB unavailable or error - fallback to localStorage
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.warn("[api/workspace] ⚠️ Erro ao ler do MongoDB, usando fallback localStorage:", errorMessage);
    }
  }

  // Guests: Load from localStorage only
  const workspace = getWorkspaceById(workspaceId);

  if (!workspace) {
    return NextResponse.json({ error: "Workspace not found" }, { status: 404 });
  }

  console.log("[api/workspace] ✅ Workspace carregado do localStorage", userId ? "(fallback member)" : "(guest)");
  return NextResponse.json(workspace, {
    headers: {
      "Cache-Control": "no-store",
    },
  });
}

export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const workspaceId = searchParams.get("workspaceId");
  
  if (!workspaceId) {
    return NextResponse.json({ error: "workspaceId is required" }, { status: 400 });
  }

  // Note: Actual deletion happens on client side for guests (localStorage)
  // For members, we would delete from MongoDB here
  
  const { userId } = await getAuth();
  if (userId) {
    try {
      const { db } = await import("@/lib/db/mongodb");
      const { ObjectId } = await import("mongodb");
      await db.deleteOne("workspaces", { _id: new ObjectId(workspaceId), userId });
      console.log("[api/workspace] ✅ Workspace deletado do MongoDB (member)");
    } catch (error) {
      console.error("[api/workspace] ❌ Erro ao deletar do MongoDB:", error);
      return NextResponse.json({ error: "Failed to delete workspace" }, { status: 500 });
    }
  }

  return NextResponse.json({ success: true });
}
