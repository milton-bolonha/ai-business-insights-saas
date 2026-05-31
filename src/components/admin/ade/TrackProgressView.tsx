"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Target, Lock, Unlock, CheckCircle2, Circle, Star,
  ChevronRight, Trophy, Loader2, ExternalLink, Award
} from "lucide-react";
import { cn } from "@/lib/utils";
import { CATEGORY_CONFIG, resolveTrackLevel } from "@/lib/types/mentoring-tracks";
import type { MentoringTrackEnrollment, MentoringTrack, SessionProgress } from "@/lib/types/mentoring-tracks";

interface TrackProgressViewProps {
  userId: string;
  workspaceId: string;
  locale?: string;
}

export function TrackProgressView({ userId, workspaceId, locale = "pt" }: TrackProgressViewProps) {
  const [enrollments, setEnrollments] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedEnrollmentId, setSelectedEnrollmentId] = useState<string | null>(null);
  const [detail, setDetail] = useState<{ enrollment: any; track: any } | null>(null);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);

  const fetchEnrollments = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await fetch(
        `/api/mentoring/enrollments?workspaceId=${workspaceId}&menteeUserId=${userId}`
      );
      if (res.ok) {
        const data = await res.json();
        setEnrollments(data.enrollments || []);
        // Auto-select first active enrollment
        const first = (data.enrollments || []).find((e: any) => e.status === "active");
        if (first) setSelectedEnrollmentId(first._id?.toString());
      }
    } finally {
      setIsLoading(false);
    }
  }, [userId, workspaceId]);

  const fetchDetail = useCallback(async (enrollmentId: string) => {
    try {
      setIsLoadingDetail(true);
      const res = await fetch(`/api/mentoring/enrollments/${enrollmentId}`);
      if (res.ok) {
        const data = await res.json();
        setDetail(data);
      }
    } finally {
      setIsLoadingDetail(false);
    }
  }, []);

  useEffect(() => { fetchEnrollments(); }, [fetchEnrollments]);
  useEffect(() => {
    if (selectedEnrollmentId) fetchDetail(selectedEnrollmentId);
  }, [selectedEnrollmentId, fetchDetail]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="w-5 h-5 animate-spin text-indigo-500" />
      </div>
    );
  }

  if (enrollments.length === 0) {
    return (
      <div className="text-center py-16 border-2 border-dashed border-slate-200 rounded-xl">
        <Target className="w-8 h-8 text-slate-300 mx-auto mb-3" />
        <p className="text-sm font-semibold text-slate-400">
          {locale === "pt"
            ? "Você ainda não está matriculado em nenhuma trilha"
            : "You are not enrolled in any tracks yet"}
        </p>
        <p className="text-xs text-slate-400 mt-1">
          {locale === "pt" ? "Aguarde seu mentor(a) te adicionar a uma trilha." : "Wait for your mentor to enroll you in a track."}
        </p>
      </div>
    );
  }

  const selectedEnrollment = enrollments.find(e => e._id?.toString() === selectedEnrollmentId);

  return (
    <div className="flex flex-col gap-5">
      {/* Header */}
      <div>
        <h3 className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-2">
          <Target className="w-4 h-4 text-indigo-500" />
          {locale === "pt" ? "Minhas Trilhas" : "My Tracks"}
        </h3>
        <p className="text-[11px] text-slate-400 font-semibold mt-0.5">
          {locale === "pt" ? "Seu progresso nas trilhas de mentoria" : "Your progress in mentoring tracks"}
        </p>
      </div>

      {/* Enrollment tabs — one per track */}
      {enrollments.length > 1 && (
        <div className="flex gap-2 flex-wrap">
          {enrollments.map(e => (
            <button
              key={e._id}
              onClick={() => setSelectedEnrollmentId(e._id?.toString())}
              className={cn(
                "text-xs font-bold px-3 py-1.5 rounded-full border transition-colors",
                selectedEnrollmentId === e._id?.toString()
                  ? "bg-indigo-600 border-indigo-600 text-white"
                  : "bg-white border-slate-200 text-slate-600 hover:border-indigo-300"
              )}
            >
              {e.trackName || locale === "pt" ? "Trilha" : "Track"} {e.trackProgram ? `— ${e.trackProgram}` : ""}
              {e.status === "completed" && " ✅"}
              {e.status === "paused" && " ⏸"}
            </button>
          ))}
        </div>
      )}

      {/* Selected enrollment detail */}
      {selectedEnrollment && (
        <EnrollmentDetail
          enrollment={selectedEnrollment}
          detail={detail}
          isLoadingDetail={isLoadingDetail}
          locale={locale}
        />
      )}
    </div>
  );
}

