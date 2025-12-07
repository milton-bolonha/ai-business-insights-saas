import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { z } from "zod";
import OpenAI from "openai";

// Runtime: Node.js (required for MongoDB and file system operations)
export const runtime = "nodejs";

import {
  getGuestTemplate,
  getPromptAgent,
  processPromptVariables,
  resolveTemplateTiles,
  type PromptAgentId,
  type PromptVariableId,
} from "@/lib/guest-templates";
import type { Tile, WorkspaceSnapshot } from "@/lib/types";
import { DEFAULT_MAX_OUTPUT_TOKENS, resolveModel } from "@/lib/ai/settings";
import { generateTileContent } from "@/lib/ai/tile-generation";
import { writeWorkspace } from "@/lib/cookies-store";
import { getAuth } from "@/lib/auth/get-auth";
import { checkRateLimitMiddleware } from "@/lib/middleware/rate-limit";

const requestSchema = z.object({
  salesRepCompany: z.string().min(2),
  salesRepWebsite: z.string().url(),
  solution: z.string().min(2),
  targetCompany: z.string().min(2),
  targetWebsite: z.string().url(),
  templateId: z.string().min(2).optional(),
  model: z.string().min(2).optional(),
  promptAgent: z.string().min(2).optional(),
  responseLength: z.enum(["short", "medium", "long"]).optional(),
  promptVariables: z.array(z.string().min(1)).max(16).optional(),
  bulkPrompts: z.array(z.string().min(2)).max(200).optional(),
});

