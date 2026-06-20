import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db/mongodb";
import { ObjectId } from "mongodb";

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const workspaceId = searchParams.get('workspaceId');

    if (!workspaceId) {
      return NextResponse.json({ error: "workspaceId is required" }, { status: 400 });
    }

    const { db } = await connectToDatabase();
    const chats = await db.collection("chats").find({ workspaceId }).sort({ updatedAt: -1 }).toArray();

    return NextResponse.json({ success: true, chats });
  } catch (error: any) {
    console.error("[Chats GET]", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}
