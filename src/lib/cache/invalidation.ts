/**
 * Cache invalidation utilities
 */
import { cache, cacheKeys } from "./redis";

/**
 * Invalidate all cache entries for a dashboard
 */
export async function invalidateDashboardCache(
  dashboardId: string,
  workspaceId: string
): Promise<void> {
  if (!cache.isAvailable()) {
    return;
  }

  const keysToDelete = [
    cacheKeys.contacts.dashboard(dashboardId),
    cacheKeys.notes.dashboard(dashboardId),
    cacheKeys.tiles.dashboard(dashboardId),
    cacheKeys.contacts.workspace(workspaceId),
    cacheKeys.notes.workspace(workspaceId),
    cacheKeys.tiles.workspace(workspaceId),
  ];

  await cache.delMultiple(keysToDelete);
  console.log(`[Cache] Invalidated cache for dashboard ${dashboardId}`);
}

/**
 * Invalidate cache for a specific resource type
 */
export async function invalidateResourceCache(
  resourceType: "contacts" | "notes" | "tiles",
  dashboardId?: string,
  workspaceId?: string
): Promise<void> {
  if (!cache.isAvailable()) {
    return;
  }

  const keysToDelete: string[] = [];

  if (dashboardId) {
    keysToDelete.push(cacheKeys[resourceType].dashboard(dashboardId));
  }

  if (workspaceId) {
    keysToDelete.push(cacheKeys[resourceType].workspace(workspaceId));
  }

  if (keysToDelete.length > 0) {
    await cache.delMultiple(keysToDelete);
    console.log(
      `[Cache] Invalidated ${resourceType} cache for dashboard ${dashboardId || "N/A"}`
    );
  }
}

