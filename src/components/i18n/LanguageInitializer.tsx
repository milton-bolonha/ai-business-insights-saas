"use client";

import { useEffect, useRef } from "react";
import { useLanguageStore, Locale } from "@/lib/stores/languageStore";

export function LanguageInitializer({ 
  initialLocale, 
  initialMessages 
}: { 
  initialLocale: Locale;
  initialMessages: Record<string, any>;
}) {
  const initialized = useRef(false);
  if (!initialized.current) {
    useLanguageStore.setState({
      locale: initialLocale,
      messages: initialMessages,
    });
    initialized.current = true;
  }

  // Fallback to load on runtime in case of dynamic switches
  useEffect(() => {
    if (!useLanguageStore.getState().messages || Object.keys(useLanguageStore.getState().messages).length === 0) {
      useLanguageStore.getState().loadMessages(initialLocale);
    }
  }, [initialLocale]);

  return null;
}

