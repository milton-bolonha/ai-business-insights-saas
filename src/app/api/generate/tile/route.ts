import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import OpenAI from "openai";
import { getAuth } from "@/lib/auth/get-auth";
import { checkLimit, incrementUsage } from "@/lib/saas/usage-service";

// Standard runtime
export const runtime = "nodejs";

const tileRequestSchema = z.object({
  prompt: z.string().min(2),
  title: z.string().min(1),
  model: z.string().min(2).optional(),
  maxTokens: z.number().int().positive().optional(),
  temperature: z.number().min(0).max(2).optional(),
  workspaceId: z.string().optional(), // for authorization context
});

const DEFAULT_MAX_OUTPUT_TOKENS = 4000;

export async function POST(request: NextRequest) {
  try {
    const payload = await request.json().catch(() => null);
    const parseResult = tileRequestSchema.safeParse(payload);

    if (!parseResult.success) {
      return NextResponse.json(
        { error: "Invalid payload", details: parseResult.error.flatten() },
        { status: 400 }
      );
    }

    const { prompt, title, model, maxTokens, temperature } = parseResult.data;

    // Auth: get userId (null for guests)
    const { userId } = await getAuth();

    // For members: check and enforce credit limits before generating
    if (userId) {
      const limitCheck = await checkLimit(userId, "tilesCount");
      if (!limitCheck.allowed) {
        return NextResponse.json(
          {
            error: limitCheck.reason || "Credit limit reached. Please upgrade your plan.",
            code: "credit_limit_exceeded",
          },
          { status: 402 }
        );
      }
    }

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: "OPENAI_API_KEY is not configured" },
        { status: 500 }
      );
    }

    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    const response = await openai.chat.completions.create({
      model: model || "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `You are an expert ${title}. Provide high-quality, actionable content.`,
        },
        { role: "user", content: prompt },
      ],
      max_tokens: maxTokens || DEFAULT_MAX_OUTPUT_TOKENS,
      temperature: temperature || 0.7,
    });

    const choice = response.choices[0];
    const content = choice?.message?.content || "";
    // @ts-ignore - OpenAI types can sometimes mismatch on usage
    const usage = response.usage || {
      total_tokens: 0,
      prompt_tokens: 0,
      completion_tokens: 0,
    };

    // Deduct credits for member usage AFTER successful generation
    if (userId) {
      await incrementUsage(userId, "tilesCount", 1);
      if (usage.total_tokens > 0) {
        await incrementUsage(userId, "tokensUsed", usage.total_tokens);
      }
      console.log(`[api/generate/tile] ✅ Charged 5 credits (tilesCount) to user ${userId}. Tokens: ${usage.total_tokens}`);
    }

    return NextResponse.json({
      success: true,
      content,
      usage,
    });
  } catch (error) {
    console.error("[api/generate/tile] ❌ Error generating tile", error);
    return NextResponse.json(
      { error: "Failed to generate tile content" },
      { status: 500 }
    );
  }
}
