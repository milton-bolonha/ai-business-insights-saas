import React, { useState, useRef, useEffect, ReactNode } from "react";
import { Send, Sparkles, ChevronUp, Layers } from "lucide-react";
import { FaHome, FaChartPie, FaBook, FaGavel } from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import type { NavTab } from "@/components/admin/ade/AdminNavigation";
import {
    BookOpen,
    LayoutGrid,
    Users,
    FileText,
    FolderOpen,
    Library,
    Shapes,
    Shield,
    ClipboardList,
    Map as MapIcon,
    ShoppingBag,
    PieChart,
    Info,
    Droplet,
    Coins,
    Zap,
    Mic,
    Image as ImageIcon,
    Loader2,
    CheckCircle2,
    HelpCircle,
    X
} from "lucide-react";
import { useWMSOrchestrator } from "@/containers/admin/hooks/useWMSOrchestrator";
import { UserButton } from "@clerk/nextjs";
import Link from "next/link";

// Helper to get nav items based on templateId
function getWorkspaceNavItems(templateId: string = "template_1") {
    const isWriters = templateId === "template_love_writers";
    const isTrade = templateId === "template_trade_ranking";
    const isFurniture = templateId?.startsWith("template_furniture");

    return [
        ...(isWriters ? [{ id: "library", label: "Biblioteca", icon: Library }] : []),
        ...(isTrade ? [{ id: "ranking", label: "Ranking", icon: FaGavel }] : []),
        ...(isFurniture ? [
            { id: "store", label: "Loja", icon: ShoppingBag },
            { id: "logistics", label: "Painel Pedidos", icon: ClipboardList },
            { id: "layout", label: "Mapa Loja", icon: MapIcon },
            { id: "clients", label: "Clientes", icon: Users },
            { id: "staff", label: "Equipe", icon: Shield },
        ] : []),
        {
            id: "arcs",
            label: isTrade ? "Análise" : isWriters ? "Arcos" : isFurniture ? "Insights" : "Dashboard",
            icon: LayoutGrid
        },
        ...(!isFurniture ? [{
            id: "characters",
            label: isWriters ? "Elenco" : "Contatos",
            icon: isTrade ? Shapes : Users
        }] : []),
        {
            id: "notes",
            label: isFurniture ? "Relatórios" : "Notas",
            icon: FileText
        },
        { id: "files", label: "Arquivos", icon: FolderOpen },
    ] as const;
}

function getTemplateColor(templateId?: string) {
    if (templateId === "template_trade_ranking") return "#10b981"; // emerald
    if (templateId === "template_love_writers") return "#e11d48"; // pink
    if (templateId?.startsWith("template_furniture")) return "#0ea5e9"; // sky
    return "#2563eb"; // blue
}

function getTemplateIcon(templateId?: string) {
    if (templateId === "template_trade_ranking") return <FaGavel className="h-4 w-4" />;
    if (templateId === "template_love_writers") return <BookOpen className="h-4 w-4" />;
    if (templateId?.startsWith("template_furniture")) return <ShoppingBag className="h-4 w-4" />;
    return <PieChart className="h-4 w-4" />;
}

interface AdminChatViewProps {
    workspaces: any[];
    currentWorkspace: any;
    activeTab: NavTab;
    onTabChange: (tab: NavTab) => void;
    onSetActiveWorkspace: (workspaceId: string) => void;
    viewMode?: "menu" | "chat";
    onSwitchToMenu: () => void;
    onSwitchToChat?: () => void;
    onOpenWorkspaceDetail?: () => void;
    onSetSpecificColor?: (color: string) => void;
    onOpenSaaSLimits?: () => void;
}

