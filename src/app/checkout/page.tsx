"use client";

import { useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useToast } from "@/lib/state/toast-context";
import { useTranslation } from "@/lib/hooks/useTranslation";

export default function CheckoutPage() {
    const { user, isLoaded, isSignedIn } = useUser();
    const router = useRouter();
    const { push } = useToast();
    const { t } = useTranslation();
    const [isProcessing, setIsProcessing] = useState(false);

    useEffect(() => {
        if (!isLoaded) return;

        if (!isSignedIn) {
            // If not signed in, redirect to sign-up
            router.push("/sign-up?redirect_url=/checkout");
            return;
        }

        const initiateCheckout = async () => {
            setIsProcessing(true);
            try {
                const response = await fetch("/api/stripe/checkout", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        userId: user.id,
                    }),
                });

                const data = await response.json();

                if (!response.ok) {
                    throw new Error(data.error || "Failed to initiate checkout");
                }

                if (data.url) {
                    window.location.href = data.url;
                } else {
                    throw new Error("No checkout URL returned");
                }
            } catch (error) {
                console.error("Checkout error:", error);
                push({
                    title: t("admin.checkout.failedTitle"),
                    description: error instanceof Error ? error.message : t("admin.checkout.failedDescription"),
                    variant: "destructive",
                });
                setIsProcessing(false);
            }
        };

        initiateCheckout();
    }, [isLoaded, isSignedIn, user, router, push]);

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
            <div className="w-full max-w-md bg-white dark:bg-gray-800 p-8 rounded-lg shadow-lg text-center">
                <div className="mb-6 flex justify-center">
                    <div className="h-12 w-12 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                        <Loader2 className="h-6 w-6 text-blue-600 dark:text-blue-400 animate-spin" />
                    </div>
                </div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                    {t("admin.checkout.preparingTitle")}
                </h1>
                <p className="text-gray-600 dark:text-gray-400">
                    {t("admin.checkout.preparingDescription")}
                </p>
            </div>
        </div>
    );
}
