"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Plus, 
  Clock, 
  CheckCircle2, 
  Circle, 
  AlertCircle,
  Calendar,
  Layout,
  X,
  Youtube,
  FileText,
  Link,
  Target,
  Edit3,
  Sparkles,
  User,
  CheckSquare
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/lib/state/toast-context";

interface Task {
  _id: string;
  title: string;
  description?: string;
  status: 'todo' | 'doing' | 'approval' | 'done';
  dueDate?: string;
  importance?: number;
  assigneeId?: string;
  assigneeName?: string;
}

interface MentoringKanbanBoardProps {
  workspaceId: string;
  isOwner?: boolean;
  currentUserRole?: 'mentor' | 'mentee';
}

const COLUMNS = [
  { id: 'todo', label: 'A Fazer', color: 'bg-slate-100 text-slate-600 border-slate-200/60', icon: Circle },
  { id: 'doing', label: 'Em Andamento', color: 'bg-amber-100/80 text-amber-700 border-amber-200/40', icon: Clock },
  { id: 'approval', label: 'Aprovação', color: 'bg-indigo-100/80 text-indigo-700 border-indigo-200/40', icon: CheckSquare },
  { id: 'done', label: 'Concluído', color: 'bg-emerald-100/80 text-emerald-700 border-emerald-200/40', icon: CheckCircle2 },
];

