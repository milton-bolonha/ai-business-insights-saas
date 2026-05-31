"use client";

import React, { useState, useEffect } from "react";
import { useTranslation } from "@/lib/hooks/useTranslation";
import { useWorkspaceStore } from "@/lib/stores/workspaceStore";
import { uploadToCloudinary } from "@/lib/services/cloudinary";
import { Plus, Trash2, Globe, Link, ArrowUpRight, Loader2, Layers } from "lucide-react";

export function BlogSettingsPanel() {
  const { t } = useTranslation();
  const currentWorkspace = useWorkspaceStore((state) => state.currentWorkspace);
  const [activeTab, setActiveTab] = useState("business");
  const [settings, setSettings] = useState<any>({});
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  // Categories list management states
  const [categoriesList, setCategoriesList] = useState<any[]>([]);
  const [isLoadingCategories, setIsLoadingCategories] = useState(false);
  const [newCatName, setNewCatName] = useState("");
  const [newCatSlug, setNewCatSlug] = useState("");
  const [newCatDesc, setNewCatDesc] = useState("");
  const [newCatNameEn, setNewCatNameEn] = useState("");
  const [newCatDescEn, setNewCatDescEn] = useState("");

  const fetchCategories = () => {
    if (!currentWorkspace?.id) return;
    setIsLoadingCategories(true);
    fetch(`/api/blog/categories?workspaceId=${currentWorkspace.id}`)
      .then(res => res.json())
      .then(data => {
        if (data.categories) setCategoriesList(data.categories);
      })
      .catch(console.error)
      .finally(() => setIsLoadingCategories(false));
  };

  useEffect(() => {
    if (currentWorkspace?.id) {
      fetch(`/api/blog/settings?workspaceId=${currentWorkspace.id}`)
        .then(res => res.json())
        .then(data => setSettings(data || {}))
        .catch(console.error);
    }
  }, [currentWorkspace?.id]);

  useEffect(() => {
    if (activeTab === "categories") {
      fetchCategories();
    }
  }, [activeTab, currentWorkspace?.id]);

  const tabs = [
    { id: "business", label: t("admin.aiBlog.businessSettings") },
    { id: "site", label: t("admin.aiBlog.siteConfig") },
    { id: "theme", label: t("admin.aiBlog.themeColors") },
    { id: "logos", label: t("admin.aiBlog.logos") },
    { id: "integrations", label: t("admin.aiBlog.integrationsAndAds") },
    { id: "navigation", label: t("admin.aiBlog.navigationAndLinkTree") },
    { id: "categories", label: "Categorias & Traduções" },
  ];

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim() || !newCatSlug.trim() || !currentWorkspace?.id) {
      return alert("Nome e Slug são obrigatórios!");
    }
    try {
      const payload = {
        name: newCatName,
        slug: newCatSlug.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)+/g, ""),
        description: newCatDesc,
        translations: {
          en: {
            name: newCatNameEn || newCatName,
            description: newCatDescEn || newCatDesc
          }
        }
      };

      const res = await fetch(`/api/blog/categories?workspaceId=${currentWorkspace.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.error) {
        alert(data.error);
      } else {
        alert("Categoria adicionada com sucesso!");
        setNewCatName("");
        setNewCatSlug("");
        setNewCatDesc("");
        setNewCatNameEn("");
        setNewCatDescEn("");
        fetchCategories();
      }
    } catch(e) {
      console.error(e);
      alert("Erro ao adicionar categoria");
    }
  };

  const handleDeleteCategory = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir esta categoria?")) return;
    try {
      const res = await fetch(`/api/blog/categories/${id}?workspaceId=${currentWorkspace?.id}`, {
        method: "DELETE"
      });
      if (res.ok) {
        alert("Categoria excluída com sucesso!");
        fetchCategories();
      } else {
        const data = await res.json();
        alert(data.error || "Erro ao excluir categoria");
      }
    } catch(e) {
      console.error(e);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const res = await fetch(`/api/blog/settings?workspaceId=${currentWorkspace?.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });
      
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Error saving settings");
      }
      
      setSettings(data || {});
      alert(t("admin.aiBlog.success"));
    } catch (e: any) {
      console.error(e);
      alert(e.message || "Error saving settings");
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !currentWorkspace?.id) return;
    
    setIsUploading(true);
    try {
      const url = await uploadToCloudinary(file, "blog/logos", currentWorkspace.id);
      setSettings((prev: any) => ({
        ...prev,
        logos: { ...prev.logos, mainLogo: url }
      }));
    } catch (error) {
      console.error("Upload failed", error);
      alert("Failed to upload image");
    } finally {
      setIsUploading(false);
    }
  };

  const handleFaviconUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !currentWorkspace?.id) return;
    
    setIsUploading(true);
    try {
      const url = await uploadToCloudinary(file, "blog/logos", currentWorkspace.id);
      setSettings((prev: any) => ({
        ...prev,
        logos: { ...prev.logos, favicon: url }
      }));
    } catch (error) {
      console.error("Upload failed", error);
      alert("Failed to upload favicon");
    } finally {
      setIsUploading(false);
    }
  };

  const handleMarkLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !currentWorkspace?.id) return;
    
    setIsUploading(true);
    try {
      const url = await uploadToCloudinary(file, "blog/logos", currentWorkspace.id);
      setSettings((prev: any) => ({
        ...prev,
        logos: { ...prev.logos, markLogo: url }
      }));
    } catch (error) {
      console.error("Upload failed", error);
      alert("Failed to upload mark logo");
    } finally {
      setIsUploading(false);
    }
  };

  const handleCardLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !currentWorkspace?.id) return;
    
    setIsUploading(true);
    try {
      const url = await uploadToCloudinary(file, "blog/logos", currentWorkspace.id);
      setSettings((prev: any) => ({
        ...prev,
        logos: { ...prev.logos, cardLogo: url }
      }));
    } catch (error) {
      console.error("Upload failed", error);
      alert("Failed to upload social card image");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-white text-gray-900">
      <div className="flex items-center gap-4 mb-6">
        <h2 className="text-2xl font-bold">{t("admin.aiBlog.settingsTitle")}</h2>
        <button 
          onClick={handleSave}
          disabled={isSaving}
          className="ml-auto px-6 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 font-semibold disabled:opacity-50 transition-colors text-sm shadow-sm animate-in fade-in cursor-pointer"
        >
          {isSaving ? t("admin.aiBlog.saving") : t("admin.aiBlog.saveSettings")}
        </button>
      </div>

      <div className="flex gap-8">
        <div className="w-64 flex flex-col gap-2 shrink-0">
          {tabs.map(tab => (
            <button 
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`text-left px-4 py-2.5 rounded-lg font-medium transition-colors cursor-pointer ${
                activeTab === tab.id 
                  ? "bg-violet-50 text-violet-750 font-bold" 
                  : "text-gray-600 hover:bg-gray-50"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="flex-1 bg-gray-50/50 border border-gray-100 rounded-xl p-8 min-h-[500px]">
          
          {activeTab === "business" && (
            <div className="flex flex-col gap-6 max-w-2xl animate-in fade-in duration-250">
              <h3 className="text-lg font-semibold border-b border-gray-200 pb-2">{t("admin.aiBlog.businessSettings")}</h3>
              <div className="flex flex-col gap-4">
                <label className="flex flex-col gap-1 text-sm font-semibold text-gray-700">
                  {t("admin.aiBlog.brandName")}
                  <input type="text" 
                    value={settings.business?.brandName || ""}
                    onChange={e => setSettings((p:any) => ({...p, business: {...p.business, brandName: e.target.value}}))}
                    className="border border-gray-200 rounded-md p-2.5 font-normal mt-1 bg-white focus:outline-none focus:ring-1 focus:ring-violet-500" placeholder="e.g. Acme Corp" />
                </label>
                <label className="flex flex-col gap-1 text-sm font-semibold text-gray-700">
                  {t("admin.aiBlog.brandDescription")}
                  <textarea 
                    value={settings.business?.brandDescription || ""}
                    onChange={e => setSettings((p:any) => ({...p, business: {...p.business, brandDescription: e.target.value}}))}
                    className="border border-gray-200 rounded-md p-2.5 font-normal mt-1 bg-white focus:outline-none focus:ring-1 focus:ring-violet-500" rows={4}></textarea>
                </label>

                {/* Social Media Links */}
                <div className="border-t border-gray-200 pt-6 mt-4 flex flex-col gap-4">
                  <h4 className="font-bold text-gray-900 text-sm">Redes Sociais (Social Media Profiles)</h4>
                  <p className="text-xs text-gray-500">Adicione os links dos perfis da sua marca. Eles serão vinculados aos esquemas rich snippets de SEO.</p>
                  
                  <label className="flex flex-col gap-1 text-sm font-semibold text-gray-700">
                    Instagram URL
                    <input type="text" 
                      value={settings.socials?.instagram || ""}
                      onChange={e => setSettings((p:any) => ({...p, socials: {...p.socials, instagram: e.target.value}}))}
                      className="border border-gray-200 rounded-md p-2.5 font-normal mt-1 bg-white focus:outline-none focus:ring-1 focus:ring-violet-500" placeholder="https://instagram.com/seu-perfil" />
                  </label>
                  
                  <label className="flex flex-col gap-1 text-sm font-semibold text-gray-700 mt-2">
                    LinkedIn URL
                    <input type="text" 
                      value={settings.socials?.linkedin || ""}
                      onChange={e => setSettings((p:any) => ({...p, socials: {...p.socials, linkedin: e.target.value}}))}
                      className="border border-gray-200 rounded-md p-2.5 font-normal mt-1 bg-white focus:outline-none focus:ring-1 focus:ring-violet-500" placeholder="https://linkedin.com/company/sua-empresa" />
                  </label>

                  <label className="flex flex-col gap-1 text-sm font-semibold text-gray-700 mt-2">
                    Facebook URL
                    <input type="text" 
                      value={settings.socials?.facebook || ""}
                      onChange={e => setSettings((p:any) => ({...p, socials: {...p.socials, facebook: e.target.value}}))}
                      className="border border-gray-200 rounded-md p-2.5 font-normal mt-1 bg-white focus:outline-none focus:ring-1 focus:ring-violet-500" placeholder="https://facebook.com/sua-pagina" />
                  </label>

                  <label className="flex flex-col gap-1 text-sm font-semibold text-gray-700 mt-2">
                    Twitter/X URL
                    <input type="text" 
                      value={settings.socials?.twitter || ""}
                      onChange={e => setSettings((p:any) => ({...p, socials: {...p.socials, twitter: e.target.value}}))}
                      className="border border-gray-200 rounded-md p-2.5 font-normal mt-1 bg-white focus:outline-none focus:ring-1 focus:ring-violet-500" placeholder="https://x.com/seu-perfil" />
                  </label>
                </div>
              </div>
            </div>
          )}

          {activeTab === "site" && (
            <div className="flex flex-col gap-6 max-w-2xl animate-in fade-in duration-250">
              <h3 className="text-lg font-semibold border-b border-gray-200 pb-2">{t("admin.aiBlog.siteConfig")}</h3>
              <div className="flex flex-col gap-4">
                <label className="flex flex-col gap-1 text-sm font-semibold text-gray-700">
                  {t("admin.aiBlog.customBlogSlug")}
                  <input type="text" 
                    value={settings.customBlogSlug || ""}
                    onChange={e => setSettings((p:any) => ({...p, customBlogSlug: e.target.value}))}
                    className="border border-gray-200 rounded-md p-2.5 font-normal mt-1 bg-white focus:outline-none focus:ring-1 focus:ring-violet-500" placeholder="e.g. brasil-beta" />
                  <span className="text-xs text-gray-500 mt-1.5">
                    {t("admin.aiBlog.customBlogSlugDesc", { slug: settings.customBlogSlug || "brasil-beta" })}
                  </span>
                </label>

                <label className="flex flex-col gap-1 text-sm font-semibold text-gray-700 mt-4">
                  {t("admin.aiBlog.footerText")}
                  <input type="text" 
                    value={settings.site?.footerText || ""}
                    onChange={e => setSettings((p:any) => ({...p, site: {...p.site, footerText: e.target.value}}))}
                    className="border border-gray-200 rounded-md p-2.5 font-normal mt-1 bg-white focus:outline-none focus:ring-1 focus:ring-violet-500" placeholder="© 2026 Company" />
                </label>

                {/* Hero Header Customization */}
                <div className="border-t border-gray-200 pt-6 mt-4 flex flex-col gap-4">
                  <h4 className="font-bold text-gray-900 text-sm">{t("admin.aiBlog.publicHeroHeader")}</h4>
                  
                  <label className="flex items-center gap-2.5 text-sm text-gray-700 cursor-pointer">
                    <input type="checkbox" 
                      checked={settings.site?.showHero ?? true}
                      onChange={e => setSettings((p:any) => ({...p, site: {...p.site, showHero: e.target.checked}}))}
                      className="rounded text-violet-600 focus:ring-violet-500 w-4 h-4 bg-white"
                    />
                    {t("admin.aiBlog.showHeroSection")}
                  </label>

                  <label className="flex flex-col gap-1 text-sm font-semibold text-gray-700 mt-2">
                    {t("admin.aiBlog.heroTitle")}
                    <input type="text" 
                      value={settings.site?.heroTitle || ""}
                      onChange={e => setSettings((p:any) => ({...p, site: {...p.site, heroTitle: e.target.value}}))}
                      className="border border-gray-200 rounded-md p-2.5 font-normal mt-1 bg-white focus:outline-none focus:ring-1 focus:ring-violet-500" 
                      placeholder={t("admin.aiBlog.heroTitlePlaceholder")} 
                    />
                  </label>

                  <label className="flex flex-col gap-1 text-sm font-semibold text-gray-700 mt-2">
                    {t("admin.aiBlog.heroSubtitle")}
                    <textarea 
                      value={settings.site?.heroDescription || ""}
                      onChange={e => setSettings((p:any) => ({...p, site: {...p.site, heroDescription: e.target.value}}))}
                      className="border border-gray-200 rounded-md p-2.5 font-normal mt-1 bg-white focus:outline-none focus:ring-1 focus:ring-violet-500" 
                      rows={3}
                      placeholder={t("admin.aiBlog.heroSubtitlePlaceholder")} 
                    />
                  </label>
                </div>

                {/* Advanced Global Code & SEO Injection */}
                <div className="border-t border-gray-200 pt-6 mt-4 flex flex-col gap-4">
                  <h4 className="font-bold text-gray-900 text-sm">SEO Avançado & Códigos Personalizados</h4>
                  
                  <label className="flex flex-col gap-1 text-sm font-semibold text-gray-700">
                    Palavras-chave SEO Globais (Global SEO Keywords)
                    <input type="text" 
                      value={settings.site?.seoKeywords || ""}
                      onChange={e => setSettings((p:any) => ({...p, site: {...p.site, seoKeywords: e.target.value}}))}
                      className="border border-gray-200 rounded-md p-2.5 font-normal mt-1 bg-white focus:outline-none focus:ring-1 focus:ring-violet-500" placeholder="Ex: seo, marketing, tecnologia, ia" />
                    <span className="text-xs text-gray-500 mt-1">Palavras-chave separadas por vírgula para a página principal.</span>
                  </label>

                  <label className="flex flex-col gap-1 text-sm font-semibold text-gray-700 mt-2">
                    Código CSS Personalizado (Custom Global CSS)
                    <textarea 
                      value={settings.site?.customCSS || ""}
                      onChange={e => setSettings((p:any) => ({...p, site: {...p.site, customCSS: e.target.value}}))}
                      className="border border-gray-200 rounded-md p-2.5 font-mono text-xs mt-1 bg-white focus:outline-none focus:ring-1 focus:ring-violet-500" 
                      rows={6} 
                      placeholder="/* Ex: body { font-family: sans-serif; } */"
                    />
                    <span className="text-xs text-gray-500 mt-1">Insira suas regras CSS. Elas serão aplicadas globalmente em todas as páginas públicas do blog.</span>
                  </label>

                  <label className="flex flex-col gap-1 text-sm font-semibold text-gray-700 mt-2">
                    Scripts Customizados no Head (Custom Header Scripts)
                    <textarea 
                      value={settings.site?.customHeaderScripts || ""}
                      onChange={e => setSettings((p:any) => ({...p, site: {...p.site, customHeaderScripts: e.target.value}}))}
                      className="border border-gray-200 rounded-md p-2.5 font-mono text-xs mt-1 bg-white focus:outline-none focus:ring-1 focus:ring-violet-500" 
                      rows={6} 
                      placeholder="<!-- Ex: <script src='...'></script> -->"
                    />
                    <span className="text-xs text-gray-500 mt-1">Tags HTML/JS injetadas no cabeçalho das páginas públicas (ex: tags de verificação, web analytics, etc).</span>
                  </label>
                </div>
              </div>
            </div>
          )}

          {activeTab === "theme" && (
            <div className="flex flex-col gap-6 max-w-2xl animate-in fade-in duration-250">
              <h3 className="text-lg font-semibold border-b border-gray-200 pb-2">{t("admin.aiBlog.themeColors")}</h3>
              <div className="grid grid-cols-2 gap-8">
                <div className="flex flex-col gap-4">
                  <h4 className="font-semibold text-gray-900">{t("admin.aiBlog.colors")}</h4>
                  <label className="flex flex-col gap-1.5 text-sm text-gray-700">
                    {t("admin.aiBlog.brandColor")}
                    <div className="flex gap-2">
                      <input type="color" 
                        value={settings.theme?.colors?.mainBrandColor || "#8b5cf6"}
                        onChange={e => setSettings((p:any) => ({...p, theme: {...p.theme, colors: {...p.theme?.colors, mainBrandColor: e.target.value}}}))}
                        className="w-10 h-10 p-0 border-0 rounded-md cursor-pointer" />
                    </div>
                  </label>
                  <label className="flex flex-col gap-1.5 text-sm text-gray-700">
                    {t("admin.aiBlog.bgColor")}
                    <div className="flex gap-2">
                      <input type="color" 
                        value={settings.theme?.colors?.backgroundColor || "#ffffff"}
                        onChange={e => setSettings((p:any) => ({...p, theme: {...p.theme, colors: {...p.theme?.colors, backgroundColor: e.target.value}}}))}
                        className="w-10 h-10 p-0 border-0 rounded-md cursor-pointer" />
                    </div>
                  </label>
                  <h4 className="font-semibold text-gray-900 mt-4">{t("admin.aiBlog.layoutOptions")}</h4>
                  <label className="flex items-center gap-2.5 text-sm text-gray-700 cursor-pointer">
                    <input type="checkbox" 
                      checked={settings.theme?.layout?.leftColumn ?? true}
                      onChange={e => setSettings((p:any) => ({...p, theme: {...p.theme, layout: {...p.theme?.layout, leftColumn: e.target.checked}}}))}
                      className="rounded text-violet-600 focus:ring-violet-500 w-4 h-4"
                    />
                    {t("admin.aiBlog.enableLeftColumn")}
                  </label>
                  <label className="flex items-center gap-2.5 text-sm text-gray-700 cursor-pointer">
                    <input type="checkbox" 
                      checked={settings.theme?.layout?.rightColumn ?? true}
                      onChange={e => setSettings((p:any) => ({...p, theme: {...p.theme, layout: {...p.theme?.layout, rightColumn: e.target.checked}}}))}
                      className="rounded text-violet-600 focus:ring-violet-500 w-4 h-4"
                    />
                    {t("admin.aiBlog.enableRightColumn")}
                  </label>
                </div>
              </div>
            </div>
          )}

          {activeTab === "integrations" && (
            <div className="flex flex-col gap-6 max-w-2xl animate-in fade-in duration-250">
              <h3 className="text-lg font-semibold border-b border-gray-200 pb-2">{t("admin.aiBlog.integrationsMonetization")}</h3>
              <div className="flex flex-col gap-6">
                
                {/* Google AdSense */}
                <div className="flex flex-col gap-4">
                  <h4 className="font-bold text-gray-900 text-sm border-b border-gray-100 pb-1">Google AdSense</h4>
                  <label className="flex flex-col gap-1 text-sm font-semibold text-gray-700">
                    {t("admin.aiBlog.adsenseClientId")}
                    <input type="text" 
                      value={settings.integrations?.googleIntegration?.adsClientID || ""}
                      onChange={e => setSettings((p:any) => ({...p, integrations: {...p.integrations, googleIntegration: {...p.integrations?.googleIntegration, adsClientID: e.target.value}}}))}
                      className="border border-gray-200 rounded-md p-2.5 font-normal mt-1 bg-white focus:outline-none focus:ring-1 focus:ring-violet-500" placeholder="ca-pub-123456789" />
                  </label>
                  <label className="flex flex-col gap-1 text-sm font-semibold text-gray-700">
                    {t("admin.aiBlog.adsenseSlotId")}
                    <input type="text" 
                      value={settings.integrations?.googleIntegration?.adsSlot || ""}
                      onChange={e => setSettings((p:any) => ({...p, integrations: {...p.integrations, googleIntegration: {...p.integrations?.googleIntegration, adsSlot: e.target.value}}}))}
                      className="border border-gray-200 rounded-md p-2.5 font-normal mt-1 bg-white focus:outline-none focus:ring-1 focus:ring-violet-500" placeholder="1234567890" />
                  </label>
                </div>

                {/* Web Analytics & Tracking Pixels */}
                <div className="flex flex-col gap-4 border-t border-gray-200 pt-6">
                  <h4 className="font-bold text-gray-900 text-sm border-b border-gray-100 pb-1">Web Analytics & Tracking Pixels</h4>
                  
                  <label className="flex flex-col gap-1 text-sm font-semibold text-gray-700">
                    Google Analytics ID (G-XXXXXXX)
                    <input type="text" 
                      value={settings.integrations?.googleAnalyticsID || ""}
                      onChange={e => setSettings((p:any) => ({...p, integrations: {...p.integrations, googleAnalyticsID: e.target.value}}))}
                      className="border border-gray-200 rounded-md p-2.5 font-normal mt-1 bg-white focus:outline-none focus:ring-1 focus:ring-violet-500" placeholder="G-ABC123XYZ" />
                  </label>

                  <label className="flex flex-col gap-1 text-sm font-semibold text-gray-700 mt-2">
                    Meta/Facebook Pixel ID
                    <input type="text" 
                      value={settings.integrations?.metaPixelID || ""}
                      onChange={e => setSettings((p:any) => ({...p, integrations: {...p.integrations, metaPixelID: e.target.value}}))}
                      className="border border-gray-200 rounded-md p-2.5 font-normal mt-1 bg-white focus:outline-none focus:ring-1 focus:ring-violet-500" placeholder="123456789012345" />
                  </label>
                </div>
              </div>
            </div>
          )}

          {activeTab === "logos" && (
            <div className="flex flex-col gap-8 max-w-2xl animate-in fade-in duration-250">
              <h3 className="text-lg font-semibold border-b border-gray-200 pb-2">{t("admin.aiBlog.logos")}</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* 1. Main Logo */}
                <label className="flex flex-col gap-1 text-sm font-semibold text-gray-700">
                  {t("admin.aiBlog.mainLogo")}
                  {settings.logos?.mainLogo ? (
                    <div className="mb-4 mt-2 relative w-32 h-32 border border-gray-200 rounded-xl overflow-hidden shadow-sm bg-white">
                      <img src={settings.logos.mainLogo} alt="Logo" className="w-full h-full object-contain p-2" />
                      <button 
                        onClick={() => setSettings((p:any) => ({...p, logos: {...p.logos, mainLogo: ""}}))}
                        className="absolute top-1 right-1 bg-white rounded-full p-1 shadow-sm text-red-500 hover:bg-red-50 transition-colors"
                      >
                        ✕
                      </button>
                    </div>
                  ) : (
                    <div className="border-2 border-dashed border-gray-300 rounded-xl h-32 mt-2 flex flex-col items-center justify-center text-gray-500 hover:bg-gray-100 cursor-pointer relative transition-colors bg-white">
                      {isUploading ? t("admin.aiBlog.uploading") : t("admin.aiBlog.uploadLogo")}
                      <input 
                        type="file" 
                        accept="image/*"
                        onChange={handleLogoUpload}
                        disabled={isUploading}
                        className="absolute inset-0 opacity-0 cursor-pointer disabled:cursor-not-allowed" 
                      />
                    </div>
                  )}
                </label>

                {/* 2. Favicon */}
                <label className="flex flex-col gap-1 text-sm font-semibold text-gray-700">
                  Favicon do Blog (Browser Favicon)
                  {settings.logos?.favicon ? (
                    <div className="mb-4 mt-2 relative w-32 h-32 border border-gray-200 rounded-xl overflow-hidden shadow-sm bg-white">
                      <img src={settings.logos.favicon} alt="Favicon" className="w-full h-full object-contain p-2" />
                      <button 
                        onClick={() => setSettings((p:any) => ({...p, logos: {...p.logos, favicon: ""}}))}
                        className="absolute top-1 right-1 bg-white rounded-full p-1 shadow-sm text-red-500 hover:bg-red-50 transition-colors"
                      >
                        ✕
                      </button>
                    </div>
                  ) : (
                    <div className="border-2 border-dashed border-gray-300 rounded-xl h-32 mt-2 flex flex-col items-center justify-center text-gray-500 hover:bg-gray-100 cursor-pointer relative transition-colors bg-white">
                      {isUploading ? t("admin.aiBlog.uploading") : "Upload Favicon (.ico/.png)"}
                      <input 
                        type="file" 
                        accept="image/*"
                        onChange={handleFaviconUpload}
                        disabled={isUploading}
                        className="absolute inset-0 opacity-0 cursor-pointer disabled:cursor-not-allowed" 
                      />
                    </div>
                  )}
                </label>

                {/* 3. Mark Logo */}
                <label className="flex flex-col gap-1 text-sm font-semibold text-gray-700">
                  Logotipo Reduzido (Mark Logo / Icon)
                  {settings.logos?.markLogo ? (
                    <div className="mb-4 mt-2 relative w-32 h-32 border border-gray-200 rounded-xl overflow-hidden shadow-sm bg-white">
                      <img src={settings.logos.markLogo} alt="Mark Logo" className="w-full h-full object-contain p-2" />
                      <button 
                        onClick={() => setSettings((p:any) => ({...p, logos: {...p.logos, markLogo: ""}}))}
                        className="absolute top-1 right-1 bg-white rounded-full p-1 shadow-sm text-red-500 hover:bg-red-50 transition-colors"
                      >
                        ✕
                      </button>
                    </div>
                  ) : (
                    <div className="border-2 border-dashed border-gray-300 rounded-xl h-32 mt-2 flex flex-col items-center justify-center text-gray-500 hover:bg-gray-100 cursor-pointer relative transition-colors bg-white">
                      {isUploading ? t("admin.aiBlog.uploading") : "Upload Mark Logo"}
                      <input 
                        type="file" 
                        accept="image/*"
                        onChange={handleMarkLogoUpload}
                        disabled={isUploading}
                        className="absolute inset-0 opacity-0 cursor-pointer disabled:cursor-not-allowed" 
                      />
                    </div>
                  )}
                </label>

                {/* 4. OG Card Logo */}
                <label className="flex flex-col gap-1 text-sm font-semibold text-gray-700">
                  Imagem de Compartilhamento Social (OG Share Card)
                  {settings.logos?.cardLogo ? (
                    <div className="mb-4 mt-2 relative w-32 h-32 border border-gray-200 rounded-xl overflow-hidden shadow-sm bg-white">
                      <img src={settings.logos.cardLogo} alt="Social Card Logo" className="w-full h-full object-contain p-2" />
                      <button 
                        onClick={() => setSettings((p:any) => ({...p, logos: {...p.logos, cardLogo: ""}}))}
                        className="absolute top-1 right-1 bg-white rounded-full p-1 shadow-sm text-red-500 hover:bg-red-50 transition-colors"
                      >
                        ✕
                      </button>
                    </div>
                  ) : (
                    <div className="border-2 border-dashed border-gray-300 rounded-xl h-32 mt-2 flex flex-col items-center justify-center text-gray-500 hover:bg-gray-100 cursor-pointer relative transition-colors bg-white">
                      {isUploading ? t("admin.aiBlog.uploading") : "Upload Share Card (1200x630)"}
                      <input 
                        type="file" 
                        accept="image/*"
                        onChange={handleCardLogoUpload}
                        disabled={isUploading}
                        className="absolute inset-0 opacity-0 cursor-pointer disabled:cursor-not-allowed" 
                      />
                    </div>
                  )}
                </label>
              </div>
            </div>
          )}

          {activeTab === "navigation" && (
            <div className="flex flex-col gap-8 max-w-3xl animate-in fade-in duration-250">
              <div className="flex justify-between items-center border-b border-gray-200 pb-4">
                <div>
                  <h3 className="text-lg font-semibold">{t("admin.aiBlog.navigationAndLinkTree")}</h3>
                  <p className="text-sm text-gray-500 mt-1">{t("admin.aiBlog.navigationSubtitle")}</p>
                </div>
                <div className="flex gap-3">
                  <a 
                    href={`/blog/${settings.customBlogSlug || currentWorkspace?.id}`} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 text-gray-700 hover:bg-gray-100 text-xs font-semibold rounded-lg border border-gray-200 shadow-sm transition-colors"
                  >
                    <Globe className="w-3.5 h-3.5" />
                    {t("admin.aiBlog.viewBlog")}
                  </a>
                  <a 
                    href={`/blog/${settings.customBlogSlug || currentWorkspace?.id}/linktree`} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-violet-50 text-violet-700 hover:bg-violet-100 text-xs font-semibold rounded-lg border border-violet-200 shadow-sm transition-colors"
                  >
                    <Link className="w-3.5 h-3.5" />
                    {t("admin.aiBlog.viewLinktree")}
                  </a>
                </div>
              </div>

              {/* Show Categories Toggle */}
              <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-gray-900">{t("admin.aiBlog.showCategoriesInMenu")}</h4>
                  <p className="text-xs text-gray-500">{t("admin.aiBlog.showCategoriesInMenuDesc")}</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={settings.navigation?.showCategoriesInMenu || false} 
                    onChange={e => setSettings((p: any) => ({
                      ...p,
                      navigation: {
                        ...p.navigation,
                        showCategoriesInMenu: e.target.checked
                      }
                    }))}
                    className="sr-only peer" 
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-violet-600"></div>
                </label>
              </div>

              {/* 1. Main Menu Navigation Builder */}
              <div className="flex flex-col gap-4 bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                <h4 className="font-bold text-gray-900 flex items-center gap-2">
                  <Globe className="w-4 h-4 text-violet-600" />
                  {t("admin.aiBlog.mainMenuNavbar")}
                </h4>
                <p className="text-xs text-gray-500">{t("admin.aiBlog.mainMenuDesc")}</p>
                
                {/* Add Link Form */}
                <div className="flex flex-wrap gap-3 items-end bg-gray-50/50 p-4 rounded-lg border border-gray-100 mt-2">
                  <div className="flex-1 min-w-[200px]">
                    <label className="text-xs font-semibold text-gray-600 block mb-1">{t("admin.aiBlog.linkLabel")}</label>
                    <input 
                      type="text" 
                      id="newMenuLabel"
                      placeholder="Ex: Sobre Nós" 
                      className="w-full bg-white border border-gray-200 rounded-md p-2 text-sm focus:outline-none focus:ring-1 focus:ring-violet-500" 
                    />
                  </div>
                  <div className="flex-1 min-w-[200px]">
                    <label className="text-xs font-semibold text-gray-600 block mb-1">{t("admin.aiBlog.linkDestination")}</label>
                    <input 
                      type="text" 
                      id="newMenuHref"
                      placeholder={t("admin.aiBlog.linkDestinationPlaceholder")} 
                      className="w-full bg-white border border-gray-200 rounded-md p-2 text-sm focus:outline-none focus:ring-1 focus:ring-violet-500" 
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const labelInput = document.getElementById("newMenuLabel") as HTMLInputElement;
                      const hrefInput = document.getElementById("newMenuHref") as HTMLInputElement;
                      const label = labelInput?.value?.trim();
                      const href = hrefInput?.value?.trim();
                      if (!label || !href) return alert(t("admin.aiBlog.fillFieldsAlert"));

                      const currentMenu = settings.navigation?.mainMenu || [];
                      setSettings((p: any) => ({
                        ...p,
                        navigation: {
                          ...p.navigation,
                          mainMenu: [...currentMenu, { label, href }]
                        }
                      }));

                      labelInput.value = "";
                      hrefInput.value = "";
                    }}
                    className="px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-md text-sm font-semibold transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    {t("admin.aiBlog.add")}
                  </button>
                </div>

                {/* Main Menu Links List */}
                <div className="flex flex-col gap-2 mt-2">
                  {(settings.navigation?.mainMenu || []).length === 0 ? (
                    <div className="text-center text-xs text-gray-400 py-6 border border-dashed border-gray-200 rounded-lg bg-gray-50/20">
                      {t("admin.aiBlog.noLinksYet")}
                    </div>
                  ) : (
                    (settings.navigation?.mainMenu || []).map((item: any, idx: number) => (
                      <div key={idx} className="flex justify-between items-center p-3 border border-gray-250 rounded-lg hover:border-gray-300 transition-colors bg-gray-50/20">
                        <div className="flex flex-col">
                          <span className="text-sm font-semibold text-gray-800">{item.label}</span>
                          <span className="text-xs text-gray-500 font-mono mt-0.5">{item.href}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            const newMenu = (settings.navigation?.mainMenu || []).filter((_: any, i: number) => i !== idx);
                            setSettings((p: any) => ({
                              ...p,
                              navigation: { ...p.navigation, mainMenu: newMenu }
                            }));
                          }}
                          className="p-1.5 text-gray-400 hover:text-red-500 rounded hover:bg-red-50 transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* 2. Linktree Links Builder */}
              <div className="flex flex-col gap-4 bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                <h4 className="font-bold text-gray-900 flex items-center gap-2">
                  <Link className="w-4 h-4 text-violet-600" />
                  {t("admin.aiBlog.linktreeTitle")}
                </h4>
                <p className="text-xs text-gray-500">{t("admin.aiBlog.linktreeDesc")}</p>
                
                {/* Add Link Form */}
                <div className="flex flex-wrap gap-3 items-end bg-gray-50/50 p-4 rounded-lg border border-gray-100 mt-2">
                  <div className="flex-1 min-w-[200px]">
                    <label className="text-xs font-semibold text-gray-600 block mb-1">{t("admin.aiBlog.socialNetworkLabel")}</label>
                    <input 
                      type="text" 
                      id="newTreeLabel"
                      placeholder={t("admin.aiBlog.socialNetworkPlaceholder")} 
                      className="w-full bg-white border border-gray-200 rounded-md p-2 text-sm focus:outline-none focus:ring-1 focus:ring-violet-500" 
                    />
                  </div>
                  <div className="flex-1 min-w-[200px]">
                    <label className="text-xs font-semibold text-gray-600 block mb-1">{t("admin.aiBlog.socialUrl")}</label>
                    <input 
                      type="text" 
                      id="newTreeHref"
                      placeholder={t("admin.aiBlog.socialUrlPlaceholder")} 
                      className="w-full bg-white border border-gray-200 rounded-md p-2 text-sm focus:outline-none focus:ring-1 focus:ring-violet-500" 
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const labelInput = document.getElementById("newTreeLabel") as HTMLInputElement;
                      const hrefInput = document.getElementById("newTreeHref") as HTMLInputElement;
                      const label = labelInput?.value?.trim();
                      const href = hrefInput?.value?.trim();
                      if (!label || !href) return alert(t("admin.aiBlog.fillFieldsAlert"));

                      const currentTree = settings.navigation?.linkTree || [];
                      setSettings((p: any) => ({
                        ...p,
                        navigation: {
                          ...p.navigation,
                          linkTree: [...currentTree, { label, href }]
                        }
                      }));

                      labelInput.value = "";
                      hrefInput.value = "";
                    }}
                    className="px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-md text-sm font-semibold transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    {t("admin.aiBlog.add")}
                  </button>
                </div>

                {/* Linktree Links List */}
                <div className="flex flex-col gap-2 mt-2">
                  {(settings.navigation?.linkTree || []).length === 0 ? (
                    <div className="text-center text-xs text-gray-400 py-6 border border-dashed border-gray-200 rounded-lg bg-gray-50/20">
                      {t("admin.aiBlog.noLinksYet")}
                    </div>
                  ) : (
                    (settings.navigation?.linkTree || []).map((item: any, idx: number) => (
                      <div key={idx} className="flex justify-between items-center p-3 border border-gray-250 rounded-lg hover:border-gray-300 transition-colors bg-gray-50/20">
                        <div className="flex flex-col">
                          <span className="text-sm font-semibold text-gray-800">{item.label}</span>
                          <span className="text-xs text-gray-500 font-mono mt-0.5">{item.href}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            const newTree = (settings.navigation?.linkTree || []).filter((_: any, i: number) => i !== idx);
                            setSettings((p: any) => ({
                              ...p,
                              navigation: { ...p.navigation, linkTree: newTree }
                            }));
                          }}
                          className="p-1.5 text-gray-400 hover:text-red-500 rounded hover:bg-red-50 transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === "categories" && (
            <div className="flex flex-col gap-8 max-w-3xl animate-in fade-in duration-250">
              <div>
                <h3 className="text-lg font-semibold border-b border-gray-200 pb-2">Gerenciamento de Categorias & Traduções</h3>
                <p className="text-xs text-gray-500 mt-1">Crie as categorias para o seu blog e defina a tradução para cada uma delas.</p>
              </div>

              {/* Add Category Form */}
              <form onSubmit={handleAddCategory} className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex flex-col gap-4">
                <h4 className="font-bold text-sm text-gray-900 flex items-center gap-1.5">
                  <Layers className="w-4 h-4 text-violet-650" />
                  Nova Categoria
                </h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <label className="flex flex-col gap-1 text-xs font-semibold text-gray-700">
                    Nome (PT) *
                    <input type="text" value={newCatName} onChange={e=>setNewCatName(e.target.value)} required className="border border-gray-250 rounded p-2 font-normal mt-1 bg-white focus:outline-none" placeholder="Ex: Tecnologia" />
                  </label>
                  <label className="flex flex-col gap-1 text-xs font-semibold text-gray-700">
                    Slug Categoria *
                    <input type="text" value={newCatSlug} onChange={e=>setNewCatSlug(e.target.value)} required className="border border-gray-250 rounded p-2 font-normal mt-1 bg-white focus:outline-none" placeholder="Ex: tecnologia" />
                  </label>
                </div>

                <label className="flex flex-col gap-1 text-xs font-semibold text-gray-700">
                  Descrição (PT)
                  <textarea value={newCatDesc} onChange={e=>setNewCatDesc(e.target.value)} rows={2} className="border border-gray-250 rounded p-2 font-normal mt-1 bg-white focus:outline-none" placeholder="Descrição resumida..." />
                </label>

                {/* English Translation section */}
                <div className="border-t border-gray-150 pt-4 mt-2">
                  <h5 className="text-xs font-bold text-violet-750 uppercase tracking-wider mb-3">Tradução em Inglês (EN)</h5>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <label className="flex flex-col gap-1 text-xs font-semibold text-gray-700">
                      Nome (EN)
                      <input type="text" value={newCatNameEn} onChange={e=>setNewCatNameEn(e.target.value)} className="border border-gray-250 rounded p-2 font-normal mt-1 bg-white focus:outline-none" placeholder="Ex: Technology" />
                    </label>
                    <label className="flex flex-col gap-1 text-xs font-semibold text-gray-700">
                      Descrição (EN)
                      <input type="text" value={newCatDescEn} onChange={e=>setNewCatDescEn(e.target.value)} className="border border-gray-250 rounded p-2 font-normal mt-1 bg-white focus:outline-none" placeholder="Ex: Summarized description..." />
                    </label>
                  </div>
                </div>

                <button type="submit" className="mt-2 w-full md:w-auto self-end px-5 py-2.5 bg-violet-650 hover:bg-violet-700 text-white rounded-lg text-xs font-bold transition-colors shadow-sm cursor-pointer">
                  + Adicionar Categoria
                </button>
              </form>

              {/* Categories list table */}
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
                  <h4 className="font-bold text-sm text-gray-800">Categorias Existentes</h4>
                  {isLoadingCategories && <Loader2 className="w-4 h-4 animate-spin text-gray-400" />}
                </div>

                <div className="divide-y divide-gray-100 flex flex-col">
                  {categoriesList.length === 0 ? (
                    <div className="text-center py-8 text-xs text-gray-400 font-medium">Nenhuma categoria criada ainda.</div>
                  ) : (
                    categoriesList.map((cat: any) => (
                      <div key={cat._id} className="p-4 flex items-center justify-between hover:bg-gray-50/50 transition-colors">
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-gray-800">{cat.name}</span>
                            <span className="text-[10px] bg-violet-50 text-violet-750 px-2 py-0.5 rounded-full font-mono">{cat.slug}</span>
                          </div>
                          {cat.description && <p className="text-xs text-gray-500">{cat.description}</p>}
                          {cat.translations?.en && (
                            <p className="text-[10px] text-gray-450 italic mt-0.5">
                              Inglês (EN): <strong>{cat.translations.en.name}</strong> {cat.translations.en.description ? `- "${cat.translations.en.description}"` : ""}
                            </p>
                          )}
                        </div>
                        <button type="button" onClick={() => handleDeleteCategory(cat._id)} className="p-2 text-gray-400 hover:text-red-500 rounded hover:bg-red-50 transition-colors cursor-pointer" title="Excluir Categoria">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
