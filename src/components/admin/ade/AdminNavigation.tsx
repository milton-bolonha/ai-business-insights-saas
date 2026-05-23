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
    Globe,
    CalendarDays,
    BrainCircuit,
    User
} from "lucide-react";
import { FaGavel } from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";
import { useRef, useEffect } from "react";
import { cn } from "@/lib/utils";
import { useUIStore } from "@/lib/stores/uiStore";

export type NavTab = "library" | "ranking" | "arcs" | "characters" | "notes" | "files" | "logistics" | "layout" | "store" | "clients" | "staff" | "chat_history" | "global_users" | "mentoring_insights" | "mentoring_tasks" | "mentoring_schedule" | "mentoring_profile" | "survey";

interface AdminNavigationProps {
    activeTab: NavTab;
    onTabChange: (tab: NavTab) => void;
    templateId?: string;
    onSwitchToChat?: () => void;
    userRole?: string;
    currentUserRole?: 'mentor' | 'mentee';
}

export function AdminNavigation({ activeTab, onTabChange, templateId = "template_1", onSwitchToChat, userRole = "user", currentUserRole = "mentor" }: AdminNavigationProps) {
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
    const isSurvey = templateId === "template_smart_survey";

    // Theme Colors
    const theme = {
        primary: isTrade || isSurvey ? "emerald" : isWriters ? "pink" : isFurniture ? "sky" : "blue",
        colorCode: isTrade || isSurvey ? "#10b981" : isWriters ? "#e11d48" : isFurniture ? "#0ea5e9" : "#2563eb",
        bgLight: isTrade || isSurvey ? "bg-emerald-50" : isWriters ? "bg-pink-50" : isFurniture ? "bg-sky-50" : "bg-blue-50",
        textPrimary: isTrade || isSurvey ? "text-emerald-600" : isWriters ? "text-pink-600" : isFurniture ? "text-sky-600" : "text-blue-600",
        textHover: isTrade || isSurvey ? "hover:text-emerald-400" : isWriters ? "hover:text-pink-400" : isFurniture ? "hover:text-sky-400" : "hover:text-blue-400",
        borderActive: isTrade || isSurvey ? "bg-emerald-600" : isWriters ? "bg-pink-600" : isFurniture ? "bg-sky-600" : "bg-blue-600",
        shadow: isTrade || isSurvey ? "shadow-emerald-200" : isWriters ? "shadow-pink-200" : isFurniture ? "shadow-sky-200" : "shadow-blue-200",
    };

    const LogoIcon = isTrade ? FaGavel : isWriters ? BookOpen : isFurniture ? ShoppingBag : PieChart;

    const isMentoring = templateId === "template_io_mentoring";
    const isMentee = isMentoring && currentUserRole === "mentee";

    const navItems = [
        ...(isWriters ? [{ id: "library", label: "Biblioteca", icon: Library }] : []),
        ...(isTrade ? [{ id: "ranking", label: "Ranking", icon: FaGavel }] : []),
        ...(isSurvey ? [{ id: "survey", label: "Inquérito", icon: ClipboardList }] : []),

        ...(isFurniture ? [
            { id: "store", label: "Loja", icon: ShoppingBag },
            { id: "logistics", label: "Painel Pedidos", icon: ClipboardList },
            { id: "layout", label: "Mapa Loja", icon: MapIcon },
            { id: "clients", label: "Clientes", icon: Users },
            { id: "staff", label: "Equipe", icon: Shield },
            { id: "chat_history", label: "Histórico IA", icon: MessageSquare },
        ] : []),

        ...(isMentoring ? [
            { id: "mentoring_profile", label: "Painel de Evolução", icon: User },
            { id: "mentoring_tasks", label: "Tarefas (Kanban)", icon: ClipboardList },
            { id: "mentoring_schedule", label: "Agenda Sessões", icon: CalendarDays },
        ] : []),

        ...(!isMentee ? [{
            id: "arcs",
            label: isTrade ? "Análise" : isWriters ? "Arcos" : isFurniture ? "Insights" : isSurvey ? "Análise IA" : "Dashboard",
            icon: LayoutGrid
        }] : []),
        ...((!isFurniture && !isMentee) ? [{
            id: "characters",
            label: isWriters ? "Elenco" : "Contatos",
            icon: isTrade ? Shapes : Users
        }] : []),
        ...((!isFurniture && !isMentoring) ? [{
            id: "notes",
            label: "Notas",
            icon: FileText
        }] : (isFurniture && !isMentee) ? [{
            id: "notes",
            label: "Relatórios",
            icon: FileText
        }] : []),
        ...(!isMentee ? [{ id: "files", label: "Arquivos", icon: FolderOpen }] : []),
        ...(!isMentee ? [{ 
            id: "members", 
            label: "Cadastros", 
            icon: Users 
        }] : []),
        ...(userRole === "admin" ? [{
            id: "global_users" as any,
            label: "Global Admin",
            icon: Globe
        }] : []),
    ] as const;

    return (
        <>
            {/* Floating Hamburger Button (Desktop & Mobile) */}
            <button
                ref={buttonRef}
                onClick={toggleDesktopSidebar}
                className={cn(
                    "flex fixed top-5 z-[60] p-3 rounded-xl shadow-xl border transition-all duration-300 cursor-pointer backdrop-blur-md",
                    isDesktopSidebarOpen
                        ? "left-[88px] bg-white border-gray-200 text-gray-700 hover:bg-gray-50"
                        : "left-6 bg-white/80 border-gray-200/50 text-gray-700 hover:bg-white hover:scale-105"
                )}
            >
                {isDesktopSidebarOpen ? <X className="w-5 h-5" /> : <MenuIcon className="w-5 h-5" />}
            </button>

            {/* Sidebar (Responsive Overlay on Mobile, Sticky on Desktop) */}
            <AnimatePresence>
                {isDesktopSidebarOpen && (
                    <motion.aside
                        ref={sidebarRef}
                        initial={{ width: 0, opacity: 0, x: -80 }}
                        animate={{ width: 80, opacity: 1, x: 0 }}
                        exit={{ width: 0, opacity: 0, x: -80 }}
                        className="flex flex-col border-r border-gray-100 bg-white h-screen fixed md:sticky top-0 left-0 z-50 items-center py-6 overflow-hidden shrink-0 shadow-2xl md:shadow-none"
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
                                                // Close mobile sidebar on selection
                                                if (window.innerWidth < 768) {
                                                    setDesktopSidebarOpen(false);
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


        </>
    );
}