// ── Enrollment Detail ────────────────────────────────────────────────────────

function EnrollmentDetail({
  enrollment,
  detail,
  isLoadingDetail,
  locale,
}: {
  enrollment: any;
  detail: { enrollment: any; track: any } | null;
  isLoadingDetail: boolean;
  locale: string;
}) {
  const track = detail?.track || {};
  const detailedEnrollment = detail?.enrollment || enrollment;
  const levels: any[] = enrollment.trackLevels || track.levels || [];
  const currentLevel = resolveTrackLevel(enrollment.earnedXP || 0, levels);
  const nextLevelIdx = levels.findIndex(l => l.id === currentLevel?.id) + 1;
  const nextLevel = levels[nextLevelIdx] ?? null;
  const earnedXP = enrollment.earnedXP || 0;
  const xpToNext = nextLevel ? nextLevel.minXP - earnedXP : 0;
  const maxXP = levels.reduce((acc, l) => acc + (l.maxXP ? l.maxXP - l.minXP : 0), 0);

  // Overall progress bar from first level minXP to last level maxXP (or earnedXP cap)
  const levelMin = currentLevel?.minXP || 0;
  const levelMax = nextLevel?.minXP ?? (currentLevel?.maxXP ?? earnedXP);
  const progressPct = levelMax > levelMin
    ? Math.min(100, Math.round(((earnedXP - levelMin) / (levelMax - levelMin)) * 100))
    : 100;

  const sessionProgress: any[] = detailedEnrollment.sessionProgress || enrollment.sessionProgress || [];

  return (
    <div className="flex flex-col gap-5">
      {/* Track header */}
      <div className="bg-white border border-slate-100 rounded-xl p-5 shadow-sm">
        <div className="flex items-start gap-4 flex-wrap">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-black text-slate-900">{enrollment.trackName || track.name}</span>
              {enrollment.trackProgram && (
                <span className="text-[10px] font-bold bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">
                  {enrollment.trackProgram}
                </span>
              )}
              <span className={cn(
                "text-[10px] font-bold px-2 py-0.5 rounded-full",
                enrollment.status === "active"    && "bg-green-50 text-green-600 border border-green-100",
                enrollment.status === "completed" && "bg-indigo-50 text-indigo-600 border border-indigo-100",
                enrollment.status === "paused"    && "bg-amber-50 text-amber-600 border border-amber-100",
              )}>
                {enrollment.status === "active"    && (locale === "pt" ? "Ativa" : "Active")}
                {enrollment.status === "completed" && (locale === "pt" ? "Concluída" : "Completed")}
                {enrollment.status === "paused"    && (locale === "pt" ? "Pausada" : "Paused")}
              </span>
            </div>

            {/* Level indicator */}
            <div className="mt-3 flex items-center gap-3 flex-wrap">
              {currentLevel && (
                <div className="flex items-center gap-1.5">
                  <span className="text-xl">{currentLevel.emoji}</span>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-wider text-slate-500">
                      {locale === "pt" ? "Nível atual" : "Current level"}
                    </p>
                    <p className="text-sm font-black text-slate-800">{currentLevel.name}</p>
                  </div>
                </div>
              )}
              <div className="flex-1 min-w-[120px]">
                <div className="flex items-center justify-between text-[10px] font-bold text-slate-500 mb-1">
                  <span>{earnedXP} XP</span>
                  {nextLevel ? (
                    <span>{locale === "pt" ? `Próximo: ${nextLevel.emoji} ${nextLevel.name} (+${xpToNext} XP)` : `Next: ${nextLevel.emoji} ${nextLevel.name} (+${xpToNext} XP)`}</span>
                  ) : (
                    <span className="text-amber-600 font-bold">🏆 MVP!</span>
                  )}
                </div>
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 rounded-full transition-all duration-500"
                    style={{ width: `${progressPct}%` }}
                  />
                </div>
              </div>
            </div>

            {/* All level pills */}
            {levels.length > 0 && (
              <div className="flex items-center gap-1.5 mt-3 flex-wrap">
                {levels.map(l => (
                  <span
                    key={l.id}
                    className={cn(
                      "text-[10px] font-bold px-2 py-0.5 rounded-full border",
                      currentLevel?.id === l.id
                        ? "bg-indigo-600 text-white border-indigo-600"
                        : earnedXP >= l.minXP
                          ? "bg-green-50 text-green-700 border-green-100"
                          : "bg-slate-50 text-slate-400 border-slate-100"
                    )}
                  >
                    {l.emoji} {l.name}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Sessions timeline */}
      {isLoadingDetail ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-5 h-5 animate-spin text-indigo-500" />
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          <p className="text-[10px] font-black uppercase tracking-wider text-slate-500">
            {locale === "pt" ? "Progresso por Sessão" : "Session Progress"}
          </p>
          {sessionProgress.map((sp: any) => {
            const isUnlocked = !!sp.unlockedAt;
            const isComplete = !!sp.completedAt;
            const tasks: any[] = sp.tasks || [];
            const mandatory = tasks.filter((t: any) => !t.bonus);
            const bonus = tasks.filter((t: any) => t.bonus);
            const doneCount = mandatory.filter((t: any) => t.status === "done").length;
            const donePct = mandatory.length > 0 ? Math.round((doneCount / mandatory.length) * 100) : 0;
            const sessionXP = tasks.filter((t: any) => t.status === "done").reduce((acc: number, t: any) => acc + (t.xpFixed || 0), 0);

            // Find session template info
            const sessionTemplate = (detail?.track?.sessions || []).find((s: any) => s.id === sp.sessionId);
            const sessionTitle = sessionTemplate?.title || `Sessão ${sp.sessionId}`;
            const sessionTag = sessionTemplate?.tag || `Sessão ${sp.sessionId}`;

            return (
              <SessionCard
                key={sp.sessionId}
                sessionId={sp.sessionId}
                sessionTag={sessionTag}
                sessionTitle={sessionTitle}
                isUnlocked={isUnlocked}
                isComplete={isComplete}
                mandatory={mandatory}
                bonus={bonus}
                doneCount={doneCount}
                donePct={donePct}
                sessionXP={sessionXP}
                totalBaseXP={sessionTemplate?.totalBaseXP || 0}
                locale={locale}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Session Card ─────────────────────────────────────────────────────────────

function SessionCard({
  sessionId, sessionTag, sessionTitle, isUnlocked, isComplete,
  mandatory, bonus, doneCount, donePct, sessionXP, totalBaseXP, locale,
}: {
  sessionId: number; sessionTag: string; sessionTitle: string;
  isUnlocked: boolean; isComplete: boolean; mandatory: any[]; bonus: any[];
  doneCount: number; donePct: number; sessionXP: number; totalBaseXP: number;
  locale: string;
}) {
  const [expanded, setExpanded] = useState(isUnlocked && !isComplete);

  return (
    <div className={cn(
      "border rounded-xl overflow-hidden transition-all",
      isComplete  && "border-green-200 bg-green-50/30",
      isUnlocked && !isComplete && "border-indigo-200 bg-white",
      !isUnlocked && "border-slate-100 bg-slate-50/50 opacity-60",
    )}>
      {/* Session header */}
      <button
        onClick={() => isUnlocked && setExpanded(!expanded)}
        disabled={!isUnlocked}
        className="w-full flex items-center gap-3 px-4 py-3 text-left"
      >
        <div className={cn(
          "w-8 h-8 rounded-full flex items-center justify-center shrink-0",
          isComplete  && "bg-green-100",
          isUnlocked && !isComplete && "bg-indigo-100",
          !isUnlocked && "bg-slate-100",
        )}>
          {isComplete  && <CheckCircle2 className="w-4 h-4 text-green-600" />}
          {isUnlocked && !isComplete && <Unlock className="w-4 h-4 text-indigo-500" />}
          {!isUnlocked && <Lock className="w-4 h-4 text-slate-400" />}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-black text-slate-700">{sessionTag}</span>
            <span className="text-xs font-semibold text-slate-500">{sessionTitle}</span>
            {isComplete && (
              <span className="text-[10px] font-bold text-green-600 bg-green-50 border border-green-100 px-1.5 py-0.5 rounded-full">
                ✅ {locale === "pt" ? "Concluída" : "Complete"}
              </span>
            )}
          </div>
          {isUnlocked && (
            <div className="flex items-center gap-3 mt-1">
              {/* Progress bar */}
              <div className="flex-1 max-w-[120px]">
                <div className="h-1 bg-slate-200 rounded-full overflow-hidden">
                  <div
                    className={cn(
                      "h-full rounded-full transition-all",
                      isComplete ? "bg-green-500" : "bg-indigo-500"
                    )}
                    style={{ width: `${donePct}%` }}
                  />
                </div>
              </div>
              <span className="text-[10px] font-bold text-slate-500">
                {doneCount}/{mandatory.length} {locale === "pt" ? "tarefas" : "tasks"} · +{sessionXP} XP
              </span>
            </div>
          )}
        </div>
        {isUnlocked && (
          <ChevronRight className={cn("w-4 h-4 text-slate-400 transition-transform shrink-0", expanded && "rotate-90")} />
        )}
      </button>

      {/* Task list */}
      {isUnlocked && expanded && (
        <div className="px-4 pb-4 flex flex-col gap-1.5 border-t border-slate-100 pt-3">
          {mandatory.map((task: any) => (
            <TaskRow key={task._id || task.trackTaskId} task={task} locale={locale} />
          ))}
          {bonus.length > 0 && (
            <>
              <div className="flex items-center gap-2 mt-2 mb-1">
                <Star className="w-3 h-3 text-amber-500" />
                <span className="text-[10px] font-black uppercase tracking-wider text-amber-600">
                  {locale === "pt" ? "Missões Bônus" : "Bonus Missions"}
                </span>
              </div>
              {bonus.map((task: any) => (
                <TaskRow key={task._id || task.trackTaskId} task={task} locale={locale} isBonus />
              ))}
            </>
          )}
        </div>
      )}
    </div>
  );
}

// ── Task Row ─────────────────────────────────────────────────────────────────

function TaskRow({ task, locale, isBonus = false }: { task: any; locale: string; isBonus?: boolean }) {
  const isDone = task.status === "done";
  const cat = CATEGORY_CONFIG[task.category as keyof typeof CATEGORY_CONFIG];

  return (
    <div className={cn(
      "flex items-center gap-2.5 py-1.5 px-2 rounded-lg",
      isDone && "opacity-60",
      isBonus && "border border-amber-100 bg-amber-50/40",
    )}>
      {isDone
        ? <CheckCircle2 className="w-3.5 h-3.5 text-green-500 shrink-0" />
        : <Circle className="w-3.5 h-3.5 text-slate-300 shrink-0" />}

      {cat && (
        <span className={cn("text-[10px] font-bold px-1.5 py-0.5 rounded border shrink-0", cat.bgColor, cat.color)}>
          {cat.emoji}
        </span>
      )}
      <span className={cn("text-xs font-semibold flex-1 min-w-0 truncate", isDone && "line-through text-slate-400")}>
        {task.title}
      </span>
      {task.xpFixed !== undefined && task.xpFixed > 0 && (
        <span className={cn(
          "text-[10px] font-black shrink-0 px-1.5 py-0.5 rounded-full",
          isDone ? "bg-green-50 text-green-600" : "bg-amber-50 text-amber-600"
        )}>
          {isDone ? "+" : ""}{task.xpFixed} XP
        </span>
      )}
    </div>
  );
}
