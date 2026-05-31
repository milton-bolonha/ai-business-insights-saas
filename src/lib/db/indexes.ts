/**
 * MongoDB Index Management
 * 
 * Creates indexes for optimal query performance.
 * This module is idempotent - safe to call multiple times.
 * 
 * Best Practices:
 * - Indexes are created with explicit names for easier management
 * - Compound indexes follow query patterns (userId + dashboardId)
 * - Sparse indexes for optional fields (sessionId)
 * - Error handling for existing indexes (idempotent)
 */

import { getCollection } from "./mongodb";
import type { Collection, IndexSpecification, Document } from "mongodb";

/**
 * Index definitions for each collection
 * Following MongoDB best practices for compound indexes
 */
const INDEX_DEFINITIONS = {
  contacts: [
    {
      keys: { userId: 1, dashboardId: 1 },
      options: { name: "idx_contacts_user_dashboard" },
    },
    {
      keys: { userId: 1, workspaceId: 1 },
      options: { name: "idx_contacts_user_workspace" },
    },
    {
      keys: { createdAt: -1 },
      options: { name: "idx_contacts_created" },
    },
  ] as Array<{ keys: Record<string, 1 | -1>; options: { name: string } }>,

  notes: [
    {
      keys: { userId: 1, dashboardId: 1 },
      options: { name: "idx_notes_user_dashboard" },
    },
    {
      keys: { userId: 1, workspaceId: 1 },
      options: { name: "idx_notes_user_workspace" },
    },
    {
      keys: { createdAt: -1 },
      options: { name: "idx_notes_created" },
    },
  ] as Array<{ keys: Record<string, 1 | -1>; options: { name: string } }>,

  tiles: [
    {
      keys: { userId: 1, dashboardId: 1 },
      options: { name: "idx_tiles_user_dashboard" },
    },
    {
      keys: { userId: 1, workspaceId: 1 },
      options: { name: "idx_tiles_user_workspace" },
    },
    {
      keys: { createdAt: -1 },
      options: { name: "idx_tiles_created" },
    },
    {
      keys: { orderIndex: 1 },
      options: { name: "idx_tiles_order" },
    },
  ] as Array<{ keys: Record<string, 1 | -1>; options: { name: string } }>,

  workspaces: [
    {
      keys: { userId: 1 },
      options: { name: "idx_workspaces_user" },
    },
    {
      keys: { sessionId: 1 },
      options: { name: "idx_workspaces_session", unique: true, sparse: true },
    },
  ] as Array<{
    keys: Record<string, 1 | -1>;
    options: { name: string; unique?: boolean; sparse?: boolean };
  }>,

  dashboards: [
    {
      keys: { userId: 1, workspaceId: 1 },
      options: { name: "idx_dashboards_user_workspace" },
    },
    {
      keys: { userId: 1 },
      options: { name: "idx_dashboards_user" },
    },
    {
      keys: { workspaceId: 1 },
      options: { name: "idx_dashboards_workspace" },
    },
    {
      keys: { createdAt: -1 },
      options: { name: "idx_dashboards_created" },
    },
  ] as Array<{ keys: Record<string, 1 | -1>; options: { name: string } }>,

  audit_logs: [
    {
      keys: { _userId: 1, _timestamp: -1 },
      options: { name: "idx_audit_user_timestamp" },
    },
    {
      keys: { _eventType: 1, _timestamp: -1 },
      options: { name: "idx_audit_event_timestamp" },
    },
    {
      keys: { resourceType: 1, resourceId: 1, _timestamp: -1 },
      options: { name: "idx_audit_resource_timestamp" },
    },
    {
      keys: { _timestamp: -1 },
      options: { name: "idx_audit_timestamp" },
    },
  ] as Array<{ keys: Record<string, 1 | -1>; options: { name: string } }>,

  mentoring_tracks: [
    {
      keys: { workspaceId: 1 },
      options: { name: "idx_mentoring_tracks_workspace" },
    },
    {
      keys: { isGlobalTemplate: 1 },
      options: { name: "idx_mentoring_tracks_global" },
    },
    {
      keys: { workspaceId: 1, isGlobalTemplate: 1 },
      options: { name: "idx_mentoring_tracks_workspace_global" },
    },
  ] as Array<{ keys: Record<string, 1 | -1>; options: { name: string } }>,

  mentoring_track_enrollments: [
    {
      keys: { workspaceId: 1, menteeUserId: 1 },
      options: { name: "idx_enrollments_workspace_mentee" },
    },
    {
      keys: { trackId: 1, menteeUserId: 1 },
      options: { name: "idx_enrollments_track_mentee" },
    },
    {
      keys: { menteeUserId: 1, status: 1 },
      options: { name: "idx_enrollments_mentee_status" },
    },
  ] as Array<{ keys: Record<string, 1 | -1>; options: { name: string } }>,

  mentoring_tasks: [
    {
      keys: { workspaceId: 1, trackId: 1 },
      options: { name: "idx_mentoring_tasks_workspace_track" },
    },
    {
      keys: { workspaceId: 1, assigneeId: 1 },
      options: { name: "idx_mentoring_tasks_workspace_assignee" },
    },
  ] as Array<{ keys: Record<string, 1 | -1>; options: { name: string } }>,
} as const;

/**
 * Create indexes for a specific collection
 * Handles errors gracefully (idempotent)
 */
