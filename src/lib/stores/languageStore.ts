import { create } from "zustand";

export type Locale = "pt" | "en";

interface LanguageState {
  locale: Locale;
  messages: Record<string, any>;
  isLoading: boolean;
  setLocale: (locale: Locale) => Promise<void>;
  loadMessages: (locale: Locale) => Promise<void>;
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

// Detect initial language
const getInitialLocale = (): Locale => {
  if (typeof document !== "undefined") {
    const lang = document.documentElement.getAttribute("lang");
    if (lang) {
      if (lang.startsWith("pt")) return "pt";
      if (lang.startsWith("en")) return "en";
    }
    
    const cookie = getCookie("NEXT_LOCALE");
    if (cookie === "pt" || cookie === "en") return cookie;
  }
  return "pt"; // Default fallback
};

export const useLanguageStore = create<LanguageState>((set, get) => {
  const initialLocale = getInitialLocale();

  return {
    locale: initialLocale,
    messages: {}, // Start empty, populated dynamically by LanguageInitializer or async load
    isLoading: false,
    loadMessages: async (locale: Locale) => {
      set({ isLoading: true });
      try {
        let loadedMessages;
        if (locale === "en") {
          loadedMessages = await import("../../../messages/en.json").then(m => m.default);
        } else {
          loadedMessages = await import("../../../messages/pt.json").then(m => m.default);
        }
        set({ messages: loadedMessages, isLoading: false });
      } catch (err) {
        console.error("Failed to load translation bundle asynchronously", err);
        set({ isLoading: false });
      }
    },
    setLocale: async (locale: Locale) => {
      setCookie("NEXT_LOCALE", locale);
      set({ locale });
      await get().loadMessages(locale);
    },
  };
});
