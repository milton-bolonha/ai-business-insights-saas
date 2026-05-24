"use client";

import { useRef } from "react";
import { useLanguageStore, MESSAGES_MAP, Locale } from "@/lib/stores/languageStore";

export function LanguageInitializer({ initialLocale }: { initialLocale: Locale }) {
  const initialized = useRef(false);
  if (!initialized.current) {
    useLanguageStore.setState({
      locale: initialLocale,
      messages: MESSAGES_MAP[initialLocale],
    });
    initialized.current = true;
  }
  return null;
}
