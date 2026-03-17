import { db } from "./mongodb";
import {
  workspaceSnapshotToDocument,
  type WorkspaceDocument,
} from "./models/Workspace";
import { tileToDocument } from "./models/Tile";
import type { WorkspaceSnapshot } from "@/lib/types";

const MAX_WORKSPACES = 10;
const MAX_DASHBOARDS_PER_WORKSPACE = 25;
const MAX_TILES_PER_DASHBOARD = 200;
const MAX_CONTACTS_PER_DASHBOARD = 200;
const MAX_NOTES_PER_DASHBOARD = 200;
const RESPONSE_LENGTHS = new Set(["short", "medium", "long"]);

function normalizeResponseLength(
  value?: string
): "short" | "medium" | "long" | undefined {
  if (!value) return undefined;
  return RESPONSE_LENGTHS.has(value)
    ? (value as "short" | "medium" | "long")
    : undefined;
}

/**
 * Migrate workspace to MongoDB (for members only)
 * Security: Only saves if userId is provided
 */
export async function migrateWorkspaceToMongo(
  workspace: WorkspaceSnapshot,
  userId: string
): Promise<void> {
  if (!userId) {
    console.warn(
      "[Migration] ⚠️ Skipping MongoDB migration - no userId provided"
    );
    return;
  }

  try {
    const workspaceDoc = workspaceSnapshotToDocument(workspace);
    const document: Omit<WorkspaceDocument, "_id"> = {
      ...workspaceDoc,
      userId,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // 1. Upsert Workspace
    const existing = await db.findOne<WorkspaceDocument>("workspaces", {
      sessionId: workspace.sessionId,
      userId,
    });

    if (existing) {
      await db.updateOne(
        "workspaces",
        { sessionId: workspace.sessionId, userId },
        {
          $set: {
            ...document,
            updatedAt: new Date(),
          },
        }
      );
      console.log("[Migration] ✅ Workspace updated in MongoDB");
    } else {
      await db.insertOne("workspaces", document);
      console.log("[Migration] ✅ Workspace saved to MongoDB");
    }

    // 2. Initialize Default Dashboard
    const dashboardId = `dashboard_${workspace.sessionId}_default`;
    const existingDashboard = await db.findOne("dashboards", {
      id: dashboardId,
      userId,
    });

    if (!existingDashboard) {
      await db.insertOne("dashboards", {
        id: dashboardId,
        workspaceId: workspace.sessionId,
        userId,
        name: "Default Dashboard",
        templateId: workspace.promptSettings?.templateId || null,
        bgColor: workspace.appearance?.baseColor || "#f7f7f7",
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      console.log(`[Migration] ✅ Default dashboard created: ${dashboardId}`);
    }

    // 3. Migrate Tiles
    if (workspace.tiles && workspace.tiles.length > 0) {
      console.log(`[Migration] 📦 Migrating ${workspace.tiles.length} initial tiles...`);
      for (const tile of workspace.tiles) {
        const tileDoc = tileToDocument(
          tile,
          userId,
          workspace.sessionId,
          dashboardId
        );
        
        // Use tile.id if available, otherwise generated one
        const internalId = tile.id || `tile_${Math.random().toString(36).substring(2, 11)}`;

        await db.updateOne(
          "tiles",
          { id: internalId, userId, workspaceId: workspace.sessionId },
          { 
            $set: {
              ...tileDoc,
              id: internalId,
              updatedAt: new Date(),
            },
            $setOnInsert: {
              createdAt: new Date(),
            }
          },
          { upsert: true }
        );
      }
      console.log("[Migration] ✅ Initial tiles migrated");
    }
  } catch (error) {
    console.error(
      "[Migration] ❌ Failed to migrate workspace to MongoDB:",
      error
    );
  }
}

/**
 * Sync tiles to MongoDB (for members only)
 */
import type { Tile, Contact, Note, TileMessage } from "@/lib/types";

type GuestTilePayload = {
  id: string;
  title: string;
  content: string;
  prompt?: string | null;
  templateId?: string | null;
  templateTileId?: string | null;
  category?: string | null;
  model?: string | null;
  orderIndex?: number | null;
  createdAt?: string | null;
  updatedAt?: string | null;
  totalTokens?: number | null;
  attempts?: number | null;
  history?: unknown[] | null;
  agentId?: string | null;
  responseLength?: string | null;
  promptVariables?: string[] | null;
};

type GuestContactPayload = {
  id: string;
  name: string;
  jobTitle?: string | null;
  linkedinUrl?: string | null;
  email?: string | null;
  phone?: string | null;
  company?: string | null;
  notes?: string | null;
  createdAt?: string | null;
};

type GuestNotePayload = {
  id: string;
  content: string;
  title?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
};

type GuestDashboardPayload = {
  id: string;
  name: string;
  workspaceId: string;
  tiles?: GuestTilePayload[];
  contacts?: GuestContactPayload[];
  notes?: GuestNotePayload[];
  bgColor?: string | null;
  templateId?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
};

type GuestWorkspacePayload = {
  id: string;
  name: string;
  website?: string | null;
  dashboards: GuestDashboardPayload[];
  createdAt?: string | null;
  updatedAt?: string | null;
};

export async function syncWorkspaceTilesToMongo(
  sessionId: string,
  userId: string,
  tiles: Tile[]
): Promise<void> {
  if (!userId) return;

  try {
    await db.updateOne(
      "workspaces",
      { sessionId, userId },
      {
        $set: {
          tiles: tiles,
          updatedAt: new Date(),
        },
      }
    );
    console.log("[Migration] ✅ Tiles synced to MongoDB");
  } catch (error) {
    console.error("[Migration] ❌ Failed to sync tiles to MongoDB:", error);
  }
}

/**
 * Sync contacts to MongoDB (for members only)
 */
export async function syncWorkspaceContactsToMongo(
  sessionId: string,
  userId: string,
  contacts: Contact[]
): Promise<void> {
  if (!userId) return;

  try {
    await db.updateOne(
      "workspaces",
      { sessionId, userId },
      {
        $set: {
          contacts: contacts,
          updatedAt: new Date(),
        },
      }
    );
    console.log("[Migration] ✅ Contacts synced to MongoDB");
  } catch (error) {
    console.error("[Migration] ❌ Failed to sync contacts to MongoDB:", error);
  }
}

/**
 * Sync notes to MongoDB (for members only)
 */
export async function syncWorkspaceNotesToMongo(
  sessionId: string,
  userId: string,
  notes: Note[]
): Promise<void> {
  if (!userId) return;

  try {
    await db.updateOne(
      "workspaces",
      { sessionId, userId },
      {
        $set: {
          notes: notes,
          updatedAt: new Date(),
        },
      }
    );
    console.log("[Migration] ✅ Notes synced to MongoDB");
  } catch (error) {
    console.error("[Migration] ❌ Failed to sync notes to MongoDB:", error);
  }
}

/**
 * Migrate all guest data from localStorage to MongoDB
 * Called when a guest user becomes a member (after payment)
 *
 * This function:
 * 1. Loads all workspaces from localStorage
 * 2. Migrates each workspace to MongoDB
 * 3. Migrates all dashboards, tiles, contacts, and notes
 * 4. Preserves all data structure and relationships
 */
export async function migrateAllGuestDataToMongo(userId: string): Promise<{
  workspacesMigrated: number;
  dashboardsMigrated: number;
  tilesMigrated: number;
  contactsMigrated: number;
  notesMigrated: number;
  errors: string[];
}> {
  if (!userId) {
    throw new Error("userId is required for migration");
  }

  const stats = {
    workspacesMigrated: 0,
    dashboardsMigrated: 0,
    tilesMigrated: 0,
    contactsMigrated: 0,
    notesMigrated: 0,
    errors: [] as string[],
  };

  try {
    // Import localStorage functions (client-side only)
    // Note: This will only work if called from client-side or API route that can access localStorage
    // For webhook, we need to pass the data differently
    console.log(
      "[Migration] 🚀 Starting migration of guest data to MongoDB for user:",
      userId
    );

    // Since webhooks run server-side, we can't access localStorage directly
    // Instead, we'll create an API endpoint that the client can call after payment
    // OR we can store the localStorage data in a temporary location before migration

    // For now, this function will be called from the client-side after successful payment
    // The client will pass the localStorage data to an API endpoint

    console.log(
      "[Migration] ⚠️ Migration function ready - must be called from client with localStorage data"
    );

    return stats;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    stats.errors.push(`Migration failed: ${errorMessage}`);
    console.error("[Migration] ❌ Failed to migrate guest data:", error);
    return stats;
  }
}

/**
 * Migrate workspace data from localStorage format to MongoDB
 * This is called from an API endpoint that receives the localStorage data
 */
export async function migrateWorkspaceDataToMongo(
  userId: string,
  workspaceData: { workspaces: GuestWorkspacePayload[] }
): Promise<{
  workspacesMigrated: number;
  dashboardsMigrated: number;
  tilesMigrated: number;
  contactsMigrated: number;
  notesMigrated: number;
  errors: string[];
}> {
  const stats = {
    workspacesMigrated: 0,
    dashboardsMigrated: 0,
    tilesMigrated: 0,
    contactsMigrated: 0,
    notesMigrated: 0,
    errors: [] as string[],
  };

  if (!userId) {
    stats.errors.push("userId is required");
    return stats;
  }

  try {
    const { tileToDocument } = await import("./models/Tile");
    const { contactToDocument } = await import("./models/Contact");
    const { noteToDocument } = await import("./models/Note");
    const { workspaceSnapshotToDocument } = await import("./models/Workspace");

    console.log(`[Migration] 🚀 Starting migration for user ${userId}`);
    console.log(
      `[Migration] 📦 Workspaces to migrate: ${workspaceData.workspaces.length}`
    );

    if (workspaceData.workspaces.length > MAX_WORKSPACES) {
      stats.errors.push(
        `Too many workspaces provided (${workspaceData.workspaces.length}/${MAX_WORKSPACES})`
      );
      return stats;
    }

    const seenWorkspaceIds = new Set<string>();

    // Migrate each workspace
    for (const workspace of workspaceData.workspaces) {
      try {
        if (!workspace.id || !workspace.name) {
          stats.errors.push("Workspace missing id or name");
          continue;
        }

        if (seenWorkspaceIds.has(workspace.id)) {
          stats.errors.push(`Duplicate workspace id detected: ${workspace.id}`);
          continue;
        }
        seenWorkspaceIds.add(workspace.id);

        const dashboards = Array.isArray(workspace.dashboards)
          ? workspace.dashboards.slice(0, MAX_DASHBOARDS_PER_WORKSPACE)
          : [];

        if ((workspace.dashboards?.length || 0) > dashboards.length) {
          stats.errors.push(
            `Dashboards truncated for workspace ${workspace.id} (max ${MAX_DASHBOARDS_PER_WORKSPACE})`
          );
        }

        const workspaceCreatedAt =
          workspace.createdAt || new Date().toISOString();
        const workspaceUpdatedAt = workspace.updatedAt || workspaceCreatedAt;

        // 1. Create workspace document
        const workspaceSnapshot: WorkspaceSnapshot = {
          sessionId: workspace.id,
          name: workspace.name,
          website: workspace.website ?? undefined,
          generatedAt: workspaceCreatedAt,
          tilesToGenerate: 0,
        };

        const workspaceDoc = workspaceSnapshotToDocument(workspaceSnapshot);
        const workspaceDocument: Omit<WorkspaceDocument, "_id"> = {
          ...workspaceDoc,
          userId,
          createdAt: new Date(workspaceCreatedAt),
          updatedAt: new Date(workspaceUpdatedAt),
        };

        // Check if workspace already exists
        const existing = await db.findOne("workspaces", {
          sessionId: workspace.id,
          userId,
        });

        if (existing) {
          await db.updateOne(
            "workspaces",
            { sessionId: workspace.id, userId },
            { $set: workspaceDocument }
          );
          console.log(
            `[Migration] ✅ Workspace ${workspace.id} updated in MongoDB`
          );
        } else {
          await db.insertOne("workspaces", workspaceDocument);
          console.log(
            `[Migration] ✅ Workspace ${workspace.id} saved to MongoDB`
          );
        }

        stats.workspacesMigrated++;

        // 2. Migrate each dashboard's data
        const seenDashboardIds = new Set<string>();

        for (const dashboard of dashboards) {
          try {
            if (!dashboard.id || !dashboard.name) {
              stats.errors.push(
                `Dashboard missing id or name in workspace ${workspace.id}`
              );
              continue;
            }

            if (dashboard.workspaceId !== workspace.id) {
              stats.errors.push(
                `Dashboard ${dashboard.id} has mismatched workspaceId ${dashboard.workspaceId}`
              );
              continue;
            }

            if (seenDashboardIds.has(dashboard.id)) {
              stats.errors.push(
                `Duplicate dashboard id ${dashboard.id} in workspace ${workspace.id}`
              );
              continue;
            }
            seenDashboardIds.add(dashboard.id);

            const dashboardCreatedAt =
              dashboard.createdAt || workspaceCreatedAt;
            const dashboardUpdatedAt =
              dashboard.updatedAt || workspaceUpdatedAt;

            // Migrate tiles
            const tiles = Array.isArray(dashboard.tiles)
              ? dashboard.tiles.slice(0, MAX_TILES_PER_DASHBOARD)
              : [];

            if ((dashboard.tiles?.length || 0) > tiles.length) {
              stats.errors.push(
                `Tiles truncated for dashboard ${dashboard.id} (max ${MAX_TILES_PER_DASHBOARD})`
              );
            }

            const seenTileIds = new Set<string>();

            if (tiles.length > 0) {
              for (const tile of tiles) {
                if (!tile.id || !tile.title) {
                  stats.errors.push(
                    `Tile missing required fields (id, title) in dashboard ${dashboard.id}`
                  );
                  continue;
                }

                if (seenTileIds.has(tile.id)) {
                  stats.errors.push(
                    `Duplicate tile id ${tile.id} in dashboard ${dashboard.id}`
                  );
                  continue;
                }
                seenTileIds.add(tile.id);

                try {
                  const normalizedHistory =
                    Array.isArray(tile.history) && tile.history.length > 0
                      ? tile.history
                        .map((entry) => {
                          if (
                            entry &&
                            typeof entry === "object" &&
                            typeof (entry as { role?: string }).role ===
                            "string" &&
                            typeof (entry as { content?: string }).content ===
                            "string"
                          ) {
                            return {
                              id:
                                typeof (entry as { id?: string }).id ===
                                  "string"
                                  ? (entry as { id?: string }).id!
                                  : `history_${Date.now().toString(36)}`,
                              role:
                                (entry as { role: string }).role ===
                                  "assistant" ||
                                  (entry as { role: string }).role === "system"
                                  ? (entry as { role: TileMessage["role"] })
                                    .role
                                  : "user",
                              content: (entry as { content: string }).content,
                              createdAt:
                                typeof (entry as { createdAt?: string })
                                  .createdAt === "string"
                                  ? (entry as { createdAt?: string })
                                    .createdAt!
                                  : new Date().toISOString(),
                            } satisfies TileMessage;
                          }
                          return null;
                        })
                        .filter((entry): entry is TileMessage =>
                          Boolean(entry)
                        )
                      : [];

                  const normalizedTile: Tile = {
                    id: tile.id,
                    title: tile.title,
                    content: tile.content,
                    prompt: tile.prompt ?? "",
                    templateId: tile.templateId ?? undefined,
                    templateTileId: tile.templateTileId ?? undefined,
                    category: tile.category ?? undefined,
                    model: tile.model ?? "gpt-4o-mini",
                    orderIndex:
                      typeof tile.orderIndex === "number"
                        ? tile.orderIndex
                        : tiles.indexOf(tile),
                    createdAt:
                      tile.createdAt ||
                      dashboardCreatedAt ||
                      new Date().toISOString(),
                    updatedAt:
                      tile.updatedAt ||
                      dashboardUpdatedAt ||
                      new Date().toISOString(),
                    totalTokens:
                      typeof tile.totalTokens === "number"
                        ? tile.totalTokens
                        : null,
                    attempts: tile.attempts ?? 0,
                    history: normalizedHistory,
                    agentId: tile.agentId ?? undefined,
                    responseLength: normalizeResponseLength(
                      tile.responseLength ?? undefined
                    ),
                    promptVariables: tile.promptVariables ?? undefined,
                  };

                  const tileDoc = tileToDocument(
                    normalizedTile,
                    userId,
                    workspace.id,
                    dashboard.id
                  );
                  const tileDocument = {
                    ...tileDoc,
                    createdAt: new Date(normalizedTile.createdAt),
                    updatedAt: new Date(normalizedTile.updatedAt),
                  };

                  // Check if tile already exists
                  const existingTile = await db.findOne("tiles", {
                    id: tile.id,
                    userId,
                    workspaceId: workspace.id,
                    dashboardId: dashboard.id,
                  });

                  if (existingTile) {
                    await db.updateOne(
                      "tiles",
                      {
                        id: tile.id,
                        userId,
                        workspaceId: workspace.id,
                        dashboardId: dashboard.id,
                      },
                      { $set: tileDocument }
                    );
                  } else {
                    await db.insertOne("tiles", {
                      ...tileDocument,
                      id: tile.id,
                    });
                  }

                  stats.tilesMigrated++;
                } catch (tileError) {
                  const errorMsg = `Failed to migrate tile ${tile.id}: ${tileError instanceof Error
                    ? tileError.message
                    : String(tileError)
                    }`;
                  stats.errors.push(errorMsg);
                  console.error(`[Migration] ❌ ${errorMsg}`);
                }
              }
            }

            // Migrate contacts
            const contacts = Array.isArray(dashboard.contacts)
              ? dashboard.contacts.slice(0, MAX_CONTACTS_PER_DASHBOARD)
              : [];

            if ((dashboard.contacts?.length || 0) > contacts.length) {
              stats.errors.push(
                `Contacts truncated for dashboard ${dashboard.id} (max ${MAX_CONTACTS_PER_DASHBOARD})`
              );
            }

            const seenContactIds = new Set<string>();

            if (contacts.length > 0) {
              for (const contact of contacts) {
                if (!contact.id || !contact.name) {
                  stats.errors.push(
                    `Contact missing required fields in dashboard ${dashboard.id}`
                  );
                  continue;
                }

                if (seenContactIds.has(contact.id)) {
                  stats.errors.push(
                    `Duplicate contact id ${contact.id} in dashboard ${dashboard.id}`
                  );
                  continue;
                }
                seenContactIds.add(contact.id);

                try {
                  const normalizedContact: Contact = {
                    id: contact.id,
                    name: contact.name,
                    jobTitle: contact.jobTitle ?? undefined,
                    linkedinUrl: contact.linkedinUrl ?? undefined,
                    email: contact.email ?? undefined,
                    phone: contact.phone ?? undefined,
                    company: contact.company ?? undefined,
                    notes: contact.notes ?? undefined,
                    createdAt:
                      contact.createdAt ||
                      dashboardCreatedAt ||
                      new Date().toISOString(),
                  };

                  const contactDoc = contactToDocument(
                    normalizedContact,
                    userId,
                    workspace.id,
                    dashboard.id
                  );
                  const contactDocument = {
                    ...contactDoc,
                    createdAt: new Date(
                      normalizedContact.createdAt || dashboardCreatedAt
                    ),
                    updatedAt: new Date(dashboardUpdatedAt),
                  };

                  // Check if contact already exists
                  const existingContact = await db.findOne("contacts", {
                    id: contact.id,
                    userId,
                    workspaceId: workspace.id,
                    dashboardId: dashboard.id,
                  });

                  if (existingContact) {
                    await db.updateOne(
                      "contacts",
                      {
                        id: contact.id,
                        userId,
                        workspaceId: workspace.id,
                        dashboardId: dashboard.id,
                      },
                      { $set: contactDocument }
                    );
                  } else {
                    await db.insertOne("contacts", {
                      ...contactDocument,
                      id: contact.id,
                    });
                  }

                  stats.contactsMigrated++;
                } catch (contactError) {
                  const errorMsg = `Failed to migrate contact ${contact.id}: ${contactError instanceof Error
                    ? contactError.message
                    : String(contactError)
                    }`;
                  stats.errors.push(errorMsg);
                  console.error(`[Migration] ❌ ${errorMsg}`);
                }
              }
            }

            // Migrate notes
            const notes = Array.isArray(dashboard.notes)
              ? dashboard.notes.slice(0, MAX_NOTES_PER_DASHBOARD)
              : [];

            if ((dashboard.notes?.length || 0) > notes.length) {
              stats.errors.push(
                `Notes truncated for dashboard ${dashboard.id} (max ${MAX_NOTES_PER_DASHBOARD})`
              );
            }

            const seenNoteIds = new Set<string>();

            if (notes.length > 0) {
              for (const note of notes) {
                if (!note.id || !note.content) {
                  stats.errors.push(
                    `Note missing required fields in dashboard ${dashboard.id}`
                  );
                  continue;
                }

                if (seenNoteIds.has(note.id)) {
                  stats.errors.push(
                    `Duplicate note id ${note.id} in dashboard ${dashboard.id}`
                  );
                  continue;
                }
                seenNoteIds.add(note.id);

                try {
                  const normalizedNote: Note = {
                    id: note.id,
                    title: note.title ?? "Note",
                    content: note.content,
                    createdAt:
                      note.createdAt ||
                      dashboardCreatedAt ||
                      new Date().toISOString(),
                    updatedAt:
                      note.updatedAt ||
                      dashboardUpdatedAt ||
                      new Date().toISOString(),
                  };

                  const noteDoc = noteToDocument(
                    normalizedNote,
                    userId,
                    workspace.id,
                    dashboard.id
                  );
                  const noteDocument = {
                    ...noteDoc,
                    createdAt: new Date(
                      normalizedNote.createdAt || dashboardCreatedAt
                    ),
                    updatedAt: new Date(
                      normalizedNote.updatedAt || dashboardUpdatedAt
                    ),
                  };

                  // Check if note already exists
                  const existingNote = await db.findOne("notes", {
                    id: note.id,
                    userId,
                    workspaceId: workspace.id,
                    dashboardId: dashboard.id,
                  });

                  if (existingNote) {
                    await db.updateOne(
                      "notes",
                      {
                        id: note.id,
                        userId,
                        workspaceId: workspace.id,
                        dashboardId: dashboard.id,
                      },
                      { $set: noteDocument }
                    );
                  } else {
                    await db.insertOne("notes", {
                      ...noteDocument,
                      id: note.id,
                    });
                  }

                  stats.notesMigrated++;
                } catch (noteError) {
                  const errorMsg = `Failed to migrate note ${note.id}: ${noteError instanceof Error
                    ? noteError.message
                    : String(noteError)
                    }`;
                  stats.errors.push(errorMsg);
                  console.error(`[Migration] ❌ ${errorMsg}`);
                }
              }
            }

            stats.dashboardsMigrated++;
            console.log(`[Migration] ✅ Dashboard ${dashboard.id} migrated`);
          } catch (dashboardError) {
            const errorMsg = `Failed to migrate dashboard ${dashboard.id}: ${dashboardError instanceof Error
              ? dashboardError.message
              : String(dashboardError)
              }`;
            stats.errors.push(errorMsg);
            console.error(`[Migration] ❌ ${errorMsg}`);
          }
        }
      } catch (workspaceError) {
        const errorMsg = `Failed to migrate workspace ${workspace.id}: ${workspaceError instanceof Error
          ? workspaceError.message
          : String(workspaceError)
          }`;
        stats.errors.push(errorMsg);
        console.error(`[Migration] ❌ ${errorMsg}`);
      }
    }

    console.log(`[Migration] ✅ Migration completed:`, stats);
    return stats;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    stats.errors.push(`Migration failed: ${errorMessage}`);
    console.error("[Migration] ❌ Failed to migrate workspace data:", error);
    return stats;
  }
}
