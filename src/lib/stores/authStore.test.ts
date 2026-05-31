import { describe, it, expect, beforeEach, vi } from "vitest";
import { useAuthStore } from "./authStore";

describe("useAuthStore", () => {
  beforeEach(() => {
    // Reset Zustand store state to defaults before each test
    useAuthStore.setState({
      user: null,
      isAuthenticated: false,
      limits: {
        tileChat: 50,
        contactChat: 50,
        regenerate: 20,
        createContact: 5,
        createWorkspace: 3,
        createTile: 20,
        wmsAiAssistant: 50,
        wmsInventoryCount: 100,
        ordersCount: 100,
        staffCount: 50,
      },
      usage: {
        tileChat: 0,
        contactChat: 0,
        regenerate: 0,
        createContact: 0,
        createWorkspace: 0,
        createTile: 0,
        wmsAiAssistant: 0,
        wmsInventoryCount: 0,
        ordersCount: 0,
        staffCount: 0,
      },
    });
    vi.clearAllMocks();
  });

  it("deve inicializar com o estado padrão correto", () => {
    const state = useAuthStore.getState();
    expect(state.user).toBeNull();
    expect(state.isAuthenticated).toBe(false);
    expect(state.usage.tileChat).toBe(0);
  });

  it("deve definir o usuário de forma correta", () => {
    const store = useAuthStore.getState();
    const mockUser = { id: "user-123", role: "member" as const, isPaid: true };
    
    store.setUser(mockUser);

    const updated = useAuthStore.getState();
    expect(updated.user).toEqual(mockUser);
    expect(updated.isAuthenticated).toBe(true);
  });

  it("deve gerenciar o consumo e incremento de uso de forma otimista", () => {
    const store = useAuthStore.getState();
    store.setUser({ id: "user-123", role: "member" as const });

    const result = store.consumeUsage("tileChat");
    expect(result.used).toBe(1);
    expect(useAuthStore.getState().usage.tileChat).toBe(1);
  });

  it("deve validar se o membro possui créditos suficientes para realizar ações", () => {
    const store = useAuthStore.getState();
    // Definir créditos no usage/limits do member
    useAuthStore.setState({
      user: { id: "user-123", role: "member", isPaid: true },
      limits: {
        ...useAuthStore.getState().limits,
        creditsTotal: 100,
      } as any,
      usage: {
        ...useAuthStore.getState().usage,
        creditsUsed: 95,
      } as any,
    });

    // Custo de criar tile = 5 créditos. 95 + 5 = 100 <= 100 (Disponível!)
    expect(useAuthStore.getState().canPerformAction("createTile")).toBe(true);

    // Custo de criar workspace = 10 créditos. 95 + 10 = 105 > 100 (Bloqueado!)
    expect(useAuthStore.getState().canPerformAction("createWorkspace")).toBe(false);
  });

  it("deve redefinir o uso com sucesso", () => {
    const store = useAuthStore.getState();
    useAuthStore.setState({
      usage: {
        tileChat: 10,
        contactChat: 5,
        regenerate: 2,
        createContact: 1,
        createWorkspace: 1,
        createTile: 4,
        wmsAiAssistant: 0,
        wmsInventoryCount: 0,
        ordersCount: 0,
        staffCount: 0,
      },
    });

    store.resetUsage();
    expect(useAuthStore.getState().usage.tileChat).toBe(0);
    expect(useAuthStore.getState().usage.contactChat).toBe(0);
  });
});
