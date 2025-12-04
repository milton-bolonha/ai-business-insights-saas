"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  type ReactNode,
} from "react";

export type PaymentStatus =
  | "pending"
  | "verifying"
  | "paid"
  | "failed"
  | "onboarding";

export interface PaymentContextValue {
  status: PaymentStatus;
  email?: string;
  plan?: "FREE" | "PRO" | "PRO_PLUS";
  sessionId?: string;
  verifyPayment: (sessionId?: string, email?: string) => Promise<boolean>;
  completePayment: (sessionId?: string, email?: string) => Promise<boolean>;
  clearStatus: () => void;
}

const PaymentContext = createContext<PaymentContextValue | undefined>(
  undefined
);

export function PaymentProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<PaymentStatus>("pending");
  const [email, setEmail] = useState<string | undefined>();
  const [plan, setPlan] = useState<"FREE" | "PRO" | "PRO_PLUS" | undefined>();
  const [sessionId, setSessionId] = useState<string | undefined>();

  const verifyPayment = useCallback(
    async (sessionIdParam?: string, emailParam?: string): Promise<boolean> => {
      const sid = sessionIdParam || sessionId;
      const eml = emailParam || email;

      if (!sid && !eml) {
        return false;
      }

      setStatus("verifying");

      try {
        const params = new URLSearchParams();
        if (sid) params.set("session_id", sid);
        if (eml) params.set("email", eml);

        const response = await fetch(
          `/api/payment/verify?${params.toString()}`
        );
        const result = await response.json();

        if (result.paid) {
          setStatus("paid");
          setEmail(result.email);
          setPlan(result.plan);
          if (result.sessionId) setSessionId(result.sessionId);
          return true;
        } else {
          setStatus("failed");
          return false;
        }
      } catch (error) {
        setStatus("failed");
        return false;
      }
    },
    [sessionId, email]
  );

  const completePayment = useCallback(
    async (sessionIdParam?: string, emailParam?: string): Promise<boolean> => {
      return verifyPayment(sessionIdParam, emailParam);
    },
    [verifyPayment]
  );

  const clearStatus = useCallback(() => {
    setStatus("pending");
    setEmail(undefined);
    setPlan(undefined);
    setSessionId(undefined);
  }, []);

  return (
    <PaymentContext.Provider
      value={{
        status,
        email,
        plan,
        sessionId,
        verifyPayment,
        completePayment,
        clearStatus,
      }}
    >
      {children}
    </PaymentContext.Provider>
  );
}

export function usePayment(): PaymentContextValue {
  const context = useContext(PaymentContext);
  if (!context) {
    throw new Error("usePayment must be used within PaymentProvider");
  }
  return context;
}

