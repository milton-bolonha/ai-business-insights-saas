"use client";

import { useState, useEffect } from "react";
import {
  User,
  Linkedin,
  Mail,
  Sparkles,
  Award,
  Target,
  Heart,
  Briefcase,
  Bookmark,
  TrendingUp,
  Edit3,
  Save,
  Sliders,
  Loader2,
  CloudLightning,
  CheckCircle2,
  Github,
  Instagram,
  Globe,
  Phone,
  MessageCircle,
  Pocket,
  BookOpen,
  ClipboardList,
  CalendarDays,
  Activity,
  Gamepad2,
  Shield,
  Crown,
  Lightbulb,
  ChevronRight,
  TrendingDown,
  Info,
  Star,
  Plus,
  Trash,
  Image,
  UploadCloud,
} from "lucide-react";
import { useToast } from "@/lib/state/toast-context";
import { cn } from "@/lib/utils";
import { uploadToCloudinary } from "@/lib/services/cloudinary";
import { useAuthStore } from "@/lib/stores/authStore";
import { useUser } from "@clerk/nextjs";
import { useTranslation } from "@/lib/hooks/useTranslation";
import dynamic from "next/dynamic";

const MentoringKanbanBoard = dynamic(
  () => import("./MentoringKanbanBoard").then((m) => m.MentoringKanbanBoard),
  {
    loading: () => (
      <div className="flex items-center justify-center p-12 text-xs font-bold text-slate-400">
        Carregando Kanban...
      </div>
    ),
    ssr: false,
  }
);

const MentoringScheduleBoard = dynamic(
  () => import("./MentoringScheduleBoard").then((m) => m.MentoringScheduleBoard),
  {
    loading: () => (
      <div className="flex items-center justify-center p-12 text-xs font-bold text-slate-400">
        Carregando Agenda...
      </div>
    ),
    ssr: false,
  }
);

const TrackBuilderBoard = dynamic(
  () => import("./TrackBuilderBoard").then((m) => m.TrackBuilderBoard),
  {
    loading: () => (
      <div className="flex items-center justify-center p-12 text-xs font-bold text-slate-400">
        Carregando Trilhas...
      </div>
    ),
    ssr: false,
  }
);

const TrackProgressView = dynamic(
  () => import("./TrackProgressView").then((m) => m.TrackProgressView),
  {
    loading: () => (
      <div className="flex items-center justify-center p-12 text-xs font-bold text-slate-400">
        Carregando Progresso da Trilha...
      </div>
    ),
    ssr: false,
  }
);

interface MentoringProfileBoardProps {
  userId?: string;
  isOwner?: boolean;
  workspaceId?: string; // Passed from workspace context
}

