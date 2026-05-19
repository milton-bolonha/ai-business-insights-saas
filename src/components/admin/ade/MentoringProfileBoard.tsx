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
  UploadCloud
} from "lucide-react";
import { useToast } from "@/lib/state/toast-context";
import { cn } from "@/lib/utils";
import { uploadToCloudinary } from "@/lib/services/cloudinary";
import { useAuthStore } from "@/lib/stores/authStore";
import { useUser } from "@clerk/nextjs";
import { MentoringKanbanBoard } from "./MentoringKanbanBoard";
import { MentoringScheduleBoard } from "./MentoringScheduleBoard";

const INVENTORY_ITEMS = [
  { id: "jack_1", name: "Jaqueta Corta-Vento Executive", category: "jacket", rarity: "Common", desc: "Design aerodinâmico cinza fosco." },
  { id: "jack_2", name: "Sobretudo Italiano Lã", category: "jacket", rarity: "Rare", desc: "Tecido estruturado elegante de lã natural." },
  { id: "jack_3", name: "Trench Coat Clássico", category: "jacket", rarity: "Epic", desc: "Corte alongado premium resistente à água." },
  { id: "jack_4", name: "Blazer Minimalista Slim", category: "jacket", rarity: "Uncommon", desc: "Corte descontraído cinza mescla em algodão nobre." },
  { id: "jack_5", name: "Blazer Linho Rústico Noir", category: "jacket", rarity: "Legendary", desc: "Linho puro respirável com corte sob medida." },
  { id: "jack_6", name: "Casaco Sob Medida Cashmere", category: "jacket", rarity: "Mythic", desc: "Cashmere italiano de ultra luxo feito por alfaiates." },

  { id: "sneakers_1", name: "Sneaker Casual Couro", category: "sneakers", rarity: "Common", desc: "Sola amortecedora e acabamento clássico." },
  { id: "sneakers_2", name: "Sapato Derby Nobre", category: "sneakers", rarity: "Rare", desc: "Couro legítimo polido feito à mão." },
  { id: "sneakers_3", name: "Mocassim Casual Camurça", category: "sneakers", rarity: "Epic", desc: "Conforto clássico para dias operacionais dinâmicos." },
  { id: "sneakers_4", name: "Sapatênis Slip-on Knit", category: "sneakers", rarity: "Uncommon", desc: "Facilidade de calce e design elegante." },

  { id: "back_1", name: "Mochila Slim Resistente", category: "backpack", rarity: "Common", desc: "Compacta, ideal para transporte diário." },
  { id: "back_2", name: "Pasta Executiva Minimalista", category: "backpack", rarity: "Rare", desc: "Couro legítimo com divisórias acolchoadas premium." },
  { id: "back_3", name: "Mochila Executiva Premium", category: "backpack", rarity: "Epic", desc: "Compartimentos modulares inteligentes magnéticos." },

  { id: "head_1", name: "Fone Noise-Canceling Matte", category: "headset", rarity: "Common", desc: "Isolamento acústico eficiente para foco profundo." },
  { id: "head_2", name: "Earbuds Invisíveis Premium", category: "headset", rarity: "Rare", desc: "Design ultra-discreto com drivers de alta fidelidade." },
  { id: "head_3", name: "Headphone Estúdio Carbono", category: "headset", rarity: "Epic", desc: "Drivers profissionais de berílio com almofadas térmicas." },

  { id: "watch_1", name: "Relógio Inteligente Stealth", category: "smartwatch", rarity: "Common", desc: "Monitoramento de produtividade e hábitos diários." },
  { id: "watch_2", name: "Relógio Aço Safira Classic", category: "smartwatch", rarity: "Rare", desc: "Vidro em cristal safira e caixa de aço escovado." },
  { id: "watch_3", name: "Cronógrafo Híbrido Titânio", category: "smartwatch", rarity: "Epic", desc: "Mostrador e-ink clássico de altíssimo prestígio." },

  { id: "glass_1", name: "Óculos Anti-Fadiga Blue Light", category: "glasses", rarity: "Common", desc: "Proteção contra telas digitais e cansaço visual." },
  { id: "glass_2", name: "Óculos Titanium Ultraleve", category: "glasses", rarity: "Rare", desc: "Apenas 4 gramas, conforto invisível para longas horas." },

  { id: "aura_1", name: "Sem Aura (Padrão)", category: "aura", rarity: "Common", desc: "Aparência natural clássica e sem distorções." },
  { id: "aura_2", name: "Brilho Âmbar de Produtividade", category: "aura", rarity: "Rare", desc: "Sutil pulsação dourada inspirada em foco total." },
  { id: "aura_3", name: "Aura Focus Ciano", category: "aura", rarity: "Epic", desc: "Efeito suave que inspira estado de fluxo mental." },
  { id: "aura_4", name: "Partículas Code Matrix", category: "aura", rarity: "Legendary", desc: "Cascata minimalista digital de alta tecnologia." },
  { id: "aura_5", name: "Espectro Prismático Executivo", category: "aura", rarity: "Mythic", desc: "Efeito iridescente sutil exclusivo de alto escalão." }
];

interface MentoringProfileBoardProps {
  userId?: string;
  isOwner?: boolean;
  workspaceId?: string; // Passed from workspace context
}

