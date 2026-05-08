import { NextResponse } from "next/server";
import { getAuth } from "@clerk/nextjs/server";
import { db } from "@/lib/db/mongodb";
import { ChatMessageDocument, chatMessageDocumentToMessage } from "@/lib/db/models/ChatMessage";
import type { ChatMessage } from "@/lib/types/chat";

export async function GET(request: Request) {
  try {
    const { userId } = await getAuth(request as any);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const workspaceId = searchParams.get("workspaceId");
    const dashboardId = searchParams.get("dashboardId");

    if (!workspaceId) {
      return NextResponse.json({ error: "workspaceId is required" }, { status: 400 });
    }

    const query: any = { userId, workspaceId };
    
    // Se passarem dashboardId, podemos filtrar por dashboard específico ou por null (mensagens globais)
    // Se o usuário quiser um histórico por dashboard:
    if (dashboardId) {
      query.$or = [
        { dashboardId },
        { dashboardId: null },
        { dashboardId: { $exists: false } }
      ];
    }

    const messagesDocs = await db.find<ChatMessageDocument>("chat_messages", query, {
      sort: { createdAt: 1 }, // chronological
    });

    const messages = messagesDocs.map(chatMessageDocumentToMessage);

    return NextResponse.json({ messages });
  } catch (error) {
    console.error("Error fetching chat messages:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { userId } = await getAuth(request as any);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { workspaceId, dashboardId, role, content, metadata } = body as ChatMessage;

    if (!workspaceId || !role || !content) {
      return NextResponse.json({ error: "workspaceId, role, and content are required" }, { status: 400 });
    }

    const newMessage: any = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      userId,
      workspaceId,
      dashboardId,
      role,
      content,
      metadata,
      createdAt: new Date(),
    };

    const insertedId = await db.insertOne("chat_messages", newMessage);

    return NextResponse.json({ 
      success: true, 
      message: chatMessageDocumentToMessage({ ...newMessage, _id: insertedId } as ChatMessageDocument) 
    });
  } catch (error) {
    console.error("Error saving chat message:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
