import { Menu } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/lib/hooks/useTranslation";
import { SignInButton, SignUpButton, useUser } from "@clerk/nextjs";
import Link from "next/link";

interface HomeHeaderProps {
  setIsSidebarOpen: (open: boolean) => void;
}

export function HomeHeader({ setIsSidebarOpen }: HomeHeaderProps) {
  const { t, locale, setLocale } = useTranslation();
  const { isSignedIn } = useUser();

  return (
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
  );
}
