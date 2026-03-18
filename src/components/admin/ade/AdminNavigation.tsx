"use client";

import { 
    BookOpen, 
    LayoutGrid, 
    Users, 
    FileText, 
    FolderOpen 
} from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export type NavTab = "library" | "arcs" | "characters" | "notes" | "files";

interface AdminNavigationProps {
    activeTab: NavTab;
    onTabChange: (tab: NavTab) => void;
}

const navItems = [
    { id: "library", label: "Library", icon: BookOpen },
    { id: "arcs", label: "Arcs", icon: LayoutGrid },
    { id: "characters", label: "Characters", icon: Users },
    { id: "notes", label: "Notes", icon: FileText },
    { id: "files", label: "Files", icon: FolderOpen },
] as const;

export function AdminNavigation({ activeTab, onTabChange }: AdminNavigationProps) {
    return (
        <>
            {/* Desktop Sidebar */}
            <aside className="hidden md:flex flex-col w-20 border-r border-gray-100 bg-white h-screen sticky top-0 z-40 items-center py-6">
                {/* Square Logo Placeholder */}
                <div className="w-12 h-12 bg-pink-600 rounded-xl flex items-center justify-center text-white font-black text-xl mb-10 shadow-lg shadow-pink-200">
                    LW
                </div>

                <nav className="flex flex-col gap-4 w-full px-2">
                    {navItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = activeTab === item.id;

                        return (
                            <div key={item.id} className="relative group flex justify-center">
                                <button
                                    onClick={() => onTabChange(item.id as NavTab)}
                                    className={cn(
                                        "p-3 rounded-2xl transition-all duration-300 relative cursor-pointer",
                                        isActive 
                                            ? "bg-pink-50 text-pink-600 shadow-inner" 
                                            : "text-gray-400 hover:text-pink-400 hover:bg-gray-50"
                                    )}
                                >
                                    <Icon className="w-6 h-6" />
                                    {isActive && (
                                        <motion.div 
                                            layoutId="activeSide"
                                            className="absolute left-[-8px] top-3 bottom-3 w-1 bg-pink-600 rounded-full"
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
            </aside>

            {/* Mobile Bottom Menu (Floating) */}
            <div className="md:hidden fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] w-[90%] max-w-sm">
                <nav className="bg-white/80 backdrop-blur-xl border border-white/20 shadow-2xl rounded-3xl p-2 flex justify-between items-center px-4">
                    {navItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = activeTab === item.id;

                        return (
                            <button
                                key={item.id}
                                onClick={() => onTabChange(item.id as NavTab)}
                                className={cn(
                                    "p-3 rounded-2xl transition-all duration-300 relative flex flex-col items-center gap-1 cursor-pointer",
                                    isActive 
                                        ? "text-pink-600" 
                                        : "text-gray-400"
                                )}
                            >
                                <Icon className={cn("w-6 h-6 transition-transform", isActive && "scale-110")} />
                                {isActive && (
                                    <motion.div 
                                        layoutId="activeBottom"
                                        className="absolute -bottom-1 w-1 h-1 bg-pink-600 rounded-full"
                                    />
                                )}
                            </button>
                        );
                    })}
                </nav>
            </div>
        </>
    );
}
