import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db/mongodb";
import { openai } from "@/lib/openai/client";
import { uploadToCloudinary } from "@/lib/storage/cloudinary";

export const maxDuration = 300; // 5 minutes to wait for PDF vector parsing

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;
    const workspaceId = formData.get("workspaceId") as string;
    const type = formData.get("type") as string || "Geral"; // e.g. "Artístico", "Pregão"

    if (!file || !workspaceId) {
      return NextResponse.json({ error: "file and workspaceId are required" }, { status: 400 });
    }

    const { db } = await connectToDatabase();

    // 1. Create Knowledge Base
    const kb = {
      workspaceId,
      name: file.name,
      description: `Edital ${type}`,
      editalType: type,
      openaiVectorStoreId: "",
      createdAt: new Date(),
      updatedAt: new Date()
    };
    const kbResult = await db.collection("knowledgeBases").insertOne(kb);
    const kbId = kbResult.insertedId.toString();

    // 2. Upload to Cloudinary
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const fileDataUrl = `data:${file.type};base64,${buffer.toString("base64")}`;
    const cloudinaryFolder = `ai-saas/workspaces/${workspaceId}/editais/${kbId}`;
    const cloudinaryUrl = await uploadToCloudinary(fileDataUrl, cloudinaryFolder, "raw");

    // 3. Upload to OpenAI and Create Vector Store
    const vectorStore = await openai.vectorStores.create({ name: `VS_${file.name}` });
    const openaiFile = await openai.files.create({ file: file, purpose: "assistants" });
    let vsFile = await openai.vectorStores.files.create(vectorStore.id, { file_id: openaiFile.id });

    // Poll until file is fully processed (searchable by the Assistant)
    while (vsFile.status === "in_progress" || vsFile.status === "queued" || (vsFile.status as any) === "parsing") {
      await new Promise(resolve => setTimeout(resolve, 2000));
      vsFile = await openai.vectorStores.files.retrieve(openaiFile.id, { vector_store_id: vectorStore.id });
    }

    // Update KB with Vector Store ID
    await db.collection("knowledgeBases").updateOne(
      { _id: kbResult.insertedId },
      { $set: { openaiVectorStoreId: vectorStore.id } }
    );

    // Save File record
    await db.collection("knowledgeBaseFiles").insertOne({
      workspaceId,
      knowledgeBaseId: kbId,
      name: file.name,
      cloudinaryUrl,
      openaiFileId: openaiFile.id,
      size: file.size,
      status: "ready",
      createdAt: new Date()
    });

    // 4. Create Agent
    let systemPrompt = `Você é um Especialista em Licitações Públicas focado em analisar editais. 
Seu papel é ajudar a extrair resumos, checklists de habilitação, dados de propostas e tirar dúvidas.
[INSTRUÇÃO CRÍTICA DO SISTEMA]: Você possui acesso à ÍNTEGRA dos documentos fornecidos na Base de Conhecimento através da sua ferramenta de busca (file_search). Quando você realiza uma busca, a ferramenta retorna apenas os trechos (chunks) mais relevantes, mas todo o documento está disponível para você pesquisar. Se você não encontrar uma informação em uma primeira busca, VOCÊ DEVE realizar novas buscas utilizando termos diferentes e sinônimos antes de desistir. NUNCA diga ao usuário que você "tem acesso apenas a algumas páginas" ou que o documento está incompleto. Use a ferramenta repetidamente até varrer o arquivo.`;

    if (type === "Artístico") {
      systemPrompt += " Foque especialmente nas exigências artísticas, cachês, curadoria e documentação cultural (como portfólio e atestados de capacidade artística).";
    } else if (type === "Pregão") {
      systemPrompt += " Foque especialmente na modalidade de Pregão, lances, termo de referência técnico e exigências financeiras rigorosas.";
    }

    const assistant = await openai.beta.assistants.create({
      name: `Especialista em ${file.name}`,
      description: `Agente especializado no edital ${file.name}`,
      instructions: systemPrompt,
      model: "gpt-4o",
      tools: [{ type: "file_search" }],
      tool_resources: { file_search: { vector_store_ids: [vectorStore.id] } }
    });

    const agent = {
      workspaceId,
      name: `Especialista em ${file.name}`,
      description: `Agente analisador do edital: ${file.name}`,
      systemPrompt,
      knowledgeBaseId: kbId,
      openaiAssistantId: assistant.id,
      model: "gpt-4o",
      active: true,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    const agentResult = await db.collection("agents").insertOne(agent);

    // 5. Create Chat Thread
    const thread = await openai.beta.threads.create();
    const chat = {
      workspaceId,
      title: `Análise Geral: ${file.name}`,
      agentId: agentResult.insertedId.toString(),
      openaiThreadId: thread.id,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    const chatResult = await db.collection("chats").insertOne(chat);

    // 6. Return payload
    return NextResponse.json({
      success: true,
      knowledgeBaseId: kbId,
      agentId: agentResult.insertedId.toString(),
      chatId: chatResult.insertedId.toString(),
      fileUrl: cloudinaryUrl
    });

  } catch (error: any) {
    console.error("[Smart Upload POST]", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}
