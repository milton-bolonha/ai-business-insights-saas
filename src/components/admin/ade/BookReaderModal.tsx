"use client";

import { X, BookOpen, ChevronLeft, ChevronRight } from "lucide-react";
import { useState, useEffect } from "react";
import type { Tile } from "@/lib/types";

interface BookReaderModalProps {
    open: boolean;
    onClose: () => void;
    tiles: Tile[];
    title?: string;
}

export function BookReaderModal({ open, onClose, tiles, title = "Book Preview" }: BookReaderModalProps) {
    const [currentPage, setCurrentPage] = useState(0);

    // Filter only valid arcs (e.g. non-empty content)
    const arcs = tiles.filter(t => t.content && t.category !== 'hidden');

    const currentArc = arcs[currentPage];

    useEffect(() => {
        if (open) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => { document.body.style.overflow = 'unset'; };
    }, [open]);

    const handleNext = () => {
        if (currentPage < arcs.length - 1) setCurrentPage(p => p + 1);
    };

    const handlePrev = () => {
        if (currentPage > 0) setCurrentPage(p => p - 1);
    };

    if (!open) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 sm:p-6 animate-in fade-in duration-200">
            <div className="relative w-full max-w-4xl h-[85vh] flex flex-col overflow-hidden rounded-2xl bg-[#fdfbf7] shadow-2xl ring-1 ring-black/10">
                {/* Header */}
                <div className="flex items-center justify-between border-b px-6 py-4 bg-white/60 backdrop-blur sticky top-0 z-10">
                    <div className="flex items-center gap-2 text-gray-800">
                        <BookOpen className="w-5 h-5" />
                        <span className="font-serif font-semibold text-lg">{title}</span>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-black/5 rounded-full transition-colors text-gray-500 hover:text-gray-900">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-8 md:p-16 scroll-smooth">
                    {arcs.length > 0 ? (
                        <div className="max-w-prose mx-auto space-y-8 animate-in slide-in-from-bottom-4 duration-500">
                            <div className="text-center mb-12">
                                <span className="text-xs font-medium uppercase tracking-widest text-gray-400">
                                    Arc {currentPage + 1}
                                </span>
                                <h2 className="text-3xl md:text-5xl font-serif font-bold text-gray-900 mt-4 leading-tight">
                                    {currentArc?.title}
                                </h2>
                            </div>

                            <div className="prose prose-lg prose-stone mx-auto font-serif leading-relaxed text-gray-800">
                                {/* Simple whitespace rendering for now, or markdown if available */}
                                {currentArc?.content?.split('\n').map((para, i) => (
                                    para.trim() && <p key={i} className="mb-4 text-lg">{para}</p>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center text-gray-400 space-y-4">
                            <div className="p-4 rounded-full bg-gray-100/50">
                                <BookOpen className="w-12 h-12 opacity-30" />
                            </div>
                            <p className="font-medium">No content generated yet.</p>
                            <p className="text-sm">Complete some Arcs to see your book here.</p>
                        </div>
                    )}
                </div>

                {/* Footer / Navigation */}
                <div className="border-t px-6 py-4 bg-white/60 backdrop-blur flex items-center justify-between text-sm text-gray-500 sticky bottom-0 z-10">
                    <button
                        onClick={handlePrev}
                        disabled={currentPage === 0}
                        className="flex items-center gap-2 px-4 py-2 hover:bg-black/5 rounded-lg transition-colors disabled:opacity-30 disabled:hover:bg-transparent font-medium"
                    >
                        <ChevronLeft className="w-4 h-4" />
                        Previous
                    </button>

                    <span className="font-mono text-xs tracking-wider">
                        {arcs.length > 0 ? `${currentPage + 1} / ${arcs.length}` : "0 / 0"}
                    </span>

                    <button
                        onClick={handleNext}
                        disabled={currentPage === arcs.length - 1}
                        className="flex items-center gap-2 px-4 py-2 hover:bg-black/5 rounded-lg transition-colors disabled:opacity-30 disabled:hover:bg-transparent font-medium"
                    >
                        Next
                        <ChevronRight className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </div>
    );
}
