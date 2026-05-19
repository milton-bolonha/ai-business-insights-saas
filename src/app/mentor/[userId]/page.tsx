"use client";

import React, { useState, useEffect } from "react";
import {
  Loader2, User, Linkedin, Github, Instagram, Globe,
  Crown, Shield, Award, Sparkles, CheckCircle2, ChevronRight, Info
} from "lucide-react";

import { cn } from "@/lib/utils"

interface PublicProfilePageProps {
  params: Promise<{
    userId: string;
  }>;
}

// Cloudinary image resizer/transformer utility
function getOptimizedCloudinaryUrl(url: string, width = 300, height = 300) {
  if (!url) return "";
  if (url.includes("cloudinary.com")) {
    // If the URL has an active version/upload tag, insert transformation parameters
    return url.replace("/upload/", `/upload/c_fill,g_face,w_${width},h_${height},q_auto,f_auto/`);
  }
  return url;
}

export default function MentorProfilePage({ params }: PublicProfilePageProps) {
  const unwrappedParams = React.use(params);
  const targetUserId = unwrappedParams.userId;
  const [profile, setProfile] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Interactive badge tooltip description state
  const [activeTooltip, setActiveTooltip] = useState<string | null>(null);

  useEffect(() => {
    const fetchPublicProfile = async () => {
      try {
        setIsLoading(true);
        const res = await fetch(`/api/mentoring/public-profile?id=${targetUserId}`);
        if (!res.ok) {
          if (res.status === 404) {
            throw new Error("Perfil não encontrado");
          }
          throw new Error("Erro ao carregar o perfil público");
        }
        const data = await res.json();
        setProfile(data.profile);
      } catch (err: any) {
        setError(err.message || "Erro desconhecido");
      } finally {
        setIsLoading(false);
      }
    };

    if (targetUserId) {
      fetchPublicProfile();
    }
  }, [targetUserId]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#f7f5f0] flex items-center justify-center font-sans">
        <div className="flex flex-col items-center gap-3 text-slate-500">
          <Loader2 className="w-8 h-8 text-slate-800 animate-spin" />
          <span className="text-[10px] font-black uppercase tracking-widest font-sans">Carregando Perfil...</span>
        </div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen bg-[#f7f5f0] flex items-center justify-center p-6 text-center font-sans">
        <div className="bg-white border border-[#e2dfd5] p-8 rounded-xl max-w-sm w-full shadow-lg">
          <Shield className="w-12 h-12 text-[#1a1a1a] mx-auto mb-4" />
          <h3 className="text-base font-bold text-[#1a1a1a] uppercase tracking-wider font-['Lora',Georgia,serif] mb-2">Acesso Restrito</h3>
          <p className="text-xs font-semibold text-slate-500 leading-relaxed mb-6 font-sans">
            {error || "O perfil solicitado não pôde ser localizado em nossa base."}
          </p>
          <a
            href="/"
            className="inline-block bg-[#1a1a1a] hover:bg-slate-800 text-white text-[10px] font-bold uppercase tracking-widest px-6 py-3 rounded-xl transition-all font-sans"
          >
            Voltar para o Início
          </a>
        </div>
      </div>
    );
  }

  // RPG level math
  const xp = profile.xp !== undefined ? profile.xp : 250;
  const currentLevel = Math.floor(Math.sqrt(xp / 50)) + 1;
  const totalHearts = 6 + currentLevel;
  const engagement = profile.engagement !== undefined ? profile.engagement : 75;
  const activeHearts = Math.min(totalHearts, Math.max(0, Math.round((engagement / 100) * totalHearts)));

  const currentLevelBaseXp = Math.pow(currentLevel - 1, 2) * 50;
  const nextLevelBaseXp = Math.pow(currentLevel, 2) * 50;
  const xpInCurrentLevel = xp - currentLevelBaseXp;
  const xpNeededForNextLevel = nextLevelBaseXp - currentLevelBaseXp;
  const levelProgressPercent = Math.min(100, Math.round((xpInCurrentLevel / xpNeededForNextLevel) * 100));

  // Class evaluator
  const getDominantClass = () => {
    const goalsString = `${profile.careerGoal || ""} ${profile.personalGoal || ""} ${profile.tagline || ""}`.toLowerCase();
    if (goalsString.includes("tech") || goalsString.includes("dev") || goalsString.includes("software") || goalsString.includes("tecnolog")) {
      return "Arquiteto Tecnológico";
    }
    if (goalsString.includes("start") || goalsString.includes("fund") || goalsString.includes("ceo") || goalsString.includes("empreend") || goalsString.includes("negoci")) {
      return "Estrategista de Negócios";
    }
    if (goalsString.includes("foco") || goalsString.includes("prod") || goalsString.includes("fazer") || goalsString.includes("execut")) {
      return "Executor de Alta Performance";
    }
    if (profile.skills && profile.skills.length > 5) {
      return "Analista Multidisciplinar";
    }
    return "Operador em Evolução";
  };

  const dominantClass = getDominantClass();

  // Dynamic high-fidelity badges list (hover/click to see detail descriptions)
  const badgesList = [
    {
      id: "verified_mentor",
      title: "Mentor Verificado",
      desc: "Membro certificado e homologado pelo Instituto ADE de Evolução Cognitiva.",
      icon: Award,
      color: "bg-amber-50 border-amber-200 text-amber-700 hover:bg-amber-100"
    },
    {
      id: "dominant_class",
      title: dominantClass,
      desc: `Especialidade ativa determinada pelo algoritmo com base nos objetivos analíticos cadastrados: ${dominantClass}.`,
      icon: Crown,
      color: "bg-indigo-50 border-indigo-200 text-indigo-700 hover:bg-indigo-100"
    },
    {
      id: "high_consistency",
      title: "Consistência Elite",
      desc: "Status operacional ativo com alta taxa de engajamento e tarefas concluídas na temporada.",
      icon: CheckCircle2,
      color: "bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100"
    }
  ];

  return (
    <div className="min-h-screen bg-[#f7f5f0] text-[#1a1a1a] flex flex-col font-sans relative selection:bg-slate-900/10">
      {/* Inject Google Fonts */}
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,100..1000;1,9..40,100..1000&family=Lora:ital,wght@0,400..700;1,400..700&display=swap" rel="stylesheet" />

      {/* 1. Header Navigation Bar (Premium Dark Menu) */}
      <nav className="bg-[#1a1a1a] text-white py-4 px-6 border-b border-slate-800 font-sans relative z-30">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <a href="/ranking" className="text-xs font-bold font-['Lora',Georgia,serif] tracking-wider flex items-center gap-2">
            <Shield className="w-4 h-4 text-indigo-400" />
            <span>I/O MENTORIA</span>
          </a>
          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-[10px] font-black uppercase tracking-widest text-slate-300">
            <a href="/ranking?tab=mentores" className="hover:text-white transition-colors">Mentores</a>
            <a href="/ranking?tab=mentorados" className="hover:text-white transition-colors">Mentorados</a>
            <a href="/ranking?tab=projetos" className="hover:text-white transition-colors">Projetos em Destaque</a>
          </div>
        </div>
      </nav>

      {/* 2. Main Content Container: Warm Cream Background */}
      <main className="max-w-4xl mx-auto w-full py-12 px-6 flex flex-col gap-8">

        {/* 2.1 Modernized RPG Card Container */}
        <div className="bg-[#fcfbf9] border border-[#e8e5dd] p-8 rounded-xl shadow-xs flex flex-col md:flex-row items-center gap-8 relative overflow-hidden font-sans">
          
          {/* Left RPG Character Box (Clean, No Nested Box!) */}
          <div className="flex flex-col items-center gap-3 shrink-0 w-full md:w-48 relative">
            {/* Photo Frame with soft ring outline */}
            <div className="h-28 w-28 rounded-full border-4 border-white overflow-hidden bg-slate-100 flex items-center justify-center shrink-0 shadow-md relative group ring-1 ring-[#e8e5dd]/80">
              {profile.photoUrl ? (
                <img 
                  src={getOptimizedCloudinaryUrl(profile.photoUrl, 300, 300)} 
                  alt={profile.name} 
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-slate-50 text-slate-400">
                  <User className="w-12 h-12" />
                </div>
              )}
            </div>
            {/* Level badge overlapping the photo */}
            <div className="absolute top-20 right-8 bg-slate-900 border border-slate-800 text-white w-9 h-9 rounded-full flex flex-col items-center justify-center shadow-md">
              <span className="text-[7px] font-black uppercase tracking-wider text-slate-400 leading-none">LV</span>
              <span className="text-xs font-black text-white leading-none mt-0.5">{currentLevel}</span>
            </div>

            {/* RPG Stats Column (Extremely Clean, No Nested Border Cards!) */}
            <div className="w-full flex flex-col gap-2 mt-1.5 font-sans items-center">
              {/* HP (Pulsing hearts directly, no label/nesting) */}
              <div className="flex items-center justify-center gap-0.5 mt-0.5" title={`Rendimento: ${engagement}%`}>
                {Array.from({ length: totalHearts }).map((_, idx) => (
                  <svg 
                    key={idx} 
                    className={cn(
                      "w-3.5 h-3.5 transition-all duration-300", 
                      idx < activeHearts ? "text-rose-500 fill-rose-500 drop-shadow-[0_0_2px_rgba(244,63,94,0.4)] animate-pulse" : "text-[#d1ccc0] fill-transparent"
                    )} 
                    viewBox="0 0 24 24" 
                    stroke="currentColor" 
                    strokeWidth="2.5"
                  >
                    <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                  </svg>
                ))}
              </div>

              {/* XP Progress Bar (Blue/Indigo, Clean!) */}
              <div className="w-full flex flex-col gap-1 mt-1 font-sans">
                <div className="flex items-center justify-between text-[8px] font-black uppercase tracking-widest text-slate-400">
                  <span>XP</span>
                  <span className="text-slate-700 font-bold">{xpInCurrentLevel} / {xpNeededForNextLevel} XP</span>
                </div>
                <div className="w-full bg-slate-200/60 h-2.5 rounded-full overflow-hidden">
                  <div 
                    className="h-full rounded-full transition-all duration-700"
                    style={{ width: `${levelProgressPercent}%`, backgroundColor: '#4f46e5' }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Right section of header: Info */}
          <div className="flex-1 w-full text-center md:text-left min-w-0 flex flex-col gap-4">
            <div>
              <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4 justify-center md:justify-start">
                <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight font-sans leading-none flex items-center justify-center md:justify-start gap-2">
                  <span>{profile.name}</span>
                  <span className="bg-indigo-600 text-[8px] text-white font-black px-2 py-0.5 rounded-full uppercase tracking-wider shadow-sm shrink-0">
                    {profile.role === "mentor" ? "Mentor" : "Mentorado"}
                  </span>
                </h2>
              </div>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1 font-sans">{profile.tagline || "Parceiro Estratégico de Evolução Coletiva"}</p>
              
              {/* Dynamic Mentees & Level HUD Badges */}
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 mt-2 font-sans">
                <span className="bg-indigo-50 border border-indigo-200 text-indigo-700 px-2.5 py-1 rounded-lg text-[8.5px] font-black uppercase tracking-wider shadow-3xs">
                  Mentorados: {profile.menteesCount || 0}
                </span>
                <span className="bg-slate-900 border border-slate-800 text-white px-2.5 py-1 rounded-lg text-[8.5px] font-black uppercase tracking-wider shadow-3xs">
                  Nível: {currentLevel}
                </span>
              </div>
            </div>

            {/* Repositioned Motivational Quote (Above badges!) */}
            {profile.motivationalQuote && (
              <div className="bg-[#fcfbf9] border border-[#e8e5dd] px-5 py-3 rounded-xl italic text-xs font-semibold text-slate-700 leading-relaxed shadow-3xs relative font-serif mt-2 mb-1.5 text-center w-full max-w-xl">
                <span className="absolute left-3 top-0.5 text-lg text-[#e8e5dd] pointer-events-none font-serif leading-none">“</span>
                {profile.motivationalQuote}
                <span className="absolute right-3 bottom-0 text-lg text-[#e8e5dd] pointer-events-none font-serif leading-none">”</span>
              </div>
            )}

            {/* Achievements row (Clean, Un-nested Badges, No Label!) */}
            <div className="flex flex-wrap items-center gap-3 mt-2 w-full font-sans">
              <div className="flex flex-wrap gap-2 relative">
                {badgesList.map((badge) => {
                  const IconComponent = badge.icon;
                  const isHovered = activeTooltip === badge.id;
                  return (
                    <div key={badge.id} className="relative">
                      <button
                        onMouseEnter={() => setActiveTooltip(badge.id)}
                        onMouseLeave={() => setActiveTooltip(null)}
                        onClick={() => setActiveTooltip(activeTooltip === badge.id ? null : badge.id)}
                        className={cn(
                          "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[9px] font-black uppercase tracking-wider font-sans transition-all cursor-pointer shadow-3xs",
                          badge.color
                        )}
                      >
                        <IconComponent className="w-3.5 h-3.5" />
                        <span>{badge.title}</span>
                      </button>

                      {/* Popover / Tooltip detail */}
                      {isHovered && (
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-56 bg-slate-900 text-white text-[9.5px] font-medium leading-relaxed p-3 rounded-lg shadow-xl z-50 animate-in fade-in slide-in-from-bottom-1 duration-200 normal-case text-center">
                          <div className="font-black uppercase tracking-widest text-indigo-300 text-[8px] mb-1">
                            {badge.title}
                          </div>
                          {badge.desc}
                          <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-900" />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Social Channels & website */}
            <div className="flex flex-wrap justify-center md:justify-start gap-2 mt-1 text-[8px] font-black uppercase tracking-widest font-sans">
              {profile.linkedinUrl && (
                <a href={profile.linkedinUrl} target="_blank" rel="noreferrer" className="flex items-center gap-1 hover:bg-slate-100 text-slate-600 transition-colors bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200 shadow-3xs">
                  <Linkedin className="w-2.5 h-2.5 text-indigo-500" />
                  <span>LinkedIn</span>
                </a>
              )}
              {profile.githubUrl && (
                <a href={profile.githubUrl} target="_blank" rel="noreferrer" className="flex items-center gap-1 hover:bg-slate-100 text-slate-600 transition-colors bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200 shadow-3xs">
                  <Github className="w-2.5 h-2.5 text-slate-800" />
                  <span>GitHub</span>
                </a>
              )}
              {profile.instagramUrl && (
                <a href={profile.instagramUrl} target="_blank" rel="noreferrer" className="flex items-center gap-1 hover:bg-slate-100 text-slate-600 transition-colors bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200 shadow-3xs">
                  <Instagram className="w-2.5 h-2.5 text-pink-500" />
                  <span>Instagram</span>
                </a>
              )}
              {profile.websiteUrl && (
                <a href={profile.websiteUrl} target="_blank" rel="noreferrer" className="flex items-center gap-1 hover:bg-slate-100 text-slate-600 transition-colors bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200 shadow-3xs">
                  <Globe className="w-2.5 h-2.5 text-slate-600" />
                  <span>Website</span>
                </a>
              )}
            </div>
          </div>
        </div>


        {/* 2.2 Biography & Experience (Clean Editorial grids, larger sophisticated serif titles) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mt-4">
          <div className="md:col-span-2 flex flex-col gap-10">

            {/* Bio section */}
            <div>
              <h2 className="text-2xl font-bold text-[#1a1a1a] font-['Lora',Georgia,serif] border-b border-[#e2dfd5] pb-2 mb-4">
                Biografia Executiva
              </h2>
              <p className="text-[11px] font-medium text-slate-600 leading-relaxed font-sans whitespace-pre-line">
                {profile.miniBio || "Biografia não cadastrada."}
              </p>
            </div>

            {/* Experience section */}
            <div>
              <h2 className="text-2xl font-bold text-[#1a1a1a] font-['Lora',Georgia,serif] border-b border-[#e2dfd5] pb-2 mb-4">
                Trajetória & Experiência
              </h2>
              <p className="text-[11px] font-medium text-slate-600 leading-relaxed font-sans whitespace-pre-line">
                {profile.experience || "Trajetória profissional ainda não cadastrada."}
              </p>
            </div>

          </div>

          {/* Right Column: Skills pills */}
          <div>
            <h2 className="text-[10px] font-black uppercase tracking-widest text-slate-400 font-sans border-b border-[#e2dfd5] pb-2 mb-4">
              Competências Chaves
            </h2>
            <div className="flex flex-wrap gap-1.5">
              {profile.skills && profile.skills.length > 0 ? (
                profile.skills.map((skill: string, idx: number) => (
                  <span
                    key={idx}
                    className="bg-[#f7f5f0] border border-[#e2dfd5] text-[#1a1a1a] px-2.5 py-1 rounded text-[8px] font-bold uppercase tracking-wider font-sans"
                  >
                    {skill}
                  </span>
                ))
              ) : (
                <span className="text-[9px] font-bold text-slate-400 font-sans">Nenhuma competência cadastrada.</span>
              )}
            </div>
          </div>
        </div>



      </main>

      {/* 3. Footer */}
      <footer className="mt-auto py-6 border-t border-[#e2dfd5] text-center">
        <p className="text-[8px] text-slate-400 font-black uppercase tracking-widest font-sans">
          I/O MENTORIA • TODOS OS DIREITOS RESERVADOS
        </p>
      </footer>
    </div>
  );
}
