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
            const storedData = sessionStorage.getItem("onboarding_data");
            if (!storedData || isProcessing) return;

            setIsProcessing(true);
            try {
                const { type, data } = JSON.parse(storedData);
                console.log("[Onboarding] Found data:", type, data);

                push({
                    title: "Setting up your workspace...",
                    description: "Importing your ideas from the home page.",
                    variant: "default"
                });

                if (type === "business_insights") {
                    await handleBusinessInsightsCreation(data);
                } else if (type === "love_writers") {
                    await handleLoveWritersCreation(data);
                }

                // Clear after success
                sessionStorage.removeItem("onboarding_data");

                push({
                    title: "Success!",
                    description: "Your workspace is ready.",
                    variant: "success"
                });

            } catch (error) {
                console.error("[Onboarding] Failed to process:", error);
                push({
                    title: "Setup Failed",
                    description: "Could not create workspace from your inputs. Please try creating one manually.",
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
        // Client-side generation logic (copied from HomeContainer adaptation)
        // Since Love Writers generation logic was client-side heavy in the previous version,
        // we might need to verify if we want to move it to API or keep it client-side here.
        // For now, let's assume we can generate the structure client-side and save it via API/Store actions.

        // Simpler approach: Create outline directly using store actions if possible, 
        // OR call a hypothetical /api/generate-book endpoint if we had one.
        // Given current architecture, let's try to reconstruct the Workspace Snapshot manually 
        // and add it via store (Active Sync will save it to DB).

        const userName = data.user_name || "Author";
        const partnerName = data.partner_name || "Partner";
        const bookTitle = `${userName} & ${partnerName}`;
        const templateId = "template_love_writers";

        // Helper imports
        const {
            getGuestTemplate,
            resolveTemplateTiles,
            getPromptAgent,
            processPromptVariables,
        } = await import("@/lib/guest-templates");

        const template = getGuestTemplate(templateId);
        const agent = getPromptAgent("publisher");
        const promptVariablesList = Object.entries(data).map(([key, value]) => `${key}: ${value}`);

        const resolvedTiles = resolveTemplateTiles(template as any, {
            templateId,
            agentId: agent.id as any,
            responseLength: "long",
            promptVariables: promptVariablesList as any,
        });

        const context = {
            user_name: userName,
            partner_name: partnerName,
            meeting_story: data.meeting_story,
        };

        const tiles = resolvedTiles.map((item, index) => {
            const processedPrompt = processPromptVariables(item.prompt, context);
            return {
                id: `tile_${crypto.randomUUID()}`,
                title: item.title,
                content: null,
                prompt: processedPrompt,
                templateId,
                templateTileId: item.id,
                category: item.category,
                model: "gpt-4o-mini",
                orderIndex: index,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                agentId: item.agentId,
                status: "pending",
            };
        });

        const workspaceSnapshot = {
            id: `ws_${crypto.randomUUID()}`,
            sessionId: `session_${crypto.randomUUID()}`,
            name: bookTitle,
            website: "https://lovewriters.com",
            createdAt: new Date().toISOString(),
            tiles,
            salesRepCompany: "Love Writers",
            salesRepWebsite: "https://lovewriters.com",
            generatedAt: new Date().toISOString(),
            tilesToGenerate: tiles.length,
            promptSettings: {
                templateId,
                model: "gpt-4o",
                promptAgent: "publisher",
                responseLength: "long",
                promptVariables: promptVariablesList,
            }
        };

        // Use initializeWorkspaceFromHome to add properly to store and persist
        const ws = await useWorkspaceStore.getState().initializeWorkspaceFromHome(workspaceSnapshot as any);
        useWorkspaceStore.getState().setCurrentWorkspace(ws);

        // Trigger Sync immediately if possible? 
        // For now, redirect.
        router.replace(`/admin?workspaceId=${ws.id}`);
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
