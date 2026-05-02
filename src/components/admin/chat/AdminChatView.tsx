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
    CheckCircle2
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
        ...( !isFurniture ? [{ 
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
    onSwitchToMenu: () => void;
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
    onSwitchToMenu,
    onOpenWorkspaceDetail,
    onSetSpecificColor,
    onOpenSaaSLimits
}: AdminChatViewProps) {
    const [inputValue, setInputValue] = useState("");
    const [messages, setMessages] = useState<Array<{ role: 'user' | 'assistant', content: string | ReactNode }>>([]);
    const [isTyping, setIsTyping] = useState(false);
    const [isWorkspaceChooserOpen, setIsWorkspaceChooserOpen] = useState(false);
    const [isCollapsed, setIsCollapsed] = useState(true);
    const [pendingImages, setPendingImages] = useState<any[]>([]);
    const [isListening, setIsListening] = useState(false);

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

    const inputRef = useRef<HTMLInputElement>(null);
    const chooserRef = useRef<HTMLDivElement>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const chatWrapperRef = useRef<HTMLDivElement>(null);

    // Close chat when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (isCollapsed) return;
            if (chatWrapperRef.current && chatWrapperRef.current.contains(event.target as Node)) return;
            setIsCollapsed(true);
        };

        if (!isCollapsed) {
            document.addEventListener('mousedown', handleClickOutside);
            return () => document.removeEventListener('mousedown', handleClickOutside);
        }
    }, [isCollapsed]);

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
        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        if (!SpeechRecognition) return;
        
        const recognition = new SpeechRecognition();
        recognition.lang = 'pt-BR';
        recognition.onstart = () => setIsListening(true);
        recognition.onend = () => setIsListening(false);
        recognition.onresult = (e: any) => {
            const transcript = Array.from(e.results).map((r: any) => r[0].transcript).join('');
            setInputValue(transcript);
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
        <>
            <AnimatePresence>
                {!isCollapsed && messages.length > 0 && (
                    <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 20 }}
                        className="fixed bottom-[110px] left-0 right-0 z-40 pointer-events-none flex flex-col justify-end px-4 pb-4 max-h-[50vh] overflow-hidden"
                    >
                        <div className="mx-auto max-w-5xl w-full space-y-4 pointer-events-auto overflow-y-auto max-h-full scrollbar-hide">
                            {messages.map((msg, idx) => (
                                <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                    <div className={
                                        msg.role === 'user'
                                            ? "bg-[#333] text-white rounded-2xl rounded-tr-sm px-5 py-3 max-w-[80%] shadow-lg"
                                            : "bg-white border border-gray-100 shadow-xl text-gray-900 rounded-2xl rounded-tl-sm px-5 py-3 max-w-[90%]"
                                    }>
                                        {msg.content}
                                    </div>
                                </div>
                            ))}

                            {isTyping && (
                                <div className="flex justify-start">
                                    <div className="bg-white border border-gray-100 shadow-xl rounded-2xl rounded-tl-sm px-4 py-3">
                                        <div className="flex space-x-1">
                                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-0" />
                                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-150" />
                                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-300" />
                                        </div>
                                    </div>
                                </div>
                            )}
                            <div ref={messagesEndRef} />
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="fixed bottom-0 left-0 right-0 z-50 pointer-events-none">
                <AnimatePresence>
                    {!isCollapsed && (
                        <motion.div 
                            ref={chatWrapperRef}
                            initial={{ y: "100%", opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            exit={{ y: "100%", opacity: 0 }}
                            transition={{ type: "spring", stiffness: 300, damping: 30 }}
                            className="relative w-full py-6 pointer-events-auto"
                        >
                            <div className="absolute inset-0 bg-gradient-to-t from-white/60 via-white/40 to-transparent backdrop-blur-md pointer-events-none -z-10 dark:from-black/60 dark:via-black/40" />

                            <div className="container mx-auto px-6">
                    <div className="mb-3 flex items-center gap-3">
                        <div className="relative" ref={chooserRef}>
                            <button
                                onClick={() => setIsWorkspaceChooserOpen(!isWorkspaceChooserOpen)}
                                className={cn(
                                    "flex items-center gap-2 rounded-xl bg-[#333] px-4 py-2 text-white shadow-lg ring-1 ring-white/10 transition-all hover:bg-[#404040] cursor-pointer",
                                    isWorkspaceChooserOpen && "ring-2 ring-white/20"
                                )}
                            >
                                <span style={{ color: currentColor }}>
                                    {getTemplateIcon(currentWorkspace?.promptSettings?.templateId)}
                                </span>
                                <span className="font-medium text-sm max-w-[150px] truncate">
                                    {currentWorkspace?.name || "Select Workspace"}
                                </span>
                                <ChevronUp className="h-4 w-4 text-gray-400 shrink-0" />
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
                                        
                                        {/* User Profile */}
                                        <div className="flex items-center justify-between gap-3 px-3 py-2 text-sm text-gray-300 hover:bg-white/10 rounded-lg">
                                            <span>Meu Perfil</span>
                                            <UserButton />
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>

                        {currentNavItems.length > 0 && (
                            <div 
                                ref={scrollContainerRef}
                                className={cn(
                                    "flex flex-1 items-center gap-2 overflow-x-auto py-1 mask-linear-fade select-none",
                                    isDragging ? "cursor-grabbing" : "cursor-grab"
                                )}
                                style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
                                onMouseDown={onMouseDown}
                                onMouseLeave={onMouseLeaveDrag}
                                onMouseUp={onMouseUp}
                                onMouseMove={onMouseMove}
                            >
                                {currentNavItems.map((item) => {
                                    const Icon = item.icon;
                                    const isActive = activeTab === item.id;
                                    return (
                                        <button
                                            key={item.id}
                                            onClick={() => {
                                                if (isDragging) return;
                                                onTabChange(item.id as NavTab);
                                                setIsCollapsed(true);
                                                // Removed setMessages as requested
                                            }}
                                            className={cn(
                                                "whitespace-nowrap rounded-lg px-3 py-1.5 text-sm font-medium transition-all cursor-pointer border flex items-center gap-2 group",
                                                isActive
                                                    ? "bg-[#333] text-white border-[#333]"
                                                    : "bg-white text-gray-600 border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                                            )}
                                        >
                                            <Icon className={cn("h-3.5 w-3.5", isActive ? "text-white" : "text-gray-400 group-hover:text-blue-500")} />
                                            {item.label}
                                        </button>
                                    );
                                })}
                            </div>
                        )}

                        <button
                            onClick={onSwitchToMenu}
                            className="ml-auto shrink-0 flex items-center justify-center h-9 w-9 rounded-xl bg-blue-50 text-blue-600 font-medium hover:bg-blue-100 transition-colors shadow-sm ring-1 ring-blue-100 cursor-pointer"
                            title="Modo Menu"
                        >
                            <LayoutGrid className="w-5 h-5" />
                        </button>
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
                                placeholder={isListening ? "Ouvindo..." : "Escreva um comando ou converse..."}
                                className="flex-1 bg-transparent text-base text-gray-900 placeholder:text-gray-400 focus:outline-none cursor-text"
                            />
                            
                            <div className="flex items-center gap-2 pr-1">
                                <button 
                                    onClick={toggleVoice}
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
                            </div>

                            <button
                                onClick={handleSend}
                                disabled={(!inputValue.trim() && pendingImages.length === 0) || isAIThinking}
                                className={cn(
                                    "ml-3 flex h-8 w-8 items-center justify-center rounded-full transition-all",
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
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Floating Button when collapsed */}
                <AnimatePresence>
                    {isCollapsed && (
                        <motion.button
                            initial={{ scale: 0, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0, opacity: 0, y: 20 }}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => setIsCollapsed(false)}
                            className="absolute bottom-8 right-8 pointer-events-auto flex h-16 w-16 items-center justify-center rounded-full bg-blue-600 text-white shadow-2xl shadow-blue-500/30 hover:bg-blue-500 transition-colors z-50 cursor-pointer"
                        >
                            <Sparkles className="h-7 w-7" />
                        </motion.button>
                    )}
                </AnimatePresence>
            </div>
        </>
    );
}
