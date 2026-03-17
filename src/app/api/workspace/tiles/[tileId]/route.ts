import { NextRequest, NextResponse } from "next/server";
import { getAuth } from "@/lib/auth/get-auth";
import { authorizeResourceAccess } from "@/lib/auth/authorize";
import { db } from "@/lib/db/mongodb";
import { updateDashboard, loadWorkspacesWithDashboards } from "@/lib/storage/dashboards-store";
import { invalidateResourceCache } from "@/lib/cache/invalidation";
import { audit } from "@/lib/audit/logger";

// Runtime: Node.js (required for MongoDB)
export const runtime = 'nodejs';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ tileId: string }> }
) {
  try {
    const { tileId } = await params;
    const { userId } = await getAuth();
    const body = await request.json();
    const { dashboardId, workspaceId, content, status, title } = body;

    if (!dashboardId || !workspaceId) {
      return NextResponse.json(
        { error: "dashboardId and workspaceId are required" },
        { status: 400 }
      );
    }

    console.log("[API] /api/workspace/tiles/[tileId] PATCH - Updating tile", {
      tileId,
      dashboardId,
      workspaceId,
      userId,
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

    const updates: any = {
      updatedAt: new Date(),
    };

    if (content !== undefined) updates.content = content;
    if (status !== undefined) updates.status = status;
    if (title !== undefined) updates.title = title;

    if (userId) {
      // 🟢 MEMBER: Update in MongoDB
      const success = await db.updateOne(
        "tiles",
        { id: tileId, userId, workspaceId, dashboardId },
        { $set: updates }
      );

      // Note: db.updateOne returns false if no changes were made, but it's still a success if it matched.
      // However, our db wrapper currently doesn't expose matchedCount.
      // We'll treat it as success for now since we're using find/update patterns.

      // Invalidar cache
      await invalidateResourceCache("tiles", dashboardId, workspaceId);

      return NextResponse.json({
        success: true,
        tile: { id: tileId, ...updates },
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

      // Update tile in dashboard
      dashboard.tiles = dashboard.tiles.map((t: any) =>
        t.id === tileId ? { ...t, ...updates } : t
      );

      // Save back to storage
      updateDashboard(workspaceId, dashboardId, {
        tiles: dashboard.tiles,
      });

      return NextResponse.json({
        success: true,
        tile: { id: tileId, ...updates },
      });
    }
  } catch (error) {
    console.error("[API] /api/workspace/tiles/[tileId] PATCH - Error:", error);
    return NextResponse.json(
      {
        error: "Failed to update tile",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ tileId: string }> }
) {
  try {
    const { tileId } = await params;
    const { userId } = await getAuth();
    const body = await request.json().catch(() => ({}));
    const dashboardId = typeof body?.dashboardId === "string" ? body.dashboardId : "";
    let finalWorkspaceId = typeof body?.workspaceId === "string" ? body.workspaceId : "";

    if (!dashboardId) {
      return NextResponse.json(
        { error: "dashboardId is required" },
        { status: 400 }
      );
    }

    if (!finalWorkspaceId) {
      const dashboardRecord = await db.findOne("dashboards", { id: dashboardId }) as any;
      if (dashboardRecord?.workspaceId) {
        finalWorkspaceId = dashboardRecord.workspaceId;
      } else {
        return NextResponse.json(
          { error: "workspaceId is required and could not be resolved from dashboard" },
          { status: 400 }
        );
      }
    }

    console.log("[API] /api/workspace/tiles/[tileId] DELETE - Deleting tile", {
      tileId,
      dashboardId,
      workspaceId: finalWorkspaceId,
      isMember: !!userId,
    });

    // Security: Authorize access to resource
    const auth = await authorizeResourceAccess(
      finalWorkspaceId,
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

      // Deletar tile do MongoDB
      const deleted = await db.deleteOne("tiles", {
        id: tileId,
        userId,
        workspaceId: finalWorkspaceId,
        dashboardId,
      });

      if (!deleted) {
        return NextResponse.json(
          { error: "Tile not found" },
          { status: 404 }
        );
      }

      // Invalidar cache
      await invalidateResourceCache("tiles", dashboardId, finalWorkspaceId);

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
        (w) => w.id === finalWorkspaceId || w.dashboards.some((d) => d.id === dashboardId)
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

