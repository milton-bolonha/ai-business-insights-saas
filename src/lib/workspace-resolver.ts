import { getWorkspaceById } from "@/lib/storage/dashboards-store";
import type { WorkspaceWithDashboards } from "@/lib/types/dashboard";
import { db } from "@/lib/db/mongodb";
import {
  workspaceDocumentToSnapshot,
  type WorkspaceDocument,
} from "@/lib/db/models/Workspace";

/**
 * Resolve workspace data for both guests and members
 * - Guests: Read from localStorage via dashboards-store
 * - Members: Read from MongoDB
 */
export async function resolveWorkspace(
  workspaceId: string,
  userId: string | null
): Promise<WorkspaceWithDashboards | null> {
  if (userId) {
    // Member: Load from MongoDB
    try {
      const workspaceDoc = await db.findOne<WorkspaceDocument>("workspaces", {
        sessionId: workspaceId,
        userId,
      });

      if (!workspaceDoc) return null;

      const snapshot = workspaceDocumentToSnapshot(workspaceDoc);

      return {
        id: snapshot.sessionId,
        name: snapshot.name,
        website: snapshot.website,
        dashboards: [], // TODO: Load dashboards from collections
        createdAt:
          workspaceDoc.createdAt?.toISOString() || new Date().toISOString(),
        updatedAt:
          workspaceDoc.updatedAt?.toISOString() || new Date().toISOString(),
      };
    } catch (error) {
      console.error("[resolveWorkspace] Error loading from MongoDB:", error);
      return null;
    }
  } else {
    // Guest: Load from localStorage
    return getWorkspaceById(workspaceId);
  }
}

/**
 * Get workspace name and website for context injection
 * Lightweight version that doesn't load full workspace data
 */
export async function resolveWorkspaceName(
  workspaceId: string,
  userId: string | null
): Promise<{ name: string; website?: string } | null> {
  if (userId) {
    // Member: Load from MongoDB
    try {
      const workspaceDoc = await db.findOne<WorkspaceDocument>("workspaces", {
        sessionId: workspaceId,
        userId,
      });

      if (!workspaceDoc) return null;

      return {
        name: workspaceDoc.name,
        website: workspaceDoc.website,
      };
    } catch (error) {
      console.error("[resolveWorkspaceName] Error loading from MongoDB:", error);
      return null;
    }
  } else {
    // Guest: Load from localStorage
    const workspace = getWorkspaceById(workspaceId);
    if (!workspace) return null;

    return {
      name: workspace.name,
      website: workspace.website,
    };
  }
}
