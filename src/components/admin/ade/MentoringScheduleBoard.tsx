"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  CalendarDays, 
  Video, 
  Clock, 
  Plus, 
  ExternalLink,
  ChevronRight,
  Loader2,
  X,
  BookOpen,
  Youtube,
  Target,
  FileText,
  Settings,
  Edit3,
  Trash,
  Save,
  Bell
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/lib/state/toast-context";

interface Session {
  _id: string;
  title: string;
  description?: string;
  startAt: string;
  endAt: string;
  meetingUrl?: string;
  status: 'scheduled' | 'completed' | 'cancelled';
}

interface MentoringScheduleBoardProps {
  workspaceId: string;
  isOwner?: boolean;
}

const PRESETS = [
  {
    id: "welcome",
    label: "Boas-vindas",
    title: "Boas-vindas e Alinhamento Inicial",
    objective: "Recepção do aluno, alinhamento de expectativas e definição do cronograma inicial.",
    description: "Nesta primeira sessão, vamos nos conhecer, entender suas principais metas e estruturar os próximos passos da nossa jornada de mentoria.",
    videoUrl: "https://youtube.com/watch?v=welcome-mentoring",
    pdfUrl: "https://drive.google.com/welcome-guide.pdf",
    meetingUrl: "https://meet.google.com/abc-defg-hij"
  },
  {
    id: "initial",
    label: "Mentoria Inicial",
    title: "Sessão Estratégica Inicial",
    objective: "Mapeamento detalhado de desafios e definição das primeiras metas de curto prazo.",
    description: "Análise aprofundada do cenário atual do mentorado, levantamento de gargalos e criação do plano de ação imediato.",
    videoUrl: "https://youtube.com/watch?v=initial-mentoring",
    pdfUrl: "https://drive.google.com/initial-roadmap.pdf",
    meetingUrl: "https://meet.google.com/abc-defg-hij"
  },
  {
    id: "sales",
    label: "Apresentação Comercial",
    title: "Pitch e Apresentação Comercial",
    objective: "Refinamento do pitch de vendas e técnicas de abordagem comercial.",
    description: "Simulação de reuniões comerciais, feedback de postura e ajustes finos na proposta de valor.",
    videoUrl: "https://youtube.com/watch?v=sales-presentation",
    pdfUrl: "https://drive.google.com/sales-template.pdf",
    meetingUrl: "https://meet.google.com/abc-defg-hij"
  },
  {
    id: "session1",
    label: "Sessão 1: Diagnóstico e Baseline",
    title: "Sessão 1: Diagnóstico e Baseline",
    objective: "Estabelecimento do ponto de partida (baseline) e metas de longo prazo.",
    description: "Definição clara das métricas de sucesso e dos principais indicadores de performance (KPIs) para a mentoria.",
    videoUrl: "",
    pdfUrl: "",
    meetingUrl: "https://meet.google.com/abc-defg-hij"
  },
  {
    id: "session2",
    label: "Sessão 2: Plano de Execução",
    title: "Sessão 2: Plano de Execução",
    objective: "Estruturação detalhada das tarefas e processos de execução.",
    description: "Foco no desdobramento das metas em tarefas práticas de execução semanal e processos operacionais.",
    videoUrl: "",
    pdfUrl: "",
    meetingUrl: "https://meet.google.com/abc-defg-hij"
  }
];

