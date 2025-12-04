import { NextRequest, NextResponse } from "next/server";
import { getAuth } from "@/lib/auth/get-auth";
import { db } from "@/lib/db/mongodb";
import { updateDashboard, loadWorkspacesWithDashboards } from "@/lib/storage/dashboards-store";
import { invalidateResourceCache } from "@/lib/cache/invalidation";
import type { Tile } from "@/lib/types";
import { tileDocumentToTile, type TileDocument } from "@/lib/db/models/Tile";

// Runtime: Node.js (required for MongoDB)
export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json().catch(() => null)) as {
      dashboardId?: unknown;
      order?: unknown;
      workspaceId?: unknown;
    } | null;
    const { userId } = await getAuth();

    const dashboardId =
      typeof body?.dashboardId === "string" ? body.dashboardId.trim() : "";
    const order: string[] = Array.isArray(body?.order)
      ? body.order
          .map((value) => (typeof value === "string" ? value.trim() : `${value}`))
          .filter(Boolean)
      : [];
    const workspaceId =
      typeof body?.workspaceId === "string" ? body.workspaceId.trim() : "";

    if (!dashboardId) {
      return NextResponse.json({ error: "dashboardId is required" }, { status: 400 });
    }

    if (!order || order.length === 0) {
      return NextResponse.json({ error: "order array is required" }, { status: 400 });
    }

    console.log("[API] /api/workspace/reorder - Reordering tiles", {
      dashboardId,
      workspaceId,
      orderLength: order.length,
      isMember: !!userId,
    });

    if (userId) {
      // 🟢 MEMBER: Atualizar no MongoDB
      if (!workspaceId) {
        return NextResponse.json(
          { error: "workspaceId is required for members" },
          { status: 400 }
        );
      }

      // Buscar tiles atuais do dashboard
      const tiles = (await db.find<TileDocument>("tiles", {
        userId,
        workspaceId,
        dashboardId,
      })).map(tileDocumentToTile);

      // Criar mapa de tiles por ID
      const tileMap = new Map<string, Tile>(tiles.map((t) => [t.id, t]));

      // Atualizar orderIndex de cada tile baseado na nova ordem
      const updates = order.map((tileId: string, index: number) => {
        const tile = tileMap.get(tileId);
        if (!tile) {
          console.warn(`[API] Tile ${tileId} not found in database`);
          return null;
        }

        return db.updateOne<TileDocument>(
          "tiles",
          { id: tileId, userId, workspaceId, dashboardId },
          { $set: { orderIndex: index, updatedAt: new Date() } }
        );
      });

      // Executar todas as atualizações
      await Promise.all(updates.filter(Boolean));

      // Invalidar cache
      await invalidateResourceCache("tiles", dashboardId, workspaceId);

      console.log("[API] /api/workspace/reorder - ✅ Tiles reordered in MongoDB");

      return NextResponse.json({
        success: true,
        order,
        updated: updates.filter(Boolean).length,
      });
    } else {
      // 🟡 GUEST: Atualizar no localStorage
      const workspaces = loadWorkspacesWithDashboards();
      const workspace = workspaces.find((w) => w.id === workspaceId || w.dashboards.some((d) => d.id === dashboardId));

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

      // Criar mapa de tiles por ID
      const tileMap = new Map(dashboard.tiles.map((t) => [t.id, t]));

      // Reordenar tiles baseado na nova ordem e atualizar orderIndex
      const reorderedTiles = order
        .map((tileId: string, index: number) => {
          const tile = tileMap.get(tileId);
          if (!tile) {
            console.warn(`[API] Tile ${tileId} not found in dashboard`);
            return null;
          }
          return {
            ...tile,
            orderIndex: index,
            updatedAt: new Date().toISOString(),
          };
        })
        .filter((t: Tile | null): t is Tile => t !== null);

      // Atualizar dashboard com tiles reordenados
      updateDashboard(workspace.id, dashboardId, {
        tiles: reorderedTiles,
      });

      console.log("[API] /api/workspace/reorder - ✅ Tiles reordered in localStorage");

      return NextResponse.json({
        success: true,
        order,
        updated: reorderedTiles.length,
      });
    }
  } catch (error) {
    console.error("[API] /api/workspace/reorder - Error:", error);
    return NextResponse.json(
      {
        error: "Failed to reorder tiles",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

