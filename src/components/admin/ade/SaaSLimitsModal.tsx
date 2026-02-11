"use client";

import { X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import type { AdeAppearanceTokens } from "@/lib/ade-theme";

interface SaaSLimitsModalProps {
    isOpen: boolean;
    onClose: () => void;
    appearance: AdeAppearanceTokens;
}

export function SaaSLimitsModal({ isOpen, onClose, appearance }: SaaSLimitsModalProps) {
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
                    <h3 className="text-lg font-semibold">Usage Limits</h3>
                    <button
                        onClick={onClose}
                        className="rounded-full p-1 hover:bg-gray-100 dark:hover:bg-gray-800"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <div className="p-6">
                    <div className="space-y-6">
                        {/* Arcs Usage */}
                        <div>
                            <div className="flex justify-between mb-2">
                                <span className="font-medium">Book Arcs</span>
                                <span className="text-sm text-gray-500">14 / 20</span>
                            </div>
                            <div className="h-2 w-full rounded-full bg-gray-100 dark:bg-gray-800">
                                <div className="h-full rounded-full bg-rose-500" style={{ width: '70%' }} />
                            </div>
                        </div>

                        {/* Characters Usage */}
                        <div>
                            <div className="flex justify-between mb-2">
                                <span className="font-medium">Characters</span>
                                <span className="text-sm text-gray-500">0 / 5</span>
                            </div>
                            <div className="h-2 w-full rounded-full bg-gray-100 dark:bg-gray-800">
                                <div className="h-full rounded-full bg-orange-500" style={{ width: '0%' }} />
                            </div>
                        </div>

                        <div className="rounded-lg bg-blue-50 p-4 text-sm text-blue-700 dark:bg-blue-900/20 dark:text-blue-300">
                            Need more resources? <a href="#" className="font-bold underline">Upgrade Plan</a>
                        </div>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}
