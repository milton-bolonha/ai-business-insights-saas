"use client";

import { useState } from "react";
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
    Info
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import type { AdeAppearanceTokens } from "@/lib/ade-theme";
import { usePathname } from "next/navigation";
import { UserButton } from "@clerk/nextjs";

import {
    useWorkspaceStore,
    useCurrentWorkspace,
    useWorkspaceActions,
    useUIStore
} from "@/lib/stores";
import { useUsage, useAuthStore } from "@/lib/stores/authStore";

export interface AdminTopHeaderProps {
    appearance: AdeAppearanceTokens;
    onOpenSaaSLimits?: () => void;
    onOpenWorkspaceDetail?: () => void;

    onSetSpecificColor?: (color: string) => void;
}

export function AdminTopHeader({
    appearance,
    onOpenSaaSLimits,
    onOpenWorkspaceDetail,

    onSetSpecificColor
}: AdminTopHeaderProps) {
    const [isWorkspaceOpen, setIsWorkspaceOpen] = useState(false);
    const [isDashboardOpen, setIsDashboardOpen] = useState(false);
    const [isColorPickerOpen, setIsColorPickerOpen] = useState(false);
    const pathname = usePathname();

    const workspaces = useWorkspaceStore((state) => state.workspaces);
    const currentWorkspace = useCurrentWorkspace();
    const { switchWorkspace } = useWorkspaceActions();
    const usage = useUsage();

    // Determine context based on workspace template
    const isLoveWriters = currentWorkspace?.promptSettings?.templateId === "template_love_writers";



    // Create a display list (similar to sidebar logic)
    const availableWorkspaces = workspaces.map(ws => ({
        id: ws.id,
        name: ws.name,
        type: ws.promptSettings?.templateId === "template_love_writers" ? 'love_writers' : 'business_insights'
    }));

    const activeWorkspaceDisplay = currentWorkspace ? {
        id: currentWorkspace.id,
        name: currentWorkspace.name,
        type: isLoveWriters ? 'love_writers' : 'business_insights'
    } : { id: 'none', name: 'Select Workspace', type: 'business_insights' };

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

                {/* Left: Brand & Info */}
                <div className="flex items-center gap-3">
                    {/* Brand Logo / Name */}
                    <div className="text-xl font-bold tracking-tight text-black flex items-center gap-2">
                        {isLoveWriters ? (
                            <span className="hidden md:block">Love Writers</span>
                        ) : (
                            <span className="hidden md:block">Business Insights</span>
                        )}

                        {/* Workspace Info Icon */}
                        {currentWorkspace && (
                            <button
                                onClick={onOpenWorkspaceDetail}
                                className="text-gray-400 hover:text-gray-600 transition-colors"
                                title="Workspace Details"
                            >
                                <Info className="h-4 w-4" />
                            </button>
                        )}

                        {/* Color Picker (Droplet) - Moved to Left */}
                        <div className="relative">
                            <button
                                onClick={() => setIsColorPickerOpen(!isColorPickerOpen)}
                                className="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-black/5 text-gray-500 transition-colors"
                                title="Customize Theme"
                            >
                                <Droplet className="h-4 w-4" />
                            </button>
                            <AnimatePresence>
                                {isColorPickerOpen && (
                                    <>
                                        <div className="fixed inset-0 z-40" onClick={() => setIsColorPickerOpen(false)} />
                                        <motion.div
                                            initial={{ opacity: 0, scale: 0.9 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            exit={{ opacity: 0, scale: 0.9 }}
                                            className="absolute left-0 top-full z-50 mt-2 p-3 bg-white rounded-xl shadow-xl border border-gray-200 w-48"
                                        >
                                            <div className="grid grid-cols-4 gap-2 mb-3">
                                                {[
                                                    { color: "#f7f7f7", name: "Beige" },
                                                    { color: "#e8f4fd", name: "Blue" },
                                                    { color: "#f0f9e8", name: "Green" },
                                                    { color: "#fef7ed", name: "Orange" }
                                                ].map((preset) => (
                                                    <button
                                                        key={preset.color}
                                                        onClick={() => handleColorChange(preset.color)}
                                                        className="w-8 h-8 rounded-full border border-gray-200 shadow-sm hover:scale-110 transition-transform"
                                                        style={{ backgroundColor: preset.color }}
                                                        title={preset.name}
                                                    />
                                                ))}
                                            </div>
                                            <div className="relative">
                                                <label className="block text-xs font-medium text-black mb-1 w-fit">Custom Color</label>
                                                <div className="flex items-center gap-2">
                                                    <input
                                                        type="color"
                                                        className="h-8 w-full cursor-pointer rounded border border-gray-200 p-0.5"
                                                        onChange={(e) => handleColorChange(e.target.value)}
                                                    />
                                                </div>
                                            </div>
                                        </motion.div>
                                    </>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>
                </div>

                {/* Center: Workspace Chooser - Hidden on mobile if needed, or adjusted */}
                <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-30 transition-all duration-200">
                    <div className="relative">
                        <button
                            onClick={() => setIsWorkspaceOpen(!isWorkspaceOpen)}
                            className="flex items-center gap-2 rounded-lg bg-white/5 px-3 py-1.5 text-sm font-medium hover:bg-white/10 transition-colors cursor-pointer border border-transparent hover:border-white/10"
                        >
                            {activeWorkspaceDisplay.type === 'love_writers' ? (
                                <BookOpen className="h-4 w-4 text-rose-500" />
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
                                                Switch Workspace
                                            </div>
                                            {availableWorkspaces.map((ws) => (
                                                <button
                                                    key={ws.id}
                                                    onClick={() => {
                                                        switchWorkspace(ws.id);
                                                        setIsWorkspaceOpen(false);
                                                    }}
                                                    className={cn(
                                                        "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                                                        currentWorkspace?.id === ws.id
                                                            ? "bg-gray-100 text-gray-900 dark:bg-gray-800 dark:text-gray-100"
                                                            : "text-gray-600 hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-gray-800"
                                                    )}
                                                >
                                                    {ws.type === 'love_writers' ? (
                                                        <BookOpen className="h-4 w-4 text-rose-500" />
                                                    ) : (
                                                        <PieChart className="h-4 w-4 text-blue-500" />
                                                    )}
                                                    <span className="flex-1 text-left truncate">{ws.name}</span>
                                                    {currentWorkspace?.id === ws.id && (
                                                        <div className="h-1.5 w-1.5 rounded-full bg-green-500" />
                                                    )}
                                                </button>
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
                                                <span>Create Workspace</span>
                                            </button>
                                        </div>
                                    </motion.div>
                                </>
                            )}
                        </AnimatePresence>
                    </div>
                </div>


                {/* Right: Dashboard, Color, Actions */}
                <div className="flex items-center gap-3 z-20">



                    <div className="h-6 w-px bg-gray-200/20 mx-1" />

                    {/* Plan Indicator Badge */}
                    <button
                        onClick={onOpenSaaSLimits}
                        className={cn(
                            "flex items-center gap-2 rounded-full px-3 py-1 text-xs font-bold transition-colors border",
                            // Style based on Plan
                            (!usage.createTile && !useAuthStore.getState().user) ? "bg-gray-100 text-gray-500 border-gray-200" :
                                (useAuthStore.getState().user?.role === "member" && useAuthStore.getState().user?.plan === "business")
                                    ? "bg-gradient-to-r from-amber-200 to-yellow-400 text-yellow-900 border-yellow-400/50" // Premium
                                    : (useAuthStore.getState().user?.role === "member")
                                        ? "bg-blue-100 text-blue-700 border-blue-200" // Member Free
                                        : "bg-gray-100 text-gray-600 border-gray-200" // Guest
                        )}
                        title="Your Plan"
                    >
                        {(!useAuthStore.getState().user || useAuthStore.getState().user?.role === "guest") ? "Guest" :
                            (useAuthStore.getState().user?.plan === "business") ? "Member Premium" : "Member Free"}
                    </button>

                    <div className="h-6 w-px bg-gray-200/20 mx-1" />

                    {/* SaaS Limit Counter (Trigger) */}
                    <button
                        onClick={onOpenSaaSLimits}
                        className="flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium text-gray-500 hover:bg-white/5 transition-colors"
                        title="Usage Limits"
                    >
                        <div className="flex flex-col items-end leading-none">
                            <span className="text-xs font-bold">{usage.createTile || 0}</span>
                            <span className="text-[10px] opacity-70">Arcs</span>
                        </div>
                        <div className="h-8 w-px bg-gray-200/20 mx-1" />
                        <div className="flex flex-col items-start leading-none">
                            <span className="text-xs font-bold">{usage.createContact}</span>
                            <span className="text-[10px] opacity-70">Chars</span>
                        </div>
                    </button>

                    <div className="h-6 w-px bg-gray-200/20 mx-1" />

                    {/* Love Writers Specific Actions */}
                    {isLoveWriters && (
                        <>

                            <button className="flex h-9 w-9 items-center justify-center rounded-lg hover:bg-white/5 transition-colors text-gray-500">
                                <MonitorPlay className="h-5 w-5" />
                            </button>

                            <button className="flex h-9 w-9 items-center justify-center rounded-lg hover:bg-white/5 transition-colors text-gray-500">
                                <Share2 className="h-5 w-5" />
                            </button>
                        </>
                    )}
                    {/* Clerk User Button */}
                    <div className="ml-2">
                        <UserButton afterSignOutUrl="/" />
                    </div>
                </div>
            </div>
        </header >
    );
}
