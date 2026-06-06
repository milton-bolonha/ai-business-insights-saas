"use client";

import { useState, useEffect, useRef, ReactNode } from "react";
import "@fontsource/cabin-sketch";
import "@fontsource/reenie-beanie";
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
import { AppTagId, APP_ATTRIBUTES, APP_TAGS } from "@/lib/app-tags";
import { useTranslation } from "@/lib/hooks/useTranslation";
import { cn } from "@/lib/utils";
import { 
  Menu, X, Home, TrendingUp, Heart, ShoppingCart, Truck, 
  LayoutDashboard, Store, GraduationCap, ClipboardList, 
  Rss, Monitor, Crown, Zap, Check, ArrowRight
} from "lucide-react";

const getAppIcon = (id: AppTagId) => {
  switch (id) {
    case "home": return Home;
    case "business_insights": return TrendingUp;
    case "love_writers": return Heart;
    case "trade_ranking": return ShoppingCart;
    case "furniture_logistics": return Truck;
    case "furniture_layout": return LayoutDashboard;
    case "furniture_store": return Store;
    case "io_mentoring": return GraduationCap;
    case "smart_survey": return ClipboardList;
    case "ai_blog": return Rss;
    case "os_system": return Monitor;
    default: return Home;
  }
};

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
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Chat State
  const [messages, setMessages] = useState<Array<{ role: 'user' | 'assistant' | 'system', content: string | ReactNode }>>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom of chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  const getAppTitleWord = (tagId: string, locale: string) => {
    switch(tagId) {
      case 'business_insights': return locale === 'pt' ? 'Análises' : 'Insights';
      case 'love_writers': return locale === 'pt' ? 'Romances' : 'Stories';
      case 'trade_ranking': return locale === 'pt' ? 'Lojas' : 'Stores';
      case 'furniture_logistics': return locale === 'pt' ? 'Rotas' : 'Routes';
      case 'furniture_layout': return locale === 'pt' ? 'Layouts' : 'Layouts';
      case 'furniture_store': return locale === 'pt' ? 'Vitrines' : 'Stores';
      case 'io_mentoring': return locale === 'pt' ? 'Academias' : 'Academy';
      case 'smart_survey': return locale === 'pt' ? 'Pesquisas' : 'Surveys';
      case 'ai_blog': return locale === 'pt' ? 'Blogs' : 'Blogs';
      case 'os_system': return locale === 'pt' ? 'Sistemas' : 'Systems';
      default: return locale === 'pt' ? 'Coisas' : 'Stuffs';
    }
  }

  // Derived Hero Content
  const heroContent = {
    title: (
      <>
        {locale === 'pt' ? 'Crie ' : 'Build Cool '}
        <span className="text-purple-600">{getAppTitleWord(activeAppTag, locale)}</span>
        {locale === 'pt' && ' Incríveis'}
      </>
    ),
    subtitle: (
      <>
        {locale === 'pt' ? 'Transforme suas ideias em ' : 'Turn your ideas into '}
        <span className="text-pink-500 font-semibold">
          {locale === 'pt' ? 'Produtos IA' : 'AI products'}
        </span>
      </>
    )
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
      setMessages([]);
      setIsTyping(true);
      const timer = setTimeout(() => {
        setIsTyping(false);
        // Replace entire chat instead of accumulating history
        setMessages([{ role: 'assistant', content: initialMessage }]);
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
            } else if (activeAppTag === 'os_system') {
              handleOsSystemSubmit(updatedValues);
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

  const handleOsSystemSubmit = async (values?: Partial<ClassicHeroFormSubmission>) => {
    const currentValues = values || formValues;

    setIsSubmitting(true);
    try {
      sessionStorage.setItem("onboarding_data", JSON.stringify({
        type: "os_system",
        data: currentValues
      }));

      push({
        title: "Iniciando seu I/O OS...",
        description: t("home.toasts.createAccount"),
        variant: "default",
      });

      setTimeout(() => {
        router.push(isSignedIn ? "/admin" : "/sign-up?redirect_url=/admin");
      }, 1000);

    } catch (error) {
      console.error("Failed to capture OS System data:", error);
      push({ title: t("common.error"), description: t("home.toasts.errorOccurred"), variant: "destructive" });
      setIsSubmitting(false);
    }
  };



  return (
    <div className="home-page min-h-screen flex bg-[#0a0a0a]">
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden" 
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={cn(
        "fixed inset-y-0 left-0 z-50 w-72 bg-transparent bg-[url('/images/sidebar-bg.png')] bg-repeat-y bg-right bg-contain text-white flex flex-col transition-transform duration-300 md:translate-x-0 overflow-y-auto",
        isSidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="px-4 pb-4 pt-2 flex flex-col h-full">
          <div className="flex items-center justify-center mb-2 relative shrink-0">
            <Link href="/" className="flex items-center justify-center" onClick={() => setIsSidebarOpen(false)}>
              <Image
                src="/images/logo.png"
                alt="Logo"
                width={140}
                height={40}
                className="object-contain"
                priority
              />
            </Link>
            <button onClick={() => setIsSidebarOpen(false)} className="md:hidden absolute right-0 text-white/70 hover:text-white">
              <X className="w-6 h-6" />
            </button>
          </div>
          
          <div 
            className="flex-1 space-y-0.5 overflow-y-auto overflow-x-hidden pr-2 pb-2 [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-zinc-800 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-zinc-700"
            style={{ scrollbarWidth: 'thin', scrollbarColor: '#27272a transparent' } as React.CSSProperties}
          >
            {APP_TAGS.map(tag => {
              const Icon = getAppIcon(tag.id);
              const isActive = activeAppTag === tag.id;

              return (
                <button
                  key={tag.id}
                  onClick={() => {
                    setActiveAppTag(tag.id);
                    setIsSidebarOpen(false);
                  }}
                  style={{ "--tag-color": tag.color } as React.CSSProperties}
                  className={cn(
                    "group w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl transition-all duration-300 cursor-pointer outline-none border",
                    isActive 
                      ? "bg-[#ccff00] border-[#ccff00]" 
                      : "border-transparent hover:bg-[#ccff00] hover:border-[#ccff00] focus-visible:bg-[#ccff00] focus-visible:border-[#ccff00]"
                  )}
                >
                  <Icon 
                    className={cn(
                      "w-5 h-5 transition-all duration-300 shrink-0", 
                      isActive 
                        ? "scale-110 text-black" 
                        : "text-[var(--tag-color)] group-hover:!text-black group-focus-visible:!text-black"
                    )} 
                  />
                  <span 
                    className={cn(
                      "font-medium text-sm transition-all duration-300 text-left",
                      isActive 
                        ? "text-black" 
                        : "text-white group-hover:!text-black group-focus-visible:!text-black"
                    )}
                  >
                    {t(tag.labelKey)}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="mt-4 w-[80%] shrink-0 rounded-2xl border border-white/20 p-4 bg-transparent relative overflow-hidden">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2">
                <div className="w-7 h-7 rounded-lg bg-purple-600 flex items-center justify-center shrink-0">
                  <Crown className="w-4 h-4 text-white" />
                </div>
                <span className="font-bold text-white tracking-wide text-[13px]">{t("home.sidebar.prime.title") || "I/O PRIME"}</span>
              </div>
              <Zap className="w-4 h-4 text-yellow-400 fill-yellow-400" />
            </div>
            
            <p className="text-white/80 text-[13px] mb-3 font-medium">
              {t("home.sidebar.prime.subtitle") || "Unlock the full power of I/O"}
            </p>
            
            <ul className="space-y-2 mb-4">
              {[
                t("home.sidebar.prime.features.unlimited") || "Unlimited apps",
                t("home.sidebar.prime.features.support") || "Priority support",
                t("home.sidebar.prime.features.analytics") || "Advanced analytics"
              ].map((item, idx) => (
                <li key={idx} className="flex items-center space-x-2 text-white/90 text-xs">
                  <div className="w-4 h-4 rounded-full bg-white/10 flex items-center justify-center shrink-0">
                    <Check className="w-2.5 h-2.5 text-white shrink-0" />
                  </div>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
            
            <button className="w-full bg-[#ccff00] hover:bg-[#b3e600] text-black font-bold py-2.5 px-4 rounded-xl flex items-center justify-center space-x-2 transition-colors duration-300 outline-none">
              <span className="text-[13px] tracking-wide">{t("home.sidebar.prime.button") || "UPGRADE NOW"}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      <div className="flex-1 md:pl-72 flex flex-col min-h-screen relative w-full overflow-hidden bg-[#fff0d4] bg-[url('/images/bg-pattern.png')] bg-repeat bg-auto bg-top">
        <header className="fixed top-0 md:left-72 left-0 right-0 z-30 pointer-events-none transition-all duration-300">
          <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-4 py-4 pointer-events-auto">
            <div className="flex items-center space-x-4">
              <button 
                className="md:hidden text-black hover:text-gray-600 p-1 cursor-pointer"
                onClick={() => setIsSidebarOpen(true)}
              >
                <Menu className="w-6 h-6" />
              </button>
            </div>

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

        <main className="flex-1 pt-24 pb-48 px-4 flex flex-col overflow-y-auto min-h-0 w-full">
          <div className="flex-1" />
          <div className="mx-auto max-w-4xl w-full space-y-4 relative mb-8 shrink-0">
          
            {/* Mascot Image - Absolutely positioned */}
            <div className="absolute left-1/2 -translate-x-1/2 md:left-auto md:translate-x-0 md:right-[60px] top-[-50px] md:top-[-100px] pointer-events-none z-0 opacity-90 w-[120px] sm:w-[150px] md:w-[280px]">
              <Image 
                src="/images/maskot.png" 
                alt="Mascot" 
                width={720} 
                height={680} 
                className="object-contain drop-shadow-2xl w-full h-auto"
                priority
              />
            </div>

            {/* Static Hero Content (Always visible) */}
            <div className="space-y-1 mb-4 relative z-10 max-w-3xl mt-24 md:mt-0 text-center md:text-left">
              <h1 className="text-4xl font-medium tracking-tight text-gray-900 sm:text-5xl" style={{ fontFamily: "'Cabin Sketch', cursive", fontWeight: 500 }}>
                {heroContent.title}
              </h1>
              <p className="text-xl text-gray-600" style={{ fontFamily: "'Reenie Beanie', cursive", fontSize: "2rem" }}>
                {heroContent.subtitle}
              </p>
            </div>

            {/* Chat History */}
            <div className="space-y-4">
              {messages.map((msg, idx) => (
                <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={
                    msg.role === 'user'
                      ? "bg-[#333] text-white rounded-2xl rounded-tr-sm px-5 py-3 max-w-md"
                      : "bg-white border border-gray-100 shadow-sm text-gray-900 rounded-2xl rounded-tl-sm px-5 py-3 max-w-md"
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
          className="md:left-72"
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
    </div>
  );
}
