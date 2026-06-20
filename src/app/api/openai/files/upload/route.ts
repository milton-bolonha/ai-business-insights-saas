import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db/mongodb";
import { openai } from "@/lib/openai/client";
import { uploadToCloudinary } from "@/lib/storage/cloudinary";
import { ObjectId } from "mongodb";

export const maxDuration = 60; // 1 minute timeout for large files

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;
    const workspaceId = formData.get("workspaceId") as string;
    const knowledgeBaseId = formData.get("knowledgeBaseId") as string;

    if (!file || !workspaceId || !knowledgeBaseId) {
      return NextResponse.json({ error: "file, workspaceId, and knowledgeBaseId are required" }, { status: 400 });
    }

    const { db } = await connectToDatabase();

    let kbId;
    try { kbId = new ObjectId(knowledgeBaseId); } catch { kbId = knowledgeBaseId; }

    const kb = await db.collection("knowledgeBases").findOne({ _id: kbId as any });
    if (!kb || !kb.openaiVectorStoreId) {
      return NextResponse.json({ error: "Knowledge Base or Vector Store not found" }, { status: 404 });
    }

    // 1. Upload to Cloudinary (for preview)
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const fileDataUrl = `data:${file.type};base64,${buffer.toString("base64")}`;
    const cloudinaryFolder = `ai-saas/workspaces/${workspaceId}/knowledge-bases/${knowledgeBaseId}`;
    
    console.log(`[OpenAI Upload] Uploading to Cloudinary...`);
    const cloudinaryUrl = await uploadToCloudinary(fileDataUrl, cloudinaryFolder, "raw");

    // 2. Upload to OpenAI
    console.log(`[OpenAI Upload] Uploading to OpenAI...`);
    const openaiFile = await openai.files.create({
      file: file,
      purpose: "assistants",
    });

    console.log(`[OpenAI Upload] Attaching to Vector Store ${kb.openaiVectorStoreId}...`);
    // 3. Attach to Vector Store
    await openai.vectorStores.files.create(
      kb.openaiVectorStoreId,
      { file_id: openaiFile.id }
    );

    // 4. Save to MongoDB
    const kbFile = {
      workspaceId,
      knowledgeBaseId,
      name: file.name,
      cloudinaryUrl,
      openaiFileId: openaiFile.id,
      size: file.size,
      status: "ready",
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const result = await db.collection("knowledgeBaseFiles").insertOne(kbFile);

    return NextResponse.json({ success: true, file: { _id: result.insertedId, ...kbFile } });

  } catch (error: any) {
    console.error("[OpenAI File Upload POST]", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}
