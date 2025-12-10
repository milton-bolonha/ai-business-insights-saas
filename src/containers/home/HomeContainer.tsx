"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { useToast } from "@/lib/state/toast-context";
import { useAuthStore } from "@/lib/stores/authStore";
import { useWorkspaceStore } from "@/lib/stores/workspaceStore";
import {
  ClassicHeroForm,
  type ClassicHeroFormSubmission,
} from "@/components/landing/ClassicHeroForm";
import { UpgradeModal } from "@/components/ui/UpgradeModal";
import { usePaymentFlow } from "@/containers/admin/hooks/usePaymentFlow";
import Image from "next/image";
import Link from "next/link";

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

  const initializeWorkspaceFromHome = useWorkspaceStore(
    (state) => state.initializeWorkspaceFromHome
  );
  const clearWorkspace = useWorkspaceStore((state) => state.clearWorkspace);
  const [isSubmitting] = useState(false);
  const payment = usePaymentFlow();

  const normalizeUrl = (url: string) => {
    const trimmed = url.trim();
    if (!trimmed) return "";
    return trimmed.startsWith("http") ? trimmed : `https://${trimmed}`;
  };

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
        payment.setUpgradeModalOpen(true);
        push({
          title: "Limit reached",
          description: `You already created ${preview.used} workspaces. Upgrade to create more.`,
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
        payment.setUpgradeModalOpen(true);
        push({
          title: "Limit reached",
          description: `You already created ${usageResult.used} workspaces. Upgrade to create more.`,
          variant: "destructive",
        });
        return;
      }
    }

    const generateInBackground = async () => {
      const targetUrl = "/api/generate";
      const payload = {
        salesRepCompany: company,
        salesRepWebsite: normalizeUrl(companyWebsite),
        solution,
        targetCompany: researchTarget,
        targetWebsite: normalizeUrl(researchWebsite),
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

      const response = await fetch(
        `/api/workspace?workspaceId=${currentWorkspace.id}`,
        {
          method: "DELETE",
        }
      );
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
    <div className="home-page min-h-screen flex flex-col bg-[#fcfcf9]">
      <header className="fixed top-0 left-0 right-0 z-50 bg-[#fcfcf9]/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-3 sm:px-6 lg:px-8 py-4">
          <Link href="/" className="flex items-center space-x-2">
            <Image
              src="/images/logo-mark.svg"
              alt="WebApp"
              width={24}
              height={24}
              priority
            />
            <span className="text-xl font-semibold text-black">WebApp</span>
          </Link>
          <div className="flex items-center space-x-3">
            <button className="bg-black hover:bg-gray-800 text-white px-5 py-1.5 rounded-full text-sm font-semibold transition-colors">
              Log in
            </button>
            <button className="bg-white border border-gray-300 text-black px-5 py-1.5 rounded-full text-sm font-semibold hover:bg-gray-50 transition-colors">
              Sign up
            </button>
            <button className="w-8 h-8 bg-white border border-gray-300 rounded-full flex items-center justify-center text-gray-600 hover:bg-gray-50 hover:border-gray-400 transition-colors">
              <span className="text-sm font-semibold">?</span>
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 pt-24">
        <ClassicHeroForm
          onSubmit={handleSubmit}
          isSubmitting={isSubmitting}
          onReset={handleResetWorkspace}
        />
      </main>

      <UpgradeModal
        open={payment.isUpgradeModalOpen}
        onClose={() => payment.setUpgradeModalOpen(false)}
        onCheckout={payment.startCheckout}
        onMarkMember={payment.confirmMembership}
        usage={payment.usage}
        limits={payment.limits}
        lastAction="createWorkspace"
        stripeCheckoutUrl={payment.stripeCheckoutUrl}
      />
    </div>
  );
}
