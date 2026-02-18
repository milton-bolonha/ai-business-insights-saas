"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type Status = "idle" | "loading" | "success" | "error" | "canceled";

interface Props {
  sessionId?: string;
  successFlag?: string | null;
  canceledFlag?: string | null;
}

export default function CreateAccountClient({
  sessionId = "",
  successFlag,
  canceledFlag,
}: Props) {
  const router = useRouter();
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState<string>("");

  const isSuccessFlow = useMemo(
    () => successFlag === "true" || !!sessionId,
    [successFlag, sessionId]
  );

  useEffect(() => {
    const run = async () => {
      if (canceledFlag === "true") {
        setStatus("canceled");
        setMessage("Pagamento cancelado. Tente novamente.");
        return;
      }

      if (!isSuccessFlow) {
        setStatus("error");
        setMessage("Sessão inválida ou ausente.");
        return;
      }

      setStatus("loading");
      try {
        const res = await fetch("/api/create-account", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sessionId }),
        });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data?.error || "Falha ao confirmar pagamento");
        }
        const data = await res.json();

        // Update local store to reflect new member status immediately
        const { useAuthStore } = await import("@/lib/stores/authStore");
        useAuthStore.getState().setUser({ role: "member", isPaid: true, plan: data.plan });

        setStatus("success");
        setMessage("Pagamento confirmado. Conta atualizada para member.");

        // Force a hard refresh to ensure all server components re-render with new claims
        setTimeout(() => {
          window.location.href = "/admin";
        }, 1200);
      } catch (err) {
        console.error("[create-account] error", err);
        setStatus("error");
        setMessage(
          err instanceof Error ? err.message : "Falha ao confirmar pagamento"
        );
      }
    };
    run();
  }, [canceledFlag, isSuccessFlow, router, sessionId]);

  const renderStatus = () => {
    switch (status) {
      case "loading":
        return "Validando pagamento e atualizando conta...";
      case "success":
        return "Tudo certo! Redirecionando para o painel...";
      case "canceled":
        return message || "Pagamento cancelado.";
      case "error":
        return message || "Não foi possível confirmar o pagamento.";
      default:
        return "Iniciando confirmação...";
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-md border border-gray-100">
        <h1 className="text-xl font-semibold text-gray-900 mb-2">
          Conclusão do pagamento
        </h1>
        <p className="text-sm text-gray-600 mb-6">
          Estamos confirmando seu pagamento e atualizando seu plano.
        </p>

        <div className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-800">
          {renderStatus()}
        </div>

        <div className="mt-6 flex gap-2">
          <button
            onClick={() => router.push("/admin")}
            className="flex-1 rounded-lg bg-blue-600 px-4 py-2 text-white text-sm font-medium hover:bg-blue-700 transition disabled:opacity-50"
            disabled={status === "loading"}
          >
            Ir para o painel
          </button>
          <button
            onClick={() => router.push("/")}
            className="flex-1 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 transition"
          >
            Voltar
          </button>
        </div>

        <p className="mt-4 text-xs text-gray-500">
          Se algo der errado, informe o suporte com o ID da sessão:{" "}
          {sessionId || "não informado"}.
        </p>
      </div>
    </div>
  );
}
