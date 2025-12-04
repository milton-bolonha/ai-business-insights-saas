import { NextRequest, NextResponse } from "next/server";

/**
 * API Route: Create MongoDB Indexes
 * 
 * ⚠️ SECURITY: This endpoint requires authentication via ADMIN_SECRET
 * 
 * Usage:
 *   POST /api/db/create-indexes
 *   Headers: Authorization: Bearer <ADMIN_SECRET>
 * 
 * Runtime: Node.js (required for MongoDB)
 */
export const runtime = 'nodejs';

/**
 * This endpoint is useful for:
 * - Production deployments (via CI/CD)
 * - Manual index creation without CLI access
 * - Health checks and maintenance
 * 
 * Best Practices:
 * - Only expose in production with proper authentication
 * - Consider rate limiting
 * - Log all access attempts
 */

import { createIndexes, listIndexes } from "@/lib/db/indexes";

/**
 * Verify admin authentication
 */
function verifyAdminAuth(request: NextRequest): boolean {
  const authHeader = request.headers.get("authorization");
  const adminSecret = process.env.ADMIN_SECRET;

  if (!adminSecret) {
    console.warn(
      "[API] /api/db/create-indexes - ADMIN_SECRET not configured"
    );
    return false;
  }

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return false;
  }

  const token = authHeader.substring(7);
  return token === adminSecret;
}

export async function POST(request: NextRequest) {
  // Security check
  if (!verifyAdminAuth(request)) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  // Only allow in production or with explicit flag
  const allowInDev = process.env.ALLOW_INDEX_CREATION_IN_DEV === "true";
  if (process.env.NODE_ENV !== "production" && !allowInDev) {
    return NextResponse.json(
      {
        error: "Index creation via API is disabled in development",
        hint: "Use 'npm run create-indexes' instead, or set ALLOW_INDEX_CREATION_IN_DEV=true",
      },
      { status: 403 }
    );
  }

  try {
    console.log("[API] /api/db/create-indexes - Starting index creation...");

    await createIndexes();

    // Return summary of indexes
    const collections = ["contacts", "notes", "tiles", "workspaces"];
    const indexSummary: Record<string, Array<{ name: string; key: Record<string, number> }>> = {};

    for (const collectionName of collections) {
      try {
        const indexes = await listIndexes(collectionName);
        indexSummary[collectionName] = indexes;
      } catch (error) {
        console.warn(
          `[API] Could not list indexes for ${collectionName}:`,
          error
        );
      }
    }

    return NextResponse.json({
      success: true,
      message: "Indexes created successfully",
      indexes: indexSummary,
    });
  } catch (error) {
    console.error("[API] /api/db/create-indexes - Error:", error);
    return NextResponse.json(
      {
        error: "Failed to create indexes",
        details:
          error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

/**
 * GET endpoint to list existing indexes (read-only, no auth required for now)
 * Consider adding auth if you want to protect this too
 */
export async function GET() {
  try {
    const collections = ["contacts", "notes", "tiles", "workspaces"];
    const indexSummary: Record<string, Array<{ name: string; key: Record<string, number> }>> = {};

    for (const collectionName of collections) {
      try {
        const indexes = await listIndexes(collectionName);
        indexSummary[collectionName] = indexes;
      } catch (error) {
        console.warn(
          `[API] Could not list indexes for ${collectionName}:`,
          error
        );
      }
    }

    return NextResponse.json({
      success: true,
      indexes: indexSummary,
    });
  } catch (error) {
    console.error("[API] /api/db/create-indexes - Error:", error);
    return NextResponse.json(
      {
        error: "Failed to list indexes",
        details:
          error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

