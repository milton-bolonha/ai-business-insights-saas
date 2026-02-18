"use client";

import { useState, useEffect, useRef, ReactNode } from "react";
import { useRouter } from "next/navigation";
import { SignInButton, SignUpButton, useUser } from "@clerk/nextjs";

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
import { ChatInterface } from "@/components/chat/ChatInterface";
import { AppTagId, APP_ATTRIBUTES } from "@/lib/app-tags";

export function HomeContainer() {
  const router = useRouter();
  const { push } = useToast();
  const { isSignedIn } = useUser();

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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeAppTag, setActiveAppTag] = useState<AppTagId>("home");
  const [formValues, setFormValues] = useState<Partial<ClassicHeroFormSubmission>>({});
  const payment = usePaymentFlow();



  // Chat State
  const [messages, setMessages] = useState<Array<{ role: 'user' | 'assistant' | 'system', content: string | ReactNode }>>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom of chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  // Derived Hero Content
  const heroContent = {
    title: activeAppTag === 'love_writers' ? 'Love Writers' : 'Business Insights',
    subtitle: activeAppTag === 'love_writers'
      ? 'Craft your romance novel arc by arc.'
      : 'Generate deep business insights from company data.'
  };


  // Initial Greeting Effect
  useEffect(() => {
    let initialMessage = "I'm ready to help! Pick an App Tag below or start typing.";

    if (activeAppTag !== 'home') {
      const firstInfo = APP_ATTRIBUTES.find(a => a.appTagId === activeAppTag);
      if (firstInfo) {
        // Simple mapping for display title
        const title = activeAppTag === 'love_writers' ? 'Love Writers' : 'Business Insights';
        initialMessage = `You chose ${title}. Let's get started. What is the ${firstInfo.label}?`;
      }
    }

    if (!hasStarted) {
      setHasStarted(true);
      setIsTyping(true);
      const timer = setTimeout(() => {
        setIsTyping(false);
        setMessages([{ role: 'assistant', content: initialMessage }]);
      }, 1000);
      return () => clearTimeout(timer);
    } else {
      setIsTyping(true);
      const timer = setTimeout(() => {
        setIsTyping(false);
        setMessages(prev => [...prev, { role: 'assistant', content: initialMessage }]);
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [activeAppTag, hasStarted]);

  // Handle Chat Input
  const handleChatSubmit = (msg: string, attrId?: string) => {
    setMessages(prev => [...prev, { role: 'user', content: msg }]);

    // 1. Identify context
    const currentTagAttributes = APP_ATTRIBUTES.filter(a => a.appTagId === activeAppTag);

    // 2. Determine what we just filled (if any) or infer it
    let updatedValues = { ...formValues };
    if (attrId) {
      const key = attrId as keyof ClassicHeroFormSubmission;
      updatedValues[key] = msg as any;
      setFormValues(prev => ({ ...prev, [key]: msg }));
    } else {
      const nextMissing = currentTagAttributes.find(a => !formValues[a.id as keyof ClassicHeroFormSubmission]);
      if (nextMissing) {
        const key = nextMissing.id as keyof ClassicHeroFormSubmission;
        updatedValues[key] = msg as any;
        setFormValues(prev => ({ ...prev, [key]: msg }));
      }
    }

    // 3. Find the NEXT missing attribute
    const nextMissingAttribute = currentTagAttributes.find(a => !updatedValues[a.id as keyof ClassicHeroFormSubmission]);

    setIsTyping(true);
    setTimeout(() => {
      setIsTyping(false);

      if (activeAppTag !== 'home') {
        if (nextMissingAttribute) {
          // Ask for the next field
          setMessages(prev => [...prev, {
            role: 'assistant',
            content: `Got it. Now, what is the ${nextMissingAttribute.label}?`
          }]);
        } else {
          // All done!
          setMessages(prev => [...prev, {
            role: 'assistant',
            content: "Perfect! I have everything I need. Generating your workspace now..."
          }]);

          // Trigger submission after a short delay
          setTimeout(() => {
            if (activeAppTag === 'love_writers') {
              handleBookSubmit(updatedValues);
            } else {
              handleSubmit(updatedValues as ClassicHeroFormSubmission);
            }
          }, 1500);
        }
      } else {
        // General Chat
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: "That sounds interesting! Tell me more or pick a specific app to structure this."
        }]);
      }
    }, 1000);
  };

  const normalizeUrl = (url: string) => {
    const trimmed = url.trim();
    if (!trimmed) return "";
    return trimmed.startsWith("http") ? trimmed : `https://${trimmed}`;
  };

  const handleSubmit = async (data: ClassicHeroFormSubmission) => {
    setIsSubmitting(true);
    try {
      // 1. Save data to Session Storage for post-signup processing
      sessionStorage.setItem("onboarding_data", JSON.stringify({
        type: "business_insights",
        data: data
      }));

      // 2. Redirect to Sign Up
      push({
        title: "Almost there!",
        description: "Create your free account to view your insights.",
        variant: "default",
      });

      // Short delay for toast visibility
      setTimeout(() => {
        router.push("/sign-up?redirect_url=/admin");
      }, 1000);

    } catch (error) {
      console.error("Failed to capture onboarding data:", error);
      push({
        title: "Error",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      });
      setIsSubmitting(false);
    }
  };

  const handleBookSubmit = async (values?: Partial<ClassicHeroFormSubmission>) => {
    const currentValues = values || formValues;

    setIsSubmitting(true);
    try {
      // 1. Save data to Session Storage
      sessionStorage.setItem("onboarding_data", JSON.stringify({
        type: "love_writers",
        data: currentValues
      }));

      // 2. Redirect to Sign Up
      push({
        title: "Saving your story idea...",
        description: "Create a free account to start writing.",
        variant: "default",
      });

      setTimeout(() => {
        router.push("/sign-up?redirect_url=/admin");
      }, 1000);

    } catch (error) {
      console.error("Failed to capture onboarding data:", error);
      push({
        title: "Error",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      });
      setIsSubmitting(false);
    }
  };

  const handleResetWorkspace = async () => {
    try {
      const currentWorkspace = useWorkspaceStore.getState().currentWorkspace;

      // Only attempt server-side delete if user is a member/signed-in
      if (currentWorkspace && currentWorkspace.id && isMember) {
        // Construct URL explicitly using current window origin to avoid protocol mismatch
        const url = new URL("/api/workspace", window.location.origin);
        url.searchParams.set("workspaceId", currentWorkspace.id);

        console.log("[Home] Resetting verified member workspace via:", url.toString());

        try {
          const response = await fetch(url.toString(), {
            method: "DELETE",
          });

          if (!response.ok) {
            console.error("[Home] Reset failed:", response.status, response.statusText);
          }
        } catch (netError) {
          console.warn("[Home] Network error during reset (ignoring):", netError);
        }
      } else {
        console.log("[Home] Guest reset: Skipping server-side delete, clearing local state only.");
      }

      // Try to reset server-side rate limits (Dev only)
      try {
        await fetch("/api/debug/reset-guest", { method: "POST" });
      } catch (e) {
        console.warn("Failed to reset rate limits (might be expected in prod):", e);
      }

      // Limpar estado local do workspace
      clearWorkspace();
      setFormValues({});

      // Resetar uso e estado de autenticação (voltar para Guest)
      resetUsage();
      useAuthStore.getState().setUser(null);

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
      <header className="fixed top-0 left-0 right-0 z-40 bg-[#fcfcf9]/80 backdrop-blur-sm pointer-events-none">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-3 sm:px-6 lg:px-8 py-4 pointer-events-auto">
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
            {messages.length > 0 && (
              <button
                onClick={handleResetWorkspace}
                className="text-sm font-medium text-red-500 hover:text-red-700 mr-2 transition-colors cursor-pointer"
              >
                Start Over
              </button>
            )}
            {isSignedIn ? (
              <Link href="/admin">
                <button className="bg-black hover:bg-gray-800 text-white px-4 py-1.5 rounded-full text-sm font-semibold transition-colors cursor-pointer">
                  Dashboard
                </button>
              </Link>
            ) : (
              <>
                <SignInButton mode="modal">
                  <button className="text-sm font-medium text-gray-600 hover:text-black cursor-pointer">
                    Log in
                  </button>
                </SignInButton>
                <SignUpButton mode="modal">
                  <button className="bg-black hover:bg-gray-800 text-white px-4 py-1.5 rounded-full text-sm font-semibold transition-colors cursor-pointer">
                    Sign up
                  </button>
                </SignUpButton>
              </>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1 pt-24 pb-48 px-4 flex flex-col justify-end min-h-0">
        <div className="mx-auto max-w-3xl w-full space-y-6">

          {/* Static Hero Content (Always visible) */}
          <div className="space-y-4 mb-8">
            <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl">
              {heroContent.title}
            </h1>
            <p className="text-xl text-gray-600">
              {heroContent.subtitle}
            </p>
          </div>

          {/* Chat History */}
          <div className="space-y-4">
            {messages.map((msg, idx) => (
              <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={
                  msg.role === 'user'
                    ? "bg-[#333] text-white rounded-2xl rounded-tr-sm px-5 py-3 max-w-[80%]"
                    : "bg-white border border-gray-100 shadow-sm text-gray-900 rounded-2xl rounded-tl-sm px-5 py-3 max-w-[90%]"
                }>
                  {msg.content}
                </div>
              </div>
            ))}

            {/* Typing Indicator */}
            {isTyping && (
              <div className="flex justify-start">
                <div className="bg-gray-50 border border-gray-100 rounded-2xl rounded-tl-sm px-4 py-3">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-0" />
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-150" />
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-300" />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Invisible spacer for scrolling */}
          <div ref={messagesEndRef} />
        </div>
      </main>

      <ChatInterface
        activeAppTag={activeAppTag}
        onAppTagChange={setActiveAppTag}
        onSubmit={handleChatSubmit}
        isSubmitting={isSubmitting}
      />

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
