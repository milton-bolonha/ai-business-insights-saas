"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren,
} from "react";

import { computeAdeAppearanceTokens, type AdeAppearanceTokens } from "@/lib/ade-theme";

export interface AdminThemeContextValue {
  baseColor: string;
  appearance: AdeAppearanceTokens;
  setBaseColor: (color: string) => void;
  theme: "ade" | "classic" | "dash";
}

const AdminThemeContext = createContext<AdminThemeContextValue | undefined>(
  undefined
);

const ADE_BASE_COLOR_KEY = "ade-base-color";
const ADE_APPEARANCE_TOKENS_KEY = "ade-appearance-tokens";

export function AdminThemeProvider({ children }: PropsWithChildren) {
  const [baseColor, setBaseColorState] = useState(() => {
    if (typeof window === "undefined") return "#f5f5f0";
    return window.localStorage.getItem(ADE_BASE_COLOR_KEY) || "#f5f5f0";
  });

  const appearance = useMemo(
    () => computeAdeAppearanceTokens(baseColor),
    [baseColor]
  );

  const setBaseColor = useCallback((color: string) => {
    setBaseColorState(color);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(ADE_BASE_COLOR_KEY, color);
      window.localStorage.setItem(ADE_APPEARANCE_TOKENS_KEY, JSON.stringify(computeAdeAppearanceTokens(color)));
    }
  }, []);

  // Apply base color to body on mount and changes
  useEffect(() => {
    if (typeof window !== "undefined") {
      document.body.style.backgroundColor = baseColor;
    }
  }, [baseColor]);

  const value = useMemo<AdminThemeContextValue>(
    () => ({
      baseColor,
      appearance,
      setBaseColor,
      theme: "ade",
    }),
    [baseColor, appearance, setBaseColor]
  );

  return (
    <AdminThemeContext.Provider value={value}>
      {children}
    </AdminThemeContext.Provider>
  );
}

export function useAdminTheme(): AdminThemeContextValue {
  const context = useContext(AdminThemeContext);
  if (!context) {
    throw new Error("useAdminTheme must be used within AdminThemeProvider");
  }
  return context;
}

