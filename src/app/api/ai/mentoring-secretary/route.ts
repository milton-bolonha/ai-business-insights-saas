import { NextResponse } from "next/server";
import { db } from "@/lib/db/mongodb";
import { getAuth } from "@/lib/auth/get-auth";
import { checkLimit, incrementUsage } from "@/lib/saas/usage-service";
import { authorizeWorkspaceAccess } from "@/lib/auth/authorize";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || "dummy-key-for-build",
});

// GET: Retrieve past secretary suggestions history for the user & workspace
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const workspaceId = searchParams.get("workspaceId");

    if (!workspaceId) {
      console.warn("[GET /api/ai/mentoring-secretary] Missing workspaceId");
      return NextResponse.json({ error: "Workspace ID is required" }, { status: 400 });
    }

    const { userId } = await getAuth();
    if (!userId) {
      console.warn("[GET /api/ai/mentoring-secretary] Unauthorized user access attempt");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log(`[GET /api/ai/mentoring-secretary] Fetching logs for user: ${userId}, workspace: ${workspaceId}`);

    // Fetch suggestions from db
    const suggestions = await db.find("mentoring_ai_suggestions", { userId, workspaceId });

    // Sort suggestions by createdAt descending
    const sortedSuggestions = suggestions.sort((a: any, b: any) => {
      const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return dateB - dateA;
    });

    return NextResponse.json({ history: sortedSuggestions });
  } catch (error: any) {
    console.error("[GET /api/ai/mentoring-secretary] Exception:", error);
    return NextResponse.json({ error: "Internal Server Error", message: error.message }, { status: 500 });
  }
}

