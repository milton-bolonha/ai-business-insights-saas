"use client";

import React, { useState, useEffect } from "react";
import {
  Loader2, User, Crown, Shield, Award, Sparkles, CheckCircle2,
  ChevronRight, Calendar, Star, Grid, Briefcase
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/lib/hooks/useTranslation";

// Cloudinary image resizer/transformer utility
function getOptimizedCloudinaryUrl(url: string, width = 200, height = 200) {
  if (!url) return "";
  if (url.includes("cloudinary.com")) {
    return url.replace("/upload/", `/upload/c_fill,g_face,w_${width},h_${height},q_auto,f_auto/`);
  }
  return url;
}

export default function RankingPage() {
  const { t, locale, setLocale } = useTranslation();
  const [rankings, setRankings] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"mentores" | "mentorados" | "projetos">("mentores");

  // Stored featured project IDs
  const [featuredProjectIds, setFeaturedProjectIds] = useState<string[]>([]);

  useEffect(() => {
    const fetchRankings = async () => {
      try {
        setIsLoading(true);
        const res = await fetch("/api/mentoring/public-ranking");
        if (res.ok) {
          const data = await res.json();
          setRankings(data.rankings || []);
        }
      } catch (err) {
        console.error("Error loading rankings:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchRankings();

    // Load featured project IDs from local storage (read-only in public page)
    const stored = localStorage.getItem("ade_featured_projects");
    if (stored) {
      setFeaturedProjectIds(JSON.parse(stored));
    }
  }, []);

  const getDominantClass = (profile: any) => {
    const goalsString = `${profile.careerGoal || ""} ${profile.personalGoal || ""} ${profile.tagline || ""}`.toLowerCase();
    if (goalsString.includes("tech") || goalsString.includes("dev") || goalsString.includes("software") || goalsString.includes("tecnolog")) {
      return t("public.ranking.classes.techArchitect");
    }
    if (goalsString.includes("start") || goalsString.includes("fund") || goalsString.includes("ceo") || goalsString.includes("empreend") || goalsString.includes("negoci")) {
      return t("public.ranking.classes.businessStrategist");
    }
    if (goalsString.includes("foco") || goalsString.includes("prod") || goalsString.includes("fazer") || goalsString.includes("execut")) {
      return t("public.ranking.classes.highPerformer");
    }
    if (profile.skillsCount && profile.skillsCount > 5) {
      return t("public.ranking.classes.multidisciplinary");
    }
    return t("public.ranking.classes.evolvingOperator");
  };

  // Filter listings
  const filteredRankings = rankings.filter(p => {
    if (activeTab === "mentores") return p.role === "mentor";
    if (activeTab === "mentorados") return p.role === "mentee";
    return false;
  });

  // Extract all projects from all mentees
  const allProjects = rankings
    .filter(p => p.role === "mentee" && p.projects && p.projects.length > 0)
    .flatMap(p => p.projects.map((proj: any) => ({
      ...proj,
      authorName: p.name,
      authorId: p.userId,
      authorUsername: p.username,
      authorGenderTerm: p.genderTerm
    })));

  // Separate featured vs other projects
  const sortedProjects = [...allProjects].sort((a, b) => {
    const aFeat = featuredProjectIds.includes(a.id);
    const bFeat = featuredProjectIds.includes(b.id);
    if (aFeat && !bFeat) return -1;
    if (!aFeat && bFeat) return 1;
    return 0;
  });

  const currentSeasonName = locale === "pt" ? "Maio 2026" : "May 2026";

  return (
    <div className="min-h-screen bg-[#f7f5f0] text-[#1a1a1a] flex flex-col font-sans relative selection:bg-slate-900/10">
      {/* Inject Google Fonts */}
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,100..1000;1,9..40,100..1000&family=Lora:ital,wght@0,400..700;1,400..700&display=swap" rel="stylesheet" />

      {/* 1. Header Navigation Bar */}
      <nav className="bg-[#1a1a1a] text-white py-4 px-6 border-b border-slate-800 font-sans relative z-30">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-xs font-bold font-['Lora',Georgia,serif] tracking-wider flex items-center gap-2">
            <Shield className="w-4 h-4 text-indigo-400" />
            <span>I/O MENTORIA</span>
          </div>
          <div className="flex items-center gap-6">
            <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-[10px] font-black uppercase tracking-widest text-slate-300">
              <button onClick={() => setActiveTab("mentores")} className={cn("hover:text-white transition-colors cursor-pointer", activeTab === "mentores" && "text-white underline")}>{t("public.ranking.tabs.mentors")}</button>
              <button onClick={() => setActiveTab("mentorados")} className={cn("hover:text-white transition-colors cursor-pointer", activeTab === "mentorados" && "text-white underline")}>{t("public.ranking.tabs.mentees")}</button>
              <button onClick={() => setActiveTab("projetos")} className={cn("hover:text-white transition-colors cursor-pointer", activeTab === "projetos" && "text-white underline")}>{t("public.ranking.tabs.projects")}</button>
            </div>
            
            {/* Language Selector */}
            <div className="flex items-center gap-1 rounded-full border border-slate-700 bg-slate-800 p-1 text-[8px] font-semibold shadow-xs">
              <button
                onClick={() => setLocale("pt")}
                className={cn(
                  "px-2 py-0.5 rounded-full transition-all cursor-pointer font-bold text-[8px]",
                  locale === "pt"
                    ? "bg-slate-900 text-white shadow-sm"
                    : "text-slate-400 hover:text-white"
                )}
                title="Português"
              >
                PT
              </button>
              <button
                onClick={() => setLocale("en")}
                className={cn(
                  "px-2 py-0.5 rounded-full transition-all cursor-pointer font-bold text-[8px]",
                  locale === "en"
                    ? "bg-slate-900 text-white shadow-sm"
                    : "text-slate-400 hover:text-white"
                )}
                title="English"
              >
                EN
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* 2. Main Leaderboard Content */}
      <main className="max-w-4xl mx-auto w-full py-12 px-6 flex flex-col gap-6">

        {/* Title Block */}
        <div className="border-b border-[#e2dfd5] pb-6">
          <h1 className="text-4xl md:text-5xl font-bold font-['Lora',Georgia,serif] text-[#1a1a1a] tracking-tight">
            {t("public.ranking.title")}
          </h1>
          <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest flex items-center gap-1.5 mt-1 font-sans">
            <Calendar className="w-3.5 h-3.5 text-indigo-500" />
            <span>{t("public.ranking.activeSeason", { season: currentSeasonName })}</span>
          </p>
        </div>

        {/* Horizontal HBR Tab Selector */}
        <div className="flex flex-wrap gap-2 border-b border-[#e2dfd5] pb-2 text-xs sm:text-sm font-black uppercase tracking-wider font-sans">
          <button
            onClick={() => setActiveTab("mentores")}
            className={cn(
              "px-6 py-4 border-b-2 transition-all cursor-pointer",
              activeTab === "mentores"
                ? "border-[#1a1a1a] text-[#1a1a1a] font-black"
                : "border-transparent text-slate-400 hover:text-slate-700"
            )}
          >
            {t("public.ranking.tabs.mentors")}
          </button>
          <button
            onClick={() => setActiveTab("mentorados")}
            className={cn(
              "px-6 py-4 border-b-2 transition-all cursor-pointer",
              activeTab === "mentorados"
                ? "border-[#1a1a1a] text-[#1a1a1a] font-black"
                : "border-transparent text-slate-400 hover:text-slate-700"
            )}
          >
            {t("public.ranking.tabs.mentees")}
          </button>
          <button
            onClick={() => setActiveTab("projetos")}
            className={cn(
              "px-6 py-4 border-b-2 transition-all cursor-pointer",
              activeTab === "projetos"
                ? "border-[#1a1a1a] text-[#1a1a1a] font-black"
                : "border-transparent text-slate-400 hover:text-slate-700"
            )}
          >
            {t("public.ranking.tabs.projects")}
          </button>
        </div>

        {/* LOADING STATE */}
        {isLoading ? (
          <div className="bg-white border border-[#e2dfd5] p-12 rounded-xl text-center shadow-2xs flex flex-col items-center justify-center gap-3">
            <Loader2 className="w-6 h-6 text-slate-800 animate-spin" />
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">{t("public.ranking.loading")}</span>
          </div>
        ) : (
          <>
            {/* TABS 1 & 2: LEADERBOARD TABLE */}
            {activeTab !== "projetos" && (
              <div className="bg-white border border-[#e2dfd5] rounded-xl overflow-hidden shadow-2xs">
                {filteredRankings.length === 0 ? (
                  <div className="p-12 text-center text-slate-400 text-xs font-semibold font-sans">
                    {t("public.ranking.noProfiles")}
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse font-sans">
                      <thead>
                        <tr className="bg-slate-50 border-b border-[#e2dfd5] text-[10px] md:text-xs font-black uppercase tracking-widest text-slate-400">
                          <th className="py-5 px-6 text-center w-16">{t("public.ranking.headers.rank")}</th>
                          <th className="py-5 px-6">{t("public.ranking.headers.name")}</th>
                          <th className="py-5 px-6">{t("public.ranking.headers.class")}</th>
                          {activeTab === "mentores" && <th className="py-5 px-6 text-center w-28">{t("public.ranking.headers.mentees")}</th>}
                          {activeTab === "mentorados" && <th className="py-5 px-6 text-center w-40">{t("public.ranking.headers.projectsSessions")}</th>}
                          <th className="py-5 px-6 text-center w-24">{t("public.ranking.headers.level")}</th>
                          <th className="py-5 px-6 text-right w-32">{t("public.ranking.headers.exp")}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#f0ede4] text-xs sm:text-sm font-medium text-slate-700">
                        {filteredRankings.map((player, idx) => {
                          const rank = idx + 1;
                          const currentLevel = Math.floor(Math.sqrt(player.xp / 50)) + 1;
                          const isTop3 = rank <= 3;
                          const profileUrl = player.role === "mentor"
                            ? `/mentor/${player.username || player.userId}`
                            : `/${player.genderTerm || "mentorado"}/${player.username || player.userId}`;

                          return (
                            <tr key={player.userId} className="hover:bg-slate-50/50 transition-colors">
                              {/* Rank */}
                              <td className="py-5 px-6 text-center">
                                {isTop3 ? (
                                  <span className={cn(
                                    "inline-flex items-center justify-center w-6 h-6 rounded-full text-[10px] font-black font-sans shadow-2xs",
                                    rank === 1 && "bg-amber-100 text-amber-800 border border-amber-200",
                                    rank === 2 && "bg-slate-100 text-slate-800 border border-slate-200",
                                    rank === 3 && "bg-orange-100 text-orange-800 border border-orange-200"
                                  )}>
                                    {rank}
                                  </span>
                                ) : (
                                  <span className="text-slate-400 font-bold">{rank}</span>
                                )}
                              </td>

                              {/* Avatar & Name */}
                              <td className="py-5 px-6">
                                <a href={profileUrl} className="flex items-center gap-3 group/row">
                                  <div className="w-11 h-11 rounded-full border border-[#e2dfd5] overflow-hidden bg-slate-50 shrink-0 group-hover/row:border-indigo-400 transition-colors">
                                    {player.photoUrl ? (
                                      <img src={getOptimizedCloudinaryUrl(player.photoUrl, 200, 200)} alt={player.name} className="w-full h-full object-cover" />
                                    ) : (
                                      <div className="w-full h-full flex items-center justify-center bg-slate-100 text-slate-400 font-black">
                                        {player.name.charAt(0).toUpperCase()}
                                      </div>
                                    )}
                                  </div>
                                  <div>
                                    <h4 className="font-bold text-[#1a1a1a] font-['Lora',Georgia,serif] text-base group-hover/row:text-indigo-600 transition-colors group-hover/row:underline">
                                      {player.name}
                                    </h4>
                                    
                                    {player.role === "mentor" ? (
                                      <div className="flex items-center gap-2 mt-1">
                                        <span className="text-[9.5px] font-bold text-slate-400 uppercase tracking-widest">
                                          {player.tagline || (locale === 'pt' ? 'Mentor I/O' : 'I/O Mentor')}
                                        </span>
                                      </div>
                                    ) : (
                                      <div className="flex items-center gap-2 mt-1">
                                        <span className="text-[9.5px] font-bold text-slate-400 uppercase tracking-widest">
                                          {player.tagline || (locale === 'pt' ? 'Mentorado I/O' : 'I/O Mentee')}
                                        </span>
                                      </div>
                                    )}
                                  </div>
                                </a>
                              </td>

                              {/* Class */}
                              <td className="py-5 px-6 text-[10.5px] md:text-xs font-semibold text-slate-500 uppercase tracking-wider">
                                {getDominantClass(player)}
                              </td>

                              {/* Mentorados Column */}
                              {activeTab === "mentores" && (
                                <td className="py-5 px-6 text-center font-bold text-slate-700">
                                  {player.menteesCount || 0}
                                </td>
                              )}

                              {/* Projetos & Sessões Column */}
                              {activeTab === "mentorados" && (
                                <td className="py-5 px-6 text-center">
                                  <div className="flex items-center justify-center gap-3">
                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 border border-emerald-100/60 text-emerald-700 text-[10px] font-black uppercase tracking-wider cursor-help" title={`${player.completedProjectsCount || 0} ${locale === 'pt' ? 'Projetos' : 'Projects'}`}>
                                      📁 {player.completedProjectsCount || 0}
                                    </span>
                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-indigo-50 border border-indigo-100/60 text-indigo-700 text-[10px] font-black uppercase tracking-wider cursor-help" title={`${player.completedSessionsCount || 0} ${locale === 'pt' ? 'Sessões' : 'Sessions'}`}>
                                      📅 {player.completedSessionsCount || 0}
                                    </span>
                                  </div>
                                </td>
                              )}

                              {/* Level */}
                              <td className="py-5 px-6 text-center font-bold text-slate-700">
                                {currentLevel}
                              </td>

                              {/* XP */}
                              <td className="py-5 px-6 text-right font-bold text-[#1a1a1a]">
                                {player.xp.toLocaleString()} EXP
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* TAB 3: FEATURED PROJECTS (PURE PUBLIC SHOWCASE) */}
            {activeTab === "projetos" && (
              <div className="flex flex-col gap-6">
                {sortedProjects.length === 0 ? (
                  <div className="bg-white border border-[#e2dfd5] p-12 rounded-xl text-center text-slate-400 text-xs font-semibold font-sans">
                    {t("public.ranking.noProjects")}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                    {sortedProjects.map((proj) => {
                      const isFeatured = featuredProjectIds.includes(proj.id);
                      const authorProfileUrl = `/${proj.authorGenderTerm || "mentorado"}/${proj.authorUsername || proj.authorId}`;

                      return (
                        <div
                          key={proj.id}
                          className={cn(
                            "bg-white border rounded-xl p-5 flex flex-col gap-4 shadow-2xs hover:shadow-md transition-all duration-300 relative group",
                            isFeatured ? "border-emerald-600/30 ring-1 ring-emerald-600/10" : "border-[#e2dfd5]"
                          )}
                        >
                          {/* Featured badge indicator */}
                          {isFeatured && (
                            <div className="absolute top-4 left-4 bg-emerald-600 text-white text-[7.5px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full z-10 shadow-2xs flex items-center gap-1">
                              <Star className="w-3 h-3 text-white fill-white" />
                              <span>{t("public.ranking.featuredTag")}</span>
                            </div>
                          )}

                          {proj.imageUrl && (
                            <div className="w-full h-36 rounded-lg overflow-hidden bg-slate-50 border border-slate-100 relative">
                              <img src={getOptimizedCloudinaryUrl(proj.imageUrl, 400, 300)} alt={proj.title} className="w-full h-full object-cover" />
                            </div>
                          )}

                          <div className="flex flex-col gap-1">
                            <h4 className="text-xs font-bold text-[#1a1a1a] font-['Lora',Georgia,serif] leading-tight">
                              {proj.title}
                            </h4>
                            <p className="text-[10px] text-slate-500 font-medium leading-relaxed font-sans mt-0.5">
                              {proj.description}
                            </p>
                          </div>

                          {/* Author box */}
                          <div className="mt-auto pt-3 border-t border-[#f0ede4] flex items-center justify-between text-[8px] font-black uppercase tracking-widest font-sans">
                            <a
                              href={authorProfileUrl}
                              className="text-slate-400 hover:text-indigo-600 flex items-center gap-1 transition-colors"
                            >
                              <User className="w-3 h-3 text-indigo-500" />
                              <span>{t("public.ranking.projectAuthor", { author: proj.authorName })}</span>
                            </a>
                            <a
                              href={authorProfileUrl}
                              className="text-slate-400 hover:text-[#1a1a1a] flex items-center gap-0.5 transition-colors"
                            >
                              <span>{t("public.ranking.viewAuthor")}</span>
                              <ChevronRight className="w-3.5 h-3.5" />
                            </a>
                          </div>

                          {/* Project tags */}
                          {proj.tags && proj.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-2">
                              {proj.tags.map((tag: string, tIdx: number) => (
                                <span
                                  key={tIdx}
                                  className="bg-[#f7f5f0] border border-[#e2dfd5] text-slate-600 px-1.5 py-0.5 rounded-[4px] text-[7px] font-bold uppercase tracking-wider font-sans"
                                >
                                  {tag}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </>
        )}

      </main>

      {/* 3. Footer */}
      <footer className="mt-auto py-6 border-t border-[#e2dfd5] text-center">
        <p className="text-[8px] text-slate-400 font-black uppercase tracking-widest font-sans">
          {t("public.ranking.footer")}
        </p>
      </footer>
    </div>
  );
}
