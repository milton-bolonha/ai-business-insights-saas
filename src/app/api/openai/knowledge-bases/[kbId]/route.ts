import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db/mongodb";
import { ObjectId } from "mongodb";
import { openai } from "@/lib/openai/client";

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ kbId: string }> }
) {
  try {
    const { kbId } = await params;
    const { db } = await connectToDatabase();

    const kb = await db.collection("knowledgeBases").findOne({ _id: new ObjectId(kbId) });
    if (!kb) {
      return NextResponse.json({ error: "KB not found" }, { status: 404 });
    }

    // Apagar Vector Store na OpenAI
    if (kb.openaiVectorStoreId) {
      try {
        const beta = openai.beta as any;
        if (beta.vectorStores) {
          if (typeof beta.vectorStores.del === 'function') {
            await beta.vectorStores.del(kb.openaiVectorStoreId);
          } else if (typeof beta.vectorStores.delete === 'function') {
            await beta.vectorStores.delete(kb.openaiVectorStoreId);
          }
        }
      } catch (e: any) {
        console.warn("Falha ao apagar Vector Store na OpenAI (pode já não existir)", e);
      }
    }

    // Apagar arquivos do banco de dados (Cloudinary não apagaremos para evitar perder outros refs, mas poderia)
    await db.collection("knowledgeBaseFiles").deleteMany({ knowledgeBaseId: kbId });
    
    // Apagar a KB
    await db.collection("knowledgeBases").deleteOne({ _id: new ObjectId(kbId) });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("[KnowledgeBase DELETE]", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}