// POST: Trigger OpenAI to analyze workspace state and generate a new Secretaria IA advice, saving it to MongoDB
export async function POST(req: Request) {
  try {
    const { workspaceId } = await req.json();

    if (!workspaceId) {
      console.warn("[POST /api/ai/mentoring-secretary] Missing workspaceId in payload");
      return NextResponse.json({ error: "Workspace ID is required" }, { status: 400 });
    }

    // 1. Authenticate user
    const { userId } = await getAuth();
    if (!userId) {
      console.warn("[POST /api/ai/mentoring-secretary] Unauthorized access");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log(`[POST /api/ai/mentoring-secretary] Starting Secretary generation for user: ${userId}, workspace: ${workspaceId}`);

    // 2. Authorize Workspace access
    const authAccess = await authorizeWorkspaceAccess(workspaceId, userId);
    if (!authAccess.authorized) {
      console.warn(`[POST /api/ai/mentoring-secretary] Forbidden access to workspace ${workspaceId} by user ${userId}`);
      return NextResponse.json({ error: authAccess.error || "Workspace access denied" }, { status: 403 });
    }

    // 3. Check Credit Limits
    const canPerform = await checkLimit(userId, "wmsAiAssistant");
    if (!canPerform) {
      console.warn(`[POST /api/ai/mentoring-secretary] Credit limit reached for user: ${userId}`);
      return NextResponse.json({
        error: "Insufficient credits",
        message: "Você não possui créditos suficientes para acionar a Secretaria IA."
      }, { status: 403 });
    }

    // 4. Fetch tasks, scheduled sessions, and user profile
    const tasks = await db.find("mentoring_tasks", { workspaceId }) || [];
    const sessions = await db.find("mentoring_sessions", { workspaceId }) || [];
    const profile = await db.findOne("mentoring_profiles", { userId }) || {};

    const completedTasks = tasks.filter((t: any) => t.status === "done");
    const pendingTasks = tasks.filter((t: any) => t.status !== "done");

    // Sort sessions by date/time to find upcoming ones
    const upcomingSessions = sessions
      .filter((s: any) => {
        if (!s.date) return false;
        // Keep upcoming or same-day sessions
        const sessionDate = new Date(s.date);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return sessionDate >= today;
      })
      .sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime());

    // 5. Gather profile descriptors
    const studentName = profile.name || "Membro";
    const userRole = profile.role === "mentor" ? "Mentor" : "Mentorado";
    const quote = profile.motivationalQuote ? `"${profile.motivationalQuote}"` : "Não definida";

    const expectations = profile.mentorshipExpectations || "Não especificado";
    const shortGoals = profile.shortTermGoals || "Não especificado";
    const medGoals = profile.mediumTermGoals || "Não especificado";
    const dream = profile.professionalDream || "Não especificado";
    const studentHobbies = profile.hobbies || "Não especificado";

    console.log(`[POST /api/ai/mentoring-secretary] Data parsed. Tasks: ${tasks.length}, Sessions: ${sessions.length}`);

    // 6. Build prompt
    const prompt = `Você é a ADE, a Secretaria IA de Elite e Mentora IA do aluno ${studentName} (${userRole}).
Seu papel é ser uma assistente virtual de altíssimo escalão: extremamente organizada, motivadora, analítica, elegante e parceira.

Analise as informações do perfil do estudante e o progresso das suas atividades:

CITAÇÃO INSPIRADORA DO ESTUDANTE:
${quote}

METAS E DIRETRIZES DE EVOLUÇÃO:
- Expectativa da Mentoria: ${expectations}
- Objetivos de Curto Prazo (Foco Imediato): ${shortGoals}
- Objetivos de Médio Prazo: ${medGoals}
- Sonho Profissional: ${dream}
- Hobbies & Artes: ${studentHobbies}

TAREFAS E PROJETOS CONCLUÍDOS NO WORKSPACE:
${completedTasks.map((t: any) => `- [CONCLUÍDO] ${t.title}`).join("\n") || "Nenhuma tarefa concluída ainda."}

TAREFAS PENDENTES (A FAZER):
${pendingTasks.map((t: any) => `- [PENDENTE] ${t.title} ${t.priority ? `(Prioridade: ${t.priority})` : ""}`).join("\n") || "Nenhuma tarefa pendente registrada!"}

AGENDA DE PRÓXIMAS SESSÕES DE MENTORIA:
${upcomingSessions.map((s: any) => `- ${s.title} em ${s.date} às ${s.time || "horário não definido"}`).join("\n") || "Nenhuma sessão futura agendada."}

Com base nesses dados, elabore um relatório de secretariado executivo inteligente, curto, caloroso, enérgico e acionável em português (no máximo 250 palavras).
Você deve:
1. Começar com um cumprimento refinado e uma rápida menção encorajadora sobre o progresso atual (o que já fez vs o que tem a fazer).
2. Fornecer os Próximos Passos recomendados com base no alinhamento de curto e médio prazo.
3. Mencionar os próximos agendamentos importantes de mentoria.
4. Concluir com um incentivo alinhado ao seu "Sonho Profissional" ou sua citação inspiradora.

Escreva a resposta formatada em Markdown elegante. Use emojis com moderação para manter o tom premium e profissional de secretária de diretoria de elite.`;

    // 7. Call OpenAI gpt-4o-mini
    console.log("[POST /api/ai/mentoring-secretary] Querying OpenAI gpt-4o-mini...");
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "Você é ADE, uma secretaria/departamento executiva de elite, direta, cordial, inteligente e conselheira de alta performance humana."
        },
        { role: "user", content: prompt }
      ],
      temperature: 0.7,
      max_tokens: 800,
    });

    const content = completion.choices[0]?.message?.content || "Desculpe, não consegui estruturar seu relatório no momento.";
    console.log("[POST /api/ai/mentoring-secretary] OpenAI generation complete.");

    // 8. Record interaction in MongoDB for persistent history
    const suggestionRecord = {
      userId,
      workspaceId,
      content,
      createdAt: new Date()
    };

    const insertResult = await db.insertOne("mentoring_ai_suggestions", suggestionRecord);
    console.log("[POST /api/ai/mentoring-secretary] Log recorded in mentoring_ai_suggestions collection with ID:", insertResult);

    // 9. Consume Credit Limit
    await incrementUsage(userId, "wmsAiAssistant", 1);
    console.log("[POST /api/ai/mentoring-secretary] Usage incremented.");

    // 10. Fetch updated history list to send back
    const allSuggestions = await db.find("mentoring_ai_suggestions", { userId, workspaceId });
    const sortedSuggestions = allSuggestions.sort((a: any, b: any) => {
      const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return dateB - dateA;
    });

    return NextResponse.json({
      suggestion: content,
      history: sortedSuggestions
    });
  } catch (error: any) {
    console.error("[POST /api/ai/mentoring-secretary] Fatal error:", error);
    return NextResponse.json({ error: "Internal Server Error", message: error.message }, { status: 500 });
  }
}
