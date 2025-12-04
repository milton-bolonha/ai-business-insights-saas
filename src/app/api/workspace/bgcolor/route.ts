import { NextRequest, NextResponse } from "next/server";

import { getAuth } from "@/lib/auth/get-auth";
import { updateDashboard as updateDashboardInStore } from "@/lib/storage/dashboards-store";
import { loadWorkspacesWithDashboards } from "@/lib/storage/dashboards-store";

// Runtime: Node.js (required for MongoDB)
export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const { userId } = await getAuth();

  const dashboardId = typeof body?.dashboardId === "string" ? body.dashboardId.trim() : "";
  const workspaceId = typeof body?.workspaceId === "string" ? body.workspaceId.trim() : "";
  const bgColor = typeof body?.bgColor === "string" ? body.bgColor.trim() : "";

  if (!dashboardId) {
    return NextResponse.json({ error: "dashboardId is required" }, { status: 400 });
  }

  if (!bgColor) {
    return NextResponse.json({ error: "bgColor is required" }, { status: 400 });
  }

  try {
    if (userId) {
      // 🟢 MEMBER: Update in MongoDB
      const { getCollection } = await import("@/lib/db/mongodb");

      // Update dashboard in MongoDB
      const dashboards = await getCollection("dashboards");
      const result = await dashboards.updateOne(
        { id: dashboardId, userId },
        { 
          $set: { 
            bgColor,
            updatedAt: new Date() 
          } 
        }
      );

      if (result.matchedCount === 0) {
        return NextResponse.json(
          { error: "Dashboard not found" },
          { status: 404 }
        );
      }

      console.log("[API] /api/workspace/bgcolor - Updated MongoDB", {
        dashboardId,
        bgColor,
        userId
      });

      return NextResponse.json({
        success: true,
        bgColor,
      });
    } else {
      // 🟡 GUEST: Update in localStorage (server-side memory)
      if (!workspaceId) {
         // Try to find workspace if not provided
         const workspaces = loadWorkspacesWithDashboards();
         const workspace = workspaces.find(w => w.dashboards.some(d => d.id === dashboardId));
         if (!workspace) {
            return NextResponse.json({ error: "Workspace not found" }, { status: 404 });
         }
         updateDashboardInStore(workspace.id, dashboardId, { bgColor });
      } else {
         updateDashboardInStore(workspaceId, dashboardId, { bgColor });
      }

      console.log("[API] /api/workspace/bgcolor - Updated server store", {
        dashboardId,
        bgColor
      });

      return NextResponse.json({
        success: true,
        bgColor,
      });
    }
  } catch (error) {
    console.error("[API] /api/workspace/bgcolor - Error:", error);
    return NextResponse.json(
      {
        error: "Failed to update background color",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
