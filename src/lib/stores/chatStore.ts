import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { ChatMessage } from "@/lib/types/chat";

/** Maximum number of messages retained in memory and localStorage. */
const MAX_MESSAGES = 150;

/** Keep only the most recent MAX_MESSAGES entries. */
function trimMessages(msgs: ChatMessage[]): ChatMessage[] {
  return msgs.length > MAX_MESSAGES ? msgs.slice(msgs.length - MAX_MESSAGES) : msgs;
}

interface ChatState {
  messages: ChatMessage[];
  isLoading: boolean;
  error: string | null;

  fetchMessages: (workspaceId: string, dashboardId?: string) => Promise<void>;
  addMessage: (message: Omit<ChatMessage, "id" | "createdAt">) => Promise<void>;
  clearMessages: () => void;
}

export const useChatStore = create<ChatState>()(
  persist(
    (set, get) => ({
      messages: [],
      isLoading: false,
      error: null,

      fetchMessages: async (workspaceId, dashboardId) => {
        set({ isLoading: true, error: null });
        try {
          const url = new URL("/api/workspace/chat", window.location.origin);
          url.searchParams.set("workspaceId", workspaceId);
          if (dashboardId) {
            url.searchParams.set("dashboardId", dashboardId);
          }

          const res = await fetch(url.toString(), { cache: "no-store" });
          if (!res.ok) throw new Error("Failed to fetch chat messages");

          const data = await res.json();
          // Trim to cap immediately on load — prevents re-hydrating a bloated array
          set({ messages: trimMessages(data.messages ?? []), isLoading: false });
        } catch (err: any) {
          console.error("fetchMessages error:", err);
          set({ error: err.message, isLoading: false });
        }
      },

      addMessage: async (msg) => {
        // Optimistic update
        const tempId = `temp_${Date.now()}`;
        const tempMsg: ChatMessage = {
          ...msg,
          id: tempId,
          createdAt: new Date().toISOString(),
        };

        set((state) => ({ messages: trimMessages([...state.messages, tempMsg]) }));

        try {
          const res = await fetch("/api/workspace/chat", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(msg),
          });

          if (!res.ok) throw new Error("Failed to save chat message");

          const data = await res.json();
          if (data.success && data.message) {
            // Replace temp message with the confirmed server message
            set((state) => ({
              messages: state.messages.map((m) => (m.id === tempId ? data.message : m)),
            }));
          }
        } catch (err: any) {
          console.error("addMessage error:", err);
          // Rollback optimistic update on error
          set((state) => ({
            messages: state.messages.filter((m) => m.id !== tempId),
            error: err.message,
          }));
        }
      },

      clearMessages: () => set({ messages: [], error: null }),
    }),
    {
      name: "ade-chat-storage",
      partialize: (state) => ({ messages: state.messages }),
    }
  )
);
