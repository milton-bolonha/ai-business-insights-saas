"use client";

import React, { useState, useEffect } from "react";
import { useTranslation } from "@/lib/hooks/useTranslation";
import { uploadToCloudinary } from "@/lib/services/cloudinary";
import { useWorkspaceStore } from "@/lib/stores/workspaceStore";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { Sparkles, Image as ImageIcon, Loader2, ArrowLeft, List, ListOrdered, Quote, Code, CheckCircle2, AlertCircle, TrendingUp, Gauge, Link } from "lucide-react";
import { SEOEngine } from "@/modules/ai-blog/engines/seo-engine";

export function PostEditorPanel({ post, settings, allPosts, onBack }: { post?: any, settings?: any, allPosts?: any[], onBack: () => void }) {
  const { t } = useTranslation();
  const currentWorkspace = useWorkspaceStore((state) => state.currentWorkspace);
  
  const [title, setTitle] = useState(post?.title || "");
  const [excerpt, setExcerpt] = useState(post?.excerpt || "");
  const [status, setStatus] = useState(post?.status || "draft");
  const [isFeatured, setIsFeatured] = useState(post?.isFeatured || false);
  const [publishedAt, setPublishedAt] = useState(post?.publishedAt ? new Date(post.publishedAt).toISOString().slice(0, 16) : "");
  
  const [categories, setCategories] = useState(post?.categories?.join(", ") || "");
  const [tags, setTags] = useState(post?.tags?.join(", ") || "");
  
  const [featuredImage, setFeaturedImage] = useState(post?.featuredImage || post?.seo?.ogImage || "");
  const [isUploading, setIsUploading] = useState(false);
  const [isUploadingInline, setIsUploadingInline] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [customSlug, setCustomSlug] = useState(post?.slug || "");
  const [translationOf, setTranslationOf] = useState(post?.translationOf || "");
  const [aiSuggestions, setAiSuggestions] = useState(post?.aiSuggestions || "");
  const [isGeneratingSuggestions, setIsGeneratingSuggestions] = useState(false);

  const editor = useEditor({
    extensions: [StarterKit],
    content: post?.content || "",
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class: "prose prose-sm sm:prose lg:prose-lg xl:prose-2xl mx-auto focus:outline-none min-h-[400px] p-4",
      },
    },
  });

  const [focusKeywords, setFocusKeywords] = useState(post?.tags?.[0] || "");
  const [seoReport, setSeoReport] = useState<any>(null);

  // Dynamic Real-time SEO Scoring
  useEffect(() => {
    const rawContent = editor?.getHTML() || "";
    const keywordsList = focusKeywords.split(",").map((s: string) => s.trim()).filter(Boolean);
    const report = SEOEngine.calculateSEOScore({
      content: rawContent,
      title,
      metaDescription: excerpt,
      focusKeywords: keywordsList,
      featuredImage,
      updatedAt: post?.updatedAt
    });
    setSeoReport(report);
  }, [title, excerpt, focusKeywords, editor?.getHTML(), featuredImage, post?.updatedAt]);

  // IA Generation States
  const [isGeneratingTitle, setIsGeneratingTitle] = useState(false);
  const [isGeneratingExcerpt, setIsGeneratingExcerpt] = useState(false);
  const [isGeneratingContent, setIsGeneratingContent] = useState(false);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);

  const [language, setLanguage] = useState(post?.language || "pt");
  const [authors, setAuthors] = useState<any[]>([]);
  const [selectedAuthor, setSelectedAuthor] = useState(post?.authorId || "");
  const [newAuthorName, setNewAuthorName] = useState("");
  const [isAddingAuthor, setIsAddingAuthor] = useState(false);

  // Filter related translations from allPosts
  const relatedTranslations = allPosts ? allPosts.filter(p => 
    p._id !== post?._id && (
      p.translationOf === post?._id || 
      (post?.translationOf && p._id === post.translationOf) ||
      (post?.translationOf && p.translationOf === post.translationOf)
    )
  ) : [];

  useEffect(() => {
    if (currentWorkspace?.id) {
      fetch(`/api/blog/authors?workspaceId=${currentWorkspace.id}`)
        .then(res => res.json())
        .then(data => {
          if (data.authors) {
            setAuthors(data.authors);
            if (!selectedAuthor && data.authors.length > 0) {
              setSelectedAuthor(data.authors[0]._id);
            }
          }
        })
        .catch(console.error);
    }
  }, [currentWorkspace?.id]);

  const handleAddAuthor = async () => {
    if (!newAuthorName.trim() || !currentWorkspace?.id) return;
    try {
      const res = await fetch(`/api/blog/authors?workspaceId=${currentWorkspace.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newAuthorName })
      });
      const data = await res.json();
      if (data.author) {
        setAuthors(prev => [...prev, data.author]);
        setSelectedAuthor(data.author._id);
        setIsAddingAuthor(false);
        setNewAuthorName("");
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !currentWorkspace?.id) return;
    setIsUploading(true);
    try {
      const url = await uploadToCloudinary(file, "blog/posts", currentWorkspace.id);
      setFeaturedImage(url);
    } catch (error) {
      console.error("Upload failed", error);
    } finally {
      setIsUploading(false);
    }
  };

  const handleInlineImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !currentWorkspace?.id) return;
    setIsUploadingInline(true);
    try {
      const url = await uploadToCloudinary(file, "blog/inline", currentWorkspace.id);
      editor?.chain().focus().insertContent(`<img src="${url}" alt="Image" style="max-width:100%; height:auto; border-radius:8px; display:block; margin:16px auto;" />`).run();
    } catch (error) {
      console.error("Inline upload failed", error);
      alert("Failed to upload inline image");
    } finally {
      setIsUploadingInline(false);
    }
  };

  const handleCreateTranslation = async (targetLang: string) => {
    if (!post?._id) return alert("Salve o post principal antes de adicionar uma tradução!");
    setIsSaving(true);
    try {
      const titleSlug = title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)+/g, "");
      const payload = {
        title: `${title} (Copy ${targetLang.toUpperCase()})`,
        slug: `${customSlug || titleSlug}-${targetLang}`,
        content: editor?.getHTML() || "",
        excerpt,
        status: "draft",
        isFeatured: false,
        authorId: selectedAuthor,
        language: targetLang,
        translationOf: post._id,
        categories: categories.split(",").map((s:string) => s.trim()).filter(Boolean),
        tags: tags.split(",").map((s:string) => s.trim()).filter(Boolean),
        featuredImage,
        seo: {
          ogImage: featuredImage,
          seoScore: 50
        }
      };

      const res = await fetch(`/api/blog/posts?workspaceId=${currentWorkspace.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.error) {
        alert(data.error);
      } else {
        alert("Tradução criada com sucesso! Você pode editá-la a partir do painel de posts.");
        onBack();
      }
    } catch(e) {
      console.error(e);
      alert("Erro ao criar tradução");
    } finally {
      setIsSaving(false);
    }
  };

  const handleSave = async () => {
    if (!title.trim() || !currentWorkspace?.id) return alert("Title is required");
    setIsSaving(true);
    
    const titleSlug = title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)+/g, "");
    const cleanSlug = (customSlug || titleSlug).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)+/g, "");
    
    const payload = {
      title,
      slug: cleanSlug,
      content: editor?.getHTML() || "",
      excerpt,
      status,
      isFeatured,
      publishedAt: publishedAt ? new Date(publishedAt) : undefined,
      authorId: selectedAuthor,
      language,
      translationOf: translationOf || undefined,
      aiSuggestions,
      categories: categories.split(",").map((s:string) => s.trim()).filter(Boolean),
      tags: tags.split(",").map((s:string) => s.trim()).filter(Boolean),
      seo: {
        ogImage: featuredImage,
        seoScore: seoReport?.score || 50
      },
      featuredImage
    };

    try {
      const method = post ? "PUT" : "POST";
      const url = post ? `/api/blog/posts/${post._id}?workspaceId=${currentWorkspace.id}` : `/api/blog/posts?workspaceId=${currentWorkspace.id}`;
      
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
      alert("Error saving post");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-4 border-b border-gray-100 pb-4 w-full">
        <button onClick={onBack} className="text-gray-500 hover:text-gray-800 font-semibold flex items-center gap-1.5 text-sm transition-colors cursor-pointer">
          <ArrowLeft className="w-4 h-4" />
          {t("admin.aiBlog.backToPosts")}
        </button>
        <h2 className="text-2xl font-bold">{post ? t("admin.aiBlog.editPost") : t("admin.aiBlog.createNewPost")}</h2>
        {post?.slug && (
          <a
            href={`/blog/${settings?.customBlogSlug || currentWorkspace?.id}/${post.slug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="ml-auto px-4 py-2 bg-gray-50 text-gray-700 rounded-lg hover:bg-gray-100 text-sm font-semibold border border-gray-200 shadow-sm transition-colors"
          >
            Visit Public Post
          </a>
        )}
      </div>

      {post?._id && (
        <div className="bg-violet-50/50 p-4 rounded-xl border border-violet-100 flex flex-wrap gap-4 items-center justify-between">
          <div className="flex flex-col">
            <span className="text-xs font-bold text-violet-850">UX de Traduções / Translations Hub</span>
            <span className="text-[10px] text-violet-600">Este post está no idioma: <strong className="uppercase">{language}</strong></span>
          </div>
          <div className="flex gap-2">
            {language === "pt" && !relatedTranslations.some(p => p.language === "en") && (
              <button
                type="button"
                onClick={() => handleCreateTranslation("en")}
                className="px-3 py-1.5 bg-violet-600 hover:bg-violet-750 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-sm transition-colors"
              >
                + Adicionar Versão em Inglês (EN)
              </button>
            )}
            {language === "en" && !relatedTranslations.some(p => p.language === "pt") && (
              <button
                type="button"
                onClick={() => handleCreateTranslation("pt")}
                className="px-3 py-1.5 bg-violet-600 hover:bg-violet-750 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-sm transition-colors"
              >
                + Adicionar Versão em Português (PT)
              </button>
            )}
            {relatedTranslations.map((rel: any) => (
              <span
                key={rel._id}
                className="px-3 py-1.5 bg-white border border-violet-200 text-violet-750 rounded-lg text-xs font-bold flex items-center gap-1.5"
              >
                ✓ Versão {rel.language.toUpperCase()} Criada (ID: {rel.slug})
              </span>
            ))}
          </div>
        </div>
      )}
      
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
                const topic = prompt("Digite o tema/tópico para a IA gerar o título:");
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
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end mt-2">
            <div className="flex flex-col gap-1">
              <label className="text-xs text-gray-500 font-semibold">{t("admin.aiBlog.author")}</label>
              <div className="flex gap-2">
                <select 
                  value={selectedAuthor} 
                  onChange={(e) => setSelectedAuthor(e.target.value)}
                  className="border border-gray-200 rounded-md p-2 flex-1 text-sm focus:outline-none focus:ring-1 focus:ring-violet-500 bg-white"
                >
                  <option value="">{t("admin.aiBlog.authorPlaceholder")}</option>
                  {authors.map(a => <option key={a._id} value={a._id}>{a.name}</option>)}
                </select>
                <button 
                  onClick={() => setIsAddingAuthor(!isAddingAuthor)}
                  className="px-3 bg-gray-150 rounded hover:bg-gray-200 text-sm font-semibold cursor-pointer transition-colors"
                >
                  +
                </button>
              </div>
              {isAddingAuthor && (
                <div className="flex gap-2 mt-2">
                  <input type="text" placeholder="New Author Name" value={newAuthorName} onChange={e => setNewAuthorName(e.target.value)} className="border p-1 text-sm rounded flex-1 focus:outline-none focus:ring-1 focus:ring-violet-500 bg-white" />
                  <button onClick={handleAddAuthor} className="bg-violet-600 text-white px-2.5 py-1 text-xs font-semibold rounded cursor-pointer hover:bg-violet-700">Add</button>
                </div>
              )}
            </div>
            
            <div className="flex flex-col gap-1">
              <label className="text-xs text-gray-500 font-semibold">{t("admin.aiBlog.scheduleDate")}</label>
              <input 
                type="datetime-local" 
                value={publishedAt}
                onChange={(e) => {
                  setPublishedAt(e.target.value);
                  if (e.target.value && status === "draft") setStatus("scheduled");
                }}
                className="border border-gray-200 rounded-md p-2 text-sm focus:outline-none focus:ring-1 focus:ring-violet-500 bg-white w-full" 
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs text-gray-500 font-semibold">Idioma / Language</label>
              <select 
                value={language} 
                onChange={(e) => setLanguage(e.target.value)}
                className="border border-gray-200 rounded-md p-2 text-sm focus:outline-none focus:ring-1 focus:ring-violet-500 bg-white w-full"
              >
                <option value="pt">Português (PT)</option>
                <option value="en">English (EN)</option>
              </select>
            </div>
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
                <div className="w-px h-5 bg-gray-300 mx-1" />
                <label className="p-1.5 rounded text-gray-655 hover:bg-gray-200 hover:text-gray-900 cursor-pointer flex items-center justify-center" title="Inserir Imagem do Cloudinary">
                  {isUploadingInline ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ImageIcon className="w-3.5 h-3.5" />}
                  <input type="file" accept="image/*" onChange={handleInlineImageUpload} disabled={isUploadingInline} className="hidden" />
                </label>
              </div>
              <button 
                type="button"
                disabled={isGeneratingContent}
                onClick={async () => {
                  const promptText = prompt("Do que se trata esta postagem? Digite os tópicos da geração por IA:");
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

          {/* Deep AI Copy Auditor Box */}
          <div className="bg-violet-50/20 border border-violet-100 rounded-xl p-6 mt-6 shadow-sm flex flex-col gap-4">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="font-bold text-sm text-violet-850 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-violet-650" />
                  Auditar Artigo com IA (AI Critique)
                </h3>
                <p className="text-xs text-violet-600">A IA irá avaliar o título, conteúdo e SEO de forma profunda e gerar um laudo completo.</p>
              </div>
              <button
                type="button"
                disabled={isGeneratingSuggestions}
                onClick={async () => {
                  if (!title || !editor?.getHTML()) {
                    return alert("Preencha o título e o conteúdo antes de pedir a auditoria da IA!");
                  }
                  setIsGeneratingSuggestions(true);
                  try {
                    const res = await fetch("/api/blog/generate", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({
                        field: "aiSuggestions",
                        title,
                        content: editor.getHTML()
                      })
                    });
                    const data = await res.json();
                    if (data.result) {
                      setAiSuggestions(data.result);
                    }
                  } catch (e) {
                    console.error(e);
                  } finally {
                    setIsGeneratingSuggestions(false);
                  }
                }}
                className="px-3.5 py-2 bg-violet-600 hover:bg-violet-750 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-sm disabled:opacity-50 transition-colors"
              >
                {isGeneratingSuggestions ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                Auditar Artigo
              </button>
            </div>

            {aiSuggestions && (
              <div className="bg-white border border-gray-200 rounded-lg p-4 text-xs text-gray-700 max-h-64 overflow-y-auto">
                <div className="whitespace-pre-line font-medium leading-relaxed">
                  {aiSuggestions}
                </div>
              </div>
            )}
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
              <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                <input type="checkbox" checked={status === "draft"} onChange={(e) => setStatus(e.target.checked ? "draft" : "published")} className="rounded text-violet-600 focus:ring-violet-500 w-4 h-4" /> 
                {t("admin.aiBlog.draftMode")}
              </label>
              <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                <input type="checkbox" checked={isFeatured} onChange={(e) => setIsFeatured(e.target.checked)} className="rounded text-violet-600 focus:ring-violet-500 w-4 h-4" /> 
                {t("admin.aiBlog.featuredPost")}
              </label>
            </div>
            <button 
              onClick={handleSave}
              disabled={isSaving}
              className="w-full mt-4 bg-violet-600 text-white font-semibold py-2 rounded-lg hover:bg-violet-700 disabled:opacity-50 transition-colors text-sm cursor-pointer shadow-sm"
            >
              {isSaving ? "Saving..." : (status === "draft" ? t("admin.aiBlog.saveDraft") : t("admin.aiBlog.savePublish"))}
            </button>
          </div>

          <div>
            <div className="flex justify-between items-center mb-2">
              <h3 className="font-semibold text-sm text-gray-800">{t("admin.aiBlog.metadata")}</h3>
              <button
                type="button"
                disabled={isGeneratingExcerpt}
                onClick={async () => {
                  if (!title) return alert("Escreva um título primeiro para orientar o resumo!");
                  setIsGeneratingExcerpt(true);
                  try {
                    const res = await fetch("/api/blog/generate", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ field: "excerpt", title, content: editor?.getHTML() || "" })
                    });
                    const data = await res.json();
                    if (data.result) setExcerpt(data.result);
                  } catch(e) { console.error(e); }
                  finally { setIsGeneratingExcerpt(false); }
                }}
                className="px-2 py-0.5 rounded border border-gray-250 bg-white hover:border-violet-500 hover:text-violet-600 opacity-60 hover:opacity-100 transition-all flex items-center gap-1 text-[10px] font-bold cursor-pointer disabled:opacity-30"
              >
                {isGeneratingExcerpt ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                {t("admin.aiBlog.summarizeAi")}
              </button>
            </div>
            <textarea 
              placeholder={t("admin.aiBlog.excerpt")}
              value={excerpt}
              onChange={e => setExcerpt(e.target.value)}
              className="w-full border border-gray-200 rounded-md p-2.5 mb-2.5 resize-none h-20 text-sm focus:outline-none focus:ring-1 focus:ring-violet-500 bg-white" 
            />
            
            <div className="flex flex-col gap-1 mb-2">
              <label className="text-xs text-gray-500 font-semibold">URL Slug</label>
              <input 
                type="text" 
                value={customSlug} 
                onChange={e => setCustomSlug(e.target.value)}
                placeholder="Ex: meu-post-customizado"
                className="w-full border border-gray-200 rounded-md p-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-violet-500 bg-white"
              />
            </div>

            <input type="text" placeholder={t("admin.aiBlog.categories")} value={categories} onChange={e=>setCategories(e.target.value)} className="w-full border border-gray-200 rounded-md p-2.5 mb-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-violet-500 bg-white" />
            <input type="text" placeholder={t("admin.aiBlog.tags")} value={tags} onChange={e=>setTags(e.target.value)} className="w-full border border-gray-200 rounded-md p-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-violet-500 bg-white" />
          </div>

          <div>
            <div className="flex justify-between items-center mb-2">
              <h3 className="font-semibold text-sm text-gray-800">{t("admin.aiBlog.featuredImage")}</h3>
              <button
                type="button"
                disabled={isGeneratingImage}
                onClick={async () => {
                  if (!title) return alert("Escreva um título primeiro para orientar a geração de imagem!");
                  setIsGeneratingImage(true);
                  try {
                    const res = await fetch("/api/blog/generate", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ field: "featuredImage", title })
                    });
                    const data = await res.json();
                    if (data.result) setFeaturedImage(data.result);
                  } catch(e) { console.error(e); }
                  finally { setIsGeneratingImage(false); }
                }}
                className="px-2 py-0.5 rounded border border-gray-250 bg-white hover:border-violet-500 hover:text-violet-600 opacity-60 hover:opacity-100 transition-all flex items-center gap-1 text-[10px] font-bold cursor-pointer disabled:opacity-30"
              >
                {isGeneratingImage ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ImageIcon className="w-3.5 h-3.5" />}
                {t("admin.aiBlog.generateImageAi")}
              </button>
            </div>
            {featuredImage ? (
              <div className="relative w-full h-32 rounded-xl overflow-hidden group border border-gray-200 shadow-sm">
                <img src={featuredImage} alt="Featured" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                  <label className="text-white cursor-pointer text-xs font-semibold flex items-center gap-1">
                    <ImageIcon className="w-3.5 h-3.5" />
                    {t("admin.aiBlog.changeImage")}
                    <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                  </label>
                </div>
              </div>
            ) : (
              <div className="border-2 border-dashed border-gray-300 rounded-xl h-32 flex flex-col items-center justify-center text-gray-500 hover:bg-gray-100 cursor-pointer relative transition-colors">
                {isUploading ? t("admin.aiBlog.uploading") : t("admin.aiBlog.uploadImage")}
                <input type="file" accept="image/*" onChange={handleImageUpload} disabled={isUploading} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed" />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