export async function POST(request: NextRequest) {
  const rate = await checkRateLimitMiddleware(request, "/api/generate");
  if (!rate.allowed && rate.response) return rate.response;

  const payload = await request.json().catch(() => null);

  const parseResult = requestSchema.safeParse(payload);
  if (!parseResult.success) {
    return NextResponse.json(
      { error: "Invalid payload", details: parseResult.error.flatten() },
      { status: 400 }
    );
  }

  const {
    salesRepCompany,
    salesRepWebsite,
    solution,
    targetCompany,
    targetWebsite,
    templateId = "template_1",
    model: requestedModel,
    promptAgent: requestedPromptAgent,
    responseLength,
    promptVariables: rawPromptVariables = [],
    bulkPrompts = [],
  } = parseResult.data;

  const agentDefinition = getPromptAgent(
    requestedPromptAgent as PromptAgentId | undefined
  );
  const agentId = agentDefinition.id as PromptAgentId;
  const normalizedPromptVariables = rawPromptVariables.filter(
    (value): value is PromptVariableId => true // Simplified validation
  );
  const model = resolveModel(requestedModel ?? agentDefinition.defaultModel);

  try {
    const template = getGuestTemplate(templateId);
    const normalizedContext = {
      salesRepAt: salesRepCompany,
      salesRepCompany,
      salesRepCompanyWebsite: salesRepWebsite.trim(),
      sellingSolutionsFor: solution,
      target: targetCompany,
      targetWebsite: targetWebsite.trim(),
      name: targetCompany,
      website: targetWebsite.trim(),
      promptAgent: agentId,
      responseLength: responseLength ?? "medium",
      promptVariables:
        normalizedPromptVariables.length > 0
          ? normalizedPromptVariables.join(", ")
          : undefined,
      bulkPrompts:
        bulkPrompts.length > 0 ? bulkPrompts.join(" || ") : undefined,
      model,
      company: {
        name: targetCompany,
        website: targetWebsite.trim(),
      },
    };

    const resolvedTiles = resolveTemplateTiles(template, {
      templateId,
      agentId,
      responseLength,
      promptVariables: normalizedPromptVariables,
      bulkPrompts,
    });

    const prompts = resolvedTiles.map((item) => {
      const runtimeContext = {
        ...normalizedContext,
        tile: {
          id: item.id,
          title: item.title,
          category: item.category,
          agentId: item.agentId,
          responseLength: item.preferredLength,
          variables: item.runtimeVariables,
        },
      };

      return {
        ...item,
        prompt: processPromptVariables(item.prompt, runtimeContext),
        templateTileId: item.templateTileId ?? item.id,
      };
    });

    const { userId } = await getAuth();

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: "OPENAI_API_KEY is not configured" },
        { status: 500 }
      );
    }

    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    const tilePromises = prompts.map(async (item, orderIndex) => {
      const generation = await generateTileContent({
        client: openai,
        prompt: item.prompt,
        title: item.title,
        orderIndex,
        model: model || "gpt-4o-mini",
        templateId,
        templateTileId: item.templateTileId ?? item.id,
        category: item.category,
        maxTokens: DEFAULT_MAX_OUTPUT_TOKENS,
      });

      return {
        id: `tile_${randomUUID()}`,
        title: item.title,
        content: generation.content,
        prompt: item.prompt,
        templateId,
        templateTileId: item.templateTileId,
        category: item.category,
        model: generation.model,
        orderIndex,
        createdAt: generation.createdAt,
        updatedAt: generation.updatedAt,
        totalTokens: generation.totalTokens,
        attempts: generation.attempts,
        history: generation.history,
        agentId: item.agentId,
        responseLength: item.preferredLength,
        promptVariables: item.runtimeVariables,
      };
    });

    const tiles = await Promise.all(tilePromises);

    if (userId) {
      const { checkLimit } = await import("@/lib/saas/usage-service");
      const limit = await checkLimit(userId, "companiesCount");
      if (!limit.allowed) {
        return NextResponse.json(
          {
            error:
              limit.reason ??
              "Workspace limit reached. Upgrade your plan to create more workspaces.",
          },
          { status: 429 }
        );
      }
    }

    const workspace: WorkspaceSnapshot = {
      sessionId: `session_${randomUUID()}`,
      name: targetCompany,
      website: targetWebsite,
      salesRepCompany,
      salesRepWebsite,
      generatedAt: new Date().toISOString(),
      tilesToGenerate: tiles.length,
      tiles, // ✅ Tiles serão transferidos para o dashboard padrão pelo getOrCreateWorkspaceFromWorkspaceSnapshot
      appearance: {
        baseColor: process.env.NEXT_PUBLIC_ADE_BASE_COLOR ?? "#f5f5f0",
      },
      promptSettings: {
        templateId,
        model,
        promptAgent: agentId,
        responseLength,
        promptVariables: normalizedPromptVariables,
        bulkPrompts,
        target: targetCompany,
        sellingSolutionsFor: solution,
        targetWebsite: targetWebsite.trim(),
      },
    };

    const sessionId = await writeWorkspace(workspace);

    // Security: Only save to MongoDB if user is authenticated (member, not guest)
    // Audit log
    const { audit } = await import("@/lib/audit/logger");
    await audit.createWorkspace(workspace.sessionId, userId, request);

    if (userId) {
      // Member: Save to MongoDB (non-blocking)
      try {
        const { migrateWorkspaceToMongo } = await import(
          "@/lib/db/migration-helpers"
        );
        await migrateWorkspaceToMongo(workspace, userId);

        // Increment workspace count (stored as companiesCount in usage-service for legacy compatibility)
        const { incrementUsage } = await import("@/lib/saas/usage-service");
        await incrementUsage(userId, "companiesCount", 1);

        console.log(
          "[api/generate] ✅ Workspace também salvo no MongoDB (member)"
        );
      } catch (mongoError) {
        // Log but don't fail the request if MongoDB is unavailable
        const errorMessage =
          mongoError instanceof Error ? mongoError.message : String(mongoError);
        console.warn(
          "[api/generate] ⚠️ Falha ao salvar no MongoDB (não crítico):",
          errorMessage
        );
      }
    } else {
      // Guest: Only localStorage, never MongoDB
      console.log(
        "[api/generate] ℹ️ Guest mode: Workspace salvo apenas em localStorage (não MongoDB)"
      );
    }

    return NextResponse.json({
      success: true,
      tilesGenerated: tiles.length,
      sessionId,
      workspace,
    });
  } catch (error) {
    console.error("[api/generate] ❌ Unexpected error", error);
    return NextResponse.json(
      { error: "Unexpected error while generating insights" },
      { status: 500 }
    );
  }
}
