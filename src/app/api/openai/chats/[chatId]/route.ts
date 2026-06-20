import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db/mongodb";
import { ObjectId } from "mongodb";

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ chatId: string }> }
) {
  try {
    const { chatId } = await params;
    const { db } = await connectToDatabase();

    await db.collection("chatMessages").deleteMany({ chatId });
    await db.collection("chats").deleteOne({ _id: new ObjectId(chatId) });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("[Chat DELETE]", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}
