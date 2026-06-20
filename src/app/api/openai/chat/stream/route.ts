import { openai } from "@/lib/openai/client";
import { connectToDatabase } from "@/lib/db/mongodb";
import { ObjectId } from "mongodb";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { message, threadId, chatId, agentId, workspaceId } = body;

    if (!message || !agentId || !workspaceId) {
      return new Response(JSON.stringify({ error: "message, agentId, and workspaceId are required" }), { status: 400 });
    }

    const { db } = await connectToDatabase();
    
    // 1. Fetch Agent and its Knowledge Base
    let agentIdObj;
    try { agentIdObj = new ObjectId(agentId); } catch { agentIdObj = agentId; }
    const agent = await db.collection("agents").findOne({ _id: agentIdObj });
    if (!agent) {
      return new Response(JSON.stringify({ error: "Agent not found" }), { status: 404 });
    }

    let vectorStoreId = undefined;
    if (agent.knowledgeBaseId) {
      let kbIdObj;
      try { kbIdObj = new ObjectId(agent.knowledgeBaseId); } catch { kbIdObj = agent.knowledgeBaseId; }
      const kb = await db.collection("knowledgeBases").findOne({ _id: kbIdObj as any });
      if (kb && kb.openaiVectorStoreId) {
        vectorStoreId = kb.openaiVectorStoreId;
      }
    }

    // 2. Resolve Thread and Chat
    let currentThreadId = threadId;
    let currentChatId = chatId;

    if (!currentThreadId || !currentChatId) {
      const thread = await openai.beta.threads.create();
      currentThreadId = thread.id;
      
      const newChat = {
        workspaceId,
        agentId,
        knowledgeBaseId: agent.knowledgeBaseId,
        openaiThreadId: currentThreadId,
        title: message.substring(0, 40) + "...",
        status: "active",
        createdAt: new Date(),
        updatedAt: new Date()
      };
      const result = await db.collection("chats").insertOne(newChat);
      currentChatId = result.insertedId.toString();
    }

    // 3. Add Message to Thread and DB
    const openaiMsg = await openai.beta.threads.messages.create(currentThreadId, {
      role: "user",
      content: message
    });

    await db.collection("chatMessages").insertOne({
      chatId: currentChatId,
      workspaceId,
      role: "user",
      content: message,
      openaiMessageId: openaiMsg.id,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    // 4. Create Stream
    if (!agent.openaiAssistantId) {
      return new Response(JSON.stringify({ error: "Agent is missing OpenAI Assistant ID" }), { status: 400 });
    }

    const stream = await openai.beta.threads.runs.create(currentThreadId, {
      assistant_id: agent.openaiAssistantId,
      stream: true,
      additional_instructions: "IMPORTANTE: Aja com extrema confiança e certeza. Você tem acesso completo e nativo ao edital via Vector Store. NUNCA diga 'eu não li tudo', 'eu fiz buscas limitadas', ou 'meu conhecimento baseia-se apenas nas buscas'. Apenas entregue a resposta baseada no documento. Se não souber de algo específico, simplesmente diga que aquela informação não consta explicitamente no edital, mas evite mencionar a mecânica da ferramenta de busca."
    });

    // We convert the OpenAI stream to a readable stream using Server-Sent Events (SSE)
    const readableStream = new ReadableStream({
      async start(controller) {
        // Send threadId and chatId first
        controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify({ type: 'thread_id', threadId: currentThreadId, chatId: currentChatId })}\n\n`));

        let fullAssistantResponse = "";

        for await (const chunk of stream) {
          if (chunk.event === 'thread.message.delta') {
            const content = chunk.data.delta.content?.[0];
            if (content && content.type === 'text' && content.text?.value) {
              fullAssistantResponse += content.text.value;
              controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify({ type: 'text', text: content.text.value })}\n\n`));
            }
          }
        }
        
        // Save Assistant message when stream finishes
        await db.collection("chatMessages").insertOne({
          chatId: currentChatId,
          workspaceId,
          role: "assistant",
          content: fullAssistantResponse,
          createdAt: new Date(),
          updatedAt: new Date()
        });

        controller.enqueue(new TextEncoder().encode(`data: [DONE]\n\n`));
        controller.close();
      }
    });

    return new Response(readableStream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive"
      }
    });

  } catch (error: any) {
    console.error("[OpenAI Chat Stream]", error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}
