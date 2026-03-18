import { NextRequest, NextResponse } from "next/server";
import { getAuthAndAuthorize } from "@/lib/auth/authorize";
import { checkLimit, incrementUsage } from "@/lib/saas/usage-service";
import { audit } from "@/lib/audit/logger";
import OpenAI from "openai";

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: NextRequest) {
    try {
        const { prompt, previousContent, bookContext, instruction, workspaceId, language } = await req.json();

        if (!workspaceId) {
            return NextResponse.json({ error: "workspaceId is required" }, { status: 400 });
        }

        const authResult = await getAuthAndAuthorize(workspaceId);
        const userId = authResult.userId;

        if (!userId || !authResult.authorized) {
            return NextResponse.json({ error: authResult.error || "Unauthorized" }, { status: 401 });
        }

        // Checking usage credits
        const limitCheck = await checkLimit(userId, "bookGenerationsCount");
        if (!limitCheck.allowed) {
            await audit.rateLimitExceeded(
                userId,
                "bookGenerationsCount",
                req as any
            );
            return NextResponse.json(
                { error: limitCheck.reason, code: "credit_limit_exceeded" },
                { status: 402 }
            );
        }

        // const { prompt, previousContent, bookContext, instruction } = await req.json(); // Moved up

        const systemPrompt = `You are a professional Romance Novelist and Master Ghostwriter for 'Love Writers'.
The entire book MUST be written in ${language || process.env.NEXT_PUBLIC_AI_RESPONSE_LANGUAGE || 'English'}.
You are tasked with transforming the information, memories, and details provided by a real couple into a narrative that reads like a short, heartfelt romance story. The story must stay faithful to the real events and experiences shared by them.

WRITING STYLE:
- Write using simple, natural language and common words. The prose should be warm, sincere, and easy to read, as if someone is gently telling a true love story.
- Describe moments with small, meaningful details that help the reader imagine the place, the situation, and the emotions involved.
- Let feelings appear naturally through actions, memories, conversations, and situations rather than exaggerated descriptions.

NARRATIVE PROGRESSION & CONTINUITY:
- ALWAYS check the 'Previous Book Content' provided. Do NOT repeat scenes, dialogues, or specific introductions that have already occurred.
- If a character has already met another, do NOT write a new 'first meeting'.
- Focus on ADVANCING the story. Each new segment must build upon what was previously written.
- Ensure the tone and character personalities remain consistent with the earlier parts of the book.

GRAMMAR & FORMATTING RULES:
1. PARAGRAPHS & LINE BREAKS:
   - Use double newlines (\\n\\n) for a new paragraph (change of idea or new speaker).
   - Use single newline (\\n) only for structural continuation within the same block (rare in prose).
2. DIALOGUE (EM DASH STYLE):
   - START OF SPEECH: Always start dialogue with an em dash (—) and a capital letter. Example: — Where are you?
   - NEW SPEAKER: Always start a new paragraph (\\n\\n) for a new speaker.
   - SPEECH VERBS (said, asked, replied):
     - CASE A (Speech + Verb): — I am tired — said John. (DO NOT use a period before the verb; use em dash + verb in lowercase).
     - CASE B (Verb in the middle): — I am — said John — tired. (Separate with em dashes; continuation in lowercase).
     - CASE C (Verb before speech): John said:\\n— I am tired. (Use colon before speech).
   - PUNCTUATION: '?' and '!' remain inside the speech.
   - NO QUOTES: Never mix quotes and em dashes. Correct: — Hi. Wrong: — "Hi".
3. THOUGHTS:
   - Treat thoughts as normal sentences (narration) or use indirect speech. DO NOT use em dashes for thoughts.
4. CAPITALIZATION & SPACING:
   - Capital letter after em dash if starting a sentence.
   - Lowercase after speech verb if continuing.
   - Capital after colon if a full sentence follows.
   - NO spaces before comma or period.
   - ALWAYS use a space after punctuation marks.

Formatting Rules:
- STRICTLY ENGLISH only. No other languages.
- Output PLAIN TEXT ONLY. Do NOT use ANY HTML tags.
- TITLES: Use poetic headers wrapped in markers: [TITLE] Poetic Title Here [END_TITLE].
- TITLES SPACING: Ensure there is a blank line above and below the title block.
- TONE: Emotional, heartfelt, warm, and authentic.
- Only output the direct continuation, no AI chatter.
`;

        const userPrompt = `
=== Context Book Info ===
${bookContext || "No additional context."}

=== Existing Timeline & Previous Book Content up to this point ===
${previousContent || "This is the very beginning of the book."}

=== Generate Next Segment ===
Based on the timeline above, here is your primary task:
Arc/Action Goal: ${prompt}
Specific Edit Instructions (if any): ${instruction || "None. Continue the narrative naturally."}
`;

        // Charge usage BEFORE streaming (fail fast)
        await incrementUsage(userId, "bookGenerationsCount", 1);
        await audit.apiError(
            `[BookGeneration] SSE Start`,
            new Error(`Creating book portion for ${workspaceId}`),
            userId,
            req as any
        ); // Misusing apiError somewhat to log an audit trail, but ideally should be audit.log()

        // Create OpenAI stream
        const response = await openai.chat.completions.create({
            model: "gpt-4o-mini", // Can be configurable via settings
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: userPrompt }
            ],
            stream: true,
            max_tokens: 1500, // Long response
            temperature: 0.7,
        });

        // Create a ReadableStream
        const stream = new ReadableStream({
            async start(controller) {
                try {
                    for await (const chunk of response) {
                        const content = chunk.choices[0]?.delta?.content || "";
                        if (content) {
                            const encoder = new TextEncoder();
                            // Server-Sent Events format must be "data: <content>\n\n"
                            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text: content })}\n\n`));
                        }
                    }
                    // End of stream event
                    controller.enqueue(new TextEncoder().encode(`data: [DONE]\n\n`));
                    controller.close();
                } catch (err) {
                    controller.error(err);
                }
            },
        });

        // Return the response as text/event-stream
        return new Response(stream, {
            headers: {
                "Content-Type": "text/event-stream",
                "Cache-Control": "no-cache",
                "Connection": "keep-alive",
            },
        });
    } catch (error) {
        if (error instanceof Error && error.message === "Unauthorized") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        console.error("[POST /api/generate/book-stream] Error:", error);
        await audit.apiError(
            "[POST /api/generate/book-stream]",
            error instanceof Error ? error : new Error("Internal Server Error"),
            null,
            req as any
        );
        return NextResponse.json(
            { error: "Failed to generate book stream" },
            { status: 500 }
        );
    }
}
