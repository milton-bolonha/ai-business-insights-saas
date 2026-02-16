import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { z } from "zod";

import { resolveWorkspaceName } from "@/lib/workspace-resolver";
import { resolveModel } from "@/lib/ai/settings";
import type { Tile } from "@/lib/types";
import { generateTileContent } from "@/lib/ai/tile-generation";
import OpenAI from "openai";
import { getAuth } from "@/lib/auth/get-auth";
import { audit } from "@/lib/audit/logger";

// Runtime: Node.js (required for file system and potential MongoDB)
export const runtime = 'nodejs';

const createTileSchema = z.object({
  title: z.string().min(1, "Title is required"),
  prompt: z.string().min(1, "Prompt is required"),
  model: z.string().optional(),
  useMaxPrompt: z.boolean().optional(),
  requestSize: z.enum(["small", "medium", "large"]).optional(),
  dashboardId: z.string().optional(),
  workspaceId: z.string().optional(),
});

function getMaxTokensForSize(size: "small" | "medium" | "large"): number {
  switch (size) {
    case "small":
      return 400;
    case "medium":
      return 800;
    case "large":
      return 1600;
    default:
      return 400;
  }
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);

  const parseResult = createTileSchema.safeParse(body);
  if (!parseResult.success) {
    return NextResponse.json(
      { error: "Invalid payload", details: parseResult.error.flatten() },
      { status: 400 }
    );
  }

  const { requestSize = "small", title, prompt, model, useMaxPrompt, dashboardId, workspaceId } =
    parseResult.data;
  const maxTokens = getMaxTokensForSize(requestSize);

  const { userId } = await getAuth();
  if (userId) {
    const { checkLimit } = await import("@/lib/saas/usage-service");
    const limit = await checkLimit(userId, "tilesCount"); // Check tile count specifically
    if (!limit.allowed) {
      return NextResponse.json(
        {
          error:
            limit.reason ??
            "Tile limit reached. Upgrade your plan to generate more insights.",
        },
        { status: 429 }
      );
    }
  } else {
    // 🔒 Guest Security Check (Server-Side)
    const { checkGuestLimit } = await import("@/lib/middleware/guest-limit");
    const { SAFE_DEFAULT_GUEST } = await import("@/lib/saas/usage-service");

    // Check "tiles" limit (1 unit)
    const guestLimitData = await checkGuestLimit(
      request,
      "tiles",
      SAFE_DEFAULT_GUEST.tilesCount,
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

  if (!workspaceId) {
    return NextResponse.json({ error: "workspaceId is required" }, { status: 400 });
  }

  const workspaceInfo = await resolveWorkspaceName(workspaceId, userId);
  if (!workspaceInfo) {
    return NextResponse.json({ error: "Workspace not found" }, { status: 404 });
  }

  const selectedModel = model || (useMaxPrompt ? "gpt-5" : "gpt-5-nano");
  const resolvedModel = resolveModel(selectedModel);

  const workspaceName = workspaceInfo.name || "the workspace";
  const workspaceWebsite = workspaceInfo.website;
  const workspaceContext = workspaceWebsite
    ? `[Context: This research is about ${workspaceName} (${workspaceWebsite}). Use this information to provide accurate and relevant insights, but do not mention the workspace name or website in your response unless explicitly asked.]\n\n`
    : `[Context: This research is about ${workspaceName}. Use this information to provide accurate and relevant insights, but do not mention the workspace name in your response unless explicitly asked.]\n\n`;
  const enhancedPrompt = workspaceContext + prompt;

  try {
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: "OPENAI_API_KEY is not configured" },
        { status: 500 }
      );
    }

    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    const generationResult = await generateTileContent({
      client: openai,
      prompt: enhancedPrompt,
      title,
      templateId: "custom",
      model: resolvedModel,
      orderIndex: 0,
      maxTokens,
    });

    const newTile: Tile = {
      id: `tile_${randomUUID()}`,
      title,
      content: generationResult.content,
      prompt,
      templateId: "custom",
      category: "custom",
      model: resolvedModel,
      orderIndex: -1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      totalTokens: generationResult.totalTokens,
      attempts: generationResult.attempts,
      history: generationResult.history || [],
    };

    // Audit log
    const { userId: auditUserId } = await getAuth();
    await audit.createTile(newTile.id, dashboardId || "", auditUserId, request);

    if (userId) {
      const { incrementUsage } = await import("@/lib/saas/usage-service");
      await incrementUsage(userId, "tilesCount", 1);
    } else {
      // Increment Guest Usage
      const guestId = (request as any)._guestId;
      if (guestId) {
        const { incrementGuestUsage } = await import("@/lib/middleware/guest-limit");
        const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
        await incrementGuestUsage(guestId, ip, "tiles", 1);
      }
    }

    const response = NextResponse.json({
      success: true,
      tile: newTile,
      dashboardId,
      workspaceId,
    });

    // Set cookie if needed
    const guestResponse = (request as any)._guestLimitResponse as NextResponse | undefined;
    if (guestResponse) {
      guestResponse.cookies.getAll().forEach((c) => response.cookies.set(c));
    }

    return response;
  } catch (error) {
    console.error("[API] /api/workspace/tiles - Error generating tile:", error);
    return NextResponse.json(
      {
        error: "Failed to generate tile content",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

