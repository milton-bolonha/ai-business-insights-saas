import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { z } from "zod";

import { resolveWorkspaceName } from "@/lib/workspace-resolver";
import { resolveModel, DEFAULT_MAX_OUTPUT_TOKENS } from "@/lib/ai/settings";
import { generateTileContent } from "@/lib/ai/tile-generation";
import type { Tile } from "@/lib/types";
import { getAuth } from "@/lib/auth/get-auth";
import { authorizeResourceAccess } from "@/lib/auth/authorize";
import { invalidateResourceCache } from "@/lib/cache/invalidation";
import { checkLimit, incrementUsage } from "@/lib/saas/usage-service";
import { checkRateLimitMiddleware } from "@/lib/middleware/rate-limit";

// Runtime: Node.js (required for file system operations)
export const runtime = "nodejs";

const regenerateSchema = z.object({
  workspaceId: z.string().min(1, "workspaceId is required"),
  dashboardId: z.string().min(1, "dashboardId is required"),
  prompt: z.string().optional(),
  model: z.string().optional(),
});

const DEFAULT_PROMPT =
  "Regenerate the previous insight with updated information.";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ tileId: string }> }
) {
  const rate = await checkRateLimitMiddleware(request);
  if (!rate.allowed && rate.response) return rate.response;

  const { tileId } = await params;
  const rawBody = await request.json().catch(() => ({}));
  const body = regenerateSchema.safeParse(rawBody);

  if (!body.success) {
    return NextResponse.json(
      { error: "Invalid payload", details: body.error.flatten() },
      { status: 400 }
    );
  }

  const { workspaceId, dashboardId, prompt, model } = body.data;
  const { userId } = await getAuth();

  const auth = await authorizeResourceAccess(
    workspaceId,
    dashboardId,
    tileId,
    "tiles",
    userId
  );

  if (!auth.authorized) {
    return NextResponse.json(
      { error: auth.error ?? "Unauthorized" },
      { status: 403 }
    );
  }

  if (userId) {
    const limit = await checkLimit(userId, "regenerationsCount");
    if (!limit.allowed) {
      return NextResponse.json(
        {
          error:
            limit.reason ??
            "Regeneration limit reached. Upgrade your plan to continue.",
        },
        { status: 429 }
      );
    }
  } else {
    // 🔒 Guest Security Check
    const { checkGuestLimit } = await import("@/lib/middleware/guest-limit");
    const { SAFE_DEFAULT_GUEST } = await import("@/lib/saas/usage-service");

    // Check "generation" limit
    const guestLimitData = await checkGuestLimit(
      request,
      "generation",
      SAFE_DEFAULT_GUEST.regenerationsCount,
      1
    );

    if (!guestLimitData.allowed) {
      const errorRes = NextResponse.json(
        {
          error: guestLimitData.reason,
          upgradeRequired: true
        },
        { status: 403 }
      );
      if (guestLimitData.response) {
        guestLimitData.response.cookies.getAll().forEach((c) => errorRes.cookies.set(c));
      }
      return errorRes;
    }

    // Pass cookie response for later use
    (request as any)._guestLimitResponse = guestLimitData.response;
    (request as any)._guestId = guestLimitData.guestId;
  }

  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json(
      { error: "OPENAI_API_KEY is not configured" },
      { status: 500 }
    );
  }

  const workspaceInfo = await resolveWorkspaceName(workspaceId, userId);
  if (!workspaceInfo) {
    return NextResponse.json({ error: "Workspace not found" }, { status: 404 });
  }

  try {
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const resolvedPrompt = prompt ?? DEFAULT_PROMPT;
    const generationResult = await generateTileContent({
      client: openai,
      prompt: resolvedPrompt,
      title: "Regenerated Insight",
      templateId: "custom",
      model: resolveModel(model ?? "gpt-4o-mini"),
      orderIndex: 0,
      maxTokens: DEFAULT_MAX_OUTPUT_TOKENS,
    });

    const regeneratedTile: Tile = {
      id: tileId,
      title: "Regenerated Insight",
      content: generationResult.content,
      prompt: resolvedPrompt,
      templateId: "custom",
      category: "custom",
      model: generationResult.model,
      orderIndex: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      totalTokens: generationResult.totalTokens,
      attempts: generationResult.attempts,
      history: generationResult.history || [],
    };

    if (userId) {
      await invalidateResourceCache("tiles", dashboardId, workspaceId);
      await incrementUsage(userId, "regenerationsCount", 1);
    } else {
      // Increment Guest Usage
      const guestId = (request as any)._guestId;
      if (guestId) {
        const { incrementGuestUsage } = await import("@/lib/middleware/guest-limit");
        const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
        await incrementGuestUsage(guestId, ip, "generation", 1);
      }
    }

    const response = NextResponse.json({
      success: true,
      tile: regeneratedTile,
    });

    // Set cookie if needed
    const guestResponse = (request as any)._guestLimitResponse as NextResponse | undefined;
    if (guestResponse) {
      guestResponse.cookies.getAll().forEach((c) => response.cookies.set(c));
    }
    return response;
  } catch (error) {
    console.error("[API] Error regenerating tile:", error);
    return NextResponse.json(
      {
        error: "Failed to regenerate tile",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