export function MentoringProfileBoard({
  userId,
  isOwner = true,
  workspaceId,
}: MentoringProfileBoardProps) {
  const { t, locale } = useTranslation();
  const { push } = useToast();
  const { user: clerkUser } = useUser();
  const authUser = useAuthStore((state) => state.user);
  const [activeSubTab, setActiveSubTab] = useState<"portfolio" | "edit">(
    "portfolio",
  );
  const [mentoringSubTab, setMentoringSubTab] = useState<
    | "dashboard"
    | "inventory"
    | "diary"
    | "tasks"
    | "schedule"
    | "projects"
    | "admin_controls"
    | "tracks"
  >("dashboard");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [viewMode, setViewMode] = useState<"owner" | "public" | "tracking">(
    "owner",
  );
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Next session date inside gamer HUD
  const [nextSessionDate, setNextSessionDate] = useState<string | null>(null);

  const fetchNextSession = async () => {
    if (!workspaceId) return;
    try {
      const res = await fetch(
        `/api/mentoring/sessions?workspaceId=${workspaceId}`,
      );
      if (res.ok) {
        const data = await res.json();
        if (data.sessions && data.sessions.length > 0) {
          const futureSessions = data.sessions
            .filter(
              (s: any) =>
                new Date(s.startAt) >= new Date() && s.status !== "cancelled",
            )
            .sort(
              (a: any, b: any) =>
                new Date(a.startAt).getTime() - new Date(b.startAt).getTime(),
            );

          if (futureSessions.length > 0) {
            const nextSess = futureSessions[0];
            const dateObj = new Date(nextSess.startAt);
            const formattedDate =
              dateObj.toLocaleDateString("pt-BR", {
                day: "2-digit",
                month: "2-digit",
              }) +
              " - " +
              dateObj.toLocaleTimeString("pt-BR", {
                hour: "2-digit",
                minute: "2-digit",
              });
            setNextSessionDate(formattedDate);
          } else {
            setNextSessionDate(null);
          }
        }
      }
    } catch (err) {
      console.error("Error fetching next session:", err);
    }
  };

  // Admin / Mentor Gamification & Algorithm Controls
  const [taskXpWeight, setTaskXpWeight] = useState(150);
  const [diaryXpWeight, setDiaryXpWeight] = useState(200);
  const [sessionXpWeight, setSessionXpWeight] = useState(300);
  const [burnoutThreshold, setBurnoutThreshold] = useState(1.3);

  // Custom Session Templates
  const [sessionTemplates, setSessionTemplates] = useState([
    {
      id: "1",
      title: "Kickoff de Alinhamento",
      duration: 60,
      desc: "Primeira sessão de mapeamento de objetivos.",
    },
    {
      id: "2",
      title: "Aceleração Operacional",
      duration: 45,
      desc: "Revisão e desbloqueio de gargalos cognitivos.",
    },
    {
      id: "3",
      title: "Alinhamento Estratégico",
      duration: 60,
      desc: "Definição de objetivos de trimestre e carreira.",
    },
  ]);
  const [newTemplateTitle, setNewTemplateTitle] = useState("");
  const [newTemplateDuration, setNewTemplateDuration] = useState(60);
  const [newTemplateDesc, setNewTemplateDesc] = useState("");

  // Nomenclaturas Chaves
  const [termDiary, setTermDiary] = useState(
    locale === "pt" ? "Diário de Bordo" : "Logbook",
  );
  const [termTension, setTermTension] = useState(
    locale === "pt" ? "Tensão Cognitiva" : "Cognitive Tension",
  );
  const [termDistortion, setTermDistortion] = useState(
    locale === "pt" ? "Distorção Cognitiva" : "Cognitive Distortion",
  );
  const [termStyle, setTermStyle] = useState(
    locale === "pt" ? "Estilo Pessoal" : "Personal Style",
  );
  const [termSidequest, setTermSidequest] = useState("Side-quest");

  useEffect(() => {
    setTermDiary(locale === "pt" ? "Diário de Bordo" : "Logbook");
    setTermTension(locale === "pt" ? "Tensão Cognitiva" : "Cognitive Tension");
    setTermDistortion(
      locale === "pt" ? "Distorção Cognitiva" : "Cognitive Distortion",
    );
    setTermStyle(locale === "pt" ? "Estilo Pessoal" : "Personal Style");
  }, [locale]);

  // Profile Fields State
  const [role, setRole] = useState<"mentor" | "mentee">(
    isOwner ? "mentor" : "mentee",
  );
  const [name, setName] = useState("");
  const [photoUrl, setPhotoUrl] = useState("");
  const [tagline, setTagline] = useState("");
  const [miniBio, setMiniBio] = useState("");
  const [skills, setSkills] = useState<string[]>([]);
  const [newSkill, setNewSkill] = useState("");
  const [experience, setExperience] = useState("");
  const [linkedinUrl, setLinkedinUrl] = useState("");
  const [username, setUsername] = useState("");
  const [motivationalQuote, setMotivationalQuote] = useState("");
  const [menteesCount, setMenteesCount] = useState(0);
  const [isSecretaryExpanded, setIsSecretaryExpanded] = useState(false);

  // Contacts and Social Networks
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [githubUrl, setGithubUrl] = useState("");
  const [instagramUrl, setInstagramUrl] = useState("");
  const [websiteUrl, setWebsiteUrl] = useState("");

  // Upload and LinkedIn Import states
  const [isUploading, setIsUploading] = useState(false);
  const [linkedinStage, setLinkedinStage] = useState<
    "idle" | "connecting" | "extracting" | "populating" | "done"
  >("idle");

  // Mentee-specific states
  const [personalGoal, setPersonalGoal] = useState("");
  const [careerGoal, setCareerGoal] = useState("");
  const [futureVision, setFutureVision] = useState("");
  const [attributes, setAttributes] = useState<string[]>(["", "", ""]);
  const [achievements, setAchievements] = useState<string[]>(["", "", ""]);
  const [familyGroup, setFamilyGroup] = useState("");
  const [greatestAttribute, setGreatestAttribute] = useState("");
  const [hobbies, setHobbies] = useState("");
  const [mentorshipExpectations, setMentorshipExpectations] = useState("");
  const [shortTermGoals, setShortTermGoals] = useState("");
  const [mediumTermGoals, setMediumTermGoals] = useState("");
  const [professionalDream, setProfessionalDream] = useState("");
  const [genderTerm, setGenderTerm] = useState("mentorado");

  // AI Secretary States
  const [isSecretaryOpen, setIsSecretaryOpen] = useState(false);
  const [isGeneratingSecretary, setIsGeneratingSecretary] = useState(false);
  const [secretaryText, setSecretaryText] = useState("");
  const [secretaryHistory, setSecretaryHistory] = useState<any[]>([]);

  // Projects list state
  const [projects, setProjects] = useState<any[]>([]);

  // Project Form States
  const [editingProjectId, setEditingProjectId] = useState<string | null>(null);
  const [projectTitle, setProjectTitle] = useState("");
  const [projectDescription, setProjectDescription] = useState("");
  const [projectImageUrl, setProjectImageUrl] = useState("");
  const [projectTagsString, setProjectTagsString] = useState("");
  const [isProjectFormOpen, setIsProjectFormOpen] = useState(false);
  const [featuredProjectIds, setFeaturedProjectIds] = useState<string[]>([]);

  // Gamification & Cognitive State Declared
  const [xp, setXp] = useState(0);
  const [equippedGear, setEquippedGear] = useState<Record<string, string>>({
    jacket: "Jaqueta Corta-Vento Minimalist",
    sneakers: "Sneakers Knit Tech",
    backpack: "Mochila Rolltop Slim",
    headset: "Headset Noise-Canceling Matte",
    smartwatch: "Smartwatch AMOLED Stealth",
    glasses: "Óculos Anti-Blue Light Hex",
    aura: "Sem Aura (Padrão)",
  });
  const [diaryLogs, setDiaryLogs] = useState<any[]>([]);
  const [cognitiveState, setCognitiveState] = useState("Estável");

  // Form states for adding diary entry
  const [diaryCC, setDiaryCC] = useState(5);
  const [diaryTE, setDiaryTE] = useState(5);
  const [diaryProgress, setDiaryProgress] = useState(50);
  const [diaryText, setDiaryText] = useState("");

  // Task Statistics
  const [stats, setStats] = useState({ total: 0, completed: 0, engagement: 0 });
  const [workspaceTasks, setWorkspaceTasks] = useState<any[]>([]);
  const [editingTemplateId, setEditingTemplateId] = useState<string | null>(
    null,
  );

  // RPG Math Calculations
  const level = Math.floor(Math.sqrt(xp / 50)) + 1;
  const totalHearts = 6 + level; // Starts at level 1 with 7 hearts (6 + 1 = 7). Gains +1 per level.
  const activeHearts = Math.min(
    totalHearts,
    Math.max(0, Math.round((stats.engagement / 100) * totalHearts)),
  );

  const currentLevelBaseXp = Math.pow(level - 1, 2) * 50;
  const nextLevelBaseXp = Math.pow(level, 2) * 50;
  const xpInCurrentLevel = xp - currentLevelBaseXp;
  const xpNeededForNextLevel = nextLevelBaseXp - currentLevelBaseXp;
  const levelProgressPercent = Math.min(
    100,
    Math.max(0, Math.round((xpInCurrentLevel / xpNeededForNextLevel) * 100)),
  );

  const fetchTasks = async (currentRole?: "mentor" | "mentee") => {
    if (!workspaceId) return;
    try {
      const res = await fetch(
        `/api/mentoring/tasks?workspaceId=${workspaceId}`,
      );
      if (res.ok) {
        const data = await res.json();
        if (data.tasks) {
          setWorkspaceTasks(data.tasks || []);
          const targetUserId = userId || authUser?.id;
          const activeRole = currentRole || role;
          // Filter tasks assigned strictly to this user if they are a mentee
          const userTasks =
            activeRole === "mentor"
              ? data.tasks
              : data.tasks.filter((t: any) => t.assigneeId === targetUserId);

          const completed = userTasks.filter(
            (t: any) => t.status === "done",
          ).length;
          const total = userTasks.length;
          const engagement =
            total > 0 ? Math.round((completed / total) * 100) : 0;
          setStats({ total, completed, engagement });
        }
      }
    } catch (err) {
      console.error("Error fetching tasks for stats:", err);
    }
  };

  const saveGamifiedData = async (updatedFields: Record<string, any>) => {
    try {
      const res = await fetch("/api/mentoring/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          role,
          name,
          photoUrl,
          tagline,
          miniBio,
          skills,
          experience,
          linkedinUrl,
          username,
          motivationalQuote,
          phone,
          email,
          whatsapp,
          githubUrl,
          instagramUrl,
          websiteUrl,
          personalGoal,
          careerGoal,
          futureVision,
          attributes,
          achievements,
          familyGroup,
          greatestAttribute,
          hobbies,
          mentorshipExpectations,
          shortTermGoals,
          mediumTermGoals,
          professionalDream,
          xp,
          equippedGear,
          diaryLogs,
          cognitiveState,
          projects,
          sessionTemplates,
          ...updatedFields,
        }),
      });
      if (!res.ok) console.error("Failed to sync gamified profile with DB");
    } catch (err) {
      console.error("Error syncing gamified profile:", err);
    }
  };

  const getDominantClass = () => {
    const goalsString =
      `${careerGoal || ""} ${personalGoal || ""} ${tagline || ""}`.toLowerCase();
    if (
      goalsString.includes("tech") ||
      goalsString.includes("dev") ||
      goalsString.includes("software") ||
      goalsString.includes("tecnolog")
    ) {
      return "Arquiteto Tecnológico";
    }
    if (
      goalsString.includes("start") ||
      goalsString.includes("fund") ||
      goalsString.includes("ceo") ||
      goalsString.includes("empreend") ||
      goalsString.includes("negoci")
    ) {
      return "Estrategista de Negócios";
    }
    if (
      goalsString.includes("foco") ||
      goalsString.includes("prod") ||
      goalsString.includes("fazer") ||
      goalsString.includes("execut")
    ) {
      return "Executor de Alta Performance";
    }
    if (skills && skills.length > 5) {
      return "Analista Multidisciplinar";
    }
    return "Operador em Evolução";
  };

  const loadProfile = async () => {
    try {
      setIsLoading(true);
      const url = `/api/mentoring/profile${userId ? `?userId=${userId}` : ""}`;
      const res = await fetch(url);
      let resolvedRole: "mentor" | "mentee" = isOwner ? "mentor" : "mentee";
      if (res.ok) {
        const data = await res.json();
        if (data.profile) {
          const p = data.profile;

          // Auto configure default role and viewMode
          resolvedRole = p.role || (isOwner ? "mentor" : "mentee");
          setRole(resolvedRole);

          setName(p.name || "");
          setPhotoUrl(p.photoUrl || "");
          setTagline(p.tagline || "");
          setMiniBio(p.miniBio || "");
          setSkills(p.skills || []);
          setExperience(p.experience || "");
          setLinkedinUrl(p.linkedinUrl || "");
          setUsername(p.username || "");
          setMotivationalQuote(p.motivationalQuote || "");

          // Contacts and Socials load
          setPhone(p.phone || "");
          setEmail(p.email || "");
          setWhatsapp(p.whatsapp || "");
          setGithubUrl(p.githubUrl || "");
          setInstagramUrl(p.instagramUrl || "");
          setWebsiteUrl(p.websiteUrl || "");

          setPersonalGoal(p.personalGoal || "");
          setCareerGoal(p.careerGoal || "");
          setFutureVision(p.futureVision || "");
          setAttributes(p.attributes || ["", "", ""]);
          setAchievements(p.achievements || ["", "", ""]);
          setFamilyGroup(p.familyGroup || "");
          setGreatestAttribute(p.greatestAttribute || "");
          setHobbies(p.hobbies || "");
          setMentorshipExpectations(p.mentorshipExpectations || "");
          setShortTermGoals(p.shortTermGoals || "");
          setMediumTermGoals(p.mediumTermGoals || "");
          setProfessionalDream(p.professionalDream || "");
          setGenderTerm(p.genderTerm || "mentorado");
          setProjects(p.projects || []);
          setMenteesCount(p.menteesCount || 0);

          // Load gamification attributes
          setXp(p.xp !== undefined ? p.xp : 0);
          setEquippedGear(
            p.equippedGear || {
              jacket: "Jaqueta Corta-Vento Minimalist",
              sneakers: "Sneakers Knit Tech",
              backpack: "Mochila Rolltop Slim",
              headset: "Headset Noise-Canceling Matte",
              smartwatch: "Smartwatch AMOLED Stealth",
              glasses: "Óculos Anti-Blue Light Hex",
              aura: "Sem Aura (Padrão)",
            },
          );
          setDiaryLogs(p.diaryLogs || []);
          setCognitiveState(p.cognitiveState || "Estável");
          setSessionTemplates(
            p.sessionTemplates && p.sessionTemplates.length > 0
              ? p.sessionTemplates
              : [
                  {
                    id: "1",
                    title: "Kickoff de Alinhamento",
                    duration: 60,
                    desc: "Primeira sessão de mapeamento de objetivos.",
                  },
                  {
                    id: "2",
                    title: "Aceleração Operacional",
                    duration: 45,
                    desc: "Revisão e desbloqueio de gargalos cognitivos.",
                  },
                  {
                    id: "3",
                    title: "Alinhamento Estratégico",
                    duration: 60,
                    desc: "Definição de objetivos de trimestre e carreira.",
                  },
                ],
          );

          const isOwnProfile = !userId || userId === authUser?.id;
          if (isOwnProfile) {
            setViewMode("owner");
          } else {
            if (isOwner && resolvedRole === "mentee") {
              setViewMode("tracking");
            } else {
              setViewMode("public");
            }
          }
        } else {
          // Profile does not exist yet! Set smart defaults based on workspace ownership
          resolvedRole = isOwner ? "mentor" : "mentee";
          setRole(resolvedRole);
          setViewMode("owner");
          setXp(0);

          if (clerkUser) {
            setName(clerkUser.fullName || clerkUser.firstName || "");
            setEmail(clerkUser.primaryEmailAddress?.emailAddress || "");
          }
        }
      }
      // Also load real tasks statistics
      await fetchTasks(resolvedRole);
    } catch (err) {
      console.error("Error loading profile:", err);
    } finally {
      setIsLoading(false);
    }
  };

  // Open Secretary panel and fetch logs history
  const handleOpenSecretary = async () => {
    setIsSecretaryOpen(true);
    if (!workspaceId) return;
    try {
      const res = await fetch(
        `/api/ai/mentoring-secretary?workspaceId=${workspaceId}`,
      );
      if (res.ok) {
        const data = await res.json();
        setSecretaryHistory(data.history || []);
        if (data.history && data.history.length > 0) {
          // Default to showing the latest suggestion
          setSecretaryText(data.history[0].content);
        } else {
          setSecretaryText("");
        }
      }
    } catch (err) {
      console.error("Error fetching AI secretary history:", err);
    }
  };

  // Generate a brand new AI Secretary suggestion
  const handleGenerateSecretarySuggestion = async () => {
    if (!workspaceId) return;
    try {
      setIsGeneratingSecretary(true);
      push({
        title: "Acionando a ADE...",
        description:
          "Aguarde enquanto sua Secretaria IA compila seu relatório de evolução.",
        variant: "default",
      });

      const res = await fetch(`/api/ai/mentoring-secretary`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workspaceId }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || data.error || "Erro ao acionar a IA");
      }

      const data = await res.json();
      setSecretaryText(data.suggestion);
      setSecretaryHistory(data.history || []);

      push({
        title: "Relatório Gerado!",
        description: "A ADE estruturou seus próximos passos estratégicos.",
        variant: "success",
      });
    } catch (err: any) {
      console.error("Error generating AI Secretary suggestion:", err);
      push({
        title: "Falha na Geração",
        description: err.message || "Erro de conexão com o servidor de IA.",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingSecretary(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, [userId]);

  const fetchSecretaryData = async () => {
    if (!workspaceId) return;
    try {
      const res = await fetch(
        `/api/ai/mentoring-secretary?workspaceId=${workspaceId}`,
      );
      if (res.ok) {
        const data = await res.json();
        setSecretaryHistory(data.history || []);
        if (data.history && data.history.length > 0) {
          setSecretaryText(data.history[0].content);
        } else {
          setSecretaryText("");
        }
      }
    } catch (err) {
      console.error("Error fetching AI secretary data:", err);
    }
  };

  useEffect(() => {
    fetchNextSession();
    fetchSecretaryData();
  }, [workspaceId]);

  useEffect(() => {
    if (
      viewMode === "public" &&
      mentoringSubTab !== "dashboard" &&
      mentoringSubTab !== "inventory" &&
      mentoringSubTab !== "projects"
    ) {
      setMentoringSubTab("dashboard");
    }
    if (viewMode !== "owner") {
      setActiveSubTab("portfolio");
    }
    if (
      mentoringSubTab === "admin_controls" &&
      (role !== "mentor" || viewMode !== "owner")
    ) {
      setMentoringSubTab("dashboard");
    }
  }, [viewMode, mentoringSubTab, role]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const url = await uploadToCloudinary(file, "ade/avatars", workspaceId);
      setPhotoUrl(url);

      // Sync avatar natively to Clerk client-side
      if (
        clerkUser &&
        typeof (clerkUser as any).setProfileImage === "function"
      ) {
        console.log("[Clerk] Syncing profile image to Clerk natively...");
        await (clerkUser as any).setProfileImage({ file });
      }

      push({ title: "Foto de perfil enviada!", variant: "success" });
    } catch (err: any) {
      push({ title: "Erro no upload: " + err.message, variant: "destructive" });
    } finally {
      setIsUploading(false);
    }
  };

  const handleProjectImageUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setIsUploading(true);
      const url = await uploadToCloudinary(file, "ade/products", workspaceId);
      setProjectImageUrl(url);
      push({
        title: "Imagem do projeto carregada com sucesso!",
        variant: "success",
      });
    } catch (err) {
      push({ title: "Erro ao fazer upload da imagem", variant: "destructive" });
    } finally {
      setIsUploading(false);
    }
  };

  const handleSaveProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectTitle.trim()) return;

    const tagsArray = projectTagsString
      .split(",")
      .map((t) => t.trim())
      .filter((t) => t.length > 0);

    let nextProjects = [...projects];

    if (editingProjectId) {
      nextProjects = nextProjects.map((p) =>
        p.id === editingProjectId
          ? {
              ...p,
              title: projectTitle,
              description: projectDescription,
              imageUrl: projectImageUrl,
              tags: tagsArray,
            }
          : p,
      );
      push({ title: "Projeto atualizado com sucesso!", variant: "success" });
    } else {
      const newProj = {
        id: Math.random().toString(36).substring(2, 9),
        title: projectTitle,
        description: projectDescription,
        imageUrl:
          projectImageUrl ||
          "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=500&q=80",
        tags: tagsArray,
      };
      nextProjects.push(newProj);
      push({
        title: "Novo projeto adicionado com sucesso!",
        variant: "success",
      });
    }

    setProjects(nextProjects);
    await saveGamifiedData({ projects: nextProjects });

    // Reset form
    setEditingProjectId(null);
    setProjectTitle("");
    setProjectDescription("");
    setProjectImageUrl("");
    setProjectTagsString("");
    setIsProjectFormOpen(false);
  };

  const handleDeleteProject = async (projId: string) => {
    if (!window.confirm("Deseja realmente excluir este projeto?")) return;
    const nextProjects = projects.filter((p) => p.id !== projId);
    setProjects(nextProjects);
    await saveGamifiedData({ projects: nextProjects });
    push({ title: "Projeto excluído com sucesso!", variant: "success" });
  };

  const handleEditProjectClick = (proj: any) => {
    setEditingProjectId(proj.id);
    setProjectTitle(proj.title);
    setProjectDescription(proj.description || "");
    setProjectImageUrl(proj.imageUrl || "");
    setProjectTagsString(proj.tags ? proj.tags.join(", ") : "");
    setIsProjectFormOpen(true);
  };

  useEffect(() => {
    const stored = localStorage.getItem("ade_featured_projects");
    if (stored) {
      setFeaturedProjectIds(JSON.parse(stored));
    }
  }, []);

  const handleToggleFeatureProject = (projId: string) => {
    let next: string[] = [];
    if (featuredProjectIds.includes(projId)) {
      next = featuredProjectIds.filter((id) => id !== projId);
    } else {
      next = [...featuredProjectIds, projId];
    }
    setFeaturedProjectIds(next);
    localStorage.setItem("ade_featured_projects", JSON.stringify(next));
    push({
      title: "Status de destaque do projeto atualizado com sucesso!",
      variant: "success",
    });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      push({ title: "O Nome é obrigatório", variant: "destructive" });
      return;
    }

    setIsSaving(true);
    try {
      const res = await fetch("/api/mentoring/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          role,
          name,
          photoUrl,
          tagline,
          miniBio,
          skills,
          experience,
          linkedinUrl,
          username,
          motivationalQuote,
          phone,
          email,
          whatsapp,
          githubUrl,
          instagramUrl,
          websiteUrl,
          personalGoal,
          careerGoal,
          futureVision,
          attributes,
          achievements,
          familyGroup,
          greatestAttribute,
          hobbies,
          mentorshipExpectations,
          shortTermGoals,
          mediumTermGoals,
          professionalDream,
          genderTerm,
          sessionTemplates,
        }),
      });

      if (!res.ok) throw new Error("Failed to save profile");
      push({ title: "Perfil atualizado com sucesso!", variant: "success" });
      setActiveSubTab("portfolio");
    } catch (err) {
      push({ title: "Erro ao salvar perfil", variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  const addSkill = () => {
    if (newSkill.trim() && !skills.includes(newSkill.trim())) {
      setSkills([...skills, newSkill.trim()]);
      setNewSkill("");
    }
  };

  const removeSkill = (skillToRemove: string) => {
    setSkills(skills.filter((s) => s !== skillToRemove));
  };

  // Real LinkedIn profile parser caller
  const triggerLinkedInImport = async () => {
    if (!linkedinUrl.trim()) {
      push({
        title: "Informe a URL do seu LinkedIn primeiro!",
        variant: "destructive",
      });
      return;
    }

    setLinkedinStage("connecting");
    try {
      const res = await fetch("/api/mentoring/profile/linkedin-import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: linkedinUrl }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || "Falha ao extrair perfil do LinkedIn");
      }

      const data = await res.json();
      if (data.profile) {
        setLinkedinStage("populating");
        const p = data.profile;
        if (p.name) setName(p.name);
        if (p.tagline) setTagline(p.tagline);
        if (p.bio) setMiniBio(p.bio);
        if (p.photoUrl) setPhotoUrl(p.photoUrl);
        if (p.experience) setExperience(p.experience);
        if (p.skills && p.skills.length > 0) setSkills(p.skills);

        setLinkedinStage("done");
        push({
          title: "Dados importados do LinkedIn real com sucesso!",
          variant: "success",
        });
      }
    } catch (err: any) {
      push({
        title: "Erro ao importar: " + err.message,
        variant: "destructive",
      });
    } finally {
      setTimeout(() => setLinkedinStage("idle"), 1500);
    }
  };

  const getOptimizedPhotoUrl = (url: string) => {
    if (!url) return "";
    if (url.includes("cloudinary.com") && url.includes("/upload/")) {
      return url.replace(
        "/upload/",
        "/upload/c_fill,g_face,w_300,h_300,q_auto,f_auto/",
      );
    }
    return url;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="w-10 h-10 text-indigo-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto w-full p-2 flex flex-col gap-6">
      {/* Tab bar header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-4 gap-3">
        <div>
          <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">
            Meu Perfil de Mentoria
          </h2>
          <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest font-sans">
            {activeSubTab === "edit"
              ? "Configurando Detalhes do Perfil"
              : "Visualização de evolução e trajetória"}
          </p>
        </div>
      </div>

      {/* PORTFOLIO VIEW */}
      {activeSubTab === "portfolio" && (
        <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-3 duration-300">
          {/* Beige HBR-Style RPG Character Card Header & Avatar */}
          <div className="bg-[#fcfbf9] border border-[#e8e5dd] text-slate-900 rounded-xl p-8 relative overflow-hidden shadow-sm flex flex-col md:flex-row gap-8 items-start">
            <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/5 blur-[120px] rounded-full pointer-events-none" />
            <div className="absolute -bottom-10 -left-10 w-60 h-60 bg-emerald-500/5 blur-[100px] rounded-full pointer-events-none" />

            {/* Left RPG Character Box (Clean, No Nested Box!) */}
            <div className="flex flex-col items-center gap-3 shrink-0 w-full md:w-48 relative">
              {/* Photo/Avatar Frame */}
              <div className="h-28 w-28 rounded-full border-4 border-white overflow-hidden bg-slate-100 flex items-center justify-center shrink-0 shadow-md relative group ring-1 ring-[#e8e5dd]/80">
                {photoUrl ? (
                  <img
                    src={getOptimizedPhotoUrl(photoUrl)}
                    alt={name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <User className="w-12 h-12 text-slate-400" />
                )}

                {/* Discrete edit pencil button right on the avatar */}
                <button
                  onClick={() => setActiveSubTab("edit")}
                  title="Editar Perfil"
                  className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity duration-200 border-none outline-none cursor-pointer rounded-full z-10"
                >
                  <Edit3 className="w-5 h-5" />
                </button>
              </div>

              {/* Level badge overlapping the photo */}
              <div className="absolute top-20 right-8 bg-slate-900 border border-slate-800 text-white w-9 h-9 rounded-full flex flex-col items-center justify-center shadow-md z-25">
                <span className="text-[7px] font-black uppercase tracking-wider text-slate-400 leading-none">
                  LV
                </span>
                <span className="text-xs font-black text-white leading-none mt-0.5">
                  {level}
                </span>
              </div>

              {/* Discrete pencil icon next to image for static display or simple click */}
              <button
                onClick={() => setActiveSubTab("edit")}
                className="absolute top-4 right-4 p-1.5 rounded-full bg-white hover:bg-slate-100 border border-slate-200/60 shadow-2xs text-slate-500 hover:text-slate-900 transition-all cursor-pointer"
                title="Configurações de Perfil"
              >
                <Edit3 className="w-3.5 h-3.5" />
              </button>

              {/* RPG Stats Column (Extremely Clean, No Nested Border Cards!) */}
              <div className="w-full flex flex-col gap-2 mt-1.5 font-sans items-center">
                {/* HP (Pulsing hearts directly, no label/nesting) */}
                <div
                  className="flex items-center justify-center gap-0.5 mt-0.5"
                  title={`Rendimento: ${stats.engagement}%`}
                >
                  {Array.from({ length: totalHearts }).map((_, i) => {
                    const isActive = i < activeHearts;
                    return (
                      <Heart
                        key={i}
                        className={cn(
                          "w-3.5 h-3.5 transition-all duration-300",
                          isActive
                            ? "fill-rose-500 text-rose-500 drop-shadow-[0_0_2px_rgba(244,63,94,0.4)] animate-pulse"
                            : "text-[#d1ccc0] fill-none",
                        )}
                      />
                    );
                  })}
                </div>

                {/* XP Progress Bar (Blue/Indigo, Clean!) */}
                <div className="w-full flex flex-col gap-1 mt-1 font-sans">
                  <div className="flex items-center justify-between text-[8px] font-black uppercase tracking-widest text-slate-400">
                    <span>XP</span>
                    <span className="text-slate-700 font-bold">
                      {xpInCurrentLevel} / {xpNeededForNextLevel} XP
                    </span>
                  </div>
                  <div className="w-full bg-slate-200/60 h-2 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{
                        width: `${levelProgressPercent}%`,
                        backgroundColor: "#4f46e5",
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Right section of header: Info */}
            <div className="flex-1 min-w-0 flex flex-col gap-3 self-stretch justify-between text-left">
              <div>
                <h3 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight mb-0.5 leading-none font-['Lora',Georgia,serif] flex items-center gap-2">
                  <span>{name || "Sem Nome Definido"}</span>
                  <span className="bg-indigo-600 text-[8px] text-white font-black px-2 py-0.5 rounded-full uppercase tracking-wider shadow-sm shrink-0">
                    {role === "mentor" ? "Mentor" : "Mentorado"}
                  </span>
                </h3>
                <p className="text-indigo-600 text-[10px] font-bold uppercase tracking-widest mb-2 font-sans">
                  {tagline || "Tagline não especificada"}
                </p>

                {/* Sleek RPG Gamer HUD Status Bar */}
                <div className="flex flex-wrap items-center gap-2 mb-3 font-sans">
                  {/* Especialidade HUD Badge */}
                  <div className="flex items-center gap-1.5 bg-slate-950 text-white px-2.5 py-1 rounded-lg text-[8.5px] font-black uppercase tracking-wider cursor-help group/hud relative border border-slate-800 shadow-3xs">
                    <Shield className="w-3 h-3 text-amber-400 shrink-0" />
                    <span>
                      {role === "mentor"
                        ? "Mentor Executivo"
                        : "Estrategista de Negócios"}
                    </span>

                    <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 hidden group-hover/hud:flex flex-col bg-slate-900 text-white text-[8px] p-2 rounded-lg shadow-md w-48 text-center z-30 pointer-events-none normal-case">
                      <span className="font-black uppercase tracking-wider mb-0.5 text-amber-400">
                        Especialidade
                      </span>
                      <span className="text-slate-300 leading-normal font-semibold">
                        Calculado dinamicamente a partir dos seus objetivos,
                        trajetória profissional e competências.
                      </span>
                    </div>
                  </div>

                  {/* Mentorados count for Mentor */}
                  {role === "mentor" && (
                    <div className="flex items-center gap-1.5 bg-indigo-50 border border-indigo-200 text-indigo-700 px-2.5 py-1 rounded-lg text-[8.5px] font-black uppercase tracking-wider shadow-3xs">
                      <span>Mentorados: {menteesCount}</span>
                    </div>
                  )}

                  {/* Nível HUD Badge */}
                  <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-800 text-white px-2.5 py-1 rounded-lg text-[8.5px] font-black uppercase tracking-wider shadow-3xs">
                    <span>Nível: {level}</span>
                  </div>

                  {/* Tensão Cognitiva HUD Badge */}
                  <div className="flex items-center gap-1.5 bg-white border border-[#e8e5dd] text-slate-700 px-2.5 py-1 rounded-lg text-[8.5px] font-black uppercase tracking-wider cursor-help group/hud relative shadow-3xs">
                    <Activity className="w-3 h-3 text-indigo-500 shrink-0" />
                    <span>
                      Foco:{" "}
                      {(diaryLogs.length > 0
                        ? diaryLogs[diaryLogs.length - 1].CC /
                          diaryLogs[diaryLogs.length - 1].TE
                        : 1.0
                      ).toFixed(2)}
                    </span>

                    <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 hidden group-hover/hud:flex flex-col bg-slate-900 text-white text-[8px] p-2 rounded-lg shadow-md w-48 text-center z-30 pointer-events-none normal-case">
                      <span className="font-black uppercase tracking-wider mb-0.5 text-indigo-400">
                        Índice de Foco
                      </span>
                      <span className="text-slate-300 leading-normal font-semibold">
                        Métrica de foco diário (Esforço Mental / Tempo Dedicado)
                        calculada dos seus diários de bordo recentes.
                      </span>
                    </div>
                  </div>

                  {/* Tarefas HUD Badge */}
                  <div className="flex items-center gap-1.5 bg-white border border-[#e8e5dd] text-slate-700 px-2.5 py-1 rounded-lg text-[8.5px] font-black uppercase tracking-wider cursor-help group/hud relative shadow-3xs">
                    <CheckCircle2 className="w-3 h-3 text-emerald-500 shrink-0" />
                    <span>
                      Tarefas: {stats.completed}/{stats.total}
                    </span>

                    <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 hidden group-hover/hud:flex flex-col bg-slate-900 text-white text-[8px] p-2 rounded-lg shadow-md w-48 text-center z-30 pointer-events-none normal-case">
                      <span className="font-black uppercase tracking-wider mb-0.5 text-emerald-400">
                        Tarefas Executadas
                      </span>
                      <span className="text-slate-300 leading-normal font-semibold">
                        Seu progresso de atividades concluídas no quadro Kanban
                        operacional.
                      </span>
                    </div>
                  </div>

                  {/* Próxima Sessão HUD Badge */}
                  <div
                    onClick={() => {
                      setActiveSubTab("portfolio");
                      setMentoringSubTab("schedule");
                    }}
                    className="flex items-center gap-1.5 bg-white border border-[#e8e5dd] hover:bg-slate-50 transition-colors text-slate-700 px-2.5 py-1 rounded-lg text-[8.5px] font-black uppercase tracking-wider cursor-pointer shadow-3xs"
                  >
                    <CalendarDays className="w-3 h-3 text-indigo-500 shrink-0" />
                    <span>
                      Próxima Sessão: {nextSessionDate || "Sem sessão agendada"}
                    </span>
                  </div>
                </div>

                {/* Sleek Dynamic Public Link Box */}
                <div className="flex flex-col gap-1 w-full max-w-sm text-left font-sans mt-1">
                  <div className="flex items-center gap-2 bg-white border border-[#e8e5dd] px-3 py-1.5 rounded-lg shadow-3xs w-fit">
                    <Globe className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                    <a
                      href={`/${role === "mentor" ? "mentor" : "mentorado"}/${username || userId}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-[10px] text-indigo-600 hover:text-indigo-850 hover:underline transition-colors font-bold cursor-pointer font-sans"
                    >
                      Link Público
                    </a>
                  </div>
                </div>

                {/* Repositioned Motivational Quote (Above Badges!) */}
                {motivationalQuote ? (
                  <div className="bg-[#fcfbf9] border border-[#e8e5dd] px-5 py-3 rounded-xl italic text-xs font-semibold text-slate-700 leading-relaxed shadow-3xs relative font-serif mt-2 mb-1 text-center w-full max-w-xl">
                    <span className="absolute left-3 top-0.5 text-lg text-[#e8e5dd] pointer-events-none font-serif leading-none">
                      “
                    </span>
                    {motivationalQuote}
                    <span className="absolute right-3 bottom-0 text-lg text-[#e8e5dd] pointer-events-none font-serif leading-none">
                      ”
                    </span>
                  </div>
                ) : (
                  <div className="bg-[#fcfbf9] border border-dashed border-[#e8e5dd] px-5 py-2.5 rounded-xl text-[10px] text-slate-400 font-medium text-center mt-2 mb-1 w-full max-w-xl font-sans">
                    "Defina sua frase de efeito ou citação nas configurações do
                    perfil para exibi-la aqui."
                  </div>
                )}

                {/* Achievements Badges Inline (No nested outer card container!) */}
                <div className="flex flex-wrap items-center gap-3 mt-2 w-full font-sans">
                  <div className="flex flex-wrap gap-2">
                    {[
                      {
                        id: "consistente",
                        title: "Foco Consistente",
                        desc: "Mais de 75% de engajamento em tarefas ativas.",
                        unlocked: stats.engagement >= 75 && stats.total > 0,
                      },
                      {
                        id: "implacavel",
                        title: "Implacável",
                        desc: "Completou pelo menos 5 tarefas no workspace.",
                        unlocked: stats.completed >= 5,
                      },
                      {
                        id: "resiliente",
                        title: "Operador Resiliente",
                        desc: "Escreveu seu primeiro relatório no Diário de Bordo.",
                        unlocked: diaryLogs.length > 0,
                      },
                      {
                        id: "visionario",
                        title: "Líder Visionário",
                        desc: "Estruturou sua visão de futuro nas configurações.",
                        unlocked:
                          futureVision && futureVision.trim().length > 10,
                      },
                    ].map((trait) => (
                      <div
                        key={trait.id}
                        className={cn(
                          "group/achievement relative flex items-center justify-center w-7 h-7 rounded-full border transition-all cursor-help",
                          trait.unlocked
                            ? "bg-amber-50 border-amber-200 text-amber-600 shadow-3xs"
                            : "bg-slate-100 border-slate-200/60 text-slate-400 opacity-50",
                        )}
                      >
                        <Award className="w-3.5 h-3.5" />

                        {/* Premium tooltip on hover */}
                        <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 hidden group-hover/achievement:flex flex-col bg-slate-900 text-white text-[9px] p-2 rounded-lg shadow-md w-36 text-center z-30 pointer-events-none font-sans normal-case">
                          <span className="font-black uppercase tracking-wider mb-0.5 text-amber-400">
                            {trait.title}
                          </span>
                          <span className="text-slate-300 leading-normal font-semibold">
                            {trait.desc}
                          </span>
                          <span className="text-[7.5px] font-black uppercase mt-1 tracking-widest text-slate-500">
                            {trait.unlocked ? "Desbloqueado" : "Bloqueado"}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Unified buttons bar at the bottom: contact buttons + sub-tabs + Secretaria IA! */}
          <div className="flex flex-wrap items-center justify-center gap-2 mt-4 w-full font-sans">
            {linkedinUrl && (
              <a
                href={linkedinUrl}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1 hover:text-slate-800 transition-colors cursor-pointer bg-white hover:bg-slate-50 px-2.5 py-1.5 rounded-xl border border-slate-200/50 text-[10px] font-bold text-slate-500 shadow-3xs"
              >
                <Linkedin className="w-3 h-3 text-indigo-500" />
                <span>LinkedIn</span>
              </a>
            )}
            {githubUrl && (
              <a
                href={githubUrl}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1 hover:text-slate-800 transition-colors cursor-pointer bg-white hover:bg-slate-50 px-2.5 py-1.5 rounded-xl border border-slate-200/50 text-[10px] font-bold text-slate-500 shadow-3xs"
              >
                <Github className="w-3 h-3 text-slate-700" />
                <span>GitHub</span>
              </a>
            )}
            {instagramUrl && (
              <a
                href={instagramUrl}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1 hover:text-slate-800 transition-colors cursor-pointer bg-white hover:bg-slate-50 px-2.5 py-1.5 rounded-xl border border-slate-200/50 text-[10px] font-bold text-slate-500 shadow-3xs"
              >
                <Instagram className="w-3 h-3 text-pink-500" />
                <span>Instagram</span>
              </a>
            )}
            {websiteUrl && (
              <a
                href={websiteUrl}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1 hover:text-slate-800 transition-colors cursor-pointer bg-white hover:bg-slate-50 px-2.5 py-1.5 rounded-xl border border-slate-200/50 text-[10px] font-bold text-slate-500 shadow-3xs"
              >
                <Globe className="w-3 h-3 text-sky-500" />
                <span>Website</span>
              </a>
            )}
            {email && (
              <a
                href={`mailto:${email}`}
                className="flex items-center gap-1 hover:text-slate-800 transition-colors bg-white hover:bg-slate-50 px-2.5 py-1.5 rounded-xl border border-slate-200/50 text-[10px] font-bold text-slate-500 shadow-3xs"
              >
                <Mail className="w-3 h-3 text-indigo-500" />
                <span>{email}</span>
              </a>
            )}
            {whatsapp && (
              <a
                href={`https://wa.me/${whatsapp.replace(/\D/g, "")}`}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1.5 hover:text-slate-800 transition-colors cursor-pointer bg-white hover:bg-slate-50 px-2.5 py-1.5 rounded-xl border border-slate-200/50 text-[10px] font-bold text-slate-500 shadow-3xs"
              >
                <MessageCircle className="w-3.5 h-3.5 text-emerald-500" />
                <span>WhatsApp</span>
              </a>
            )}
            {phone && !whatsapp && (
              <div className="flex items-center gap-1.5 bg-white px-2.5 py-1.5 rounded-xl border border-slate-200/50 text-[10px] font-bold text-slate-500 shadow-3xs">
                <Phone className="w-3 h-3 text-indigo-500" />
                <span>{phone}</span>
              </div>
            )}

            {/* Sub-tab selection buttons inside unified buttons list */}
            {activeSubTab === "portfolio" &&
              [
                {
                  id: "dashboard",
                  label: t("admin.mentoringProfile.tabs.dashboard"),
                  icon: TrendingUp,
                },
                { id: "diary", label: termDiary, icon: BookOpen },
                {
                  id: "tasks",
                  label: t("admin.mentoringProfile.tabs.tasks"),
                  icon: ClipboardList,
                },
                {
                  id: "schedule",
                  label: t("admin.mentoringProfile.tabs.schedule"),
                  icon: CalendarDays,
                },
                {
                  id: "tracks",
                  label: locale === "pt" ? "Trilhas" : "Tracks",
                  icon: Target,
                },
                ...(role === "mentor" && viewMode === "owner"
                  ? [
                      {
                        id: "admin_controls",
                        label: t("admin.mentoringProfile.tabs.mentorPanel"),
                        icon: Shield,
                      },
                    ]
                  : []),
              ].map((tab) => {
                const Icon = tab.icon;
                const isActive = mentoringSubTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setMentoringSubTab(tab.id as any)}
                    className={cn(
                      "flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all cursor-pointer shadow-3xs font-sans border border-slate-200/50",
                      isActive
                        ? "bg-slate-800 text-white border-slate-700"
                        : "bg-slate-100 hover:bg-slate-200 text-slate-600",
                    )}
                  >
                    <Icon className="w-3.5 h-3.5 shrink-0" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}

            {/* Configurações Tab Switcher */}
            {viewMode === "owner" && (
              <button
                type="button"
                onClick={() => {
                  if ((activeSubTab as string) === "edit") {
                    setActiveSubTab("portfolio");
                  } else {
                    setActiveSubTab("edit");
                  }
                }}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all cursor-pointer shadow-3xs font-sans border border-slate-200/50",
                  (activeSubTab as string) === "edit"
                    ? "bg-slate-800 text-white border-slate-700"
                    : "bg-slate-100 hover:bg-slate-200 text-slate-600",
                )}
              >
                <Sliders className="w-3.5 h-3.5 shrink-0" />
                <span>{t("admin.mentoringProfile.tabs.config")}</span>
              </button>
            )}

            {/* Dynamic AI Secretary Action Trigger */}
            {workspaceId && viewMode === "owner" && (
              <button
                type="button"
                onClick={() => handleOpenSecretary()}
                className="flex items-center gap-1.5 bg-slate-900 hover:bg-indigo-650 text-white px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all cursor-pointer shadow-3xs font-sans border-none shrink-0"
              >
                <Sparkles className="w-3.5 h-3.5 text-indigo-300 animate-pulse" />
                <span>{t("admin.mentoringProfile.tabs.secretary")}</span>
              </button>
            )}
          </div>

          {/* SUB-TAB CONTENTS */}

          {/* 1. DASHBOARD DE EVOLUÇÃO */}
          {mentoringSubTab === "dashboard" && (
            <div className="flex flex-col gap-6 animate-in fade-in duration-200">
              {/* Premium AI Secretary Results Box inside Evolution Dashboard! */}
              {workspaceId && viewMode === "owner" && (
                <div className="bg-white border border-[#e8e5dd] p-6 rounded-xl shadow-3xs flex flex-col gap-4 text-left font-sans mt-2">
                  <div className="flex items-center justify-between border-b border-[#f0ede4] pb-3">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-5 h-5 text-indigo-500 animate-pulse" />
                      <div>
                        <h4 className="text-xs font-black uppercase tracking-wider text-slate-800">
                          {t("admin.mentoringProfile.secReportHeader")}
                        </h4>
                        <p className="text-[8.5px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">
                          {t("admin.mentoringProfile.secReportSubtitle")}
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleOpenSecretary()}
                      className="text-[9px] font-black uppercase tracking-widest text-indigo-600 hover:text-indigo-850 hover:underline transition-colors bg-indigo-50 px-2.5 py-1 rounded"
                    >
                      {t("admin.mentoringProfile.viewHistory")}
                    </button>
                  </div>

                  {secretaryText ? (
                    <div
                      onClick={() =>
                        setIsSecretaryExpanded(!isSecretaryExpanded)
                      }
                      className="group/sec bg-[#fcfbf9] hover:bg-[#f5f2eb] border border-[#e8e5dd] p-5 rounded-lg border-l-4 border-l-slate-900 shadow-3xs hover:shadow-2xs transition-all duration-300 cursor-pointer flex flex-col gap-3 text-left relative"
                    >
                      <div className="flex items-center justify-between text-[9px] font-black uppercase tracking-widest text-slate-400">
                        <span className="flex items-center gap-1.5 text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100/50 font-black">
                          {t("admin.mentoringProfile.reportTitle")}
                        </span>
                        {secretaryHistory[0]?.createdAt && (
                          <span className="text-slate-500 font-bold bg-[#eae6db]/60 px-2 py-0.5 rounded">
                            {t("admin.mentoringProfile.createdAt", {
                              date: isMounted
                                ? new Date(
                                    secretaryHistory[0].createdAt,
                                  ).toLocaleDateString(
                                    locale === "pt" ? "pt-BR" : "en-US",
                                    {
                                      day: "2-digit",
                                      month: "2-digit",
                                      year: "numeric",
                                      hour: "2-digit",
                                      minute: "2-digit",
                                    },
                                  )
                                : "",
                            })}
                          </span>
                        )}
                      </div>

                      <div className="text-xs font-semibold text-slate-700 leading-relaxed font-sans whitespace-pre-line select-none">
                        {isSecretaryExpanded ? (
                          secretaryText
                        ) : (
                          <>
                            {secretaryText.length > 240
                              ? `${secretaryText.slice(0, 240)}...`
                              : secretaryText}
                          </>
                        )}
                      </div>

                      <div className="border-t border-[#f0ede4]/60 pt-2.5 flex items-center justify-between text-[9px] font-black uppercase tracking-widest text-indigo-600 group-hover/sec:text-indigo-800">
                        <span>
                          {isSecretaryExpanded
                            ? t("admin.mentoringProfile.collapseReport")
                            : t("admin.mentoringProfile.expandReport")}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="border border-dashed border-slate-200 rounded-lg p-6 text-center text-slate-400 flex flex-col items-center gap-2 bg-slate-50/50">
                      <Sparkles className="w-6 h-6 text-slate-350" />
                      <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                        {t("admin.mentoringProfile.noReportGenerated")}
                      </p>
                      <button
                        type="button"
                        onClick={handleGenerateSecretarySuggestion}
                        disabled={isGeneratingSecretary}
                        className="mt-2 flex items-center gap-1.5 bg-slate-900 hover:bg-[#4338ca] text-white px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all cursor-pointer shadow-3xs border-none"
                      >
                        {isGeneratingSecretary ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            <span>{t("admin.mentoringProfile.compiling")}</span>
                          </>
                        ) : (
                          <>
                            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                            <span>
                              {t("admin.mentoringProfile.generateReport")}
                            </span>
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Unified Strategic bottom card: Diretrizes & Alinhamento de Evolução */}
              {viewMode !== "public" && (
                <div className="bg-[#fcfbf9] border border-[#e8e5dd] p-8 rounded-xl shadow-2xs mt-2 flex flex-col gap-6 font-sans">
                  <div>
                    <h4 className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-2 font-sans">
                      <Sparkles className="w-4 h-4 text-indigo-500" />
                      <span>{t("admin.mentoringProfile.guideTitle")}</span>
                    </h4>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest font-sans mt-0.5">
                      {t("admin.mentoringProfile.guideSubtitle")}
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 font-sans">
                    {/* 1. Expectativas */}
                    <div className="bg-white border border-[#e8e5dd]/60 p-6 rounded-xl shadow-3xs flex flex-col gap-3 text-left">
                      <div className="flex items-center gap-2 text-indigo-600">
                        <div className="p-2 rounded-lg bg-indigo-50">
                          <Sparkles className="w-4 h-4" />
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">
                          {t("admin.mentoringProfile.expectationLabel")}
                        </span>
                      </div>
                      <p className="text-xs font-semibold text-slate-700 leading-relaxed whitespace-pre-line">
                        {mentorshipExpectations ||
                          t("admin.mentoringProfile.notFilled")}
                      </p>
                    </div>

                    {/* 2. Curto Prazo */}
                    <div className="bg-white border border-[#e8e5dd]/60 p-6 rounded-xl shadow-3xs flex flex-col gap-3 text-left">
                      <div className="flex items-center gap-2 text-rose-600">
                        <div className="p-2 rounded-lg bg-rose-50">
                          <Target className="w-4 h-4" />
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">
                          {t("admin.mentoringProfile.shortTermLabel")}
                        </span>
                      </div>
                      <p className="text-xs font-semibold text-slate-700 leading-relaxed whitespace-pre-line">
                        {shortTermGoals ||
                          t("admin.mentoringProfile.notFilled")}
                      </p>
                    </div>

                    {/* 3. Médio Prazo */}
                    <div className="bg-white border border-[#e8e5dd]/60 p-6 rounded-xl shadow-3xs flex flex-col gap-3 text-left">
                      <div className="flex items-center gap-2 text-amber-600">
                        <div className="p-2 rounded-lg bg-amber-50">
                          <TrendingUp className="w-4 h-4" />
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">
                          {t("admin.mentoringProfile.mediumTermLabel")}
                        </span>
                      </div>
                      <p className="text-xs font-semibold text-slate-700 leading-relaxed whitespace-pre-line">
                        {mediumTermGoals ||
                          t("admin.mentoringProfile.notFilled")}
                      </p>
                    </div>

                    {/* 4. Sonho Profissional */}
                    <div className="bg-white border border-[#e8e5dd]/60 p-6 rounded-xl shadow-3xs flex flex-col gap-3 lg:col-span-2 text-left">
                      <div className="flex items-center gap-2 text-yellow-600">
                        <div className="p-2 rounded-lg bg-yellow-50">
                          <Award className="w-4 h-4 animate-pulse" />
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">
                          {t("admin.mentoringProfile.professionalDreamLabel")}
                        </span>
                      </div>
                      <p className="text-sm font-semibold text-indigo-950 leading-relaxed whitespace-pre-line font-serif italic text-left pl-2 border-l-2 border-amber-200">
                        {professionalDream
                          ? `"${professionalDream}"`
                          : t("admin.mentoringProfile.notFilled")}
                      </p>
                    </div>

                    {/* 5. Hobbies */}
                    <div className="bg-white border border-[#e8e5dd]/60 p-6 rounded-xl shadow-3xs flex flex-col gap-3 text-left">
                      <div className="flex items-center gap-2 text-emerald-600">
                        <div className="p-2 rounded-lg bg-emerald-50">
                          <Heart className="w-4 h-4" />
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">
                          {t("admin.mentoringProfile.hobbiesLabel")}
                        </span>
                      </div>
                      <p className="text-xs font-semibold text-slate-700 leading-relaxed whitespace-pre-line">
                        {hobbies || t("admin.mentoringProfile.notFilled")}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Dynamic XP History / Audit Log */}
              {viewMode !== "public" && (
                <div className="bg-[#fcfbf9] border border-[#e8e5dd] p-8 rounded-xl shadow-2xs mt-2 flex flex-col gap-4 font-sans text-left animate-in fade-in duration-200">
                  <div>
                    <h4 className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-2 font-sans">
                      <Award className="w-4 h-4 text-indigo-500" />
                      <span>
                        {locale === "pt"
                          ? "Histórico de Experiência (XP)"
                          : "Experience (XP) History Log"}
                      </span>
                    </h4>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest font-sans mt-0.5">
                      {locale === "pt"
                        ? "Fontes e auditoria de pontos obtidos na mentoria"
                        : "Audit and sources of points gained throughout your mentoring journey"}
                    </p>
                  </div>

                  {(() => {
                    const history = [];

                    // 1. Initial Login/Sign-up baseline
                    history.push({
                      id: "welcome_base",
                      type: "welcome",
                      title:
                        locale === "pt"
                          ? "Cadastro / Acesso Inicial"
                          : "Initial Sign-up / Login",
                      xp: 0,
                      date: "N/A",
                    });

                    // 2. Add diary logs (+200 XP each)
                    diaryLogs.forEach((log, idx) => {
                      history.push({
                        id: `diary_${idx}`,
                        type: "diary",
                        title: `${locale === "pt" ? "Diário de Bordo Registrado" : "Logbook Entry Submitted"} #${idx + 1}`,
                        xp: diaryXpWeight || 200,
                        date: log.date || "N/A",
                      });
                    });

                    // 3. Add completed tasks (+importance * 10 XP each)
                    const targetUserId = userId || authUser?.id;
                    const userTasks =
                      role === "mentor"
                        ? workspaceTasks
                        : workspaceTasks.filter(
                            (t: any) => t.assigneeId === targetUserId,
                          );

                    userTasks.forEach((task: any) => {
                      if (task.status === "done") {
                        const xpAmount = (Number(task.importance) || 0) * 10;
                        history.push({
                          id: `task_${task._id || task.id}`,
                          type: "task",
                          title: `${locale === "pt" ? "Tarefa Concluída" : "Task Completed"}: ${task.title}`,
                          xp: xpAmount,
                          date: task.updatedAt
                            ? isMounted
                              ? new Date(task.updatedAt).toLocaleDateString(
                                  "pt-BR",
                                )
                              : ""
                            : "N/A",
                        });
                      }
                    });

                    // Sort chronologically/or just show all with newest first
                    const sortedHistory = history.reverse(); // simple chronological reverse

                    return sortedHistory.length <= 1 ? (
                      <div className="text-center py-6 text-xs font-semibold text-slate-400 bg-white border border-[#e8e5dd]/60 rounded-xl border-dashed">
                        {locale === "pt"
                          ? "Nenhuma atividade recente que concedeu XP."
                          : "No recent activities that awarded XP."}
                      </div>
                    ) : (
                      <div className="bg-white border border-[#e8e5dd]/60 rounded-xl divide-y divide-slate-100 max-h-[250px] overflow-y-auto pr-1 shadow-3xs">
                        {sortedHistory.map((item) => (
                          <div
                            key={item.id}
                            className="p-4 flex items-center justify-between gap-3 text-left"
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <div
                                className={cn(
                                  "p-2 rounded-xl shrink-0",
                                  item.type === "welcome"
                                    ? "bg-slate-50 text-slate-500"
                                    : item.type === "diary"
                                      ? "bg-indigo-50 text-indigo-600"
                                      : "bg-emerald-50 text-emerald-600",
                                )}
                              >
                                {item.type === "welcome" ? (
                                  <User className="w-3.5 h-3.5" />
                                ) : item.type === "diary" ? (
                                  <BookOpen className="w-3.5 h-3.5" />
                                ) : (
                                  <CheckCircle2 className="w-3.5 h-3.5" />
                                )}
                              </div>
                              <div className="flex flex-col min-w-0 text-left">
                                <span className="text-xs font-bold text-slate-800 truncate">
                                  {item.title}
                                </span>
                                <span className="text-[8.5px] font-bold text-slate-400 uppercase tracking-widest">
                                  {locale === "pt" ? "Data" : "Date"}:{" "}
                                  {item.date}
                                </span>
                              </div>
                            </div>
                            <span
                              className={cn(
                                "text-xs font-black shrink-0 whitespace-nowrap px-2.5 py-1 rounded-full",
                                item.xp > 0
                                  ? "bg-amber-50 text-amber-600 border border-amber-100"
                                  : "bg-slate-100 text-slate-500",
                              )}
                            >
                              {item.xp > 0 ? `+${item.xp} XP` : "0 XP"}
                            </span>
                          </div>
                        ))}
                      </div>
                    );
                  })()}
                </div>
              )}

              {/* Standard trajectory items / Profile view cards */}
              {role === "mentor" ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 font-sans">
                  <div className="md:col-span-2 flex flex-col gap-6">
                    <div className="bg-white p-8 rounded-xl border border-slate-100 shadow-sm">
                      <h4 className="text-xs font-black uppercase tracking-wider text-slate-400 mb-4 flex items-center gap-2">
                        <Briefcase className="w-4 h-4 text-indigo-500" />
                        <span>
                          {t("admin.mentoringProfile.bioTrajectoryLabel")}
                        </span>
                      </h4>
                      <p className="text-sm font-semibold text-slate-700 leading-relaxed whitespace-pre-line text-left">
                        {miniBio || t("admin.mentoringProfile.noBio")}
                      </p>
                    </div>

                    <div className="bg-white p-8 rounded-xl border border-slate-100 shadow-sm">
                      <h4 className="text-xs font-black uppercase tracking-wider text-slate-400 mb-4 flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 text-indigo-500" />
                        <span>
                          {t("admin.mentoringProfile.experienceLabel")}
                        </span>
                      </h4>
                      <p className="text-sm font-semibold text-slate-700 leading-relaxed whitespace-pre-line text-left">
                        {experience || t("admin.mentoringProfile.noExperience")}
                      </p>
                    </div>
                  </div>

                  <div className="bg-white p-8 rounded-xl border border-slate-100 shadow-sm">
                    <h4 className="text-xs font-black uppercase tracking-wider text-slate-400 mb-4 flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-indigo-500" />
                      <span>{t("admin.mentoringProfile.skillsLabel")}</span>
                    </h4>
                    {skills.length === 0 ? (
                      <p className="text-xs text-slate-400 font-bold">
                        {t("admin.mentoringProfile.noSkills")}
                      </p>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        {skills.map((skill, idx) => (
                          <span
                            key={idx}
                            className="bg-indigo-50 text-indigo-600 px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-wide"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="flex flex-col gap-6 font-sans">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-white p-8 rounded-xl border border-slate-100 shadow-sm">
                      <h4 className="text-xs font-black uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-2">
                        <Target className="w-4 h-4 text-indigo-500" />
                        <span>
                          {t("admin.mentoringProfile.personalGoalLabel")}
                        </span>
                      </h4>
                      <p className="text-sm font-semibold text-slate-700 leading-relaxed whitespace-pre-line text-left">
                        {personalGoal || t("admin.mentoringProfile.notDefined")}
                      </p>
                    </div>

                    <div className="bg-white p-8 rounded-xl border border-slate-100 shadow-sm">
                      <h4 className="text-xs font-black uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-2">
                        <Briefcase className="w-4 h-4 text-indigo-500" />
                        <span>
                          {t("admin.mentoringProfile.careerGoalLabel")}
                        </span>
                      </h4>
                      <p className="text-sm font-semibold text-slate-700 leading-relaxed whitespace-pre-line text-left">
                        {careerGoal || t("admin.mentoringProfile.notDefined")}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-white p-8 rounded-xl border border-slate-100 shadow-sm flex flex-col gap-4">
                      <h4 className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center gap-2 border-b border-slate-50 pb-2">
                        <Sparkles className="w-4 h-4 text-indigo-500" />
                        <span>
                          {t("admin.mentoringProfile.personalAttributesLabel")}
                        </span>
                      </h4>
                      <ul className="space-y-3">
                        {attributes.map((attr, idx) => (
                          <li key={idx} className="flex items-center gap-2.5">
                            <span className="w-6 h-6 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center text-[10px] font-black">
                              {idx + 1}
                            </span>
                            <span className="text-xs font-bold text-slate-700">
                              {attr ||
                                t("admin.mentoringProfile.notFilledShort")}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="bg-white p-8 rounded-xl border border-slate-100 shadow-sm flex flex-col gap-4">
                      <h4 className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center gap-2 border-b border-slate-50 pb-2">
                        <Award className="w-4 h-4 text-indigo-500" />
                        <span>
                          {t(
                            "admin.mentoringProfile.greatestAchievementsLabel",
                          )}
                        </span>
                      </h4>
                      <ul className="space-y-3">
                        {achievements.map((ach, idx) => (
                          <li key={idx} className="flex items-center gap-2.5">
                            <span className="w-6 h-6 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center text-[10px] font-black">
                              {idx + 1}
                            </span>
                            <span className="text-xs font-bold text-slate-700">
                              {ach ||
                                t("admin.mentoringProfile.notFilledShort")}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="bg-white p-8 rounded-xl border border-slate-100 shadow-sm flex flex-col gap-4">
                      <h4 className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center gap-2 border-b border-slate-50 pb-2">
                        <Heart className="w-4 h-4 text-indigo-500" />
                        <span>
                          {locale === "pt"
                            ? "Maior Qualidade"
                            : "Greatest Quality"}
                        </span>
                      </h4>
                      <div className="bg-indigo-50/50 p-4 rounded-2xl flex-1 flex flex-col justify-center text-center">
                        <p className="text-[10px] font-black uppercase tracking-widest text-indigo-600 mb-1">
                          {locale === "pt"
                            ? "Como os outros me veem"
                            : "How others see me"}
                        </p>
                        <h5 className="text-base font-black text-indigo-900 leading-tight">
                          {greatestAttribute ||
                            (locale === "pt"
                              ? "Não especificado"
                              : "Not specified")}
                        </h5>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 3. DIÁRIO DE BORDO & AUTO-AVALIAÇÃO */}
          {mentoringSubTab === "diary" && (
            <div className="flex flex-col gap-6 animate-in fade-in duration-200">
              {/* Journal Submit Form */}
              {viewMode === "owner" && (
                <div className="bg-white border border-slate-100 p-8 rounded-[2.5rem] shadow-sm flex flex-col gap-6">
                  <div>
                    <h3 className="text-sm font-black uppercase tracking-wider text-slate-800">
                      Nova Entrada do Diário
                    </h3>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                      Registre suas métricas cognitivas e aprendizados do dia
                      (+200 XP)
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* 1. CC */}
                    <div className="flex flex-col gap-2">
                      <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                        <Activity className="w-3.5 h-3.5 text-indigo-500" />
                        <span>Esforço Mental / Foco: {diaryCC} / 10</span>
                      </label>
                      <input
                        type="range"
                        min="1"
                        max="10"
                        value={diaryCC}
                        onChange={(e) => setDiaryCC(Number(e.target.value))}
                        className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                      />
                      <div className="flex justify-between text-[7px] font-black text-slate-400 uppercase tracking-widest mt-0.5">
                        <span>Tranquilo</span>
                        <span>Sobrecarga</span>
                      </div>
                    </div>

                    {/* 2. TE */}
                    <div className="flex flex-col gap-2">
                      <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                        <CalendarDays className="w-3.5 h-3.5 text-indigo-500" />
                        <span>Tempo Dedicado / Foco: {diaryTE} / 10</span>
                      </label>
                      <input
                        type="range"
                        min="1"
                        max="10"
                        value={diaryTE}
                        onChange={(e) => setDiaryTE(Number(e.target.value))}
                        className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                      />
                      <div className="flex justify-between text-[7px] font-black text-slate-400 uppercase tracking-widest mt-0.5">
                        <span>Muito Rápido</span>
                        <span>Demorado</span>
                      </div>
                    </div>

                    {/* 3. Progresso */}
                    <div className="flex flex-col gap-2">
                      <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                        <TrendingUp className="w-3.5 h-3.5 text-indigo-500" />
                        <span>Progresso Real: {diaryProgress}%</span>
                      </label>
                      <input
                        type="range"
                        min="10"
                        max="100"
                        step="10"
                        value={diaryProgress}
                        onChange={(e) =>
                          setDiaryProgress(Number(e.target.value))
                        }
                        className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                      />
                      <div className="flex justify-between text-[7px] font-black text-slate-400 uppercase tracking-widest mt-0.5">
                        <span>Parado</span>
                        <span>100% Concluído</span>
                      </div>
                    </div>
                  </div>

                  {/* Notes Textarea */}
                  <div className="flex flex-col gap-2">
                    <label className="text-[10px] font-black uppercase tracking-wider text-slate-500">
                      Anotações & Relato de Aprendizados
                    </label>
                    <textarea
                      rows={3}
                      value={diaryText}
                      onChange={(e) => setDiaryText(e.target.value)}
                      placeholder="Quais foram seus desafios hoje? O que você aprendeu ou realizou?"
                      className="w-full p-4 border border-slate-100 rounded-2xl text-xs font-semibold text-slate-700 placeholder-slate-400 focus:outline-none focus:border-indigo-600/50"
                    />
                  </div>

                  <div className="flex justify-between items-center pt-2">
                    <div className="text-[9px] font-bold text-slate-400 flex items-center gap-1">
                      <Info className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                      <span>
                        Fórmula de Tensão: TC = CC / TE | Fórmula de Distorção:
                        D = TC / (Progress %)
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={async () => {
                        if (!diaryText.trim()) {
                          push({
                            title: `Escreva algo nas anotações antes de registrar seu ${termDiary}!`,
                            variant: "destructive",
                          });
                          return;
                        }

                        const tension = diaryCC / diaryTE;
                        const distortion = tension / (diaryProgress / 100);

                        const newLog = {
                          date: new Date().toLocaleDateString("pt-BR"),
                          CC: diaryCC,
                          TE: diaryTE,
                          progress: diaryProgress,
                          tension: parseFloat(tension.toFixed(2)),
                          distortion: parseFloat(distortion.toFixed(2)),
                          text: diaryText.trim(),
                        };

                        const updatedLogs = [...diaryLogs, newLog];
                        const nextXp = xp + diaryXpWeight; // Award dynamic XP

                        setDiaryLogs(updatedLogs);
                        setXp(nextXp);
                        setDiaryText("");

                        await saveGamifiedData({
                          xp: nextXp,
                          diaryLogs: updatedLogs,
                        });
                        push({
                          title: `${termDiary} registrado! +${diaryXpWeight} XP recebidos!`,
                          variant: "success",
                        });
                      }}
                      className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl text-[10px] font-black uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer shadow-md"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Registrar Entrada</span>
                    </button>
                  </div>
                </div>
              )}

              {/* History list */}
              <div className="bg-white border border-slate-100 p-8 rounded-[2.5rem] shadow-sm flex flex-col gap-4">
                <div>
                  <h3 className="text-sm font-black uppercase tracking-wider text-slate-800">
                    Histórico de Diários
                  </h3>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                    Acompanhe sua carga diária e distorções cognitivas
                  </p>
                </div>

                {diaryLogs.length === 0 ? (
                  <p className="text-xs text-slate-400 font-bold py-4">
                    Nenhuma anotação registrada até o momento.
                  </p>
                ) : (
                  <div className="flex flex-col gap-4">
                    {diaryLogs
                      .slice()
                      .reverse()
                      .map((log, idx) => {
                        const distLevel = log.distortion;
                        return (
                          <div
                            key={idx}
                            className="p-6 border border-slate-50 bg-slate-50/20 rounded-[1.8rem] flex flex-col md:flex-row gap-6 items-start"
                          >
                            {/* Metrics group */}
                            <div className="flex md:flex-col gap-3 shrink-0 w-full md:w-auto">
                              <div className="bg-white px-4 py-2 border border-slate-100 rounded-2xl text-center flex-1 md:flex-none">
                                <span className="text-[8px] font-black uppercase tracking-widest text-slate-400 block">
                                  Tensão
                                </span>
                                <span className="text-sm font-black text-slate-800">
                                  {log.tension}
                                </span>
                              </div>

                              <div className="bg-white px-4 py-2 border border-slate-100 rounded-2xl text-center flex-1 md:flex-none">
                                <span className="text-[8px] font-black uppercase tracking-widest text-slate-400 block">
                                  Distorção
                                </span>
                                <span className="text-sm font-black text-slate-800">
                                  {log.distortion}
                                </span>
                              </div>

                              <div
                                className={cn(
                                  "px-3 py-1.5 rounded-xl text-center flex-1 md:flex-none flex items-center justify-center text-[8px] font-black uppercase tracking-wider border",
                                  distLevel < 0.7
                                    ? "bg-emerald-50 text-emerald-600 border-emerald-100"
                                    : distLevel <= 1.3
                                      ? "bg-blue-50 text-blue-600 border-blue-100"
                                      : "bg-rose-50 text-rose-600 border-rose-100",
                                )}
                              >
                                {distLevel < 0.7
                                  ? "Fluxo Alto"
                                  : distLevel <= 1.3
                                    ? "Equilibrado"
                                    : "Risco Burnout"}
                              </div>
                            </div>

                            {/* Content group */}
                            <div className="flex-1 w-full text-left">
                              <div className="flex items-center justify-between border-b border-slate-100 pb-2 mb-2">
                                <span className="text-[9px] font-black uppercase tracking-widest text-indigo-600">
                                  {log.date}
                                </span>
                                <span className="text-[8px] font-bold text-slate-400">
                                  CC: {log.CC} | TE: {log.TE} | Prog:{" "}
                                  {log.progress}%
                                </span>
                              </div>
                              <p className="text-xs font-medium text-slate-700 leading-relaxed whitespace-pre-line">
                                {log.text}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 4. KANBAN DE TAREFAS */}
          {mentoringSubTab === "tasks" && (
            <div className="animate-in fade-in duration-200">
              <MentoringKanbanBoard
                workspaceId={workspaceId || ""}
                isOwner={isOwner}
                currentUserRole={role}
              />
            </div>
          )}

          {/* 5. AGENDA DE SESSÕES */}
          {mentoringSubTab === "schedule" && (
            <div className="animate-in fade-in duration-200">
              <MentoringScheduleBoard
                workspaceId={workspaceId || ""}
                isOwner={isOwner}
              />
            </div>
          )}

          {/* 5.5. PROJETOS PROFISSIONAIS */}
          {mentoringSubTab === "projects" && (
            <div className="flex flex-col gap-6 animate-in fade-in duration-200">
              {/* Header Box */}
              <div className="bg-white border border-slate-100 p-8 rounded-[2.5rem] shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <h3 className="text-sm font-black uppercase tracking-wider text-slate-800">
                    {t("admin.mentoringProfile.projects.title")}
                  </h3>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                    {t("admin.mentoringProfile.projects.subtitle")}
                  </p>
                </div>
                {viewMode === "owner" && (
                  <button
                    onClick={() => {
                      setEditingProjectId(null);
                      setProjectTitle("");
                      setProjectDescription("");
                      setProjectImageUrl("");
                      setProjectTagsString("");
                      setIsProjectFormOpen(true);
                    }}
                    className="flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.1em] shadow-xl shadow-indigo-100 transition-all cursor-pointer hover:scale-[1.02] shrink-0"
                  >
                    <Plus className="w-4 h-4" />
                    {t("admin.mentoringProfile.projects.newProject")}
                  </button>
                )}
              </div>

              {/* Add/Edit Project Form (Only in Owner ViewMode and when isProjectFormOpen is true) */}
              {viewMode === "owner" && isProjectFormOpen && (
                <form
                  onSubmit={handleSaveProject}
                  className="bg-white border border-slate-100 p-8 rounded-[2.5rem] shadow-md flex flex-col gap-5 animate-in slide-in-from-top duration-300"
                >
                  <div className="flex items-center justify-between border-b border-slate-50 pb-3">
                    <h4 className="text-xs font-black uppercase tracking-wider text-slate-700">
                      {editingProjectId
                        ? t("admin.mentoringProfile.projects.editProject")
                        : t("admin.mentoringProfile.projects.addProject")}
                    </h4>
                    <button
                      type="button"
                      onClick={() => setIsProjectFormOpen(false)}
                      className="text-xs font-bold text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      {t("admin.mentoringProfile.projects.cancelBtn")}
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {/* Title */}
                    <div className="flex flex-col gap-2">
                      <label className="text-[9px] font-black uppercase tracking-widest text-slate-400">
                        {t("admin.mentoringProfile.projects.projectTitleLabel")}
                      </label>
                      <input
                        type="text"
                        value={projectTitle}
                        onChange={(e) => setProjectTitle(e.target.value)}
                        placeholder={t(
                          "admin.mentoringProfile.projects.projectTitlePlaceholder",
                        )}
                        className="bg-slate-50 border border-slate-100 rounded-2xl px-4 py-3 text-xs font-semibold focus:outline-indigo-600 text-slate-800"
                        required
                      />
                    </div>

                    {/* Tags */}
                    <div className="flex flex-col gap-2">
                      <label className="text-[9px] font-black uppercase tracking-widest text-slate-400">
                        {t("admin.mentoringProfile.projects.tagsLabel")}
                      </label>
                      <input
                        type="text"
                        value={projectTagsString}
                        onChange={(e) => setProjectTagsString(e.target.value)}
                        placeholder={t(
                          "admin.mentoringProfile.projects.tagsPlaceholder",
                        )}
                        className="bg-slate-50 border border-slate-100 rounded-2xl px-4 py-3 text-xs font-semibold focus:outline-indigo-600 text-slate-800"
                      />
                    </div>
                  </div>

                  {/* Description */}
                  <div className="flex flex-col gap-2">
                    <label className="text-[9px] font-black uppercase tracking-widest text-slate-400">
                      {t("admin.mentoringProfile.projects.descLabel")}
                    </label>
                    <textarea
                      value={projectDescription}
                      onChange={(e) => setProjectDescription(e.target.value)}
                      placeholder={t(
                        "admin.mentoringProfile.projects.descPlaceholder",
                      )}
                      className="bg-slate-50 border border-slate-100 rounded-2xl px-4 py-3 text-xs font-semibold min-h-[100px] focus:outline-indigo-600 text-slate-800"
                    />
                  </div>

                  {/* Image Upload */}
                  <div className="flex flex-col gap-2">
                    <label className="text-[9px] font-black uppercase tracking-widest text-slate-400">
                      {t("admin.mentoringProfile.projects.imgLabel")}
                    </label>
                    <div className="flex flex-col sm:flex-row items-center gap-3">
                      <input
                        type="text"
                        value={projectImageUrl}
                        onChange={(e) => setProjectImageUrl(e.target.value)}
                        placeholder={t(
                          "admin.mentoringProfile.projects.imgPlaceholder",
                        )}
                        className="flex-1 bg-slate-50 border border-slate-100 rounded-2xl px-4 py-3 text-xs font-semibold focus:outline-indigo-600 text-slate-800"
                      />
                      <label className="flex items-center gap-2 px-5 py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-2xl text-[10px] font-black uppercase tracking-wider cursor-pointer select-none">
                        <UploadCloud className="w-4 h-4 text-indigo-500" />
                        <span>
                          {t("admin.mentoringProfile.projects.uploadBtn")}
                        </span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleProjectImageUpload}
                          className="hidden"
                        />
                      </label>
                    </div>
                    {projectImageUrl && (
                      <div className="mt-2 w-32 h-20 rounded-xl overflow-hidden border border-slate-100 shadow-sm relative group bg-slate-900">
                        <img
                          src={projectImageUrl}
                          alt="Preview"
                          className="w-full h-full object-cover"
                        />
                        <button
                          type="button"
                          onClick={() => setProjectImageUrl("")}
                          className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-[9px] font-black uppercase transition-all"
                        >
                          {t("admin.mentoringProfile.projects.removeBtn")}
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="flex justify-end gap-3 mt-2">
                    <button
                      type="button"
                      onClick={() => setIsProjectFormOpen(false)}
                      className="px-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-2xl text-[10px] font-black uppercase tracking-[0.1em] cursor-pointer"
                    >
                      {t("admin.mentoringProfile.projects.cancelBtn")}
                    </button>
                    <button
                      type="submit"
                      className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.1em] shadow-xl shadow-indigo-100 cursor-pointer"
                    >
                      {editingProjectId
                        ? t("admin.mentoringProfile.projects.saveBtn")
                        : t("admin.mentoringProfile.projects.addBtn")}
                    </button>
                  </div>
                </form>
              )}

              {/* Projects Grid */}
              {projects.length === 0 ? (
                <div className="bg-white border border-slate-100 rounded-[2.5rem] p-12 text-center shadow-sm flex flex-col items-center justify-center gap-4">
                  <Briefcase className="w-10 h-10 text-slate-300" />
                  <div>
                    <h4 className="text-xs font-black uppercase tracking-wide text-slate-800">
                      {t("admin.mentoringProfile.projects.emptyTitle")}
                    </h4>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-1">
                      {t("admin.mentoringProfile.projects.emptySubtitle")}
                    </p>
                  </div>
                  {viewMode === "owner" && (
                    <button
                      onClick={() => setIsProjectFormOpen(true)}
                      className="flex items-center gap-2 px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-[9px] font-black uppercase tracking-wider cursor-pointer"
                    >
                      {t("admin.mentoringProfile.projects.addFirstProject")}
                    </button>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                  {projects.map((proj) => (
                    <div
                      key={proj.id}
                      className="bg-white border border-slate-100 rounded-[2rem] p-5 flex flex-col gap-4 shadow-sm hover:shadow-md transition-all duration-300 relative group"
                    >
                      {viewMode === "owner" && (
                        <div className="absolute top-4 right-4 flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-all duration-300 bg-white/95 border border-slate-100 p-1.5 rounded-xl shadow-sm z-10">
                          <button
                            onClick={() => handleToggleFeatureProject(proj.id)}
                            className={cn(
                              "p-1 rounded cursor-pointer animate-in fade-in transition-colors",
                              featuredProjectIds.includes(proj.id)
                                ? "text-amber-500 hover:text-amber-600"
                                : "text-slate-400 hover:text-slate-600",
                            )}
                            title={
                              featuredProjectIds.includes(proj.id)
                                ? t(
                                    "admin.mentoringProfile.projects.removeFeatured",
                                  )
                                : t(
                                    "admin.mentoringProfile.projects.featurePublic",
                                  )
                            }
                          >
                            <Star
                              className={cn(
                                "w-3.5 h-3.5",
                                featuredProjectIds.includes(proj.id) &&
                                  "fill-amber-500",
                              )}
                            />
                          </button>
                          <button
                            onClick={() => handleEditProjectClick(proj)}
                            className="p-1 hover:bg-slate-100 text-slate-600 rounded cursor-pointer animate-in fade-in"
                            title={t(
                              "admin.mentoringProfile.projects.editProject",
                            )}
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteProject(proj.id)}
                            className="p-1 hover:bg-red-50 text-red-600 rounded cursor-pointer animate-in fade-in"
                            title={t(
                              "admin.mentoringProfile.mentorControls.deleteTemplate",
                            )}
                          >
                            <Trash className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}

                      {proj.imageUrl && (
                        <div className="w-full h-40 rounded-[1.5rem] overflow-hidden bg-slate-900 border border-slate-100">
                          <img
                            src={proj.imageUrl}
                            alt={proj.title}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}

                      <div className="flex flex-col gap-1.5">
                        <h4 className="text-xs font-black uppercase tracking-wide text-slate-800 leading-tight">
                          {proj.title}
                        </h4>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider leading-relaxed">
                          {proj.description}
                        </p>
                      </div>

                      {proj.tags && proj.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-auto pt-2 border-t border-slate-50">
                          {proj.tags.map((tag: string, tIdx: number) => (
                            <span
                              key={tIdx}
                              className="bg-indigo-50 border border-indigo-100 text-indigo-600 px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* 7. TRILHAS DE MENTORIA */}
          {mentoringSubTab === "tracks" && workspaceId && (
            <div className="animate-in fade-in duration-200">
              {role === "mentor" && viewMode === "owner" ? (
                <TrackBuilderBoard workspaceId={workspaceId} locale={locale} />
              ) : (
                <TrackProgressView
                  userId={userId || authUser?.id || ""}
                  workspaceId={workspaceId}
                  locale={locale}
                />
              )}
            </div>
          )}

          {/* 6. PAINEL DE CONTROLES DO SUPER MENTOR */}
          {mentoringSubTab === "admin_controls" &&
            role === "mentor" &&
            viewMode === "owner" && (
              <div className="flex flex-col gap-6 animate-in fade-in duration-200">
                {/* Nomenclaturas Chaves */}
                <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col gap-6">
                  <div>
                    <h3 className="text-sm font-black uppercase tracking-wider text-slate-800">
                      {t(
                        "admin.mentoringProfile.mentorControls.nomenclaturasTitle",
                      )}
                    </h3>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                      {t(
                        "admin.mentoringProfile.mentorControls.nomenclaturasSubtitle",
                      )}
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[9px] font-black uppercase tracking-widest text-slate-400">
                        {t(
                          "admin.mentoringProfile.mentorControls.termDiaryLabel",
                        )}
                      </label>
                      <input
                        type="text"
                        value={termDiary}
                        onChange={(e) => setTermDiary(e.target.value)}
                        className="px-4 py-2 bg-slate-50 border border-slate-200/50 rounded-xl outline-none text-xs font-semibold text-slate-800"
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[9px] font-black uppercase tracking-widest text-slate-400">
                        {t(
                          "admin.mentoringProfile.mentorControls.termTensionLabel",
                        )}
                      </label>
                      <input
                        type="text"
                        value={termTension}
                        onChange={(e) => setTermTension(e.target.value)}
                        className="px-4 py-2 bg-slate-50 border border-slate-200/50 rounded-xl outline-none text-xs font-semibold text-slate-800"
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[9px] font-black uppercase tracking-widest text-slate-400">
                        {t(
                          "admin.mentoringProfile.mentorControls.termDistortionLabel",
                        )}
                      </label>
                      <input
                        type="text"
                        value={termDistortion}
                        onChange={(e) => setTermDistortion(e.target.value)}
                        className="px-4 py-2 bg-slate-50 border border-slate-200/50 rounded-xl outline-none text-xs font-semibold text-slate-800"
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[9px] font-black uppercase tracking-widest text-slate-400">
                        {t(
                          "admin.mentoringProfile.mentorControls.termSidequestLabel",
                        )}
                      </label>
                      <input
                        type="text"
                        value={termSidequest}
                        onChange={(e) => setTermSidequest(e.target.value)}
                        className="px-4 py-2 bg-slate-50 border border-slate-200/50 rounded-xl outline-none text-xs font-semibold text-slate-800"
                      />
                    </div>
                  </div>
                </div>

                {/* Parâmetros do Algoritmo & Gamificação */}
                <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col gap-6">
                  <div>
                    <h3 className="text-sm font-black uppercase tracking-wider text-slate-800">
                      {t("admin.mentoringProfile.mentorControls.algoXpTitle")}
                    </h3>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                      {t(
                        "admin.mentoringProfile.mentorControls.algoXpSubtitle",
                      )}
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
                    {/* Task XP */}
                    <div className="flex flex-col gap-2">
                      <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-indigo-500 animate-pulse" />
                        <span>
                          {t(
                            "admin.mentoringProfile.mentorControls.xpTaskLabel",
                            { value: taskXpWeight },
                          )}
                        </span>
                      </label>
                      <input
                        type="range"
                        min="50"
                        max="500"
                        step="10"
                        value={taskXpWeight}
                        onChange={(e) =>
                          setTaskXpWeight(Number(e.target.value))
                        }
                        className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                      />
                    </div>

                    {/* Diary XP */}
                    <div className="flex flex-col gap-2">
                      <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-indigo-500 animate-pulse" />
                        <span>
                          {t(
                            "admin.mentoringProfile.mentorControls.xpDiaryLabel",
                            { value: diaryXpWeight },
                          )}
                        </span>
                      </label>
                      <input
                        type="range"
                        min="50"
                        max="500"
                        step="10"
                        value={diaryXpWeight}
                        onChange={(e) =>
                          setDiaryXpWeight(Number(e.target.value))
                        }
                        className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                      />
                    </div>

                    {/* Session XP */}
                    <div className="flex flex-col gap-2">
                      <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-indigo-500 animate-pulse" />
                        <span>
                          {t(
                            "admin.mentoringProfile.mentorControls.xpSessionLabel",
                            { value: sessionXpWeight },
                          )}
                        </span>
                      </label>
                      <input
                        type="range"
                        min="50"
                        max="1000"
                        step="50"
                        value={sessionXpWeight}
                        onChange={(e) =>
                          setSessionXpWeight(Number(e.target.value))
                        }
                        className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                      />
                    </div>

                    {/* Burnout Risk Limit */}
                    <div className="flex flex-col gap-2">
                      <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                        <Shield className="w-3.5 h-3.5 text-indigo-500" />
                        <span>
                          {t(
                            "admin.mentoringProfile.mentorControls.burnoutLimitLabel",
                            { value: burnoutThreshold.toFixed(1) },
                          )}
                        </span>
                      </label>
                      <input
                        type="range"
                        min="1.0"
                        max="2.0"
                        step="0.1"
                        value={burnoutThreshold}
                        onChange={(e) =>
                          setBurnoutThreshold(Number(e.target.value))
                        }
                        className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                      />
                    </div>
                  </div>
                </div>
                {/* Templates de Sessão */}
                <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col gap-6">
                  <div>
                    <h3 className="text-sm font-black uppercase tracking-wider text-slate-800">
                      {t(
                        "admin.mentoringProfile.mentorControls.templatesTitle",
                      )}
                    </h3>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                      {t(
                        "admin.mentoringProfile.mentorControls.templatesSubtitle",
                      )}
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Create template form */}
                    <div className="bg-slate-50 p-6 rounded-[2rem] border border-slate-100 flex flex-col gap-4">
                      <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                        {editingTemplateId
                          ? locale === "pt"
                            ? "Editar Template"
                            : "Edit Template"
                          : t(
                              "admin.mentoringProfile.mentorControls.createNewTemplate",
                            )}
                      </h4>

                      <div className="flex flex-col gap-1.5">
                        <label className="text-[8px] font-black uppercase text-slate-400">
                          {t(
                            "admin.mentoringProfile.mentorControls.templateTitleLabel",
                          )}
                        </label>
                        <input
                          type="text"
                          placeholder={t(
                            "admin.mentoringProfile.mentorControls.templateTitlePlaceholder",
                          )}
                          value={newTemplateTitle}
                          onChange={(e) => setNewTemplateTitle(e.target.value)}
                          className="px-3 py-1.5 bg-white border border-slate-200/50 rounded-xl outline-none text-xs font-semibold text-slate-800"
                        />
                      </div>

                      <div className="flex flex-col gap-1.5">
                        <label className="text-[8px] font-black uppercase text-slate-400">
                          {t(
                            "admin.mentoringProfile.mentorControls.templateDurationLabel",
                          )}
                        </label>
                        <input
                          type="number"
                          placeholder="60"
                          value={newTemplateDuration}
                          onChange={(e) =>
                            setNewTemplateDuration(Number(e.target.value))
                          }
                          className="px-3 py-1.5 bg-white border border-slate-200/50 rounded-xl outline-none text-xs font-semibold text-slate-800"
                        />
                      </div>

                      <div className="flex flex-col gap-1.5">
                        <label className="text-[8px] font-black uppercase text-slate-400">
                          {t(
                            "admin.mentoringProfile.mentorControls.templateDescLabel",
                          )}
                        </label>
                        <textarea
                          rows={2}
                          placeholder={t(
                            "admin.mentoringProfile.mentorControls.templateDescPlaceholder",
                          )}
                          value={newTemplateDesc}
                          onChange={(e) => setNewTemplateDesc(e.target.value)}
                          className="px-3 py-1.5 bg-white border border-slate-200/50 rounded-xl outline-none text-xs font-semibold text-slate-800 resize-none"
                        />
                      </div>

                      <div className="flex flex-col gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            if (!newTemplateTitle.trim()) {
                              push({
                                title: t(
                                  "admin.mentoringProfile.mentorControls.fillTemplateWarning",
                                ),
                                variant: "destructive",
                              });
                              return;
                            }
                            if (editingTemplateId) {
                              const nextTemps = sessionTemplates.map((t) =>
                                t.id === editingTemplateId
                                  ? {
                                      ...t,
                                      title: newTemplateTitle.trim(),
                                      duration: newTemplateDuration || 60,
                                      desc:
                                        newTemplateDesc.trim() ||
                                        (locale === "pt"
                                          ? "Sem descrição."
                                          : "No description."),
                                    }
                                  : t,
                              );
                              setSessionTemplates(nextTemps);
                              setEditingTemplateId(null);
                              setNewTemplateTitle("");
                              setNewTemplateDesc("");
                              setNewTemplateDuration(60);
                              push({
                                title: "Template de Sessão atualizado!",
                                variant: "success",
                              });
                              saveGamifiedData({ sessionTemplates: nextTemps });
                            } else {
                              const nextTemps = [
                                ...sessionTemplates,
                                {
                                  id: String(Date.now()),
                                  title: newTemplateTitle.trim(),
                                  duration: newTemplateDuration || 60,
                                  desc:
                                    newTemplateDesc.trim() || "Sem descrição.",
                                },
                              ];
                              setSessionTemplates(nextTemps);
                              setNewTemplateTitle("");
                              setNewTemplateDesc("");
                              setNewTemplateDuration(60);
                              push({
                                title: "Template de Sessão adicionado!",
                                variant: "success",
                              });
                              saveGamifiedData({ sessionTemplates: nextTemps });
                            }
                          }}
                          className="w-full py-2 bg-slate-900 text-white rounded-xl text-[9px] font-black uppercase tracking-widest cursor-pointer hover:bg-slate-800 transition-colors"
                        >
                          {editingTemplateId
                            ? "Salvar Alterações"
                            : "Adicionar Modelo"}
                        </button>

                        {editingTemplateId && (
                          <button
                            type="button"
                            onClick={() => {
                              setEditingTemplateId(null);
                              setNewTemplateTitle("");
                              setNewTemplateDesc("");
                              setNewTemplateDuration(60);
                            }}
                            className="w-full py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl text-[9px] font-black uppercase tracking-widest cursor-pointer transition-colors"
                          >
                            Cancelar Edição
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Templates List */}
                    <div className="md:col-span-2 flex flex-col gap-4">
                      <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                        Modelos de Sessão Salvos
                      </h4>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-[300px] overflow-y-auto pr-1">
                        {sessionTemplates.map((template) => (
                          <div
                            key={template.id}
                            className="p-5 border border-slate-100 bg-slate-50/20 rounded-[1.8rem] flex flex-col justify-between gap-3 text-left"
                          >
                            <div>
                              <div className="flex items-center justify-between border-b border-slate-100 pb-1.5 mb-1.5">
                                <span className="text-xs font-black text-slate-800 uppercase tracking-wide">
                                  {template.title}
                                </span>
                                <span className="text-[8px] bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-full font-black uppercase">
                                  {template.duration} min
                                </span>
                              </div>
                              <p className="text-[9px] font-semibold text-slate-500 leading-relaxed">
                                {template.desc}
                              </p>
                            </div>

                            <div className="flex gap-3">
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingTemplateId(template.id);
                                  setNewTemplateTitle(template.title);
                                  setNewTemplateDuration(template.duration);
                                  setNewTemplateDesc(template.desc);
                                }}
                                className="text-left text-[8px] font-black uppercase tracking-wider text-indigo-600 hover:text-indigo-850 transition-colors cursor-pointer border-none bg-transparent"
                              >
                                Editar
                              </button>
                              <span className="text-[8px] text-slate-250">
                                |
                              </span>
                              <button
                                type="button"
                                onClick={() => {
                                  const nextTemps = sessionTemplates.filter(
                                    (t) => t.id !== template.id,
                                  );
                                  setSessionTemplates(nextTemps);
                                  if (editingTemplateId === template.id) {
                                    setEditingTemplateId(null);
                                    setNewTemplateTitle("");
                                    setNewTemplateDesc("");
                                    setNewTemplateDuration(60);
                                  }
                                  push({
                                    title: t(
                                      "admin.mentoringProfile.mentorControls.templateDeletedToast",
                                    ),
                                    variant: "success",
                                  });
                                  saveGamifiedData({
                                    sessionTemplates: nextTemps,
                                  });
                                }}
                                className="text-left text-[8px] font-black uppercase tracking-wider text-rose-500 hover:text-rose-700 transition-colors cursor-pointer border-none bg-transparent"
                              >
                                {t(
                                  "admin.mentoringProfile.mentorControls.deleteTemplate",
                                )}
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
        </div>
      )}
      {activeSubTab === "edit" && (
        <form
          onSubmit={handleSave}
          className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-3 duration-300"
        >
          {/* LinkedIn Import helper row */}
          <div className="p-5 bg-slate-900 rounded-[2rem] text-white flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-indigo-600 rounded-xl">
                <CloudLightning className="w-5 h-5" />
              </div>
              <div className="text-left">
                <h4 className="text-sm font-black uppercase tracking-wider">
                  {t("admin.mentoringProfile.edit.realLinkedinImportTitle")}
                </h4>
                <p className="text-[9px] font-black uppercase tracking-wider text-slate-400">
                  {t("admin.mentoringProfile.edit.realLinkedinImportDesc")}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={triggerLinkedInImport}
                disabled={linkedinStage !== "idle"}
                className="px-6 py-2.5 bg-[#0077b5] hover:bg-[#006297] text-white rounded-xl text-[10px] font-black uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {linkedinStage === "idle" ? (
                  <Linkedin className="w-4 h-4" />
                ) : (
                  <Loader2 className="w-4 h-4 animate-spin" />
                )}
                <span>
                  {linkedinStage === "idle"
                    ? t("admin.mentoringProfile.edit.realLinkedinBtn")
                    : linkedinStage === "connecting"
                      ? t("admin.mentoringProfile.edit.realLinkedinConnecting")
                      : linkedinStage === "extracting"
                        ? t(
                            "admin.mentoringProfile.edit.realLinkedinExtracting",
                          )
                        : linkedinStage === "populating"
                          ? t(
                              "admin.mentoringProfile.edit.realLinkedinPopulating",
                            )
                          : t(
                              "admin.mentoringProfile.edit.realLinkedinImported",
                            )}
                </span>
              </button>

              {linkedinStage !== "idle" && (
                <button
                  type="button"
                  onClick={() => {
                    setLinkedinStage("idle");
                    push({
                      title: t(
                        "admin.mentoringProfile.edit.cancelSuccessToast",
                      ),
                      variant: "success",
                    });
                  }}
                  className="px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer"
                >
                  {t("admin.mentoringProfile.edit.cancelBtn")}
                </button>
              )}
            </div>
          </div>

          <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col gap-6">
            <h3 className="text-sm font-black uppercase text-slate-800 tracking-tight border-b border-slate-50 pb-2">
              {t("admin.mentoringProfile.edit.generalInfoTitle")}
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[9px] font-black uppercase tracking-widest text-slate-400">
                  {t("admin.mentoringProfile.edit.roleLabel")}
                </label>
                <div className="flex gap-2">
                  {[
                    {
                      val: "mentor",
                      label: t("admin.mentoringProfile.edit.roleMentor"),
                    },
                    {
                      val: "mentee",
                      label: t("admin.mentoringProfile.edit.roleMentee"),
                    },
                  ].map((item) => (
                    <button
                      key={item.val}
                      type="button"
                      onClick={() => setRole(item.val as any)}
                      className={cn(
                        "flex-1 py-2 rounded-xl border text-[10px] font-black uppercase transition-all cursor-pointer text-center",
                        role === item.val
                          ? "bg-indigo-600 border-indigo-600 text-white shadow-md shadow-indigo-100"
                          : "bg-slate-50 border-slate-200/50 text-slate-500 hover:bg-slate-100",
                      )}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[9px] font-black uppercase tracking-widest text-slate-400">
                  {t("admin.mentoringProfile.edit.fullNameLabel")}
                </label>
                <input
                  required
                  type="text"
                  placeholder={t(
                    "admin.mentoringProfile.edit.fullNamePlaceholder",
                  )}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200/50 rounded-xl outline-none text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-indigo-100"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[9px] font-black uppercase tracking-widest text-slate-400">
                  {t("admin.mentoringProfile.edit.usernameLabel")}
                </label>
                <div className="relative flex items-center">
                  <span className="absolute left-3 text-[8px] font-black uppercase tracking-wider text-slate-400 pointer-events-none">
                    /public/mentoring/
                  </span>
                  <input
                    type="text"
                    required
                    placeholder={t(
                      "admin.mentoringProfile.edit.usernamePlaceholder",
                    )}
                    value={username}
                    onChange={(e) => {
                      // Apply lowercase, replace spaces/specials with dashes, strip duplicates
                      const slug = e.target.value
                        .toLowerCase()
                        .replace(/[^a-z0-9-]/g, "-")
                        .replace(/-+/g, "-");
                      setUsername(slug);
                    }}
                    className="w-full pl-[118px] pr-4 py-2 bg-slate-50 border border-slate-200/50 rounded-xl outline-none text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-indigo-100"
                  />
                </div>
                <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                  {t("admin.mentoringProfile.edit.usernameRules")}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[9px] font-black uppercase tracking-widest text-slate-400">
                  {t("admin.mentoringProfile.edit.photoLabel")}
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                    id="profile-photo-upload"
                  />
                  <label
                    htmlFor="profile-photo-upload"
                    className="px-4 py-2.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5 border border-indigo-100/50 shrink-0"
                  >
                    {isUploading ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <CloudLightning className="w-3.5 h-3.5" />
                    )}
                    <span>
                      {isUploading
                        ? t("admin.mentoringProfile.edit.photoUploading")
                        : t("admin.mentoringProfile.edit.photoUploadBtn")}
                    </span>
                  </label>
                  <input
                    type="text"
                    placeholder="https://res.cloudinary.com/..."
                    value={photoUrl}
                    onChange={(e) => setPhotoUrl(e.target.value)}
                    className="flex-1 px-4 py-2 bg-slate-50 border border-slate-200/50 rounded-xl outline-none text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-indigo-100"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[9px] font-black uppercase tracking-widest text-slate-400">
                  {t("admin.mentoringProfile.edit.taglineLabel")}
                </label>
                <input
                  type="text"
                  placeholder="Ex: CEO na 21 Miles | Desenvolvedor Upwork"
                  value={tagline}
                  onChange={(e) => setTagline(e.target.value)}
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200/50 rounded-xl outline-none text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-indigo-100"
                />
              </div>

              {role === "mentee" && (
                <div className="flex flex-col gap-1.5">
                  <label className="text-[9px] font-black uppercase tracking-widest text-slate-400">
                    {t("admin.mentoringProfile.edit.genderLabel")}
                  </label>
                  <select
                    value={genderTerm}
                    onChange={(e) => setGenderTerm(e.target.value)}
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200/50 rounded-xl outline-none text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-indigo-100 cursor-pointer"
                  >
                    <option value="mentorado">
                      {t("admin.mentoringProfile.edit.genderMaleOption")}
                    </option>
                    <option value="mentorada">
                      {t("admin.mentoringProfile.edit.genderFemaleOption")}
                    </option>
                    <option value="mentoradx">
                      {t("admin.mentoringProfile.edit.genderNeutralOption")}
                    </option>
                  </select>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[9px] font-black uppercase tracking-widest text-slate-400">
                  {t("admin.mentoringProfile.edit.linkedinLinkLabel")}
                </label>
                <input
                  type="text"
                  placeholder="https://linkedin.com/in/..."
                  value={linkedinUrl}
                  onChange={(e) => setLinkedinUrl(e.target.value)}
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200/50 rounded-xl outline-none text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-indigo-100"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[9px] font-black uppercase tracking-widest text-slate-400">
                  {t("admin.mentoringProfile.edit.motivationalLabel")}
                </label>
                <input
                  type="text"
                  placeholder={t(
                    "admin.mentoringProfile.edit.motivationalPlaceholder",
                  )}
                  value={motivationalQuote}
                  onChange={(e) => setMotivationalQuote(e.target.value)}
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200/50 rounded-xl outline-none text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-indigo-100"
                />
              </div>
            </div>
          </div>

          {/* CONTACTS & SOCIALS EDIT CARD */}
          <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col gap-6">
            <h3 className="text-sm font-black uppercase text-slate-800 tracking-tight border-b border-slate-50 pb-2">
              {t("admin.mentoringProfile.edit.contactsTitle")}
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[9px] font-black uppercase tracking-widest text-slate-400">
                  {t("admin.mentoringProfile.edit.phoneLabel")}
                </label>
                <input
                  type="text"
                  placeholder={t(
                    "admin.mentoringProfile.edit.phonePlaceholder",
                  )}
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200/50 rounded-xl outline-none text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-indigo-100"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[9px] font-black uppercase tracking-widest text-slate-400">
                  {t("admin.mentoringProfile.edit.whatsappLabel")}
                </label>
                <input
                  type="text"
                  placeholder={t(
                    "admin.mentoringProfile.edit.whatsappPlaceholder",
                  )}
                  value={whatsapp}
                  onChange={(e) => setWhatsapp(e.target.value)}
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200/50 rounded-xl outline-none text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-indigo-100"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[9px] font-black uppercase tracking-widest text-slate-400">
                  {t("admin.mentoringProfile.edit.emailLabel")}
                </label>
                <input
                  type="email"
                  placeholder={t(
                    "admin.mentoringProfile.edit.emailPlaceholder",
                  )}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200/50 rounded-xl outline-none text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-indigo-100"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[9px] font-black uppercase tracking-widest text-slate-400">
                  {t("admin.mentoringProfile.edit.githubLabel")}
                </label>
                <input
                  type="text"
                  placeholder="https://github.com/..."
                  value={githubUrl}
                  onChange={(e) => setGithubUrl(e.target.value)}
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200/50 rounded-xl outline-none text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-indigo-100"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[9px] font-black uppercase tracking-widest text-slate-400">
                  {t("admin.mentoringProfile.edit.instagramLabel")}
                </label>
                <input
                  type="text"
                  placeholder="https://instagram.com/..."
                  value={instagramUrl}
                  onChange={(e) => setInstagramUrl(e.target.value)}
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200/50 rounded-xl outline-none text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-indigo-100"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[9px] font-black uppercase tracking-widest text-slate-400">
                  {t("admin.mentoringProfile.edit.websiteLabel")}
                </label>
                <input
                  type="text"
                  placeholder="https://..."
                  value={websiteUrl}
                  onChange={(e) => setWebsiteUrl(e.target.value)}
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200/50 rounded-xl outline-none text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-indigo-100"
                />
              </div>
            </div>
          </div>

          {/* FIELDS SPECIFIC TO ROLE */}
          {role === "mentor" ? (
            /* MENTOR FORM */
            <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col gap-6">
              <h3 className="text-sm font-black uppercase text-slate-800 tracking-tight border-b border-slate-50 pb-2">
                {t("admin.mentoringProfile.edit.mentorInfoTitle")}
              </h3>

              <div className="flex flex-col gap-1.5">
                <label className="text-[9px] font-black uppercase tracking-widest text-slate-400">
                  {t("admin.mentoringProfile.edit.mentorBioLabel")}
                </label>
                <textarea
                  rows={4}
                  placeholder={t(
                    "admin.mentoringProfile.edit.mentorBioPlaceholder",
                  )}
                  value={miniBio}
                  onChange={(e) => setMiniBio(e.target.value)}
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200/50 rounded-xl outline-none text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-indigo-100 resize-none"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[9px] font-black uppercase tracking-widest text-slate-400">
                  {t("admin.mentoringProfile.edit.mentorExperienceLabel")}
                </label>
                <textarea
                  rows={3}
                  placeholder={t(
                    "admin.mentoringProfile.edit.mentorExperiencePlaceholder",
                  )}
                  value={experience}
                  onChange={(e) => setExperience(e.target.value)}
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200/50 rounded-xl outline-none text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-indigo-100 resize-none"
                />
              </div>

              {/* Skills list input */}
              <div className="flex flex-col gap-2">
                <label className="text-[9px] font-black uppercase tracking-widest text-slate-400">
                  {t("admin.mentoringProfile.edit.skillsLabel")}
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder={t(
                      "admin.mentoringProfile.edit.skillsPlaceholder",
                    )}
                    value={newSkill}
                    onChange={(e) => setNewSkill(e.target.value)}
                    onKeyDown={(e) =>
                      e.key === "Enter" && (e.preventDefault(), addSkill())
                    }
                    className="flex-1 px-4 py-2 bg-slate-50 border border-slate-200/50 rounded-xl outline-none text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-indigo-100"
                  />
                  <button
                    type="button"
                    onClick={addSkill}
                    className="px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
                  >
                    {t("admin.mentoringProfile.edit.addBtn")}
                  </button>
                </div>
                <div className="flex flex-wrap gap-2 mt-2">
                  {skills.map((s) => (
                    <span
                      key={s}
                      onClick={() => removeSkill(s)}
                      className="bg-slate-100 hover:bg-rose-50 hover:text-rose-600 text-slate-600 px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-wide flex items-center gap-1.5 cursor-pointer transition-all"
                      title={t("admin.mentoringProfile.edit.clickToRemove")}
                    >
                      <span>{s}</span>
                      <span>&times;</span>
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            /* MENTEE FORM */
            <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col gap-6">
              <h3 className="text-sm font-black uppercase text-slate-800 tracking-tight border-b border-slate-50 pb-2">
                {t("admin.mentoringProfile.edit.menteeInfoTitle")}
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[9px] font-black uppercase tracking-widest text-slate-400">
                    {t("admin.mentoringProfile.edit.personalGoalLabel")}
                  </label>
                  <textarea
                    rows={3}
                    placeholder={t(
                      "admin.mentoringProfile.edit.personalGoalPlaceholder",
                    )}
                    value={personalGoal}
                    onChange={(e) => setPersonalGoal(e.target.value)}
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200/50 rounded-xl outline-none text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-indigo-100 resize-none"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[9px] font-black uppercase tracking-widest text-slate-400">
                    {t("admin.mentoringProfile.edit.careerGoalLabel")}
                  </label>
                  <textarea
                    rows={3}
                    placeholder={t(
                      "admin.mentoringProfile.edit.careerGoalPlaceholder",
                    )}
                    value={careerGoal}
                    onChange={(e) => setCareerGoal(e.target.value)}
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200/50 rounded-xl outline-none text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-indigo-100 resize-none"
                  />
                </div>
              </div>

              {/* Attributes array input */}
              <div className="flex flex-col gap-3">
                <label className="text-[9px] font-black uppercase tracking-widest text-slate-400">
                  {t("admin.mentoringProfile.edit.personalAttributesLabel")}
                </label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {[0, 1, 2].map((idx) => (
                    <input
                      key={idx}
                      required
                      type="text"
                      placeholder={t(
                        "admin.mentoringProfile.edit.attributePlaceholder",
                        { num: idx + 1 },
                      )}
                      value={attributes[idx] || ""}
                      onChange={(e) => {
                        const next = [...attributes];
                        next[idx] = e.target.value;
                        setAttributes(next);
                      }}
                      className="px-4 py-2 bg-slate-50 border border-slate-200/50 rounded-xl outline-none text-xs font-bold text-slate-800 focus:ring-2 focus:ring-indigo-100"
                    />
                  ))}
                </div>
              </div>

              {/* Achievements array input */}
              <div className="flex flex-col gap-3">
                <label className="text-[9px] font-black uppercase tracking-widest text-slate-400">
                  {t("admin.mentoringProfile.edit.experiencesLabel")}
                </label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {[0, 1, 2].map((idx) => (
                    <input
                      key={idx}
                      required
                      type="text"
                      placeholder={t(
                        "admin.mentoringProfile.edit.experiencePlaceholder",
                        { num: idx + 1 },
                      )}
                      value={achievements[idx] || ""}
                      onChange={(e) => {
                        const next = [...achievements];
                        next[idx] = e.target.value;
                        setAchievements(next);
                      }}
                      className="px-4 py-2 bg-slate-50 border border-slate-200/50 rounded-xl outline-none text-xs font-bold text-slate-800 focus:ring-2 focus:ring-indigo-100"
                    />
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[9px] font-black uppercase tracking-widest text-slate-400">
                    {t("admin.mentoringProfile.edit.futureVisionLabel")}
                  </label>
                  <textarea
                    rows={3}
                    placeholder={t(
                      "admin.mentoringProfile.edit.futureVisionPlaceholder",
                    )}
                    value={futureVision}
                    onChange={(e) => setFutureVision(e.target.value)}
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200/50 rounded-xl outline-none text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-indigo-100 resize-none"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[9px] font-black uppercase tracking-widest text-slate-400">
                    {t("admin.mentoringProfile.edit.greatestAttributeLabel")}
                  </label>
                  <textarea
                    rows={3}
                    placeholder={t(
                      "admin.mentoringProfile.edit.greatestAttributePlaceholder",
                    )}
                    value={greatestAttribute}
                    onChange={(e) => setGreatestAttribute(e.target.value)}
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200/50 rounded-xl outline-none text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-indigo-100 resize-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[9px] font-black uppercase tracking-widest text-slate-400">
                    {t("admin.mentoringProfile.edit.familyGroupLabel")}
                  </label>
                  <textarea
                    rows={2}
                    placeholder={t(
                      "admin.mentoringProfile.edit.familyGroupPlaceholder",
                    )}
                    value={familyGroup}
                    onChange={(e) => setFamilyGroup(e.target.value)}
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200/50 rounded-xl outline-none text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-indigo-100 resize-none"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[9px] font-black uppercase tracking-widest text-slate-400">
                    {t("admin.mentoringProfile.edit.hobbiesLabel")}
                  </label>
                  <textarea
                    rows={2}
                    placeholder={t(
                      "admin.mentoringProfile.edit.hobbiesPlaceholder",
                    )}
                    value={hobbies}
                    onChange={(e) => setHobbies(e.target.value)}
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200/50 rounded-xl outline-none text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-indigo-100 resize-none"
                  />
                </div>
              </div>
            </div>
          )}

          {/* STRATEGIC EVOLUTION FIELDS FOR BOTH ROLES */}
          <div className="bg-[#fcfbf9] border border-[#e8e5dd] p-8 rounded-[2.5rem] shadow-2xs flex flex-col gap-6 mt-6 font-sans">
            <div>
              <h3 className="text-sm font-black uppercase text-slate-800 tracking-tight flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-indigo-500 animate-pulse" />
                <span>
                  {t("admin.mentoringProfile.edit.expectationsTitle")}
                </span>
              </h3>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">
                {t("admin.mentoringProfile.edit.expectationsSubtitle")}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5 text-left">
                <label className="text-[9px] font-black uppercase tracking-widest text-slate-400">
                  {t("admin.mentoringProfile.edit.expectationsLabel")}
                </label>
                <textarea
                  rows={3}
                  placeholder={t(
                    "admin.mentoringProfile.edit.expectationsPlaceholder",
                  )}
                  value={mentorshipExpectations}
                  onChange={(e) => setMentorshipExpectations(e.target.value)}
                  className="w-full px-4 py-2 bg-white border border-[#e8e5dd] rounded-xl outline-none text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-indigo-100 resize-none"
                />
              </div>

              <div className="flex flex-col gap-1.5 text-left">
                <label className="text-[9px] font-black uppercase tracking-widest text-slate-400">
                  {t("admin.mentoringProfile.edit.shortTermGoalsLabel")}
                </label>
                <textarea
                  rows={3}
                  placeholder={t(
                    "admin.mentoringProfile.edit.shortTermGoalsPlaceholder",
                  )}
                  value={shortTermGoals}
                  onChange={(e) => setShortTermGoals(e.target.value)}
                  className="w-full px-4 py-2 bg-white border border-[#e8e5dd] rounded-xl outline-none text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-indigo-100 resize-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5 text-left">
                <label className="text-[9px] font-black uppercase tracking-widest text-slate-400">
                  {t("admin.mentoringProfile.edit.mediumTermGoalsLabel")}
                </label>
                <textarea
                  rows={3}
                  placeholder={t(
                    "admin.mentoringProfile.edit.mediumTermGoalsPlaceholder",
                  )}
                  value={mediumTermGoals}
                  onChange={(e) => setMediumTermGoals(e.target.value)}
                  className="w-full px-4 py-2 bg-white border border-[#e8e5dd] rounded-xl outline-none text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-indigo-100 resize-none"
                />
              </div>

              <div className="flex flex-col gap-1.5 text-left">
                <label className="text-[9px] font-black uppercase tracking-widest text-slate-400">
                  {t("admin.mentoringProfile.edit.professionalDreamLabel")}
                </label>
                <textarea
                  rows={3}
                  placeholder={t(
                    "admin.mentoringProfile.edit.professionalDreamPlaceholder",
                  )}
                  value={professionalDream}
                  onChange={(e) => setProfessionalDream(e.target.value)}
                  className="w-full px-4 py-2 bg-white border border-[#e8e5dd] rounded-xl outline-none text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-indigo-100 resize-none"
                />
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end gap-3 mt-4 border-t border-slate-100 pt-6">
            <button
              type="button"
              onClick={() => setActiveSubTab("portfolio")}
              className="px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-600 transition-colors cursor-pointer border-none bg-transparent"
            >
              {t("admin.mentoringProfile.edit.cancelBtnGeneral")}
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-8 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all disabled:opacity-50 flex items-center gap-2 cursor-pointer shadow-lg shadow-indigo-100 border-none"
            >
              {isSaving ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Save className="w-3.5 h-3.5" />
              )}
              <span>{t("admin.mentoringProfile.edit.saveBtnGeneral")}</span>
            </button>
          </div>
        </form>
      )}

      {/* ========================================== */}
      {/* SECRETARIA IA (ADE) PREMIUM PANEL */}
      {/* ========================================== */}
      {isSecretaryOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-end z-[9999] animate-in fade-in duration-200">
          {/* Click outside background */}
          <div
            className="absolute inset-0 cursor-pointer"
            onClick={() => setIsSecretaryOpen(false)}
          />

          {/* Premium side panel */}
          <div className="relative bg-white w-full max-w-lg h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-300 font-sans">
            {/* Header */}
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-indigo-950 text-white">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-amber-300 animate-pulse" />
                <div className="text-left">
                  <h3 className="text-sm font-black uppercase tracking-wider">
                    {t("admin.mentoringProfile.secretaryPanel.title")}
                  </h3>
                  <p className="text-[8px] text-indigo-300 font-black uppercase tracking-widest">
                    {t("admin.mentoringProfile.secretaryPanel.subtitle")}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsSecretaryOpen(false)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center text-lg font-bold border-none cursor-pointer transition-colors"
              >
                &times;
              </button>
            </div>

            {/* Content Body */}
            <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6">
              {/* Call-to-action to generate new suggestions */}
              <div className="bg-indigo-50/50 border border-indigo-100 rounded-3xl p-6 flex flex-col gap-4 text-left">
                <div>
                  <h4 className="text-xs font-black uppercase text-indigo-950">
                    {t(
                      "admin.mentoringProfile.secretaryPanel.activateIntelTitle",
                    )}
                  </h4>
                  <p className="text-[10px] text-slate-500 font-semibold mt-1 leading-normal">
                    {t(
                      "admin.mentoringProfile.secretaryPanel.activateIntelDesc",
                    )}
                  </p>
                </div>
                <button
                  onClick={handleGenerateSecretarySuggestion}
                  disabled={isGeneratingSecretary}
                  className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all disabled:opacity-50 cursor-pointer shadow-md shadow-indigo-150 border-none"
                >
                  {isGeneratingSecretary ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>
                        {t(
                          "admin.mentoringProfile.secretaryPanel.activateBtnAnalyzing",
                        )}
                      </span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 text-amber-300" />
                      <span>
                        {t(
                          "admin.mentoringProfile.secretaryPanel.activateBtnGenerate",
                        )}
                      </span>
                    </>
                  )}
                </button>
              </div>

              {/* Suggestions Panel */}
              <div className="flex flex-col gap-3 text-left">
                <h4 className="text-[9px] font-black uppercase tracking-wider text-slate-400">
                  {t(
                    "admin.mentoringProfile.secretaryPanel.recommendationLabel",
                  )}
                </h4>

                {secretaryText ? (
                  <div className="bg-[#fcfbf9] border border-[#e8e5dd] p-6 rounded-3xl text-xs font-semibold text-slate-700 leading-relaxed font-sans whitespace-pre-line text-left">
                    {secretaryText}
                  </div>
                ) : (
                  <div className="border-2 border-dashed border-slate-200 rounded-3xl p-8 text-center text-slate-400 flex flex-col items-center gap-2 bg-slate-50/50">
                    <Sparkles className="w-8 h-8 text-slate-300" />
                    <p className="text-xs font-bold text-slate-600">
                      {t("admin.mentoringProfile.secretaryPanel.noRecTitle")}
                    </p>
                    <p className="text-[10px] text-slate-400 mt-1 max-w-[280px] leading-normal font-semibold">
                      {t("admin.mentoringProfile.secretaryPanel.noRecDesc")}
                    </p>
                  </div>
                )}
              </div>

              {/* History Section */}
              {secretaryHistory.length > 1 && (
                <div className="flex flex-col gap-3 text-left mt-2">
                  <h4 className="text-[9px] font-black uppercase tracking-wider text-slate-400">
                    {t("admin.mentoringProfile.secretaryPanel.historyTitle")}
                  </h4>
                  <div className="flex flex-col gap-2.5 max-h-48 overflow-y-auto pr-1">
                    {secretaryHistory.map((item, idx) => {
                      const dateStr = isMounted
                        ? new Date(item.createdAt).toLocaleDateString(
                            locale === "pt" ? "pt-BR" : "en-US",
                            {
                              day: "2-digit",
                              month: "2-digit",
                              year: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            },
                          )
                        : "";
                      return (
                        <button
                          key={item._id || idx}
                          onClick={() => setSecretaryText(item.content)}
                          className={cn(
                            "w-full p-4 rounded-2xl border text-left flex flex-col gap-1 cursor-pointer transition-all hover:bg-slate-50 border-none bg-transparent",
                            secretaryText === item.content
                              ? "bg-slate-50 border border-indigo-200"
                              : "bg-white border border-slate-100",
                          )}
                        >
                          <span className="text-[8px] font-black uppercase text-indigo-600 tracking-wider">
                            {t(
                              "admin.mentoringProfile.secretaryPanel.suggestionFrom",
                              { date: dateStr },
                            )}
                          </span>
                          <p className="text-[10.5px] font-semibold text-slate-600 truncate">
                            {item.content}
                          </p>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end">
              <button
                onClick={() => setIsSecretaryOpen(false)}
                className="px-6 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl text-[10px] font-black uppercase tracking-widest cursor-pointer border-none transition-colors"
              >
                {t("admin.mentoringProfile.secretaryPanel.closePanelBtn")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