export function MentoringProfileBoard({ userId, isOwner = true, workspaceId }: MentoringProfileBoardProps) {
  const { push } = useToast();
  const { user: clerkUser } = useUser();
  const authUser = useAuthStore((state) => state.user);
  const [activeSubTab, setActiveSubTab] = useState<"portfolio" | "edit">("portfolio");
  const [mentoringSubTab, setMentoringSubTab] = useState<"dashboard" | "inventory" | "diary" | "tasks" | "schedule" | "projects" | "admin_controls">("dashboard");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [viewMode, setViewMode] = useState<"owner" | "public" | "tracking">("owner");

  // Next session date inside gamer HUD
  const [nextSessionDate, setNextSessionDate] = useState<string | null>(null);

  const fetchNextSession = async () => {
    if (!workspaceId) return;
    try {
      const res = await fetch(`/api/mentoring/sessions?workspaceId=${workspaceId}`);
      if (res.ok) {
        const data = await res.json();
        if (data.sessions && data.sessions.length > 0) {
          const futureSessions = data.sessions
            .filter((s: any) => new Date(s.startAt) >= new Date() && s.status !== "cancelled")
            .sort((a: any, b: any) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime());
          
          if (futureSessions.length > 0) {
            const nextSess = futureSessions[0];
            const dateObj = new Date(nextSess.startAt);
            const formattedDate = dateObj.toLocaleDateString("pt-BR", {
              day: "2-digit",
              month: "2-digit"
            }) + " - " + dateObj.toLocaleTimeString("pt-BR", {
              hour: "2-digit",
              minute: "2-digit"
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
    { id: "1", title: "Kickoff de Alinhamento", duration: 60, desc: "Primeira sessão de mapeamento de objetivos." },
    { id: "2", title: "Aceleração Operacional", duration: 45, desc: "Revisão e desbloqueio de gargalos cognitivos." },
    { id: "3", title: "Alinhamento Estratégico", duration: 60, desc: "Definição de objetivos de trimestre e carreira." }
  ]);
  const [newTemplateTitle, setNewTemplateTitle] = useState("");
  const [newTemplateDuration, setNewTemplateDuration] = useState(60);
  const [newTemplateDesc, setNewTemplateDesc] = useState("");

  // Nomenclaturas Chaves
  const [termDiary, setTermDiary] = useState("Diário de Bordo");
  const [termTension, setTermTension] = useState("Tensão Cognitiva");
  const [termDistortion, setTermDistortion] = useState("Distorção Cognitiva");
  const [termStyle, setTermStyle] = useState("Estilo Pessoal");
  const [termSidequest, setTermSidequest] = useState("Side-quest");

  // Profile Fields State
  const [role, setRole] = useState<"mentor" | "mentee">(isOwner ? "mentor" : "mentee");
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
  const [linkedinStage, setLinkedinStage] = useState<"idle" | "connecting" | "extracting" | "populating" | "done">("idle");

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
    aura: "Sem Aura (Padrão)"
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

  // RPG Math Calculations
  const level = Math.floor(Math.sqrt(xp / 50)) + 1;
  const totalHearts = 6 + level; // Starts at level 1 with 7 hearts (6 + 1 = 7). Gains +1 per level.
  const activeHearts = Math.min(totalHearts, Math.max(0, Math.round((stats.engagement / 100) * totalHearts)));

  const currentLevelBaseXp = Math.pow(level - 1, 2) * 50;
  const nextLevelBaseXp = Math.pow(level, 2) * 50;
  const xpInCurrentLevel = xp - currentLevelBaseXp;
  const xpNeededForNextLevel = nextLevelBaseXp - currentLevelBaseXp;
  const levelProgressPercent = Math.min(100, Math.max(0, Math.round((xpInCurrentLevel / xpNeededForNextLevel) * 100)));

  const fetchTasks = async (currentRole?: 'mentor' | 'mentee') => {
    if (!workspaceId) return;
    try {
      const res = await fetch(`/api/mentoring/tasks?workspaceId=${workspaceId}`);
      if (res.ok) {
        const data = await res.json();
        if (data.tasks) {
          const targetUserId = userId || authUser?.id;
          const activeRole = currentRole || role;
          // Filter tasks assigned strictly to this user if they are a mentee
          const userTasks = activeRole === 'mentor'
            ? data.tasks
            : data.tasks.filter((t: any) => t.assigneeId === targetUserId);

          const completed = userTasks.filter((t: any) => t.status === 'done').length;
          const total = userTasks.length;
          const engagement = total > 0 ? Math.round((completed / total) * 100) : 0;
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
          ...updatedFields
        })
      });
      if (!res.ok) console.error("Failed to sync gamified profile with DB");
    } catch (err) {
      console.error("Error syncing gamified profile:", err);
    }
  };

  const getDominantClass = () => {
    const goalsString = `${careerGoal || ""} ${personalGoal || ""} ${tagline || ""}`.toLowerCase();
    if (goalsString.includes("tech") || goalsString.includes("dev") || goalsString.includes("software") || goalsString.includes("tecnolog")) {
      return "Arquiteto Tecnológico";
    }
    if (goalsString.includes("start") || goalsString.includes("fund") || goalsString.includes("ceo") || goalsString.includes("empreend") || goalsString.includes("negoci")) {
      return "Estrategista de Negócios";
    }
    if (goalsString.includes("foco") || goalsString.includes("prod") || goalsString.includes("fazer") || goalsString.includes("execut")) {
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
      let resolvedRole: 'mentor' | 'mentee' = isOwner ? 'mentor' : 'mentee';
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
          setEquippedGear(p.equippedGear || {
            jacket: "Jaqueta Corta-Vento Minimalist",
            sneakers: "Sneakers Knit Tech",
            backpack: "Mochila Rolltop Slim",
            headset: "Headset Noise-Canceling Matte",
            smartwatch: "Smartwatch AMOLED Stealth",
            glasses: "Óculos Anti-Blue Light Hex",
            aura: "Sem Aura (Padrão)"
          });
          setDiaryLogs(p.diaryLogs || []);
          setCognitiveState(p.cognitiveState || "Estável");

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
      const res = await fetch(`/api/ai/mentoring-secretary?workspaceId=${workspaceId}`);
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
        description: "Aguarde enquanto sua Secretaria IA compila seu relatório de evolução.",
        variant: "default"
      });

      const res = await fetch(`/api/ai/mentoring-secretary`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workspaceId })
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
        variant: "success"
      });
    } catch (err: any) {
      console.error("Error generating AI Secretary suggestion:", err);
      push({
        title: "Falha na Geração",
        description: err.message || "Erro de conexão com o servidor de IA.",
        variant: "destructive"
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
      const res = await fetch(`/api/ai/mentoring-secretary?workspaceId=${workspaceId}`);
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
    if (viewMode === "public" && mentoringSubTab !== "dashboard" && mentoringSubTab !== "inventory" && mentoringSubTab !== "projects") {
      setMentoringSubTab("dashboard");
    }
    if (viewMode !== "owner") {
      setActiveSubTab("portfolio");
    }
    if (mentoringSubTab === "admin_controls" && (role !== "mentor" || viewMode !== "owner")) {
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
      if (clerkUser && typeof (clerkUser as any).setProfileImage === "function") {
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

  const handleProjectImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setIsUploading(true);
      const url = await uploadToCloudinary(file, "ade/products", workspaceId);
      setProjectImageUrl(url);
      push({ title: "Imagem do projeto carregada com sucesso!", variant: "success" });
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
      .map(t => t.trim())
      .filter(t => t.length > 0);

    let nextProjects = [...projects];

    if (editingProjectId) {
      nextProjects = nextProjects.map(p =>
        p.id === editingProjectId
          ? { ...p, title: projectTitle, description: projectDescription, imageUrl: projectImageUrl, tags: tagsArray }
          : p
      );
      push({ title: "Projeto atualizado com sucesso!", variant: "success" });
    } else {
      const newProj = {
        id: Math.random().toString(36).substring(2, 9),
        title: projectTitle,
        description: projectDescription,
        imageUrl: projectImageUrl || "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=500&q=80",
        tags: tagsArray
      };
      nextProjects.push(newProj);
      push({ title: "Novo projeto adicionado com sucesso!", variant: "success" });
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
    const nextProjects = projects.filter(p => p.id !== projId);
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
      next = featuredProjectIds.filter(id => id !== projId);
    } else {
      next = [...featuredProjectIds, projId];
    }
    setFeaturedProjectIds(next);
    localStorage.setItem("ade_featured_projects", JSON.stringify(next));
    push({ title: "Status de destaque do projeto atualizado com sucesso!", variant: "success" });
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
          genderTerm
        })
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
    setSkills(skills.filter(s => s !== skillToRemove));
  };

  // Real LinkedIn profile parser caller
  const triggerLinkedInImport = async () => {
    if (!linkedinUrl.trim()) {
      push({ title: "Informe a URL do seu LinkedIn primeiro!", variant: "destructive" });
      return;
    }

    setLinkedinStage("connecting");
    try {
      const res = await fetch("/api/mentoring/profile/linkedin-import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: linkedinUrl })
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
        push({ title: "Dados importados do LinkedIn real com sucesso!", variant: "success" });
      }
    } catch (err: any) {
      push({ title: "Erro ao importar: " + err.message, variant: "destructive" });
    } finally {
      setTimeout(() => setLinkedinStage("idle"), 1500);
    }
  };

  const getOptimizedPhotoUrl = (url: string) => {
    if (!url) return "";
    if (url.includes("cloudinary.com") && url.includes("/upload/")) {
      return url.replace("/upload/", "/upload/c_fill,g_face,w_300,h_300,q_auto,f_auto/");
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
          <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">Meu Perfil de Mentoria</h2>
          <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest font-sans">
            {activeSubTab === "edit" ? "Configurando Detalhes do Perfil" : "Visualização de evolução e trajetória"}
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
                  <img src={getOptimizedPhotoUrl(photoUrl)} alt={name} className="w-full h-full object-cover" />
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
                <span className="text-[7px] font-black uppercase tracking-wider text-slate-400 leading-none">LV</span>
                <span className="text-xs font-black text-white leading-none mt-0.5">{level}</span>
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
                <div className="flex items-center justify-center gap-0.5 mt-0.5" title={`Rendimento: ${stats.engagement}%`}>
                  {Array.from({ length: totalHearts }).map((_, i) => {
                    const isActive = i < activeHearts;
                    return (
                      <Heart
                        key={i}
                        className={cn(
                          "w-3.5 h-3.5 transition-all duration-300",
                          isActive
                            ? "fill-rose-500 text-rose-500 drop-shadow-[0_0_2px_rgba(244,63,94,0.4)] animate-pulse"
                            : "text-[#d1ccc0] fill-none"
                        )}
                      />
                    );
                  })}
                </div>

                {/* XP Progress Bar (Blue/Indigo, Clean!) */}
                <div className="w-full flex flex-col gap-1 mt-1 font-sans">
                  <div className="flex items-center justify-between text-[8px] font-black uppercase tracking-widest text-slate-400">
                    <span>XP</span>
                    <span className="text-slate-700 font-bold">{xpInCurrentLevel} / {xpNeededForNextLevel} XP</span>
                  </div>
                  <div className="w-full bg-slate-200/60 h-2 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{ width: `${levelProgressPercent}%`, backgroundColor: '#4f46e5' }}
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
                    <span>{role === "mentor" ? "Mentor Executivo" : "Estrategista de Negócios"}</span>
                    
                    <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 hidden group-hover/hud:flex flex-col bg-slate-900 text-white text-[8px] p-2 rounded-lg shadow-md w-48 text-center z-30 pointer-events-none normal-case">
                      <span className="font-black uppercase tracking-wider mb-0.5 text-amber-400">Especialidade</span>
                      <span className="text-slate-300 leading-normal font-semibold">Calculado dinamicamente a partir dos seus objetivos, trajetória profissional e competências.</span>
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
                    <span>Foco: {(diaryLogs.length > 0 ? (diaryLogs[diaryLogs.length - 1].CC / diaryLogs[diaryLogs.length - 1].TE) : 1.0).toFixed(2)}</span>
                    
                    <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 hidden group-hover/hud:flex flex-col bg-slate-900 text-white text-[8px] p-2 rounded-lg shadow-md w-48 text-center z-30 pointer-events-none normal-case">
                      <span className="font-black uppercase tracking-wider mb-0.5 text-indigo-400">Índice de Foco</span>
                      <span className="text-slate-300 leading-normal font-semibold">Métrica de foco diário (Esforço Mental / Tempo Dedicado) calculada dos seus diários de bordo recentes.</span>
                    </div>
                  </div>

                  {/* Tarefas HUD Badge */}
                  <div className="flex items-center gap-1.5 bg-white border border-[#e8e5dd] text-slate-700 px-2.5 py-1 rounded-lg text-[8.5px] font-black uppercase tracking-wider cursor-help group/hud relative shadow-3xs">
                    <CheckCircle2 className="w-3 h-3 text-emerald-500 shrink-0" />
                    <span>Tarefas: {stats.completed}/{stats.total}</span>
                    
                    <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 hidden group-hover/hud:flex flex-col bg-slate-900 text-white text-[8px] p-2 rounded-lg shadow-md w-48 text-center z-30 pointer-events-none normal-case">
                      <span className="font-black uppercase tracking-wider mb-0.5 text-emerald-400">Tarefas Executadas</span>
                      <span className="text-slate-300 leading-normal font-semibold">Seu progresso de atividades concluídas no quadro Kanban operacional.</span>
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
                    <span>Próxima Sessão: {nextSessionDate || "Sem sessão agendada"}</span>
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
                    <span className="absolute left-3 top-0.5 text-lg text-[#e8e5dd] pointer-events-none font-serif leading-none">“</span>
                    {motivationalQuote}
                    <span className="absolute right-3 bottom-0 text-lg text-[#e8e5dd] pointer-events-none font-serif leading-none">”</span>
                  </div>
                ) : (
                  <div className="bg-[#fcfbf9] border border-dashed border-[#e8e5dd] px-5 py-2.5 rounded-xl text-[10px] text-slate-400 font-medium text-center mt-2 mb-1 w-full max-w-xl font-sans">
                    "Defina sua frase de efeito ou citação nas configurações do perfil para exibi-la aqui."
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
                        unlocked: stats.engagement >= 75 && stats.total > 0
                      },
                      {
                        id: "implacavel",
                        title: "Implacável",
                        desc: "Completou pelo menos 5 tarefas no workspace.",
                        unlocked: stats.completed >= 5
                      },
                      {
                        id: "resiliente",
                        title: "Operador Resiliente",
                        desc: "Escreveu seu primeiro relatório no Diário de Bordo.",
                        unlocked: diaryLogs.length > 0
                      },
                      {
                        id: "visionario",
                        title: "Líder Visionário",
                        desc: "Estruturou sua visão de futuro nas configurações.",
                        unlocked: futureVision && futureVision.trim().length > 10
                      }
                    ].map(trait => (
                      <div
                        key={trait.id}
                        className={cn(
                          "group/achievement relative flex items-center justify-center w-7 h-7 rounded-full border transition-all cursor-help",
                          trait.unlocked
                            ? "bg-amber-50 border-amber-200 text-amber-600 shadow-3xs"
                            : "bg-slate-100 border-slate-200/60 text-slate-400 opacity-50"
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
              <a href={linkedinUrl} target="_blank" rel="noreferrer" className="flex items-center gap-1 hover:text-slate-800 transition-colors cursor-pointer bg-white hover:bg-slate-50 px-2.5 py-1.5 rounded-xl border border-slate-200/50 text-[10px] font-bold text-slate-500 shadow-3xs">
                <Linkedin className="w-3 h-3 text-indigo-500" />
                <span>LinkedIn</span>
              </a>
            )}
            {githubUrl && (
              <a href={githubUrl} target="_blank" rel="noreferrer" className="flex items-center gap-1 hover:text-slate-800 transition-colors cursor-pointer bg-white hover:bg-slate-50 px-2.5 py-1.5 rounded-xl border border-slate-200/50 text-[10px] font-bold text-slate-500 shadow-3xs">
                <Github className="w-3 h-3 text-slate-700" />
                <span>GitHub</span>
              </a>
            )}
            {instagramUrl && (
              <a href={instagramUrl} target="_blank" rel="noreferrer" className="flex items-center gap-1 hover:text-slate-800 transition-colors cursor-pointer bg-white hover:bg-slate-50 px-2.5 py-1.5 rounded-xl border border-slate-200/50 text-[10px] font-bold text-slate-500 shadow-3xs">
                <Instagram className="w-3 h-3 text-pink-500" />
                <span>Instagram</span>
              </a>
            )}
            {websiteUrl && (
              <a href={websiteUrl} target="_blank" rel="noreferrer" className="flex items-center gap-1 hover:text-slate-800 transition-colors cursor-pointer bg-white hover:bg-slate-50 px-2.5 py-1.5 rounded-xl border border-slate-200/50 text-[10px] font-bold text-slate-500 shadow-3xs">
                <Globe className="w-3 h-3 text-sky-500" />
                <span>Website</span>
              </a>
            )}
            {email && (
              <a href={`mailto:${email}`} className="flex items-center gap-1 hover:text-slate-800 transition-colors bg-white hover:bg-slate-50 px-2.5 py-1.5 rounded-xl border border-slate-200/50 text-[10px] font-bold text-slate-500 shadow-3xs">
                <Mail className="w-3 h-3 text-indigo-500" />
                <span>{email}</span>
              </a>
            )}
            {whatsapp && (
              <a href={`https://wa.me/${whatsapp.replace(/\D/g, '')}`} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 hover:text-slate-800 transition-colors cursor-pointer bg-white hover:bg-slate-50 px-2.5 py-1.5 rounded-xl border border-slate-200/50 text-[10px] font-bold text-slate-500 shadow-3xs">
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
            {activeSubTab === "portfolio" && [
              { id: "dashboard", label: "Painel de Evolução", icon: TrendingUp },
              { id: "diary", label: termDiary, icon: BookOpen },
              { id: "tasks", label: "Tarefas (Kanban)", icon: ClipboardList },
              { id: "schedule", label: "Agenda Sessões", icon: CalendarDays },
              ...(role === "mentor" && viewMode === "owner" ? [{ id: "admin_controls", label: "Painel do Mentor", icon: Shield }] : [])
            ].map(tab => {
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
                      : "bg-slate-100 hover:bg-slate-200 text-slate-600"
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
                    : "bg-slate-100 hover:bg-slate-200 text-slate-600"
                )}
              >
                <Sliders className="w-3.5 h-3.5 shrink-0" />
                <span>Configurações</span>
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
                <span>Secretaria IA</span>
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
                        <h4 className="text-xs font-black uppercase tracking-wider text-slate-800">Secretaria IA (I/O) • Relatório de Evolução</h4>
                        <p className="text-[8.5px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">Diretrizes estratégicas e próximos passos operacionais</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleOpenSecretary()}
                      className="text-[9px] font-black uppercase tracking-widest text-indigo-600 hover:text-indigo-850 hover:underline transition-colors bg-indigo-50 px-2.5 py-1 rounded"
                    >
                      Ver Histórico
                    </button>
                  </div>

                  {secretaryText ? (
                    <div 
                      onClick={() => setIsSecretaryExpanded(!isSecretaryExpanded)}
                      className="group/sec bg-[#fcfbf9] hover:bg-[#f5f2eb] border border-[#e8e5dd] p-5 rounded-lg border-l-4 border-l-slate-900 shadow-3xs hover:shadow-2xs transition-all duration-300 cursor-pointer flex flex-col gap-3 text-left relative"
                    >
                      <div className="flex items-center justify-between text-[9px] font-black uppercase tracking-widest text-slate-400">
                        <span className="flex items-center gap-1.5 text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100/50 font-black">
                          📄 Relatório de Evolução
                        </span>
                        {secretaryHistory[0]?.createdAt && (
                          <span className="text-slate-500 font-bold bg-[#eae6db]/60 px-2 py-0.5 rounded">
                            Criado em: {new Date(secretaryHistory[0].createdAt).toLocaleDateString("pt-BR", {
                              day: "2-digit",
                              month: "2-digit",
                              year: "numeric",
                              hour: "2-digit",
                              minute: "2-digit"
                            })}
                          </span>
                        )}
                      </div>
                      
                      <div className="text-xs font-semibold text-slate-700 leading-relaxed font-sans whitespace-pre-line select-none">
                        {isSecretaryExpanded ? (
                          secretaryText
                        ) : (
                          <>
                            {secretaryText.length > 240 ? `${secretaryText.slice(0, 240)}...` : secretaryText}
                          </>
                        )}
                      </div>
                      
                      <div className="border-t border-[#f0ede4]/60 pt-2.5 flex items-center justify-between text-[9px] font-black uppercase tracking-widest text-indigo-600 group-hover/sec:text-indigo-800">
                        <span>
                          {isSecretaryExpanded ? "↑ recolher relatório" : "↓ clique para expandir relatório completo"}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="border border-dashed border-slate-200 rounded-lg p-6 text-center text-slate-400 flex flex-col items-center gap-2 bg-slate-50/50">
                      <Sparkles className="w-6 h-6 text-slate-350" />
                      <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Nenhum relatório de evolução gerado para este ciclo.</p>
                      <button
                        type="button"
                        onClick={handleGenerateSecretarySuggestion}
                        disabled={isGeneratingSecretary}
                        className="mt-2 flex items-center gap-1.5 bg-slate-900 hover:bg-[#4338ca] text-white px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all cursor-pointer shadow-3xs border-none"
                      >
                        {isGeneratingSecretary ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            <span>Compilando...</span>
                          </>
                        ) : (
                          <>
                            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                            <span>Gerar Relatório de Evolução</span>
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
                      <span>Diretrizes & Alinhamento de Evolução</span>
                    </h4>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest font-sans mt-0.5">
                      Seu planejamento estratégico pessoal e alinhamento de propósito na mentoria
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 font-sans">
                    {/* 1. Expectativas */}
                    <div className="bg-white border border-[#e8e5dd]/60 p-6 rounded-xl shadow-3xs flex flex-col gap-3 text-left">
                      <div className="flex items-center gap-2 text-indigo-600">
                        <div className="p-2 rounded-lg bg-indigo-50">
                          <Sparkles className="w-4 h-4" />
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">Expectativas da Mentoria</span>
                      </div>
                      <p className="text-xs font-semibold text-slate-700 leading-relaxed whitespace-pre-line">
                        {mentorshipExpectations || "Não preenchido nas configurações."}
                      </p>
                    </div>

                    {/* 2. Curto Prazo */}
                    <div className="bg-white border border-[#e8e5dd]/60 p-6 rounded-xl shadow-3xs flex flex-col gap-3 text-left">
                      <div className="flex items-center gap-2 text-rose-600">
                        <div className="p-2 rounded-lg bg-rose-50">
                          <Target className="w-4 h-4" />
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">Objetivos de Curto Prazo</span>
                      </div>
                      <p className="text-xs font-semibold text-slate-700 leading-relaxed whitespace-pre-line">
                        {shortTermGoals || "Não preenchido nas configurações."}
                      </p>
                    </div>

                    {/* 3. Médio Prazo */}
                    <div className="bg-white border border-[#e8e5dd]/60 p-6 rounded-xl shadow-3xs flex flex-col gap-3 text-left">
                      <div className="flex items-center gap-2 text-amber-600">
                        <div className="p-2 rounded-lg bg-amber-50">
                          <TrendingUp className="w-4 h-4" />
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">Objetivos de Médio Prazo</span>
                      </div>
                      <p className="text-xs font-semibold text-slate-700 leading-relaxed whitespace-pre-line">
                        {mediumTermGoals || "Não preenchido nas configurações."}
                      </p>
                    </div>

                    {/* 4. Sonho Profissional */}
                    <div className="bg-white border border-[#e8e5dd]/60 p-6 rounded-xl shadow-3xs flex flex-col gap-3 lg:col-span-2 text-left">
                      <div className="flex items-center gap-2 text-yellow-600">
                        <div className="p-2 rounded-lg bg-yellow-50">
                          <Award className="w-4 h-4 animate-pulse" />
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">Sonho Profissional (Estrela Guia)</span>
                      </div>
                      <p className="text-sm font-semibold text-indigo-950 leading-relaxed whitespace-pre-line font-serif italic text-left pl-2 border-l-2 border-amber-200">
                        {professionalDream ? `"${professionalDream}"` : "Não preenchido nas configurações."}
                      </p>
                    </div>

                    {/* 5. Hobbies */}
                    <div className="bg-white border border-[#e8e5dd]/60 p-6 rounded-xl shadow-3xs flex flex-col gap-3 text-left">
                      <div className="flex items-center gap-2 text-emerald-600">
                        <div className="p-2 rounded-lg bg-emerald-50">
                          <Heart className="w-4 h-4" />
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">Hobbies, Artes & Talentos</span>
                      </div>
                      <p className="text-xs font-semibold text-slate-700 leading-relaxed whitespace-pre-line">
                        {hobbies || "Não preenchido nas configurações."}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Standard trajectory items / Profile view cards */}
              {role === "mentor" ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 font-sans">
                  <div className="md:col-span-2 flex flex-col gap-6">
                    <div className="bg-white p-8 rounded-xl border border-slate-100 shadow-sm">
                      <h4 className="text-xs font-black uppercase tracking-wider text-slate-400 mb-4 flex items-center gap-2">
                        <Briefcase className="w-4 h-4 text-indigo-500" />
                        <span>Biografia & Trajetória</span>
                      </h4>
                      <p className="text-sm font-semibold text-slate-700 leading-relaxed whitespace-pre-line text-left">
                        {miniBio || "Nenhuma biografia disponível."}
                      </p>
                    </div>

                    <div className="bg-white p-8 rounded-xl border border-slate-100 shadow-sm">
                      <h4 className="text-xs font-black uppercase tracking-wider text-slate-400 mb-4 flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 text-indigo-500" />
                        <span>Experiência Profissional</span>
                      </h4>
                      <p className="text-sm font-semibold text-slate-700 leading-relaxed whitespace-pre-line text-left">
                        {experience || "Histórico de experiência não preenchido."}
                      </p>
                    </div>
                  </div>

                  <div className="bg-white p-8 rounded-xl border border-slate-100 shadow-sm">
                    <h4 className="text-xs font-black uppercase tracking-wider text-slate-400 mb-4 flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-indigo-500" />
                      <span>Habilidades & Competências</span>
                    </h4>
                    {skills.length === 0 ? (
                      <p className="text-xs text-slate-400 font-bold">Nenhuma competência cadastrada.</p>
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
                        <span>Objetivo Pessoal</span>
                      </h4>
                      <p className="text-sm font-semibold text-slate-700 leading-relaxed whitespace-pre-line text-left">
                        {personalGoal || "Não definido."}
                      </p>
                    </div>

                    <div className="bg-white p-8 rounded-xl border border-slate-100 shadow-sm">
                      <h4 className="text-xs font-black uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-2">
                        <Briefcase className="w-4 h-4 text-indigo-500" />
                        <span>Objetivo de Carreira</span>
                      </h4>
                      <p className="text-sm font-semibold text-slate-700 leading-relaxed whitespace-pre-line text-left">
                        {careerGoal || "Não definido."}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-white p-8 rounded-xl border border-slate-100 shadow-sm flex flex-col gap-4">
                      <h4 className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center gap-2 border-b border-slate-50 pb-2">
                        <Sparkles className="w-4 h-4 text-indigo-500" />
                        <span>3 Atributos Pessoais</span>
                      </h4>
                      <ul className="space-y-3">
                        {attributes.map((attr, idx) => (
                          <li key={idx} className="flex items-center gap-2.5">
                            <span className="w-6 h-6 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center text-[10px] font-black">{idx + 1}</span>
                            <span className="text-xs font-bold text-slate-700">{attr || "Não preenchido"}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="bg-white p-8 rounded-xl border border-slate-100 shadow-sm flex flex-col gap-4">
                      <h4 className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center gap-2 border-b border-slate-50 pb-2">
                        <Award className="w-4 h-4 text-indigo-500" />
                        <span>3 Grandes Conquistas</span>
                      </h4>
                      <ul className="space-y-3">
                        {achievements.map((ach, idx) => (
                          <li key={idx} className="flex items-center gap-2.5">
                            <span className="w-6 h-6 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center text-[10px] font-black">{idx + 1}</span>
                            <span className="text-xs font-bold text-slate-700">{ach || "Não preenchido"}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="bg-white p-8 rounded-xl border border-slate-100 shadow-sm flex flex-col gap-4">
                      <h4 className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center gap-2 border-b border-slate-50 pb-2">
                        <Heart className="w-4 h-4 text-indigo-500" />
                        <span>Maior Qualidade</span>
                      </h4>
                      <div className="bg-indigo-50/50 p-4 rounded-2xl flex-1 flex flex-col justify-center text-center">
                        <p className="text-[10px] font-black uppercase tracking-widest text-indigo-600 mb-1">Como os outros me veem</p>
                        <h5 className="text-base font-black text-indigo-900 leading-tight">
                          {greatestAttribute || "Não especificado"}
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
                    <h3 className="text-sm font-black uppercase tracking-wider text-slate-800">Nova Entrada do Diário</h3>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Registre suas métricas cognitivas e aprendizados do dia (+200 XP)</p>
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
                        onChange={(e) => setDiaryProgress(Number(e.target.value))}
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
                      <span>Fórmula de Tensão: TC = CC / TE | Fórmula de Distorção: D = TC / (Progress %)</span>
                    </div>

                    <button
                      type="button"
                      onClick={async () => {
                        if (!diaryText.trim()) {
                          push({ title: `Escreva algo nas anotações antes de registrar seu ${termDiary}!`, variant: "destructive" });
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
                          text: diaryText.trim()
                        };

                        const updatedLogs = [...diaryLogs, newLog];
                        const nextXp = xp + diaryXpWeight; // Award dynamic XP

                        setDiaryLogs(updatedLogs);
                        setXp(nextXp);
                        setDiaryText("");

                        await saveGamifiedData({ xp: nextXp, diaryLogs: updatedLogs });
                        push({ title: `${termDiary} registrado! +${diaryXpWeight} XP recebidos!`, variant: "success" });
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
                  <h3 className="text-sm font-black uppercase tracking-wider text-slate-800">Histórico de Diários</h3>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Acompanhe sua carga diária e distorções cognitivas</p>
                </div>

                {diaryLogs.length === 0 ? (
                  <p className="text-xs text-slate-400 font-bold py-4">Nenhuma anotação registrada até o momento.</p>
                ) : (
                  <div className="flex flex-col gap-4">
                    {diaryLogs.slice().reverse().map((log, idx) => {
                      const distLevel = log.distortion;
                      return (
                        <div key={idx} className="p-6 border border-slate-50 bg-slate-50/20 rounded-[1.8rem] flex flex-col md:flex-row gap-6 items-start">

                          {/* Metrics group */}
                          <div className="flex md:flex-col gap-3 shrink-0 w-full md:w-auto">
                            <div className="bg-white px-4 py-2 border border-slate-100 rounded-2xl text-center flex-1 md:flex-none">
                              <span className="text-[8px] font-black uppercase tracking-widest text-slate-400 block">Tensão</span>
                              <span className="text-sm font-black text-slate-800">{log.tension}</span>
                            </div>

                            <div className="bg-white px-4 py-2 border border-slate-100 rounded-2xl text-center flex-1 md:flex-none">
                              <span className="text-[8px] font-black uppercase tracking-widest text-slate-400 block">Distorção</span>
                              <span className="text-sm font-black text-slate-800">{log.distortion}</span>
                            </div>

                            <div className={cn(
                              "px-3 py-1.5 rounded-xl text-center flex-1 md:flex-none flex items-center justify-center text-[8px] font-black uppercase tracking-wider border",
                              distLevel < 0.7
                                ? "bg-emerald-50 text-emerald-600 border-emerald-100"
                                : distLevel <= 1.3
                                  ? "bg-blue-50 text-blue-600 border-blue-100"
                                  : "bg-rose-50 text-rose-600 border-rose-100"
                            )}>
                              {distLevel < 0.7
                                ? "Fluxo Alto"
                                : distLevel <= 1.3
                                  ? "Equilibrado"
                                  : "Risco Burnout"
                              }
                            </div>
                          </div>

                          {/* Content group */}
                          <div className="flex-1 w-full text-left">
                            <div className="flex items-center justify-between border-b border-slate-100 pb-2 mb-2">
                              <span className="text-[9px] font-black uppercase tracking-widest text-indigo-600">{log.date}</span>
                              <span className="text-[8px] font-bold text-slate-400">CC: {log.CC} | TE: {log.TE} | Prog: {log.progress}%</span>
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
                  <h3 className="text-sm font-black uppercase tracking-wider text-slate-800">Projetos Profissionais</h3>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Apresente e gerencie seus portfólios, startups e cases de sucesso na mentoria</p>
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
                    Novo Projeto
                  </button>
                )}
              </div>

              {/* Add/Edit Project Form (Only in Owner ViewMode and when isProjectFormOpen is true) */}
              {viewMode === "owner" && isProjectFormOpen && (
                <form onSubmit={handleSaveProject} className="bg-white border border-slate-100 p-8 rounded-[2.5rem] shadow-md flex flex-col gap-5 animate-in slide-in-from-top duration-300">
                  <div className="flex items-center justify-between border-b border-slate-50 pb-3">
                    <h4 className="text-xs font-black uppercase tracking-wider text-slate-700">
                      {editingProjectId ? "Editar Projeto" : "Cadastrar Novo Projeto"}
                    </h4>
                    <button
                      type="button"
                      onClick={() => setIsProjectFormOpen(false)}
                      className="text-xs font-bold text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      Cancelar
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {/* Title */}
                    <div className="flex flex-col gap-2">
                      <label className="text-[9px] font-black uppercase tracking-widest text-slate-400">Título do Projeto</label>
                      <input
                        type="text"
                        value={projectTitle}
                        onChange={(e) => setProjectTitle(e.target.value)}
                        placeholder="Ex: App de Telemedicina, MVP de Finanças"
                        className="bg-slate-50 border border-slate-100 rounded-2xl px-4 py-3 text-xs font-semibold focus:outline-indigo-600 text-slate-800"
                        required
                      />
                    </div>

                    {/* Tags */}
                    <div className="flex flex-col gap-2">
                      <label className="text-[9px] font-black uppercase tracking-widest text-slate-400">Tags / Tecnologias (separadas por vírgula)</label>
                      <input
                        type="text"
                        value={projectTagsString}
                        onChange={(e) => setProjectTagsString(e.target.value)}
                        placeholder="Ex: NextJS, React Native, SaaS"
                        className="bg-slate-50 border border-slate-100 rounded-2xl px-4 py-3 text-xs font-semibold focus:outline-indigo-600 text-slate-800"
                      />
                    </div>
                  </div>

                  {/* Description */}
                  <div className="flex flex-col gap-2">
                    <label className="text-[9px] font-black uppercase tracking-widest text-slate-400">Descrição Detalhada</label>
                    <textarea
                      value={projectDescription}
                      onChange={(e) => setProjectDescription(e.target.value)}
                      placeholder="Explique o objetivo do projeto, tecnologia e os resultados alcançados..."
                      className="bg-slate-50 border border-slate-100 rounded-2xl px-4 py-3 text-xs font-semibold min-h-[100px] focus:outline-indigo-600 text-slate-800"
                    />
                  </div>

                  {/* Image Upload */}
                  <div className="flex flex-col gap-2">
                    <label className="text-[9px] font-black uppercase tracking-widest text-slate-400">Imagem do Case / Logotipo (URL ou Upload)</label>
                    <div className="flex flex-col sm:flex-row items-center gap-3">
                      <input
                        type="text"
                        value={projectImageUrl}
                        onChange={(e) => setProjectImageUrl(e.target.value)}
                        placeholder="Cole a URL da imagem ou use o botão à direita"
                        className="flex-1 bg-slate-50 border border-slate-100 rounded-2xl px-4 py-3 text-xs font-semibold focus:outline-indigo-600 text-slate-800"
                      />
                      <label className="flex items-center gap-2 px-5 py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-2xl text-[10px] font-black uppercase tracking-wider cursor-pointer select-none">
                        <UploadCloud className="w-4 h-4 text-indigo-500" />
                        <span>Fazer Upload</span>
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
                        <img src={projectImageUrl} alt="Preview" className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => setProjectImageUrl("")}
                          className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-[9px] font-black uppercase transition-all"
                        >
                          Remover
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
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.1em] shadow-xl shadow-indigo-100 cursor-pointer"
                    >
                      {editingProjectId ? "Salvar Alterações" : "Adicionar Projeto"}
                    </button>
                  </div>
                </form>
              )}

              {/* Projects Grid */}
              {projects.length === 0 ? (
                <div className="bg-white border border-slate-100 rounded-[2.5rem] p-12 text-center shadow-sm flex flex-col items-center justify-center gap-4">
                  <Briefcase className="w-10 h-10 text-slate-300" />
                  <div>
                    <h4 className="text-xs font-black uppercase tracking-wide text-slate-800">Nenhum projeto cadastrado</h4>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-1">Registre seus principais casos de sucesso profissionais ou de estudos</p>
                  </div>
                  {viewMode === "owner" && (
                    <button
                      onClick={() => setIsProjectFormOpen(true)}
                      className="flex items-center gap-2 px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-[9px] font-black uppercase tracking-wider cursor-pointer"
                    >
                      Adicionar Primeiro Projeto
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
                                : "text-slate-400 hover:text-slate-600"
                            )}
                            title={featuredProjectIds.includes(proj.id) ? "Remover dos Destaques" : "Destacar na Vitrine Pública"}
                          >
                            <Star className={cn("w-3.5 h-3.5", featuredProjectIds.includes(proj.id) && "fill-amber-500")} />
                          </button>
                          <button
                            onClick={() => handleEditProjectClick(proj)}
                            className="p-1 hover:bg-slate-100 text-slate-600 rounded cursor-pointer animate-in fade-in"
                            title="Editar Projeto"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteProject(proj.id)}
                            className="p-1 hover:bg-red-50 text-red-600 rounded cursor-pointer animate-in fade-in"
                            title="Excluir Projeto"
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

          {/* 6. PAINEL DE CONTROLES DO SUPER MENTOR */}
          {mentoringSubTab === "admin_controls" && role === "mentor" && viewMode === "owner" && (
            <div className="flex flex-col gap-6 animate-in fade-in duration-200">

              {/* Nomenclaturas Chaves */}
              <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col gap-6">
                <div>
                  <h3 className="text-sm font-black uppercase tracking-wider text-slate-800">Nomenclaturas Chaves</h3>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Personalize os termos chaves usados em toda a jornada do mentorado</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[9px] font-black uppercase tracking-widest text-slate-400">Termo Diário de Bordo</label>
                    <input
                      type="text"
                      value={termDiary}
                      onChange={(e) => setTermDiary(e.target.value)}
                      className="px-4 py-2 bg-slate-50 border border-slate-200/50 rounded-xl outline-none text-xs font-semibold text-slate-800"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[9px] font-black uppercase tracking-widest text-slate-400">Termo Tensão Cognitiva</label>
                    <input
                      type="text"
                      value={termTension}
                      onChange={(e) => setTermTension(e.target.value)}
                      className="px-4 py-2 bg-slate-50 border border-slate-200/50 rounded-xl outline-none text-xs font-semibold text-slate-800"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[9px] font-black uppercase tracking-widest text-slate-400">Termo Distorção Cognitiva</label>
                    <input
                      type="text"
                      value={termDistortion}
                      onChange={(e) => setTermDistortion(e.target.value)}
                      className="px-4 py-2 bg-slate-50 border border-slate-200/50 rounded-xl outline-none text-xs font-semibold text-slate-800"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[9px] font-black uppercase tracking-widest text-slate-400">Termo Side-quest</label>
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
                  <h3 className="text-sm font-black uppercase tracking-wider text-slate-800">Configurações do Algoritmo & XP</h3>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Ajuste os limiares de burnout e os multiplicadores de experiência da mentoria</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">

                  {/* Task XP */}
                  <div className="flex flex-col gap-2">
                    <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-indigo-500 animate-pulse" />
                      <span>XP por Tarefa: {taskXpWeight}</span>
                    </label>
                    <input
                      type="range" min="50" max="500" step="10"
                      value={taskXpWeight}
                      onChange={(e) => setTaskXpWeight(Number(e.target.value))}
                      className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                    />
                  </div>

                  {/* Diary XP */}
                  <div className="flex flex-col gap-2">
                    <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-indigo-500 animate-pulse" />
                      <span>XP por Registro: {diaryXpWeight}</span>
                    </label>
                    <input
                      type="range" min="50" max="500" step="10"
                      value={diaryXpWeight}
                      onChange={(e) => setDiaryXpWeight(Number(e.target.value))}
                      className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                    />
                  </div>

                  {/* Session XP */}
                  <div className="flex flex-col gap-2">
                    <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-indigo-500 animate-pulse" />
                      <span>XP por Sessão: {sessionXpWeight}</span>
                    </label>
                    <input
                      type="range" min="50" max="1000" step="50"
                      value={sessionXpWeight}
                      onChange={(e) => setSessionXpWeight(Number(e.target.value))}
                      className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                    />
                  </div>

                  {/* Burnout Risk Limit */}
                  <div className="flex flex-col gap-2">
                    <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                      <Shield className="w-3.5 h-3.5 text-indigo-500" />
                      <span>Limiar Burnout: {burnoutThreshold.toFixed(1)}</span>
                    </label>
                    <input
                      type="range" min="1.0" max="2.0" step="0.1"
                      value={burnoutThreshold}
                      onChange={(e) => setBurnoutThreshold(Number(e.target.value))}
                      className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                    />
                  </div>

                </div>
              </div>

              {/* Templates de Sessão */}
              <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col gap-6">
                <div>
                  <h3 className="text-sm font-black uppercase tracking-wider text-slate-800">Gerenciador de Templates de Sessão</h3>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Adicione modelos de sessões e agendas rápidas para seus alunos</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

                  {/* Create template form */}
                  <div className="bg-slate-50 p-6 rounded-[2rem] border border-slate-100 flex flex-col gap-4">
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Criar Novo Template</h4>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-[8px] font-black uppercase text-slate-400">Título da Sessão</label>
                      <input
                        type="text" placeholder="Ex: Planejamento Trimestral"
                        value={newTemplateTitle} onChange={(e) => setNewTemplateTitle(e.target.value)}
                        className="px-3 py-1.5 bg-white border border-slate-200/50 rounded-xl outline-none text-xs font-semibold text-slate-800"
                      />
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-[8px] font-black uppercase text-slate-400">Duração (Minutos)</label>
                      <input
                        type="number" placeholder="60"
                        value={newTemplateDuration} onChange={(e) => setNewTemplateDuration(Number(e.target.value))}
                        className="px-3 py-1.5 bg-white border border-slate-200/50 rounded-xl outline-none text-xs font-semibold text-slate-800"
                      />
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-[8px] font-black uppercase text-slate-400">Descrição/Foco</label>
                      <textarea
                        rows={2} placeholder="Foco da mentoria e tópicos a abordar..."
                        value={newTemplateDesc} onChange={(e) => setNewTemplateDesc(e.target.value)}
                        className="px-3 py-1.5 bg-white border border-slate-200/50 rounded-xl outline-none text-xs font-semibold text-slate-800 resize-none"
                      />
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        if (!newTemplateTitle.trim()) {
                          push({ title: "Preencha pelo menos o título do template!", variant: "destructive" });
                          return;
                        }
                        const newTemp = {
                          id: String(Date.now()),
                          title: newTemplateTitle.trim(),
                          duration: newTemplateDuration || 60,
                          desc: newTemplateDesc.trim() || "Sem descrição."
                        };
                        setSessionTemplates([...sessionTemplates, newTemp]);
                        setNewTemplateTitle("");
                        setNewTemplateDesc("");
                        push({ title: "Template de Sessão adicionado!", variant: "success" });
                      }}
                      className="w-full py-2 bg-slate-900 text-white rounded-xl text-[9px] font-black uppercase tracking-widest cursor-pointer hover:bg-slate-800 transition-colors"
                    >
                      Adicionar Modelo
                    </button>
                  </div>

                  {/* Templates List */}
                  <div className="md:col-span-2 flex flex-col gap-4">
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Modelos de Sessão Salvos</h4>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-[300px] overflow-y-auto pr-1">
                      {sessionTemplates.map(template => (
                        <div key={template.id} className="p-5 border border-slate-100 bg-slate-50/20 rounded-[1.8rem] flex flex-col justify-between gap-3 text-left">
                          <div>
                            <div className="flex items-center justify-between border-b border-slate-100 pb-1.5 mb-1.5">
                              <span className="text-xs font-black text-slate-800 uppercase tracking-wide">{template.title}</span>
                              <span className="text-[8px] bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-full font-black uppercase">{template.duration} min</span>
                            </div>
                            <p className="text-[9px] font-semibold text-slate-500 leading-relaxed">{template.desc}</p>
                          </div>

                          <button
                            type="button"
                            onClick={() => {
                              setSessionTemplates(sessionTemplates.filter(t => t.id !== template.id));
                              push({ title: "Template de Sessão excluído!", variant: "success" });
                            }}
                            className="text-left text-[8px] font-black uppercase tracking-wider text-rose-500 hover:text-rose-700 transition-colors cursor-pointer border-none bg-transparent"
                          >
                            Excluir Template
                          </button>
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

      {/* EDIT CONFIGURATIONS VIEW */}
      {activeSubTab === "edit" && (
        <form onSubmit={handleSave} className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-3 duration-300">

          {/* LinkedIn Import helper row */}
          <div className="p-5 bg-slate-900 rounded-[2rem] text-white flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-indigo-600 rounded-xl">
                <CloudLightning className="w-5 h-5" />
              </div>
              <div className="text-left">
                <h4 className="text-sm font-black uppercase tracking-wider">Importador LinkedIn Real</h4>
                <p className="text-[9px] font-black uppercase tracking-wider text-slate-400">Preencha sua biografia e trajetórias automaticamente a partir do seu LinkedIn público</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={triggerLinkedInImport}
                disabled={linkedinStage !== "idle"}
                className="px-6 py-2.5 bg-[#0077b5] hover:bg-[#006297] text-white rounded-xl text-[10px] font-black uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {linkedinStage === "idle" ? <Linkedin className="w-4 h-4" /> : <Loader2 className="w-4 h-4 animate-spin" />}
                <span>
                  {linkedinStage === "idle" ? "Importar do LinkedIn Real" :
                    linkedinStage === "connecting" ? "Conectando..." :
                      linkedinStage === "extracting" ? "Extraindo..." :
                        linkedinStage === "populating" ? "Populando..." : "Importado!"}
                </span>
              </button>

              {linkedinStage !== "idle" && (
                <button
                  type="button"
                  onClick={() => {
                    setLinkedinStage("idle");
                    push({ title: "Importação cancelada com sucesso.", variant: "success" });
                  }}
                  className="px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer"
                >
                  Cancelar
                </button>
              )}
            </div>
          </div>

          <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col gap-6">
            <h3 className="text-sm font-black uppercase text-slate-800 tracking-tight border-b border-slate-50 pb-2">Informações Gerais</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[9px] font-black uppercase tracking-widest text-slate-400">Papel na Mentoria</label>
                <div className="flex gap-2">
                  {[
                    { val: "mentor", label: "Mentor" },
                    { val: "mentee", label: "Mentorado" }
                  ].map((item) => (
                    <button
                      key={item.val}
                      type="button"
                      onClick={() => setRole(item.val as any)}
                      className={cn(
                        "flex-1 py-2 rounded-xl border text-[10px] font-black uppercase transition-all cursor-pointer text-center",
                        role === item.val
                          ? "bg-indigo-600 border-indigo-600 text-white shadow-md shadow-indigo-100"
                          : "bg-slate-50 border-slate-200/50 text-slate-500 hover:bg-slate-100"
                      )}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[9px] font-black uppercase tracking-widest text-slate-400">Nome Completo</label>
                <input
                  required
                  type="text"
                  placeholder="Seu nome"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200/50 rounded-xl outline-none text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-indigo-100"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[9px] font-black uppercase tracking-widest text-slate-400">Username / Slug do Perfil Público</label>
                <div className="relative flex items-center">
                  <span className="absolute left-3 text-[8px] font-black uppercase tracking-wider text-slate-400 pointer-events-none">/public/mentoring/</span>
                  <input
                    type="text"
                    required
                    placeholder="seu-username"
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
                <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Apenas letras minúsculas, números e hífens. Ex: milton-bolonha</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[9px] font-black uppercase tracking-widest text-slate-400">Foto de Perfil (Cloudinary Upload / URL)</label>
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
                    {isUploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CloudLightning className="w-3.5 h-3.5" />}
                    <span>{isUploading ? "Enviando..." : "Upload"}</span>
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
                <label className="text-[9px] font-black uppercase tracking-widest text-slate-400">Tagline de Chamada</label>
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
                  <label className="text-[9px] font-black uppercase tracking-widest text-slate-400">Gênero / Tratamento do Perfil</label>
                  <select
                    value={genderTerm}
                    onChange={(e) => setGenderTerm(e.target.value)}
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200/50 rounded-xl outline-none text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-indigo-100 cursor-pointer"
                  >
                    <option value="mentorado">Masculino (Mentorado)</option>
                    <option value="mentorada">Feminino (Mentorada)</option>
                    <option value="mentoradx">Neutro (Mentoradx)</option>
                  </select>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[9px] font-black uppercase tracking-widest text-slate-400">Link LinkedIn</label>
                <input
                  type="text"
                  placeholder="https://linkedin.com/in/..."
                  value={linkedinUrl}
                  onChange={(e) => setLinkedinUrl(e.target.value)}
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200/50 rounded-xl outline-none text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-indigo-100"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[9px] font-black uppercase tracking-widest text-slate-400">Frase Motivacional</label>
                <input
                  type="text"
                  placeholder="Uma frase curta que te inspire..."
                  value={motivationalQuote}
                  onChange={(e) => setMotivationalQuote(e.target.value)}
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200/50 rounded-xl outline-none text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-indigo-100"
                />
              </div>
            </div>
          </div>

          {/* CONTACTS & SOCIALS EDIT CARD */}
          <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col gap-6">
            <h3 className="text-sm font-black uppercase text-slate-800 tracking-tight border-b border-slate-50 pb-2">Contatos & Redes Sociais</h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[9px] font-black uppercase tracking-widest text-slate-400">Telefone / Fixo</label>
                <input
                  type="text"
                  placeholder="Ex: (11) 99999-9999"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200/50 rounded-xl outline-none text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-indigo-100"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[9px] font-black uppercase tracking-widest text-slate-400">WhatsApp (Número Limpo)</label>
                <input
                  type="text"
                  placeholder="Ex: 5511999999999"
                  value={whatsapp}
                  onChange={(e) => setWhatsapp(e.target.value)}
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200/50 rounded-xl outline-none text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-indigo-100"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[9px] font-black uppercase tracking-widest text-slate-400">E-mail Profissional</label>
                <input
                  type="email"
                  placeholder="Ex: milton@21miles.com.br"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200/50 rounded-xl outline-none text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-indigo-100"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[9px] font-black uppercase tracking-widest text-slate-400">GitHub Link</label>
                <input
                  type="text"
                  placeholder="https://github.com/..."
                  value={githubUrl}
                  onChange={(e) => setGithubUrl(e.target.value)}
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200/50 rounded-xl outline-none text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-indigo-100"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[9px] font-black uppercase tracking-widest text-slate-400">Instagram Link</label>
                <input
                  type="text"
                  placeholder="https://instagram.com/..."
                  value={instagramUrl}
                  onChange={(e) => setInstagramUrl(e.target.value)}
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200/50 rounded-xl outline-none text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-indigo-100"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[9px] font-black uppercase tracking-widest text-slate-400">Website / Portfolio Link</label>
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
              <h3 className="text-sm font-black uppercase text-slate-800 tracking-tight border-b border-slate-50 pb-2">Informações de Mentor</h3>

              <div className="flex flex-col gap-1.5">
                <label className="text-[9px] font-black uppercase tracking-widest text-slate-400">Biografia Profissional</label>
                <textarea
                  rows={4}
                  placeholder="Descreva sua jornada, liderança profissional e foco..."
                  value={miniBio}
                  onChange={(e) => setMiniBio(e.target.value)}
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200/50 rounded-xl outline-none text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-indigo-100 resize-none"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[9px] font-black uppercase tracking-widest text-slate-400">Histórico de Experiência / Conquistas de Carreira</label>
                <textarea
                  rows={3}
                  placeholder="Quais foram seus maiores cargos, empresas fundadas ou tempo no mercado..."
                  value={experience}
                  onChange={(e) => setExperience(e.target.value)}
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200/50 rounded-xl outline-none text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-indigo-100 resize-none"
                />
              </div>

              {/* Skills list input */}
              <div className="flex flex-col gap-2">
                <label className="text-[9px] font-black uppercase tracking-widest text-slate-400">Skills / Habilidades</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Adicionar skill..."
                    value={newSkill}
                    onChange={(e) => setNewSkill(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addSkill())}
                    className="flex-1 px-4 py-2 bg-slate-50 border border-slate-200/50 rounded-xl outline-none text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-indigo-100"
                  />
                  <button
                    type="button"
                    onClick={addSkill}
                    className="px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
                  >
                    Adicionar
                  </button>
                </div>
                <div className="flex flex-wrap gap-2 mt-2">
                  {skills.map((s) => (
                    <span
                      key={s}
                      onClick={() => removeSkill(s)}
                      className="bg-slate-100 hover:bg-rose-50 hover:text-rose-600 text-slate-600 px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-wide flex items-center gap-1.5 cursor-pointer transition-all"
                      title="Clique para remover"
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
              <h3 className="text-sm font-black uppercase text-slate-800 tracking-tight border-b border-slate-50 pb-2">Informações de Mentorado</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[9px] font-black uppercase tracking-widest text-slate-400">Objetivo Pessoal</label>
                  <textarea
                    rows={3}
                    placeholder="Ex: Ter mais inteligência emocional, foco familiar ou equilíbrio..."
                    value={personalGoal}
                    onChange={(e) => setPersonalGoal(e.target.value)}
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200/50 rounded-xl outline-none text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-indigo-100 resize-none"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[9px] font-black uppercase tracking-widest text-slate-400">Objetivo de Carreira</label>
                  <textarea
                    rows={3}
                    placeholder="Ex: Transição de carreira para Tech Leader, fundar minha própria startup..."
                    value={careerGoal}
                    onChange={(e) => setCareerGoal(e.target.value)}
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200/50 rounded-xl outline-none text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-indigo-100 resize-none"
                  />
                </div>
              </div>

              {/* Attributes array input */}
              <div className="flex flex-col gap-3">
                <label className="text-[9px] font-black uppercase tracking-widest text-slate-400">3 Atributos que se destaca em si</label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {[0, 1, 2].map((idx) => (
                    <input
                      key={idx}
                      required
                      type="text"
                      placeholder={`Atributo ${idx + 1}`}
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
                <label className="text-[9px] font-black uppercase tracking-widest text-slate-400">3 Experiências de sucesso na vida (Geral/Conquistas)</label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {[0, 1, 2].map((idx) => (
                    <input
                      key={idx}
                      required
                      type="text"
                      placeholder={`Conquista ${idx + 1}`}
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
                  <label className="text-[9px] font-black uppercase tracking-widest text-slate-400">Como se vê no futuro (Visão de Médio/Longo prazo)</label>
                  <textarea
                    rows={3}
                    placeholder="Descreva seus sonhos e onde se vê nos próximos anos..."
                    value={futureVision}
                    onChange={(e) => setFutureVision(e.target.value)}
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200/50 rounded-xl outline-none text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-indigo-100 resize-none"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[9px] font-black uppercase tracking-widest text-slate-400">Maior Atributo / Qualidade Pessoal</label>
                  <textarea
                    rows={3}
                    placeholder="Se as pessoas pudessem descrever você em um único atributo forte, qual seria?"
                    value={greatestAttribute}
                    onChange={(e) => setGreatestAttribute(e.target.value)}
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200/50 rounded-xl outline-none text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-indigo-100 resize-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[9px] font-black uppercase tracking-widest text-slate-400">Grupo Familiar (Descreva brevemente)</label>
                  <textarea
                    rows={2}
                    placeholder="Ex: Casado, 2 filhos, convivência próxima com os pais..."
                    value={familyGroup}
                    onChange={(e) => setFamilyGroup(e.target.value)}
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200/50 rounded-xl outline-none text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-indigo-100 resize-none"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[9px] font-black uppercase tracking-widest text-slate-400">Hobbies, Talentos & Habilidades Artísticas</label>
                  <textarea
                    rows={2}
                    placeholder="Ex: Pintura digital, tocar violão clássico, jogar tênis..."
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
                <span>Diretrizes & Alinhamento de Evolução</span>
              </h3>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">
                Defina suas metas estratégicas, sonhos e alinhamento profissional na mentoria
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5 text-left">
                <label className="text-[9px] font-black uppercase tracking-widest text-slate-400">O que espera da mentoria (Expectativas)</label>
                <textarea
                  rows={3}
                  placeholder="Ex: Alinhamento metodológico prático, feedbacks francos, network estratégico..."
                  value={mentorshipExpectations}
                  onChange={(e) => setMentorshipExpectations(e.target.value)}
                  className="w-full px-4 py-2 bg-white border border-[#e8e5dd] rounded-xl outline-none text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-indigo-100 resize-none"
                />
              </div>

              <div className="flex flex-col gap-1.5 text-left">
                <label className="text-[9px] font-black uppercase tracking-widest text-slate-400">Objetivos a Curto Prazo (Foco Imediato)</label>
                <textarea
                  rows={3}
                  placeholder="Ex: Concluir MVP da nova plataforma em 3 meses, organizar cronograma semanal..."
                  value={shortTermGoals}
                  onChange={(e) => setShortTermGoals(e.target.value)}
                  className="w-full px-4 py-2 bg-white border border-[#e8e5dd] rounded-xl outline-none text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-indigo-100 resize-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5 text-left">
                <label className="text-[9px] font-black uppercase tracking-widest text-slate-400">Objetivos a Médio Prazo (Construção)</label>
                <textarea
                  rows={3}
                  placeholder="Ex: Escalar equipe para 10 desenvolvedores, atingir breakeven financeiro..."
                  value={mediumTermGoals}
                  onChange={(e) => setMediumTermGoals(e.target.value)}
                  className="w-full px-4 py-2 bg-white border border-[#e8e5dd] rounded-xl outline-none text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-indigo-100 resize-none"
                />
              </div>

              <div className="flex flex-col gap-1.5 text-left">
                <label className="text-[9px] font-black uppercase tracking-widest text-slate-400">Sonho Profissional (Sua Estrela Guia)</label>
                <textarea
                  rows={3}
                  placeholder="Ex: Ser a maior referência de SaaS educacional do país, criar um negócio autossustentável..."
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
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-8 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all disabled:opacity-50 flex items-center gap-2 cursor-pointer shadow-lg shadow-indigo-100 border-none"
            >
              {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
              <span>Salvar Alterações</span>
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
          <div className="absolute inset-0 cursor-pointer" onClick={() => setIsSecretaryOpen(false)} />

          {/* Premium side panel */}
          <div className="relative bg-white w-full max-w-lg h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-300 font-sans">

            {/* Header */}
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-indigo-950 text-white">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-amber-300 animate-pulse" />
                <div className="text-left">
                  <h3 className="text-sm font-black uppercase tracking-wider">Secretaria IA</h3>
                  <p className="text-[8px] text-indigo-300 font-black uppercase tracking-widest">Inteligência Artificial e Mentor Diretor</p>
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
                  <h4 className="text-xs font-black uppercase text-indigo-950">Acionar Inteligência da Secretaria</h4>
                  <p className="text-[10px] text-slate-500 font-semibold mt-1 leading-normal">
                    A ADE compilará suas tarefas concluídas, sessões agendadas, diários de bordo e objetivos para gerar recomendações estratégicas exclusivas e apontar os seus próximos passos operacionais.
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
                      <span>Analisando Performance...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 text-amber-300" />
                      <span>Gerar Recomendações e Próximos Passos</span>
                    </>
                  )}
                </button>
              </div>

              {/* Suggestions Panel */}
              <div className="flex flex-col gap-3 text-left">
                <h4 className="text-[9px] font-black uppercase tracking-wider text-slate-400">Recomendação Estratégica Atual</h4>

                {secretaryText ? (
                  <div className="bg-[#fcfbf9] border border-[#e8e5dd] p-6 rounded-3xl text-xs font-semibold text-slate-700 leading-relaxed font-sans whitespace-pre-line text-left">
                    {secretaryText}
                  </div>
                ) : (
                  <div className="border-2 border-dashed border-slate-200 rounded-3xl p-8 text-center text-slate-400 flex flex-col items-center gap-2 bg-slate-50/50">
                    <Sparkles className="w-8 h-8 text-slate-300" />
                    <p className="text-xs font-bold text-slate-600">Nenhuma recomendação recente gerada.</p>
                    <p className="text-[10px] text-slate-400 mt-1 max-w-[280px] leading-normal font-semibold">Clique no botão acima para ativar a ADE e obter insights acionáveis sobre sua evolução.</p>
                  </div>
                )}
              </div>

              {/* History Section */}
              {secretaryHistory.length > 1 && (
                <div className="flex flex-col gap-3 text-left mt-2">
                  <h4 className="text-[9px] font-black uppercase tracking-wider text-slate-400">Histórico de Sugestões Anteriores</h4>
                  <div className="flex flex-col gap-2.5 max-h-48 overflow-y-auto pr-1">
                    {secretaryHistory.map((item, idx) => {
                      const dateStr = new Date(item.createdAt).toLocaleDateString("pt-BR", {
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit"
                      });
                      return (
                        <button
                          key={item._id || idx}
                          onClick={() => setSecretaryText(item.content)}
                          className={cn(
                            "w-full p-4 rounded-2xl border text-left flex flex-col gap-1 cursor-pointer transition-all hover:bg-slate-50 border-none bg-transparent",
                            secretaryText === item.content
                              ? "bg-slate-50 border border-indigo-200"
                              : "bg-white border border-slate-100"
                          )}
                        >
                          <span className="text-[8px] font-black uppercase text-indigo-600 tracking-wider">Sugestão de {dateStr}</span>
                          <p className="text-[10.5px] font-semibold text-slate-600 truncate">{item.content}</p>
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
                Fechar Painel
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
