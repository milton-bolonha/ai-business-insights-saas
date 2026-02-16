"use client";

import { useCallback, useEffect, useState, useMemo } from "react";
import { usePayment } from "@/lib/state/payment-context";
import { useAuthStore, useWorkspaceStore } from "@/lib/stores";
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
      // Only fetch server usage for members
      if (!auth.isMember) return;

      try {
        const response = await fetch("/api/usage", { cache: "no-store" });
        if (!response.ok) return;
        const data = await response.json().catch(() => null);
        if (cancelled || !data) return;
        setServerUsage(data.usage ?? null);
        setServerLimits(data.limits ?? null);

        // Sync Plan directly to AuthStore if changed
        if (data.plan && auth.user && auth.user.plan !== data.plan) {
          console.log("[usePaymentFlow] Syncing plan:", data.plan);
          auth.setUser({ ...auth.user, plan: data.plan });
        }
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

  // Move mapping functions outside or memoize them
  const mapLimits = useCallback((
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
  }, []);

  const mapUsage = useCallback((
    usage: Record<string, number> | null
  ): Record<GuestAction | string, number> | null => {
    if (!usage) return null;
    return {
      createWorkspace: usage.companiesCount ?? usage.createWorkspace,
      createContact: usage.contactsCount ?? usage.createContact,
      tileChat: usage.tileChatsCount ?? usage.tileChat,
      contactChat: usage.contactChatsCount ?? usage.contactChat,
      regenerate: usage.regenerationsCount ?? usage.regenerate,
      createTile: usage.tilesCount ?? usage.createTile,
    };
  }, []);

  const resolvedLimits = useMemo(() => auth.isGuest
    ? auth.limits
    : mapLimits(serverLimits) || auth.limits, [auth.isGuest, auth.limits, serverLimits, mapLimits]);

  const resolvedUsage = useMemo(() => auth.isGuest
    ? auth.usage
    : mapUsage(serverUsage) || auth.usage, [auth.isGuest, auth.usage, serverUsage, mapUsage]);

  // Sync server usage to global auth store whenever it changes, merging with local inventory
  useEffect(() => {
    // Run for everyone (Guests AND Members) to ensure usage >= local content
    // This repairs cases where usage store was cleared but content remains
    if (resolvedUsage) {
      // Calculate local inventory to ensure we don't show less than what user actually has
      // (Handles cases where server usage tracking was missed or is desynced)
      const workspaces = useWorkspaceStore.getState().workspaces;

      const localCounts = {
        createWorkspace: workspaces.length,
        createTile: workspaces.reduce((acc, ws) => acc + ws.dashboards.reduce((dAcc, d) => dAcc + (d.tiles?.length || 0), 0), 0),
        createContact: workspaces.reduce((acc, ws) => acc + ws.dashboards.reduce((dAcc, d) => dAcc + (d.contacts?.length || 0), 0), 0),
      };

      // Create a clean object with only GuestAction keys
      const cleanUsage: Partial<Record<GuestAction, number>> = {};

      // Merge Strategy: Max(Server, Local)
      if (typeof resolvedUsage.createTile === 'number') {
        cleanUsage.createTile = Math.max(resolvedUsage.createTile, localCounts.createTile);
      }
      if (typeof resolvedUsage.createWorkspace === 'number') {
        cleanUsage.createWorkspace = Math.max(resolvedUsage.createWorkspace, localCounts.createWorkspace);
      }
      if (typeof resolvedUsage.createContact === 'number') {
        cleanUsage.createContact = Math.max(resolvedUsage.createContact, localCounts.createContact);
      }

      // For ephemeral actions (chats/regenerations), trust server or local store
      if (typeof resolvedUsage.tileChat === 'number') cleanUsage.tileChat = resolvedUsage.tileChat;
      if (typeof resolvedUsage.contactChat === 'number') cleanUsage.contactChat = resolvedUsage.contactChat;
      if (typeof resolvedUsage.regenerate === 'number') cleanUsage.regenerate = resolvedUsage.regenerate;

      // Deep equality check to prevent infinite loops
      const currentUsageStr = JSON.stringify({
        createTile: auth.usage.createTile,
        createWorkspace: auth.usage.createWorkspace,
        createContact: auth.usage.createContact,
        tileChat: auth.usage.tileChat,
        contactChat: auth.usage.contactChat,
        regenerate: auth.usage.regenerate
      });
      const newUsageStr = JSON.stringify({
        createTile: cleanUsage.createTile ?? auth.usage.createTile,
        createWorkspace: cleanUsage.createWorkspace ?? auth.usage.createWorkspace,
        createContact: cleanUsage.createContact ?? auth.usage.createContact,
        tileChat: cleanUsage.tileChat ?? auth.usage.tileChat,
        contactChat: cleanUsage.contactChat ?? auth.usage.contactChat,
        regenerate: cleanUsage.regenerate ?? auth.usage.regenerate
      });

      if (currentUsageStr !== newUsageStr) {
        console.log("[usePaymentFlow] Syncing usage (Max of Server/Local):", cleanUsage);
        auth.setUsage(cleanUsage);
      }
    }
  }, [resolvedUsage, auth.setUsage, auth.usage]); // Removed serverUsage/isMember dependencies as they are captured in resolvedUsage

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
