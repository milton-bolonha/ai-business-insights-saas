"use client";

import { useCallback, useState } from "react";
import { usePayment } from "@/lib/state/payment-context";
import { useAuthStore } from "@/lib/stores";
import type { GuestAction } from "@/lib/stores/authStore";

export function usePaymentFlow() {
  // Keeping hook for compatibility even if currently unused
  usePayment();
  const auth = useAuthStore();

  const [isUpgradeModalOpen, setUpgradeModalOpen] = useState(false);

  const ensureAllowance = useCallback(
    (action: GuestAction) => {
      const result = auth.canPerformAction(action);
      console.log('[DEBUG] usePaymentFlow.ensureAllowance:', { action, result, userRole: auth.isMember ? 'member' : 'guest' });
      return result;
    },
    [auth]
  );

  const commitUsage = useCallback(
    (action: GuestAction) => {
      auth.consumeUsage(action);
    },
    [auth]
  );

  const startCheckout = useCallback(() => {
    return auth.startCheckout();
  }, [auth]);

  const confirmMembership = useCallback(() => {
    setUpgradeModalOpen(false);
  }, []);

  return {
    isGuest: auth.isGuest,
    usage: auth.usage,
    limits: auth.limits,
    upgradeReason: "limit_exceeded",
    isUpgradeModalOpen,
    setUpgradeModalOpen,
    stripeCheckoutUrl: process.env.NEXT_PUBLIC_STRIPE_CHECKOUT_URL,
    ensureAllowance,
    commitUsage,
    startCheckout,
    confirmMembership,
  };
}

