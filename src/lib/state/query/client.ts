import { QueryClient } from "@tanstack/react-query";

type StatusError = {
  status?: number;
};

const hasStatusCode = (error: unknown): error is StatusError =>
  typeof error === "object" && error !== null && "status" in error;

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Cache por 5 minutos (dados frescos)
      staleTime: 1000 * 60 * 5,
      // Garbage collection após 30 minutos
      gcTime: 1000 * 60 * 30,
      // Retry inteligente
      retry: (failureCount, error: unknown) => {
        // Não retry em auth errors
        if (hasStatusCode(error) && (error.status === 401 || error.status === 403)) {
          return false;
        }
        // Não retry em 4xx client errors
        if (hasStatusCode(error) && error.status !== undefined && error.status >= 400 && error.status < 500) {
          return false;
        }
        // Retry até 3 vezes para outros erros
        return failureCount < 3;
      },
      // Refetch em foco da janela
      refetchOnWindowFocus: true,
      // Refetch em reconnect
      refetchOnReconnect: true,
      // Background refetch
      refetchOnMount: true,
      // Network mode
      networkMode: "online",
    },
    mutations: {
      retry: false,
      // Optimistic updates
      onError: (error: unknown, variables: unknown, context: unknown) => {
        // Reverter optimistic updates em erro
        console.error("Mutation error:", error);
      },
    },
  },
});
