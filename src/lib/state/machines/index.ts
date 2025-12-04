export { tileGenerationMachine } from "./tileGeneration.machine";
export { tileChatMachine } from "./tileChat.machine";
export { onboardingMachine } from "./onboarding.machine";

// Tipos para facilitar uso
export type {
  TileGenerationContext,
  TileGenerationEvent,
} from "./tileGeneration.machine";
export type { TileChatContext, TileChatEvent } from "./tileChat.machine";
export type { OnboardingContext, OnboardingEvent } from "./onboarding.machine";
