import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { z } from "zod";

import { resolveWorkspaceName } from "@/lib/workspace-resolver";
import { resolveModel } from "@/lib/ai/settings";
import { generateTileContent } from "@/lib/ai/tile-generation";
import type { Tile } from "@/lib/types";
import { DEFAULT_MAX_OUTPUT_TOKENS } from "@/lib/ai/settings";
import { getAuth } from "@/lib/auth/get-auth";
import { authorizeResourceAccess } from "@/lib/auth/authorize";
import { invalidateResourceCache } from "@/lib/cache/invalidation";

// Runtime: Node.js (required for file system operations)
export const runtime = "nodejs";

const chatRequestSchema = z.object({
  message: z.string().min(1, "Message is required"),
  workspaceId: z.string().min(1, "Workspace ID is required"),
  dashboardId: z.string().min(1, "Dashboard ID is required"),
  attachments: z.array(z.record(z.string(), z.unknown())).optional(),
});

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ tileId: string }> }
) {
  const { tileId } = await params;
  const rawBody = await request.json().catch(() => null);
  const parsedBody = chatRequestSchema.safeParse(rawBody);

  if (!parsedBody.success) {
    return NextResponse.json(
      { error: "Invalid payload", details: parsedBody.error.flatten() },
      { status: 400 }
    );
  }

  const { message, workspaceId, dashboardId } = parsedBody.data;
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

    const generationResult = await generateTileContent({
      client: openai,
      prompt: message,
      title: "Chat Response",
      templateId: "custom",
      model: resolveModel("gpt-4o-mini"),
      orderIndex: 0,
      maxTokens: DEFAULT_MAX_OUTPUT_TOKENS,
    });

    const chatTile: Tile = {
      id: tileId,
      title: "Chat Response",
      content: generationResult.content,
      prompt: message,
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
    }

    return NextResponse.json({
      success: true,
      tile: chatTile,
    });
  } catch (error) {
    console.error("[API] Error in tile chat:", error);
    return NextResponse.json(
      {
        error: "Failed to generate chat response",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

