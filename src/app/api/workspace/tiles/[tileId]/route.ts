import { NextRequest, NextResponse } from "next/server";
import { getAuth } from "@/lib/auth/get-auth";
import { authorizeResourceAccess } from "@/lib/auth/authorize";
import { db } from "@/lib/db/mongodb";
import { updateDashboard, loadWorkspacesWithDashboards } from "@/lib/storage/dashboards-store";
import { invalidateResourceCache } from "@/lib/cache/invalidation";
import { audit } from "@/lib/audit/logger";

// Runtime: Node.js (required for MongoDB)
export const runtime = 'nodejs';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ tileId: string }> }
) {
  try {
    const { tileId } = await params;
    const { userId } = await getAuth();
    const body = await request.json().catch(() => ({}));
    const dashboardId = typeof body?.dashboardId === "string" ? body.dashboardId : "";
    const workspaceId = typeof body?.workspaceId === "string" ? body.workspaceId : "";

    if (!dashboardId) {
      return NextResponse.json(
        { error: "dashboardId is required" },
        { status: 400 }
      );
    }

    console.log("[API] /api/workspace/tiles/[tileId] DELETE - Deleting tile", {
      tileId,
      dashboardId,
      workspaceId,
      isMember: !!userId,
    });

    // Security: Authorize access to resource
    const auth = await authorizeResourceAccess(
      workspaceId,
      dashboardId,
      tileId,
      "tiles",
      userId
    );

    if (!auth.authorized) {
      return NextResponse.json(
        { error: auth.error || "Unauthorized" },
        { status: 403 }
      );
    }

    if (userId) {
      // 🟢 MEMBER: Deletar do MongoDB
      if (!workspaceId) {
        return NextResponse.json(
          { error: "workspaceId is required for members" },
          { status: 400 }
        );
      }

      // Deletar tile do MongoDB
      const deleted = await db.deleteOne("tiles", {
        id: tileId,
        userId,
        workspaceId,
        dashboardId,
      });

      if (!deleted) {
        return NextResponse.json(
          { error: "Tile not found" },
          { status: 404 }
        );
      }

      // Invalidar cache
      await invalidateResourceCache("tiles", dashboardId, workspaceId);

      // Audit log
      await audit.deleteTile(tileId, dashboardId, userId, request);

      console.log("[API] /api/workspace/tiles/[tileId] DELETE - ✅ Tile deleted from MongoDB");

      return NextResponse.json({
        success: true,
        message: `Tile ${tileId} deleted`,
      });
    } else {
      // 🟡 GUEST: Deletar do localStorage
      const workspaces = loadWorkspacesWithDashboards();
      const workspace = workspaces.find(
        (w) => w.id === workspaceId || w.dashboards.some((d) => d.id === dashboardId)
      );

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

      // Remover tile do dashboard
      const updatedTiles = dashboard.tiles.filter((t) => t.id !== tileId);

      // Atualizar dashboard
      updateDashboard(workspace.id, dashboardId, {
        tiles: updatedTiles,
      });

      // Audit log
      await audit.deleteTile(tileId, dashboardId, null, request);

      console.log("[API] /api/workspace/tiles/[tileId] DELETE - ✅ Tile deleted from localStorage");

      return NextResponse.json({
        success: true,
        message: `Tile ${tileId} deleted`,
      });
    }
  } catch (error) {
    console.error("[API] /api/workspace/tiles/[tileId] DELETE - Error:", error);
    return NextResponse.json(
      {
        error: "Failed to delete tile",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

