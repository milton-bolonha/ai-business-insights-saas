"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  Sparkles, 
  TrendingUp, 
  Target, 
  Lightbulb, 
  Loader2, 
  BrainCircuit,
  MessageSquareQuote
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/lib/state/toast-context";
import { useCurrentWorkspace } from "@/lib/stores";

interface MentoringInsightsBoardProps {
  workspaceId: string;
}

export function MentoringInsightsBoard({ workspaceId }: MentoringInsightsBoardProps) {
  const { push } = useToast();
  const currentWorkspace = useCurrentWorkspace();
  const [insight, setInsight] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [stats, setStats] = useState({ totalTasks: 0, completedTasks: 0 });

  useEffect(() => {
    if (!workspaceId) return;
    const fetchStats = async () => {
      try {
        const res = await fetch(`/api/mentoring/tasks?workspaceId=${workspaceId}`);
        const data = await res.json();
        if (data.tasks) {
          const completed = data.tasks.filter((t: any) => t.status === 'done').length;
          setStats({ totalTasks: data.tasks.length, completedTasks: completed });
        }
      } catch (err) { console.error(err); }
    };
    fetchStats();
  }, [workspaceId]);

  const generateInsight = async () => {
    setIsGenerating(true);
    try {
      const response = await fetch("/api/ai/mentoring-insight", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          workspaceId,
          studentName: (currentWorkspace?.promptSettings as any)?.student_name,
          mentorName: (currentWorkspace?.promptSettings as any)?.mentor_name,
          mentoringGoal: (currentWorkspace?.promptSettings as any)?.mentoring_goal
        })
      });
      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.message || errData.error || "Erro ao gerar insights");
      }
      const data = await response.json();
      setInsight(data.insight);
      push({ title: "Insight Gerado", variant: "success" });
    } catch (err: any) {
      push({ title: err.message || "Erro ao gerar insight", variant: "destructive" });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="flex flex-col gap-8 max-w-4xl mx-auto py-4">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-gradient-to-br from-indigo-600 to-violet-600 text-white rounded-2xl shadow-xl shadow-indigo-100">
            <BrainCircuit className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Insights de Evolução</h2>
            <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Análise preditiva por IA</p>
          </div>
        </div>

        <button 
          onClick={generateInsight}
          disabled={isGenerating}
          className="flex items-center gap-2 px-6 py-3 bg-slate-900 hover:bg-black text-white rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all disabled:opacity-50 shadow-xl shadow-slate-200"
        >
          {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
          Gerar Novo Relatório
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex flex-col items-center text-center">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl mb-3">
            <TrendingUp className="w-5 h-5" />
          </div>
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Engajamento</span>
          <span className="text-2xl font-black text-slate-900">{stats.totalTasks > 0 ? Math.round((stats.completedTasks / stats.totalTasks) * 100) : 0}%</span>
        </div>
        <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex flex-col items-center text-center">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl mb-3">
            <Target className="w-5 h-5" />
          </div>
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Tarefas Concluídas</span>
          <span className="text-2xl font-black text-slate-900">{stats.completedTasks}/{stats.totalTasks}</span>
        </div>
        <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex flex-col items-center text-center">
          <div className="p-3 bg-amber-50 text-amber-600 rounded-xl mb-3">
            <Lightbulb className="w-5 h-5" />
          </div>
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Sugestões de IA</span>
          <span className="text-2xl font-black text-slate-900">{insight ? '1' : '0'}</span>
        </div>
      </div>

      {/* Insight Content */}
      <div className="bg-white rounded-[3rem] p-10 border border-slate-100 shadow-2xl shadow-slate-200/50 relative overflow-hidden min-h-[300px]">
        {isGenerating ? (
          <div className="flex flex-col items-center justify-center h-full py-20 gap-4">
            <div className="relative">
              <motion.div 
                animate={{ rotate: 360 }}
                transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                className="w-20 h-20 border-4 border-indigo-100 border-t-indigo-600 rounded-full"
              />
              <BrainCircuit className="w-8 h-8 text-indigo-600 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
            </div>
            <p className="text-sm font-black uppercase tracking-[0.2em] text-indigo-600 animate-pulse">Ade está analisando o progresso...</p>
          </div>
        ) : insight ? (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="prose prose-slate max-w-none"
          >
            <div className="flex items-center gap-3 mb-6">
               <MessageSquareQuote className="w-8 h-8 text-indigo-200" />
               <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight m-0">Análise do Mentor AI</h3>
            </div>
            <div className="text-slate-600 leading-relaxed font-medium text-lg whitespace-pre-wrap">
              {insight}
            </div>
            <div className="mt-10 p-6 bg-slate-50 rounded-2xl border border-slate-100">
               <h4 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-3">Recomendação Estratégica</h4>
               <p className="text-sm text-slate-900 font-bold">
                 Foque na próxima sessão em debloquear a tarefa de "Módulo de Vendas", onde o aluno teve mais dificuldade técnica.
               </p>
            </div>
          </motion.div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 gap-4 opacity-40">
            <Sparkles className="w-16 h-16 text-slate-200" />
            <div className="text-center">
              <p className="text-slate-500 font-black uppercase tracking-widest text-xs mb-1">Nenhum insight gerado ainda</p>
              <p className="text-slate-400 text-[10px] font-bold">Clique em "Gerar Novo Relatório" para começar a análise.</p>
            </div>
          </div>
        )}

        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50/50 rounded-bl-[5rem] -z-10" />
      </div>
    </div>
  );
}
