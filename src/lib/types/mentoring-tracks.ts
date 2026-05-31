/**
 * Mentoring Tracks — Shared TypeScript Types
 * io_mentoring module | I/O AI SaaS Hub
 */

export type TaskCategory =
  | "reflection"
  | "research"
  | "planning"
  | "execution"
  | "emotional"
  | "strategy"
  | "review"
  | "career";

export const CATEGORY_CONFIG: Record<
  TaskCategory,
  { label: string; labelEn: string; color: string; bgColor: string; emoji: string }
> = {
  reflection: {
    label: "Reflexão",
    labelEn: "Reflection",
    color: "text-blue-700",
    bgColor: "bg-blue-100 border-blue-200",
    emoji: "💭",
  },
  research: {
    label: "Pesquisa",
    labelEn: "Research",
    color: "text-purple-700",
    bgColor: "bg-purple-100 border-purple-200",
    emoji: "🔍",
  },
  planning: {
    label: "Planejamento",
    labelEn: "Planning",
    color: "text-amber-700",
    bgColor: "bg-amber-100 border-amber-200",
    emoji: "📋",
  },
  execution: {
    label: "Execução",
    labelEn: "Execution",
    color: "text-green-700",
    bgColor: "bg-green-100 border-green-200",
    emoji: "✅",
  },
  emotional: {
    label: "Emocional",
    labelEn: "Emotional",
    color: "text-rose-700",
    bgColor: "bg-rose-100 border-rose-200",
    emoji: "❤️",
  },
  strategy: {
    label: "Estratégia",
    labelEn: "Strategy",
    color: "text-indigo-700",
    bgColor: "bg-indigo-100 border-indigo-200",
    emoji: "♟️",
  },
  review: {
    label: "Revisão",
    labelEn: "Review",
    color: "text-cyan-700",
    bgColor: "bg-cyan-100 border-cyan-200",
    emoji: "📖",
  },
  career: {
    label: "Carreira",
    labelEn: "Career",
    color: "text-orange-700",
    bgColor: "bg-orange-100 border-orange-200",
    emoji: "🎯",
  },
};

export const ALL_CATEGORIES: TaskCategory[] = [
  "reflection",
  "research",
  "planning",
  "execution",
  "emotional",
  "strategy",
  "review",
  "career",
];

// ---------------------------------------------------------------------------
// Track definition types
// ---------------------------------------------------------------------------

export interface TrackLevel {
  id: string;       // "reserva" | "titular" | "destaque" | "mvp"
  emoji: string;    // "🥉"
  name: string;     // "Reserva"
  minXP: number;    // 0
  maxXP: number | null; // null = sem teto (último nível)
}

export interface TrackTask {
  id: string;                 // "s1_t1"
  title: string;
  xp: number;                 // XP fixo ao completar
  category: TaskCategory;
  bonus: boolean;             // true = missão bônus opcional
}

export interface TrackSession {
  id: number;                 // 1, 2, 3...
  title: string;              // "Linha do tempo e sonhos"
  label: string;              // "Sessão 1 de 6"
  tag: string;                // "Sessão 1" — badge no Kanban
  totalBaseXP: number;        // soma XP tarefas não-bônus
  tasks: TrackTask[];
}

export interface MentoringTrack {
  _id?: string;
  workspaceId: string | null;         // null = template global
  createdByUserId: string | null;     // null = seed do sistema
  name: string;                       // "Temporada 2026"
  program: string;                    // "Aurora x Educandário"
  description: string;
  isGlobalTemplate: boolean;          // disponível para todos os workspaces
  unlockMode: "automatic" | "manual"; // desbloqueio de sessão
  levels: TrackLevel[];
  sessions: TrackSession[];
  totalSessions: number;
  createdAt?: Date;
  updatedAt?: Date;
}

// ---------------------------------------------------------------------------
// Enrollment types
// ---------------------------------------------------------------------------

export interface TaskProgress {
  taskId: string;             // "s1_t1" (trackTaskId)
  kanbanTaskId: string;       // _id da mentoring_tasks
  completedAt: Date | null;
  earnedXP: number;
}

export interface SessionProgress {
  sessionId: number;
  unlockedAt: Date | null;    // null = bloqueada
  completedAt: Date | null;   // encerrada pelo mentor ou automático
  kanbanTaskIds: string[];    // _ids das mentoring_tasks criadas
}

export interface MentoringTrackEnrollment {
  _id?: string;
  trackId: string;
  workspaceId: string;
  menteeUserId: string;
  mentorUserId: string;
  enrolledAt: Date;
  status: "active" | "completed" | "paused";
  currentLevelId: string;     // nível atual baseado em earnedXP
  earnedXP: number;           // XP total ganho nesta trilha
  sessionProgress: SessionProgress[];
  createdAt?: Date;
  updatedAt?: Date;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Resolve o nível atual com base no XP ganho na trilha */
export function resolveTrackLevel(
  earnedXP: number,
  levels: TrackLevel[]
): TrackLevel {
  const sorted = [...levels].sort((a, b) => b.minXP - a.minXP);
  return (
    sorted.find((l) => earnedXP >= l.minXP) ?? levels[0]
  );
}
