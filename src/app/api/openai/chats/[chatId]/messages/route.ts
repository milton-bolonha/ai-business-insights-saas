import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db/mongodb";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ chatId: string }> }
) {
  try {
    const { chatId } = await params;
    const { db } = await connectToDatabase();
    
    // Sort by createdAt ascending (oldest first)
    const messages = await db.collection("chatMessages")
      .find({ chatId })
      .sort({ createdAt: 1 })
      .toArray();

    return NextResponse.json({ success: true, messages });
  } catch (error: any) {
    console.error("[ChatMessages GET]", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}
