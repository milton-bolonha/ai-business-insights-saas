"use client";

import { X, Coins, Sparkles, UserPlus, Briefcase, MessageSquare } from "lucide-react";
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

// Removed UsageBar as it is obsolete


function TransactionLedgerList({ filterType }: { filterType: "purchases" | "usage" | "all" }) {
    const [transactions, setTransactions] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const user = useAuthStore((state) => state.user);

    useEffect(() => {
        const storedUserId = typeof window !== "undefined" ? localStorage.getItem("guest_checkout_user_id") : null;
        const targetUserId = (user as any)?.id || storedUserId || "guest_temp";

        fetch("/api/user/usage-history", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ userId: targetUserId })
        })
            .then((res) => {
                if (!res.ok) throw new Error("Failed to load");
                return res.json();
            })
            .then((data) => {
                setTransactions(data.history || []);
                if (typeof data.creditsTotal === 'number') {
                    useAuthStore.getState().setUsage({ creditsTotal: data.creditsTotal });
                }
            })
            .catch(() => setError("Failed to load transaction history"))
            .finally(() => setLoading(false));
    }, [(user as any)?.id]);

    if (loading) return <div className="text-center py-8 text-gray-500">Loading history...</div>;
    if (error) return <div className="text-center py-8 text-red-500">{error}</div>;
    if (transactions.length === 0) return <div className="text-center py-8 text-gray-500">No transaction history found.</div>;

    const actionLabels: Record<string, string> = {
        buy_credits: "Credit Purchase",
        createWorkspace: "Created Workspace",
        createTile: "Generated Insight (Arc)",
        createContact: "New Character",
        tileChat: "Insight Map Chat",
        contactChat: "Character Chat",
        regenerate: "AI Regeneration"
    };

    return (
        <div className="space-y-3 max-h-[350px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-gray-200 dark:scrollbar-thumb-gray-800">
            {transactions.filter(t => filterType === "all" ? true : filterType === "purchases" ? t.type === "purchase" : t.type === "usage").map((t) => {
                const isPurchase = t.type === "purchase";
                return (
                    <div key={t.id} className="flex justify-between items-center p-3 border border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                        <div>
                            <div className="font-semibold text-sm">{actionLabels[t.action] || t.action}</div>
                            <div className="text-xs text-gray-500">{new Date(t.date).toLocaleString()}</div>
                        </div>
                        <div className="text-right">
                            <div className={`font-bold text-sm ${isPurchase ? 'text-green-600 dark:text-green-500' : 'text-red-500 dark:text-red-400'}`}>
                                {isPurchase ? '+' : ''}{t.credits}
                            </div>
                            {isPurchase && t.amount && (
                                <div className="text-[10px] text-gray-500">
                                    {(t.amount / 100).toLocaleString("en-US", { style: "currency", currency: t.currency || "USD" })}
                                </div>
                            )}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

export function SaaSLimitsModal({ isOpen, onClose, appearance, featureLocked }: SaaSLimitsModalProps) {
    const usage = useUsage();
    const limits = useLimits();
    const [tab, setTab] = useState<"usage" | "ledger" | "history">("usage");

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="w-full max-w-2xl overflow-hidden rounded-2xl bg-white shadow-2xl dark:bg-gray-900"
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
                        onClick={() => setTab("ledger")}
                        className={`flex-1 py-3 text-sm font-medium ${tab === "ledger" ? "border-b-2 border-blue-500 text-blue-600 dark:text-blue-400" : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"}`}
                    >
                        Payment History
                    </button>
                    <button
                        onClick={() => setTab("history")}
                        className={`flex-1 py-3 text-sm font-medium ${tab === "history" ? "border-b-2 border-blue-500 text-blue-600 dark:text-blue-400" : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"}`}
                    >
                        Usage History
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
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                                        {/* Left Column: Balance */}
                                        <div className="flex flex-col justify-center text-center px-6 py-8 rounded-xl relative overflow-hidden bg-gradient-to-b from-amber-50 to-white dark:from-yellow-900/20 dark:to-transparent border border-amber-100 dark:border-yellow-900/30">
                                            <div className="flex justify-center mb-4">
                                                <div className="bg-amber-100 dark:bg-yellow-900/40 p-4 rounded-full shadow-inner">
                                                    <Coins className="h-10 w-10 text-amber-500" />
                                                </div>
                                            </div>
                                            <div className="text-sm text-amber-700 dark:text-amber-400 font-bold mb-2 uppercase tracking-wide">Current Balance</div>
                                            <div className="text-5xl font-extrabold text-amber-600 dark:text-amber-500">
                                                {Math.max(0, ((usage as any)?.creditsTotal || (limits as any)?.creditsTotal || 0) - ((usage as any)?.creditsUsed || 0))} <span className="text-xl font-medium opacity-70">Credits</span>
                                            </div>
                                        </div>

                                        {/* Right Column: Cost Table */}
                                        <div className="flex flex-col justify-center">
                                            <h4 className="text-sm font-semibold mb-3 text-gray-500 uppercase tracking-wider">Cost Table</h4>
                                            <div className="space-y-2">
                                                <div className="flex justify-between items-center p-3 rounded-lg border border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50 text-gray-700 dark:text-gray-300">
                                                    <div className="flex items-center gap-3">
                                                        <Sparkles className="h-4 w-4 text-amber-500" />
                                                        <span className="font-medium text-sm">Generate Insight (Arc)</span>
                                                    </div>
                                                    <div className="font-bold text-amber-600 dark:text-amber-500 text-sm">5 Credits</div>
                                                </div>
                                                <div className="flex justify-between items-center p-3 rounded-lg border border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50 text-gray-700 dark:text-gray-300">
                                                    <div className="flex items-center gap-3">
                                                        <UserPlus className="h-4 w-4 text-amber-500" />
                                                        <span className="font-medium text-sm">New Character</span>
                                                    </div>
                                                    <div className="font-bold text-amber-600 dark:text-amber-500 text-sm">1 Credit</div>
                                                </div>
                                                <div className="flex justify-between items-center p-3 rounded-lg border border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50 text-gray-700 dark:text-gray-300">
                                                    <div className="flex items-center gap-3">
                                                        <Briefcase className="h-4 w-4 text-amber-500" />
                                                        <span className="font-medium text-sm">Create Workspace</span>
                                                    </div>
                                                    <div className="font-bold text-amber-600 dark:text-amber-500 text-sm">10 Credits</div>
                                                </div>
                                                <div className="flex justify-between items-center p-3 rounded-lg border border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50 text-gray-700 dark:text-gray-300">
                                                    <div className="flex items-center gap-3">
                                                        <MessageSquare className="h-4 w-4 text-amber-500" />
                                                        <span className="font-medium text-sm">Send Message</span>
                                                    </div>
                                                    <div className="font-bold text-amber-600 dark:text-amber-500 text-sm">2 Credits</div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </>
                            )}

                            <div className="rounded-lg bg-blue-50 p-4 text-sm text-blue-700 dark:bg-blue-900/20 dark:text-blue-300 flex items-center justify-between">
                                <span>Need more resources?</span>
                                <UpgradeButton />
                            </div>
                        </div>
                    ) : tab === "ledger" ? (
                        <TransactionLedgerList filterType="purchases" />
                    ) : (
                        <TransactionLedgerList filterType="usage" />
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
            className="font-bold underline cursor-pointer hover:text-blue-800 dark:hover:text-blue-200 disabled:opacity-50"
        >
            {isLoading ? "Loading..." : "Buy Credits"}
        </button>
    );
}
