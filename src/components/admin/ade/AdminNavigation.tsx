"use client";

import {
    BookOpen,
    LayoutGrid,
    Users,
    FileText,
    FolderOpen,
    Gavel,
    PieChart,
    BarChart3,
    Library,
    Trophy,
    Target,
    Shapes,
    Shield,
    Truck,
    ClipboardList,
    Map as MapIcon,
    ShoppingBag,
    Star,
    Sparkles,
    Mic,
    MessageSquare,
    Menu as MenuIcon,
    X,
    Globe
} from "lucide-react";
import { FaGavel } from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";
import { useRef, useEffect } from "react";
import { cn } from "@/lib/utils";
import { useUIStore } from "@/lib/stores/uiStore";

export type NavTab = "library" | "ranking" | "arcs" | "characters" | "notes" | "files" | "logistics" | "layout" | "store" | "clients" | "staff" | "chat_history" | "global_users";

interface AdminNavigationProps {
    activeTab: NavTab;
    onTabChange: (tab: NavTab) => void;
    templateId?: string;
    onSwitchToChat?: () => void;
    userRole?: string;
}

export function AdminNavigation({ activeTab, onTabChange, templateId = "template_1", onSwitchToChat, userRole = "user" }: AdminNavigationProps) {
    const isDesktopSidebarOpen = useUIStore(state => state.isDesktopSidebarOpen);
    const toggleDesktopSidebar = useUIStore(state => state.toggleDesktopSidebar);
    const setDesktopSidebarOpen = useUIStore(state => state.setDesktopSidebarOpen);

    const sidebarRef = useRef<HTMLDivElement>(null);
    const buttonRef = useRef<HTMLButtonElement>(null);

    // Click outside to close sidebar
    useEffect(() => {
        function handleClickOutside(event: MouseEvent | PointerEvent | TouchEvent) {
            if (
                isDesktopSidebarOpen &&
                sidebarRef.current &&
                !sidebarRef.current.contains(event.target as Node) &&
                buttonRef.current &&
                !buttonRef.current.contains(event.target as Node)
            ) {
                setDesktopSidebarOpen(false);
            }
        }

        document.addEventListener("pointerdown", handleClickOutside);
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("pointerdown", handleClickOutside);
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [isDesktopSidebarOpen, setDesktopSidebarOpen]);

    // Resolve Configuration based on Template
    const isWriters = templateId === "template_love_writers";
    const isTrade = templateId === "template_trade_ranking";
    const isFurniture = templateId?.startsWith("template_furniture");
    const isLogistics = templateId === "template_furniture_logistics";
    const isLayout = templateId === "template_furniture_layout";

    // Theme Colors
    const theme = {
        primary: isTrade ? "emerald" : isWriters ? "pink" : isFurniture ? "sky" : "blue",
        colorCode: isTrade ? "#10b981" : isWriters ? "#e11d48" : isFurniture ? "#0ea5e9" : "#2563eb",
        bgLight: isTrade ? "bg-emerald-50" : isWriters ? "bg-pink-50" : isFurniture ? "bg-sky-50" : "bg-blue-50",
        textPrimary: isTrade ? "text-emerald-600" : isWriters ? "text-pink-600" : isFurniture ? "text-sky-600" : "text-blue-600",
        textHover: isTrade ? "hover:text-emerald-400" : isWriters ? "hover:text-pink-400" : isFurniture ? "hover:text-sky-400" : "hover:text-blue-400",
        borderActive: isTrade ? "bg-emerald-600" : isWriters ? "bg-pink-600" : isFurniture ? "bg-sky-600" : "bg-blue-600",
        shadow: isTrade ? "shadow-emerald-200" : isWriters ? "shadow-pink-200" : isFurniture ? "shadow-sky-200" : "shadow-blue-200",
    };

    const LogoIcon = isTrade ? FaGavel : isWriters ? BookOpen : isFurniture ? ShoppingBag : PieChart;

    const navItems = [
        ...(isWriters ? [{ id: "library", label: "Biblioteca", icon: Library }] : []),
        ...(isTrade ? [{ id: "ranking", label: "Ranking", icon: FaGavel }] : []),

        ...(isFurniture ? [
            { id: "store", label: "Loja", icon: ShoppingBag },
            { id: "logistics", label: "Painel Pedidos", icon: ClipboardList },
            { id: "layout", label: "Mapa Loja", icon: MapIcon },
            { id: "clients", label: "Clientes", icon: Users },
            { id: "staff", label: "Equipe", icon: Shield },
            { id: "chat_history", label: "Histórico IA", icon: MessageSquare },
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
        { 
            id: "members", 
            label: userRole === "admin" ? "Usuários" : "Colaboradores", 
            icon: Users 
        },
    ] as const;

    return (
        <>
            {/* Floating Hamburger Button (Desktop) */}
            <button
                ref={buttonRef}
                onClick={toggleDesktopSidebar}
                className={cn(
                    "hidden md:flex fixed top-5 z-[60] p-3 rounded-xl shadow-xl border transition-all duration-300 cursor-pointer backdrop-blur-md",
                    isDesktopSidebarOpen
                        ? "left-[88px] bg-white border-gray-200 text-gray-700 hover:bg-gray-50"
                        : "left-6 bg-white/80 border-gray-200/50 text-gray-700 hover:bg-white hover:scale-105"
                )}
            >
                {isDesktopSidebarOpen ? <X className="w-5 h-5" /> : <MenuIcon className="w-5 h-5" />}
            </button>

            {/* Desktop Sidebar */}
            <AnimatePresence>
                {isDesktopSidebarOpen && (
                    <motion.aside
                        ref={sidebarRef}
                        initial={{ width: 0, opacity: 0, x: -80 }}
                        animate={{ width: 80, opacity: 1, x: 0 }}
                        exit={{ width: 0, opacity: 0, x: -80 }}
                        className="hidden md:flex flex-col border-r border-gray-100 bg-white h-screen sticky top-0 z-50 items-center py-6 overflow-hidden shrink-0"
                    >
                        {/* Dynamic Logo */}
                        {/* <div 
                            className={cn(
                                "w-12 h-12 rounded-xl flex shrink-0 items-center justify-center text-white shadow-lg mb-10 transition-colors duration-500",
                                isTrade ? "bg-emerald-600 shadow-emerald-100" : 
                                isWriters ? "bg-pink-600 shadow-pink-100" : 
                                isLogistics ? "bg-sky-600 shadow-sky-100" :
                                isLayout ? "bg-indigo-600 shadow-indigo-100" :
                                "bg-blue-600 shadow-blue-100"
                            )}
                        >
                            <LogoIcon className="w-6 h-6" />
                        </div> */}

                        <nav className="flex flex-col gap-4 w-full px-2">
                            {navItems.map((item) => {
                                const Icon = item.icon;
                                const isActive = activeTab === item.id;

                                return (
                                    <div key={item.id} className="relative group flex justify-center w-full">
                                        <button
                                            onClick={() => {
                                                onTabChange(item.id as NavTab);
                                                if (item.id === 'chat_history' && onSwitchToChat) {
                                                    onSwitchToChat();
                                                }
                                            }}
                                            className={cn(
                                                "p-3 rounded-2xl transition-all duration-300 relative cursor-pointer w-12 flex justify-center shrink-0",
                                                isActive
                                                    ? `${theme.bgLight} ${theme.textPrimary} shadow-inner`
                                                    : `text-gray-400 ${theme.textHover} hover:bg-gray-50`
                                            )}
                                        >
                                            <Icon className="w-6 h-6" />
                                            {isActive && (
                                                <motion.div
                                                    layoutId="activeSide"
                                                    className={cn("absolute left-[-8px] top-3 bottom-3 w-1 rounded-full", theme.borderActive)}
                                                />
                                            )}
                                        </button>

                                        {/* Tooltip */}
                                        <div className="absolute left-full ml-3 px-3 py-1.5 bg-gray-900 text-white text-xs font-bold rounded-lg opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-50 whitespace-nowrap shadow-xl">
                                            {item.label}
                                            <div className="absolute left-[-4px] top-1/2 -translate-y-1/2 border-y-[4px] border-y-transparent border-r-[4px] border-r-gray-900" />
                                        </div>
                                    </div>
                                );
                            })}
                        </nav>
                    </motion.aside>
                )}
            </AnimatePresence>

            {/* Mobile Bottom Menu (Floating) */}
            <div className="md:hidden fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] w-[95%] max-w-sm">
                <div className="bg-white/80 backdrop-blur-xl border border-white/20 shadow-2xl rounded-3xl p-2 px-4 overflow-x-auto hide-scrollbar mask-linear-fade flex items-center gap-2">
                    <nav className="flex justify-start sm:justify-between items-center w-max sm:w-full min-w-full gap-2">
                        {navItems.map((item) => {
                            const Icon = item.icon;
                            const isActive = activeTab === item.id;

                            return (
                                <button
                                    key={item.id}
                                    onClick={() => {
                                        onTabChange(item.id as NavTab);
                                        if (item.id === 'chat_history' && onSwitchToChat) {
                                            onSwitchToChat();
                                        }
                                    }}
                                    className={cn(
                                        "p-3 rounded-2xl transition-all duration-300 relative flex flex-col items-center gap-1 cursor-pointer",
                                        isActive
                                            ? theme.textPrimary
                                            : "text-gray-400"
                                    )}
                                >
                                    <Icon className={cn("w-6 h-6 transition-transform", isActive && "scale-110")} />
                                    {isActive && (
                                        <motion.div
                                            layoutId="activeBottom"
                                            className={cn("absolute -bottom-1 w-1 h-1 rounded-full", theme.borderActive)}
                                        />
                                    )}
                                </button>
                            );
                        })}

                        {onSwitchToChat && (
                            <>
                                <div className="w-px h-8 bg-gray-200 mx-1" />
                                <button
                                    onClick={() => {
                                        onSwitchToChat();
                                        window.dispatchEvent(new CustomEvent('start-voice-chat'));
                                    }}
                                    className="p-3 rounded-2xl transition-all duration-300 relative flex flex-col items-center gap-1 cursor-pointer text-blue-500 hover:text-blue-600"
                                >
                                    <Mic className="w-6 h-6" />
                                </button>
                            </>
                        )}
                    </nav>
                </div>
            </div>
        </>
    );
}
