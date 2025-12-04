import { useSyncExternalStore } from "react";

let hydratedFlag = false;

const subscribeToHydration = (callback: () => void) => {
  if (!hydratedFlag) {
    hydratedFlag = true;
    callback();
  }
  return () => undefined;
};

const getHydratedSnapshot = () => hydratedFlag;
const getServerSnapshot = () => false;

/**
 * Hook para garantir que o componente só renderize após a hidratação completa.
 * Essencial para stores com persistência em Next.js (SSR-safe).
 */
export function useIsHydrated(): boolean {
  return useSyncExternalStore(
    subscribeToHydration,
    getHydratedSnapshot,
    getServerSnapshot
  );
}

/**
 * Hook para obter valor de store apenas após hidratação.
 * Previne erros de hidratação em Next.js.
 */
export function useHydratedStore<T>(store: () => T): T | null {
  const hydrated = useIsHydrated();
  return hydrated ? store() : null;
}
