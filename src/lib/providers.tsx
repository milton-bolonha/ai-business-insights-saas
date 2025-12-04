"use client";

import type { PropsWithChildren } from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { ClerkProvider } from "@clerk/nextjs";

import { queryClient } from "@/lib/state/query";
import { ToastProvider } from "@/lib/state/toast-context";
import { PaymentProvider } from "@/lib/state/payment-context";
// Zustand stores são globais - não precisam de providers!
// Contexts migrados para Zustand:
// - AdminThemeContext → uiStore
// - AuthContext → authStore
// - WorkspaceContext → workspaceStore
// - ContentContext → integrado no workspaceStore

import { AuthSync } from "@/components/auth/AuthSync";
import { WorkspaceSync } from "@/components/auth/WorkspaceSync";

export function Providers({ children }: PropsWithChildren) {
  const clerkPublishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;

  if (!clerkPublishableKey) {
    console.warn(
      "[Providers] NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY not found. Running without Clerk authentication."
    );
    return (
      <QueryClientProvider client={queryClient}>
        <PaymentProvider>
          <ToastProvider>
            {children}
            {process.env.NODE_ENV === "development" && <ReactQueryDevtools />}
          </ToastProvider>
        </PaymentProvider>
      </QueryClientProvider>
    );
  }

  return (
    <ClerkProvider publishableKey={clerkPublishableKey}>
      <AuthSync />
      <WorkspaceSync />
      <QueryClientProvider client={queryClient}>
        <PaymentProvider>
          <ToastProvider>
            {children}
            {process.env.NODE_ENV === "development" && <ReactQueryDevtools />}
          </ToastProvider>
        </PaymentProvider>
      </QueryClientProvider>
    </ClerkProvider>
  );
}

