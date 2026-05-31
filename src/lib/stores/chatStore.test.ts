import { describe, it, expect, beforeEach, vi } from "vitest";
import { useChatStore } from "./chatStore";

describe("useChatStore", () => {
  beforeEach(() => {
    // Reset Zustand store state to defaults
    useChatStore.setState({
      messages: [],
      isLoading: false,
      error: null,
    });
    vi.clearAllMocks();
  });

  it("deve inicializar com o estado padrão correto", () => {
    const state = useChatStore.getState();
    expect(state.messages).toEqual([]);
    expect(state.isLoading).toBe(false);
    expect(state.error).toBeNull();
  });

  it("deve buscar mensagens com sucesso da API", async () => {
    const mockMessages = [
      { id: "msg-1", content: "Olá", role: "user", createdAt: "2026-05-31T10:00:00Z" },
      { id: "msg-2", content: "Como posso ajudar?", role: "assistant", createdAt: "2026-05-31T10:01:00Z" },
    ];

    global.fetch = vi.fn().mockImplementation(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ messages: mockMessages }),
      } as Response)
    );

    const store = useChatStore.getState();
    await store.fetchMessages("workspace-123", "dashboard-456");

    expect(global.fetch).toHaveBeenCalled();
    expect(useChatStore.getState().messages).toEqual(mockMessages);
    expect(useChatStore.getState().isLoading).toBe(false);
  });

  it("deve limitar o histórico a 150 mensagens via trimMessages", async () => {
    const largeMessageList = Array.from({ length: 160 }, (_, idx) => ({
      id: `msg-${idx}`,
      content: `Mensagem ${idx}`,
      role: "user" as const,
      createdAt: new Date().toISOString(),
    }));

    global.fetch = vi.fn().mockImplementation(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ messages: largeMessageList }),
      } as Response)
    );

    const store = useChatStore.getState();
    await store.fetchMessages("workspace-123");

    const messages = useChatStore.getState().messages;
    expect(messages.length).toBe(150);
    expect(messages[0].id).toBe("msg-10"); // First 10 messages should be trimmed
  });

  it("deve gerenciar atualização otimista com sucesso e confirmar com o servidor", async () => {
    const serverMessage = {
      id: "msg-server-confirmed",
      content: "Mensagem Enviada",
      role: "user" as const,
      createdAt: new Date().toISOString(),
    };

    global.fetch = vi.fn().mockImplementation(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ success: true, message: serverMessage }),
      } as Response)
    );

    const store = useChatStore.getState();
    const addPromise = store.addMessage({
      content: "Mensagem Enviada",
      role: "user",
    });

    // Check optimistic update in memory
    const messagesDuringSend = useChatStore.getState().messages;
    expect(messagesDuringSend.length).toBe(1);
    expect(messagesDuringSend[0].id).toContain("temp_");

    await addPromise;

    // Check replaced confirmed message
    const messagesAfterSend = useChatStore.getState().messages;
    expect(messagesAfterSend.length).toBe(1);
    expect(messagesAfterSend[0].id).toBe("msg-server-confirmed");
  });

  it("deve realizar rollback da mensagem otimista em caso de erro da API", async () => {
    global.fetch = vi.fn().mockImplementation(() =>
      Promise.resolve({
        ok: false,
        status: 500,
      } as Response)
    );

    const store = useChatStore.getState();
    const addPromise = store.addMessage({
      content: "Mensagem Falha",
      role: "user",
    });

    // Temp message is in memory optimistically
    expect(useChatStore.getState().messages.length).toBe(1);

    await addPromise;

    // Message is rolled back because of failure
    expect(useChatStore.getState().messages).toEqual([]);
    expect(useChatStore.getState().error).toBe("Failed to save chat message");
  });

  it("deve limpar mensagens usando clearMessages", () => {
    useChatStore.setState({
      messages: [{ id: "1", content: "Oi", role: "user", createdAt: "now" }],
      error: "some error",
    });

    useChatStore.getState().clearMessages();

    expect(useChatStore.getState().messages).toEqual([]);
    expect(useChatStore.getState().error).toBeNull();
  });
});
