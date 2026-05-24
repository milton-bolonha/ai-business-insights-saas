"use client";

import { useState, useEffect } from "react";
import {
    ChevronDown,
    Plus,
    BookOpen,
    Users,
    LayoutGrid,
    MonitorPlay,
    Share2,
    PieChart,
    Home,
    Droplet,
    Info,
    Coins,
    Trash2,
    Target,
    Zap,
    Bell,
    Sparkles,
    Award,
    AlertTriangle
} from "lucide-react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import type { AdeAppearanceTokens } from "@/lib/ade-theme";
import { usePathname } from "next/navigation";
import { UserButton } from "@clerk/nextjs";
import { BookWriterView } from "@/components/love-writers/BookWriterView";
import { useTranslation } from "@/lib/hooks/useTranslation";

import {
    useWorkspaceStore,
    useCurrentWorkspace,
    useWorkspaceActions,
    useUIStore
} from "@/lib/stores";
import { useUsage, useAuthStore, useUser } from "@/lib/stores/authStore";

export interface AdminTopHeaderProps {
    appearance: AdeAppearanceTokens;
    onOpenSaaSLimits?: () => void;
    onOpenWorkspaceDetail?: () => void;
    onDeleteWorkspace?: (workspaceId: string) => void;
    onSetSpecificColor?: (color: string) => void;
    hideWorkspaceSwitcher?: boolean;
}

