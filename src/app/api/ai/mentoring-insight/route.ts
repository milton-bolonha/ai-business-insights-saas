import { NextResponse } from "next/server";
import { db } from "@/lib/db/mongodb";
import { getAuth } from "@/lib/auth/get-auth";
import { checkLimit, incrementUsage } from "@/lib/saas/usage-service";
import { authorizeWorkspaceAccess } from "@/lib/auth/authorize";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: Request) {
  try {
    const { workspaceId, studentName, mentorName, mentoringGoal } = await req.json();

    if (!workspaceId) {
      return NextResponse.json({ error: "Workspace ID is required" }, { status: 400 });
    }

    // 1. Authenticate user
    const { userId } = await getAuth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2. Authorize Workspace access
    const authAccess = await authorizeWorkspaceAccess(workspaceId, userId);
    if (!authAccess.authorized) {
      return NextResponse.json({ error: authAccess.error || "Workspace access denied" }, { status: 403 });
    }

    // 3. Check Credit Limits
    const canPerform = await checkLimit(userId, "wmsAiAssistant");
    if (!canPerform) {
      return NextResponse.json({ 
        error: "Insufficient credits", 
        message: "Você não possui créditos suficientes para gerar insights de mentoria." 
      }, { status: 403 });
    }

    // 4. Fetch Workspace & Tasks Data
    const workspace = await db.findOne("workspaces", { id: workspaceId }) || {
      promptSettings: {
        mentoring_goal: mentoringGoal || "Desenvolvimento de Carreira & Mentoria",
        student_name: studentName || "Estudante",
        mentor_name: mentorName || "Ade Mentor",
      }
    };
    const tasks = await db.find("mentoring_tasks", { workspaceId });

    const completedTasks = tasks.filter((t: any) => t.status === "done");
    const pendingTasks = tasks.filter((t: any) => t.status !== "done");

    // 5. Build Prompt
    const prompt = `Você é o "Ade Mentor", um analista de performance humana de elite.
    Analise o progresso deste aluno e gere um relatório curto, direto e motivador (máximo 150 palavras) em português.
    
    Contexto do Workspace:
    - Objetivo: ${workspace.promptSettings?.mentoring_goal || "Não definido"}
    - Aluno: ${workspace.promptSettings?.student_name || "O Aluno"}
    - Mentor: ${workspace.promptSettings?.mentor_name || "O Mentor"}
    
    Dados de Progresso:
    - Tarefas Concluídas: ${completedTasks.map(t => t.title).join(", ") || "Nenhuma ainda"}
    - Tarefas Pendentes: ${pendingTasks.map(t => t.title).join(", ") || "Nenhuma"}
    
    Estruture a resposta em 3 partes:
    1. Diagnóstico (Onde estamos?)
    2. Alerta (Onde está o gargalo?)
    3. Plano de Ataque (O que fazer na próxima sessão?)
    
    Use um tom profissional, porém encorajador. Evite clichês.`;

    // 6. Generate Content using OpenAI
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "Você é um mentor experiente e focado em resultados." },
        { role: "user", content: prompt }
      ],
      temperature: 0.7,
      max_tokens: 600,
    });

    const insight = completion.choices[0]?.message?.content || "Não foi possível gerar a análise.";

    // 7. Consume credits
    await incrementUsage(userId, "wmsAiAssistant", 1);

    return NextResponse.json({ insight });
  } catch (error: any) {
    console.error("[API/AI/MentoringInsight] error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
