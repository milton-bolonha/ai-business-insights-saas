import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { getAuth } from "@/lib/auth/get-auth";
import { migrateWorkspaceDataToMongo } from "@/lib/db/migration-helpers";
import { auditLog } from "@/lib/audit/logger";

/**
 * API endpoint to migrate guest data from localStorage to MongoDB
 * Called by the client after successful payment
 *
 * POST /api/migrate-guest-data
 * Body: { workspaceData: { workspaces: [...] } }
 *
 * Runtime: Node.js (required for MongoDB)
 */
export const runtime = "nodejs";

const MAX_WORKSPACES = 10;
const MAX_DASHBOARDS_PER_WORKSPACE = 25;
const MAX_TILES_PER_DASHBOARD = 200;
const MAX_CONTACTS_PER_DASHBOARD = 200;
const MAX_NOTES_PER_DASHBOARD = 200;

const tileSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  content: z.string().min(1),
  prompt: z.string().nullable().optional().default(""),
  templateId: z.string().nullable().optional(),
  templateTileId: z.string().nullable().optional(),
  category: z.string().nullable().optional(),
  model: z.string().nullable().optional().default("gpt-4o-mini"),
  orderIndex: z.number().nullable().optional().default(0),
  createdAt: z.string().nullable().optional(),
  updatedAt: z.string().nullable().optional(),
  totalTokens: z.number().nullable().optional(),
  attempts: z.number().nullable().optional().default(0),
  history: z.array(z.any()).nullable().optional().default([]),
  agentId: z.string().nullable().optional(),
  responseLength: z.string().nullable().optional(),
  promptVariables: z.array(z.string()).nullable().optional(),
});

const contactSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  jobTitle: z.string().nullable().optional(),
  linkedinUrl: z.string().nullable().optional(),
  email: z.string().nullable().optional(),
  phone: z.string().nullable().optional(),
  company: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
  createdAt: z.string().nullable().optional(),
});

const noteSchema = z.object({
  id: z.string().min(1),
  title: z.string().nullable().optional(),
  content: z.string().min(1),
  createdAt: z.string().nullable().optional(),
  updatedAt: z.string().nullable().optional(),
});

const dashboardSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  workspaceId: z.string().min(1),
  bgColor: z.string().nullable().optional(),
  templateId: z.string().nullable().optional(),
  createdAt: z.string().nullable().optional(),
  updatedAt: z.string().nullable().optional(),
  tiles: z
    .array(tileSchema)
    .max(MAX_TILES_PER_DASHBOARD)
    .optional()
    .default([]),
  contacts: z
    .array(contactSchema)
    .max(MAX_CONTACTS_PER_DASHBOARD)
    .optional()
    .default([]),
  notes: z
    .array(noteSchema)
    .max(MAX_NOTES_PER_DASHBOARD)
    .optional()
    .default([]),
});

const workspaceSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  website: z.string().nullable().optional(),
  createdAt: z.string().nullable().optional(),
  updatedAt: z.string().nullable().optional(),
  dashboards: z
    .array(dashboardSchema)
    .max(MAX_DASHBOARDS_PER_WORKSPACE)
    .optional()
    .default([]),
});

const migrationSchema = z.object({
  workspaceData: z.object({
    workspaces: z.array(workspaceSchema).max(MAX_WORKSPACES),
  }),
});

export async function POST(request: NextRequest) {
  try {
    const { userId } = await getAuth();

    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized - user must be authenticated" },
        { status: 401 }
      );
    }

    const rawBody = await request.json().catch(() => null);
    const parsedBody = migrationSchema.safeParse(rawBody);

    if (!parsedBody.success) {
      await auditLog("data_migration", "Guest data migration rejected", {
        userId,
        userRole: "member",
        success: false,
        errorMessage: "Invalid migration payload",
        details: parsedBody.error.flatten(),
        request,
      });

      return NextResponse.json(
        {
          error: "Invalid request body",
          details: parsedBody.error.flatten(),
        },
        { status: 400 }
      );
    }

    const { workspaceData } = parsedBody.data;

    console.log(`[Migration API] 🚀 Starting migration for user ${userId}`);
    console.log(
      `[Migration API] 📦 Workspaces to migrate: ${workspaceData.workspaces.length}`
    );

    // Perform migration
    const stats = await migrateWorkspaceDataToMongo(userId, workspaceData);

    // Audit log
    await auditLog("data_migration", "Guest data migrated to MongoDB", {
      userId,
      userRole: "member",
      details: {
        workspacesMigrated: stats.workspacesMigrated,
        dashboardsMigrated: stats.dashboardsMigrated,
        tilesMigrated: stats.tilesMigrated,
        contactsMigrated: stats.contactsMigrated,
        notesMigrated: stats.notesMigrated,
        errors: stats.errors.length,
      },
      success: stats.errors.length === 0,
    });

    if (stats.errors.length > 0) {
      console.warn(
        `[Migration API] ⚠️ Migration completed with ${stats.errors.length} errors`
      );
      return NextResponse.json(
        {
          success: true,
          stats,
          warning: "Migration completed with some errors",
        },
        { status: 200 }
      );
    }

    console.log(
      `[Migration API] ✅ Migration completed successfully for user ${userId}`
    );
    return NextResponse.json({
      success: true,
      stats,
    });
  } catch (error) {
    console.error("[Migration API] ❌ Migration failed:", error);
    return NextResponse.json(
      {
        error: "Migration failed",
        message: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
