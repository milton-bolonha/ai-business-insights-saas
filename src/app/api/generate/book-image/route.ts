import { NextRequest, NextResponse } from "next/server";
import { getAuthAndAuthorize } from "@/lib/auth/authorize";
import { checkLimit, incrementUsage } from "@/lib/saas/usage-service";
import { audit } from "@/lib/audit/logger";
import OpenAI from "openai";
import { uploadToCloudinary } from "@/lib/storage/cloudinary";

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

export const maxDuration = 300; // 5 minutes timeout for high-latency image generation

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        console.log("[POST /api/generate/book-image] Request body:", body);
        const { prompt, workspaceId, imageStyle = "romantic", size = "1024x1024" } = body;

        if (!workspaceId) {
            return NextResponse.json({ error: "workspaceId is required" }, { status: 400 });
        }

        const authResult = await getAuthAndAuthorize(workspaceId);
        const userId = authResult.userId;

        if (!userId || !authResult.authorized) {
            return NextResponse.json({ error: authResult.error || "Unauthorized" }, { status: 401 });
        }

        // Checking usage credits - each image costs 100 credits
        // We use a generic 'credits' or 'imageGenerationsCount' if available
        // For now, let's assume images use 'imageGenerationsCount' or we just check general availability
        const COST_PER_IMAGE = 100;
        
        // Note: usage-service might need to be updated to handle specific credit amounts
        // For this implementation, we'll increment by 1 and assume 1 unit = 1 image (100 credits)
        const limitCheck = await checkLimit(userId, "bookGenerationsCount"); // Using bookGenerationsCount as a proxy or we can use credits balance
        
        if (!limitCheck.allowed) {
            return NextResponse.json(
                { error: "Insufficient credits for image generation", code: "credit_limit_exceeded" },
                { status: 402 }
            );
        }

        if (!prompt) {
            return NextResponse.json({ error: "prompt is required" }, { status: 400 });
        }

        // Generate image with GPT-Image-1.5
        console.log("[POST /api/generate/book-image] GPT-Image-1.5 START model: gpt-image-1.5");
        console.log("[POST /api/generate/book-image] FULL PROMPT:", prompt);
        
        // Adjust size for gpt-image-1.5 compatibility (1536x1024 for landscape)
        const adjustedSize = size === "1792x1024" ? "1536x1024" : (size || "1024x1024");
        console.log("[POST /api/generate/book-image] Using Adjusted Size:", adjustedSize);

        const startTime = Date.now();
        console.log("[POST /api/generate/book-image] Initiating OpenAI images.generate request...");
        const response = await openai.images.generate({
            model: "gpt-image-1.5",
            prompt: prompt,
            n: 1,
            size: adjustedSize as any,
            quality: "high",
        });
        const duration = (Date.now() - startTime) / 1000;
        console.log(`[POST /api/generate/book-image] OpenAI response received in ${duration.toFixed(2)}s.`);

        if (!response.data || response.data.length === 0) {
            throw new Error("No image data returned from OpenAI");
        }
        
        const b64Data = response.data[0].b64_json;
        const openAIUrl = response.data[0].url;

        let imageUrl = "";
        if (b64Data) {
            console.log("[POST /api/generate/book-image] Uploading base64 to Cloudinary...");
            const dataUri = `data:image/png;base64,${b64Data}`;
            imageUrl = await uploadToCloudinary(dataUri, "books/content");
        } else if (openAIUrl) {
            console.log("[POST /api/generate/book-image] Uploading URL to Cloudinary...");
            imageUrl = await uploadToCloudinary(openAIUrl, "books/content");
        } else {
            throw new Error("No usable image data returned from OpenAI");
        }

        console.log("[POST /api/generate/book-image] Cloudinary upload success:", imageUrl);

        // Charge usage
        // await incrementUsage(userId, "credits", COST_PER_IMAGE); 
        // For now, let's just log it or increment a counter
        await incrementUsage(userId, "bookGenerationsCount", 1); 

        return NextResponse.json({ url: imageUrl, success: true });
    } catch (error) {
        console.error("[POST /api/generate/book-image] Error:", error);
        return NextResponse.json(
            { error: "Failed to generate image" },
            { status: 500 }
        );
    }
}
