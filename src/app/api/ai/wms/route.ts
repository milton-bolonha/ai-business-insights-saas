import { NextRequest, NextResponse } from "next/server";
import { getAuth } from "@/lib/auth/get-auth";
import { checkLimit, incrementUsage } from "@/lib/saas/usage-service";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || "dummy-key-for-build",
});

export async function POST(req: NextRequest) {
  try {
    const { userId } = await getAuth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check Credits
    const canPerform = await checkLimit(userId, "wmsAiAssistant");
    if (!canPerform) {
      return NextResponse.json({ 
        error: "Insufficient credits", 
        message: "Você atingiu seu limite de uso do assistente AI. Adquira mais créditos para continuar." 
      }, { status: 403 });
    }

    const { prompt, input } = await req.json();

    const messages: any[] = [
      { role: "system", content: prompt },
      { role: "user", content: input }
    ];

    const completion = await openai.chat.completions.create({
      model: "gpt-4o", // Using gpt-4o for complex WMS logic
      messages,
      response_format: { type: "json_object" }
    });

    const result = completion.choices[0].message.content;
    const parsedResult = JSON.parse(result || "{}");

    // Consume credits
    await incrementUsage(userId, "wmsAiAssistant", 1);

    return NextResponse.json(parsedResult);
  } catch (error: any) {
    console.error("[WMS AI] Error:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
