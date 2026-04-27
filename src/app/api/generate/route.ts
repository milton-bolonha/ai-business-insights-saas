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
import type { TradeRankingInput } from "@/lib/services/trade-ranking-service";

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
  promptVariables: z.array(z.string().min(1)).max(100).optional(),
  bulkPrompts: z.array(z.string().min(2)).max(200).optional(),
});

function extractJsonFromMarkdown(text: string): any | null {
  try {
    const match = text.match(/```json\n?([\s\S]*?)\n?```/);
    if (match && match[1]) {
      return JSON.parse(match[1].trim());
    }
    const firstBrace = text.indexOf("{");
    const lastBrace = text.lastIndexOf("}");
    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
      const maybeJson = text.substring(firstBrace, lastBrace + 1);
      return JSON.parse(maybeJson);
    }
  } catch (e) {
    return null;
  }
  return null;
}

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
    // Parse promptVariables (["key: value"]) into an object for the context
    const parsedVariables: Record<string, string> = {};
    if (normalizedPromptVariables.length > 0) {
      normalizedPromptVariables.forEach((item) => {
        const [key, ...valueParts] = item.split(":");
        if (key && valueParts.length > 0) {
          const value = valueParts.join(":").trim(); // Rejoin in case value contained colons
          parsedVariables[key.trim()] = value;
        }
      });
    }

    const normalizedContext = {
      ...parsedVariables, // Add parsed variables to context
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

    // 🔒 Guest Security Check (Server-Side)
    let guestLimitData: import("@/lib/middleware/guest-limit").GuestLimitResult | null = null;

    if (!userId) {
      const { checkGuestLimit } = await import("@/lib/middleware/guest-limit");
      const { SAFE_DEFAULT_GUEST } = await import("@/lib/saas/usage-service");

      // Calculate requested amount strictly (e.g. tiles.length isn't known yet, but template implies it)
      // For now we check "Access" (1 unit). Real increment happens later.
      // Better: Check if user has AT LEAST 1 slot remaining.
      guestLimitData = await checkGuestLimit(
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
        // Ensure creation of guest identity cookie even on error
        if (guestLimitData.response) {
          guestLimitData.response.cookies.getAll().forEach((c) => errorRes.cookies.set(c));
        }
        return errorRes;
      }
    }

    const isTradeRanking = templateId === "template_trade_ranking";

    if (!process.env.OPENAI_API_KEY && !isTradeRanking) {
      return NextResponse.json(
        { error: "OPENAI_API_KEY is not configured" },
        { status: 500 }
      );
    }

    const openai = process.env.OPENAI_API_KEY 
      ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
      : null;

    let tiles: any[] = [];

    if (isTradeRanking) {
      // Local Algorithm First
      const { calculateTradeRanking } = await import("@/lib/services/trade-ranking-service");
      
      const tradeInput: TradeRankingInput = {
        produto: {
          categoria: parsedVariables.product_category || "General",
          estado: (parsedVariables.product_condition?.toLowerCase() || "usado") as any,
          catDeprec: (parsedVariables.catDeprec?.toLowerCase() || "generico") as any,
          idade_anos: Number(parsedVariables.product_age || 0),
          funcionamento: Number(parsedVariables.product_working || 1),
          custo_reparo: Number(parsedVariables.product_repair_cost || 0),
        },
        mercado: {
          valor_novo: Number(parsedVariables.market_value_new || 0),
          media_usado: Number(parsedVariables.market_value_used_avg || 0),
          demanda: Number(parsedVariables.market_demand || 0.5),
          oferta: Number(parsedVariables.market_supply || 0.5),
          tempo_medio_venda_dias: Number(parsedVariables.market_time_to_sell || 7),
          mes: Number(parsedVariables.mes || new Date().getMonth()),
        },
        trader: {
          modo: (parsedVariables.trader_mode?.toLowerCase() || "margem") as any,
          tolerancia_risco: Number(parsedVariables.trader_risk || 0.5),
          pressao_caixa: Number(parsedVariables.trader_cash_pressure || 0),
          taxaAltern: Number(parsedVariables.taxaAltern || 1.5),
        },
        dominancia: {
          market_share: Number(parsedVariables.market_share || 0),
          poder_preco: Number(parsedVariables.market_pricing_power || 0),
          concorrencia: Number(parsedVariables.market_competition || 1),
        }
      };

      // 🟢 Fix: Enrich mercado object AFTER tradeInput is initialized to avoid ReferenceError
      if (parsedVariables.market_ml_used_median) {
        tradeInput.mercado = {
          ...tradeInput.mercado,
          marketStats: {
            used: {
              median: Number(parsedVariables.market_ml_used_median),
              p10: Number(parsedVariables.market_ml_used_p10 || 0),
              p90: Number(parsedVariables.market_ml_used_p90 || 0),
              count: Number(parsedVariables.market_ml_used_count || 0),
            },
            new: {
              median: Number(parsedVariables.market_ml_new_median || 0),
              p10: 0,
              p90: 0,
              count: 0,
            },
            confidence: Number(parsedVariables.market_ml_confidence || 0),
          }
        };
      }

      const ranking = calculateTradeRanking(tradeInput);

      // Create tiles with the calculated results
      tiles = prompts.map((item, index) => {
        let content = "";
        if (item.id === "trade_valuation") {
          content = `## Ranking Score: ${ranking.nota}\n\n**VMR:** R$ ${ranking.valor_mercado}\n**Ideal Buy:** R$ ${ranking.compra_ideal}\n\n${ranking.insights.algorithmic}`;
        } else if (item.id === "exit_strategy") {
          content = `**Anchor Price:** R$ ${ranking.preco_ancora}\n**Target Sale:** R$ ${ranking.preco_real}\n**Quick Sale:** R$ ${ranking.preco_giro}\n\nEstratégia: ${ranking.estrategia}`;
        } else {
          content = `**Risk:** ${ranking.insights.risk_level.toUpperCase()}\n**Liquidity Score:** ${ranking.liquidez_score.toFixed(2)}`;
        }

        return {
          id: `tile_${randomUUID()}`,
          title: item.title,
          content,
          prompt: item.prompt,
          templateId,
          templateTileId: item.templateTileId,
          category: item.category,
          model: "local-algorithm",
          orderIndex: index,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          totalTokens: 0,
          attempts: 1,
          history: [],
          agentId: item.agentId,
          responseLength: item.preferredLength,
          promptVariables: item.runtimeVariables,
        };
      });

      // Special: Add a metadata prompt variable to store the JSON ranking
      (normalizedPromptVariables as any).push(`ranking_data:${JSON.stringify(ranking)}`);
    }
    else if (template.generationMode === "sequential") {
      let previousArcContent = "";

      for (const [index, item] of prompts.entries()) {
        // Robust variable replacement (handles {user_name}, {partner_name}, {meeting_story}, and {previous_arc})
        const variableMap: Record<string, string> = {
          "{previous_arc}": previousArcContent || "This is the beginning of the story.",
        };
        Object.entries(parsedVariables).forEach(([key, value]) => {
          variableMap[`{${key}}`] = value;
        });

        let contextualizedPrompt = item.prompt;
        Object.entries(variableMap).forEach(([placeholder, value]) => {
          contextualizedPrompt = contextualizedPrompt.replaceAll(placeholder, value);
        });

        let content = "";
        let generation: any = { model, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), totalTokens: 0, attempts: 1, history: [] };

        // For sequential projects (like Books), only generate the FIRST tile in the main API call
        // to avoid timeouts. The UI Administrating loop will handle the rest.
        if (index === 0 && openai) {
          const gen = await generateTileContent({
            client: openai,
            prompt: contextualizedPrompt,
            title: item.title,
            orderIndex: index,
            model: model || "gpt-4o-mini",
            templateId,
            templateTileId: item.templateTileId ?? item.id,
            category: item.category,
            maxTokens: DEFAULT_MAX_OUTPUT_TOKENS,
          });
          content = gen.content;
          generation = gen;
          previousArcContent = content;
        }

        const tile = {
          id: `tile_${randomUUID()}`,
          title: item.title,
          content: content,
          prompt: contextualizedPrompt,
          templateId,
          templateTileId: item.templateTileId,
          category: item.category,
          model: generation.model,
          orderIndex: index,
          createdAt: generation.createdAt,
          updatedAt: generation.updatedAt,
          totalTokens: generation.totalTokens,
          attempts: generation.attempts,
          history: generation.history,
          agentId: item.agentId,
          responseLength: item.preferredLength,
          promptVariables: item.runtimeVariables,
          metadata: extractJsonFromMarkdown(content) || undefined,
        };

        tiles.push(tile);
      }
    }
   else {
      // Parallel Generation (Default)
      const tilePromises = prompts.map(async (item, orderIndex) => {
        if (!openai) {
           return {
              id: `tile_${randomUUID()}`,
              title: item.title,
              content: "AI Insights unavailable (No credits). Local metrics are still available.",
              prompt: item.prompt,
              templateId,
              templateTileId: item.templateTileId,
              category: item.category,
              model: "offline",
              orderIndex,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
              totalTokens: 0,
              attempts: 1,
              history: []
           };
        }

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
          metadata: extractJsonFromMarkdown(generation.content) || undefined,
        };
      });

      tiles = await Promise.all(tilePromises);
    }

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
        baseColor: process.env.NEXT_PUBLIC_ADE_BASE_COLOR ?? "#f7f7f7",
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

    console.log(`[api/generate] Auth status: userId=${userId ?? 'null (guest mode - MongoDB save will be skipped)'}`);

    if (userId) {
      // Member: Save to MongoDB (non-blocking)
      try {
        const { migrateWorkspaceToMongo } = await import(
          "@/lib/db/migration-helpers"
        );
        console.log(`[api/generate] Saving workspace ${workspace.sessionId} to MongoDB for user ${userId}...`);
        await migrateWorkspaceToMongo(workspace, userId);

        // Increment workspace count (stored as companiesCount in usage-service for legacy compatibility)
        const { incrementUsage } = await import("@/lib/saas/usage-service");
        await incrementUsage(userId, "companiesCount", 1);
        await incrementUsage(userId, "tilesCount", tiles.length);

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

      // Increment Guest Usage (Server-Side)
      if (guestLimitData?.guestId) {
        const { incrementGuestUsage } = await import("@/lib/middleware/guest-limit");
        const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
        await incrementGuestUsage(guestLimitData.guestId, ip, "tiles", tiles.length);
      }
    }

    const response = NextResponse.json({
      success: true,
      tilesGenerated: tiles.length,
      sessionId,
      workspace,
    });

    // Ensure guest cookie is set if it was created/updated during check
    if (guestLimitData?.response) {
      guestLimitData.response.cookies.getAll().forEach((c) => response.cookies.set(c));
    }

    return response;
  } catch (error) {
    console.error("[api/generate] ❌ Unexpected error", error);
    return NextResponse.json(
      { error: "Unexpected error while generating insights" },
      { status: 500 }
    );
  }
}
