"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";
import type { PropsWithChildren, ReactNode } from "react";

interface Toast {
  id: string;
  title?: string;
  description?: string;
  variant?: "default" | "destructive" | "success";
  duration?: number;
}

interface ToastContextValue {
  push: (toast: Omit<Toast, "id">) => void;
  dismiss: (id: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: PropsWithChildren): ReactNode {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const push = useCallback((toast: Omit<Toast, "id">) => {
    const id =
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `toast_${Math.random().toString(36).slice(2, 9)}`;
    const duration = toast.duration ?? 5000;
    setToasts((prev) => [
      ...prev,
      {
        id,
        ...toast,
        duration,
      },
    ]);
    if (duration > 0 && typeof window !== "undefined") {
      window.setTimeout(() => {
        setToasts((prev) => prev.filter((item) => item.id !== id));
      }, duration);
    }
  }, []);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const value = useMemo<ToastContextValue>(
    () => ({ push, dismiss }),
    [push, dismiss],
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="fixed bottom-4 left-4 z-50 flex max-w-sm flex-col gap-3">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`w-72 rounded-lg border border-slate-800 bg-slate-900/90 p-4 shadow-lg backdrop-blur transition ${
              toast.variant === "destructive"
                ? "border-red-500/70 text-red-100"
                : toast.variant === "success"
                ? "border-emerald-500/70 text-emerald-100"
                : "text-slate-100"
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                {toast.title ? (
                  <p className="text-sm font-semibold">{toast.title}</p>
                ) : null}
                {toast.description ? (
                  <p className="mt-1 text-sm leading-relaxed text-slate-300">
                    {toast.description}
                  </p>
                ) : null}
              </div>
              <button
                type="button"
                onClick={() => dismiss(toast.id)}
                className="rounded-md border border-transparent p-1 text-xs text-slate-400 transition hover:border-slate-700 hover:text-slate-200"
              >
                ✕
              </button>
            </div>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const value = useContext(ToastContext);
  if (!value) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return value;
}

