import { describe, it, expect, beforeEach, vi } from "vitest";
import { useLanguageStore } from "./languageStore";

// Mock translation files
vi.mock("../../../messages/en.json", () => ({
  default: { welcome: "Welcome" }
}));

vi.mock("../../../messages/pt.json", () => ({
  default: { welcome: "Bem-vindo" }
}));

describe("useLanguageStore", () => {
  beforeEach(() => {
    // Reset Zustand store state to default before each test
    useLanguageStore.setState({
      locale: "pt",
      messages: {},
      isLoading: false
    });
    vi.clearAllMocks();
  });

  it("deve inicializar com valores padrão corretos", () => {
    const state = useLanguageStore.getState();
    expect(state.locale).toBe("pt");
    expect(state.messages).toEqual({});
    expect(state.isLoading).toBe(false);
  });

  it("deve carregar mensagens em português com sucesso", async () => {
    const store = useLanguageStore.getState();
    await store.loadMessages("pt");

    const updatedState = useLanguageStore.getState();
    expect(updatedState.messages).toEqual({ welcome: "Bem-vindo" });
    expect(updatedState.isLoading).toBe(false);
  });

  it("deve carregar mensagens em inglês com sucesso", async () => {
    const store = useLanguageStore.getState();
    await store.loadMessages("en");

    const updatedState = useLanguageStore.getState();
    expect(updatedState.messages).toEqual({ welcome: "Welcome" });
    expect(updatedState.isLoading).toBe(false);
  });

  it("deve atualizar a locale e salvar no cookie", async () => {
    // Mock document.cookie
    let cookieStore: string = "";
    Object.defineProperty(document, "cookie", {
      get: () => cookieStore,
      set: (val) => {
        cookieStore = val;
      },
      configurable: true,
    });

    const store = useLanguageStore.getState();
    await store.setLocale("en");

    const updatedState = useLanguageStore.getState();
    expect(updatedState.locale).toBe("en");
    expect(document.cookie).toContain("NEXT_LOCALE=en");
    expect(updatedState.messages).toEqual({ welcome: "Welcome" });
  });
});
