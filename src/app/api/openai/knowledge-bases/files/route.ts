import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db/mongodb";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const knowledgeBaseId = searchParams.get('knowledgeBaseId');

    if (!knowledgeBaseId) {
      return NextResponse.json({ error: "knowledgeBaseId is required" }, { status: 400 });
    }

    const { db } = await connectToDatabase();
    const files = await db.collection("knowledgeBaseFiles").find({ knowledgeBaseId }).toArray();

    return NextResponse.json({ success: true, files });
  } catch (error: any) {
    console.error("[KnowledgeBaseFiles GET]", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}
