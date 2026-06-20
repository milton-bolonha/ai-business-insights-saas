import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db/mongodb";
import { ObjectId } from "mongodb";
import { openai } from "@/lib/openai/client";

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ agentId: string }> }
) {
  try {
    const { agentId } = await params;
    const { db } = await connectToDatabase();

    const agent = await db.collection("agents").findOne({ _id: new ObjectId(agentId) });
    if (!agent) {
      return NextResponse.json({ error: "Agent not found" }, { status: 404 });
    }

    if (agent.openaiAssistantId) {
      try {
        if (typeof (openai.beta.assistants as any).del === 'function') {
          await (openai.beta.assistants as any).del(agent.openaiAssistantId);
        } else if (typeof (openai.beta.assistants as any).delete === 'function') {
          await (openai.beta.assistants as any).delete(agent.openaiAssistantId);
        }
      } catch (e: any) {}
    }

    await db.collection("agents").deleteOne({ _id: new ObjectId(agentId) });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("[Agent DELETE]", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}
