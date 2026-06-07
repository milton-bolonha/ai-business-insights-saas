import { AppTagId, APP_TAGS } from "@/lib/app-tags";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/lib/hooks/useTranslation";
import Image from "next/image";
import Link from "next/link";
import { 
  ArrowRight, Check, Crown, Zap, X, Home, TrendingUp, Heart, 
  ShoppingCart, Truck, LayoutDashboard, Store, GraduationCap, 
  ClipboardList, Rss, Monitor 
} from "lucide-react";

interface HomeSidebarProps {
  isSidebarOpen: boolean;
  setIsSidebarOpen: (open: boolean) => void;
  activeAppTag: AppTagId;
  setActiveAppTag: (tag: AppTagId) => void;
}

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

export function HomeSidebar({ isSidebarOpen, setIsSidebarOpen, activeAppTag, setActiveAppTag }: HomeSidebarProps) {
  const { t } = useTranslation();

  return (
    <>
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-[60] md:hidden" 
          onClick={() => setIsSidebarOpen(false)}
        />
      )}
      
      {/* Sidebar */}
      <aside className={cn(
        "fixed inset-y-0 left-0 z-[70] w-72 bg-transparent bg-[url('/images/sidebar-bg.png')] bg-repeat-y bg-right bg-contain text-white flex flex-col transition-transform duration-300 md:translate-x-0 overflow-y-auto",
        isSidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="px-4 pb-4 pt-2 flex flex-col h-full">
          {/* Logo Area */}
          <div className="flex items-center justify-center mb-6 pt-2 relative shrink-0">
            <Link href="/" className="flex items-center justify-center" onClick={() => setIsSidebarOpen(false)}>
              <Image
                src="/images/logo.svg"
                alt="Logo"
                width={110}
                height={89}
                className="object-contain"
                priority
              />
            </Link>
            <button onClick={() => setIsSidebarOpen(false)} className="md:hidden absolute right-0 top-2 text-white/70 hover:text-white">
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
    </>
  );
}
