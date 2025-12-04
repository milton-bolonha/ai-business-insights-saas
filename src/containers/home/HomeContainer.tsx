"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { useToast } from "@/lib/state/toast-context";
import { useAuthStore } from "@/lib/stores/authStore";
import { useWorkspaceStore } from "@/lib/stores/workspaceStore";
import { ClassicHeroForm, type ClassicHeroFormSubmission } from "@/components/landing/ClassicHeroForm";

export function HomeContainer() {
  const router = useRouter();
  const { push } = useToast();

  // Usar Zustand stores ao invés de Context API
  const {
    user,
    canPerformAction,
    evaluateUsage,
    consumeUsage,
    startCheckout,
    resetUsage,
    isMember,
    limits,
  } = useAuthStore();

  const initializeWorkspaceFromHome = useWorkspaceStore((state) => state.initializeWorkspaceFromHome);
  const clearWorkspace = useWorkspaceStore((state) => state.clearWorkspace);
  const [isSubmitting] = useState(false);

  const handleSubmit = async ({
    company,
    companyWebsite,
    solution,
    researchTarget,
    researchWebsite,
    templateId,
    model,
    promptAgent,
    responseLength,
    promptVariables,
    bulkPrompts,
  }: ClassicHeroFormSubmission) => {
    if (isSubmitting) return;

    if (user?.role !== "member") {
      const preview = evaluateUsage("createWorkspace");
      if (!preview.allowed) {
        push({
          title: "Limite atingido",
          description: `Você já criou ${preview.used} workspaces. Faça upgrade para criar mais!`,
          variant: "destructive",
        });
        return;
      }
    }

    push({
      title: "Redirecting to dashboard...",
      description: "Your insights are being generated in the background.",
      variant: "default",
    });

    if (!isMember) {
      const usageResult = consumeUsage("createWorkspace");
      if (!usageResult.allowed) {
        push({
          title: "Limite atingido",
          description: `Você já criou ${usageResult.used} workspaces. Faça upgrade para criar mais!`,
          variant: "destructive",
        });
        return;
      }
    }

    const generateInBackground = async () => {
      const targetUrl = "/api/generate";
      const payload = {
        salesRepCompany: company,
        salesRepWebsite: companyWebsite,
        solution,
        targetCompany: researchTarget,
        targetWebsite: researchWebsite,
        templateId,
        model,
        promptAgent,
        responseLength,
        promptVariables,
        bulkPrompts,
      };

      try {
        const response = await fetch(targetUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const data = await response.json().catch(() => null);

        if (!response.ok) {
          push({
            title: "Generation failed",
            description:
              (data?.error as string) ?? "Failed to start insight generation.",
            variant: "destructive",
          });
          return;
        }

        if (data?.workspace) {
          // Initialize workspace in local store
          const workspace = await initializeWorkspaceFromHome(data.workspace);
          
          // Navigate to admin with workspaceId query param if needed, 
          // but since we're using localStorage/Zustand, the state is already there.
          // For members, the workspace is in MongoDB.
          router.push(`/admin?workspaceId=${workspace.id}`);
        } else {
          router.push("/admin");
        }

        push({
          title: "Insights generated!",
          description:
            "Your workspace is ready. Check the tiles for new insights.",
          variant: "success",
        });
      } catch (error) {
        console.error("[HomeContainer] 🚨 Generation request threw", error);
        push({
          title: "Generation failed",
          description:
            error instanceof Error
              ? error.message
              : "Please try again in a few moments.",
          variant: "destructive",
        });
      }
    };

    generateInBackground();
  };

  const handleResetWorkspace = async () => {
    try {
      const currentWorkspace = useWorkspaceStore.getState().currentWorkspace;
      if (!currentWorkspace) return;

      const response = await fetch(`/api/workspace?workspaceId=${currentWorkspace.id}`, { 
        method: "DELETE" 
      });
      if (!response.ok) {
        throw new Error("Could not reset the workspace");
      }

      // Limpar estado local do workspace
      clearWorkspace();

      // Resetar uso
      resetUsage();

      push({
        title: "Workspace cleared",
        description: "Submit the form again to generate a fresh workspace.",
        variant: "success",
      });
    } catch (error) {
      push({
        title: "Reset failed",
        description:
          error instanceof Error
            ? error.message
            : "Please try again in a few moments.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="home-page">
      <main className="flex-1">
        <ClassicHeroForm
          onSubmit={handleSubmit}
          isSubmitting={isSubmitting}
          onReset={handleResetWorkspace}
        />
      </main>
    </div>
  );
}

