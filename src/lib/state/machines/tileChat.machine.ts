import { createMachine, fromPromise, assign } from "xstate";

type ChatAttachment = Record<string, unknown>;

interface ChatApiResponse {
  success: boolean;
  response?: string;
  tile?: {
    content?: string;
  };
}

export interface TileChatContext {
  tileId: string;
  dashboardId: string;
  messages: Array<{
    role: "user" | "assistant";
    content: string;
    attachments?: ChatAttachment[];
  }>;
  isTyping: boolean;
  error: string | null;
  lastMessage?: string;
  lastAttachments?: ChatAttachment[];
}

export type TileChatEvent =
  | {
      type: "SEND_MESSAGE";
      message: string;
      attachments?: ChatAttachment[];
    }
  | { type: "RECEIVE_RESPONSE"; response: string }
  | { type: "ERROR"; error: string }
  | { type: "CLEAR_CHAT" };

interface ChatInput {
  tileId: string;
  dashboardId: string;
  message: string;
  attachments?: ChatAttachment[];
  history: TileChatContext["messages"];
}

// Define the sendMessage actor using fromPromise
const sendMessageActor = fromPromise(async ({ input }: { input: ChatInput }) => {
  const response = await fetch(`/api/workspace/tiles/${input.tileId}/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      dashboardId: input.dashboardId,
      message: input.message,
      attachments: input.attachments,
      history: input.history,
    }),
  });

  if (!response.ok) {
    const errorPayload = (await response.json().catch(() => null)) as
      | { error?: string }
      | null;
    throw new Error(errorPayload?.error || "Failed to send message");
  }

  const payload = (await response.json()) as ChatApiResponse;
  return payload;
});

export const tileChatMachine = createMachine(
  {
    id: "tileChat",
    initial: "idle",
    context: {
      tileId: "",
      dashboardId: "",
      messages: [],
      isTyping: false,
      error: null,
    } as TileChatContext,
    states: {
      idle: {
        on: {
          SEND_MESSAGE: {
            target: "sending",
            actions: "addUserMessage",
          },
        },
      },
      sending: {
        entry: assign({ isTyping: true }),
        invoke: {
          src: "sendMessage",
          input: ({ context }) => ({
            tileId: context.tileId,
            dashboardId: context.dashboardId,
            message: context.lastMessage || "",
            attachments: context.lastAttachments,
            history: context.messages,
          }),
          onDone: {
            target: "idle",
            actions: [
              assign({ isTyping: false }),
              assign({
                messages: ({ context, event }) => [
                  ...context.messages,
                  {
                    role: "assistant" as const,
                    content: event.output?.response || "",
                  },
                ],
              }),
            ],
          },
          onError: {
            target: "error",
            actions: [
              assign({ isTyping: false }),
              assign({
                error: () => "An error occurred while sending the message",
              }),
            ],
          },
        },
      },
      error: {
        on: {
          SEND_MESSAGE: "sending",
          CLEAR_CHAT: {
            target: "idle",
            actions: "clearChat",
          },
        },
      },
    },
  },
  {
    actions: {
      addUserMessage: assign({
        messages: ({ context, event }) => {
          if (event.type !== "SEND_MESSAGE") return context.messages;
          return [
            ...context.messages,
            {
              role: "user" as const,
              content: event.message,
              attachments: event.attachments,
            },
          ];
        },
        lastMessage: ({ event }) => {
          if (event.type !== "SEND_MESSAGE") return undefined;
          return event.message;
        },
        lastAttachments: ({ event }) => {
          if (event.type !== "SEND_MESSAGE") return undefined;
          return event.attachments;
        },
        error: () => null,
      }),
      clearChat: assign({
        messages: () => [],
        error: () => null,
        isTyping: false,
      }),
    },
    actors: {
      sendMessage: sendMessageActor,
    },
  }
);
