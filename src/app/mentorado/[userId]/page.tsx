"use client";

import React, { useState, useEffect } from "react";
import {
  Loader2, User, Linkedin, Github, Instagram, Globe,
  Crown, Shield, Award, Sparkles, CheckCircle2, ChevronRight, Info, Activity
} from "lucide-react";

import { cn } from "@/lib/utils";
import { useTranslation } from "@/lib/hooks/useTranslation";

interface PublicProfilePageProps {
  params: Promise<{
    userId: string;
  }>;
}

// Cloudinary image resizer/transformer utility
function getOptimizedCloudinaryUrl(url: string, width = 300, height = 300) {
  if (!url) return "";
  if (url.includes("cloudinary.com")) {
    return url.replace("/upload/", `/upload/c_fill,g_face,w_${width},h_${height},q_auto,f_auto/`);
  }
  return url;
}

export default function MentoradoProfilePage({ params }: PublicProfilePageProps) {
  const unwrappedParams = React.use(params);
  const targetUserId = unwrappedParams.userId;
  const [profile, setProfile] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { t } = useTranslation();

  // Interactive badge tooltip description state
  const [activeTooltip, setActiveTooltip] = useState<string | null>(null);

  useEffect(() => {
    const fetchPublicProfile = async () => {
      try {
        setIsLoading(true);
        const res = await fetch(`/api/mentoring/public-profile?id=${targetUserId}`);
        if (!res.ok) {
          if (res.status === 404) {
            throw new Error(t("public.mentee.profileNotFound"));
          }
          throw new Error(t("public.mentee.errorLoadingProfile"));
        }
        const data = await res.json();
        setProfile(data.profile);
      } catch (err: any) {
        setError(err.message || t("public.mentee.unknownError"));
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
          <span className="text-[10px] font-black uppercase tracking-widest font-sans">{t("public.mentee.loadingProfile")}</span>
        </div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen bg-[#f7f5f0] flex items-center justify-center p-6 text-center font-sans">
        <div className="bg-white border border-[#e2dfd5] p-8 rounded-xl max-w-sm w-full shadow-lg">
          <Shield className="w-12 h-12 text-[#1a1a1a] mx-auto mb-4" />
          <h3 className="text-base font-bold text-[#1a1a1a] uppercase tracking-wider font-['Lora',Georgia,serif] mb-2">{t("public.mentee.restrictedAccess")}</h3>
          <p className="text-xs font-semibold text-slate-500 leading-relaxed mb-6 font-sans">
            {error || t("public.mentee.profileNotFoundDesc")}
          </p>
          <a
            href="/"
            className="inline-block bg-[#1a1a1a] hover:bg-slate-800 text-white text-[10px] font-bold uppercase tracking-widest px-6 py-3 rounded-xl transition-all font-sans"
          >
            {t("public.mentee.backToHome")}
          </a>
        </div>
      </div>
    );
  }

  // RPG level math
  const xp = profile.xp !== undefined ? profile.xp : 0;
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
  const getDominantClassKey = () => {
    const goalsString = `${profile.careerGoal || ""} ${profile.personalGoal || ""} ${profile.tagline || ""}`.toLowerCase();
    if (goalsString.includes("tech") || goalsString.includes("dev") || goalsString.includes("software") || goalsString.includes("tecnolog")) {
      return "techArchitect";
    }
    if (goalsString.includes("start") || goalsString.includes("fund") || goalsString.includes("ceo") || goalsString.includes("empreend") || goalsString.includes("negoci")) {
      return "businessStrategist";
    }
    if (goalsString.includes("foco") || goalsString.includes("prod") || goalsString.includes("fazer") || goalsString.includes("execut")) {
      return "highPerformanceExecutor";
    }
    if (profile.skills && profile.skills.length > 5) {
      return "multidisciplinaryAnalyst";
    }
    return "evolvingOperator";
  };

  const dominantClassKey = getDominantClassKey();
  const dominantClass = t(`public.mentee.${dominantClassKey}`);

  // Dynamic high-fidelity badges list (hover/click to see detail descriptions)
  const badgesList = [
    {
      id: "verified_mentee",
      title: t("public.mentee.verifiedMentee"),
      desc: t("public.mentee.verifiedMenteeDesc"),
      icon: Sparkles,
      color: "bg-indigo-50 border-indigo-200 text-indigo-700 hover:bg-indigo-100"
    },
    {
      id: "dominant_class",
      title: dominantClass,
      desc: t("public.mentee.activeSpecialtyDesc", { class: dominantClass }),
      icon: Crown,
      color: "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
    },
    {
      id: "high_consistency",
      title: t("public.mentee.highPerformance"),
      desc: t("public.mentee.highPerformanceDesc"),
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
            <span>{t("public.mentee.ioMentoring")}</span>
          </a>
          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-[10px] font-black uppercase tracking-widest text-slate-300">
            <a href="/ranking?tab=mentores" className="hover:text-white transition-colors">{t("public.mentee.mentors")}</a>
            <a href="/ranking?tab=mentorados" className="hover:text-white transition-colors">{t("public.mentee.mentees")}</a>
            <a href="/ranking?tab=projetos" className="hover:text-white transition-colors">{t("public.mentee.featuredProjects")}</a>
          </div>
        </div>
      </nav>

      {/* 2. Main Content Container: Warm Cream Background */}
      <main className="max-w-4xl mx-auto w-full py-12 px-6 flex flex-col gap-8">

        {/* 2.1 Modernized RPG Card Container */}
        <div className="bg-[#fcfbf9] border border-[#e8e5dd] p-8 rounded-xl shadow-xs flex flex-col md:flex-row gap-8 items-start relative overflow-hidden font-sans">
          <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/5 blur-[120px] rounded-full pointer-events-none" />
          <div className="absolute -bottom-10 -left-10 w-60 h-60 bg-emerald-500/5 blur-[100px] rounded-full pointer-events-none" />

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
              <span className="text-[7px] font-black uppercase tracking-wider text-slate-400 leading-none">{t("public.mentee.lv")}</span>
              <span className="text-xs font-black text-white leading-none mt-0.5">{currentLevel}</span>
            </div>

            {/* RPG Stats Column (Extremely Clean, No Nested Border Cards!) */}
            <div className="w-full flex flex-col gap-2 mt-1.5 font-sans items-center">
              {/* HP (Pulsing hearts directly, no label/nesting) */}
              <div className="flex items-center justify-center gap-0.5 mt-0.5" title={t("public.mentee.yield", { engagement })}>
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
                  <span>{t("public.mentee.xp")}</span>
                  <span className="text-slate-700 font-bold">{xpInCurrentLevel} / {xpNeededForNextLevel} {t("public.mentee.xp")}</span>
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
          <div className="flex-1 w-full min-w-0 flex flex-col gap-3 self-stretch justify-between text-left">
            <div>
              <h2 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight mb-0.5 leading-none font-sans flex items-center gap-2">
                <span>{profile.name}</span>
                <span className="bg-indigo-600 text-[8px] text-white font-black px-2 py-0.5 rounded-full uppercase tracking-wider shadow-sm shrink-0">
                  {profile.role === "mentor" ? t("public.mentee.mentor") : t("public.mentee.mentee")}
                </span>
              </h2>
              <p className="text-indigo-600 text-[10px] font-bold uppercase tracking-widest mb-2 font-sans">{profile.tagline || t("public.mentee.defaultTagline")}</p>

              {/* Sleek RPG Gamer HUD Status Bar */}
              <div className="flex flex-wrap items-center gap-2 mb-3 font-sans">
                {/* Classe HUD Badge */}
                <div className="flex items-center gap-1.5 bg-slate-950 text-white px-2.5 py-1 rounded-lg text-[8.5px] font-black uppercase tracking-wider cursor-help group/hud relative border border-slate-800 shadow-3xs">
                  <Shield className="w-3 h-3 text-amber-400 shrink-0" />
                  <span>{dominantClass}</span>
                  
                  <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 hidden group-hover/hud:flex flex-col bg-slate-900 text-white text-[8px] p-2 rounded-lg shadow-md w-48 text-center z-30 pointer-events-none normal-case">
                    <span className="font-black uppercase tracking-wider mb-0.5 text-amber-400">{t("public.mentee.evolutionClass")}</span>
                    <span className="text-slate-300 leading-normal font-semibold">{t("public.mentee.evolutionClassDesc")}</span>
                  </div>
                </div>

                {/* Tensão Cognitiva HUD Badge */}
                <div className="flex items-center gap-1.5 bg-white border border-[#e8e5dd] text-slate-700 px-2.5 py-1 rounded-lg text-[8.5px] font-black uppercase tracking-wider cursor-help group/hud relative shadow-3xs">
                  <Activity className="w-3 h-3 text-indigo-500 shrink-0" />
                  <span>{t("public.mentee.tension")}</span>
                  
                  <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 hidden group-hover/hud:flex flex-col bg-slate-900 text-white text-[8px] p-2 rounded-lg shadow-md w-48 text-center z-30 pointer-events-none normal-case">
                    <span className="font-black uppercase tracking-wider mb-0.5 text-indigo-400">{t("public.mentee.cognitiveTension")}</span>
                    <span className="text-slate-300 leading-normal font-semibold">{t("public.mentee.cognitiveTensionDesc")}</span>
                  </div>
                </div>

                {/* Tarefas HUD Badge */}
                <div className="flex items-center gap-1.5 bg-white border border-[#e8e5dd] text-slate-700 px-2.5 py-1 rounded-lg text-[8.5px] font-black uppercase tracking-wider cursor-help group/hud relative shadow-3xs">
                  <CheckCircle2 className="w-3 h-3 text-emerald-500 shrink-0" />
                  <span>{t("public.mentee.tasks", { completed: Math.round((engagement / 100) * 4), total: 4 })}</span>
                  
                  <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 hidden group-hover/hud:flex flex-col bg-slate-900 text-white text-[8px] p-2 rounded-lg shadow-md w-48 text-center z-30 pointer-events-none normal-case">
                    <span className="font-black uppercase tracking-wider mb-0.5 text-emerald-400">{t("public.mentee.executedTasks")}</span>
                    <span className="text-slate-300 leading-normal font-semibold">{t("public.mentee.executedTasksDesc")}</span>
                  </div>
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
            </div>

            {/* Social Channels & website */}
            <div className="flex flex-wrap gap-2 mt-2 w-full font-sans">
              {profile.linkedinUrl && (
                <a href={profile.linkedinUrl} target="_blank" rel="noreferrer" className="flex items-center gap-1 hover:text-slate-800 transition-colors cursor-pointer bg-white hover:bg-slate-50 px-2.5 py-1.5 rounded-xl border border-slate-200/50 text-[10px] font-bold text-slate-500 shadow-3xs">
                  <Linkedin className="w-3 h-3 text-indigo-500" />
                  <span>{t("public.mentee.linkedin")}</span>
                </a>
              )}
              {profile.githubUrl && (
                <a href={profile.githubUrl} target="_blank" rel="noreferrer" className="flex items-center gap-1 hover:text-slate-800 transition-colors cursor-pointer bg-white hover:bg-slate-50 px-2.5 py-1.5 rounded-xl border border-slate-200/50 text-[10px] font-bold text-slate-500 shadow-3xs">
                  <Github className="w-3 h-3 text-slate-700" />
                  <span>{t("public.mentee.github")}</span>
                </a>
              )}
              {profile.instagramUrl && (
                <a href={profile.instagramUrl} target="_blank" rel="noreferrer" className="flex items-center gap-1 hover:text-slate-800 transition-colors cursor-pointer bg-white hover:bg-slate-50 px-2.5 py-1.5 rounded-xl border border-slate-200/50 text-[10px] font-bold text-slate-500 shadow-3xs">
                  <Instagram className="w-3 h-3 text-pink-500" />
                  <span>{t("public.mentee.instagram")}</span>
                </a>
              )}
              {profile.websiteUrl && (
                <a href={profile.websiteUrl} target="_blank" rel="noreferrer" className="flex items-center gap-1 hover:text-slate-800 transition-colors cursor-pointer bg-white hover:bg-slate-50 px-2.5 py-1.5 rounded-xl border border-slate-200/50 text-[10px] font-bold text-slate-500 shadow-3xs">
                  <Globe className="w-3 h-3 text-sky-500" />
                  <span>{t("public.mentee.website")}</span>
                </a>
              )}
            </div>
          </div>
        </div>

        {/* 2.2 Projects Showcase (Dynamic Cloudinary image optimizers, normal color!) */}
        {profile.projects && profile.projects.length > 0 && (
          <div className="mt-4">
            <h2 className="text-2xl font-bold text-[#1a1a1a] font-['Lora',Georgia,serif] border-b border-[#e2dfd5] pb-2 mb-6">
              {t("public.mentee.projectsAndCases")}
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
              {profile.projects.map((proj: any) => (
                <div key={proj.id} className="border border-[#e2dfd5] rounded-xl p-5 flex flex-col gap-4 shadow-3xs bg-white">
                  {proj.imageUrl && (
                    <img
                      src={getOptimizedCloudinaryUrl(proj.imageUrl, 500, 300)}
                      alt={proj.title}
                      className="w-full h-40 object-cover rounded-lg"
                    />
                  )}
                  <div>
                    <h4 className="text-xs font-bold text-[#1a1a1a] uppercase tracking-wider font-['Lora',Georgia,serif]">
                      {proj.title}
                    </h4>
                    <p className="text-[10px] text-slate-500 font-medium leading-relaxed mt-1 font-sans">
                      {proj.description}
                    </p>
                  </div>
                  {proj.tags && proj.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-auto pt-2 border-t border-[#f0ede4]">
                      {proj.tags.map((tag: string, tIdx: number) => (
                        <span
                          key={tIdx}
                          className="bg-[#f7f5f0] border border-[#e2dfd5] text-slate-600 px-2 py-0.5 rounded text-[7px] font-bold uppercase tracking-wider font-sans"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}


        {/* 2.3 Biography & Details Columns (HBR Whitespace layouts, larger headings) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mt-4">
          <div className="md:col-span-2 flex flex-col gap-10">

            {/* Bio / Personal Goal */}
            <div>
              <h2 className="text-2xl font-bold text-[#1a1a1a] font-['Lora',Georgia,serif] border-b border-[#e2dfd5] pb-2 mb-4">
                {t("public.mentee.personalGoal")}
              </h2>
              <p className="text-[11px] font-medium text-slate-600 leading-relaxed font-sans whitespace-pre-line">
                {profile.personalGoal || t("public.mentee.notRegistered")}
              </p>
            </div>

            {/* Career Goal */}
            <div>
              <h2 className="text-2xl font-bold text-[#1a1a1a] font-['Lora',Georgia,serif] border-b border-[#e2dfd5] pb-2 mb-4">
                {t("public.mentee.careerGoal")}
              </h2>
              <p className="text-[11px] font-medium text-slate-600 leading-relaxed font-sans whitespace-pre-line">
                {profile.careerGoal || t("public.mentee.notRegistered")}
              </p>
            </div>

          </div>

          {/* Right Column: Skills & Hobbies */}
          <div className="flex flex-col gap-10">
            <div>
              <h2 className="text-[10px] font-black uppercase tracking-widest text-slate-400 font-sans border-b border-[#e2dfd5] pb-2 mb-4">
                {t("public.mentee.skills")}
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
                  <span className="text-[9px] font-bold text-slate-400 font-sans">{t("public.mentee.noSkillsRegistered")}</span>
                )}
              </div>
            </div>

            <div>
              <h2 className="text-[10px] font-black uppercase tracking-widest text-slate-400 font-sans border-b border-[#e2dfd5] pb-2 mb-3">{t("public.mentee.hobbiesAndArts")}</h2>
              <p className="text-[10px] font-medium text-slate-600 leading-relaxed font-sans">
                {profile.hobbies || t("public.mentee.notSpecified")}
              </p>
            </div>
          </div>
        </div>

      </main>

      {/* 3. Footer */}
      <footer className="mt-auto py-6 border-t border-[#e2dfd5] text-center">
        <p className="text-[8px] text-slate-400 font-black uppercase tracking-widest font-sans">
          {t("public.mentee.allRightsReserved")}
        </p>
      </footer>
    </div>
  );
}
