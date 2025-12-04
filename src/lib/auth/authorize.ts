import { getAuth } from "./get-auth";
import { db } from "@/lib/db/mongodb";
import { loadWorkspacesWithDashboards } from "@/lib/storage/dashboards-store";
import { monitorUnauthorizedAccess } from "@/lib/monitoring/security";

/**
 * Security: Authorize user access to a workspace
 * Validates that the user has access to the workspace before allowing operations
 */
export async function authorizeWorkspaceAccess(
  workspaceId: string,
  userId: string | null
): Promise<{ authorized: boolean; error?: string }> {
  if (!workspaceId) {
    return { authorized: false, error: "Workspace ID is required" };
  }

  if (userId) {
    // 🟢 MEMBER: Verify workspace belongs to user in MongoDB
    const workspace = await db.findOne("workspaces", {
      id: workspaceId,
      userId,
    });

    if (!workspace) {
      // Security monitoring
      await monitorUnauthorizedAccess(
        `workspace:${workspaceId}`,
        userId,
        undefined,
        "Workspace not found or access denied"
      );

      return {
        authorized: false,
        error: "Workspace not found or access denied",
      };
    }

    return { authorized: true };
  } else {
    // 🟡 GUEST: Verify workspace exists in localStorage
    const workspaces = loadWorkspacesWithDashboards();
    const workspace = workspaces.find((w) => w.id === workspaceId);

    if (!workspace) {
      return {
        authorized: false,
        error: "Workspace not found",
      };
    }

    return { authorized: true };
  }
}

/**
 * Security: Authorize user access to a dashboard
 * Validates that the dashboard belongs to the workspace and user has access
 */
export async function authorizeDashboardAccess(
  workspaceId: string,
  dashboardId: string,
  userId: string | null
): Promise<{ authorized: boolean; error?: string }> {
  if (!workspaceId || !dashboardId) {
    return {
      authorized: false,
      error: "Workspace ID and Dashboard ID are required",
    };
  }

  // First verify workspace access
  const workspaceAuth = await authorizeWorkspaceAccess(workspaceId, userId);
  if (!workspaceAuth.authorized) {
    return workspaceAuth;
  }

  if (userId) {
    // 🟢 MEMBER: Verify dashboard belongs to workspace in MongoDB
    const dashboard = await db.findOne("dashboards", {
      id: dashboardId,
      workspaceId,
      userId,
    });

    if (!dashboard) {
      // Security monitoring
      await monitorUnauthorizedAccess(
        `dashboard:${dashboardId}`,
        userId,
        undefined,
        "Dashboard not found or access denied"
      );

      return {
        authorized: false,
        error: "Dashboard not found or access denied",
      };
    }

    return { authorized: true };
  } else {
    // 🟡 GUEST: Verify dashboard exists in workspace (localStorage)
    const workspaces = loadWorkspacesWithDashboards();
    const workspace = workspaces.find((w) => w.id === workspaceId);

    if (!workspace) {
      return {
        authorized: false,
        error: "Workspace not found",
      };
    }

    const dashboard = workspace.dashboards.find((d) => d.id === dashboardId);
    if (!dashboard) {
      return {
        authorized: false,
        error: "Dashboard not found",
      };
    }

    return { authorized: true };
  }
}

/**
 * Security: Authorize user access to a resource (tile, contact, note)
 * Validates that the resource belongs to the dashboard and user has access
 */
export async function authorizeResourceAccess(
  workspaceId: string,
  dashboardId: string,
  resourceId: string,
  resourceType: "tiles" | "contacts" | "notes",
  userId: string | null
): Promise<{ authorized: boolean; error?: string }> {
  if (!workspaceId || !dashboardId || !resourceId) {
    return {
      authorized: false,
      error: "Workspace ID, Dashboard ID, and Resource ID are required",
    };
  }

  // First verify dashboard access
  const dashboardAuth = await authorizeDashboardAccess(
    workspaceId,
    dashboardId,
    userId
  );
  if (!dashboardAuth.authorized) {
    return dashboardAuth;
  }

  if (userId) {
    // 🟢 MEMBER: Verify resource belongs to dashboard in MongoDB
    const resource = await db.findOne(resourceType, {
      id: resourceId,
      workspaceId,
      dashboardId,
      userId,
    });

    if (!resource) {
      // Security monitoring
      await monitorUnauthorizedAccess(
        `${resourceType}:${resourceId}`,
        userId,
        undefined,
        `${resourceType} not found or access denied`
      );

      return {
        authorized: false,
        error: `${resourceType} not found or access denied`,
      };
    }

    return { authorized: true };
  } else {
    // 🟡 GUEST: Verify resource exists in dashboard (localStorage)
    const workspaces = loadWorkspacesWithDashboards();
    const workspace = workspaces.find((w) => w.id === workspaceId);

    if (!workspace) {
      return {
        authorized: false,
        error: "Workspace not found",
      };
    }

    const dashboard = workspace.dashboards.find((d) => d.id === dashboardId);
    if (!dashboard) {
      return {
        authorized: false,
        error: "Dashboard not found",
      };
    }

    const resource = dashboard[resourceType]?.find(
      (r: { id: string }) => r.id === resourceId
    );

    if (!resource) {
      return {
        authorized: false,
        error: `${resourceType} not found`,
      };
    }

    return { authorized: true };
  }
}

/**
 * Security: Get auth and validate access in one call
 * Convenience function for API routes
 */
export async function getAuthAndAuthorize(
  workspaceId?: string,
  dashboardId?: string
): Promise<{
  userId: string | null;
  authorized: boolean;
  error?: string;
}> {
  const { userId } = await getAuth();

  if (workspaceId && dashboardId) {
    const auth = await authorizeDashboardAccess(workspaceId, dashboardId, userId);
    return { userId, ...auth };
  }

  if (workspaceId) {
    const auth = await authorizeWorkspaceAccess(workspaceId, userId);
    return { userId, ...auth };
  }

  return { userId, authorized: true };
}

