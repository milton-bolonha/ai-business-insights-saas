"use client";

import { useState, useRef, useEffect } from "react";
import { Send, Sparkles, ChevronUp } from "lucide-react";
import { FaHome, FaChartPie, FaBook } from "react-icons/fa";
import { cn } from "@/lib/utils";
import { APP_TAGS, APP_ATTRIBUTES, AppTagId, AppAttribute } from "@/lib/app-tags";
import { motion, AnimatePresence } from "framer-motion";

interface ChatInterfaceProps {
    activeAppTag: AppTagId;
    onAppTagChange: (tagId: AppTagId) => void;
    onSubmit: (message: string, attributeId?: string) => void;
    isSubmitting?: boolean;
}

export function ChatInterface({
    activeAppTag,
    onAppTagChange,
    onSubmit,
    isSubmitting = false,
}: ChatInterfaceProps) {
    const [inputValue, setInputValue] = useState("");
    const [activeAttributeId, setActiveAttributeId] = useState<string | null>(null);
    const [isTagChooserOpen, setIsTagChooserOpen] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);
    const chooserRef = useRef<HTMLDivElement>(null);

    const activeTag = APP_TAGS.find((t) => t.id === activeAppTag) || APP_TAGS[0];
    const currentAttributes = APP_ATTRIBUTES.filter(
        (attr) => attr.appTagId === activeAppTag
    );

    // Auto-focus input when attribute changes
    useEffect(() => {
        if (activeAttributeId && inputRef.current) {
            inputRef.current.focus();
        }
    }, [activeAttributeId]);

    // Close chooser when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (chooserRef.current && !chooserRef.current.contains(event.target as Node)) {
                setIsTagChooserOpen(false);
            }
        };

        if (isTagChooserOpen) {
            document.addEventListener('mousedown', handleClickOutside);
            return () => document.removeEventListener('mousedown', handleClickOutside);
        }
    }, [isTagChooserOpen]);

    const handleSend = () => {
        if (!inputValue.trim()) {
            return;
        }
        if (isSubmitting) return;

        const currentAttributeId = activeAttributeId;
        onSubmit(inputValue, currentAttributeId || undefined);
        setInputValue("");

        // Auto-advance to next attribute if applicable
        if (currentAttributeId) {
            const currentIndex = currentAttributes.findIndex(a => a.id === currentAttributeId);
            if (currentIndex !== -1 && currentIndex < currentAttributes.length - 1) {
                const nextAttribute = currentAttributes[currentIndex + 1];
                setActiveAttributeId(nextAttribute.id);
            } else {
                setActiveAttributeId(null);
            }
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            if (!inputValue.trim()) {
                const form = e.currentTarget.closest('div');
                form?.classList.add('animate-shake');
                setTimeout(() => form?.classList.remove('animate-shake'), 500);
                return;
            }
            handleSend();
        }
    };

    const getTagIcon = (tagId: string) => {
        switch (tagId) {
            case 'home': return <FaHome className="h-4 w-4" />;
            case 'business_insights': return <FaChartPie className="h-4 w-4" />;
            case 'love_writers': return <FaBook className="h-4 w-4" />;
            default: return <FaHome className="h-4 w-4" />;
        }
    };

    return (
        <div className="fixed bottom-0 left-0 right-0 z-50">
            {/* Background Gradient / Blur Wrapper */}
            <div className="absolute inset-0 bg-gradient-to-t from-[#fcfcf9] via-[#fcfcf9]/95 to-transparent backdrop-blur-sm pointer-events-none" />

            <div className="relative mx-auto max-w-4xl px-4 py-6">

                {/* Top Row: Chooser + Attributes */}
                <div className="mb-3 flex items-center gap-3">
                    {/* App Tag Chooser (Drop Up) */}
                    <div className="relative" ref={chooserRef}>
                        <button
                            onClick={() => setIsTagChooserOpen(!isTagChooserOpen)}
                            className={cn(
                                "flex items-center gap-2 rounded-xl bg-[#333] px-4 py-2 text-white shadow-lg ring-1 ring-white/10 transition-all hover:bg-[#404040] cursor-pointer",
                                isTagChooserOpen && "ring-2 ring-white/20"
                            )}
                        >
                            <span style={{ color: activeTag.id === 'home' ? 'white' : activeTag.color }}>{getTagIcon(activeAppTag)}</span>
                            <span className="font-medium text-sm">{activeTag.label}</span>
                            <ChevronUp className="h-4 w-4 text-gray-400" />
                        </button>

                        <AnimatePresence>
                            {isTagChooserOpen && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                    className="absolute bottom-full left-0 mb-2 w-56 overflow-hidden rounded-xl bg-[#333] p-1 shadow-xl ring-1 ring-white/10"
                                >
                                    {APP_TAGS.map((tag) => (
                                        <button
                                            key={tag.id}
                                            onClick={() => {
                                                onAppTagChange(tag.id);
                                                setIsTagChooserOpen(false);
                                                setActiveAttributeId(null);
                                            }}
                                            className={cn(
                                                "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-gray-300 transition-colors hover:bg-white/10 cursor-pointer",
                                                activeAppTag === tag.id && "bg-white/20 text-white"
                                            )}
                                        >
                                            <span style={{ color: tag.id === 'home' ? 'white' : tag.color }}>{getTagIcon(tag.id)}</span>
                                            <span className="flex-1 text-left">{tag.label}</span>
                                        </button>
                                    ))}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* Attributes List (Horizontal Scroll) */}
                    {currentAttributes.length > 0 && (
                        <div className="flex flex-1 items-center gap-2 overflow-x-auto scrollbar-hide py-1 mask-linear-fade">
                            {currentAttributes.map((attr) => (
                                <button
                                    key={attr.id}
                                    onClick={() => setActiveAttributeId(attr.id)}
                                    className={cn(
                                        "whitespace-nowrap rounded-lg px-3 py-1.5 text-sm font-medium transition-all cursor-pointer border",
                                        activeAttributeId === attr.id
                                            ? "bg-[#333] text-white border-[#333]"
                                            : "bg-white text-gray-600 border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                                    )}
                                >
                                    {attr.label}
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Chat Input Area */}
                <div className="relative rounded-2xl bg-white shadow-xl ring-1 ring-gray-900/5 focus-within:ring-2 focus-within:ring-blue-500/50">
                    <div className="flex items-center px-4 py-3">
                        <div className="mr-3 flex h-8 w-8 items-center justify-center rounded-full bg-blue-50 text-blue-600">
                            <Sparkles className="h-4 w-4" />
                        </div>
                        <input
                            ref={inputRef}
                            type="text"
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            onKeyDown={handleKeyDown}
                            disabled={isSubmitting}
                            placeholder={
                                activeAppTag === "home"
                                    ? "Ask me anything..."
                                    : activeAttributeId
                                        ? currentAttributes.find(a => a.id === activeAttributeId)?.placeholder || "Type your answer..."
                                        : `Select an attribute above to start...`
                            }
                            className={cn(
                                "flex-1 bg-transparent text-base text-gray-900 placeholder:text-gray-400 focus:outline-none cursor-text",
                                isSubmitting && "opacity-50 cursor-not-allowed"
                            )}
                        />
                        <button
                            onClick={handleSend}
                            disabled={!inputValue.trim() || isSubmitting}
                            className={cn(
                                "ml-3 flex h-8 w-8 items-center justify-center rounded-full transition-all",
                                inputValue.trim() && !isSubmitting
                                    ? "bg-blue-600 text-white shadow-md hover:bg-blue-500 cursor-pointer"
                                    : "bg-gray-100 text-gray-400 cursor-not-allowed"
                            )}
                        >
                            <Send className="h-4 w-4" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