export function MentoringKanbanBoard({ workspaceId, isOwner = false, currentUserRole = "mentor" }: MentoringKanbanBoardProps) {
  const { push } = useToast();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddingTask, setIsAddingTask] = useState<string | null>(null);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [activeColumnMobile, setActiveColumnMobile] = useState<'todo' | 'doing' | 'approval' | 'done'>('todo');

  // Members & Assignment state
  const [members, setMembers] = useState<any[]>([]);
  const [editAssigneeId, setEditAssigneeId] = useState("");
  const [editAssigneeName, setEditAssigneeName] = useState("");

  // Task Details Modal State
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editDueDate, setEditDueDate] = useState("");
  const [editImportance, setEditImportance] = useState<number>(0);
  const [isSavingTask, setIsSavingTask] = useState(false);
  const [editStatus, setEditStatus] = useState<'todo' | 'doing' | 'approval' | 'done'>('todo');

  const fetchTasks = async () => {
    try {
      const res = await fetch(`/api/mentoring/tasks?workspaceId=${workspaceId}`);
      const data = await res.json();
      if (data.tasks) setTasks(data.tasks);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchMembers = async () => {
    try {
      const res = await fetch(`/api/workspace/members?workspaceId=${workspaceId}`);
      const data = await res.json();
      if (data.members) setMembers(data.members);
    } catch (err) {
      console.error("Error fetching workspace members:", err);
    }
  };

  useEffect(() => {
    fetchTasks();
    fetchMembers();
  }, [workspaceId]);

  const handleAddTask = async (columnId: string) => {
    if (!newTaskTitle.trim()) return;

    try {
      const res = await fetch("/api/mentoring/tasks", {
        method: "POST",
        body: JSON.stringify({
          workspaceId,
          title: newTaskTitle,
          status: columnId,
          importance: 0 // Default to Side-quest
        })
      });

      if (res.ok) {
        setNewTaskTitle("");
        setIsAddingTask(null);
        fetchTasks();
        push({ title: "Tarefa criada com sucesso!", variant: "success" });
      }
    } catch (err) {
      push({ title: "Erro ao criar tarefa", variant: "destructive" });
    }
  };

  const handleUpdateStatus = async (taskId: string, newStatus: string) => {
    // Find the task in state to check its importance
    const task = tasks.find(t => t._id === taskId);
    if (!task) return;

    const isSideQuest = task.importance === 0;

    // A mentee (non-owner) can only move to 'done' if it is a side-quest (importance 0)
    if (!isOwner && newStatus === 'done' && !isSideQuest) {
      push({
        title: "Acesso Negado",
        description: "Apenas o Mentor pode marcar tarefas estratégicas como concluídas. Mova para 'Aprovação'.",
        variant: "destructive"
      });
      return;
    }

    try {
      const res = await fetch("/api/mentoring/tasks", {
        method: "PATCH",
        body: JSON.stringify({ taskId, status: newStatus })
      });

      if (res.ok) {
        setTasks(prev => prev.map(t => t._id === taskId ? { ...t, status: newStatus as any } : t));
      }
    } catch (err) {
      push({ title: "Erro ao atualizar status", variant: "destructive" });
    }
  };

  const handleOpenDetails = (task: Task) => {
    setSelectedTask(task);
    setEditTitle(task.title);
    setEditDescription(task.description || "");
    setEditDueDate(task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : "");
    setEditImportance(task.importance !== undefined ? task.importance : 0);
    setEditStatus(task.status);
    setEditAssigneeId(task.assigneeId || "");
    setEditAssigneeName(task.assigneeName || "");
  };

  const handleModalStatusChange = async (newStatus: 'todo' | 'doing' | 'approval' | 'done') => {
    if (!selectedTask) return;
    setEditStatus(newStatus);
    await handleUpdateStatus(selectedTask._id, newStatus);
    setSelectedTask(prev => prev ? { ...prev, status: newStatus } : null);
  };

  const handleSaveTaskDetails = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTask) return;

    const isSideQuest = selectedTask.importance === 0;
    if (!isOwner && !isSideQuest) {
      push({
        title: "Acesso Negado",
        description: "Mentees só podem editar Side-quests.",
        variant: "destructive"
      });
      return;
    }

    setIsSavingTask(true);
    try {
      const res = await fetch("/api/mentoring/tasks", {
        method: "PATCH",
        body: JSON.stringify({
          taskId: selectedTask._id,
          title: editTitle,
          description: editDescription,
          dueDate: editDueDate ? new Date(editDueDate) : null,
          importance: currentUserRole === "mentee" ? 0 : editImportance,
          assigneeId: editAssigneeId || null,
          assigneeName: editAssigneeName || null
        })
      });

      if (res.ok) {
        push({ title: "Tarefa atualizada com sucesso!", variant: "success" });
        setSelectedTask(null);
        fetchTasks();
      } else {
        throw new Error();
      }
    } catch (err) {
      push({ title: "Erro ao salvar alterações", variant: "destructive" });
    } finally {
      setIsSavingTask(false);
    }
  };

  // Helper to extract links from description for visual badges
  const getResourceLinks = (desc?: string) => {
    if (!desc) return { video: "", pdf: "" };
    
    // Simple regex or string parsing for our automated session creations
    const youtubeMatch = desc.match(/\[Vídeo do YouTube\]\(([^)]+)\)/i) || desc.match(/(https?:\/\/(?:www\.)?youtube\.com\/watch\?v=[^\s]+)/i);
    const pdfMatch = desc.match(/\[PDF \/ Material de Referência\]\(([^)]+)\)/i) || desc.match(/(https?:\/\/[^\s]+\.pdf|https?:\/\/drive\.google\.com\/[^\s]+)/i);

    return {
      video: youtubeMatch ? youtubeMatch[1] : "",
      pdf: pdfMatch ? pdfMatch[1] : ""
    };
  };

  return (
    <div className="flex flex-col gap-6 h-full min-h-[70vh]">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-indigo-600 text-white rounded-2xl shadow-lg shadow-indigo-100">
            <Layout className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">Kanban de Mentoria</h2>
            <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Acompanhamento de Evolução</p>
          </div>
        </div>
      </div>

      {/* Mobile Column Selector (Floating Switcher) */}
      <div className="flex md:hidden bg-slate-100 p-1.5 rounded-2xl gap-1.5 shadow-inner">
        {COLUMNS.map(col => {
          const Icon = col.icon;
          const isSel = activeColumnMobile === col.id;
          return (
            <button
              key={col.id}
              onClick={() => setActiveColumnMobile(col.id as any)}
              className={cn(
                "flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all cursor-pointer",
                isSel ? "bg-white text-indigo-600 shadow-md animate-in fade-in zoom-in-95 duration-200" : "text-slate-400 hover:text-slate-600"
              )}
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span>{col.label.split(' ')[0]}</span>
            </button>
          );
        })}
      </div>

      {/* Columns Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 h-full pb-10">
        {COLUMNS.map(column => {
          const isVisibleOnMobile = activeColumnMobile === column.id;
          
          return (
            <div 
              key={column.id} 
              className={cn(
                "flex flex-col gap-4 bg-slate-50/50 rounded-[2.5rem] p-4 border border-slate-100/50 transition-all min-h-[450px]",
                !isVisibleOnMobile ? "hidden md:flex" : "flex"
              )}
              onDragOver={(e) => {
                e.preventDefault();
                e.dataTransfer.dropEffect = "move";
              }}
              onDrop={(e: any) => {
                e.preventDefault();
                const taskId = e.dataTransfer.getData("text/plain") || (window as any).__draggedTaskId__;
                if (taskId) handleUpdateStatus(taskId, column.id);
              }}
            >
              {/* Column Header */}
              <div className="flex items-center justify-between px-3 py-2 border-b border-slate-100/20">
                <div className="flex items-center gap-2">
                  <div className={cn("px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border", column.color)}>
                    {column.label}
                  </div>
                  <span className="text-xs font-black text-slate-300 bg-slate-100/60 px-2 py-0.5 rounded-md">
                    {tasks.filter(t => t.status === column.id).length}
                  </span>
                </div>
                {isOwner && (
                  <button 
                    onClick={() => setIsAddingTask(column.id)}
                    className="p-1.5 hover:bg-white rounded-lg text-slate-400 hover:text-indigo-600 transition-all cursor-pointer"
                    title="Adicionar Tarefa"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Column Tasks Container */}
              <div className="flex-1 flex flex-col gap-3 overflow-y-auto max-h-[60vh] p-1">
                <AnimatePresence mode="popLayout">
                  {/* Inline Creation Input */}
                  {isAddingTask === column.id && (
                    <motion.div 
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className="bg-white p-4 rounded-3xl shadow-xl shadow-slate-200/50 border-2 border-indigo-100 flex flex-col gap-3"
                    >
                      <input 
                        autoFocus
                        placeholder="Título da tarefa..."
                        className="w-full text-sm font-bold text-slate-800 outline-none"
                        value={newTaskTitle}
                        onChange={(e) => setNewTaskTitle(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleAddTask(column.id)}
                      />
                      <div className="flex justify-end gap-2">
                        <button 
                          onClick={() => setIsAddingTask(null)}
                          className="px-3 py-1.5 text-[10px] font-black uppercase text-slate-400 hover:text-slate-600 cursor-pointer"
                        >
                          Cancelar
                        </button>
                        <button 
                          onClick={() => handleAddTask(column.id)}
                          className="px-4 py-1.5 bg-indigo-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest cursor-pointer shadow-md shadow-indigo-100"
                        >
                          Salvar
                        </button>
                      </div>
                    </motion.div>
                  )}

                  {/* Task Card List */}
                  {tasks
                    .filter(t => t.status === column.id)
                    .map(task => {
                      const { video, pdf } = getResourceLinks(task.description);
                      
                      return (
                        <div
                          key={task._id}
                          draggable={true}
                          onDragStart={(e: any) => {
                            e.dataTransfer.setData("text/plain", task._id);
                            e.dataTransfer.effectAllowed = "move";
                            (window as any).__draggedTaskId__ = task._id;
                          }}
                          onDragEnd={() => {
                            delete (window as any).__draggedTaskId__;
                          }}
                          className="group bg-white p-5 rounded-3xl shadow-sm border border-slate-100 hover:shadow-xl hover:shadow-indigo-100/30 hover:border-indigo-100 transition-all flex flex-col gap-3 cursor-grab active:cursor-grabbing hover:scale-[1.01] transition-transform duration-200"
                        >
                            <div className="flex items-start gap-3">
                              {/* Easy Checkbox Tap/Toggle */}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation(); // Avoid triggering details modal open
                                  const isSideQuest = task.importance === 0;
                                  if (task.status === 'done') {
                                    handleUpdateStatus(task._id, 'todo');
                                  } else {
                                    handleUpdateStatus(task._id, (isOwner || isSideQuest) ? 'done' : 'approval');
                                  }
                                }}
                                className="mt-0.5 shrink-0 text-slate-300 hover:text-indigo-600 transition-colors cursor-pointer"
                              >
                                {task.status === 'done' ? (
                                  <CheckCircle2 className="w-5 h-5 text-emerald-500 fill-emerald-50" />
                                ) : (
                                  <Circle className="w-5 h-5" />
                                )}
                              </button>

                              {/* Clickable Card Body opening details */}
                              <div 
                                onClick={() => handleOpenDetails(task)}
                                className="flex-1 min-w-0 cursor-pointer"
                              >
                                <h4 className={cn(
                                  "text-sm font-bold text-slate-800 leading-tight group-hover:text-indigo-600 transition-colors break-words",
                                  task.status === 'done' && "line-through text-slate-400"
                                )}>
                                  {task.title}
                                </h4>
                                {task.description && (
                                  <p className="text-xs text-slate-400 mt-1.5 line-clamp-2 leading-relaxed">
                                    {task.description.split('\n')[0]}
                                  </p>
                                )}
                              </div>
                            </div>

                            {/* Info row with Due Date & parsed quick access material tags */}
                            <div 
                              onClick={() => handleOpenDetails(task)}
                              className="flex items-center justify-between border-t border-slate-50 pt-3 cursor-pointer"
                            >
                              <div className="flex flex-wrap items-center gap-1.5">
                                {task.dueDate && (
                                  <div className="flex items-center gap-1 text-[10px] font-bold text-slate-400">
                                    <Calendar className="w-3.5 h-3.5" />
                                    <span>{new Date(task.dueDate).toLocaleDateString()}</span>
                                  </div>
                                )}

                                {task.importance !== undefined && task.importance > 0 ? (
                                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-700 text-[9px] font-black uppercase tracking-wider">
                                    <Sparkles className="w-2.5 h-2.5 text-amber-500 animate-pulse" />
                                    +{task.importance * 10} XP
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-slate-100 border border-slate-200/50 text-slate-500 text-[9px] font-bold">
                                    Side-Quest (0 XP)
                                  </span>
                                )}

                                {task.assigneeName && (
                                  <span className="text-[8.5px] font-black uppercase tracking-wider bg-indigo-50 border border-indigo-100 text-indigo-600 px-2 py-0.5 rounded-lg shrink-0 flex items-center gap-1">
                                    <User className="w-2.5 h-2.5 text-indigo-400" />
                                    {task.assigneeName.split(' ')[0]}
                                  </span>
                                )}
                              </div>

                              {/* Material Reference Indicator Badges */}
                              <div className="flex gap-1.5 shrink-0">
                                {video && <Youtube className="w-3.5 h-3.5 text-red-500 opacity-60" />}
                                {pdf && <FileText className="w-3.5 h-3.5 text-sky-500 opacity-60" />}
                              </div>
                            </div>
                        </div>
                      );
                    })}
                </AnimatePresence>

                {/* Vazio Screen */}
                {tasks.filter(t => t.status === column.id).length === 0 && !isAddingTask && (
                  <div className="flex flex-col items-center justify-center py-12 opacity-25">
                    <AlertCircle className="w-8 h-8 text-slate-400 mb-2" />
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Nenhuma tarefa</p>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Task Details Dialog Modal */}
      <AnimatePresence>
        {selectedTask && (
          <div className="fixed inset-0 z-[250] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-[2.5rem] w-full max-w-xl overflow-hidden border border-slate-100 shadow-2xl flex flex-col max-h-[85vh]"
            >
              {/* Header */}
              <div className="flex items-center justify-between px-8 py-6 border-b border-slate-100 bg-slate-50/50">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-indigo-600 text-white rounded-2xl">
                    <Layout className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight">Detalhes da Tarefa</h3>
                    <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Roteiro de Estudos & Metas</p>
                  </div>
                </div>
                <button 
                  onClick={() => setSelectedTask(null)}
                  className="p-2 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-600 transition-all cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Form / Details Content */}
              <form onSubmit={handleSaveTaskDetails} className="flex-1 overflow-y-auto px-8 py-6 flex flex-col gap-5">
                
                {/* Status Column Switcher (Manual Move) */}
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Coluna / Status da Tarefa</label>
                  <div className="grid grid-cols-4 gap-2 bg-slate-100 p-1.5 rounded-2xl border border-slate-200/20">
                    {COLUMNS.map(col => {
                      const Icon = col.icon;
                      const isSel = editStatus === col.id;
                      const isDoneCol = col.id === 'done';
                      const isSideQuest = selectedTask?.importance === 0;
                      const disabledForMentee = !isOwner && isDoneCol && !isSideQuest;

                      return (
                        <button
                          key={col.id}
                          type="button"
                          disabled={disabledForMentee}
                          onClick={() => handleModalStatusChange(col.id as any)}
                          className={cn(
                            "flex items-center justify-center gap-2 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-wider transition-all cursor-pointer",
                            isSel 
                              ? "bg-white text-indigo-600 shadow-md border-indigo-100 border animate-in fade-in zoom-in-95 duration-200" 
                              : "text-slate-400 hover:text-slate-600 hover:bg-slate-50/50",
                            disabledForMentee && "opacity-40 cursor-not-allowed"
                          )}
                        >
                          <Icon className="w-3.5 h-3.5 shrink-0" />
                          <span>{col.label.split(' ')[0]}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Title */}
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Título</label>
                  {(isOwner || (selectedTask?.importance === 0)) ? (
                    <input
                      required
                      type="text"
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200/50 rounded-2xl focus:ring-2 focus:ring-indigo-100 outline-none text-sm font-bold text-slate-800"
                    />
                  ) : (
                    <div className="px-4 py-3 bg-slate-50 rounded-2xl border border-slate-200/30 text-sm font-bold text-slate-800">
                      {selectedTask?.title}
                    </div>
                  )}
                </div>

                {/* Description */}
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Roteiro & Descrição</label>
                  {(isOwner || (selectedTask?.importance === 0)) ? (
                    <textarea
                      rows={5}
                      value={editDescription}
                      onChange={(e) => setEditDescription(e.target.value)}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200/50 rounded-2xl focus:ring-2 focus:ring-indigo-100 outline-none text-sm font-semibold text-slate-700 resize-none leading-relaxed"
                    />
                  ) : (
                    <div className="px-4 py-4 bg-slate-50 rounded-2xl border border-slate-200/30 text-sm font-semibold text-slate-700 leading-relaxed whitespace-pre-wrap max-h-60 overflow-y-auto">
                      {selectedTask?.description || "Nenhuma descrição detalhada informada."}
                    </div>
                  )}
                </div>

                {/* Assignee Selection */}
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Atribuído a</label>
                  {isOwner ? (
                    <select
                      value={editAssigneeId}
                      onChange={(e) => {
                        const val = e.target.value;
                        setEditAssigneeId(val);
                        const found = members.find(m => m.userId === val);
                        setEditAssigneeName(found ? found.name : "");
                      }}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200/50 rounded-2xl focus:ring-2 focus:ring-indigo-100 outline-none text-sm font-bold text-slate-800"
                    >
                      <option value="">Sem responsável / Não atribuído</option>
                      {members.map(m => (
                        <option key={m.userId} value={m.userId}>
                          {m.name} ({m.isOwner ? "Mentor" : "Mentorado"})
                        </option>
                      ))}
                    </select>
                  ) : (
                    <div className="px-4 py-3 bg-slate-50 rounded-2xl border border-slate-200/30 text-sm font-bold text-slate-800">
                      {editAssigneeName || "Não atribuído"}
                    </div>
                  )}
                </div>

                {/* Display Reference Badges (YouTube/PDFs parsed dynamically) */}
                {(() => {
                  const { video, pdf } = getResourceLinks(selectedTask?.description);
                  if (!video && !pdf) return null;

                  return (
                    <div className="bg-slate-50/60 p-5 rounded-[2rem] border border-slate-100 flex flex-col gap-3">
                      <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-1.5 mb-1">
                        <Target className="w-3.5 h-3.5 text-indigo-500" />
                        Materiais de Apoio & Referências
                      </h4>
                      <div className="flex flex-wrap gap-3">
                        {video && (
                          <a 
                            href={video} 
                            target="_blank" 
                            rel="noreferrer"
                            className="flex items-center gap-2 px-4 py-2.5 bg-red-50 hover:bg-red-100/70 border border-red-100 text-red-700 rounded-2xl text-[11px] font-bold transition-all cursor-pointer"
                          >
                            <Youtube className="w-4 h-4 shrink-0" />
                            Assistir Vídeo explicativo
                          </a>
                        )}
                        {pdf && (
                          <a 
                            href={pdf} 
                            target="_blank" 
                            rel="noreferrer"
                            className="flex items-center gap-2 px-4 py-2.5 bg-sky-50 hover:bg-sky-100/70 border border-sky-100 text-sky-700 rounded-2xl text-[11px] font-bold transition-all cursor-pointer"
                          >
                            <FileText className="w-4 h-4 shrink-0" />
                            Abrir Documento PDF
                          </a>
                        )}
                      </div>
                    </div>
                  );
                })()}

                {/* Due Date */}
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Data de Entrega / Prazo</label>
                  {(isOwner || (selectedTask?.importance === 0)) ? (
                    <input
                      type="date"
                      value={editDueDate}
                      onChange={(e) => setEditDueDate(e.target.value)}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200/50 rounded-2xl focus:ring-2 focus:ring-indigo-100 outline-none text-sm font-bold text-slate-800"
                    />
                  ) : (
                    <div className="px-4 py-3 bg-slate-50 rounded-2xl border border-slate-200/30 text-sm font-bold text-slate-800">
                      {selectedTask?.dueDate ? new Date(selectedTask.dueDate).toLocaleDateString('pt-BR') : "Sem prazo definido."}
                    </div>
                  )}
                </div>

                {/* Task Importance (0 to 10) */}
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                    Importância: {editImportance === 0 ? "Quest Secundária (Side-quest)" : `${editImportance} / 10`}
                  </label>
                  {isOwner ? (
                    currentUserRole === "mentor" ? (
                      <div className="flex flex-col gap-2">
                        <input
                          type="range"
                          min="0"
                          max="10"
                          value={editImportance}
                          onChange={(e) => setEditImportance(Number(e.target.value))}
                          className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                        />
                        <div className="flex justify-between text-[7px] font-black text-slate-400 uppercase tracking-widest mt-0.5">
                          <span>Side-quest (Valor 0)</span>
                          <span>Prioridade Máxima (Valor 10)</span>
                        </div>
                        <div className="text-[9px] font-bold text-amber-600 uppercase tracking-wide">
                          Recompensa: {editImportance * 10} XP
                        </div>
                      </div>
                    ) : (
                      <div className="px-4 py-3 bg-slate-50 rounded-2xl border border-slate-200/30 text-xs font-bold text-slate-500 leading-relaxed">
                        Como Mentorado, você pode apenas criar Side-quests (Importância zero, +0 XP).
                      </div>
                    )
                  ) : (
                    <div className="px-4 py-3 bg-slate-50 rounded-2xl border border-slate-200/30 text-sm font-bold text-slate-800">
                      {selectedTask?.importance === 0 || selectedTask?.importance === undefined
                        ? "Quest Secundária (Side-quest)"
                        : `★ Importância: ${selectedTask?.importance} de 10 (+${(selectedTask?.importance || 0) * 10} XP)`
                      }
                    </div>
                  )}
                </div>

                {/* Footer Buttons */}
                <div className="flex justify-end gap-3 mt-4 border-t border-slate-100 pt-6">
                  <button
                    type="button"
                    onClick={() => setSelectedTask(null)}
                    className="px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-600 transition-all cursor-pointer"
                  >
                    Fechar
                  </button>
                  {(isOwner || (selectedTask?.importance === 0)) && (
                    <button
                      type="submit"
                      disabled={isSavingTask}
                      className="px-8 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-indigo-100"
                    >
                      {isSavingTask ? "Salvando..." : "Salvar Alterações"}
                    </button>
                  )}
                </div>

              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
