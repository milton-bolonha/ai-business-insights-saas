"use client";

import { useCallback, useEffect, useState } from "react";
import { usePayment } from "@/lib/state/payment-context";
import { useAuthStore } from "@/lib/stores";
import type { GuestAction } from "@/lib/stores/authStore";
import type { UsageType } from "@/lib/saas/usage-service";

export function usePaymentFlow() {
  // Keeping hook for compatibility even if currently unused
  usePayment();
  const auth = useAuthStore();

  const [isUpgradeModalOpen, setUpgradeModalOpen] = useState(false);
  const [serverUsage, setServerUsage] = useState<Record<
    UsageType,
    number
  > | null>(null);
  const [serverLimits, setServerLimits] = useState<Record<
    string,
    number
  > | null>(null);

  const ensureAllowance = useCallback(
    (action: GuestAction) => {
      const result = auth.canPerformAction(action);
      console.log("[DEBUG] usePaymentFlow.ensureAllowance:", {
        action,
        result,
        userRole: auth.isMember ? "member" : "guest",
      });
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

  const startCheckout = useCallback(async () => {
    try {
      let stored = "";
      if (typeof window !== "undefined") {
        stored = localStorage.getItem("guest_checkout_user_id") || "";
        if (!stored) {
          stored = `guest_${crypto.randomUUID()}`;
          localStorage.setItem("guest_checkout_user_id", stored);
        }
      }
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: stored || "guest_temp" }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.url) {
        console.error("[usePaymentFlow] checkout failed", data);
        return false;
      }
      if (typeof window !== "undefined") {
        window.location.href = data.url as string;
      }
      return true;
    } catch (err) {
      console.error("[usePaymentFlow] checkout error", err);
      return false;
    }
  }, []);

  const confirmMembership = useCallback(() => {
    setUpgradeModalOpen(false);
  }, []);

  // Carregar limites/uso reais do servidor (members e guests)
  useEffect(() => {
    let cancelled = false;
    const loadServerUsage = async () => {
      try {
        const response = await fetch("/api/usage", { cache: "no-store" });
        if (!response.ok) return;
        const data = await response.json().catch(() => null);
        if (cancelled || !data) return;
        setServerUsage(data.usage ?? null);
        setServerLimits(data.limits ?? null);
      } catch (err) {
        console.warn(
          "[usePaymentFlow] Failed to fetch server usage/limits",
          err
        );
      }
    };
    loadServerUsage();
    return () => {
      cancelled = true;
    };
  }, [auth.isMember]);

  const mapLimits = (
    limits: Record<string, number> | null
  ): Record<GuestAction | string, number> | null => {
    if (!limits) return null;
    return {
      createWorkspace: limits.companiesCount ?? limits.createWorkspace,
      createContact: limits.contactsCount ?? limits.createContact,
      tileChat: limits.tileChatsCount ?? limits.tileChat,
      contactChat: limits.contactChatsCount ?? limits.contactChat,
      regenerate: limits.regenerationsCount ?? limits.regenerate,
    };
  };

  const mapUsage = (
    usage: Record<string, number> | null
  ): Record<GuestAction | string, number> | null => {
    if (!usage) return null;
    return {
      createWorkspace: usage.companiesCount ?? usage.createWorkspace,
      createContact: usage.contactsCount ?? usage.createContact,
      tileChat: usage.tileChatsCount ?? usage.tileChat,
      contactChat: usage.contactChatsCount ?? usage.contactChat,
      regenerate: usage.regenerationsCount ?? usage.regenerate,
    };
  };

  const resolvedLimits = auth.isGuest
    ? auth.limits
    : mapLimits(serverLimits) || auth.limits;

  const resolvedUsage = auth.isGuest
    ? auth.usage
    : mapUsage(serverUsage) || auth.usage;

  return {
    isGuest: auth.isGuest,
    usage: resolvedUsage,
    limits: resolvedLimits,
    serverUsage,
    serverLimits,
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