export function AdminTopHeader({
    appearance,
    onOpenSaaSLimits,
    onOpenWorkspaceDetail,
    onDeleteWorkspace,
    onSetSpecificColor,
    hideWorkspaceSwitcher
}: AdminTopHeaderProps) {
    const [isWorkspaceOpen, setIsWorkspaceOpen] = useState(false);
    const [isDashboardOpen, setIsDashboardOpen] = useState(false);
    const [isColorPickerOpen, setIsColorPickerOpen] = useState(false);
    const [isBookWriterOpen, setIsBookWriterOpen] = useState(false);
    const [isBookLibraryOpen, setIsBookLibraryOpen] = useState(false);
    const pathname = usePathname();
    const { t, locale, setLocale } = useTranslation();

    // Zustand and auth store selectors (moved to top to avoid block-scope lint usage errors)
    const workspaces = useWorkspaceStore((state) => state.workspaces);
    const currentWorkspace = useCurrentWorkspace();
    const { switchWorkspace } = useWorkspaceActions();
    const usage = useUsage();
    const user = useUser();
    const limits = useAuthStore((state) => state.limits);

    // Notifications State & Logic
    const [notifications, setNotifications] = useState<any[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [isNotifOpen, setIsNotifOpen] = useState(false);

    const fetchNotifications = async () => {
        try {
            const res = await fetch(`/api/mentoring/notifications${currentWorkspace?.id ? `?workspaceId=${currentWorkspace.id}` : ""}`);
            if (res.ok) {
                const data = await res.json();
                setNotifications(data.notifications || []);
                setUnreadCount(data.unreadCount || 0);
            }
        } catch (err) {
            console.error("Error loading notifications:", err);
        }
    };

    const handleMarkAsRead = async () => {
        try {
            const res = await fetch(`/api/mentoring/notifications${currentWorkspace?.id ? `?workspaceId=${currentWorkspace.id}` : ""}`, {
                method: "PATCH"
            });
            if (res.ok) {
                setUnreadCount(0);
                // Update local list
                setNotifications(prev => prev.map(n => ({
                    ...n,
                    readBy: [...(n.readBy || []), user?.id].filter(Boolean)
                })));
            }
        } catch (err) {
            console.error("Error marking notifications as read:", err);
        }
    };

    useEffect(() => {
        fetchNotifications();
        // Setup polling every 30 seconds
        const interval = setInterval(fetchNotifications, 30000);
        return () => clearInterval(interval);
    }, [currentWorkspace?.id, user?.id]);

    // Determine context based on workspace template
    const isLoveWriters = currentWorkspace?.promptSettings?.templateId === "template_love_writers";



    // Create a display list (similar to sidebar logic)
    const availableWorkspaces = workspaces.map(ws => ({
        id: ws.id,
        name: ws.name,
        type: ws.promptSettings?.templateId === "template_love_writers" ? 'love_writers' :
            ws.promptSettings?.templateId === "template_trade_ranking" ? 'trade_ranking' : 'business_insights'
    }));

    const activeWorkspaceDisplay = currentWorkspace ? {
        id: currentWorkspace.id,
        name: currentWorkspace.name,
        type: isLoveWriters ? 'love_writers' :
            currentWorkspace.promptSettings?.templateId === "template_trade_ranking" ? 'trade_ranking' : 'business_insights'
    } : { id: 'none', name: t("common.switchWorkspace"), type: 'business_insights' };

    const handleColorChange = (color: string) => {
        if (onSetSpecificColor) {
            onSetSpecificColor(color);
        }
    };

    return (
        <header
            className="w-full border-b border-gray-100/10 transition-colors"
            style={{
                backgroundColor: "transparent",
                color: appearance.headingColor,
            }}
        >
            <div className="container mx-auto px-4 md:px-6 py-4 flex items-center justify-between relative">

                <div className="flex items-center gap-3">
                    {/* Brand Logo / Icons - Title removed as requested */}
                </div>

                {/* Center: Workspace Chooser - Hidden on mobile if needed, or adjusted */}
                {!hideWorkspaceSwitcher && (
                    <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-30 transition-all duration-200 group/ws">
                        <div className="relative flex items-center gap-1">
                            <button
                                onClick={() => setIsWorkspaceOpen(!isWorkspaceOpen)}
                                className="flex items-center gap-2 rounded-lg bg-white/5 px-3 py-1.5 text-sm font-medium hover:bg-white/10 transition-colors cursor-pointer border border-transparent hover:border-white/10"
                            >
                                {activeWorkspaceDisplay.type === 'love_writers' ? (
                                    <BookOpen className="h-4 w-4 text-rose-500" />
                                ) : activeWorkspaceDisplay.type === 'trade_ranking' ? (
                                    <Target className="h-4 w-4 text-emerald-500" />
                                ) : (
                                    <PieChart className="h-4 w-4 text-blue-500" />
                                )}
                                <span className="hidden md:block max-w-[150px] truncate">{activeWorkspaceDisplay.name}</span>
                                <ChevronDown className="h-4 w-4 text-gray-500" />
                            </button>
                            <AnimatePresence>
                                {isWorkspaceOpen && (
                                    <>
                                        <div
                                            className="fixed inset-0 z-40"
                                            onClick={() => setIsWorkspaceOpen(false)}
                                        />
                                        <motion.div
                                            initial={{ opacity: 0, y: 5 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: 5 }}
                                            className="absolute left-1/2 -translate-x-1/2 top-full z-50 mt-2 w-72 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-xl dark:border-gray-800 dark:bg-gray-900"
                                        >
                                            <div className="p-2">
                                                <div className="mb-2 px-2 text-xs font-semibold text-gray-500 uppercase">
                                                    {t("common.switchWorkspace")}
                                                </div>
                                                {availableWorkspaces.map((ws) => (
                                                    <div key={ws.id} className="group/item relative">
                                                        <button
                                                            onClick={() => {
                                                                switchWorkspace(ws.id);
                                                                setIsWorkspaceOpen(false);
                                                            }}
                                                            className={cn(
                                                                "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors pr-10",
                                                                currentWorkspace?.id === ws.id
                                                                    ? "bg-gray-100 text-gray-900 dark:bg-gray-800 dark:text-gray-100"
                                                                    : "text-gray-600 hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-gray-800"
                                                            )}
                                                        >
                                                            {ws.type === 'love_writers' ? (
                                                                <BookOpen className="h-4 w-4 text-rose-500" />
                                                            ) : ws.type === 'trade_ranking' ? (
                                                                <Target className="h-4 w-4 text-emerald-500" />
                                                            ) : (
                                                                <PieChart className="h-4 w-4 text-blue-500" />
                                                            )}
                                                            <span className="flex-1 text-left truncate">{ws.name}</span>
                                                            {currentWorkspace?.id === ws.id && (
                                                                <div className="h-1.5 w-1.5 rounded-full bg-green-500" />
                                                            )}
                                                        </button>

                                                        {onDeleteWorkspace && (
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    if (window.confirm(t("common.deleteWorkspaceConfirm", { name: ws.name }))) {
                                                                        onDeleteWorkspace(ws.id);
                                                                        if (currentWorkspace?.id === ws.id) {
                                                                            setIsWorkspaceOpen(false);
                                                                        }
                                                                    }
                                                                }}
                                                                className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover/item:opacity-100 p-1.5 rounded-md text-red-500 hover:bg-red-50 hover:text-red-700 transition-all"
                                                                title="Delete workspace"
                                                            >
                                                                <Trash2 className="h-3.5 w-3.5" />
                                                            </button>
                                                        )}
                                                    </div>
                                                ))}

                                                <div className="my-2 border-t border-gray-100 dark:border-gray-800" />

                                                <button
                                                    onClick={() => {
                                                        setIsWorkspaceOpen(false);
                                                        useUIStore.getState().openAddWorkspace();
                                                    }}
                                                    className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-gray-800 cursor-pointer"
                                                >
                                                    <div className="flex h-5 w-5 items-center justify-center rounded border border-dashed border-gray-400">
                                                        <Plus className="h-3 w-3" />
                                                    </div>
                                                    <span>{t("common.createWorkspace")}</span>
                                                </button>
                                            </div>
                                        </motion.div>
                                    </>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>
                )}


                {/* Right: Actions & User */}
                {!hideWorkspaceSwitcher && (
                    <div className="flex items-center gap-2 z-20">
                        {/* Workspace Info Icon */}
                        {currentWorkspace && (
                            <button
                                onClick={onOpenWorkspaceDetail}
                                className="flex h-9 w-9 items-center justify-center rounded-lg hover:bg-black/5 text-gray-500 hover:text-gray-700 transition-colors cursor-pointer"
                                title="Workspace Details"
                            >
                                <Info className="h-5 w-5 cursor-pointer" />
                            </button>
                        )}

                        <div className="h-6 w-px bg-gray-200/20 mx-1" />

                        {/* Color Picker (Droplet) */}
                        {currentWorkspace?.userAccessLevel !== "viewer" && (
                            <div className="relative">
                            <button
                                onClick={() => setIsColorPickerOpen(!isColorPickerOpen)}
                                className="flex h-9 w-9 items-center justify-center rounded-lg hover:bg-black/5 text-gray-500 transition-colors cursor-pointer"
                                title="Workspace background color"
                            >
                                <Droplet className="h-4 w-4 cursor-pointer" />
                            </button>
                            <AnimatePresence>
                                {isColorPickerOpen && (
                                    <>
                                        <div className="fixed inset-0 z-40" onClick={() => setIsColorPickerOpen(false)} />
                                        <motion.div
                                            initial={{ opacity: 0, scale: 0.9 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            exit={{ opacity: 0, scale: 0.9 }}
                                            className="absolute right-0 top-full z-50 mt-2 p-4 bg-white rounded-xl shadow-xl border border-gray-200 w-56"
                                        >
                                            <div className="space-y-4">
                                                {/* Quick color presets inside modal */}
                                                <div>
                                                    <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">{t("admin.header.presets")}</label>
                                                    <div className="grid grid-cols-4 gap-2">
                                                        {[
                                                            { color: "#f7f7f7", name: "Beige" },
                                                            { color: "#e8f4fd", name: "Blue" },
                                                            { color: "#f0f9e8", name: "Green" },
                                                            { color: "#fef7ed", name: "Orange" }
                                                        ].map((preset) => (
                                                            <button
                                                                key={preset.color}
                                                                onClick={() => {
                                                                    handleColorChange(preset.color);
                                                                    setIsColorPickerOpen(false);
                                                                }}
                                                                className="h-8 w-8 rounded-full border border-gray-100 shadow-sm cursor-pointer hover:scale-110 transition-transform"
                                                                style={{ backgroundColor: preset.color }}
                                                                title={preset.name}
                                                            />
                                                        ))}
                                                    </div>
                                                </div>

                                                <div className="border-t border-gray-100 pt-3">
                                                    <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">{t("admin.header.customColor")}</label>
                                                    <div className="flex items-center gap-2">
                                                        <input
                                                            type="color"
                                                            className="h-10 w-full cursor-pointer rounded-lg border border-gray-200 p-1 bg-gray-50"
                                                            onChange={(e) => handleColorChange(e.target.value)}
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        </motion.div>
                                    </>
                                )}
                            </AnimatePresence>
                            </div>
                        )}

                        <div className="h-6 w-px bg-gray-200/20 mx-1" />

                        {/* SaaS Limit Counter (Credits) */}
                        <button
                            onClick={onOpenSaaSLimits}
                            className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium hover:bg-white/5 transition-colors border border-amber-200/50 bg-amber-50/50 dark:bg-amber-900/10 dark:border-amber-700/30 cursor-pointer"
                            title="View Credit Balance"
                        >
                            <Coins className="h-4 w-4 text-amber-500 cursor-pointer" />
                            <span className="font-bold text-amber-700 dark:text-amber-400 cursor-pointer">
                                {Math.max(0, ((usage as any)?.creditsTotal || (limits as any)?.creditsTotal || 0) - ((usage as any)?.creditsUsed || 0))}
                            </span>
                        </button>

                        {/* Mercado Livre Master Connection (only for trade or store template) */}
                        {(() => {
                            const tid = currentWorkspace?.promptSettings?.templateId || "";
                            const isTradeOrStore =
                              tid === "template_trade_ranking" || tid === "template_furniture_store";
                            if (!isTradeOrStore) return null;
                            return (
                                <>
                                    <Link
                                        href="/api/auth/ml/login"
                                        className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-black uppercase tracking-widest hover:bg-emerald-100 transition-all border border-emerald-100"
                                        title="Connect Master Mercado Livre Account"
                                    >
                                        <Zap className="h-3 w-3" />
                                        ML Sync
                                    </Link>
                                    <div className="h-6 w-px bg-gray-200/20 mx-1" />
                                </>
                            );
                        })()}

                        {/* Notifications Bell Icon */}
                        <div className="relative">
                            <button
                                onClick={() => {
                                    setIsNotifOpen(!isNotifOpen);
                                    if (!isNotifOpen) {
                                        fetchNotifications();
                                    }
                                }}
                                className="relative flex h-9 w-9 items-center justify-center rounded-lg hover:bg-white/5 text-gray-500 hover:text-indigo-600 transition-colors cursor-pointer"
                                title={t("admin.header.notifications")}
                            >
                                <Bell className="h-5 w-5 cursor-pointer" />
                                {unreadCount > 0 && (
                                    <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[9px] font-bold text-white shadow-md animate-pulse">
                                        {unreadCount}
                                    </span>
                                )}
                            </button>
                            <AnimatePresence>
                                {isNotifOpen && (
                                    <>
                                        <div className="fixed inset-0 z-40" onClick={() => setIsNotifOpen(false)} />
                                        <motion.div
                                            initial={{ opacity: 0, scale: 0.95, y: 5 }}
                                            animate={{ opacity: 1, scale: 1, y: 0 }}
                                            exit={{ opacity: 0, scale: 0.95, y: 5 }}
                                            className="absolute right-0 top-full z-50 mt-2 p-5 bg-white rounded-[2rem] shadow-2xl border border-slate-100 w-80 max-h-[450px] overflow-hidden flex flex-col"
                                        >
                                            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-3">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-xs font-black uppercase tracking-wider text-slate-800">{t("admin.header.messagesAndNotices")}</span>
                                                    {unreadCount > 0 && (
                                                        <span className="bg-rose-50 text-rose-500 px-2 py-0.5 rounded-full text-[9px] font-black uppercase">{t("admin.header.newMessages", { count: unreadCount })}</span>
                                                    )}
                                                </div>
                                                {unreadCount > 0 && (
                                                    <button
                                                        onClick={handleMarkAsRead}
                                                        className="text-[9px] font-black uppercase text-indigo-600 hover:text-indigo-800 transition-colors cursor-pointer"
                                                    >
                                                        {t("admin.header.markAllRead")}
                                                    </button>
                                                )}
                                            </div>

                                            <div className="flex-1 overflow-y-auto space-y-3 pr-1 max-h-[300px]">
                                                {notifications.length === 0 ? (
                                                    <div className="text-center py-8 text-xs font-semibold text-slate-400">
                                                        {t("admin.header.noNotifications")}
                                                    </div>
                                                ) : (
                                                    notifications.map((notif: any) => {
                                                        const isUnread = !(notif.readBy || []).includes(user?.id) && notif.senderId !== user?.id;
                                                        return (
                                                            <div 
                                                                key={notif._id?.toString() || notif.id}
                                                                className={cn(
                                                                    "p-3 rounded-2xl border transition-all flex items-start gap-3",
                                                                    isUnread 
                                                                        ? "bg-indigo-50/30 border-indigo-100/50" 
                                                                        : "bg-slate-50/50 border-slate-100/30"
                                                                )}
                                                            >
                                                                <div className={cn(
                                                                    "p-2 rounded-xl shrink-0 mt-0.5",
                                                                    notif.icon === "sparkles" ? "bg-indigo-100 text-indigo-600" :
                                                                    notif.icon === "award" ? "bg-amber-100 text-amber-600" :
                                                                    notif.icon === "alert" ? "bg-rose-100 text-rose-600" :
                                                                    "bg-blue-100 text-blue-600"
                                                                )}>
                                                                    {notif.icon === "sparkles" ? <Sparkles className="w-3.5 h-3.5" /> :
                                                                     notif.icon === "award" ? <Award className="w-3.5 h-3.5" /> :
                                                                     notif.icon === "alert" ? <AlertTriangle className="w-3.5 h-3.5" /> :
                                                                     <Info className="w-3.5 h-3.5" />}
                                                                </div>
                                                                <div className="flex-1 min-w-0 text-left">
                                                                    <div className="flex items-center justify-between gap-1 mb-0.5">
                                                                        <span className="text-[10px] font-black text-slate-800 truncate">{notif.title}</span>
                                                                        <span className="text-[8px] font-bold text-slate-400 shrink-0">
                                                                            {notif.createdAt ? new Date(notif.createdAt).toLocaleDateString("pt-BR", { day: "numeric", month: "short" }) : ""}
                                                                        </span>
                                                                    </div>
                                                                    <p className="text-[10px] text-slate-500 font-semibold leading-relaxed line-clamp-3">
                                                                        {notif.message}
                                                                    </p>
                                                                    <div className="mt-1 flex items-center gap-1 text-[8px] font-black uppercase tracking-wider text-slate-400">
                                                                        <span>{t("admin.header.from")}</span>
                                                                        <span className="text-indigo-600">{notif.workspaceId === "global" ? t("admin.header.superAdmin") : t("admin.header.mentor")}</span>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        );
                                                    })
                                                )}
                                            </div>
                                        </motion.div>
                                    </>
                                )}
                            </AnimatePresence>
                        </div>

                        <div className="h-6 w-px bg-gray-200/20 mx-1" />

                        {/* Language Selector */}
                        <div className="flex items-center gap-1 rounded-lg border border-gray-200/50 bg-white/5 p-0.5 text-xs text-slate-500 font-semibold shadow-xs mr-1">
                            <button
                                onClick={() => setLocale("pt")}
                                className={cn(
                                    "px-2 py-1 rounded-md transition-all cursor-pointer font-bold text-[10px]",
                                    locale === "pt"
                                        ? "bg-slate-800 text-white shadow-sm"
                                        : "hover:bg-black/5 text-gray-500 hover:text-slate-700"
                                )}
                                title="Português"
                            >
                                PT
                            </button>
                            <button
                                onClick={() => setLocale("en")}
                                className={cn(
                                    "px-2 py-1 rounded-md transition-all cursor-pointer font-bold text-[10px]",
                                    locale === "en"
                                        ? "bg-slate-800 text-white shadow-sm"
                                        : "hover:bg-black/5 text-gray-500 hover:text-slate-700"
                                )}
                                title="English"
                            >
                                EN
                            </button>
                        </div>

                        <div className="h-6 w-px bg-gray-200/20 mx-1" />

                        {/* Clerk User Button */}
                        <div className="ml-1 cursor-pointer">
                            <UserButton />
                        </div>
                    </div>
                )}
            </div>

            {/* Book Writer Overlay Rendered within Layout Constraint */}
            {isLoveWriters && isBookLibraryOpen && currentWorkspace?.id && (
                <BookWriterView
                    workspaceId={currentWorkspace.id}
                    bookId=""
                    onClose={() => setIsBookLibraryOpen(false)}
                    initialMode="library"
                />
            )}

            {isLoveWriters && isBookWriterOpen && currentWorkspace?.id && (
                <BookWriterView
                    workspaceId={currentWorkspace.id}
                    bookId=""
                    onClose={() => setIsBookWriterOpen(false)}
                    initialMode="create"
                />
            )}
        </header >
    );
}