export function AdminChatView({
    workspaces,
    currentWorkspace,
    activeTab,
    onTabChange,
    onSetActiveWorkspace,
    viewMode = "chat",
    onSwitchToMenu,
    onSwitchToChat,
    onOpenWorkspaceDetail,
    onSetSpecificColor,
    onOpenSaaSLimits
}: AdminChatViewProps) {
    const [inputValue, setInputValue] = useState("");
    const inputValueRef = useRef("");
    useEffect(() => { inputValueRef.current = inputValue; }, [inputValue]);

    const [messages, setMessages] = useState<Array<{ role: 'user' | 'assistant', content: string | ReactNode }>>([]);
    const [isTyping, setIsTyping] = useState(false);
    const [isWorkspaceChooserOpen, setIsWorkspaceChooserOpen] = useState(false);
    const [isNavChooserOpen, setIsNavChooserOpen] = useState(false);
    const [pendingImages, setPendingImages] = useState<any[]>([]);
    const [isListening, setIsListening] = useState(false);
    const [hasBounced, setHasBounced] = useState(false);

    const isExpanded = viewMode === "chat";

    const { callGeminiAI, isProcessingAI: isAIThinking } = useWMSOrchestrator(
        currentWorkspace?.promptSettings?.storeLayout || [],
        (newSections) => {
            // This would normally call a prop or sync back to DB
            console.log("Sections updated via AI:", newSections);
        }
    );

    // Drag to scroll state
    const [isDragging, setIsDragging] = useState(false);
    const [startX, setStartX] = useState(0);
    const [scrollLeft, setScrollLeft] = useState(0);

    // Voice Help Modal State
    const [isHelpModalOpen, setIsHelpModalOpen] = useState(false);

    const inputRef = useRef<HTMLInputElement>(null);
    const chooserRef = useRef<HTMLDivElement>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const recognitionRef = useRef<any>(null);

    const chatWrapperRef = useRef<HTMLDivElement>(null);

    // Initial bounce animation
    useEffect(() => {
        if (!isExpanded && !hasBounced) {
            setTimeout(() => setHasBounced(true), 1500);
        }
    }, [isExpanded, hasBounced]);

    // Auto-scroll to bottom of chat

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages, isTyping]);

    // Close chooser when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (chooserRef.current && !chooserRef.current.contains(event.target as Node)) {
                setIsWorkspaceChooserOpen(false);
            }
        };

        if (isWorkspaceChooserOpen) {
            document.addEventListener('mousedown', handleClickOutside);
            return () => document.removeEventListener('mousedown', handleClickOutside);
        }
    }, [isWorkspaceChooserOpen]);

    // Close nav chooser when clicking outside
    const navChooserRef = useRef<HTMLDivElement>(null);
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (navChooserRef.current && !navChooserRef.current.contains(event.target as Node)) {
                setIsNavChooserOpen(false);
            }
        };

        if (isNavChooserOpen) {
            document.addEventListener('mousedown', handleClickOutside);
            return () => document.removeEventListener('mousedown', handleClickOutside);
        }
    }, [isNavChooserOpen]);

    const handleSend = async () => {
        if (!inputValue.trim() && pendingImages.length === 0) return;

        const currentInput = inputValue;
        const currentImages = [...pendingImages];

        setMessages(prev => [...prev, {
            role: 'user',
            content: (
                <div className="flex flex-col gap-2">
                    {currentInput && <span>{currentInput}</span>}
                    {currentImages.length > 0 && (
                        <div className="flex gap-2">
                            {currentImages.map((img, i) => <img key={i} src={img.preview} className="h-20 w-auto rounded-lg shadow-sm" />)}
                        </div>
                    )}
                </div>
            )
        }]);

        setInputValue("");
        setPendingImages([]);
        setIsTyping(true);

        const result = await callGeminiAI(currentInput, currentImages);

        setIsTyping(false);
        setMessages(prev => [
            ...prev,
            { role: 'assistant', content: result.reply },
            ...(result.logs.length > 0 ? [{
                role: 'assistant' as const,
                content: (
                    <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4 w-full mt-2">
                        <div className="flex items-center gap-2 mb-2 text-emerald-700 font-bold text-xs uppercase tracking-wider">
                            <CheckCircle2 className="h-4 w-4" /> Ações Executadas
                        </div>
                        <ul className="space-y-1">
                            {result.logs.map((log, i) => (
                                <li key={i} className="text-xs text-emerald-800 flex items-start gap-2">
                                    <div className="mt-1.5 w-1 h-1 bg-emerald-400 rounded-full shrink-0" />
                                    {log}
                                </li>
                            ))}
                        </ul>
                    </div>
                )
            }] : [])
        ]);
    };

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onloadend = () => {
            setPendingImages(prev => [...prev, { id: Date.now(), mimeType: file.type, preview: reader.result }]);
        };
        reader.readAsDataURL(file);
    };

    const toggleVoice = () => {
        if (isListening && recognitionRef.current) {
            recognitionRef.current.stop();
            return;
        }

        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        if (!SpeechRecognition) {
            alert("Seu navegador não suporta reconhecimento de voz.");
            return;
        }

        const recognition = new SpeechRecognition();
        recognitionRef.current = recognition;
        recognition.lang = 'pt-BR';
        recognition.interimResults = true;
        recognition.continuous = false;

        const initialInput = inputValueRef.current.trim();

        recognition.onstart = () => setIsListening(true);
        recognition.onend = () => setIsListening(false);
        recognition.onresult = (e: any) => {
            let transcript = '';
            for (let i = e.resultIndex; i < e.results.length; ++i) {
                transcript += e.results[i][0].transcript;
            }
            setInputValue(initialInput ? `${initialInput} ${transcript}` : transcript);
        };
        recognition.start();
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

    const onMouseDown = (e: React.MouseEvent) => {
        setIsDragging(true);
        setStartX(e.pageX - (scrollContainerRef.current?.offsetLeft || 0));
        setScrollLeft(scrollContainerRef.current?.scrollLeft || 0);
    };

    const onMouseLeaveDrag = () => setIsDragging(false);
    const onMouseUp = () => setIsDragging(false);

    const onMouseMove = (e: React.MouseEvent) => {
        if (!isDragging) return;
        e.preventDefault();
        const x = e.pageX - (scrollContainerRef.current?.offsetLeft || 0);
        const walk = (x - startX) * 2;
        if (scrollContainerRef.current) {
            scrollContainerRef.current.scrollLeft = scrollLeft - walk;
        }
    };

    const currentNavItems = currentWorkspace
        ? getWorkspaceNavItems(currentWorkspace.promptSettings?.templateId)
        : [];

    const currentColor = getTemplateColor(currentWorkspace?.promptSettings?.templateId);

    return (
        <AnimatePresence>
            {/* Click Outside Backdrop */}
            {isExpanded && (
                <motion.div 
                    key="chat-backdrop"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[100]" 
                    onClick={() => onSwitchToMenu()}
                />
            )}

            {/* The Expanded Chat Sheet */}
            <motion.div
                key="chat-sheet"
                className="fixed bottom-0 left-0 right-0 z-[110] flex flex-col shadow-[0_-20px_50px_rgba(0,0,0,0.1)] rounded-t-[2.5rem] h-auto max-h-[85vh] border border-gray-100/20"
                initial={{ y: "100%" }}
                animate={{
                    y: isExpanded ? "0%" : "100%",
                }}
                transition={{
                    y: { type: "spring", stiffness: 300, damping: 30 }
                }}
            >
                {/* Glassy Background */}
                <div className="absolute inset-0 bg-gradient-to-t from-white/90 via-white/80 to-white/60 backdrop-blur-xl pointer-events-none -z-10 dark:from-black/90 dark:via-black/80 dark:to-black/60" />

                {/* Expanded Content (Just Input Area) */}
                <div className="flex-1 flex flex-col min-h-0">

                    {/* Chat Input Area Wrapper */}
                    <div className="shrink-0 bg-white/60 dark:bg-gray-900/80 backdrop-blur-md border-t border-gray-100/50 py-4 pb-8 sm:pb-6">
                        <div className="container mx-auto px-3 sm:px-6 max-w-5xl">
                            {/* Row 1: Workspace chooser */}
                            <div className="mb-2 flex items-center justify-between gap-2">
                                <div className="relative flex-1" ref={chooserRef}>
                                    <button
                                        onClick={() => setIsWorkspaceChooserOpen(!isWorkspaceChooserOpen)}
                                        className={cn(
                                            "flex w-full items-center justify-between gap-2 rounded-xl bg-[#333] px-3 py-3 text-white shadow-lg ring-1 ring-white/10 transition-all hover:bg-[#404040] cursor-pointer",
                                            isWorkspaceChooserOpen && "ring-2 ring-white/20"
                                        )}
                                    >
                                        <div className="flex items-center gap-2 overflow-hidden">
                                            <span style={{ color: currentColor }} className="shrink-0">
                                                {getTemplateIcon(currentWorkspace?.promptSettings?.templateId)}
                                            </span>
                                            <span className="font-medium text-sm truncate">
                                                {currentWorkspace?.name || "Workspace"}
                                            </span>
                                        </div>
                                        <ChevronUp className={cn("h-4 w-4 text-gray-400 shrink-0 transition-transform", isWorkspaceChooserOpen && "rotate-180")} />
                                    </button>

                                    <AnimatePresence>
                                        {isWorkspaceChooserOpen && (
                                            <motion.div
                                                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                                className="absolute bottom-full left-0 mb-2 w-64 max-h-[400px] overflow-y-auto rounded-xl bg-[#333] p-2 shadow-xl ring-1 ring-white/10"
                                            >
                                                <div className="mb-2 px-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">Workspaces</div>
                                                {workspaces.map((ws) => (
                                                    <button
                                                        key={ws.id}
                                                        onClick={() => {
                                                            onSetActiveWorkspace(ws.id);
                                                            setIsWorkspaceChooserOpen(false);
                                                        }}
                                                        className={cn(
                                                            "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors hover:bg-white/10 cursor-pointer",
                                                            currentWorkspace?.id === ws.id ? "bg-white/20 text-white" : "text-gray-300"
                                                        )}
                                                    >
                                                        <span style={{ color: getTemplateColor(ws.promptSettings?.templateId) }}>
                                                            {getTemplateIcon(ws.promptSettings?.templateId)}
                                                        </span>
                                                        <span className="flex-1 text-left truncate">{ws.name}</span>
                                                    </button>
                                                ))}
                                                <div className="my-2 border-t border-white/10" />

                                                {/* Layout shortcut — visible only for furniture template */}
                                                {currentWorkspace?.promptSettings?.templateId?.startsWith('template_furniture') && (
                                                    <button
                                                        onClick={() => { onTabChange('layout' as NavTab); setIsWorkspaceChooserOpen(false); onSwitchToMenu(); }}
                                                        className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-gray-300 hover:bg-white/10 cursor-pointer"
                                                    >
                                                        <MapIcon className="h-4 w-4 text-sky-400" />
                                                        <span>Configurar Layout</span>
                                                    </button>
                                                )}

                                                {/* Credits */}
                                                <button onClick={onOpenSaaSLimits} className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-gray-300 hover:bg-white/10 cursor-pointer">
                                                    <Coins className="h-4 w-4 text-amber-500" />
                                                    <span>Credits</span>
                                                </button>

                                                {/* ML Sync */}
                                                <Link href="/api/auth/ml/login" className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-gray-300 hover:bg-white/10 cursor-pointer">
                                                    <Zap className="h-4 w-4 text-emerald-500" />
                                                    <span>ML Sync</span>
                                                </Link>

                                                {/* Settings / Details */}
                                                <button onClick={onOpenWorkspaceDetail} className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-gray-300 hover:bg-white/10 cursor-pointer">
                                                    <Info className="h-4 w-4 text-blue-500" />
                                                    <span>Settings</span>
                                                </button>

                                                {/* Color Switcher */}
                                                <div className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-gray-300 hover:bg-white/10 relative">
                                                    <Droplet className="h-4 w-4 text-purple-500" />
                                                    <span className="flex-1">Color Switcher</span>
                                                    <input
                                                        type="color"
                                                        className="w-6 h-6 rounded border-0 p-0 bg-transparent cursor-pointer"
                                                        onChange={(e) => onSetSpecificColor?.(e.target.value)}
                                                    />
                                                </div>

                                                <div className="my-2 border-t border-white/10" />

                                                {/* Menu Mode Toggle */}
                                                <button onClick={() => { onSwitchToMenu(); setIsWorkspaceChooserOpen(false); }} className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-gray-300 hover:bg-white/10 cursor-pointer">
                                                    <LayoutGrid className="h-4 w-4 text-blue-400" />
                                                    <span>Modo Menu (Clássico)</span>
                                                </button>

                                                <div className="my-2 border-t border-white/10" />

                                                {/* User Profile */}
                                                <div className="flex items-center justify-between gap-3 px-3 py-2 text-sm text-gray-300 hover:bg-white/10 rounded-lg">
                                                    <span>Meu Perfil</span>
                                                    <UserButton />
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            </div>

                            {/* Row 2: Nav Tab Light Chooser */}
                            {currentNavItems.length > 0 && (
                                <div className="mb-3 flex items-center justify-end">
                                    <div className="relative" ref={navChooserRef}>
                                        <button
                                            onClick={() => setIsNavChooserOpen(!isNavChooserOpen)}
                                            className={cn(
                                                "flex items-center gap-2 rounded-xl bg-white/90 backdrop-blur-md px-4 py-2 text-gray-700 shadow-sm border border-gray-200 transition-all hover:bg-white cursor-pointer",
                                                isNavChooserOpen && "ring-2 ring-blue-500/50 border-blue-300"
                                            )}
                                        >
                                            {(() => {
                                                const currentTab = currentNavItems.find(t => t.id === activeTab);
                                                const Icon = currentTab?.icon || LayoutGrid;
                                                return (
                                                    <>
                                                        <Icon className="h-4 w-4 text-blue-600" />
                                                        <span className="font-bold text-xs uppercase tracking-widest">{currentTab?.label || "Selecione"}</span>
                                                        <ChevronUp className={cn("h-4 w-4 text-gray-400 shrink-0 transition-transform ml-2", isNavChooserOpen && "rotate-180")} />
                                                    </>
                                                );
                                            })()}
                                        </button>

                                        <AnimatePresence>
                                            {isNavChooserOpen && (
                                                <motion.div
                                                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                                    className="absolute bottom-full right-0 mb-2 w-56 max-h-[300px] overflow-y-auto rounded-xl bg-white p-2 shadow-xl border border-gray-100 z-50"
                                                >
                                                    <div className="mb-2 px-2 text-[10px] font-black text-gray-400 uppercase tracking-widest">Navegação</div>
                                                    {currentNavItems.map((item) => {
                                                        const Icon = item.icon;
                                                        const isActive = activeTab === item.id;
                                                        return (
                                                            <button
                                                                key={item.id}
                                                                onClick={() => {
                                                                    onTabChange(item.id as NavTab);
                                                                    setIsNavChooserOpen(false);
                                                                    onSwitchToMenu();
                                                                }}
                                                                className={cn(
                                                                    "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors cursor-pointer",
                                                                    isActive ? "bg-blue-50 text-blue-700 font-bold" : "text-gray-600 hover:bg-gray-50"
                                                                )}
                                                            >
                                                                <Icon className={cn("h-4 w-4", isActive ? "text-blue-600" : "text-gray-400")} />
                                                                <span>{item.label}</span>
                                                            </button>
                                                        );
                                                    })}
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </div>
                                </div>
                            )}

                            {/* Chat Input Area */}
                            <div className="relative rounded-2xl bg-white shadow-xl ring-1 ring-gray-900/5 focus-within:ring-2 focus-within:ring-blue-500/50">
                                <div className="flex items-center px-3 py-2.5">
                                    <input
                                        ref={inputRef}
                                        type="text"
                                        value={inputValue}
                                        onChange={(e) => setInputValue(e.target.value)}
                                        onKeyDown={handleKeyDown}
                                        placeholder={isListening ? "Ouvindo..." : "Escreva um comando ou converse..."}
                                        className="flex-1 bg-transparent text-sm sm:text-base text-gray-900 placeholder:text-gray-400 focus:outline-none cursor-text pl-2"
                                    />

                                    <div className="flex items-center gap-1 shrink-0">
                                        <button
                                            onClick={() => window.dispatchEvent(new CustomEvent('start-voice-chat'))}
                                            className={cn("p-2 rounded-lg transition-colors", isListening ? "bg-rose-100 text-rose-600 animate-pulse" : "text-gray-400 hover:bg-gray-100 hover:text-blue-600")}
                                        >
                                            <Mic className="h-4 w-4" />
                                        </button>
                                        <button
                                            onClick={() => document.getElementById('chat-img-upload')?.click()}
                                            className="p-2 text-gray-400 hover:bg-gray-100 hover:text-blue-600 rounded-lg transition-colors"
                                        >
                                            <ImageIcon className="h-4 w-4" />
                                            <input type="file" id="chat-img-upload" className="hidden" onChange={handleImageUpload} accept="image/*" />
                                        </button>
                                        <button
                                            onClick={handleSend}
                                            disabled={(!inputValue.trim() && pendingImages.length === 0) || isAIThinking}
                                            className={cn(
                                                "ml-1 flex h-8 w-8 items-center justify-center rounded-full transition-all",
                                                (inputValue.trim() || pendingImages.length > 0) && !isAIThinking
                                                    ? "bg-blue-600 text-white shadow-md hover:bg-blue-500 cursor-pointer"
                                                    : "bg-gray-100 text-gray-400 cursor-not-allowed"
                                            )}
                                        >
                                            {isAIThinking ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </motion.div>

            {/* Small Pull Tab when collapsed */}
            {!isExpanded && (
                <motion.div
                    key="pull-tab"
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: 20, opacity: 0 }}
                    onClick={() => onSwitchToChat?.()}
                    className="fixed bottom-0 left-1/2 -translate-x-1/2 z-[110] w-32 h-8 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md rounded-t-2xl shadow-[0_-5px_15px_rgba(0,0,0,0.1)] border border-gray-200 dark:border-gray-800 border-b-0 cursor-pointer flex items-center justify-center group"
                >
                    <div className="w-10 h-1.5 bg-gray-300 dark:bg-gray-600 rounded-full group-hover:bg-gray-400 transition-colors" />
                </motion.div>
            )}

            {/* Floating Indicator (Mic) and Help when collapsed */}
            {!isExpanded && (
                <motion.div 
                    key="floating-actions"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed bottom-8 right-8 z-[120] flex items-end gap-2"
                >
                    {/* Help/Commands Button */}
                    <motion.button
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0, opacity: 0 }}
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setIsHelpModalOpen(true)}
                        className="mb-10 -mr-4 w-8 h-8 rounded-full bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 shadow-xl border border-gray-200 dark:border-gray-700 flex items-center justify-center hover:bg-gray-50 cursor-pointer"
                    >
                        <HelpCircle className="w-4 h-4" />
                    </motion.button>
                    
                    <motion.button
                        initial={{ scale: 0, opacity: 0, y: 20 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0, opacity: 0, y: 20 }}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => window.dispatchEvent(new CustomEvent('start-voice-chat'))}
                        className="pointer-events-auto flex h-14 w-14 items-center justify-center rounded-full bg-blue-600 text-white shadow-2xl shadow-blue-500/30 hover:bg-blue-500 transition-colors cursor-pointer"
                    >
                        <Mic className="h-6 w-6" />
                    </motion.button>
                </motion.div>
            )}

            {/* Voice Help Modal */}
            <AnimatePresence>
                {isHelpModalOpen && (
                    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsHelpModalOpen(false)}
                            className="absolute inset-0 bg-black/40 backdrop-blur-sm cursor-pointer"
                        />
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.95, opacity: 0, y: 20 }}
                            className="relative w-full max-w-sm bg-white dark:bg-gray-900 rounded-3xl p-6 shadow-2xl border border-gray-100 dark:border-gray-800 overflow-hidden"
                        >
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-black tracking-tight text-gray-900 dark:text-white flex items-center gap-2">
                                    <Mic className="w-5 h-5 text-blue-500" />
                                    Comandos de Voz
                                </h3>
                                <button onClick={() => setIsHelpModalOpen(false)} className="p-2 bg-gray-100 dark:bg-gray-800 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 cursor-pointer">
                                    <X className="w-4 h-4 text-gray-500" />
                                </button>
                            </div>
                            
                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 leading-relaxed">
                                Você pode usar sua voz para interagir e executar ações diretamente no sistema. Diga algo como:
                            </p>
                            
                            <div className="space-y-3">
                                <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-2xl border border-blue-100 dark:border-blue-800/30">
                                    <span className="block text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-widest mb-1">Navegação & Interface</span>
                                    <ul className="text-sm text-gray-700 dark:text-gray-300 space-y-1 font-medium">
                                        <li>"Abrir chat IA", "Recolher chat"</li>
                                        <li>"Mudar cor para escuro", "Alterar cor para vermelho"</li>
                                        <li>"Abrir navegação", "Selecionar workspace X"</li>
                                        <li>"Ver meus créditos", "Abrir meu perfil"</li>
                                    </ul>
                                </div>
                                <div className="bg-emerald-50 dark:bg-emerald-900/20 p-3 rounded-2xl border border-emerald-100 dark:border-emerald-800/30">
                                    <span className="block text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest mb-1">Operações do Sistema</span>
                                    <ul className="text-sm text-gray-700 dark:text-gray-300 space-y-1 font-medium">
                                        <li>"Adicionar cliente chamado Carlos", "Registrar nova cliente chamada Ana"</li>
                                        <li>"Adicionar novo produto (Mesa, R$200)"</li>
                                        <li>"Colocar item no setor B2", "Fazer picking do SKU 123"</li>
                                        <li>"Criar relatório de vendas"</li>
                                    </ul>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </AnimatePresence>
    );
}
