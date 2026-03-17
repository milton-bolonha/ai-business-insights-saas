import { NextRequest } from "next/server";
import { z } from "zod";
import OpenAI from "openai";
import { getAuth } from "@/lib/auth/get-auth";
import { checkLimit, incrementUsage } from "@/lib/saas/usage-service";

export const runtime = "nodejs";

const tileStreamSchema = z.object({
  prompt: z.string().min(2),
  title: z.string().min(1),
  model: z.string().min(2).optional(),
  maxTokens: z.number().int().positive().optional(),
  temperature: z.number().min(0).max(2).optional(),
});

const DEFAULT_MAX_OUTPUT_TOKENS = 4000;

/**
 * SSE streaming endpoint for tile generation.
 * Streams content chunks so the client can show progress in real-time.
 */
export async function POST(request: NextRequest) {
  try {
    const payload = await request.json().catch(() => null);
    const parseResult = tileStreamSchema.safeParse(payload);

    if (!parseResult.success) {
      return new Response(
        JSON.stringify({ error: "Invalid payload", details: parseResult.error.flatten() }),
        { status: 400 }
      );
    }

    const { prompt, title, model, maxTokens, temperature } = parseResult.data;

    const { userId } = await getAuth();

    if (userId) {
      const limitCheck = await checkLimit(userId, "tilesCount");
      if (!limitCheck.allowed) {
        return new Response(
          JSON.stringify({
            error: limitCheck.reason || "Credit limit reached",
            code: "credit_limit_exceeded",
          }),
          { status: 402 }
        );
      }
    }

    if (!process.env.OPENAI_API_KEY) {
      return new Response(
        JSON.stringify({ error: "OPENAI_API_KEY is not configured" }),
        { status: 500 }
      );
    }

    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    const stream = await openai.chat.completions.create({
      model: model || "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `You are an expert ${title}. Provide high-quality, actionable content.`,
        },
        { role: "user", content: prompt },
      ],
      max_tokens: maxTokens || DEFAULT_MAX_OUTPUT_TOKENS,
      temperature: temperature ?? 0.7,
      stream: true,
    });

    let fullContent = "";

    const encoder = new TextEncoder();
    const readable = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of stream) {
            const content = chunk.choices[0]?.delta?.content || "";
            if (content) {
              fullContent += content;
              controller.enqueue(
                encoder.encode(`data: ${JSON.stringify({ text: content })}\n\n`)
              );
            }
          }
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ done: true })}\n\n`));
        } catch (err) {
          controller.error(err);
        } finally {
          if (userId) {
            await incrementUsage(userId, "tilesCount", 1);
            if (fullContent.length > 0) {
              const estimatedTokens = Math.ceil(fullContent.length / 4);
              await incrementUsage(userId, "tokensUsed", estimatedTokens);
            }
          }
          controller.close();
        }
      },
    });

    return new Response(readable, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    console.error("[api/generate/tile-stream] Error:", error);
    return new Response(
      JSON.stringify({ error: "Failed to generate tile content" }),
      { status: 500 }
    );
  }
}
