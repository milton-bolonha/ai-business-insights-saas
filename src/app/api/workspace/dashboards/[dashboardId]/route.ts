import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { getAuth } from "@/lib/auth/get-auth";
import { db } from "@/lib/db/mongodb";
import { updateDashboard as updateDashboardInStore } from "@/lib/storage/dashboards-store";
import { loadWorkspacesWithDashboards } from "@/lib/storage/dashboards-store";

// Runtime: Node.js (required for MongoDB)
export const runtime = "nodejs";

interface RouteContext {
  params: Promise<{
    dashboardId: string;
  }>;
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const { userId } = await getAuth();
    const { dashboardId } = await context.params;
    const body = await request.json();
    
    const { name, bgColor } = body;

    if (userId) {
      // 🟢 MEMBER: Update in MongoDB
      const updates: Record<string, unknown> = {
        updatedAt: new Date(),
      };

      if (name !== undefined) updates.name = name;
      if (bgColor !== undefined) updates.bgColor = bgColor;

      // Update dashboard in MongoDB
      const updated = await db.updateOne(
        "dashboards",
        { id: dashboardId, userId },
        { $set: updates }
      );

      // Fetch updated dashboard
      const updatedDashboard = await db.findOne("dashboards", { id: dashboardId, userId });

      if (!updatedDashboard) {
        return NextResponse.json(
          { error: "Dashboard not found" },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        dashboard: updatedDashboard,
      });
    } else {
      // 🟡 GUEST: Update in localStorage
      const workspaces = loadWorkspacesWithDashboards();
      
      // Find the workspace that contains this dashboard
      let workspaceId: string | null = null;
      for (const workspace of workspaces) {
        if (workspace.dashboards.some(d => d.id === dashboardId)) {
          workspaceId = workspace.id;
          break;
        }
      }

      if (!workspaceId) {
        return NextResponse.json(
          { error: "Dashboard not found" },
          { status: 404 }
        );
      }

      const updates: Record<string, unknown> = {};
      if (name !== undefined) updates.name = name;
      if (bgColor !== undefined) updates.bgColor = bgColor;

      updateDashboardInStore(workspaceId, dashboardId, updates);

      // Return updated dashboard
      const updatedWorkspaces = loadWorkspacesWithDashboards();
      const workspace = updatedWorkspaces.find(w => w.id === workspaceId);
      const dashboard = workspace?.dashboards.find(d => d.id === dashboardId);

      return NextResponse.json({
        success: true,
        dashboard,
      });
    }
  } catch (error) {
    console.error("[API] /api/workspace/dashboards/[dashboardId] PATCH - Error:", error);
    return NextResponse.json(
      { error: "Failed to update dashboard" },
      { status: 500 }
    );
  }
}
