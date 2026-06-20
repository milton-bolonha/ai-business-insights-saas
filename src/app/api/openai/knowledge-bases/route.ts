import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db/mongodb";
import { ObjectId } from "mongodb";

import { openai } from "@/lib/openai/client";

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { workspaceId, name, description, editalType } = body;

    if (!workspaceId || !name) {
      return NextResponse.json({ error: "workspaceId and name are required" }, { status: 400 });
    }

    // 1. Create Vector Store in OpenAI
    const vectorStore = await openai.vectorStores.create({
      name: name,
    });

    // 2. Save KnowledgeBase in MongoDB
    const { db } = await connectToDatabase();
    
    const kb = {
      workspaceId,
      name,
      description,
      editalType,
      openaiVectorStoreId: vectorStore.id,
      status: 'active',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await db.collection("knowledgeBases").insertOne(kb);

    return NextResponse.json({ success: true, kb: { _id: result.insertedId, ...kb } });
  } catch (error: any) {
    console.error("[KnowledgeBases POST]", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const workspaceId = searchParams.get('workspaceId');

    if (!workspaceId) {
      return NextResponse.json({ error: "workspaceId is required" }, { status: 400 });
    }

    const { db } = await connectToDatabase();
    const kbs = await db.collection("knowledgeBases").find({ workspaceId }).sort({ createdAt: -1 }).toArray();

    return NextResponse.json({ success: true, knowledgeBases: kbs });
  } catch (error: any) {
    console.error("[KnowledgeBases GET]", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}
