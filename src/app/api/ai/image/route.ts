import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { uploadToCloudinary } from "@/lib/storage/cloudinary";

import OpenAI from "openai";

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY || "dummy-key-for-build",
});

// Standard implementation for DALL-E image generation
export async function POST(req: NextRequest) {
  try {
    const { prompt } = await req.json();

    if (!prompt) {
      return NextResponse.json({ error: "Prompt is required" }, { status: 400 });
    }

    console.log(`[POST /api/ai/image] Requesting image for prompt: "${prompt}"`);

    const response = await openai.images.generate({
        model: "gpt-image-1.5",
        prompt: prompt,
        n: 1,
        size: "1024x1024",
        quality: "high",
    });

    if (!response.data || response.data.length === 0) {
        throw new Error("No image data returned from OpenAI");
    }

    // Attempt to use URL or fallback to b64_json
    const openAIUrl = response.data[0].url;
    const b64Data = response.data[0].b64_json;
    
    let finalImageUrl = "";
    if (b64Data) {
      const dataUri = `data:image/png;base64,${b64Data}`;
      finalImageUrl = await uploadToCloudinary(dataUri, "estampas/content");
    } else if (openAIUrl) {
      finalImageUrl = await uploadToCloudinary(openAIUrl, "estampas/content");
    }

    if (!finalImageUrl) {
      return NextResponse.json({ error: "No image URL returned from OpenAI or failed upload" }, { status: 500 });
    }

    console.log(`[POST /api/ai/image] Image successfully generated and uploaded.`);
    return NextResponse.json({ url: finalImageUrl });
  } catch (error) {
    console.error("[POST /api/ai/image] Exception:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