async function createCollectionIndexes<T extends Document>(
  collectionName: keyof typeof INDEX_DEFINITIONS,
  collection: Collection<T>
): Promise<number> {
  const definitions = INDEX_DEFINITIONS[collectionName];
  let createdCount = 0;

  for (const definition of definitions) {
    try {
      await collection.createIndex(definition.keys, definition.options);
      createdCount++;
      console.log(
        `[MongoDB] ✅ Index created: ${collectionName}.${definition.options.name}`
      );
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      const errorCode = (error as Error & { code?: number | string }).code;

      // MongoDB error codes for existing indexes
      const isIndexExistsError =
        errorMessage.includes("already exists") ||
        errorMessage.includes("IndexOptionsConflict") ||
        errorCode === 85 ||
        String(errorCode).includes("E11000") ||
        errorMessage.includes("IndexKeySpecsConflict");

      if (isIndexExistsError) {
        console.log(
          `[MongoDB] ℹ️  Index already exists: ${collectionName}.${definition.options.name}`
        );
        // Continue - index already exists is not an error
      } else {
        // Re-throw unexpected errors
        console.error(
          `[MongoDB] ❌ Failed to create index ${collectionName}.${definition.options.name}:`,
          errorMessage
        );
        throw error;
      }
    }
  }

  return createdCount;
}

/**
 * Create all MongoDB indexes for optimal performance
 * 
 * This function is idempotent - safe to call multiple times.
 * It will skip indexes that already exist.
 * 
 * @throws {Error} If there's a connection error or unexpected MongoDB error
 */
export async function createIndexes(): Promise<void> {
  console.log("[MongoDB] 🔧 Starting index creation...");

  try {
    // Create indexes for each collection
    const contactsCollection = await getCollection("contacts");
    const contactsCreated = await createCollectionIndexes(
      "contacts",
      contactsCollection
    );

    const notesCollection = await getCollection("notes");
    const notesCreated = await createCollectionIndexes(
      "notes",
      notesCollection
    );

    const tilesCollection = await getCollection("tiles");
    const tilesCreated = await createCollectionIndexes(
      "tiles",
      tilesCollection
    );

    const workspacesCollection = await getCollection("workspaces");
    const workspacesCreated = await createCollectionIndexes(
      "workspaces",
      workspacesCollection
    );

    const dashboardsCollection = await getCollection("dashboards");
    const dashboardsCreated = await createCollectionIndexes(
      "dashboards",
      dashboardsCollection
    );

    const auditLogsCollection = await getCollection("audit_logs");
    const auditLogsCreated = await createCollectionIndexes(
      "audit_logs",
      auditLogsCollection
    );

    const mentoringTracksCollection = await getCollection("mentoring_tracks");
    const mentoringTracksCreated = await createCollectionIndexes(
      "mentoring_tracks" as any,
      mentoringTracksCollection
    );

    const mentoringEnrollmentsCollection = await getCollection("mentoring_track_enrollments");
    const mentoringEnrollmentsCreated = await createCollectionIndexes(
      "mentoring_track_enrollments" as any,
      mentoringEnrollmentsCollection
    );

    const mentoringTasksCollection = await getCollection("mentoring_tasks");
    const mentoringTasksCreated = await createCollectionIndexes(
      "mentoring_tasks" as any,
      mentoringTasksCollection
    );

    const totalCreated =
      contactsCreated + notesCreated + tilesCreated + workspacesCreated + dashboardsCreated + auditLogsCreated +
      mentoringTracksCreated + mentoringEnrollmentsCreated + mentoringTasksCreated;

    console.log("[MongoDB] 🎉 Index creation completed!");
    console.log(
      `[MongoDB] 📊 Created ${totalCreated} new indexes (others already existed)`
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("[MongoDB] ❌ Failed to create indexes:", errorMessage);
    throw error;
  }
}

/**
 * Initialize indexes (call on app startup or migration)
 * 
 * Best practice: Gracefully handle existing indexes and connection errors.
 * This function will not throw - it logs errors but allows the app to continue.
 * 
 * Use this in development or as a fallback.
 * For production, use the CLI script or API route with proper authentication.
 */
export async function initializeIndexes(): Promise<void> {
  try {
    await createIndexes();
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.warn(
      "[MongoDB] ⚠️  Failed to initialize indexes (app will continue):",
      errorMessage
    );
    // Don't throw - allow app to continue even if indexes fail
    // They can be created manually later via CLI or API
  }
}

/**
 * List all existing indexes for a collection
 * Useful for debugging and verification
 */
export async function listIndexes(
  collectionName: string
): Promise<Array<{ name: string; key: Record<string, number> }>> {
  try {
    const collection = await getCollection(collectionName);
    const indexes = await collection.indexes();
    return indexes.map((idx) => ({
      name: idx.name || "",
      key: idx.key as Record<string, number>,
    }));
  } catch (error) {
    console.error(
      `[MongoDB] ❌ Failed to list indexes for ${collectionName}:`,
      error
    );
    throw error;
  }
}

/**
 * Drop all indexes for a collection (except _id)
 * ⚠️ USE WITH CAUTION - This will remove all indexes!
 * 
 * @param collectionName - Name of the collection
 * @param confirm - Must be true to actually drop indexes
 */
export async function dropIndexes(
  collectionName: string,
  confirm: boolean = false
): Promise<void> {
  if (!confirm) {
    throw new Error(
      "dropIndexes requires confirm=true for safety. This will remove all indexes!"
    );
  }

  try {
    const collection = await getCollection(collectionName);
    const result = await collection.dropIndexes();
    console.log(
      `[MongoDB] 🗑️  Dropped indexes for ${collectionName}:`,
      result
    );
  } catch (error) {
    console.error(
      `[MongoDB] ❌ Failed to drop indexes for ${collectionName}:`,
      error
    );
    throw error;
  }
}

