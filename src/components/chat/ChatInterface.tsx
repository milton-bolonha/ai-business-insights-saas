"use client";

import { useState, useRef, useEffect } from "react";
import { Send, Sparkles, ChevronUp, Zap, ChevronLeft, ChevronRight } from "lucide-react";
import { FaHome, FaChartPie, FaBook, FaGavel } from "react-icons/fa";
import { cn } from "@/lib/utils";
import { APP_TAGS, APP_ATTRIBUTES, AppTagId, AppAttribute } from "@/lib/app-tags";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from "@/lib/hooks/useTranslation";

interface ChatInterfaceProps {
    activeAppTag: AppTagId;
    onAppTagChange: (tagId: AppTagId) => void;
    onSubmit: (message: string, attributeId?: string) => void;
    onTestMode?: (scenario: string) => void;
    isSubmitting?: boolean;
    className?: string;
}

export function ChatInterface({
    activeAppTag,
    onAppTagChange,
    onSubmit,
    onTestMode,
    isSubmitting = false,
    className,
}: ChatInterfaceProps) {
    const [inputValue, setInputValue] = useState("");
    const [activeAttributeId, setActiveAttributeId] = useState<string | null>(null);
    const [isTagChooserOpen, setIsTagChooserOpen] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);
    const chooserRef = useRef<HTMLDivElement>(null);
    const scrollRef = useRef<HTMLDivElement>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [startX, setStartX] = useState(0);
    const [scrollLeftPos, setScrollLeftPos] = useState(0);
    const { t } = useTranslation();

    const onMouseDown = (e: React.MouseEvent) => {
        if (!scrollRef.current) return;
        setIsDragging(true);
        setStartX(e.pageX - scrollRef.current.offsetLeft);
        setScrollLeftPos(scrollRef.current.scrollLeft);
    };

    const onMouseLeave = () => {
        setIsDragging(false);
    };

    const onMouseUp = () => {
        setIsDragging(false);
    };

    const onMouseMove = (e: React.MouseEvent) => {
        if (!isDragging || !scrollRef.current) return;
        e.preventDefault();
        const x = e.pageX - scrollRef.current.offsetLeft;
        const walk = (x - startX) * 2; // Scroll speed
        scrollRef.current.scrollLeft = scrollLeftPos - walk;
    };

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
            case 'home': return <svg stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 576 512" className="h-4 w-4" xmlns="http://www.w3.org/2000/svg"><path d="M280.37 148.26L96 300.11V464a16 16 0 0 0 16 16l112.06-.29a16 16 0 0 0 15.92-16V368a16 16 0 0 1 16-16h64a16 16 0 0 1 16 16v95.64a16 16 0 0 0 16 16.05L464 480a16 16 0 0 0 16-16V300L295.67 148.26a12.19 12.19 0 0 0-15.3 0zM571.6 251.47L488 182.56V44.05a12 12 0 0 0-12-12h-56a12 12 0 0 0-12 12v72.61L318.47 43a48 48 0 0 0-61 0L4.34 251.47a12 12 0 0 0-1.6 16.9l25.5 31A12 12 0 0 0 45.15 301l235.22-193.74a12.19 12.19 0 0 1 15.3 0L530.9 301a12 12 0 0 0 16.9-1.6l25.5-31a12 12 0 0 0-1.7-16.93z"></path></svg>;
            case 'business_insights': return <svg stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 544 512" className="h-4 w-4" xmlns="http://www.w3.org/2000/svg"><path d="M527.79 288H290.5l158.03 158.03c6.04 6.04 15.98 6.53 22.19.68 38.7-36.46 65.32-85.61 73.13-140.86 1.34-9.46-6.51-17.85-16.06-17.85zm-15.83-64.8C503.72 103.74 408.26 8.28 288.8.04 279.68-.59 272 7.1 272 16.24V240h223.77c9.14 0 16.82-7.68 16.19-16.8zM224 288V50.71c0-9.55-8.39-17.4-17.84-16.06C86.99 51.49-4.1 155.6.14 280.37 4.5 408.51 114.83 513.59 243.03 511.98c50.4-.63 96.97-16.87 135.26-44.03 7.9-5.6 8.42-17.23 1.57-24.08L224 288z"></path></svg>;
            case 'love_writers': return <svg stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 448 512" className="h-4 w-4" xmlns="http://www.w3.org/2000/svg"><path d="M448 360V24c0-13.3-10.7-24-24-24H96C43 0 0 43 0 96v320c0 53 43 96 96 96h328c13.3 0 24-10.7 24-24v-16c0-7.5-3.5-14.3-8.9-18.7-4.2-15.4-4.2-59.3 0-74.7 5.4-4.3 8.9-11.1 8.9-18.6zM128 134c0-3.3 2.7-6 6-6h212c3.3 0 6 2.7 6 6v20c0 3.3-2.7 6-6 6H134c-3.3 0-6-2.7-6-6v-20zm0 64c0-3.3 2.7-6 6-6h212c3.3 0 6 2.7 6 6v20c0 3.3-2.7 6-6 6H134c-3.3 0-6-2.7-6-6v-20zm253.4 250H96c-17.7 0-32-14.3-32-32 0-17.6 14.4-32 32-32h285.4c-1.9 17.1-1.9 46.9 0 64z"></path></svg>;
            case 'trade_ranking': return <FaGavel className="h-4 w-4" />;
            case 'furniture_logistics': 
            case 'furniture_layout':
                return <svg stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 576 512" className="h-4 w-4" xmlns="http://www.w3.org/2000/svg"><path d="M280.37 148.26L96 300.11V464a16 16 0 0 0 16 16l112.06-.29a16 16 0 0 0 15.92-16V368a16 16 0 0 1 16-16h64a16 16 0 0 1 16 16v95.64a16 16 0 0 0 16 16.05L464 480a16 16 0 0 0 16-16V300L295.67 148.26a12.19 12.19 0 0 0-15.3 0zM571.6 251.47L488 182.56V44.05a12 12 0 0 0-12-12h-56a12 12 0 0 0-12 12v72.61L318.47 43a48 48 0 0 0-61 0L4.34 251.47a12 12 0 0 0-1.6 16.9l25.5 31A12 12 0 0 0 45.15 301l235.22-193.74a12.19 12.19 0 0 1 15.3 0L530.9 301a12 12 0 0 0 16.9-1.6l25.5-31a12 12 0 0 0-1.7-16.93z"></path></svg>;
            case 'furniture_store':
                return <svg stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 448 512" className="h-4 w-4" xmlns="http://www.w3.org/2000/svg"><path d="M416 128V448c0 35.3-28.7 64-64 64H96c-35.3 0-64-28.7-64-64V128H416zM176 64v32h96V64c0-17.7-14.3-32-32-32H208c-17.7 0-32 14.3-32 32zM224 0c35.3 0 64 28.7 64 64V96h88 16c30.9 0 56 25.1 56 56v8 312c0 53-43 96-96 96H96c-53 0-96-43-96-96V160c0-30.9 25.1-56 56-56h16 88V64c0-35.3 28.7-64 64-64h32z"></path></svg>;
            case 'io_mentoring':
                return <svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" className="h-4 w-4" xmlns="http://www.w3.org/2000/svg" strokeLinecap="round" strokeLinejoin="round"><path d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>;
            case 'smart_survey':
                return <svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" className="h-4 w-4" xmlns="http://www.w3.org/2000/svg" strokeLinecap="round" strokeLinejoin="round"><path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>;
            default: return <FaHome className="h-4 w-4" />;
        }
    };

    return (
        <div className={cn("fixed bottom-0 left-0 right-0 z-50 transition-all duration-300", className)}>
            {/* Background Gradient / Blur Wrapper */}
            <div className="absolute inset-0 bg-gradient-to-t from-[#fcfcf9] via-[#fcfcf9]/95 to-transparent backdrop-blur-sm pointer-events-none" />

            {/* Test Mode Button */}
            {activeAppTag === "trade_ranking" && onTestMode && (
                <div className="relative mx-auto max-w-3xl px-4 flex justify-end gap-2">
                    <button
                        onClick={() => onTestMode('iphone')}
                        className="mb-2 flex items-center gap-1.5 rounded-full bg-blue-100 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-blue-700 border border-blue-200 shadow-sm hover:bg-blue-200 transition-colors cursor-pointer"
                    >
                        <Zap className="h-3 w-3" /> iPhone
                    </button>
                    <button
                        onClick={() => onTestMode('geladeira')}
                        className="mb-2 flex items-center gap-1.5 rounded-full bg-amber-100 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-amber-700 border border-amber-200 shadow-sm hover:bg-amber-200 transition-colors cursor-pointer"
                    >
                        <Zap className="h-3 w-3" /> Geladeira
                    </button>
                    <button
                        onClick={() => onTestMode('armario')}
                        className="mb-2 flex items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-emerald-700 border border-emerald-200 shadow-sm hover:bg-emerald-200 transition-colors cursor-pointer"
                    >
                        <Zap className="h-3 w-3" /> Armário
                    </button>
                </div>
            )}

            <div className="relative mx-auto max-w-3xl px-4 py-6">
                {/* Attributes List */}
                {currentAttributes.length > 0 && (
                    <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide py-1 mask-linear-fade mb-3">
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
                                {t(attr.labelKey)}
                            </button>
                        ))}
                    </div>
                )}

                {/* Chat Input Area */}
                <div className="relative rounded-full bg-[#1e1e1e] shadow-xl ring-1 ring-white/10 focus-within:ring-2 focus-within:ring-purple-500/50">
                    <div className="flex items-center px-4 py-2.5">
                        <div className="mr-3 flex h-8 w-8 items-center justify-center rounded-full bg-purple-600 text-white shrink-0">
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
                                    ? t("home.chat.placeholder")
                                    : activeAttributeId
                                        ? t(currentAttributes.find(a => a.id === activeAttributeId)?.placeholderKey || "") || "Type your answer..."
                                        : t("home.chat.placeholder")
                            }
                            className={cn(
                                "flex-1 bg-transparent text-base text-white placeholder:text-gray-400 focus:outline-none cursor-text min-w-0",
                                isSubmitting && "opacity-50 cursor-not-allowed"
                            )}
                        />
                        <button
                            onClick={handleSend}
                            disabled={!inputValue.trim() || isSubmitting}
                            className={cn(
                                "ml-3 flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition-all",
                                inputValue.trim() && !isSubmitting
                                    ? "bg-[#ccff00] text-black shadow-md hover:bg-[#b3e600] cursor-pointer"
                                    : "bg-white/5 text-gray-500 cursor-not-allowed"
                            )}
                        >
                            <Send className="h-4 w-4" />
                        </button>
                    </div>
                </div>

                {/* App Tag Selector (Horizontal Scroll with Arrows and Drag) */}
                <div className="flex flex-wrap md:flex-nowrap items-center justify-center md:justify-start gap-2 mt-4 w-full">
                    <button 
                        onClick={() => scrollRef.current?.scrollBy({ left: -200, behavior: 'smooth' })}
                        className="hidden md:block p-1 rounded-full hover:bg-black/5 text-gray-400 hover:text-gray-600 transition-colors shrink-0 -ml-2 cursor-pointer"
                    >
                        <ChevronLeft className="w-5 h-5" />
                    </button>

                    <div 
                        ref={scrollRef}
                        onMouseDown={onMouseDown}
                        onMouseLeave={onMouseLeave}
                        onMouseUp={onMouseUp}
                        onMouseMove={onMouseMove}
                        className="flex-1 flex flex-wrap md:flex-nowrap items-center justify-center md:justify-start gap-2 md:gap-3 md:overflow-x-auto pb-2 pt-2 px-1 [&::-webkit-scrollbar]:hidden md:cursor-grab md:active:cursor-grabbing w-full"
                        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' } as React.CSSProperties}
                    >
                        {APP_TAGS.map((tag) => (
                            <button
                                key={tag.id}
                                onClick={() => {
                                    onAppTagChange(tag.id);
                                    setActiveAttributeId(null);
                                }}
                                className={cn(
                                    "flex items-center gap-2 px-4 py-2.5 shrink-0 transition-all cursor-pointer border-2 border-dashed rounded-2xl",
                                    activeAppTag === tag.id
                                        ? "bg-white border-gray-400 shadow-sm"
                                        : "bg-[#fcfcf9] border-[#d6d3d1] hover:border-gray-400 text-gray-500 hover:text-black"
                                )}
                            >
                                <span style={{ color: tag.id === 'home' ? '#000' : tag.color }}>{getTagIcon(tag.id)}</span>
                                <span className={cn(
                                    "font-medium text-[13px] select-none",
                                    activeAppTag === tag.id ? "text-black" : ""
                                )}>{t(tag.labelKey)}</span>
                            </button>
                        ))}
                    </div>

                    <button 
                        onClick={() => scrollRef.current?.scrollBy({ left: 200, behavior: 'smooth' })}
                        className="hidden md:block p-1 rounded-full hover:bg-black/5 text-gray-400 hover:text-gray-600 transition-colors shrink-0 -mr-1 cursor-pointer"
                    >
                        <ChevronRight className="w-5 h-5" />
                    </button>

                    {/* Fixed Build New App Button */}
                    <div className="shrink-0 pb-2 pt-2">
                        <button className="flex items-center gap-2 px-3 md:px-4 py-2.5 shrink-0 transition-all cursor-pointer border-2 border-dashed bg-[#fcfcf9] border-[#d6d3d1] text-gray-500 hover:border-purple-500 hover:text-purple-600 rounded-2xl">
                            <span className="flex items-center justify-center w-5 h-5 rounded-full bg-black text-white font-medium text-lg leading-none pb-[2px] select-none">+</span>
                            <span className="hidden md:inline font-medium text-[13px] select-none">Build New App</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
