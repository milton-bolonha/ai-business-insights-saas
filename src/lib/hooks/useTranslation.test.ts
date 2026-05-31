import { describe, it, expect, beforeEach, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useTranslation } from "./useTranslation";
import { useLanguageStore } from "../stores/languageStore";

// Mock language store
vi.mock("../stores/languageStore", () => {
  let locale = "pt";
  const messages = {
    pt: {
      simple: "Olá Mundo",
      welcome: "Bem-vindo, {name}!",
      items: "Você tem {count, plural, =0 {nenhum item} =1 {um item} other {{count} itens}}.",
    },
    en: {
      simple: "Hello World",
      welcome: "Welcome, {name}!",
      items: "You have {count, plural, =0 {no items} =1 {one item} other {{count} items}}.",
    },
  };

  return {
    useLanguageStore: () => ({
      locale,
      messages: messages[locale as keyof typeof messages],
      setLocale: (newLocale: string) => {
        locale = newLocale;
      },
    }),
  };
});

describe("useTranslation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("deve traduzir chaves simples", () => {
    const { result } = renderHook(() => useTranslation());
    expect(result.current.t("simple")).toBe("Olá Mundo");
  });

  it("deve substituir parâmetros genéricos", () => {
    const { result } = renderHook(() => useTranslation());
    expect(result.current.t("welcome", { name: "Milton" })).toBe("Bem-vindo, Milton!");
  });

  it("deve lidar com pluralização ICU em Português", () => {
    const { result } = renderHook(() => useTranslation());
    
    expect(result.current.t("items", { count: 0 })).toBe("Você tem nenhum item.");
    expect(result.current.t("items", { count: 1 })).toBe("Você tem um item.");
    expect(result.current.t("items", { count: 5 })).toBe("Você tem 5 itens.");
  });

  it("deve alternar idiomas e atualizar traduções", () => {
    const { result } = renderHook(() => useTranslation());
    expect(result.current.t("simple")).toBe("Olá Mundo");

    act(() => {
      result.current.setLocale("en");
    });

    const { result: newResult } = renderHook(() => useTranslation());
    expect(newResult.current.t("simple")).toBe("Hello World");
    expect(newResult.current.t("welcome", { name: "Milton" })).toBe("Welcome, Milton!");
    expect(newResult.current.t("items", { count: 1 })).toBe("You have one item.");
  });

  it("deve retornar o caminho da chave se não for encontrado", () => {
    const { result } = renderHook(() => useTranslation());
    expect(result.current.t("non.existent.key")).toBe("non.existent.key");
  });
});
