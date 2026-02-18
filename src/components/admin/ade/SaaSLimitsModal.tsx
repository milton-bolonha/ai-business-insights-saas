"use client";

import { X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import type { AdeAppearanceTokens } from "@/lib/ade-theme";
import { useAuthStore, useUsage, useLimits } from "@/lib/stores/authStore";
import { useClerk, useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";

interface SaaSLimitsModalProps {
    isOpen: boolean;
    onClose: () => void;
    appearance: AdeAppearanceTokens;
    featureLocked?: string;
}

function UsageBar({ label, current, max, color }: { label: string, current: number, max: number, color: string }) {
    const percentage = Math.min(100, Math.max(0, (current / max) * 100));
    return (
        <div className="mb-4">
            <div className="flex justify-between mb-2">
                <span className="font-medium">{label}</span>
                <span className="text-sm text-gray-500">{current} / {max}</span>
            </div>
            <div className="h-2 w-full rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden">
                <div
                    className={`h-full rounded-full transition-all duration-500 ease-out ${color}`}
                    style={{ width: `${percentage}%` }}
                />
            </div>
        </div>
    );
}


function PaymentHistoryList() {
    const [payments, setPayments] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        fetch("/api/user/payments")
            .then((res) => {
                if (!res.ok) throw new Error("Failed to load");
                return res.json();
            })
            .then((data) => setPayments(data.purchases || []))
            .catch(() => setError("Failed to load history"))
            .finally(() => setLoading(false));
    }, []);

    if (loading) return <div className="text-center py-8 text-gray-500">Loading history...</div>;
    if (error) return <div className="text-center py-8 text-red-500">{error}</div>;
    if (payments.length === 0) return <div className="text-center py-8 text-gray-500">No payment history found.</div>;

    return (
        <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2">
            {payments.map((p) => (
                <div key={p._id} className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <div>
                        <div className="font-semibold capitalize">{p.plan || "Membership"} Plan</div>
                        <div className="text-xs text-gray-500">{new Date(p.createdAt).toLocaleDateString()}</div>
                    </div>
                    <div className="text-right">
                        <div className="font-bold">{(p.amount / 100).toLocaleString("en-US", { style: "currency", currency: p.currency || "USD" })}</div>
                        <div className={`text-xs px-2 py-0.5 rounded-full inline-block ${p.status === 'paid' || p.status === 'complete' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-yellow-100 text-yellow-700'}`}>
                            {p.status}
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}

export function SaaSLimitsModal({ isOpen, onClose, appearance, featureLocked }: SaaSLimitsModalProps) {
    const usage = useUsage();
    const limits = useLimits();
    const [tab, setTab] = useState<"usage" | "payments">("usage");

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl dark:bg-gray-900"
                style={{ color: appearance.textColor }}
            >
                <div className="flex items-center justify-between border-b px-6 py-4 dark:border-gray-800">
                    <h3 className="text-lg font-semibold">
                        {featureLocked ? "Feature Locked" : "Usage Limits"}
                    </h3>
                    <button
                        onClick={onClose}
                        className="rounded-full p-1 hover:bg-gray-100 dark:hover:bg-gray-800"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <div className="flex border-b border-gray-200 dark:border-gray-800">
                    <button
                        onClick={() => setTab("usage")}
                        className={`flex-1 py-3 text-sm font-medium ${tab === "usage" ? "border-b-2 border-blue-500 text-blue-600 dark:text-blue-400" : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"}`}
                    >
                        Usage Limits
                    </button>
                    <button
                        onClick={() => setTab("payments")}
                        className={`flex-1 py-3 text-sm font-medium ${tab === "payments" ? "border-b-2 border-blue-500 text-blue-600 dark:text-blue-400" : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"}`}
                    >
                        Payment History
                    </button>
                </div>

                <div className="p-6">
                    {tab === "usage" ? (
                        <div className="space-y-6">

                            {featureLocked ? (
                                <div className="text-center py-4">
                                    <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-rose-100 dark:bg-rose-900/30">
                                        <span className="text-3xl">🔒</span>
                                    </div>
                                    <h4 className="mb-2 text-xl font-bold">
                                        {featureLocked}
                                    </h4>
                                    <p className="mb-6 text-gray-500 dark:text-gray-400">
                                        This feature is available exclusively for <strong>Pro</strong> members.
                                        Upgrade your plan to unlock it immediately.
                                    </p>
                                </div>
                            ) : (
                                <>
                                    {/* Arcs Usage */}
                                    <UsageBar
                                        label="Book Arcs"
                                        current={usage.createTile || 0}
                                        max={limits.createTile || 20}
                                        color="bg-rose-500"
                                    />

                                    {/* Characters Usage */}
                                    <UsageBar
                                        label="Characters"
                                        current={usage.createContact || 0}
                                        max={limits.createContact || 5}
                                        color="bg-orange-500"
                                    />

                                    {/* Workspaces Usage (Optional, good for visibility) */}
                                    <UsageBar
                                        label="Workspaces"
                                        current={usage.createWorkspace || 0}
                                        max={limits.createWorkspace || 3}
                                        color="bg-blue-500"
                                    />
                                </>
                            )}

                            <div className="rounded-lg bg-blue-50 p-4 text-sm text-blue-700 dark:bg-blue-900/20 dark:text-blue-300 flex items-center justify-between">
                                <span>Need more resources?</span>
                                <UpgradeButton />
                            </div>
                        </div>
                    ) : (
                        <PaymentHistoryList />
                    )}
                </div>
            </motion.div>
        </div>
    );
}


function UpgradeButton() {
    const user = useAuthStore((state) => state.user);
    const { isSignedIn, user: clerkUser } = useUser();
    const startCheckout = useAuthStore((state) => state.startCheckout);
    const clerk = useClerk();
    const [isLoading, setIsLoading] = useState(false);

    const handleUpgrade = async () => {
        setIsLoading(true);
        try {
            // If NOT signed in, prompt for sign up
            if (!isSignedIn) {
                // Use Clerk to open sign up modal
                await clerk.openSignUp({
                    fallbackRedirectUrl: "/checkout",
                });
                return;
            }

            // Member (Signed In): Trigger checkout
            // Use the Clerk ID if available to ensure we map to the right user
            const targetUserId = clerkUser?.id || (user as any)?.id || "unknown";

            const response = await fetch("/api/stripe/checkout", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ userId: targetUserId }),
            });

            if (response.ok) {
                const { url } = await response.json();
                if (url) window.location.href = url;
            } else {
                console.error("Checkout API failed");
                if (!startCheckout()) {
                    // Fallback
                }
            }
        } catch (error) {
            console.error("Upgrade failed:", error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <button
            onClick={handleUpgrade}
            disabled={isLoading}
            className="font-bold underline hover:text-blue-800 dark:hover:text-blue-200 disabled:opacity-50"
        >
            {isLoading ? "Loading..." : "Upgrade Plan"}
        </button>
    );
}
