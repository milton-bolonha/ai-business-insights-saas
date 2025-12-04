import { createMachine, fromPromise, assign } from "xstate";

type RequestSize = "small" | "medium" | "large";

interface TileGenerationResponse {
  success: boolean;
  tile?: {
    id: string;
    content?: string;
  };
  dashboardId?: string;
  workspaceId?: string;
}

export interface TileGenerationContext {
  prompt: string;
  model: string;
  useMaxPrompt: boolean;
  requestSize: RequestSize;
  dashboardId: string;
  result: TileGenerationResponse | null;
  error: string | null;
  progress: number;
}

export type TileGenerationEvent =
  | {
      type: "START";
      prompt: string;
      model: string;
      useMaxPrompt: boolean;
      requestSize: RequestSize;
      dashboardId: string;
    }
  | { type: "PROGRESS"; progress: number }
  | { type: "CANCEL" }
  | { type: "RETRY" };

interface GenerationInput {
  dashboardId: string;
  prompt: string;
  model: string;
  useMaxPrompt: boolean;
  requestSize: RequestSize;
}

// Define the generate tile actor using fromPromise
const generateTileActor = fromPromise(async ({ input }: { input: GenerationInput }) => {
  const response = await fetch("/api/workspace/tiles", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      dashboardId: input.dashboardId,
      prompt: input.prompt,
      model: input.model,
      useMaxPrompt: input.useMaxPrompt,
      requestSize: input.requestSize,
    }),
  });

  if (!response.ok) {
    const errorPayload = (await response.json().catch(() => null)) as { error?: string } | null;
    throw new Error(errorPayload?.error || "Failed to generate tile");
  }

  const payload = (await response.json()) as TileGenerationResponse;
  return payload;
});

export const tileGenerationMachine = createMachine(
  {
    id: "tileGeneration",
    initial: "idle",
    context: {
      prompt: "",
      model: "gpt-4",
      useMaxPrompt: false,
      requestSize: "medium",
      dashboardId: "",
      result: null,
      error: null,
      progress: 0,
    } as TileGenerationContext,
    states: {
      idle: {
        on: {
          START: {
            target: "generating",
            actions: "setGenerationParams",
          },
        },
      },
      generating: {
        entry: assign({ progress: 0 }),
        invoke: {
          src: "generateTile",
          input: ({ context }) => ({
            dashboardId: context.dashboardId,
            prompt: context.prompt,
            model: context.model,
            useMaxPrompt: context.useMaxPrompt,
            requestSize: context.requestSize,
          }),
          onDone: {
            target: "success",
            actions: assign({
              result: ({ event }) => event.output,
              error: () => null,
            }),
          },
          onError: {
            target: "error",
            actions: assign({
              error: () => "Failed to generate tile",
              result: () => null,
            }),
          },
        },
        on: {
          PROGRESS: {
            actions: assign({
              progress: ({ event }) => event.progress,
            }),
          },
          CANCEL: "cancelled",
        },
      },
      success: {
        on: {
          START: "generating", // Allow regeneration
        },
      },
      error: {
        on: {
          RETRY: "generating",
          START: "generating",
        },
      },
      cancelled: {
        on: {
          START: "generating",
        },
      },
    },
  },
  {
    actions: {
      setGenerationParams: assign({
        prompt: ({ event }) => (event.type === "START" ? event.prompt : ""),
        model: ({ event }) => (event.type === "START" ? event.model : "gpt-4"),
        useMaxPrompt: ({ event }) => (event.type === "START" ? event.useMaxPrompt : false),
        requestSize: ({ event }) =>
          event.type === "START" ? event.requestSize : ("medium" as const),
        dashboardId: ({ event }) => (event.type === "START" ? event.dashboardId : ""),
        error: () => null,
        result: () => null,
      }),
    },
    actors: {
      generateTile: generateTileActor,
    },
  }
);
