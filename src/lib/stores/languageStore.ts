import { create } from "zustand";
import ptMessages from "../../../messages/pt.json";
import enMessages from "../../../messages/en.json";

export type Locale = "pt" | "en";

export const MESSAGES_MAP: Record<Locale, Record<string, any>> = {
  pt: ptMessages,
  en: enMessages,
};

interface LanguageState {
  locale: Locale;
  messages: Record<string, any>;
  setLocale: (locale: Locale) => void;
}

// Helper to get cookies safely
const getCookie = (name: string): string | null => {
  if (typeof document === "undefined") return null;
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop()?.split(";").shift() || null;
  return null;
};

// Helper to set cookies safely
const setCookie = (name: string, value: string, days = 365) => {
  if (typeof window === "undefined") return;
  const date = new Date();
  date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000);
  document.cookie = `${name}=${value};path=/;expires=${date.toUTCString()};SameSite=Lax`;
};

// Detect initial language - must be consistent between server and client during module initialization
const getInitialLocale = (): Locale => {
  if (typeof document !== "undefined") {
    const cookie = getCookie("NEXT_LOCALE");
    if (cookie === "pt" || cookie === "en") return cookie;
    
    const lang = document.documentElement.getAttribute("lang");
    if (lang) {
      if (lang.startsWith("pt")) return "pt";
      if (lang.startsWith("en")) return "en";
    }
  }
  return "pt";
};

export const useLanguageStore = create<LanguageState>((set) => {
  const initialLocale = getInitialLocale();
  
  // Sync cookie initially in browser
  if (typeof window !== "undefined") {
    setCookie("NEXT_LOCALE", initialLocale);
  }

  return {
    locale: initialLocale,
    messages: MESSAGES_MAP[initialLocale],
    setLocale: (locale: Locale) => {
      setCookie("NEXT_LOCALE", locale);
      set({ locale, messages: MESSAGES_MAP[locale] });
    },
  };
});
