"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Plus, Trash2, ChevronDown, ChevronRight, Save, Copy,
  Star, Lock, Unlock, CheckCircle2, Circle, Settings,
  Users, Loader2, Sparkles, Trophy, Target
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/lib/state/toast-context";
import { CATEGORY_CONFIG, ALL_CATEGORIES } from "@/lib/types/mentoring-tracks";
import type { MentoringTrack, TrackSession, TrackTask, TaskCategory, TrackLevel } from "@/lib/types/mentoring-tracks";

interface TrackBuilderBoardProps {
  workspaceId: string;
  locale?: string;
}

const DEFAULT_LEVELS: TrackLevel[] = [
  { id: "reserva",  emoji: "🥉", name: "Reserva",  minXP: 0,   maxXP: 60  },
  { id: "titular",  emoji: "🥈", name: "Titular",  minXP: 61,  maxXP: 130 },
  { id: "destaque", emoji: "🥇", name: "Destaque", minXP: 131, maxXP: 199 },
  { id: "mvp",      emoji: "🏆", name: "MVP",      minXP: 200, maxXP: null },
];

export function TrackBuilderBoard({ workspaceId, locale = "pt" }: TrackBuilderBoardProps) {
  const { push } = useToast();
  const [tracks, setTracks] = useState<MentoringTrack[]>([]);
  const [enrollments, setEnrollments] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTrack, setSelectedTrack] = useState<MentoringTrack | null>(null);
  const [view, setView] = useState<"list" | "create" | "edit" | "enroll">("list");
  const [expandedSessions, setExpandedSessions] = useState<Set<number>>(new Set([1]));
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state
  const [formName, setFormName] = useState("");
  const [formProgram, setFormProgram] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formUnlockMode, setFormUnlockMode] = useState<"automatic" | "manual">("automatic");
  const [formLevels, setFormLevels] = useState<TrackLevel[]>(DEFAULT_LEVELS);
  const [formSessions, setFormSessions] = useState<TrackSession[]>([]);

  // Enroll form
  const [enrollMenteeId, setEnrollMenteeId] = useState("");
  const [enrollMenteeName, setEnrollMenteeName] = useState("");
  const [enrollTrackId, setEnrollTrackId] = useState("");
  const [workspaceMembers, setWorkspaceMembers] = useState<any[]>([]);

  const fetchTracks = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await fetch(`/api/mentoring/tracks?workspaceId=${workspaceId}`);
      if (res.ok) {
        const data = await res.json();
        setTracks(data.tracks || []);
      }
    } finally {
      setIsLoading(false);
    }
  }, [workspaceId]);

  const fetchEnrollments = useCallback(async () => {
    try {
      const res = await fetch(`/api/mentoring/enrollments?workspaceId=${workspaceId}`);
      if (res.ok) {
        const data = await res.json();
        setEnrollments(data.enrollments || []);
      }
    } catch {}
  }, [workspaceId]);

  const fetchMembers = useCallback(async () => {
    try {
      const res = await fetch(`/api/workspaces/${workspaceId}/members`);
      if (res.ok) {
        const data = await res.json();
        setWorkspaceMembers(data.members || []);
      }
    } catch {}
  }, [workspaceId]);

  useEffect(() => {
    fetchTracks();
    fetchEnrollments();
    fetchMembers();
  }, [fetchTracks, fetchEnrollments, fetchMembers]);

  // ── Session helpers ──────────────────────────────────────────────────────

  const addSession = () => {
    const id = formSessions.length + 1;
    const total = formSessions.length + 1;
    const newSession: TrackSession = {
      id,
      title: `Sessão ${id}`,
      label: `Sessão ${id} de ${total}`,
      tag: `Sessão ${id}`,
      totalBaseXP: 0,
      tasks: [],
    };
    const updated = [
      ...formSessions.map((s, i) => ({ ...s, label: `Sessão ${i + 1} de ${total}` })),
      newSession,
    ];
    setFormSessions(updated);
    setExpandedSessions(new Set([...expandedSessions, id]));
  };

  const removeSession = (sessionId: number) => {
    const filtered = formSessions.filter(s => s.id !== sessionId);
    const renumbered = filtered.map((s, i) => ({
      ...s, id: i + 1,
      label: `Sessão ${i + 1} de ${filtered.length}`,
      tag: `Sessão ${i + 1}`,
    }));
    setFormSessions(renumbered);
  };

  const updateSession = (sessionId: number, field: string, value: any) => {
    setFormSessions(prev => prev.map(s => s.id === sessionId ? { ...s, [field]: value } : s));
  };

  const addTask = (sessionId: number) => {
    setFormSessions(prev => prev.map(s => {
      if (s.id !== sessionId) return s;
      const newTask: TrackTask = {
        id: `s${sessionId}_t${s.tasks.length + 1}`,
        title: "",
        xp: 15,
        category: "reflection",
        bonus: false,
      };
      const tasks = [...s.tasks, newTask];
      const totalBaseXP = tasks.filter(t => !t.bonus).reduce((acc, t) => acc + t.xp, 0);
      return { ...s, tasks, totalBaseXP };
    }));
  };

  const updateTask = (sessionId: number, taskId: string, field: string, value: any) => {
    setFormSessions(prev => prev.map(s => {
      if (s.id !== sessionId) return s;
      const tasks = s.tasks.map(t => t.id === taskId ? { ...t, [field]: value } : t);
      const totalBaseXP = tasks.filter(t => !t.bonus).reduce((acc, t) => acc + t.xp, 0);
      return { ...s, tasks, totalBaseXP };
    }));
  };

  const removeTask = (sessionId: number, taskId: string) => {
    setFormSessions(prev => prev.map(s => {
      if (s.id !== sessionId) return s;
      const tasks = s.tasks.filter(t => t.id !== taskId);
      const totalBaseXP = tasks.filter(t => !t.bonus).reduce((acc, t) => acc + t.xp, 0);
      return { ...s, tasks, totalBaseXP };
    }));
  };

  // ── Actions ──────────────────────────────────────────────────────────────

  const openCreate = () => {
    setFormName(""); setFormProgram(""); setFormDescription("");
    setFormUnlockMode("automatic"); setFormLevels(DEFAULT_LEVELS); setFormSessions([]);
    setView("create");
  };

  const openEdit = (track: MentoringTrack) => {
    setSelectedTrack(track);
    setFormName(track.name); setFormProgram(track.program);
    setFormDescription(track.description); setFormUnlockMode(track.unlockMode);
    setFormLevels(track.levels); setFormSessions(track.sessions);
    setView("edit");
  };

  const cloneTemplate = (track: MentoringTrack) => {
    setFormName(`${track.name} (cópia)`); setFormProgram(track.program);
    setFormDescription(track.description); setFormUnlockMode(track.unlockMode);
    setFormLevels(track.levels); setFormSessions(track.sessions);
    setView("create");
  };

  const handleSave = async () => {
    if (!formName || formSessions.length === 0) {
      push({ title: "Nome e pelo menos uma sessão são obrigatórios", variant: "destructive" });
      return;
    }
    setIsSubmitting(true);
    try {
      const isEdit = view === "edit" && selectedTrack?._id;
      const url = isEdit ? `/api/mentoring/tracks/${selectedTrack._id}` : "/api/mentoring/tracks";
      const method = isEdit ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workspaceId, name: formName, program: formProgram,
          description: formDescription, unlockMode: formUnlockMode,
          levels: formLevels, sessions: formSessions,
        }),
      });
      if (!res.ok) throw new Error();
      push({ title: isEdit ? "Trilha atualizada!" : "Trilha criada!", variant: "success" });
      await fetchTracks();
      setView("list");
    } catch {
      push({ title: "Erro ao salvar trilha", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (track: MentoringTrack) => {
    if (!window.confirm(`Excluir a trilha "${track.name}"?`)) return;
    try {
      const res = await fetch(`/api/mentoring/tracks/${track._id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      push({ title: "Trilha excluída", variant: "success" });
      fetchTracks();
    } catch (err: any) {
      push({ title: err.message || "Erro ao excluir", variant: "destructive" });
    }
  };

  const handleEnroll = async () => {
    if (!enrollTrackId || !enrollMenteeId) {
      push({ title: "Selecione a trilha e o mentorado", variant: "destructive" });
      return;
    }
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/mentoring/enrollments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          trackId: enrollTrackId, workspaceId,
          menteeUserId: enrollMenteeId, menteeUserName: enrollMenteeName,
        }),
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error);
      }
      push({ title: "Mentorado matriculado com sucesso!", variant: "success" });
      setView("list");
      fetchEnrollments();
    } catch (err: any) {
      push({ title: err.message || "Erro ao matricular", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Render ───────────────────────────────────────────────────────────────

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="w-6 h-6 animate-spin text-indigo-500" />
      </div>
    );
  }

  // LIST VIEW
  if (view === "list") {
    return (
      <div className="flex flex-col gap-6">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h3 className="text-sm font-black uppercase tracking-wider text-slate-800 flex items-center gap-2">
              <Target className="w-4 h-4 text-indigo-500" />
              {locale === "pt" ? "Trilhas de Mentoria" : "Mentoring Tracks"}
            </h3>
            <p className="text-[11px] text-slate-400 font-semibold mt-0.5">
              {locale === "pt" ? "Programas estruturados com sessões e tarefas de XP fixo" : "Structured programs with sessions and fixed XP tasks"}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setView("enroll")}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-indigo-700 bg-indigo-50 border border-indigo-100 rounded-lg hover:bg-indigo-100 transition-colors"
            >
              <Users className="w-3.5 h-3.5" />
              {locale === "pt" ? "Matricular" : "Enroll"}
            </button>
            <button
              onClick={openCreate}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              {locale === "pt" ? "Criar Trilha" : "Create Track"}
            </button>
          </div>
        </div>

        {/* Track cards */}
        {tracks.length === 0 ? (
          <div className="text-center py-16 border-2 border-dashed border-slate-200 rounded-xl">
            <Target className="w-8 h-8 text-slate-300 mx-auto mb-3" />
            <p className="text-sm font-semibold text-slate-400">
              {locale === "pt" ? "Nenhuma trilha criada ainda" : "No tracks created yet"}
            </p>
            <button onClick={openCreate} className="mt-3 text-xs font-bold text-indigo-600 hover:underline">
              {locale === "pt" ? "Criar primeira trilha" : "Create first track"}
            </button>
          </div>
        ) : (
          <div className="grid gap-4">
            {tracks.map((track) => {
              const trackEnrollments = enrollments.filter(e => e.trackId === track._id);
              const isGlobal = track.isGlobalTemplate;
              return (
                <div key={track._id} className="bg-white border border-slate-100 rounded-xl p-5 shadow-sm">
                  <div className="flex items-start justify-between gap-3 flex-wrap">
                    <div className="flex items-start gap-3">
                      <div className="w-9 h-9 rounded-lg bg-indigo-50 flex items-center justify-center shrink-0">
                        <Target className="w-4 h-4 text-indigo-600" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-bold text-slate-900">{track.name}</span>
                          {track.program && (
                            <span className="text-[10px] font-bold bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">
                              {track.program}
                            </span>
                          )}
                          {isGlobal && (
                            <span className="text-[10px] font-bold bg-amber-50 text-amber-600 border border-amber-100 px-2 py-0.5 rounded-full flex items-center gap-1">
                              <Sparkles className="w-2.5 h-2.5" /> Template Global
                            </span>
                          )}
                        </div>
                        {track.description && (
                          <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">{track.description}</p>
                        )}
                        <div className="flex items-center gap-3 mt-2 text-[10px] font-semibold text-slate-400">
                          <span>{track.totalSessions} sessões</span>
                          <span>{track.sessions?.reduce((acc, s) => acc + (s.totalBaseXP || 0), 0)} XP base</span>
                          <span className={cn(
                            "px-1.5 py-0.5 rounded-full",
                            track.unlockMode === "automatic"
                              ? "bg-green-50 text-green-600"
                              : "bg-amber-50 text-amber-600"
                          )}>
                            {track.unlockMode === "automatic" ? "🔄 Auto-unlock" : "🔑 Manual"}
                          </span>
                        </div>
                        {/* Level pills */}
                        <div className="flex items-center gap-1 mt-2 flex-wrap">
                          {track.levels?.map(l => (
                            <span key={l.id} className="text-[10px] font-bold bg-slate-50 border border-slate-100 text-slate-600 px-1.5 py-0.5 rounded-full">
                              {l.emoji} {l.name}
                            </span>
                          ))}
                        </div>
                        {/* Enrollments */}
                        {trackEnrollments.length > 0 && (
                          <p className="text-[10px] font-bold text-indigo-500 mt-2 flex items-center gap-1">
                            <Users className="w-3 h-3" /> {trackEnrollments.length} matrícula(s) ativa(s)
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => cloneTemplate(track)}
                        title="Clonar"
                        className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                      {!isGlobal && (
                        <>
                          <button
                            onClick={() => openEdit(track)}
                            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-50 rounded-lg transition-colors"
                          >
                            <Settings className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(track)}
                            className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  // ENROLL VIEW
  if (view === "enroll") {
    return (
      <div className="flex flex-col gap-6 max-w-lg">
        <div className="flex items-center gap-3">
          <button onClick={() => setView("list")} className="text-xs text-slate-400 hover:text-slate-700 font-bold">
            ← {locale === "pt" ? "Voltar" : "Back"}
          </button>
          <h3 className="text-sm font-black uppercase tracking-wider text-slate-800">
            {locale === "pt" ? "Matricular Mentorado" : "Enroll Mentee"}
          </h3>
        </div>

        <div className="bg-white border border-slate-100 rounded-xl p-6 shadow-sm flex flex-col gap-5">
          <div>
            <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 block mb-1.5">
              {locale === "pt" ? "Trilha" : "Track"}
            </label>
            <select
              value={enrollTrackId}
              onChange={e => setEnrollTrackId(e.target.value)}
              className="w-full text-sm font-semibold border border-slate-200 rounded-lg px-3 py-2 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-300"
            >
              <option value="">{locale === "pt" ? "Selecionar trilha..." : "Select track..."}</option>
              {tracks.map(t => (
                <option key={t._id} value={t._id}>
                  {t.name} {t.program ? `— ${t.program}` : ""} {t.isGlobalTemplate ? "(Template Global)" : ""}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 block mb-1.5">
              {locale === "pt" ? "ID do Mentorado" : "Mentee User ID"}
            </label>
            <input
              value={enrollMenteeId}
              onChange={e => setEnrollMenteeId(e.target.value)}
              placeholder="user_xxxxxxxx"
              className="w-full text-sm font-semibold border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-300"
            />
          </div>

          <div>
            <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 block mb-1.5">
              {locale === "pt" ? "Nome do Mentorado" : "Mentee Name"}
            </label>
            <input
              value={enrollMenteeName}
              onChange={e => setEnrollMenteeName(e.target.value)}
              placeholder="Nome completo"
              className="w-full text-sm font-semibold border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-300"
            />
          </div>

          <button
            onClick={handleEnroll}
            disabled={isSubmitting}
            className="w-full flex items-center justify-center gap-2 bg-indigo-600 text-white font-bold text-sm py-2.5 rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-60"
          >
            {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Users className="w-4 h-4" />}
            {locale === "pt" ? "Matricular" : "Enroll"}
          </button>
        </div>
      </div>
    );
  }

  // CREATE / EDIT VIEW
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <button onClick={() => setView("list")} className="text-xs text-slate-400 hover:text-slate-700 font-bold">
          ← {locale === "pt" ? "Voltar" : "Back"}
        </button>
        <h3 className="text-sm font-black uppercase tracking-wider text-slate-800">
          {view === "create"
            ? (locale === "pt" ? "Criar Nova Trilha" : "Create New Track")
            : (locale === "pt" ? "Editar Trilha" : "Edit Track")}
        </h3>
      </div>

      <div className="bg-white border border-slate-100 rounded-xl p-6 shadow-sm flex flex-col gap-6">
        {/* Basic info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 block mb-1.5">
              {locale === "pt" ? "Nome da Trilha" : "Track Name"} *
            </label>
            <input
              value={formName}
              onChange={e => setFormName(e.target.value)}
              placeholder="Temporada 2026"
              className="w-full text-sm font-semibold border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-300"
            />
          </div>
          <div>
            <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 block mb-1.5">
              {locale === "pt" ? "Programa" : "Program"}
            </label>
            <input
              value={formProgram}
              onChange={e => setFormProgram(e.target.value)}
              placeholder="Aurora x Educandário"
              className="w-full text-sm font-semibold border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-300"
            />
          </div>
        </div>

        <div>
          <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 block mb-1.5">
            {locale === "pt" ? "Descrição" : "Description"}
          </label>
          <textarea
            value={formDescription}
            onChange={e => setFormDescription(e.target.value)}
            rows={2}
            placeholder={locale === "pt" ? "Descreva o objetivo desta trilha..." : "Describe the purpose of this track..."}
            className="w-full text-sm font-semibold border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-300 resize-none"
          />
        </div>

        {/* Unlock mode */}
        <div>
          <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 block mb-2">
            {locale === "pt" ? "Modo de Desbloqueio de Sessão" : "Session Unlock Mode"}
          </label>
          <div className="flex gap-3">
            {(["automatic", "manual"] as const).map(mode => (
              <button
                key={mode}
                onClick={() => setFormUnlockMode(mode)}
                className={cn(
                  "flex-1 py-2 px-3 rounded-lg border text-xs font-bold transition-colors",
                  formUnlockMode === mode
                    ? "bg-indigo-600 border-indigo-600 text-white"
                    : "bg-white border-slate-200 text-slate-600 hover:border-indigo-300"
                )}
              >
                {mode === "automatic"
                  ? (locale === "pt" ? "🔄 Automático (padrão)" : "🔄 Automatic (default)")
                  : (locale === "pt" ? "🔑 Manual (mentor libera)" : "🔑 Manual (mentor unlocks)")}
              </button>
            ))}
          </div>
        </div>

        {/* Levels */}
        <div>
          <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 block mb-2">
            {locale === "pt" ? "Níveis da Trilha" : "Track Levels"}
          </label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {formLevels.map((level, idx) => (
              <div key={level.id} className="bg-slate-50 border border-slate-100 rounded-lg p-3 flex flex-col gap-2">
                <div className="flex items-center gap-1.5">
                  <span className="text-lg">{level.emoji}</span>
                  <input
                    value={level.name}
                    onChange={e => {
                      const updated = [...formLevels];
                      updated[idx] = { ...level, name: e.target.value };
                      setFormLevels(updated);
                    }}
                    className="flex-1 text-xs font-bold bg-transparent border-b border-slate-200 focus:outline-none focus:border-indigo-400"
                  />
                </div>
                <div className="flex items-center gap-1 text-[10px] text-slate-500">
                  <input
                    type="number"
                    value={level.minXP}
                    onChange={e => {
                      const updated = [...formLevels];
                      updated[idx] = { ...level, minXP: Number(e.target.value) };
                      setFormLevels(updated);
                    }}
                    className="w-14 text-xs font-bold bg-white border border-slate-200 rounded px-1.5 py-0.5"
                  />
                  <span>–</span>
                  <input
                    type="number"
                    value={level.maxXP ?? ""}
                    placeholder="∞"
                    onChange={e => {
                      const updated = [...formLevels];
                      updated[idx] = { ...level, maxXP: e.target.value ? Number(e.target.value) : null };
                      setFormLevels(updated);
                    }}
                    className="w-14 text-xs font-bold bg-white border border-slate-200 rounded px-1.5 py-0.5"
                  />
                  <span>XP</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Sessions */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <label className="text-[10px] font-black uppercase tracking-wider text-slate-500">
              {locale === "pt" ? `Sessões (${formSessions.length})` : `Sessions (${formSessions.length})`}
            </label>
            <button
              onClick={addSession}
              className="flex items-center gap-1 text-xs font-bold text-indigo-600 hover:text-indigo-800"
            >
              <Plus className="w-3.5 h-3.5" />
              {locale === "pt" ? "Adicionar Sessão" : "Add Session"}
            </button>
          </div>

          {formSessions.length === 0 ? (
            <div className="text-center py-8 border-2 border-dashed border-slate-200 rounded-xl text-xs text-slate-400 font-semibold">
              {locale === "pt" ? "Nenhuma sessão ainda. Clique em 'Adicionar Sessão'." : "No sessions yet. Click 'Add Session'."}
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {formSessions.map(session => {
                const isExpanded = expandedSessions.has(session.id);
                return (
                  <div key={session.id} className="border border-slate-200 rounded-xl overflow-hidden">
                    {/* Session header */}
                    <div
                      className="flex items-center justify-between px-4 py-3 bg-slate-50 cursor-pointer"
                      onClick={() => {
                        const next = new Set(expandedSessions);
                        isExpanded ? next.delete(session.id) : next.add(session.id);
                        setExpandedSessions(next);
                      }}
                    >
                      <div className="flex items-center gap-2">
                        {isExpanded ? <ChevronDown className="w-3.5 h-3.5 text-slate-400" /> : <ChevronRight className="w-3.5 h-3.5 text-slate-400" />}
                        <span className="text-xs font-bold text-slate-700">{session.label}</span>
                        <input
                          value={session.title}
                          onChange={e => { e.stopPropagation(); updateSession(session.id, "title", e.target.value); }}
                          onClick={e => e.stopPropagation()}
                          className="text-xs font-semibold text-slate-600 bg-transparent border-b border-slate-200 focus:outline-none focus:border-indigo-400 ml-1"
                          placeholder="Título da sessão"
                        />
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-[10px] font-bold text-indigo-500">{session.totalBaseXP} XP base</span>
                        <button
                          onClick={e => { e.stopPropagation(); removeSession(session.id); }}
                          className="text-red-400 hover:text-red-600 p-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Tasks */}
                    {isExpanded && (
                      <div className="p-4 flex flex-col gap-2">
                        {session.tasks.map(task => (
                          <div key={task.id} className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm">{CATEGORY_CONFIG[task.category]?.emoji}</span>
                            <input
                              value={task.title}
                              onChange={e => updateTask(session.id, task.id, "title", e.target.value)}
                              placeholder={locale === "pt" ? "Título da tarefa..." : "Task title..."}
                              className="flex-1 min-w-[160px] text-xs font-semibold border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                            />
                            <select
                              value={task.category}
                              onChange={e => updateTask(session.id, task.id, "category", e.target.value as TaskCategory)}
                              className="text-xs font-bold border border-slate-200 rounded-lg px-2 py-1.5 bg-white"
                            >
                              {ALL_CATEGORIES.map(cat => (
                                <option key={cat} value={cat}>
                                  {CATEGORY_CONFIG[cat].emoji} {CATEGORY_CONFIG[cat].label}
                                </option>
                              ))}
                            </select>
                            <div className="flex items-center gap-1">
                              <input
                                type="number"
                                value={task.xp}
                                onChange={e => updateTask(session.id, task.id, "xp", Number(e.target.value))}
                                className="w-14 text-xs font-bold border border-slate-200 rounded-lg px-2 py-1.5 text-center"
                              />
                              <span className="text-[10px] font-bold text-slate-400">XP</span>
                            </div>
                            <button
                              onClick={() => updateTask(session.id, task.id, "bonus", !task.bonus)}
                              title={task.bonus ? "Missão bônus" : "Tarefa normal"}
                              className={cn(
                                "p-1.5 rounded-lg border text-[10px] font-bold transition-colors",
                                task.bonus
                                  ? "bg-amber-50 border-amber-200 text-amber-600"
                                  : "bg-slate-50 border-slate-200 text-slate-400"
                              )}
                            >
                              <Star className="w-3 h-3" />
                            </button>
                            <button
                              onClick={() => removeTask(session.id, task.id)}
                              className="text-red-400 hover:text-red-600 p-1"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        ))}
                        <button
                          onClick={() => addTask(session.id)}
                          className="mt-1 text-xs font-bold text-indigo-500 hover:text-indigo-700 flex items-center gap-1 self-start"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          {locale === "pt" ? "Adicionar tarefa" : "Add task"}
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Save */}
        <div className="flex justify-end gap-3 pt-2 border-t border-slate-100">
          <button onClick={() => setView("list")} className="px-4 py-2 text-sm font-bold text-slate-600 hover:text-slate-900">
            {locale === "pt" ? "Cancelar" : "Cancel"}
          </button>
          <button
            onClick={handleSave}
            disabled={isSubmitting}
            className="flex items-center gap-2 px-5 py-2 text-sm font-bold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-60 transition-colors"
          >
            {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {view === "create"
              ? (locale === "pt" ? "Criar Trilha" : "Create Track")
              : (locale === "pt" ? "Salvar Alterações" : "Save Changes")}
          </button>
        </div>
      </div>
    </div>
  );
}
