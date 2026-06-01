"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/stores/authStore";
import { useWorkspaceStore } from "@/lib/stores/workspaceStore";
import { useToast } from "@/lib/state/toast-context";
import { ClassicHeroFormSubmission } from "@/components/landing/ClassicHeroForm";

export function AdminOnboardingHandler() {
    const router = useRouter();
    const { push } = useToast();
    const [isProcessing, setIsProcessing] = useState(false);

    // We only run this if we are authenticated (which we are, inside /admin)
    // and if we haven't processed it yet

    useEffect(() => {
        const processOnboarding = async () => {
            // Atomically read AND clear onboarding_data before any async work
            // Prevents two simultaneous renders / tabs from processing the same data
            const storedData = sessionStorage.getItem("onboarding_data");
            if (!storedData) return;
            sessionStorage.removeItem("onboarding_data"); // consume immediately

            setIsProcessing(true);
            try {
                const { type, data } = JSON.parse(storedData);
                console.log("[Onboarding] Found data:", type, data);

                // Duplicate guard: if we already have a workspace with this name, skip
                const existingWorkspaces = useWorkspaceStore.getState().workspaces;
                const workspaceName = data.os_company_name || data.blog_name || data.coupleName || data.company || (data.mentor_name ? `${data.mentor_name} & ${data.student_name}` : "") || data.survey_company || "";
                if (workspaceName && existingWorkspaces.some(w => w.name === workspaceName)) {
                    console.log(`[Onboarding] Workspace "${workspaceName}" already exists, skipping duplicate creation.`);
                    setIsProcessing(false);
                    return;
                }

                push({
                    title: "Setting up your workspace...",
                    description: "Importing your ideas from the home page.",
                    variant: "default"
                });

                if (type === "business_insights") {
                    await handleBusinessInsightsCreation(data);
                } else if (type === "love_writers") {
                    await handleLoveWritersCreation(data);
                } else if (type === "trade_ranking") {
                    await handleTradeRankingCreation(data);
                } else if (type === "furniture_logistics" || type === "furniture_layout" || type === "furniture_store") {
                    await handleFurnitureCreation(type, data);
                } else if (type === "io_mentoring") {
                    await handleMentoringCreation(data);
                } else if (type === "smart_survey") {
                    await handleSurveyCreation(data);
                } else if (type === "ai_blog") {
                    await handleBlogCreation(data);
                } else if (type === "os_system") {
                    await handleOsSystemCreation(data);
                }

                push({
                    title: "Success!",
                    description: "Your workspace is ready.",
                    variant: "success"
                });

            } catch (error: any) {
                console.error("[Onboarding] Failed to process:", error);
                push({
                    title: "Setup Failed",
                    description: error?.message || "Could not create workspace from your inputs. Please try creating one manually.",
                    variant: "destructive"
                });
            } finally {
                setIsProcessing(false);
            }
        };

        processOnboarding();
    }, []);

    const handleBusinessInsightsCreation = async (data: ClassicHeroFormSubmission) => {
        // Replicate logic from HomeContainer but calling API as authenticated user
        const targetUrl = "/api/generate";

        // Normalize
        const normalizeUrl = (url?: string) => {
            if (!url) return "";
            const trimmed = url.trim();
            return trimmed.startsWith("http") ? trimmed : `https://${trimmed}`;
        };

        const payload = {
            salesRepCompany: data.company,
            salesRepWebsite: normalizeUrl(data.companyWebsite),
            solution: data.solution,
            targetCompany: data.researchTarget,
            targetWebsite: normalizeUrl(data.researchWebsite),
            templateId: data.templateId,
            model: data.model,
            promptAgent: data.promptAgent,
            responseLength: data.responseLength,
            promptVariables: data.promptVariables,
            bulkPrompts: data.bulkPrompts,
        };

        const response = await fetch(targetUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
        });

        if (!response.ok) {
            const err = await response.json();
            throw new Error(err.error || "Failed to generate workspace");
        }

        const resData = await response.json();
        if (resData.workspace) {
            // Initialize in store locally to be safe
            // We use initializeWorkspaceFromHome which handles adding/merging
            const ws = await useWorkspaceStore.getState().initializeWorkspaceFromHome(resData.workspace);

            // Switch to it
            useWorkspaceStore.getState().setCurrentWorkspace(ws);

            // Force refresh or redirect?
            router.replace(`/admin?workspaceId=${ws.id}`);
        }
    };

    const handleLoveWritersCreation = async (data: any) => {
        const userName = data.user_name || "Author";
        const partnerName = data.partner_name || "Partner";
        const bookTitle = `${userName} & ${partnerName}`;
        const templateId = "template_love_writers";

        // Build prompt variables from form data
        const promptVariablesList = Object.entries(data).map(([key, value]) => `${key}: ${value}`);

        // Call the same /api/generate endpoint used by other templates — 
        // it handles template resolution server-side
        const payload = {
            salesRepCompany: "Love Writers",
            salesRepWebsite: "https://lovewriters.com",
            solution: "Love Story Book",
            targetCompany: bookTitle,
            targetWebsite: "https://lovewriters.com",
            templateId,
            model: "gpt-4o-mini",
            promptAgent: "publisher",
            responseLength: "long",
            promptVariables: promptVariablesList,
            bulkPrompts: [],
        };

        const response = await fetch("/api/generate", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
        });

        if (!response.ok) {
            const err = await response.json();
            throw new Error(err.error || "Failed to generate Love Writers workspace");
        }

        const resData = await response.json();
        if (resData.workspace) {
            const ws = await useWorkspaceStore.getState().initializeWorkspaceFromHome(resData.workspace);
            useWorkspaceStore.getState().setCurrentWorkspace(ws);

            try {
                await useWorkspaceStore.getState().refreshWorkspaces();
                const freshWorkspace = useWorkspaceStore.getState().workspaces.find(w => w.id === ws.id);
                if (freshWorkspace) useWorkspaceStore.getState().setCurrentWorkspace(freshWorkspace);
            } catch (e) {
                console.warn("[Onboarding] Could not refresh workspaces after Love Writers creation:", e);
            }

            router.replace(`/admin?workspaceId=${ws.id}`);
        }
    };

    const handleTradeRankingCreation = async (data: any) => {
        const targetUrl = "/api/generate";

        // 🟢 Mercado Livre Enrichment
        // Fetch real market data before generating the ranking
        let enrichedData = { ...data };
        try {
            console.log("[Onboarding] Enriching with Mercado Livre data for:", data.product_category);
            const mlRes = await fetch(`/api/market/ml?q=${encodeURIComponent(data.product_category || "")}`);
            const mlStats = await mlRes.json();

            if (mlRes.ok && !mlStats.unavailable) {
                console.log("[Onboarding] ✅ ML Data received and applied:", mlStats);
                
                // Map ML stats to prompt variables the algorithm expects
                enrichedData = {
                    ...enrichedData,
                    market_ml_used_median: mlStats.used.median,
                    market_ml_used_p10: mlStats.used.p10,
                    market_ml_used_p90: mlStats.used.p90,
                    market_ml_used_count: mlStats.used.count,
                    market_ml_confidence: mlStats.confidence,
                    // If we found a "new" median, passed it as hint for valor_novo if missing
                    market_ml_new_median: mlStats.new?.median || 0,
                };
            } else {
                console.warn("[Onboarding] ⚠️ ML Enrichment unavailable or failed. Using manual data.", mlStats.error || "");
            }
        } catch (mlErr) {
            console.warn("[Onboarding] ⚠️ ML Enrichment failed (continuing with manual data):", mlErr);
        }

        // Prepare prompt variables from all (now enriched) data keys
        const promptVariables = Object.entries(enrichedData).map(([key, value]) => `${key}:${value}`);

        const payload = {
            salesRepCompany: "Trader",
            salesRepWebsite: "https://our.trade",
            solution: "Trade Ranking",
            targetCompany: data.product_category || "Trade Asset",
            targetWebsite: "https://asset.info",
            templateId: "template_trade_ranking",
            model: "offline-algorithm",
            promptAgent: "ade_research_analyst",
            responseLength: "medium",
            promptVariables,
            bulkPrompts: [],
        };

        const response = await fetch(targetUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
        });

        if (!response.ok) {
            const err = await response.json();
            throw new Error(err.error || "Failed to generate trade ranking");
        }

        const resData = await response.json();
        if (resData.workspace) {
            // Rename the default dashboard to the product category if possible
            // We do this BEFORE initializing the store to avoid read-only mutation errors
            if (resData.workspace.dashboards && resData.workspace.dashboards.length > 0) {
                resData.workspace.dashboards[0].name = data.product_category || "Trade Analysis";
            }

            const ws = await useWorkspaceStore.getState().initializeWorkspaceFromHome(resData.workspace);
            useWorkspaceStore.getState().setCurrentWorkspace(ws);
            router.replace(`/admin?workspaceId=${ws.id}`);
        }
    };

    const handleFurnitureCreation = async (type: string, data: any) => {
        const targetUrl = "/api/generate";
        let templateId = "template_furniture_logistics";
        if (type === "furniture_layout") templateId = "template_furniture_layout";
        if (type === "furniture_store") templateId = "template_furniture_store";
        
        // Map common fields
        const storeName = data.store_name || data.layout_store_name || data.vitrine_name || "Minha Loja de Móveis";
        const productCategory = data.product_category || data.primary_niche || "Móveis em Geral";

        const payload = {
            salesRepCompany: "Gestor Loja",
            salesRepWebsite: "https://minhaloja.com",
            solution: type === "furniture_store" ? "Loja Virtual" : type === "furniture_logistics" ? "Logística e Montagem" : "Layout de Loja",
            targetCompany: storeName,
            targetWebsite: "https://minhaloja.com",
            templateId: templateId,
            model: "gpt-4o-mini",
            promptAgent: "ade_research_analyst",
            responseLength: "long",
            promptVariables: [
                `store_name:${storeName}`,
                `product_category:${productCategory}`,
                `staff_count:${data.staff_count || '5'}`,
                `store_size:${data.store_size || '200'}`,
                `aisle_count:${data.aisle_count || '4'}`
            ],
            bulkPrompts: [],
        };

        const response = await fetch(targetUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
        });

        if (!response.ok) {
            const err = await response.json();
            throw new Error(err.error || "Failed to generate furniture workspace");
        }

        const resData = await response.json();
        if (resData.workspace) {
            const ws = await useWorkspaceStore.getState().initializeWorkspaceFromHome(resData.workspace);
            useWorkspaceStore.getState().setCurrentWorkspace(ws);
            router.replace(`/admin?workspaceId=${ws.id}`);
        }
    };

    const handleMentoringCreation = async (data: any) => {
        const targetUrl = "/api/generate";
        const workspaceName = `${data.mentor_name || "Mentor"} & ${data.student_name || "Aluno"}`;
        
        const payload = {
            salesRepCompany: data.mentor_name || "Mentor",
            salesRepWebsite: "https://io.mentoring",
            solution: "Mentoria de Performance",
            targetCompany: workspaceName,
            targetWebsite: "https://io.mentoring",
            templateId: "template_io_mentoring",
            model: "gpt-4o-mini",
            promptAgent: "ade_research_analyst",
            responseLength: "long",
            promptVariables: [
                `mentor_name:${data.mentor_name || 'Mentor'}`,
                `student_name:${data.student_name || 'Aluno'}`,
                `mentoring_goal:${data.mentoring_goal || 'Aceleração de Carreira'}`
            ],
            bulkPrompts: [],
        };

        const response = await fetch(targetUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
        });

        if (!response.ok) {
            const err = await response.json();
            throw new Error(err.error || "Failed to generate mentoring workspace");
        }

        const resData = await response.json();
        if (resData.workspace) {
            const ws = await useWorkspaceStore.getState().initializeWorkspaceFromHome(resData.workspace);
            useWorkspaceStore.getState().setCurrentWorkspace(ws);
            router.replace(`/admin?workspaceId=${ws.id}`);
        }
    };

    const handleSurveyCreation = async (data: any) => {
        const targetUrl = "/api/generate";
        const workspaceName = data.survey_company || "Organização Pesquisada";
        
        const payload = {
            salesRepCompany: "Auditor Sênior",
            salesRepWebsite: "https://io.survey",
            solution: "Compliance Audit",
            targetCompany: workspaceName,
            targetWebsite: "https://io.survey",
            templateId: "template_smart_survey",
            model: "gpt-4o-mini",
            promptAgent: "ade_research_analyst",
            responseLength: "long",
            promptVariables: [
                `survey_company:${data.survey_company || 'Organização Teste'}`,
                `survey_sector:Geral`,
                `surveyor_name:Auditor Sênior`
            ],
            bulkPrompts: [],
        };

        const response = await fetch(targetUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
        });

        if (!response.ok) {
            const err = await response.json();
            throw new Error(err.error || "Failed to generate smart survey workspace");
        }

        const resData = await response.json();
        if (resData.workspace) {
            const ws = await useWorkspaceStore.getState().initializeWorkspaceFromHome(resData.workspace);
            useWorkspaceStore.getState().setCurrentWorkspace(ws);
            router.replace(`/admin?workspaceId=${ws.id}`);
        }
    };

    const handleBlogCreation = async (data: any) => {
        const targetUrl = "/api/generate";
        
        // Ensure values are at least 2 chars to pass Zod validation
        const safeString = (val: string | undefined, fallback: string) => {
            const v = (val || "").trim();
            return v.length >= 2 ? v : fallback;
        };

        const workspaceName = safeString(data.blog_name, "Meu Blog AI");
        const authorName = safeString(data.blog_author, "Redator AI");
        const description = safeString(data.blog_description, "Um blog gerado por inteligência artificial.");
        const topics = safeString(data.blog_topics, "Tecnologia, Negócios");
        
        const payload = {
            salesRepCompany: authorName,
            salesRepWebsite: "https://io.blog",
            solution: "AI Content Publishing",
            targetCompany: workspaceName,
            targetWebsite: "https://io.blog",
            templateId: "template_ai_blog",
            model: "gpt-4o-mini",
            promptAgent: "ade_research_analyst",
            responseLength: "long",
            promptVariables: [
                `blog_name:${workspaceName}`,
                `blog_description:${description}`,
                `blog_topics:${topics}`,
                `blog_author:${authorName}`
            ],
            bulkPrompts: [],
        };

        const response = await fetch(targetUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
        });

        if (!response.ok) {
            const err = await response.json().catch(() => ({}));
            const details = err.details ? JSON.stringify(err.details) : "";
            throw new Error(err.error ? `${err.error} ${details}` : "Failed to generate blog workspace");
        }

        const resData = await response.json();
        if (resData.workspace) {
            const ws = await useWorkspaceStore.getState().initializeWorkspaceFromHome(resData.workspace);
            useWorkspaceStore.getState().setCurrentWorkspace(ws);
            router.replace(`/admin?workspaceId=${ws.id}`);
        }
    };

    const handleOsSystemCreation = async (data: any) => {
        const targetUrl = "/api/generate";
        
        const safeString = (val: string | undefined, fallback: string) => {
            const v = (val || "").trim();
            return v.length >= 2 ? v : fallback;
        };

        const workspaceName = safeString(data.os_company_name, "Minha Empresa");
        const companyNiche = safeString(data.os_company_niche, "Serviços Gerais");
        
        const payload = {
            salesRepCompany: workspaceName,
            salesRepWebsite: "https://io.ossystem",
            solution: "Gestão de Ordens de Serviço",
            targetCompany: workspaceName,
            targetWebsite: "https://io.ossystem",
            templateId: "template_os_system",
            model: "gpt-4o-mini",
            promptAgent: "ade_research_analyst",
            responseLength: "long",
            promptVariables: [
                `os_company_name:${workspaceName}`,
                `os_company_niche:${companyNiche}`
            ],
            bulkPrompts: [],
        };

        const response = await fetch(targetUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
        });

        if (!response.ok) {
            const err = await response.json().catch(() => ({}));
            throw new Error(err.error || "Failed to generate OS System workspace");
        }

        const resData = await response.json();
        if (resData.workspace) {
            const ws = await useWorkspaceStore.getState().initializeWorkspaceFromHome(resData.workspace);
            useWorkspaceStore.getState().setCurrentWorkspace(ws);
            router.replace(`/admin?workspaceId=${ws.id}`);
        }
    };

    if (isProcessing) {
        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/80 backdrop-blur-sm">
                <div className="flex flex-col items-center gap-4">
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-black" />
                    <p className="text-sm font-medium text-gray-600">Creating your workspace...</p>
                    <p className="text-xs text-gray-400">Please wait while we set things up.</p>
                </div>
            </div>
        );
    }

    return null;
}
