// Máquinas XState exportadas diretamente para uso com useMachine
export { tileGenerationMachine, tileChatMachine, onboardingMachine } from "@/lib/state/machines";

// Tipos re-exportados para conveniência
export type {
  TileGenerationContext,
  TileChatContext,
  OnboardingContext,
} from "@/lib/state/machines";

// Nota: As máquinas agora são usadas diretamente com useMachine do @xstate/react
// Exemplo de uso:
// import { useMachine } from '@xstate/react';
// import { onboardingMachine } from '@/lib/stores/machineStore';
//
// const [state, send] = useMachine(onboardingMachine);
