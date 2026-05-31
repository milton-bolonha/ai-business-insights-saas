"use client";

import React, { useState, useEffect } from "react";
import { useTranslation } from "@/lib/hooks/useTranslation";
import { useWorkspaceStore } from "@/lib/stores/workspaceStore";
import { PostEditorPanel } from "./panels/PostEditorPanel";
import { PageEditorPanel } from "./panels/PageEditorPanel";
import { BlogSettingsPanel } from "./panels/BlogSettingsPanel";
import { 
  Sparkles, 
  Wand2, 
  Calendar, 
  Globe, 
  Plus, 
  Trash2, 
  ArrowUpRight, 
  Loader2, 
  Play, 
  FileText, 
  Link as LinkIcon, 
  ChevronDown,
  Layers
} from "lucide-react";

export function AiBlogBoard() {
  const { t } = useTranslation();
  const currentWorkspace = useWorkspaceStore((state) => state.currentWorkspace);
  const [posts, setPosts] = useState<any[]>([]);
  const [pages, setPages] = useState<any[]>([]);
  const [pipelines, setPipelines] = useState<any[]>([]);
  const [settings, setSettings] = useState<any>({});
  const [authors, setAuthors] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Sub-navigation state
  const [activeTab, setActiveTab] = useState<"overview" | "posts" | "pages" | "pipeline" | "settings" | "prompts">("overview");
  
  // Editor state
  const [editingPost, setEditingPost] = useState<any | null>(null);
  const [isCreatingPost, setIsCreatingPost] = useState(false);
  const [editingPage, setEditingPage] = useState<any | null>(null);
  const [isCreatingPage, setIsCreatingPage] = useState(false);

  // AI Suite States
  const [isAiDropdownOpen, setIsAiDropdownOpen] = useState(false);
  const [isInstantModalOpen, setIsInstantModalOpen] = useState(false);
  const [isGeneratingInstant, setIsGeneratingInstant] = useState(false);
  const [instantTopic, setInstantTopic] = useState("");
  const [instantTarget, setInstantTarget] = useState<"post" | "page">("post");
  const [instantKeywords, setInstantKeywords] = useState("");

  // Pipeline Creator States
  const [newPipelineName, setNewPipelineName] = useState("");
  const [newPipelineTarget, setNewPipelineTarget] = useState<"post" | "page">("post");
  const [newPipelineSourceType, setNewPipelineSourceType] = useState<"prompt" | "url" | "file">("prompt");
  const [newPipelineSourceValue, setNewPipelineSourceValue] = useState("");
  const [newPipelineFrequency, setNewPipelineFrequency] = useState<"once" | "daily" | "weekly">("weekly");
  const [newPipelineDay, setNewPipelineDay] = useState("3"); // Default Wednesday (3)
  const [newPipelineTime, setNewPipelineTime] = useState("09:00");
  const [isCreatingPipeline, setIsCreatingPipeline] = useState(false);

  const fetchBoardData = () => {
    if (!currentWorkspace?.id) return;
    
    setIsLoading(true);
    // Fetch posts, pages, settings, pipelines, and authors in parallel
    Promise.all([
      fetch(`/api/blog/posts?workspaceId=${currentWorkspace.id}`).then(res => res.json()),
      fetch(`/api/blog/pages?workspaceId=${currentWorkspace.id}`).then(res => res.json()),
      fetch(`/api/blog/settings?workspaceId=${currentWorkspace.id}`).then(res => res.json()),
      fetch(`/api/blog/pipelines?workspaceId=${currentWorkspace.id}`).then(res => res.json()),
      fetch(`/api/blog/authors?workspaceId=${currentWorkspace.id}`).then(res => res.json())
    ])
    .then(([postsData, pagesData, settingsData, pipelinesData, authorsData]) => {
      if (postsData.posts) setPosts(postsData.posts);
      if (Array.isArray(pagesData)) setPages(pagesData);
      if (settingsData) setSettings(settingsData);
      if (pipelinesData.pipelines) setPipelines(pipelinesData.pipelines);
      if (authorsData.authors) setAuthors(authorsData.authors);
      setIsLoading(false);
    })
    .catch(console.error);
  };

  useEffect(() => {
    fetchBoardData();
  }, [currentWorkspace?.id]);

  const handleInstantGenerate = async () => {
    if (!instantTopic.trim() || !currentWorkspace?.id) return alert("Por favor, digite um tópico!");
    setIsGeneratingInstant(true);
    try {
      // 1. Generate full title
      const titleRes = await fetch("/api/blog/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ field: "title", topic: instantTopic })
      });
      const titleData = await titleRes.json();
      const generatedTitle = titleData.result || instantTopic;

      // 2. Generate full content body
      const contentRes = await fetch("/api/blog/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ field: "content", title: generatedTitle, prompt: instantTopic })
      });
      const contentData = await contentRes.json();
      const generatedContent = contentData.result || "";

      // 3. Generate summary excerpt
      const excerptRes = await fetch("/api/blog/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ field: "excerpt", title: generatedTitle, content: generatedContent })
      });
      const excerptData = await excerptRes.json();
      const generatedExcerpt = excerptData.result || "";

      // 4. Generate visual featured image
      const imageRes = await fetch("/api/blog/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ field: "featuredImage", title: generatedTitle })
      });
      const imageData = await imageRes.json();
      const generatedImage = imageData.result || "";

      // 5. Save to MongoDB via our regular posts/pages endpoints
      const slug = generatedTitle.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)+/g, "");
      
      const payload = instantTarget === "post" ? {
        title: generatedTitle,
        slug,
        content: generatedContent,
        excerpt: generatedExcerpt,
        status: "published",
        isFeatured: false,
        tags: instantKeywords.split(",").map(k => k.trim()).filter(Boolean),
        featuredImage: generatedImage,
        seo: { ogImage: generatedImage }
      } : {
        title: generatedTitle,
        slug,
        content: generatedContent,
        description: generatedExcerpt,
        status: "published"
      };

      const saveUrl = instantTarget === "post" ? `/api/blog/posts?workspaceId=${currentWorkspace.id}` : `/api/blog/pages?workspaceId=${currentWorkspace.id}`;
      const saveRes = await fetch(saveUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const saveResult = await saveRes.json();
      
      if (saveResult.error) {
        alert(saveResult.error);
      } else {
        alert("Gerado com Sucesso!");
        setIsInstantModalOpen(false);
        setInstantTopic("");
        setInstantKeywords("");
        fetchBoardData(); // refresh list
      }
    } catch (e) {
      console.error(e);
      alert("Erro ao processar a geração automática.");
    } finally {
      setIsGeneratingInstant(false);
    }
  };

  const handleCreatePipeline = async () => {
    if (!newPipelineName.trim() || !newPipelineSourceValue.trim() || !currentWorkspace?.id) {
      return alert("Preencha todos os campos obrigatórios!");
    }
    setIsCreatingPipeline(true);
    try {
      const res = await fetch(`/api/blog/pipelines?workspaceId=${currentWorkspace.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newPipelineName,
          target: newPipelineTarget,
          sourceType: newPipelineSourceType,
          sourceValue: newPipelineSourceValue,
          frequency: newPipelineFrequency,
          scheduledDays: newPipelineFrequency === "weekly" ? [Number(newPipelineDay)] : [],
          scheduledTime: newPipelineTime
        })
      });

      if (res.ok) {
        alert("Pipeline de IA agendada com sucesso!");
        setNewPipelineName("");
        setNewPipelineSourceValue("");
        fetchBoardData(); // refresh
      } else {
        const err = await res.json();
        alert(err.error || "Erro ao agendar.");
      }
    } catch (e) {
      console.error(e);
      alert("Erro de conexão com o servidor.");
    } finally {
      setIsCreatingPipeline(false);
    }
  };

  const handleDeletePipeline = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir este agendamento?")) return;
    try {
      const res = await fetch(`/api/blog/pipelines?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        alert("Pipeline excluída.");
        fetchBoardData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  // If in Editor Mode, render the specific panel and hide the board navigation
  if (isCreatingPost || editingPost) {
    return (
      <div className="flex flex-col h-full bg-white text-gray-900 overflow-y-auto p-8 rounded-2xl shadow-sm border border-gray-100">
        <PostEditorPanel 
          post={editingPost} 
          settings={settings}
          allPosts={posts}
          onBack={() => { setIsCreatingPost(false); setEditingPost(null); fetchBoardData(); }} 
        />
      </div>
    );
  }

  if (isCreatingPage || editingPage) {
    return (
      <div className="flex flex-col h-full bg-white text-gray-900 overflow-y-auto p-8 rounded-2xl shadow-sm border border-gray-100">
        <PageEditorPanel 
          page={editingPage} 
          settings={settings}
          onBack={() => { setIsCreatingPage(false); setEditingPage(null); fetchBoardData(); }} 
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-white text-gray-900 overflow-y-auto rounded-2xl shadow-sm border border-gray-100 relative">
      
      {/* Top Header & Sub-Navigation */}
      <div className="border-b border-gray-200 px-8 pt-8 bg-gray-50/50 sticky top-0 z-10">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{t("admin.aiBlog.title")}</h1>
            <p className="text-gray-500 mt-1">{t("admin.aiBlog.subtitle")}</p>
          </div>
          <div className="flex gap-4 items-center">
            
            {/* AI Suite Dropdown Menu */}
            <div className="relative">
              <button 
                onClick={() => setIsAiDropdownOpen(!isAiDropdownOpen)}
                className="px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 font-semibold transition-colors text-sm shadow-sm flex items-center gap-1.5 cursor-pointer"
              >
                <Sparkles className="w-4 h-4" />
                {t("admin.aiBlog.aiSuite")}
                <ChevronDown className="w-3.5 h-3.5" />
              </button>
              {isAiDropdownOpen && (
                <div className="absolute right-0 mt-2 w-64 bg-white border border-gray-200 rounded-xl shadow-xl py-2 z-50 animate-in fade-in duration-200">
                  <button 
                    onClick={async () => {
                      setIsAiDropdownOpen(false);
                      try {
                        await fetch(`/api/blog/seed?workspaceId=${currentWorkspace?.id}`, { method: "POST" });
                        window.location.reload();
                      } catch (e) {
                        console.error(e);
                      }
                    }}
                    className="w-full text-left px-4 py-2.5 hover:bg-gray-50 text-sm font-medium text-gray-700 flex items-center gap-2 transition-colors cursor-pointer"
                  >
                    <Layers className="w-4 h-4 text-emerald-600" />
                    {t("admin.aiBlog.seedDev")}
                  </button>
                  <button 
                    onClick={() => { setIsAiDropdownOpen(false); setIsInstantModalOpen(true); }}
                    className="w-full text-left px-4 py-2.5 hover:bg-gray-50 text-sm font-medium text-gray-700 flex items-center gap-2 transition-colors cursor-pointer"
                  >
                    <Wand2 className="w-4 h-4 text-violet-600" />
                    {t("admin.aiBlog.generateInstant")}
                  </button>
                  <button 
                    onClick={() => { setIsAiDropdownOpen(false); setActiveTab("pipeline"); }}
                    className="w-full text-left px-4 py-2.5 hover:bg-gray-50 text-sm font-medium text-gray-700 flex items-center gap-2 transition-colors cursor-pointer"
                  >
                    <Calendar className="w-4 h-4 text-amber-600" />
                    {t("admin.aiBlog.configureScheduler")}
                  </button>
                </div>
              )}
            </div>

            <a 
              href={`/blog/${settings?.customBlogSlug || currentWorkspace?.id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-semibold transition-colors text-sm border border-gray-200 shadow-sm flex items-center gap-1.5"
            >
              <Globe className="w-4 h-4" />
              {t("admin.aiBlog.publicLink")}
            </a>
            {activeTab === "posts" && (
              <button 
                onClick={() => setIsCreatingPost(true)}
                className="px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 font-semibold transition-colors shadow-sm flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                {t("admin.aiBlog.newPost")}
              </button>
            )}
            {activeTab === "pages" && (
              <button 
                onClick={() => setIsCreatingPage(true)}
                className="px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 font-semibold transition-colors shadow-sm flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                {t("admin.aiBlog.newPage")}
              </button>
            )}
          </div>
        </div>

        <div className="flex gap-6">
          {[
            { id: "overview", label: t("admin.aiBlog.overview") },
            { id: "posts", label: t("admin.aiBlog.posts") },
            { id: "pages", label: t("admin.aiBlog.pages") },
            { id: "pipeline", label: t("admin.aiBlog.aiPipelines") },
            { id: "prompts", label: t("admin.aiBlog.promptsTab") },
            { id: "settings", label: t("admin.aiBlog.settings") },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`pb-3 text-sm font-medium border-b-2 transition-colors cursor-pointer ${
                activeTab === tab.id 
                  ? "border-violet-600 text-violet-700 font-bold" 
                  : "border-transparent text-gray-500 hover:text-gray-800"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="p-8">
        
         {/* OVERVIEW TAB */}
        {activeTab === "overview" && (
          <div className="animate-in fade-in duration-300">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
              {[
                { label: t("admin.aiBlog.published"), value: posts.filter(p => p.status === 'published').length.toString() },
                { label: t("admin.aiBlog.drafts"), value: posts.filter(p => p.status === 'draft').length.toString() },
                { label: t("admin.aiBlog.pages"), value: pages.length.toString() },
                { label: t("admin.aiBlog.topicalScore"), value: "84/100", color: "text-emerald-600" },
              ].map((stat, i) => (
                <div key={i} className="p-4 border border-gray-100 rounded-xl bg-gray-50/50">
                  <p className="text-sm text-gray-500 mb-1">{stat.label}</p>
                  <p className={`text-2xl font-semibold ${stat.color || "text-gray-900"}`}>{stat.value}</p>
                </div>
              ))}
            </div>
            
            <div className="p-12 border border-dashed border-gray-200 rounded-2xl flex flex-col items-center justify-center text-center bg-gray-50/30">
              <h3 className="text-lg font-semibold text-gray-800 mb-2">{t("admin.aiBlog.automatedOperations")}</h3>
              <p className="text-gray-500 max-w-md mb-6">{t("admin.aiBlog.automatedOperationsDesc")}</p>
              <button 
                onClick={() => setActiveTab("pipeline")}
                className="px-6 py-2.5 bg-violet-600 text-white rounded-lg hover:bg-violet-700 font-semibold transition-colors flex items-center gap-2 cursor-pointer shadow-sm text-sm"
              >
                <Calendar className="w-4 h-4" />
                {t("admin.aiBlog.configureScheduler")}
              </button>
            </div>
          </div>
        )}

        {/* POSTS TAB */}
        {activeTab === "posts" && (
          <div className="animate-in fade-in duration-300 bg-white border border-gray-100 rounded-xl overflow-hidden shadow-sm">
            <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
              <h2 className="font-bold text-gray-800">{t("admin.aiBlog.posts")}</h2>
              <input type="text" placeholder={t("admin.aiBlog.searchPosts")} className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm w-64 focus:outline-none focus:ring-1 focus:ring-violet-500 bg-white" />
            </div>
            
            {isLoading ? <div className="p-8 text-center text-gray-500">Loading...</div> : 
             posts.length === 0 ? <div className="p-8 text-center text-gray-500">{t("admin.aiBlog.noPosts")}</div> : (
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-50 text-gray-500 border-b border-gray-100">
                  <tr>
                    <th className="px-6 py-3 font-semibold">{t("admin.aiBlog.postTitle")}</th>
                    <th className="px-6 py-3 font-semibold">{t("admin.aiBlog.status")}</th>
                    <th className="px-6 py-3 font-semibold">SEO Score</th>
                    <th className="px-6 py-3 font-semibold">{t("admin.aiBlog.date")}</th>
                    <th className="px-6 py-3 font-semibold text-right pr-8">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {posts.map((post) => (
                    <tr key={post._id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-4 font-semibold text-gray-900" onClick={() => setEditingPost(post)}>
                        {post.title}
                        {post.isFeatured && <span className="ml-2 text-[10px] text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">Featured</span>}
                        <div className="text-xs text-gray-500 font-normal mt-0.5">{post.slug}</div>
                      </td>
                      <td className="px-6 py-4" onClick={() => setEditingPost(post)}>
                        <span className="px-2 py-1 rounded-full text-xs font-semibold capitalize bg-gray-100 text-gray-800">{post.status}</span>
                      </td>
                      <td className="px-6 py-4" onClick={() => setEditingPost(post)}>
                        <span className="text-xs font-semibold text-gray-600">{post.seo?.score || 0}/100</span>
                      </td>
                      <td className="px-6 py-4 text-gray-500" onClick={() => setEditingPost(post)}>
                        {new Date(post.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-right pr-8">
                        <div className="flex gap-2 justify-end">
                          <button
                            onClick={() => setEditingPost(post)}
                            className="px-3 py-1 bg-violet-50 text-violet-750 rounded-md hover:bg-violet-100 font-semibold transition-colors text-xs cursor-pointer"
                          >
                            Edit
                          </button>
                          <a 
                            href={`/blog/${settings?.customBlogSlug || currentWorkspace?.id}/${post.slug}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-3 py-1 bg-gray-50 text-gray-700 rounded-md hover:bg-gray-100 font-semibold transition-colors text-xs border border-gray-200 flex items-center gap-0.5"
                          >
                            Visit
                            <ArrowUpRight className="w-3 h-3" />
                          </a>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* PAGES TAB */}
        {activeTab === "pages" && (
          <div className="animate-in fade-in duration-300 bg-white border border-gray-100 rounded-xl overflow-hidden shadow-sm">
            <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
              <h2 className="font-bold text-gray-800">{t("admin.aiBlog.pages")}</h2>
            </div>
            
            {isLoading ? <div className="p-8 text-center text-gray-500">Loading...</div> : 
             pages.length === 0 ? <div className="p-8 text-center text-gray-500">{t("admin.aiBlog.noPages")}</div> : (
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-50 text-gray-500 border-b border-gray-100">
                  <tr>
                    <th className="px-6 py-3 font-semibold">Title</th>
                    <th className="px-6 py-3 font-semibold">Status</th>
                    <th className="px-6 py-3 font-semibold">Date</th>
                    <th className="px-6 py-3 font-semibold text-right pr-8">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {pages.map((page) => (
                    <tr key={page._id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-4 font-semibold text-gray-900" onClick={() => setEditingPage(page)}>
                        {page.title}
                        <div className="text-xs text-gray-500 font-normal mt-0.5">{page.slug}</div>
                      </td>
                      <td className="px-6 py-4" onClick={() => setEditingPage(page)}>
                        <span className="px-2 py-1 rounded-full text-xs font-semibold capitalize bg-gray-100 text-gray-800">{page.status}</span>
                      </td>
                      <td className="px-6 py-4 text-gray-500" onClick={() => setEditingPage(page)}>
                        {new Date(page.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-right pr-8">
                        <div className="flex gap-2 justify-end">
                          <button
                            onClick={() => setEditingPage(page)}
                            className="px-3 py-1 bg-violet-50 text-violet-750 rounded-md hover:bg-violet-100 font-semibold transition-colors text-xs cursor-pointer"
                          >
                            Edit
                          </button>
                          <a 
                            href={`/blog/${settings?.customBlogSlug || currentWorkspace?.id}/p/${page.slug}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-3 py-1 bg-gray-50 text-gray-700 rounded-md hover:bg-gray-100 font-semibold transition-colors text-xs border border-gray-200 flex items-center gap-0.5"
                          >
                            Visit
                            <ArrowUpRight className="w-3 h-3" />
                          </a>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* AI PIPELINE TAB */}
        {activeTab === "pipeline" && (
          <div className="animate-in fade-in duration-300 flex flex-col gap-8 max-w-4xl">
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex flex-col gap-4">
              <h3 className="text-lg font-bold flex items-center gap-2 text-violet-750">
                <Calendar className="w-5 h-5" />
                {t("admin.aiBlog.newPipelineHeader")}
              </h3>
              <p className="text-sm text-gray-500">{t("admin.aiBlog.newPipelineDesc")}</p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                <label className="flex flex-col gap-1 text-sm font-semibold text-gray-700">
                  {t("admin.aiBlog.pipelineName")}
                  <input 
                    type="text" 
                    value={newPipelineName}
                    onChange={e => setNewPipelineName(e.target.value)}
                    className="border border-gray-200 rounded-md p-2 bg-white text-sm focus:outline-none focus:ring-1 focus:ring-violet-500 mt-1 font-normal" 
                    placeholder="Ex: Auto Post de Tecnologia de Quarta-feira" 
                  />
                </label>
 
                <label className="flex flex-col gap-1 text-sm font-semibold text-gray-700">
                  {t("admin.aiBlog.pubTarget")}
                  <select 
                    value={newPipelineTarget}
                    onChange={e => setNewPipelineTarget(e.target.value as any)}
                    className="border border-gray-200 rounded-md p-2 bg-white text-sm focus:outline-none focus:ring-1 focus:ring-violet-500 mt-1 font-normal"
                  >
                    <option value="post">{t("admin.aiBlog.postType")}</option>
                    <option value="page">{t("admin.aiBlog.pageType")}</option>
                  </select>
                </label>
 
                <label className="flex flex-col gap-1 text-sm font-semibold text-gray-700">
                  {t("admin.aiBlog.contentSource")}
                  <select 
                    value={newPipelineSourceType}
                    onChange={e => setNewPipelineSourceType(e.target.value as any)}
                    className="border border-gray-200 rounded-md p-2 bg-white text-sm focus:outline-none focus:ring-1 focus:ring-violet-500 mt-1 font-normal"
                  >
                    <option value="prompt">{t("admin.aiBlog.contentSourcePrompt")}</option>
                    <option value="url">{t("admin.aiBlog.contentSourceUrl")}</option>
                    <option value="file">{t("admin.aiBlog.contentSourceFile")}</option>
                  </select>
                </label>
 
                <label className="flex flex-col gap-1 text-sm font-semibold text-gray-700">
                  {t("admin.aiBlog.genFrequency")}
                  <select 
                    value={newPipelineFrequency}
                    onChange={e => setNewPipelineFrequency(e.target.value as any)}
                    className="border border-gray-200 rounded-md p-2 bg-white text-sm focus:outline-none focus:ring-1 focus:ring-violet-500 mt-1 font-normal"
                  >
                    <option value="weekly">{t("admin.aiBlog.freqWeekly")}</option>
                    <option value="daily">{t("admin.aiBlog.freqDaily")}</option>
                    <option value="once">{t("admin.aiBlog.freqOnce")}</option>
                  </select>
                </label>
 
                {newPipelineFrequency === "weekly" && (
                  <label className="flex flex-col gap-1 text-sm font-semibold text-gray-700">
                    {t("admin.aiBlog.dayOfWeek")}
                    <select 
                      value={newPipelineDay}
                      onChange={e => setNewPipelineDay(e.target.value)}
                      className="border border-gray-200 rounded-md p-2 bg-white text-sm focus:outline-none focus:ring-1 focus:ring-violet-500 mt-1 font-normal"
                    >
                      <option value="1">{t("admin.aiBlog.mon")}</option>
                      <option value="2">{t("admin.aiBlog.tue")}</option>
                      <option value="3">{t("admin.aiBlog.wed")}</option>
                      <option value="4">{t("admin.aiBlog.thu")}</option>
                      <option value="5">{t("admin.aiBlog.fri")}</option>
                      <option value="6">{t("admin.aiBlog.sat")}</option>
                      <option value="0">{t("admin.aiBlog.sun")}</option>
                    </select>
                  </label>
                )}
 
                <label className="flex flex-col gap-1 text-sm font-semibold text-gray-700">
                  {t("admin.aiBlog.runTime")}
                  <input 
                    type="time" 
                    value={newPipelineTime}
                    onChange={e => setNewPipelineTime(e.target.value)}
                    className="border border-gray-200 rounded-md p-2 bg-white text-sm focus:outline-none focus:ring-1 focus:ring-violet-500 mt-1 font-normal" 
                  />
                </label>
              </div>

              <div className="flex flex-col gap-1 text-sm font-semibold text-gray-700 mt-2">
                {newPipelineSourceType === "prompt" && (
                  <label className="flex flex-col gap-1">
                    {t("admin.aiBlog.promptInstructions")}
                    <textarea 
                      value={newPipelineSourceValue}
                      onChange={e => setNewPipelineSourceValue(e.target.value)}
                      rows={3}
                      className="border border-gray-200 rounded-md p-2.5 bg-white text-sm focus:outline-none focus:ring-1 focus:ring-violet-500 mt-1 font-normal"
                      placeholder={t("admin.aiBlog.promptPlaceholder")}
                    />
                  </label>
                )}
                {newPipelineSourceType === "url" && (
                  <label className="flex flex-col gap-1">
                    {t("admin.aiBlog.urlReference")}
                    <input 
                      type="url" 
                      value={newPipelineSourceValue}
                      onChange={e => setNewPipelineSourceValue(e.target.value)}
                      className="border border-gray-200 rounded-md p-2 bg-white text-sm focus:outline-none focus:ring-1 focus:ring-violet-500 mt-1 font-normal"
                      placeholder={t("admin.aiBlog.urlPlaceholder")}
                    />
                  </label>
                )}
                {newPipelineSourceType === "file" && (
                  <div className="flex flex-col gap-2 mt-1">
                    <span className="text-xs font-semibold text-gray-600">{t("admin.aiBlog.fileUploadLabel")}</span>
                    <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 flex flex-col items-center justify-center bg-gray-50/50 hover:bg-gray-100 cursor-pointer transition-colors relative">
                      <FileText className="w-6 h-6 text-gray-400 mb-1" />
                      <span className="text-xs text-gray-500">{t("admin.aiBlog.fileUploadDesc")}</span>
                      <input 
                        type="file" 
                        accept=".txt,.pdf" 
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            setNewPipelineSourceValue(`[Upload: ${file.name}]`);
                          }
                        }}
                        className="absolute inset-0 opacity-0 cursor-pointer" 
                      />
                    </div>
                    {newPipelineSourceValue && (
                      <span className="text-xs text-emerald-650 font-semibold bg-emerald-50 border border-emerald-100 px-3 py-1.5 rounded-md inline-block mt-1">
                        {t("admin.aiBlog.fileLoaded")} {newPipelineSourceValue}
                      </span>
                    )}
                  </div>
                )}
              </div>

              <button
                type="button"
                onClick={handleCreatePipeline}
                disabled={isCreatingPipeline}
                className="w-full mt-4 bg-violet-600 hover:bg-violet-700 text-white font-semibold py-2.5 rounded-lg text-sm shadow-sm transition-colors cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-50"
              >
                {isCreatingPipeline ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                {t("admin.aiBlog.saveActiveScheduler")}
              </button>
            </div>

            {/* List Schedulers */}
            <div className="bg-white border border-gray-100 rounded-xl overflow-hidden shadow-sm mt-4">
              <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50">
                <h3 className="font-bold text-gray-800">{t("admin.aiBlog.activePipelines")}</h3>
              </div>
              
              {pipelines.length === 0 ? (
                <div className="p-8 text-center text-gray-400 text-sm">{t("admin.aiBlog.noActivePipelines")}</div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {pipelines.map((pipe) => (
                    <div key={pipe._id} className="p-6 flex justify-between items-start hover:bg-gray-50/30 transition-colors">
                      <div className="flex flex-col gap-1">
                        <span className="font-bold text-gray-900 text-base">{pipe.name}</span>
                        <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-gray-500 mt-1 font-semibold">
                          <span className="flex items-center gap-1 bg-violet-50 text-violet-750 px-2 py-0.5 rounded border border-violet-100 capitalize">
                            Target: {pipe.target}
                          </span>
                          <span className="flex items-center gap-1 bg-gray-100 text-gray-700 px-2 py-0.5 rounded border border-gray-200">
                            Executar: {pipe.frequency === "weekly" ? `Semanal` : `Diário`} às {pipe.scheduledTime}
                          </span>
                          <span className="flex items-center gap-1">
                            Fonte: {pipe.sourceType} ({pipe.sourceValue?.substring(0, 40)}...)
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={() => handleDeletePipeline(pipe._id)}
                        className="p-2 text-gray-400 hover:text-red-500 rounded hover:bg-red-50 transition-colors cursor-pointer"
                        title="Deletar Agendamento"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* PROMPTS TAB */}
        {activeTab === "prompts" && (
          <div className="animate-in fade-in duration-300 flex flex-col gap-8 max-w-4xl">
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex flex-col gap-4">
              <h3 className="text-lg font-bold flex items-center gap-2 text-violet-755">
                <Sparkles className="w-5 h-5 text-violet-600" />
                {t("admin.aiBlog.promptsTitle")}
              </h3>
              <p className="text-sm text-gray-500">{t("admin.aiBlog.promptsDesc")}</p>

              {/* Global Prompt */}
              <div className="flex flex-col gap-1.5 mt-4">
                <label className="text-sm font-semibold text-gray-700">{t("admin.aiBlog.globalPromptLabel")}</label>
                <textarea 
                  value={settings.prompts?.globalPrompt || ""}
                  onChange={e => setSettings((p: any) => ({
                    ...p,
                    prompts: {
                      ...p.prompts,
                      globalPrompt: e.target.value
                    }
                  }))}
                  rows={5}
                  className="border border-gray-200 rounded-lg p-3 bg-white text-sm focus:outline-none focus:ring-1 focus:ring-violet-500 mt-1 font-normal w-full"
                  placeholder={t("admin.aiBlog.globalPromptPlaceholder")}
                />
              </div>

              {/* Author-Specific Prompts Builder */}
              <div className="flex flex-col gap-4 border-t border-gray-150 pt-6 mt-4">
                <h4 className="font-bold text-gray-800 text-sm">{t("admin.aiBlog.authorPromptTitle")}</h4>
                <p className="text-xs text-gray-500">{t("admin.aiBlog.authorPromptDesc")}</p>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-start">
                  <div className="flex flex-col gap-1 md:col-span-1">
                    <label className="text-xs text-gray-500 font-semibold">{t("admin.aiBlog.selectAuthorLabel")}</label>
                    <select 
                      id="promptSelectedAuthor"
                      className="border border-gray-200 rounded-md p-2 text-sm focus:outline-none focus:ring-1 focus:ring-violet-500 bg-white"
                      onChange={(e) => {
                        const authorId = e.target.value;
                        const currentAuthorPrompt = settings.prompts?.authorPrompts?.[authorId] || "";
                        const area = document.getElementById("authorPromptText") as HTMLTextAreaElement;
                        if (area) area.value = currentAuthorPrompt;
                      }}
                    >
                      <option value="">{t("admin.aiBlog.selectAuthorPlaceholder")}</option>
                      {authors.map(a => <option key={a._id} value={a._id}>{a.name}</option>)}
                    </select>
                  </div>

                  <div className="md:col-span-2 flex flex-col gap-1.5 w-full">
                    <label className="text-xs text-gray-500 font-semibold">{t("admin.aiBlog.authorStyleLabel")}</label>
                    <textarea 
                      id="authorPromptText"
                      rows={4}
                      className="border border-gray-200 rounded-lg p-3 bg-white text-xs focus:outline-none focus:ring-1 focus:ring-violet-500 w-full"
                      placeholder={t("admin.aiBlog.authorStylePlaceholder")}
                      onChange={(e) => {
                        const authorId = (document.getElementById("promptSelectedAuthor") as HTMLSelectElement).value;
                        if (!authorId) return alert(t("admin.aiBlog.selectAuthorFirst"));
                        const currentAuthorPrompts = settings.prompts?.authorPrompts || {};
                        setSettings((p: any) => ({
                          ...p,
                          prompts: {
                            ...p.prompts,
                            authorPrompts: {
                              ...currentAuthorPrompts,
                              [authorId]: e.target.value
                            }
                          }
                        }));
                      }}
                    />
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={async () => {
                  setIsLoading(true);
                  try {
                    const res = await fetch(`/api/blog/settings?workspaceId=${currentWorkspace?.id}`, {
                      method: "PUT",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify(settings),
                    });
                    
                    const data = await res.json();
                    if (!res.ok) {
                      throw new Error(data.error || t("admin.aiBlog.savePromptsError"));
                    }
                    
                    setSettings(data || {});
                    alert(t("admin.aiBlog.savePromptsSuccess"));
                  } catch (e: any) {
                    console.error(e);
                    alert(e.message || t("admin.aiBlog.savePromptsError"));
                  } finally {
                    setIsLoading(false);
                  }
                }}
                className="w-full mt-6 bg-violet-600 hover:bg-violet-700 text-white font-semibold py-2.5 rounded-lg text-sm shadow-sm transition-colors cursor-pointer flex items-center justify-center gap-1.5"
              >
                {t("admin.aiBlog.savePromptsBtn")}
              </button>
            </div>
          </div>
        )}

        {/* SETTINGS TAB */}
        {activeTab === "settings" && (
          <div className="animate-in fade-in duration-300">
            <BlogSettingsPanel />
          </div>
        )}

      </div>

      {/* POPUP MODAL: Instant AI Generator */}
      {isInstantModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-gray-100 p-8 flex flex-col gap-6 animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center border-b border-gray-150 pb-4">
              <h3 className="text-xl font-bold flex items-center gap-2 text-violet-750">
                <Wand2 className="w-5 h-5" />
                {t("admin.aiBlog.createAiPub")}
              </h3>
              <button 
                onClick={() => setIsInstantModalOpen(false)}
                className="text-gray-400 hover:text-gray-700 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <div className="flex flex-col gap-4">
              <label className="flex flex-col gap-1 text-sm font-semibold text-gray-700">
                {t("admin.aiBlog.articleTopic")}
                <input 
                  type="text" 
                  value={instantTopic}
                  onChange={e => setInstantTopic(e.target.value)}
                  className="border border-gray-200 rounded-md p-2 bg-white text-sm focus:outline-none focus:ring-1 focus:ring-violet-500 mt-1 font-normal"
                  placeholder={t("admin.aiBlog.topicPlaceholder")}
                />
              </label>

              <label className="flex flex-col gap-1 text-sm font-semibold text-gray-700">
                {t("admin.aiBlog.targetDest")}
                <select 
                  value={instantTarget}
                  onChange={e => setInstantTarget(e.target.value as any)}
                  className="border border-gray-200 rounded-md p-2 bg-white text-sm focus:outline-none focus:ring-1 focus:ring-violet-500 mt-1 font-normal"
                >
                  <option value="post">{t("admin.aiBlog.postType")}</option>
                  <option value="page">{t("admin.aiBlog.pageType")}</option>
                </select>
              </label>

              <label className="flex flex-col gap-1 text-sm font-semibold text-gray-700">
                {t("admin.aiBlog.focusKeywords")}
                <input 
                  type="text" 
                  value={instantKeywords}
                  onChange={e => setInstantKeywords(e.target.value)}
                  className="border border-gray-200 rounded-md p-2 bg-white text-sm focus:outline-none focus:ring-1 focus:ring-violet-500 mt-1 font-normal"
                  placeholder={t("admin.aiBlog.keywordsPlaceholder")}
                />
              </label>
            </div>

            <button
              onClick={handleInstantGenerate}
              disabled={isGeneratingInstant}
              className="w-full bg-violet-600 hover:bg-violet-700 text-white font-semibold py-2.5 rounded-lg text-sm shadow-sm transition-colors cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-50 mt-2"
            >
              {isGeneratingInstant ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {t("admin.aiBlog.generatingAiPub")}
                </>
              ) : (
                <>
                  <Play className="w-4 h-4" />
                  {t("admin.aiBlog.generateAndPublish")}
                </>
              )}
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
