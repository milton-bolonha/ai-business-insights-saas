import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db/mongodb";
import { ObjectId } from "mongodb";

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { workspaceId, name, description, systemPrompt, knowledgeBaseId, model } = body;

    if (!workspaceId || !name || !systemPrompt) {
      return NextResponse.json({ error: "workspaceId, name, and systemPrompt are required" }, { status: 400 });
    }

    const { db } = await connectToDatabase();
    
    // 1. Fetch KB if linked
    let toolResources = undefined;
    const tools: any[] = [];
    let finalInstructions = systemPrompt;

    if (knowledgeBaseId) {
      let kbId;
      try { kbId = new ObjectId(knowledgeBaseId); } catch { kbId = knowledgeBaseId; }
      
      const kb = await db.collection("knowledgeBases").findOne({ _id: kbId as any });
      if (kb && kb.openaiVectorStoreId) {
        tools.push({ type: "file_search" });
        toolResources = {
          file_search: {
            vector_store_ids: [kb.openaiVectorStoreId]
          }
        };
        finalInstructions += `\n\n[INSTRUÇÃO CRÍTICA DO SISTEMA]: Você possui acesso à ÍNTEGRA dos documentos fornecidos na Base de Conhecimento através da sua ferramenta de busca (file_search). Quando você realiza uma busca, a ferramenta retorna apenas os trechos (chunks) mais relevantes, mas todo o documento está disponível para você pesquisar. Se você não encontrar uma informação em uma primeira busca, VOCÊ DEVE realizar novas buscas utilizando termos diferentes e sinônimos antes de desistir. NUNCA diga ao usuário que você "tem acesso apenas a algumas páginas" ou que o documento está incompleto. Use a ferramenta repetidamente até varrer o arquivo.`;
      }
    }

    // 2. Create OpenAI Assistant
    const { openai } = await import("@/lib/openai/client");
    const assistant = await openai.beta.assistants.create({
      name,
      description: description || "",
      instructions: finalInstructions,
      model: model || "gpt-4o",
      tools,
      tool_resources: toolResources
    });

    const agent = {
      workspaceId,
      name,
      description,
      systemPrompt,
      knowledgeBaseId,
      openaiAssistantId: assistant.id,
      model: model || "gpt-4o",
      active: true,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const result = await db.collection("agents").insertOne(agent);

    return NextResponse.json({ success: true, agent: { _id: result.insertedId, ...agent } });
  } catch (error: any) {
    console.error("[Agents POST]", error);
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
    const agents = await db.collection("agents").find({ workspaceId }).sort({ createdAt: -1 }).toArray();

    return NextResponse.json({ success: true, agents });
  } catch (error: any) {
    console.error("[Agents GET]", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}
