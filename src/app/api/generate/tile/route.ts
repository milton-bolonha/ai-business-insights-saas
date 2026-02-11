import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import OpenAI from "openai";
import { checkRateLimitMiddleware } from "@/lib/middleware/rate-limit";

// Standard runtime
export const runtime = "nodejs";

const tileRequestSchema = z.object({
  prompt: z.string().min(2),
  title: z.string().min(1),
  model: z.string().min(2).optional(),
  maxTokens: z.number().int().positive().optional(),
  temperature: z.number().min(0).max(2).optional(),
  // For context, we can accept previous content or other variables
  // But tile-generation usually constructs the full prompt beforehand
  // In our case, the client will construct the FULL prompt with injected context
});

const DEFAULT_MAX_OUTPUT_TOKENS = 4000;

export async function POST(request: NextRequest) {
  // 1. Rate Limit
  const rate = await checkRateLimitMiddleware(request, "/api/generate/tile");
  if (!rate.allowed && rate.response) return rate.response;

  // 2. Auth (Session) - skipping for now as Guest mode is priority, but we should secure it
  // In a real app, we'd verify the session or some token

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
          content: `You are an expert ${title}. Provide high-quality, actionable content.`, // Simplified system prompt
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
