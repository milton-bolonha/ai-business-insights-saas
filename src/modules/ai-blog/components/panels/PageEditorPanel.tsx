"use client";

import React, { useState, useEffect } from "react";
import { useTranslation } from "@/lib/hooks/useTranslation";
import { useWorkspaceStore } from "@/lib/stores/workspaceStore";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { Sparkles, Loader2, ArrowLeft, List, ListOrdered, Quote, Code, CheckCircle2, AlertCircle, TrendingUp, Gauge } from "lucide-react";
import { SEOEngine } from "@/modules/ai-blog/engines/seo-engine";

export function PageEditorPanel({ page, settings, onBack }: { page?: any, settings?: any, onBack: () => void }) {
  const { t } = useTranslation();
  const currentWorkspace = useWorkspaceStore((state) => state.currentWorkspace);
  
  const [title, setTitle] = useState(page?.title || "");
  const [description, setDescription] = useState(page?.description || "");
  const [status, setStatus] = useState(page?.status || "draft");
  const [publishedAt, setPublishedAt] = useState(page?.publishedAt ? new Date(page.publishedAt).toISOString().slice(0, 16) : "");
  
  const [language, setLanguage] = useState(page?.language || "pt");
  const [isSaving, setIsSaving] = useState(false);
  const [customSlug, setCustomSlug] = useState(page?.slug || "");

  const editor = useEditor({
    extensions: [StarterKit],
    content: page?.content || "",
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class: "prose prose-sm sm:prose lg:prose-lg xl:prose-2xl mx-auto focus:outline-none min-h-[400px] p-4",
      },
    },
  });

  const [focusKeywords, setFocusKeywords] = useState("");
  const [seoReport, setSeoReport] = useState<any>(null);

  // Dynamic Real-time SEO Scoring
  useEffect(() => {
    const rawContent = editor?.getHTML() || "";
    const keywordsList = focusKeywords.split(",").map((s: string) => s.trim()).filter(Boolean);
    const report = SEOEngine.calculateSEOScore({
      content: rawContent,
      title,
      metaDescription: description,
      focusKeywords: keywordsList,
      updatedAt: page?.updatedAt
    });
    setSeoReport(report);
  }, [title, description, focusKeywords, editor?.getHTML(), page?.updatedAt]);

  // IA Generation States
  const [isGeneratingTitle, setIsGeneratingTitle] = useState(false);
  const [isGeneratingDesc, setIsGeneratingDesc] = useState(false);
  const [isGeneratingContent, setIsGeneratingContent] = useState(false);

  const handleSave = async () => {
    if (!title.trim() || !currentWorkspace?.id) return alert("Title is required");
    setIsSaving(true);
    
    const titleSlug = title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)+/g, "");
    const cleanSlug = (customSlug || titleSlug).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)+/g, "");
    
    const payload = {
      title,
      slug: cleanSlug,
      content: editor?.getHTML() || "",
      description,
      status,
      language,
      publishedAt: publishedAt ? new Date(publishedAt) : undefined,
      seo: {
        seoScore: seoReport?.score || 50
      }
    };

    try {
      const method = page ? "PUT" : "POST";
      const url = page ? `/api/blog/pages/${page._id}?workspaceId=${currentWorkspace.id}` : `/api/blog/pages?workspaceId=${currentWorkspace.id}`;
      
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      
      const data = await res.json();
      if (data.error) alert(data.error);
      else {
        alert(t("admin.aiBlog.success"));
        onBack();
      }
    } catch (e) {
      console.error(e);
      alert("Error saving page");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 bg-white text-gray-900">
      <div className="flex items-center gap-4 border-b border-gray-100 pb-4 w-full">
        <button onClick={onBack} className="text-gray-500 hover:text-gray-800 font-semibold flex items-center gap-1.5 text-sm transition-colors cursor-pointer">
          <ArrowLeft className="w-4 h-4" />
          {t("admin.aiBlog.backToPages")}
        </button>
        <h2 className="text-2xl font-bold">{page ? t("admin.aiBlog.editPage") : t("admin.aiBlog.createNewPage")}</h2>
        {page?.slug && (
          <a
            href={`/blog/${settings?.customBlogSlug || currentWorkspace?.id}/p/${page.slug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="ml-auto px-4 py-2 bg-gray-50 text-gray-700 rounded-lg hover:bg-gray-100 text-sm font-semibold border border-gray-200 shadow-sm transition-colors"
          >
            Visit Public Page
          </a>
        )}
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 flex flex-col gap-4">
          <div className="flex justify-between items-center gap-4 w-full relative">
            <input 
              type="text" 
              placeholder={t("admin.aiBlog.postTitle")} 
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="text-3xl font-bold border-none focus:ring-0 px-0 placeholder-gray-300 bg-transparent outline-none flex-1 focus:border-b focus:border-gray-200" 
            />
            <button
              type="button"
              disabled={isGeneratingTitle}
              onClick={async () => {
                const topic = prompt("Digite o tópico da página para a IA gerar o título:");
                if (!topic) return;
                setIsGeneratingTitle(true);
                try {
                  const res = await fetch("/api/blog/generate", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ field: "title", topic })
                  });
                  const data = await res.json();
                  if (data.result) setTitle(data.result);
                } catch(e) { console.error(e); }
                finally { setIsGeneratingTitle(false); }
              }}
              className="px-2.5 py-1.5 rounded-lg border border-gray-200 bg-white hover:border-violet-500 hover:text-violet-600 opacity-60 hover:opacity-100 transition-all flex items-center gap-1.5 text-xs font-semibold cursor-pointer disabled:opacity-30"
              title={t("admin.aiBlog.generateTitleAi")}
            >
              {isGeneratingTitle ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
              IA
            </button>
          </div>
          
          <div className="flex justify-between items-center gap-4 w-full mt-2 relative">
            <input 
              type="text" 
              placeholder={t("admin.aiBlog.pageDescription")} 
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="border border-gray-200 rounded-md p-2.5 w-full text-sm focus:outline-none focus:ring-1 focus:ring-violet-500 bg-white flex-1" 
            />
            <button
              type="button"
              disabled={isGeneratingDesc}
              onClick={async () => {
                if (!title) return alert("Escreva um título primeiro!");
                setIsGeneratingDesc(true);
                try {
                  const res = await fetch("/api/blog/generate", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ field: "excerpt", title, content: editor?.getHTML() || "" })
                  });
                  const data = await res.json();
                  if (data.result) setDescription(data.result);
                } catch(e) { console.error(e); }
                finally { setIsGeneratingDesc(false); }
              }}
              className="px-2.5 py-2 rounded-lg border border-gray-200 bg-white hover:border-violet-500 hover:text-violet-600 opacity-60 hover:opacity-100 transition-all flex items-center gap-1.5 text-xs font-semibold cursor-pointer disabled:opacity-30 shrink-0"
              title={t("admin.aiBlog.generateDescAi")}
            >
              {isGeneratingDesc ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
              IA Desc
            </button>
          </div>

          <div className="border border-gray-200 rounded-lg overflow-hidden bg-white mt-4 shadow-sm">
            <div className="flex gap-2 p-2 border-b border-gray-100 bg-gray-50 justify-between items-center">
              <div className="flex gap-1.5 flex-wrap items-center">
                <button type="button" onClick={() => editor?.chain().focus().toggleBold().run()} className={`p-1.5 rounded text-sm font-bold ${editor?.isActive("bold") ? "bg-gray-200 text-gray-900" : "text-gray-655 hover:bg-gray-200"} cursor-pointer`} title="Bold">B</button>
                <button type="button" onClick={() => editor?.chain().focus().toggleItalic().run()} className={`p-1.5 rounded text-sm italic ${editor?.isActive("italic") ? "bg-gray-200 text-gray-900" : "text-gray-655 hover:bg-gray-200"} cursor-pointer`} title="Italic">I</button>
                <div className="w-px h-5 bg-gray-300 mx-1" />
                <button type="button" onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()} className={`p-1.5 rounded text-xs font-bold ${editor?.isActive("heading", { level: 2 }) ? "bg-gray-200 text-gray-900" : "text-gray-655 hover:bg-gray-200"} cursor-pointer`}>H2</button>
                <button type="button" onClick={() => editor?.chain().focus().toggleHeading({ level: 3 }).run()} className={`p-1.5 rounded text-xs font-bold ${editor?.isActive("heading", { level: 3 }) ? "bg-gray-200 text-gray-900" : "text-gray-655 hover:bg-gray-200"} cursor-pointer`}>H3</button>
                <div className="w-px h-5 bg-gray-300 mx-1" />
                <button type="button" onClick={() => editor?.chain().focus().toggleBulletList().run()} className={`p-1.5 rounded ${editor?.isActive("bulletList") ? "bg-gray-200 text-gray-900" : "text-gray-655 hover:bg-gray-200"} cursor-pointer`} title="Bullet List"><List className="w-3.5 h-3.5" /></button>
                <button type="button" onClick={() => editor?.chain().focus().toggleOrderedList().run()} className={`p-1.5 rounded ${editor?.isActive("orderedList") ? "bg-gray-200 text-gray-900" : "text-gray-655 hover:bg-gray-200"} cursor-pointer`} title="Ordered List"><ListOrdered className="w-3.5 h-3.5" /></button>
                <button type="button" onClick={() => editor?.chain().focus().toggleBlockquote().run()} className={`p-1.5 rounded ${editor?.isActive("blockquote") ? "bg-gray-200 text-gray-900" : "text-gray-655 hover:bg-gray-200"} cursor-pointer`} title="Blockquote"><Quote className="w-3.5 h-3.5" /></button>
                <button type="button" onClick={() => editor?.chain().focus().toggleCodeBlock().run()} className={`p-1.5 rounded ${editor?.isActive("codeBlock") ? "bg-gray-200 text-gray-900" : "text-gray-655 hover:bg-gray-200"} cursor-pointer`} title="Code Block"><Code className="w-3.5 h-3.5" /></button>
              </div>
              <button 
                type="button"
                disabled={isGeneratingContent}
                onClick={async () => {
                  const promptText = prompt("Do que se trata esta página? Digite instruções para a IA:");
                  if (!promptText) return;
                  setIsGeneratingContent(true);
                  try {
                    const res = await fetch("/api/blog/generate", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ field: "content", title, prompt: promptText })
                    });
                    const data = await res.json();
                    if (data.result) {
                      editor?.commands.setContent(data.result);
                    }
                  } catch(e) { console.error(e); }
                  finally { setIsGeneratingContent(false); }
                }}
                className="px-2.5 py-1 rounded-md border border-violet-100 bg-violet-50 text-violet-700 hover:bg-violet-100 text-xs font-semibold flex items-center gap-1 cursor-pointer disabled:opacity-30 transition-colors"
              >
                {isGeneratingContent ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                {t("admin.aiBlog.writeWithAi")}
              </button>
            </div>
            <EditorContent editor={editor} />
          </div>
        </div>

        <div className="flex flex-col gap-6 bg-gray-50 p-6 rounded-xl border border-gray-100 h-fit shadow-sm">
          {/* Real-time Enterprise SEO Analyzer */}
          {seoReport && (
            <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm flex flex-col gap-4">
              <h3 className="font-bold text-xs text-gray-800 flex items-center gap-1.5 uppercase tracking-wider">
                <Gauge className="w-4 h-4 text-violet-650" />
                {t("admin.aiBlog.seoScore")}
              </h3>
              
              <div className="flex items-center gap-4">
                <div className="relative flex items-center justify-center shrink-0">
                  <svg className="w-16 h-16 transform -rotate-90">
                    <circle cx="32" cy="32" r="28" className="stroke-gray-100" strokeWidth="5" fill="transparent" />
                    <circle 
                      cx="32" 
                      cy="32" 
                      r="28" 
                      className={`transition-all duration-500 ${
                        seoReport.score >= 75 ? "stroke-emerald-500" :
                        seoReport.score >= 50 ? "stroke-amber-500" : "stroke-red-500"
                      }`} 
                      strokeWidth="5" 
                      fill="transparent" 
                      strokeDasharray={176} 
                      strokeDashoffset={176 - (176 * seoReport.score) / 100}
                      strokeLinecap="round"
                    />
                  </svg>
                  <span className="absolute text-base font-black text-gray-800">{seoReport.score}</span>
                </div>
                
                <div className="flex flex-col">
                  <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                    {t("admin.aiBlog.seoStatusGeral")}
                  </span>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className={`text-xs font-black px-2 py-0.5 rounded ${
                      seoReport.score >= 75 ? "bg-emerald-50 text-emerald-700" :
                      seoReport.score >= 50 ? "bg-amber-50 text-amber-700" : "bg-red-50 text-red-700"
                    }`}>
                      {seoReport.grade}
                    </span>
                    <span className="text-xs font-bold text-gray-700">
                      {t(`admin.aiBlog.seoStatus.${seoReport.status}`) || seoReport.status}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[9px] text-gray-400 font-black uppercase tracking-wider">
                  {t("admin.aiBlog.seoFocusKeyword")}
                </label>
                <input 
                  type="text" 
                  value={focusKeywords}
                  onChange={e => setFocusKeywords(e.target.value)}
                  placeholder="Ex: react seo" 
                  className="border border-gray-200 rounded-lg p-2 text-xs focus:outline-none focus:ring-1 focus:ring-violet-500 bg-white"
                />
                <div className="flex items-center justify-between text-[9px] text-gray-400 font-bold mt-1">
                  <span>
                    {t("admin.aiBlog.seoSearchIntent")}: <strong className="text-violet-650">{t(`admin.aiBlog.seoIntent.${seoReport.intent}`) || seoReport.intent}</strong>
                  </span>
                </div>
              </div>

              <div className="flex flex-col gap-2 border-t border-gray-100 pt-3 mt-1">
                {seoReport.positives.length > 0 && (
                  <div className="flex flex-col gap-1.5">
                    <span className="text-[9px] text-gray-400 font-black uppercase tracking-wider">
                      {t("admin.aiBlog.seoPositives")}
                    </span>
                    {seoReport.positives.map((p: string, idx: number) => (
                      <div key={idx} className="flex items-start gap-1.5 text-[11px] text-gray-600 font-medium">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                        <span>{p}</span>
                      </div>
                    ))}
                  </div>
                )}
                
                {seoReport.negatives.length > 0 && (
                  <div className="flex flex-col gap-1.5 mt-2">
                    <span className="text-[9px] text-gray-400 font-black uppercase tracking-wider">
                      {t("admin.aiBlog.seoNegatives")}
                    </span>
                    {seoReport.negatives.map((n: string, idx: number) => (
                      <div key={idx} className="flex items-start gap-1.5 text-[11px] text-gray-600 font-medium">
                        <AlertCircle className="w-3.5 h-3.5 text-red-500 shrink-0 mt-0.5" />
                        <span>{n}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          <div>
            <h3 className="font-semibold mb-2">{t("admin.aiBlog.publishing")}</h3>
            <div className="flex flex-col gap-2">
              <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer mb-2">
                <input type="checkbox" checked={status === "draft"} onChange={(e) => setStatus(e.target.checked ? "draft" : "published")} className="rounded text-violet-600 focus:ring-violet-500 w-4 h-4 bg-white" /> 
                {t("admin.aiBlog.draftMode")}
              </label>
              
              <div className="flex flex-col gap-1 mt-1">
                <label className="text-xs text-gray-500 font-semibold">{t("admin.aiBlog.scheduleDate")}</label>
                <input 
                  type="datetime-local" 
                  value={publishedAt}
                  onChange={(e) => {
                    setPublishedAt(e.target.value);
                    if (e.target.value && status === "draft") setStatus("scheduled");
                  }}
                  className="border border-gray-200 rounded-md p-2 w-full text-sm focus:outline-none focus:ring-1 focus:ring-violet-500 bg-white" 
                />
              </div>

              <div className="flex flex-col gap-1 mt-3">
                <label className="text-xs text-gray-500 font-semibold">URL Slug</label>
                <input 
                  type="text" 
                  value={customSlug} 
                  onChange={(e) => setCustomSlug(e.target.value)}
                  placeholder="e.g. sobre-nos"
                  className="border border-gray-200 rounded-md p-2 w-full text-sm focus:outline-none focus:ring-1 focus:ring-violet-500 bg-white"
                />
              </div>

              <div className="flex flex-col gap-1 mt-3">
                <label className="text-xs text-gray-500 font-semibold">Idioma / Language</label>
                <select 
                  value={language} 
                  onChange={(e) => setLanguage(e.target.value)}
                  className="border border-gray-200 rounded-md p-2 w-full text-sm focus:outline-none focus:ring-1 focus:ring-violet-500 bg-white"
                >
                  <option value="pt">Português (PT)</option>
                  <option value="en">English (EN)</option>
                </select>
              </div>
            </div>
            <button 
              onClick={handleSave}
              disabled={isSaving}
              className="w-full mt-4 bg-violet-600 text-white font-semibold py-2 rounded-lg hover:bg-violet-700 disabled:opacity-50 transition-colors text-sm cursor-pointer shadow-sm"
            >
              {isSaving ? "Saving..." : (status === "draft" ? t("admin.aiBlog.saveDraft") : t("admin.aiBlog.savePublish"))}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
