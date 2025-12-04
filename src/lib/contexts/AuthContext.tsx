"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren,
} from "react";

export type GuestAction =
  | "tileChat"
  | "contactChat"
  | "regenerate"
  | "createContact"
  | "createWorkspace";

export interface UsageResult {
  action: GuestAction;
  allowed: boolean;
  used: number;
  remaining: number;
  limit: number;
}

type UsageCounts = Record<GuestAction, number>;

export interface AuthContextValue {
  user: { role: "guest" | "member"; isPaid?: boolean } | null;
  canPerformAction: (action: string) => boolean;
  evaluateUsage: (action: GuestAction) => UsageResult;
  consumeUsage: (action: GuestAction) => UsageResult;
  resetUsage: () => void;
  // Legacy compatibility
  isMember: boolean;
  isGuest: boolean;
  limits: Record<GuestAction, number>;
  usage: UsageCounts;
  startCheckout: () => boolean;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const MEMBERSHIP_STORAGE_KEY = "insights_membership_status";
const USAGE_STORAGE_KEY = "insights_guest_usage_v1";
const USAGE_VERSION = 1;
const ONE_DAY_MS = 24 * 60 * 60 * 1000;

const DEFAULT_LIMITS: Record<GuestAction, number> = {
  tileChat: 5,
  contactChat: 5,
  regenerate: 5,
  createContact: 5,
  createWorkspace: 3,
};

interface StoredUsageData {
  version: number;
  lastReset: number;
  counts: Partial<Record<GuestAction, number>>;
}

function createInitialUsage(): StoredUsageData {
  return {
    version: USAGE_VERSION,
    lastReset: Date.now(),
    counts: {},
  };
}

function loadStoredUsage(): StoredUsageData {
  if (typeof window === "undefined") {
    return createInitialUsage();
  }
  try {
    const raw = window.localStorage.getItem(USAGE_STORAGE_KEY);
    if (!raw) return createInitialUsage();
    const parsed = JSON.parse(raw) as StoredUsageData;
    if (
      !parsed ||
      parsed.version !== USAGE_VERSION ||
      typeof parsed.lastReset !== "number" ||
      !parsed.counts
    ) {
      return createInitialUsage();
    }
    return parsed;
  } catch {
    return createInitialUsage();
  }
}

function saveUsage(data: StoredUsageData) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(USAGE_STORAGE_KEY, JSON.stringify(data));
  } catch (error) {
    console.error("[AuthContext] ❌ Failed to save usage:", error);
  }
}

function ensureFreshUsage(data: StoredUsageData): StoredUsageData {
  const shouldReset =
    data.version !== USAGE_VERSION || Date.now() - data.lastReset > ONE_DAY_MS;
  if (shouldReset) {
    return createInitialUsage();
  }
  return data;
}

function buildUsageSnapshot(data: StoredUsageData): UsageCounts {
  const counts = data.counts ?? {};
  return {
    tileChat: counts.tileChat ?? 0,
    contactChat: counts.contactChat ?? 0,
    regenerate: counts.regenerate ?? 0,
    createContact: counts.createContact ?? 0,
    createWorkspace: counts.createWorkspace ?? 0,
  };
}

function getMembershipStatus(): "guest" | "member" {
  if (typeof window === "undefined") return "guest";
  const stored = window.localStorage.getItem(MEMBERSHIP_STORAGE_KEY);
  return stored === "member" ? "member" : "guest";
}

export function AuthProvider({ children }: PropsWithChildren) {
  const [status, setStatus] = useState<"guest" | "member">(() =>
    typeof window === "undefined" ? "guest" : getMembershipStatus()
  );
  const [usageData, setUsageData] = useState<StoredUsageData>(() =>
    ensureFreshUsage(loadStoredUsage())
  );

  useEffect(() => {
    const fresh = ensureFreshUsage(usageData);
    if (fresh === usageData) {
      return undefined;
    }

    const frame = requestAnimationFrame(() => {
      setUsageData(fresh);
      saveUsage(fresh);
    });

    return () => cancelAnimationFrame(frame);
  }, [usageData]);

  const usage = useMemo(() => buildUsageSnapshot(usageData), [usageData]);

  const evaluateUsage = useCallback(
    (action: GuestAction): UsageResult => {
      if (status === "member") {
        return {
          action,
          allowed: true,
          used: 0,
          remaining: Infinity,
          limit: Infinity,
        };
      }

      const limit = DEFAULT_LIMITS[action];
      const used = usage[action];
      const remaining = Math.max(0, limit - used);

      return {
        action,
        allowed: used < limit,
        used,
        remaining,
        limit,
      };
    },
    [status, usage]
  );

  const consumeUsage = useCallback(
    (action: GuestAction): UsageResult => {
      if (status === "member") {
        return {
          action,
          allowed: true,
          used: 0,
          remaining: Infinity,
          limit: Infinity,
        };
      }

      const result = evaluateUsage(action);
      if (!result.allowed) {
        return result;
      }

      const updated = {
        ...usageData,
        counts: {
          ...usageData.counts,
          [action]: (usageData.counts[action] ?? 0) + 1,
        },
      };

      setUsageData(updated);
      saveUsage(updated);

      return {
        ...result,
        used: result.used + 1,
        remaining: result.remaining - 1,
      };
    },
    [status, usageData, evaluateUsage]
  );

  const resetUsage = useCallback(() => {
    const fresh = createInitialUsage();
    setUsageData(fresh);
    saveUsage(fresh);
  }, []);

  const canPerformAction = useCallback(
    (action: string): boolean => {
      if (status === "member") return true;
      return evaluateUsage(action as GuestAction).allowed;
    },
    [status, evaluateUsage]
  );

  const startCheckout = useCallback((): boolean => {
    const checkoutUrl = process.env.NEXT_PUBLIC_STRIPE_CHECKOUT_URL;
    if (checkoutUrl) {
      window.location.href = checkoutUrl;
      return true;
    }
    return false;
  }, []);

  const contextValue = useMemo<AuthContextValue>(
    () => ({
      user: {
        role: status,
        isPaid: status === "member",
      },
      canPerformAction,
      evaluateUsage,
      consumeUsage,
      resetUsage,
      isMember: status === "member",
      isGuest: status === "guest",
      limits: DEFAULT_LIMITS,
      usage,
      startCheckout,
    }),
    [
      status,
      canPerformAction,
      evaluateUsage,
      consumeUsage,
      resetUsage,
      usage,
      startCheckout,
    ]
  );

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}

