import { createMachine, assign, fromPromise } from "xstate";

interface OnboardingUserData {
  company: string;
  website: string;
  goals: string[];
  preferences: Record<string, unknown>;
}

interface WorkspaceGenerationResponse {
  workspaceId?: string;
  dashboardId?: string;
  success?: boolean;
  error?: string;
}

export interface OnboardingContext {
  currentStep: number;
  totalSteps: number;
  userData: OnboardingUserData;
  error: string | null;
  completed: boolean;
}

export type OnboardingEvent =
  | { type: "NEXT" }
  | { type: "PREV" }
  | {
      type: "UPDATE_DATA";
      data: Partial<OnboardingUserData>;
    }
  | { type: "COMPLETE" }
  | { type: "ERROR"; error: string };

// Define the createWorkspace actor using fromPromise
const createWorkspaceActor = fromPromise(
  async ({ input }: { input: OnboardingUserData }) => {
    const response = await fetch("/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        targetCompany: input.company,
        targetWebsite: input.website,
        goals: input.goals,
        preferences: input.preferences,
      }),
    });

    if (!response.ok) {
      throw new Error("Failed to create workspace");
    }

    return (await response.json()) as WorkspaceGenerationResponse;
  }
);

export const onboardingMachine = createMachine(
  {
    id: "onboarding",
    initial: "step1",
    context: {
      currentStep: 1,
      totalSteps: 4,
      userData: {
        company: "",
        website: "",
        goals: [],
        preferences: {},
      },
      error: null,
      completed: false,
    } as OnboardingContext,
    states: {
      step1: {
        // Passo 1: Informações da empresa
        on: {
          NEXT: {
            target: "step2",
            guard: "hasCompanyInfo",
          },
          UPDATE_DATA: {
            actions: assign({
              userData: ({ context, event }) => ({
                ...context.userData,
                ...event.data,
              }),
            }),
          },
        },
      },
      step2: {
        // Passo 2: Website e objetivos
        on: {
          NEXT: "step3",
          PREV: "step1",
          UPDATE_DATA: {
            actions: assign({
              userData: ({ context, event }) => ({
                ...context.userData,
                ...event.data,
              }),
            }),
          },
        },
      },
      step3: {
        // Passo 3: Preferências
        on: {
          NEXT: "step4",
          PREV: "step2",
          UPDATE_DATA: {
            actions: assign({
              userData: ({ context, event }) => ({
                ...context.userData,
                ...event.data,
              }),
            }),
          },
        },
      },
      step4: {
        // Passo 4: Confirmação e criação do workspace
        on: {
          COMPLETE: "creating",
          PREV: "step3",
        },
      },
      creating: {
        invoke: {
          src: "createWorkspace",
          input: ({ context }) => context.userData,
          onDone: {
            target: "completed",
            actions: assign({ completed: true }),
          },
          onError: {
            target: "step4",
            actions: assign({
              error: () => "An error occurred during onboarding",
            }),
          },
        },
      },
      completed: {
        type: "final",
      },
    },
  },
  {
    guards: {
      hasCompanyInfo: ({ context }) => !!context.userData.company.trim(),
    },
    actors: {
      createWorkspace: createWorkspaceActor,
    },
  }
);
