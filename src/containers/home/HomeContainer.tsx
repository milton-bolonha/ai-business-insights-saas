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
import { useTranslation } from "@/lib/hooks/useTranslation";
import { cn } from "@/lib/utils";

export function HomeContainer() {
  const router = useRouter();
  const { push } = useToast();
  const { isSignedIn } = useUser();
  const { t, locale, setLocale } = useTranslation();

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
    title: activeAppTag === "home"
      ? t("appTags.business_insights.label")
      : t(`appTags.${activeAppTag}.label`),
    subtitle: activeAppTag === "home"
      ? t("appTags.business_insights.subtitle")
      : t(`appTags.${activeAppTag}.subtitle`)
  };


  // Initial Greeting Effect
  useEffect(() => {
    let initialMessage = t("home.chat.initialGreeting");

    if (activeAppTag !== "home") {
      const firstInfo = APP_ATTRIBUTES.find((a) => a.appTagId === activeAppTag);
      if (firstInfo) {
        const title = t(`appTags.${activeAppTag}.label`);
        const label = t(`attributes.${firstInfo.id}.label`);
        initialMessage = t("home.chat.selectedTag", { title, label });
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
  }, [activeAppTag, hasStarted, t]);


  // Handle Chat Input
  const handleTestMode = (scenario: string = 'iphone') => {
    if (activeAppTag !== 'trade_ranking') return;

    let testValues: any = {};
    let scenarioLabel = "";

    if (scenario === 'iphone') {
      testValues = {
        product_category: 'iPhone 14 Pro',
        product_condition: 'semi_novo',
        catDeprec: 'smartphone',
        product_age: '1.5',
        product_working: '0.95',
        product_repair_cost: '0',
        market_value_new: '7500',
        market_value_used_avg: '4200',
        market_demand: '0.85',
        market_supply: '0.25',
        market_time_to_sell: '5',
        mes: '8', // Setembro
        trader_mode: 'giro',
        trader_risk: '0.3',
        trader_cash_pressure: '0.2',
        market_share: '0.6',
        market_pricing_power: '0.7',
        market_competition: '0.3'
      };
      scenarioLabel = "iPhone 14 Pro";
    } else if (scenario === 'geladeira') {
      testValues = {
        product_category: 'Geladeira Consul',
        product_condition: 'usado',
        catDeprec: 'eletro',
        product_age: '4',
        product_working: '1.0',
        product_repair_cost: '0',
        market_value_new: '1890',
        market_value_used_avg: '1590',
        market_demand: '0.7',
        market_supply: '0.6',
        market_time_to_sell: '15',
        mes: '8',
        trader_mode: 'margem',
        trader_risk: '0.2',
        trader_cash_pressure: '0.1',
        market_share: '0.2',
        market_pricing_power: '0.3',
        market_competition: '0.8'
      };
      scenarioLabel = "Geladeira Consul";
    } else if (scenario === 'armario') {
      testValues = {
        product_category: 'Armário MDF',
        product_condition: 'usado',
        catDeprec: 'generico',
        product_age: '2',
        product_working: '0.8',
        product_repair_cost: '150',
        market_value_new: '2500',
        market_value_used_avg: '1200',
        market_demand: '0.4',
        market_supply: '0.8',
        market_time_to_sell: '30',
        mes: '8',
        trader_mode: 'agressivo',
        trader_risk: '0.6',
        trader_cash_pressure: '0.5',
        market_share: '0.1',
        market_pricing_power: '0.2',
        market_competition: '0.9'
      };
      scenarioLabel = "Armário MDF";
    }

    setFormValues(testValues);
    setMessages(prev => [
      ...prev,
      { role: 'user', content: `⏩ Skip to ${scenarioLabel} Analysis` },
      { role: 'assistant', content: t("home.chat.testModeActive", { scenario: scenarioLabel }) }
    ]);

    setTimeout(() => {
      handleTradeSubmit(testValues);
    }, 1500);
  };

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
          const label = t(`attributes.${nextMissingAttribute.id}.label`);
          setMessages(prev => [...prev, {
            role: 'assistant',
            content: t("home.chat.missingField", { label })
          }]);
        } else {
          // All done!
          setMessages(prev => [...prev, {
            role: 'assistant',
            content: t("home.chat.generating")
          }]);

          // Trigger submission after a short delay
          setTimeout(() => {
            if (activeAppTag === 'love_writers') {
              handleBookSubmit(updatedValues);
            } else if (activeAppTag === 'trade_ranking') {
              handleTradeSubmit(updatedValues);
            } else if (activeAppTag === 'furniture_logistics' || activeAppTag === 'furniture_layout' || activeAppTag === 'furniture_store' || activeAppTag === 'io_mentoring' || activeAppTag === 'smart_survey' || activeAppTag === 'ai_blog') {
              handleFurnitureSubmit(activeAppTag, updatedValues);
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
        title: t("home.toasts.almostThere"),
        description: t("home.toasts.createAccount"),
        variant: "default",
      });

      // Short delay for toast visibility
      setTimeout(() => {
        router.push(isSignedIn ? "/admin" : "/sign-up?redirect_url=/admin");
      }, 1000);

    } catch (error) {
      console.error("Failed to capture onboarding data:", error);
      push({
        title: t("common.error"),
        description: t("home.toasts.errorOccurred"),
        variant: "destructive",
      });
      setIsSubmitting(false);
    }
  };

  const handleTradeSubmit = async (values?: Partial<ClassicHeroFormSubmission>) => {
    const currentValues = values || formValues;

    setIsSubmitting(true);
    try {
      sessionStorage.setItem("onboarding_data", JSON.stringify({
        type: "trade_ranking",
        data: currentValues
      }));

      push({
        title: t("home.toasts.calculating"),
        description: t("home.toasts.createAccount"),
        variant: "default",
      });

      setTimeout(() => {
        router.push(isSignedIn ? "/admin" : "/sign-up?redirect_url=/admin");
      }, 1000);

    } catch (error) {
      console.error("Failed to capture onboarding data:", error);
      push({
        title: t("common.error"),
        description: t("home.toasts.errorOccurred"),
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
        title: t("home.toasts.savingStory"),
        description: t("home.toasts.createAccount"),
        variant: "default",
      });

      setTimeout(() => {
        router.push("/sign-up?redirect_url=/admin");
      }, 1000);

    } catch (error) {
      console.error("Failed to capture onboarding data:", error);
      push({
        title: t("common.error"),
        description: t("home.toasts.errorOccurred"),
        variant: "destructive",
      });
      setIsSubmitting(false);
    }
  };

  const handleFurnitureSubmit = async (type: AppTagId, values?: Partial<ClassicHeroFormSubmission>) => {
    const currentValues = values || formValues;

    setIsSubmitting(true);
    try {
      sessionStorage.setItem("onboarding_data", JSON.stringify({
        type: type,
        data: currentValues
      }));

      push({
        title: t("home.toasts.loadingPanel"),
        description: t("home.toasts.createAccount"),
        variant: "default",
      });

      setTimeout(() => {
        router.push(isSignedIn ? "/admin" : "/sign-up?redirect_url=/admin");
      }, 1000);

    } catch (error) {
      console.error("Failed to capture furniture data:", error);
      push({ title: t("common.error"), description: t("home.toasts.errorOccurred"), variant: "destructive" });
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
        title: t("home.toasts.workspaceCleared"),
        description: t("home.toasts.workspaceClearedDesc"),
        variant: "success",
      });
    } catch (error) {
      push({
        title: t("common.error"),
        description:
          error instanceof Error
            ? error.message
            : t("home.toasts.errorOccurred"),
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
            {/* Language Selector */}
            <div className="flex items-center gap-1 rounded-full border border-slate-200 bg-white p-1 text-xs font-semibold shadow-xs mr-2 pointer-events-auto">
              <button
                onClick={() => setLocale("pt")}
                className={cn(
                  "px-2.5 py-1 rounded-full transition-all cursor-pointer font-bold text-[10px]",
                  locale === "pt"
                    ? "bg-slate-900 text-white shadow-sm"
                    : "text-slate-500 hover:text-slate-900 hover:bg-slate-50"
                )}
                title="Português"
              >
                PT
              </button>
              <button
                onClick={() => setLocale("en")}
                className={cn(
                  "px-2.5 py-1 rounded-full transition-all cursor-pointer font-bold text-[10px]",
                  locale === "en"
                    ? "bg-slate-900 text-white shadow-sm"
                    : "text-slate-500 hover:text-slate-900 hover:bg-slate-50"
                )}
                title="English"
              >
                EN
              </button>
            </div>


            {messages.length > 0 && (
              <button
                onClick={handleResetWorkspace}
                className="text-sm font-medium text-red-500 hover:text-red-700 mr-2 transition-colors cursor-pointer pointer-events-auto"
              >
                {t("common.startOver")}
              </button>
            )}
            {isSignedIn ? (
              <Link href="/admin">
                <button className="bg-black hover:bg-gray-800 text-white px-4 py-1.5 rounded-full text-sm font-semibold transition-colors cursor-pointer">
                  {t("common.dashboard")}
                </button>
              </Link>
            ) : (
              <>
                <SignInButton mode="modal">
                  <button className="text-sm font-medium text-gray-600 hover:text-black cursor-pointer">
                    {t("common.login")}
                  </button>
                </SignInButton>
                <SignUpButton mode="modal">
                  <button className="bg-black hover:bg-gray-800 text-white px-4 py-1.5 rounded-full text-sm font-semibold transition-colors cursor-pointer">
                    {t("common.signUp")}
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
        onTestMode={handleTestMode}
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
