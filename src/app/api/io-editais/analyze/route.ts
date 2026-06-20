import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db/mongodb";
import { openai } from "@/lib/openai/client";
import { ObjectId } from "mongodb";

import { MASTER_CHECKLIST } from "./masterChecklist";

export const maxDuration = 300; // 5 minutes for deep analysis

export async function POST(req: Request) {
  try {
    const { kbId, agentId } = await req.json();

    if (!kbId || !agentId) {
      return NextResponse.json({ error: "kbId and agentId are required" }, { status: 400 });
    }

    const { db } = await connectToDatabase();

    const agent = await db.collection("agents").findOne({ _id: new ObjectId(agentId) });
    if (!agent) {
      return NextResponse.json({ error: "Agent not found" }, { status: 404 });
    }

    // Inform DB that analysis is processing
    await db.collection("knowledgeBases").updateOne(
      { _id: new ObjectId(kbId) },
      { $set: { "analysis.status": "processing" } }
    );

    // Prompt for structured extraction
    const prompt = `Você é um Especialista Sênior em Licitações e Editais. Analise PROFUNDA E EXAUSTIVAMENTE o edital fornecido na sua base de conhecimento, utilizando o checklist mestre abaixo como critério absoluto de julgamento e extração de dados:

${MASTER_CHECKLIST}

Sua missão não é apenas ler o edital, mas JULGÁ-LO com base nos 50 pontos deste checklist.
Aja como um analista de risco e consultor estratégico. Traga muitos detalhes operacionais, datas, valores, e nuances técnicas.

Sua resposta DEVE OBRIGATORIAMENTE ser formatada utilizando as tags de delimitação abaixo. NUNCA use o formato JSON. Siga EXATAMENTE esta estrutura:

===TIPO===
Identifique o tipo exato do documento (Ex: Pregão Eletrônico, Chamamento Público, etc)

===GERAL===
Formato clássico em Markdown. Use exatamente estes subtítulos (##): ## Resumo do Edital (Objeto, Modalidade, Dotação, Valores), ## Prazos e Datas, ## Exigências e Habilitação, ## Riscos e Penalidades, ## Itens Específicos. Preencha detalhadamente.

===CHECKLIST===
Resumo contendo as seções: Documentação de Habilitação, Qualificação Técnica, Atestados, Licenças/Certificações, Amostras, Prazos e Condições de Execução, Penalidades e Motivos Potenciais de Desclassificação. Formato Markdown extenso em bullet points (-).

===PROPOSTA===
Resumo contendo as seções: Critério de Julgamento, Preço de Referência, Garantias, Validade da Proposta, Condições de Pagamento, Inteligência Comercial e Simulação Financeira. Formato Markdown extenso e rico.

INSTRUÇÃO CRÍTICA 1: Use a ferramenta file_search exaustivamente para cobrir todas as páginas e não perder nada importante.
INSTRUÇÃO CRÍTICA 2: SEMPRE que afirmar algo, julgar um risco ou listar uma exigência, cite a fonte obrigatoriamente usando as anotações automáticas da ferramenta (ex: 【4:1†arquivo.pdf】). O usuário PRECISA das citações para validar suas conclusões.
INSTRUÇÃO CRÍTICA 3: Mantenha as tags delimitadoras (===TIPO===, ===GERAL===, ===CHECKLIST===, ===PROPOSTA===) exatamente como mostradas.`;

    const thread = await openai.beta.threads.create({
      messages: [{ role: "user", content: prompt }]
    });

    const run = await openai.beta.threads.runs.create(thread.id, {
      assistant_id: agent.openaiAssistantId
    });

    // Polling
    let currentRun = await openai.beta.threads.runs.retrieve(run.id, { thread_id: thread.id });
    while (currentRun.status === "queued" || currentRun.status === "in_progress") {
      await new Promise(resolve => setTimeout(resolve, 2000));
      currentRun = await openai.beta.threads.runs.retrieve(run.id, { thread_id: thread.id });
    }

    if (currentRun.status === "completed") {
      const messages = await openai.beta.threads.messages.list(thread.id);
      const lastMessage = messages.data.filter(m => m.role === 'assistant')[0];
      if (lastMessage && lastMessage.content[0].type === 'text') {
        let text = lastMessage.content[0].text.value;
        const annotations = lastMessage.content[0].text.annotations;

        if (annotations && annotations.length > 0) {
          for (let i = 0; i < annotations.length; i++) {
            const annotation = annotations[i];
            if (annotation.file_citation) {
              const quote = annotation.file_citation.quote || "Edital em Análise";
              // Substitui a anotação padrão (ex: 【4:0†source】) por um link markdown preparado
              // Usamos um JSON stringify escapado para garantir que as aspas do quote não quebrem o markdown
              const safeQuote = quote.replace(/"/g, '&quot;');
              text = text.replace(annotation.text, `[Trecho Extraído](#citation "${safeQuote}")`);
            }
          }
        }

        // Parse the delimiters
        const extractSection = (marker: string, nextMarker: string | null) => {
          const start = text.indexOf(marker);
          if (start === -1) return "";
          const end = nextMarker ? text.indexOf(nextMarker, start) : text.length;
          return text.substring(start + marker.length, end !== -1 ? end : text.length).trim();
        };

        const tipoEdital = extractSection("===TIPO===", "===GERAL===");
        const visaoGeral = extractSection("===GERAL===", "===CHECKLIST===");
        const checklist = extractSection("===CHECKLIST===", "===PROPOSTA===");
        const proposta = extractSection("===PROPOSTA===", null);

        const parsed = { tipoEdital, visaoGeral, checklist, proposta };

        await db.collection("knowledgeBases").updateOne(
          { _id: new ObjectId(kbId) },
          { $set: { 
            "analysis.status": "completed",
            "analysis.tipoEdital": parsed.tipoEdital || "Não identificado",
            "analysis.visaoGeral": parsed.visaoGeral || text,
            "analysis.checklist": parsed.checklist || "",
            "analysis.proposta": parsed.proposta || "",
            "analysis.lastUpdated": new Date()
          }}
        );
        return NextResponse.json({ success: true, analysis: parsed });
      }
    }

    await db.collection("knowledgeBases").updateOne(
      { _id: new ObjectId(kbId) },
      { $set: { 
        "analysis.status": "error", 
        "analysis.error": `Run ended with status: ${currentRun.status}`,
        "analysis.fullError": currentRun.last_error ? JSON.stringify(currentRun.last_error) : null
      } }
    );

    return NextResponse.json({ error: `Run ended with status: ${currentRun.status}` }, { status: 500 });

  } catch (error: any) {
    console.error("[Analyze POST]", error);
    try {
      const { db } = await connectToDatabase();
      const { kbId } = await req.json().catch(() => ({}));
      if (kbId) {
        await db.collection("knowledgeBases").updateOne(
          { _id: new ObjectId(kbId) },
          { $set: { "analysis.status": "error", "analysis.error": error.message || "Internal server error", "analysis.fullError": JSON.stringify(error, Object.getOwnPropertyNames(error)) } }
        );
      }
    } catch (e) {}
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}