export function MentoringScheduleBoard({ workspaceId, isOwner = false }: MentoringScheduleBoardProps) {
  const { push } = useToast();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPreset, setSelectedPreset] = useState("");
  const [title, setTitle] = useState("");
  const [objective, setObjective] = useState("");
  const [description, setDescription] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [pdfUrl, setPdfUrl] = useState("");
  const [meetingUrl, setMeetingUrl] = useState("");
  const [startAt, setStartAt] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  // Preset Customization State (Admin Role Only)
  const [customPresets, setCustomPresets] = useState<any[]>([]);
  const [isPresetsManageOpen, setIsPresetsManageOpen] = useState(false);
  
  // Preset Admin Form States
  const [editingPresetId, setEditingPresetId] = useState<string | null>(null);
  const [presetLabel, setPresetLabel] = useState("");
  const [presetTitle, setPresetTitle] = useState("");
  const [presetObjective, setPresetObjective] = useState("");
  const [presetDescription, setPresetDescription] = useState("");
  const [presetVideoUrl, setPresetVideoUrl] = useState("");
  const [presetPdfUrl, setPresetPdfUrl] = useState("");
  const [presetMeetingUrl, setPresetMeetingUrl] = useState("");
  const [isPresetSaving, setIsPresetSaving] = useState(false);

  // Direct Message States
  const [isMessageModalOpen, setIsMessageModalOpen] = useState(false);
  const [msgTitle, setMsgTitle] = useState("");
  const [msgBody, setMsgBody] = useState("");
  const [msgIcon, setMsgIcon] = useState("bell");
  const [isMsgSending, setIsMsgSending] = useState(false);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!msgTitle.trim() || !msgBody.trim()) return;

    setIsMsgSending(true);
    try {
      const res = await fetch("/api/mentoring/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workspaceId,
          recipientId: "all",
          title: msgTitle,
          message: msgBody,
          icon: msgIcon
        })
      });

      if (!res.ok) throw new Error("Failed to send message");
      push({ title: "Mensagem enviada com sucesso!", variant: "success" });
      setIsMessageModalOpen(false);
      setMsgTitle("");
      setMsgBody("");
      setMsgIcon("bell");
    } catch (err) {
      push({ title: "Erro ao enviar mensagem", variant: "destructive" });
    } finally {
      setIsMsgSending(false);
    }
  };

  const allPresets = [...PRESETS, ...customPresets];

  const fetchSessions = async () => {
    try {
      const res = await fetch(`/api/mentoring/sessions?workspaceId=${workspaceId}`);
      const data = await res.json();
      if (data.sessions) setSessions(data.sessions);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchPresets = async () => {
    try {
      const res = await fetch(`/api/mentoring/presets?workspaceId=${workspaceId}`);
      if (!res.ok) throw new Error("Failed to fetch custom presets");
      const data = await res.json();
      if (data.presets) setCustomPresets(data.presets);
    } catch (err) {
      console.error("Error loading mentoring presets:", err);
    }
  };

  useEffect(() => {
    fetchSessions();
    fetchPresets();
  }, [workspaceId]);

  const handlePresetChange = (presetId: string) => {
    setSelectedPreset(presetId);
    if (!presetId) return;
    const preset = allPresets.find(p => p.id === presetId);
    if (preset) {
      setTitle(preset.title);
      setObjective(preset.objective);
      setDescription(preset.description);
      setVideoUrl(preset.videoUrl || "");
      setPdfUrl(preset.pdfUrl || "");
      setMeetingUrl(preset.meetingUrl || "");
    }
  };

  const handleEditPreset = (preset: any) => {
    setEditingPresetId(preset.id);
    setPresetLabel(preset.label);
    setPresetTitle(preset.title);
    setPresetObjective(preset.objective || "");
    setPresetDescription(preset.description || "");
    setPresetVideoUrl(preset.videoUrl || "");
    setPresetPdfUrl(preset.pdfUrl || "");
    setPresetMeetingUrl(preset.meetingUrl || "");
  };

  const handleResetPresetForm = () => {
    setEditingPresetId(null);
    setPresetLabel("");
    setPresetTitle("");
    setPresetObjective("");
    setPresetDescription("");
    setPresetVideoUrl("");
    setPresetPdfUrl("");
    setPresetMeetingUrl("");
  };

  const handleSavePreset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!presetLabel.trim() || !presetTitle.trim()) return;

    setIsPresetSaving(true);
    try {
      const res = await fetch("/api/mentoring/presets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workspaceId,
          id: editingPresetId,
          label: presetLabel,
          title: presetTitle,
          objective: presetObjective,
          description: presetDescription,
          videoUrl: presetVideoUrl,
          pdfUrl: presetPdfUrl,
          meetingUrl: presetMeetingUrl
        })
      });

      if (!res.ok) throw new Error("Failed to save preset");
      push({ title: editingPresetId ? "Modelo atualizado com sucesso!" : "Modelo criado com sucesso!", variant: "success" });
      handleResetPresetForm();
      fetchPresets();
    } catch (err) {
      push({ title: "Erro ao salvar modelo", variant: "destructive" });
    } finally {
      setIsPresetSaving(false);
    }
  };

  const handleDeletePreset = async (presetId: string) => {
    if (!window.confirm("Deseja realmente excluir este modelo?")) return;

    try {
      const res = await fetch(`/api/mentoring/presets?workspaceId=${workspaceId}&id=${presetId}`, {
        method: "DELETE"
      });

      if (!res.ok) throw new Error("Failed to delete preset");
      push({ title: "Modelo excluído com sucesso!", variant: "success" });
      if (editingPresetId === presetId) {
        handleResetPresetForm();
      }
      fetchPresets();
    } catch (err) {
      push({ title: "Erro ao excluir modelo", variant: "destructive" });
    }
  };

  const handleSaveSession = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !startAt) return;

    setIsSaving(true);
    try {
      // 1. Compile structured fields into session description
      const fullDescription = `${description}\n\n### Metas e Referências\n- **Objetivo**: ${objective}\n${videoUrl ? `- **Vídeo de Referência**: ${videoUrl}\n` : ""}${pdfUrl ? `- **Material de Apoio (PDF)**: ${pdfUrl}\n` : ""}`;

      const res = await fetch("/api/mentoring/sessions", {
        method: "POST",
        body: JSON.stringify({
          workspaceId,
          title,
          description: fullDescription,
          startAt,
          meetingUrl
        })
      });

      if (!res.ok) throw new Error("Failed to schedule session");

      // 2. Automatically create task in Kanban
      const taskTitle = `Preparação: ${title}`;
      const taskDesc = `Tarefa automática criada para preparação da sessão de mentoria: "${title}".\n\n**Objetivo**: ${objective}\n\n**Materiais de Apoio**:\n${videoUrl ? `- [Vídeo do YouTube](${videoUrl})\n` : ""}${pdfUrl ? `- [PDF / Material de Referência](${pdfUrl})\n` : ""}`;

      await fetch("/api/mentoring/tasks", {
        method: "POST",
        body: JSON.stringify({
          workspaceId,
          title: taskTitle,
          description: taskDesc,
          dueDate: startAt,
          status: "todo"
        })
      });

      push({ title: "Sessão agendada & Tarefa criada no Kanban!", variant: "success" });
      setIsModalOpen(false);
      
      // Reset form
      setTitle("");
      setObjective("");
      setDescription("");
      setVideoUrl("");
      setPdfUrl("");
      setMeetingUrl("");
      setStartAt("");
      setSelectedPreset("");

      fetchSessions();
    } catch (err) {
      push({ title: "Erro ao agendar sessão", variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex flex-col gap-8 h-full">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-indigo-600 text-white rounded-2xl shadow-lg shadow-indigo-100">
            <CalendarDays className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">Agenda de Sessões</h2>
            <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Encontros síncronos agendados</p>
          </div>
        </div>
        
        {isOwner && (
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setIsMessageModalOpen(true)}
              className="flex items-center gap-2 px-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl text-[10px] font-black uppercase tracking-[0.1em] transition-all cursor-pointer hover:scale-[1.02]"
              type="button"
            >
              <Bell className="w-4 h-4" />
              Enviar Mensagem
            </button>
            <button 
              onClick={() => setIsModalOpen(true)}
              className="flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.1em] shadow-xl shadow-indigo-100 transition-all cursor-pointer hover:scale-[1.02]"
              type="button"
            >
              <Plus className="w-4 h-4" />
              Nova Sessão
            </button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sessions List (Span 2) */}
        <div className="lg:col-span-2 flex flex-col gap-4">
          <h3 className="px-2 text-[10px] font-black uppercase tracking-widest text-slate-400">Próximas Sessões</h3>
          
          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
            </div>
          ) : sessions.length === 0 ? (
            <div className="bg-slate-50 rounded-[2.5rem] p-12 flex flex-col items-center justify-center text-center gap-4 opacity-50 border border-dashed border-slate-200">
              <CalendarDays className="w-12 h-12 text-slate-300" />
              <p className="text-sm font-bold text-slate-500">Nenhuma sessão agendada para este workspace.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {sessions.map((session, index) => {
                // Parse references from description
                const lines = session.description?.split('\n') || [];
                const objLine = lines.find(l => l.includes('Objetivo**:'));
                const sessionObj = objLine ? objLine.replace('- **Objetivo**:', '').trim() : "";
                
                return (
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    key={session._id}
                    className="group bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-xl hover:shadow-indigo-100/50 hover:border-indigo-100 transition-all flex flex-col gap-4"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex gap-4">
                        <div className="flex flex-col items-center justify-center w-16 h-16 bg-slate-50 rounded-2xl group-hover:bg-indigo-600 group-hover:text-white transition-all shrink-0">
                          <span className="text-[10px] font-black uppercase tracking-widest opacity-60">
                            {new Date(session.startAt).toLocaleString('pt-BR', { month: 'short' })}
                          </span>
                          <span className="text-xl font-black">
                            {new Date(session.startAt).getDate()}
                          </span>
                        </div>
                        <div className="flex flex-col justify-center">
                          <h4 className="text-lg font-black text-slate-900 group-hover:text-indigo-600 transition-all leading-tight">
                            {session.title}
                          </h4>
                          <div className="flex items-center gap-3 mt-1">
                            <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400">
                              <Clock className="w-3.5 h-3.5" />
                              <span>{new Date(session.startAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
                            </div>
                            {session.meetingUrl && (
                              <div className="flex items-center gap-1.5 text-[10px] font-bold text-emerald-500 bg-emerald-50 px-2 py-0.5 rounded-full">
                                <Video className="w-3.5 h-3.5" />
                                <span>Online</span>
                              </div>
                            )}
                          </div>
                          
                          {/* Add to Calendar Quick-Links */}
                          <div className="flex items-center gap-2 mt-2 select-none">
                            <span className="text-[8px] font-black text-slate-400 uppercase tracking-wider">Adicionar à agenda:</span>
                            <a
                              href={`https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(session.title)}&dates=${new Date(session.startAt).toISOString().replace(/[-:]/g, "").split(".")[0] + "Z"}/${new Date(session.endAt || new Date(session.startAt).getTime() + 60 * 60 * 1000).toISOString().replace(/[-:]/g, "").split(".")[0] + "Z"}&details=${encodeURIComponent(session.description || "")}&location=${encodeURIComponent(session.meetingUrl || "")}`}
                              target="_blank"
                              rel="noreferrer"
                              className="text-[9px] font-bold text-indigo-600 hover:text-indigo-800 hover:underline transition-colors bg-indigo-50 px-2 py-0.5 rounded"
                              title="Google Agenda"
                            >
                              Google
                            </a>
                            <a
                              href={`https://outlook.live.com/calendar/0/deeplink/compose?path=/calendar/action/compose&rru=addevent&subject=${encodeURIComponent(session.title)}&startdt=${new Date(session.startAt).toISOString()}&enddt=${new Date(session.endAt || new Date(session.startAt).getTime() + 60 * 60 * 1000).toISOString()}&body=${encodeURIComponent(session.description || "")}&location=${encodeURIComponent(session.meetingUrl || "")}`}
                              target="_blank"
                              rel="noreferrer"
                              className="text-[9px] font-bold text-sky-600 hover:text-sky-800 hover:underline transition-colors bg-sky-50 px-2 py-0.5 rounded"
                              title="Outlook / Hotmail / iCal"
                            >
                              Outlook
                            </a>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center">
                        {session.meetingUrl ? (
                          <a 
                            href={session.meetingUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="p-4 bg-slate-50 group-hover:bg-indigo-600 group-hover:text-white rounded-2xl transition-all cursor-pointer shadow-sm"
                            title="Entrar na chamada"
                          >
                            <Video className="w-5 h-5" />
                          </a>
                        ) : (
                          <div className="p-4 text-slate-200">
                            <ChevronRight className="w-6 h-6" />
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Styled details in schedule card */}
                    {sessionObj && (
                      <div className="border-t border-slate-50 pt-3 flex flex-col gap-2">
                        <div className="flex items-start gap-2 text-xs text-slate-600 font-bold">
                          <Target className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" />
                          <span>{sessionObj}</span>
                        </div>
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>

        {/* Calendar Stats Area (Span 1) */}
        <div className="flex flex-col gap-6">
          <div className="bg-slate-900 rounded-[3rem] p-8 text-white relative overflow-hidden group shadow-2xl">
            <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/20 blur-[100px] rounded-full group-hover:bg-indigo-500/30 transition-all duration-700" />
            <div className="relative">
              <h3 className="text-xl font-black uppercase tracking-tight mb-2">Insight da Agenda</h3>
              <p className="text-slate-400 text-xs font-medium leading-relaxed mb-6 font-semibold">
                Você tem {sessions.length} sessões agendadas. Lembre-se de revisar os materiais de apoio e o roteiro antes de iniciar.
              </p>
              <div className="flex gap-4">
                 <div className="flex-1 p-4 bg-white/5 rounded-2xl border border-white/10 text-center">
                    <p className="text-[10px] font-black uppercase text-slate-500 tracking-widest mb-1">Total</p>
                    <p className="text-2xl font-black">{sessions.length}</p>
                 </div>
                 <div className="flex-1 p-4 bg-white/5 rounded-2xl border border-white/10 text-center">
                    <p className="text-[10px] font-black uppercase text-slate-500 tracking-widest mb-1">Mês</p>
                    <p className="text-2xl font-black">{sessions.filter(s => new Date(s.startAt).getMonth() === new Date().getMonth()).length}</p>
                 </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modern, Beautiful Scheduling Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[250] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-[2.5rem] w-full max-w-2xl overflow-hidden border border-slate-100 shadow-2xl flex flex-col max-h-[90vh]"
            >
              {/* Header */}
              <div className="flex items-center justify-between px-8 py-6 border-b border-slate-100 bg-slate-50/50">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-indigo-600 text-white rounded-2xl">
                    <CalendarDays className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight">Agendar Nova Sessão</h3>
                    <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Planejamento & Roteiro</p>
                  </div>
                </div>
                <button 
                  onClick={() => setIsModalOpen(false)}
                  className="p-2 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-600 transition-all cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Form Content */}
              <form onSubmit={handleSaveSession} className="flex-1 overflow-y-auto px-8 py-6 flex flex-col gap-5">
                
                {/* Predefined Templates */}
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Predefinições de Mentoria</label>
                    {isOwner && (
                      <button
                        type="button"
                        onClick={() => setIsPresetsManageOpen(true)}
                        className="text-[9px] font-black uppercase tracking-widest text-indigo-600 hover:text-indigo-800 transition-colors flex items-center gap-1 cursor-pointer"
                      >
                        ⚙️ Gerenciar Modelos
                      </button>
                    )}
                  </div>
                  <select
                    value={selectedPreset}
                    onChange={(e) => handlePresetChange(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200/50 rounded-2xl focus:ring-2 focus:ring-indigo-100 outline-none text-sm font-bold uppercase tracking-wider cursor-pointer text-slate-600"
                  >
                    <option value="">-- Personalizado (Em Branco) --</option>
                    {allPresets.map(preset => (
                      <option key={preset.id} value={preset.id}>
                        {preset.label} {preset.workspaceId ? "⭐" : ""}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Title */}
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Título da Sessão</label>
                  <input
                    required
                    type="text"
                    placeholder="Ex: Boas-vindas e Alinhamento"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200/50 rounded-2xl focus:ring-2 focus:ring-indigo-100 outline-none text-sm font-semibold text-slate-800"
                  />
                </div>

                {/* Objective */}
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Objetivo Principal</label>
                  <input
                    required
                    type="text"
                    placeholder="Qual é a meta deste encontro?"
                    value={objective}
                    onChange={(e) => setObjective(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200/50 rounded-2xl focus:ring-2 focus:ring-indigo-100 outline-none text-sm font-semibold text-slate-800"
                  />
                </div>

                {/* Description */}
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Roteiro / Descrição</label>
                  <textarea
                    rows={3}
                    placeholder="Tópicos que serão abordados na mentoria..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200/50 rounded-2xl focus:ring-2 focus:ring-indigo-100 outline-none text-sm font-semibold text-slate-800 resize-none"
                  />
                </div>

                {/* References (YouTube, PDF, Links) */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-1.5">
                      <Youtube className="w-3.5 h-3.5 text-red-500" />
                      Link de Vídeo (YouTube)
                    </label>
                    <input
                      type="url"
                      placeholder="https://youtube.com/watch?v=..."
                      value={videoUrl}
                      onChange={(e) => setVideoUrl(e.target.value)}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200/50 rounded-2xl focus:ring-2 focus:ring-indigo-100 outline-none text-sm font-semibold text-slate-800"
                    />
                  </div>

                  <div className="flex flex-col gap-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5 text-sky-500" />
                      Material de Apoio (PDF / Link)
                    </label>
                    <input
                      type="url"
                      placeholder="https://drive.google.com/..."
                      value={pdfUrl}
                      onChange={(e) => setPdfUrl(e.target.value)}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200/50 rounded-2xl focus:ring-2 focus:ring-indigo-100 outline-none text-sm font-semibold text-slate-800"
                    />
                  </div>
                </div>

                {/* Meeting URL & Start Date */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-1.5">
                      <Video className="w-3.5 h-3.5 text-emerald-500" />
                      Link da Chamada (Google Meet/Zoom)
                    </label>
                    <input
                      type="url"
                      placeholder="https://meet.google.com/..."
                      value={meetingUrl}
                      onChange={(e) => setMeetingUrl(e.target.value)}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200/50 rounded-2xl focus:ring-2 focus:ring-indigo-100 outline-none text-sm font-semibold text-slate-800"
                    />
                  </div>

                  <div className="flex flex-col gap-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Data & Horário de Início</label>
                    <input
                      required
                      type="datetime-local"
                      value={startAt}
                      onChange={(e) => setStartAt(e.target.value)}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200/50 rounded-2xl focus:ring-2 focus:ring-indigo-100 outline-none text-sm font-bold uppercase text-slate-800"
                    />
                  </div>
                </div>

                {/* Submit Action */}
                <div className="flex justify-end gap-3 mt-4 border-t border-slate-100 pt-6">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-600 transition-all cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="px-8 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-indigo-100"
                  >
                    {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                    <span>Confirmar Agendamento</span>
                  </button>
                </div>

              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Mentoring Templates Manager Modal */}
      <AnimatePresence>
        {isPresetsManageOpen && (
          <div className="fixed inset-0 z-[260] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-[2.5rem] w-full max-w-4xl overflow-hidden border border-slate-100 shadow-2xl flex flex-col max-h-[90vh]"
            >
              {/* Header */}
              <div className="flex items-center justify-between px-8 py-6 border-b border-slate-100 bg-slate-50/50">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-indigo-600 text-white rounded-2xl">
                    <Settings className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight">Gerenciar Predefinições de Mentoria</h3>
                    <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Painel do Administrador</p>
                  </div>
                </div>
                <button 
                  onClick={() => setIsPresetsManageOpen(false)}
                  className="p-2 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-600 transition-all cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Content Grid */}
              <div className="flex-1 overflow-hidden grid grid-cols-1 md:grid-cols-5 h-[65vh]">
                
                {/* Left Side: List of Templates (Span 2) */}
                <div className="md:col-span-2 border-r border-slate-100 overflow-y-auto p-6 flex flex-col gap-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Modelos Atuais</span>
                    <button
                      onClick={handleResetPresetForm}
                      className="text-[10px] font-black uppercase tracking-widest text-indigo-600 hover:text-indigo-800 transition-colors flex items-center gap-1 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" /> Criar Novo
                    </button>
                  </div>

                  {/* Default Templates (ReadOnly) */}
                  <div className="text-[9px] font-black uppercase text-slate-400 tracking-wider mb-1 mt-2">Modelos Padrão (Leitura)</div>
                  {PRESETS.map((preset) => (
                    <div 
                      key={preset.id}
                      className="p-3 bg-slate-50 rounded-xl border border-slate-200/30 flex items-center justify-between"
                    >
                      <span className="text-xs font-bold text-slate-700 truncate">{preset.label}</span>
                      <span className="text-[9px] font-bold text-slate-400 bg-slate-200/50 px-2 py-0.5 rounded">Padrão</span>
                    </div>
                  ))}

                  {/* Custom Templates (Editable) */}
                  <div className="text-[9px] font-black uppercase text-slate-400 tracking-wider mb-1 mt-4">Meus Modelos Customizados</div>
                  {customPresets.length === 0 ? (
                    <div className="text-center py-6 text-xs font-semibold text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                      Nenhum modelo customizado criado.
                    </div>
                  ) : (
                    customPresets.map((preset) => (
                      <div 
                        key={preset.id}
                        onClick={() => handleEditPreset(preset)}
                        className={cn(
                          "p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-all hover:bg-slate-50 group",
                          editingPresetId === preset.id ? "bg-indigo-50/50 border-indigo-200" : "bg-white border-slate-200/50"
                        )}
                      >
                        <div className="flex flex-col gap-0.5 min-w-0">
                          <span className="text-xs font-black text-slate-800 truncate">{preset.label}</span>
                          <span className="text-[9px] font-semibold text-slate-400 truncate">{preset.title}</span>
                        </div>
                        <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-all">
                          <button
                            onClick={(e) => { e.stopPropagation(); handleEditPreset(preset); }}
                            className="p-1 hover:bg-slate-200 rounded text-slate-500 hover:text-slate-700 cursor-pointer"
                            title="Editar"
                            type="button"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); handleDeletePreset(preset.id); }}
                            className="p-1 hover:bg-red-50 rounded text-red-500 hover:text-red-700 cursor-pointer"
                            title="Excluir"
                            type="button"
                          >
                            <Trash className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Right Side: Form (Span 3) */}
                <form onSubmit={handleSavePreset} className="md:col-span-3 overflow-y-auto p-8 flex flex-col gap-4">
                  <h4 className="text-xs font-black uppercase tracking-widest text-slate-800 border-b border-slate-100 pb-2">
                    {editingPresetId ? `Editar Modelo: ${presetLabel}` : "Criar Novo Modelo Customizado"}
                  </h4>

                  {/* Label & Title */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="flex flex-col gap-1.5 sm:col-span-1">
                      <label className="text-[9px] font-black uppercase tracking-widest text-slate-400">Nome (Curto)</label>
                      <input
                        required
                        type="text"
                        placeholder="Ex: Módulo 3"
                        value={presetLabel}
                        onChange={(e) => setPresetLabel(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200/50 rounded-xl outline-none text-xs font-bold text-slate-800 focus:ring-2 focus:ring-indigo-100"
                      />
                    </div>
                    <div className="flex flex-col gap-1.5 sm:col-span-2">
                      <label className="text-[9px] font-black uppercase tracking-widest text-slate-400">Título Principal</label>
                      <input
                        required
                        type="text"
                        placeholder="Ex: Sessão 3: Alinhamento de Metas"
                        value={presetTitle}
                        onChange={(e) => setPresetTitle(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200/50 rounded-xl outline-none text-xs font-bold text-slate-800 focus:ring-2 focus:ring-indigo-100"
                      />
                    </div>
                  </div>

                  {/* Objective */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[9px] font-black uppercase tracking-widest text-slate-400">Objetivo</label>
                    <input
                      type="text"
                      placeholder="Ex: Definir os KPIs principais do negócio..."
                      value={presetObjective}
                      onChange={(e) => setPresetObjective(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200/50 rounded-xl outline-none text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-indigo-100"
                    />
                  </div>

                  {/* Description */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[9px] font-black uppercase tracking-widest text-slate-400">Descrição / Roteiro da Mentoria</label>
                    <textarea
                      rows={3}
                      placeholder="Roteiro que será carregado automaticamente..."
                      value={presetDescription}
                      onChange={(e) => setPresetDescription(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200/50 rounded-xl outline-none text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-indigo-100 resize-none"
                    />
                  </div>

                  {/* References & Call Links */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[9px] font-black uppercase tracking-widest text-slate-400">Vídeo YouTube (Opcional)</label>
                      <input
                        type="url"
                        placeholder="https://youtube.com/watch?v=..."
                        value={presetVideoUrl}
                        onChange={(e) => setPresetVideoUrl(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200/50 rounded-xl outline-none text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-indigo-100"
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[9px] font-black uppercase tracking-widest text-slate-400">Material PDF (Opcional)</label>
                      <input
                        type="url"
                        placeholder="https://drive.google.com/..."
                        value={presetPdfUrl}
                        onChange={(e) => setPresetPdfUrl(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200/50 rounded-xl outline-none text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-indigo-100"
                      />
                    </div>
                  </div>

                  {/* Meeting URL */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[9px] font-black uppercase tracking-widest text-slate-400">Link Padrão da Chamada</label>
                    <input
                      type="url"
                      placeholder="https://meet.google.com/abc-defg-hij"
                      value={presetMeetingUrl}
                      onChange={(e) => setPresetMeetingUrl(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200/50 rounded-xl outline-none text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-indigo-100"
                    />
                  </div>

                  {/* Form Actions */}
                  <div className="flex justify-end gap-3 mt-4 border-t border-slate-100 pt-4">
                    {editingPresetId && (
                      <button
                        type="button"
                        onClick={handleResetPresetForm}
                        className="px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                      >
                        Limpar / Novo
                      </button>
                    )}
                    <button
                      type="submit"
                      disabled={isPresetSaving}
                      className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all disabled:opacity-50 flex items-center gap-2 cursor-pointer shadow-lg shadow-indigo-100"
                    >
                      {isPresetSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                      <span>{editingPresetId ? "Salvar Alterações" : "Criar Modelo"}</span>
                    </button>
                  </div>
                </form>

              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Workspace Direct Message Modal */}
      <AnimatePresence>
        {isMessageModalOpen && (
          <div className="fixed inset-0 z-[250] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-[2.5rem] w-full max-w-lg overflow-hidden border border-slate-100 shadow-2xl flex flex-col"
            >
              {/* Header */}
              <div className="flex items-center justify-between px-8 py-6 border-b border-slate-100 bg-slate-50/50">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-indigo-600 text-white rounded-2xl">
                    <Bell className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight">Enviar Mensagem ao Mentorado</h3>
                    <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Alerta Direto</p>
                  </div>
                </div>
                <button 
                  onClick={() => setIsMessageModalOpen(false)}
                  className="p-2 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-600 transition-all cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Form Content */}
              <form onSubmit={handleSendMessage} className="p-8 flex flex-col gap-4">
                <div className="flex flex-col gap-1.5 flex-1">
                  <label className="text-[9px] font-black uppercase tracking-widest text-slate-400">Assunto / Título</label>
                  <input
                    required
                    type="text"
                    placeholder="Ex: Lembrete importante sobre a mentoria"
                    value={msgTitle}
                    onChange={(e) => setMsgTitle(e.target.value)}
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200/50 rounded-xl outline-none text-xs font-bold text-slate-800 focus:ring-2 focus:ring-indigo-100"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[9px] font-black uppercase tracking-widest text-slate-400">Mensagem / Conteúdo</label>
                  <textarea
                    required
                    rows={4}
                    placeholder="Escreva a mensagem curta que será enviada diretamente para o sino de notificações do seu mentorado..."
                    value={msgBody}
                    onChange={(e) => setMsgBody(e.target.value)}
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200/50 rounded-xl outline-none text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-indigo-100 resize-none"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[9px] font-black uppercase tracking-widest text-slate-400">Ícone de Notificação</label>
                  <div className="flex gap-2">
                    {[
                      { val: "bell", label: "🔔 Geral" },
                      { val: "sparkles", label: "✨ Novidade" },
                      { val: "award", label: "🏆 Parabéns" },
                      { val: "alert", label: "⚠️ Alerta" }
                    ].map((ico) => (
                      <button
                        key={ico.val}
                        type="button"
                        onClick={() => setMsgIcon(ico.val)}
                        className={cn(
                          "px-3 py-1.5 rounded-xl border text-[10px] font-black uppercase transition-all cursor-pointer",
                          msgIcon === ico.val 
                            ? "bg-indigo-600 border-indigo-600 text-white shadow-md shadow-indigo-100" 
                            : "bg-slate-50 border-slate-200/50 text-slate-500 hover:bg-slate-100"
                        )}
                      >
                        {ico.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Form Actions */}
                <div className="flex justify-end gap-3 mt-4 border-t border-slate-100 pt-4">
                  <button
                    type="button"
                    onClick={() => setIsMessageModalOpen(false)}
                    className="px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={isMsgSending}
                    className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all disabled:opacity-50 flex items-center gap-2 cursor-pointer shadow-lg shadow-indigo-100"
                  >
                    {isMsgSending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                    <span>Enviar Mensagem</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
