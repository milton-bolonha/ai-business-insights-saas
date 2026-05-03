"use client";

import React, { useState, useMemo, useEffect } from "react";
import {
    Map as MapIcon,
    MapPin,
    Box,
    Layout,
    Maximize2,
    Minimize2,
    ChevronRight,
    ChevronLeft,
    Warehouse,
    Plus,
    Settings,
    Grid,
    Zap,
    Search,
    Mic,
    Camera,
    Sparkles,
    Loader2,
    AlertTriangle,
    GripHorizontal,
    GripVertical,
    Trash2,
    X,
    CheckCircle2,
    Edit,
    Save,
    Bot
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import type { Tile } from "@/lib/types";
import { cn } from "@/lib/utils";
import { useToast } from "@/lib/state/toast-context";
import { useWMSOrchestrator } from "@/containers/admin/hooks/useWMSOrchestrator";

interface ProductReference {
    id: string;
    name: string;
    quantity: number;
}

interface Spot {
    id: string;
    code: string;
    row: number;
    col: number;
    status: "available" | "occupied" | "reserved" | "blocked";
    products: ProductReference[];
    updatedAt?: string;
}

interface MapSection {
    id: string;
    type: "Wall" | "Showcase" | "Rack";
    layoutMode: "boxed" | "full";
    label: string;
    spots: Spot[];
    rows: number;
    cols: number;
    orientation: "horizontal" | "vertical";
}

const STATUS_MAP = {
    available: { bg: 'bg-slate-50', border: 'border-slate-200', text: 'text-slate-400', label: 'Vazio' },
    occupied: { bg: 'bg-emerald-500', border: 'border-emerald-600', text: 'text-white', label: 'Ocupado' },
    reserved: { bg: 'bg-amber-400', border: 'border-amber-500', text: 'text-white', label: 'Reservado' },
    blocked: { bg: 'bg-rose-500', border: 'border-rose-600', text: 'text-white', label: 'Bloqueado' },
};

interface StoreLayoutGridProps {
    tiles: Tile[];
    onSaveLayout?: (sections: MapSection[]) => Promise<any>;
    appearance?: any;
    onExport?: (category: string, format: "json" | "csv") => void;
}

export function StoreLayoutGrid({ tiles, onSaveLayout, appearance, onExport }: StoreLayoutGridProps) {
    const { push } = useToast();
    const [selectedSpot, setSelectedSpot] = useState<Spot | null>(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [isEditorMode, setIsEditorMode] = useState(false);
    const [isListOpen, setIsListOpen] = useState(false);
    const [isAssistantOpen, setIsAssistantOpen] = useState(false);
    const [spotSearchQuery, setSpotSearchQuery] = useState("");
    const [assistantMode, setAssistantMode] = useState<"voice" | "camera" | "text" | null>(null);
    const [sections, setSections] = useState<MapSection[]>([]);
    const [activeSectionId, setActiveSectionId] = useState<string | null>(null);
    const [isCompactView, setIsCompactView] = useState(false);
    const [editingSectorId, setEditingSectorId] = useState<string | null>(null);
    const [newSector, setNewSector] = useState<{
        name: string;
        rows: number | string;
        cols: number | string;
        orientation: "horizontal" | "vertical";
        type: "Wall" | "Showcase" | "Rack";
        layoutMode: "boxed" | "full";
    }>({ 
        name: '', 
        rows: 4, 
        cols: 6, 
        orientation: 'horizontal', 
        type: 'Showcase', 
        layoutMode: 'boxed' 
    });

    const {
        isProcessingAI,
        detectedItems,
        setDetectedItems,
        // executeCommands, // available if needed
        // callGeminiAI,    // available if needed
        // logActivity     // available if needed
        callGeminiAI,
    } = useWMSOrchestrator(sections, setSections);

    const [assistantInput, setAssistantInput] = useState("");
    const [assistantReply, setAssistantReply] = useState("");

    // Sync from Tiles into Local State (on Load)
    useEffect(() => {
        const layoutTile = tiles.find(t => t.category === "store_layout");
        let loadedSections = layoutTile?.metadata?.sections;
        if (!loadedSections && layoutTile?.metadata && Array.isArray(layoutTile.metadata)) {
            loadedSections = layoutTile.metadata;
        }
        if (loadedSections && Array.isArray(loadedSections) && loadedSections.length > 0) {
            const filteredSections = loadedSections.filter((s: any) => s.type !== "Corridor");
            setSections(filteredSections as MapSection[]);
            if (!activeSectionId && filteredSections.length > 0) {
                setActiveSectionId(filteredSections[0].id);
            }
        }
    }, [tiles]);

    // --- Actions ---
    const handleSave = () => {
        if (onSaveLayout) {
            onSaveLayout(sections);
            push({ title: "Layout Salvo", description: "As alterações foram sincronizadas com sucesso.", variant: "success" });
        }
        setIsEditorMode(false);
    };

    const confirmAIDetection = (item: any) => {
        const updatedSections = sections.map(sec => ({
            ...sec,
            spots: sec.spots.map(spot => {
                if (spot.code === item.suggestedSpot || spot.id === selectedSpot?.id) {
                    const existing = spot.products || [];
                    return {
                        ...spot,
                        products: [...existing, { id: item.id, name: item.name, quantity: 1, category: item.category }],
                        status: "occupied" as const
                    };
                }
                return spot;
            })
        }));

        setSections(updatedSections);
        if (onSaveLayout) {
            onSaveLayout(updatedSections);
        }

        push({
            title: "Item Adicionado e Salvo",
            description: `${item.name} vinculado ao slot ${item.suggestedSpot || selectedSpot?.code}.`,
            variant: "success"
        });
        setDetectedItems(prev => prev.filter(i => i.id !== item.id));
        if (detectedItems.length <= 1) {
            setIsAssistantOpen(false);
            setAssistantMode(null);
            setSelectedSpot(null);
        }
    };

    // --- Catalog Access ---
    let productTile = tiles.find(t => t.category === "products");
    if (!productTile) {
        productTile = tiles.find(t => t.metadata && (Array.isArray(t.metadata.products) || (Array.isArray(t.metadata) && t.metadata.length > 0 && (t.metadata[0] as any).price !== undefined)));
    }
    const catalogMetadata = productTile?.metadata || {};
    const catalogProducts: any[] = Array.isArray(catalogMetadata)
        ? catalogMetadata
        : (catalogMetadata.products || []);
    const activeCatalogProducts = catalogProducts.filter(p => !p.archived);

    // --- Derived State ---
    const activeSection = sections.find(s => s.id === activeSectionId) || sections[0];
    const currentIndex = sections.findIndex(s => s.id === activeSectionId);
    const hasNext = currentIndex < sections.length - 1;
    const hasPrev = currentIndex > 0;

    const handleNext = () => hasNext && setActiveSectionId(sections[currentIndex + 1].id);
    const handlePrev = () => hasPrev && setActiveSectionId(sections[currentIndex - 1].id);

    const allSpots = sections.flatMap(s => s.spots);
    const spotsWithProducts = allSpots.filter(s => s.products.length > 0);

    // --- Sub-renders ---
    const renderHeader = () => (
        <div className="flex flex-col gap-3 shrink-0 mb-4 bg-white p-4 rounded-3xl shadow-sm border border-slate-200">
            <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-50 rounded-xl">
                        <MapIcon size={20} className="text-blue-600" />
                    </div>
                    <div>
                        <h2 className="font-black text-slate-800 text-base leading-none">Mapa da Loja</h2>
                        <div className="flex items-center gap-2 mt-1">
                            <div className="flex items-center gap-1.5 bg-emerald-50 rounded-full px-2 py-0.5 border border-emerald-100">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                <span className="text-[9px] font-black text-emerald-700 uppercase tracking-widest">Live AI</span>
                            </div>
                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                                In: {spotsWithProducts.length} | Out: {allSpots.length - spotsWithProducts.length}
                            </span>
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setIsEditorMode(!isEditorMode)}
                        className={cn("p-2 rounded-xl border transition-all", isEditorMode ? "bg-slate-800 text-white border-slate-800 shadow-lg" : "bg-slate-50 border-slate-200 text-slate-500 hover:text-blue-600")}
                        title="Configurar Layout"
                    >
                        <Settings size={18} />
                    </button>
                    <button
                        onClick={() => setIsCompactView(!isCompactView)}
                        className="p-2 bg-slate-50 border border-slate-200 text-slate-500 hover:text-blue-600 rounded-xl shadow-sm transition-all"
                    >
                        {isCompactView ? <Maximize2 size={18} /> : <Minimize2 size={18} />}
                    </button>
                </div>
            </div>
            <div className="flex overflow-x-auto hide-scrollbar gap-2 pb-1">
                {sections.map((sec) => (
                    <button
                        key={sec.id}
                        onClick={() => { setActiveSectionId(sec.id); setSelectedSpot(null); }}
                        className={cn(
                            "px-4 py-2 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all flex items-center gap-2 border shrink-0",
                            activeSectionId === sec.id
                                ? 'bg-slate-800 text-white border-slate-800 shadow-lg scale-105'
                                : 'bg-slate-50 text-slate-500 hover:bg-white hover:text-blue-600 border-slate-200'
                        )}
                    >
                        {sec.orientation === 'vertical' ? <GripVertical size={14} /> : <GripHorizontal size={14} />}
                        {sec.label || sec.id}
                        <span className="opacity-40 text-[8px]">{sec.rows}x{sec.cols}</span>
                    </button>
                ))}
                {isEditorMode && (
                    <button
                        onClick={() => { setIsAssistantOpen(true); setAssistantMode(null); }}
                        className="px-4 py-1.5 rounded-xl font-bold text-xs bg-blue-50 text-blue-600 border border-blue-200 hover:bg-blue-100 transition-all flex items-center gap-1.5 shrink-0"
                    >
                        <Plus size={12} /> Novo Setor
                    </button>
                )}
            </div>
        </div>
    );

    const renderMapGrid = () => {
        if (!activeSection) return (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-400 gap-4 bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200 p-12">
                <Warehouse size={48} className="opacity-20" />
                <p className="italic text-sm">Nenhum setor configurado.</p>
                <button onClick={() => setIsEditorMode(true)} className="bg-blue-600 text-white px-6 py-2 rounded-xl font-bold shadow-lg">Configurar Planta</button>
            </div>
        );

        return (
            <div className="w-full flex justify-center flex-1 min-h-0 relative animate-fade-in">
                <div className="relative flex items-stretch group transition-all duration-300 w-full">
                    {/* Carousel Navigation */}
                    {sections.length > 1 && (
                        <>
                            <button
                                onClick={handlePrev}
                                disabled={!hasPrev}
                                className="absolute top-1/2 -translate-y-1/2 -left-4 z-40 p-2 bg-white shadow-xl rounded-full text-slate-600 hover:text-blue-600 opacity-0 group-hover:opacity-100 disabled:hidden transition-all"
                            >
                                <ChevronLeft size={24} />
                            </button>
                            <button
                                onClick={handleNext}
                                disabled={!hasNext}
                                className="absolute top-1/2 -translate-y-1/2 -right-4 z-40 p-2 bg-white shadow-xl rounded-full text-slate-600 hover:text-blue-600 opacity-0 group-hover:opacity-100 disabled:hidden transition-all"
                            >
                                <ChevronRight size={24} />
                            </button>
                        </>
                    )}

                    {/* Grid Canvas */}
                    <div className={cn(
                        "bg-white border border-slate-200 rounded-[2rem] p-4 shadow-sm flex flex-col transition-all duration-500",
                        activeSection.layoutMode === 'full' ? 'w-full' : 'max-w-4xl mx-auto w-full',
                        isCompactView ? 'overflow-hidden h-full' : 'overflow-auto custom-scrollbar'
                    )}>
                        <div
                            className={cn(
                                "grid",
                                isCompactView ? 'gap-1 flex-1 min-h-0 w-full h-full' : 'gap-3 min-w-max min-h-max w-full',
                                activeSection.orientation === 'vertical' ? 'grid-flow-col' : 'grid-flow-row'
                            )}
                            style={{
                                gridTemplateColumns: `repeat(${activeSection.cols}, ${isCompactView ? 'minmax(0, 1fr)' : 'minmax(80px, 1fr)'})`,
                                gridTemplateRows: `repeat(${activeSection.rows}, ${isCompactView ? 'minmax(0, 1fr)' : 'minmax(80px, 1fr)'})`
                            }}
                        >
                            {activeSection.spots.map(spot => {
                                const isSelected = selectedSpot?.id === spot.id;
                                const status = (spot.products && spot.products.length > 0) ? "occupied" : spot.status;
                                const styles = STATUS_MAP[status as keyof typeof STATUS_MAP] || STATUS_MAP.available;

                                return (
                                    <button
                                        key={spot.id}
                                        onClick={() => setSelectedSpot(spot)}
                                        className={cn(
                                            "relative flex flex-col items-center justify-center transition-all duration-300 w-full h-full",
                                            isCompactView ? 'rounded-xl border-2 gap-0.5' : 'rounded-2xl border-2 gap-1 p-2',
                                            styles.bg, styles.border, styles.text,
                                            isSelected ? 'ring-8 ring-blue-500/10 z-10 border-blue-500 scale-105 shadow-xl' : 'hover:scale-[1.03] hover:shadow-lg hover:z-10'
                                        )}
                                    >
                                        <span className={cn(
                                            "font-bold opacity-70",
                                            isCompactView ? 'text-[8px] leading-none' : 'text-[10px] uppercase tracking-tighter'
                                        )}>
                                            {spot.code || `${spot.row}-${spot.col}`}
                                        </span>

                                        {status === 'occupied' && <Box size={isCompactView ? 14 : 20} strokeWidth={2.5} />}
                                        {status === 'blocked' && <AlertTriangle size={isCompactView ? 14 : 20} strokeWidth={2.5} />}

                                        {spot.products && spot.products.length > 1 && (
                                            <span className={cn(
                                                "absolute bg-blue-600 text-white font-bold flex items-center justify-center rounded-full shadow-sm border border-white",
                                                isCompactView ? "-top-1 -right-1 w-3.5 h-3.5 text-[7px]" : "-top-2 -right-2 w-5 h-5 text-[10px]"
                                            )}>
                                                {spot.products.length}
                                            </span>
                                        )}
                                    </button>
                                );
                            })}
                        </div>

                        {/* Legend */}
                        <div className="mt-6 flex flex-wrap gap-6 justify-center text-[9px] font-black uppercase tracking-widest shrink-0 border-t border-slate-50 pt-4">
                            {Object.entries(STATUS_MAP).map(([key, val]) => (
                                <div key={key} className="flex items-center gap-2 group cursor-help">
                                    <span className={cn("w-3 h-3 rounded-full border-2 shadow-sm transition-transform group-hover:scale-125", val.bg, val.border)} />
                                    <span className="text-slate-400 group-hover:text-slate-600 transition-colors">{val.label}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="flex flex-col flex-1 p-2 sm:p-4 min-h-0 h-full overflow-hidden">
            {renderHeader()}

            {renderMapGrid()}

            {/* Editor Actions Overlay */}
            <AnimatePresence>
                {isEditorMode && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}
                        className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3"
                    >
                        <button
                            onClick={handleSave}
                            className="bg-emerald-600 text-white px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center gap-2 shadow-xl hover:bg-emerald-700 hover:scale-105 transition-all"
                        >
                            <CheckCircle2 size={18} /> Salvar Alterações
                        </button>
                        <button
                            onClick={() => setIsEditorMode(false)}
                            className="bg-white text-slate-600 px-4 py-3 rounded-2xl font-bold text-xs uppercase tracking-widest border border-slate-200 shadow-lg hover:bg-slate-50 transition-all"
                        >
                            Cancelar
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* GAVETA LATERAL (Detalhes do Slot) */}
            <AnimatePresence>
                {selectedSpot && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            onClick={() => setSelectedSpot(null)}
                            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100]"
                        />
                        <motion.div
                            initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
                            transition={{ type: "spring", damping: 25, stiffness: 200 }}
                            className="fixed top-0 right-0 bottom-0 w-full sm:w-[480px] bg-slate-50 border-l border-slate-200 z-[101] flex flex-col sm:rounded-l-3xl shadow-2xl overflow-hidden"
                        >
                            {/* Drawer Header */}
                            <div className="p-6 bg-white border-b border-slate-200 shrink-0 flex justify-between items-start z-10 shadow-sm">
                                <div className="flex gap-4 items-center">
                                    <div className={cn(
                                        "w-14 h-14 rounded-2xl border-2 flex items-center justify-center shadow-inner",
                                        STATUS_MAP[(selectedSpot.products && selectedSpot.products.length > 0 ? "occupied" : selectedSpot.status) as keyof typeof STATUS_MAP]?.bg,
                                        STATUS_MAP[(selectedSpot.products && selectedSpot.products.length > 0 ? "occupied" : selectedSpot.status) as keyof typeof STATUS_MAP]?.text,
                                        STATUS_MAP[(selectedSpot.products && selectedSpot.products.length > 0 ? "occupied" : selectedSpot.status) as keyof typeof STATUS_MAP]?.border
                                    )}>
                                        <MapPin size={24} />
                                    </div>
                                    <div>
                                        <h3 className="text-2xl font-black text-slate-800">{selectedSpot.code}</h3>
                                        <p className="text-slate-500 text-sm font-bold uppercase tracking-wider">Setor: {activeSection?.label || activeSection?.id}</p>
                                    </div>
                                </div>
                                <button onClick={() => setSelectedSpot(null)} className="bg-slate-100 p-2 rounded-full hover:bg-slate-200 transition-colors text-slate-500"><X size={20} /></button>
                            </div>

                            {/* Drawer Content */}
                            <div className="flex-1 overflow-y-auto p-6 custom-scrollbar space-y-6">
                                {/* Product List */}
                                <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
                                    <div className="flex justify-between mb-4 items-center border-b border-slate-50 pb-2">
                                        <h4 className="text-xs font-black text-slate-500 uppercase tracking-widest">Conteúdo do Slot ({selectedSpot.products?.length || 0})</h4>
                                        <button
                                            onClick={() => setIsListOpen(true)}
                                            className="text-blue-600 text-[10px] font-black uppercase tracking-widest flex items-center gap-1 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg transition-colors"
                                        >
                                            <Plus size={14} /> Vincular Produto
                                        </button>
                                    </div>
                                    <div className="space-y-3">
                                        {selectedSpot.products && selectedSpot.products.length > 0 ? (
                                            selectedSpot.products.map((item, index) => (
                                                <div key={index} className="flex justify-between items-center bg-slate-50 p-4 rounded-xl border border-slate-100 group hover:border-blue-300 transition-all">
                                                    <div className="flex items-center gap-3">
                                                        <div className="bg-white text-blue-600 p-2 rounded-lg shadow-sm border border-slate-100"><Box size={20} /></div>
                                                        <div>
                                                            <span className="font-bold text-slate-800 block text-sm line-clamp-1">{item.name}</span>
                                                            <span className="text-[10px] font-mono text-slate-400">SKU: {item.id.slice(0, 8)}</span>
                                                        </div>
                                                    </div>
                                                    <button
                                                        onClick={() => {
                                                            const updated = sections.map(s => ({
                                                                ...s,
                                                                spots: s.spots.map(sp => {
                                                                    if (sp.id === selectedSpot.id) {
                                                                        const nextProducts = sp.products.filter((_, i) => i !== index);
                                                                        return { ...sp, products: nextProducts, status: nextProducts.length === 0 ? "available" : sp.status };
                                                                    }
                                                                    return sp;
                                                                })
                                                            }));
                                                            setSections(updated);
                                                            setSelectedSpot(updated.flatMap(s => s.spots).find(sp => sp.id === selectedSpot.id) || null);
                                                        }}
                                                        className="p-2 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            ))
                                        ) : (
                                            <div className="text-center text-slate-400 text-xs py-12 border-2 border-dashed border-slate-100 rounded-2xl flex flex-col items-center gap-3 bg-slate-50/50">
                                                <Box size={32} className="opacity-10" />
                                                Este slot está vazio.
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* AI Smart Assist Info */}
                                <div className="bg-blue-600 p-6 rounded-3xl text-white shadow-xl shadow-blue-200 relative overflow-hidden group">
                                    <div className="absolute -right-4 -top-4 w-24 h-24 bg-white/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700" />
                                    <h5 className="font-black text-lg mb-2 flex items-center gap-2">
                                        <Bot size={22} /> Assistente AI
                                    </h5>
                                    <p className="text-blue-100 text-xs leading-relaxed font-medium mb-4">
                                        Use comandos de voz ou foto para atualizar este inventário instantaneamente.
                                    </p>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => { setAssistantMode("voice"); setIsAssistantOpen(true); }}
                                            className="flex-1 bg-white/20 hover:bg-white/30 backdrop-blur-md py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
                                        >
                                            Voz
                                        </button>
                                        <button
                                            onClick={() => { setAssistantMode("camera"); setIsAssistantOpen(true); }}
                                            className="flex-1 bg-white text-blue-600 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg"
                                        >
                                            Câmera
                                        </button>
                                    </div>
                                </div>

                                {/* Status Toggle (Quick Control) */}
                                <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-sm">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 block">Alterar Status Manual</label>
                                    <div className="grid grid-cols-2 gap-2">
                                        {Object.entries(STATUS_MAP).map(([key, val]) => (
                                            <button
                                                key={key}
                                                onClick={() => {
                                                    const updated = sections.map(s => ({
                                                        ...s,
                                                        spots: s.spots.map(sp => sp.id === selectedSpot.id ? { ...sp, status: key as any } : sp)
                                                    }));
                                                    setSections(updated);
                                                    setSelectedSpot(updated.flatMap(s => s.spots).find(sp => sp.id === selectedSpot.id) || null);
                                                }}
                                                className={cn(
                                                    "flex items-center gap-2 px-3 py-2.5 rounded-xl border transition-all text-[10px] font-bold uppercase",
                                                    selectedSpot.status === key ? "border-slate-800 bg-slate-800 text-white shadow-md" : "border-slate-100 bg-slate-50 text-slate-500 hover:bg-slate-100"
                                                )}
                                            >
                                                <span className={cn("w-2 h-2 rounded-full", val.bg, val.border)} />
                                                {val.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            {/* MODAL CONFIGURAÇÃO (LAYOUT EDITOR) */}
            <AnimatePresence>
                {isAssistantOpen && assistantMode === null && (
                    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[150] flex items-center justify-center p-4 animate-fade-in">
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
                            className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-md overflow-hidden flex flex-col max-h-[90vh]"
                        >
                            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                                <h3 className="font-black text-slate-800 text-xl flex items-center gap-2"><Settings size={22} className="text-slate-400" /> Configuração</h3>
                                <button onClick={() => { setIsAssistantOpen(false); setEditingSectorId(null); }} className="p-2 bg-slate-200 text-slate-600 rounded-full hover:bg-slate-300 transition-all"><X size={18} /></button>
                            </div>

                            <div className="p-6 flex-1 overflow-y-auto custom-scrollbar space-y-6">
                                {/* New Section Form */}
                                <div className="bg-blue-50/30 border-2 border-blue-100 p-6 rounded-[2rem] space-y-4">
                                    <h4 className="text-[10px] font-black text-blue-700 uppercase tracking-widest flex items-center gap-2">
                                        {editingSectorId ? <Edit size={14} /> : <Plus size={14} />} {editingSectorId ? 'Editar Setor' : 'Novo Setor'}
                                    </h4>
                                    <div>
                                        <label className="block text-[10px] font-black text-slate-500 uppercase mb-1.5 ml-1">Identificador (Ex: A1)</label>
                                        <input
                                            type="text"
                                            value={newSector.name}
                                            disabled={!!editingSectorId}
                                            onChange={(e) => setNewSector({ ...newSector, name: e.target.value.toUpperCase() })}
                                            className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-slate-800 font-black uppercase outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all"
                                            maxLength={6}
                                        />
                                    </div>
                                    <div className="flex gap-3">
                                        <div className="flex-1">
                                            <label className="block text-[10px] font-black text-slate-500 uppercase mb-1.5 ml-1">Fileiras</label>
                                            <input type="number" min="1" max="20" value={newSector.rows} onChange={(e) => setNewSector({ ...newSector, rows: e.target.value })} className="w-full border border-slate-200 rounded-xl px-4 py-3 text-slate-800 font-bold outline-none focus:border-blue-500" />
                                        </div>
                                        <div className="flex-1">
                                            <label className="block text-[10px] font-black text-slate-500 uppercase mb-1.5 ml-1">Colunas</label>
                                            <input type="number" min="1" max="20" value={newSector.cols} onChange={(e) => setNewSector({ ...newSector, cols: e.target.value })} className="w-full border border-slate-200 rounded-xl px-4 py-3 text-slate-800 font-bold outline-none focus:border-blue-500" />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-[10px] font-black text-slate-500 uppercase mb-1.5 ml-1">Orientação do Grid</label>
                                        <div className="flex gap-2">
                                            <button onClick={() => setNewSector({ ...newSector, orientation: 'horizontal' })} className={cn("flex-1 py-3 rounded-xl border-2 font-black text-[10px] uppercase tracking-widest transition-all", newSector.orientation === 'horizontal' ? 'border-blue-500 bg-blue-500 text-white shadow-lg' : 'border-slate-100 bg-white text-slate-400')}>Horizontal</button>
                                            <button onClick={() => setNewSector({ ...newSector, orientation: 'vertical' })} className={cn("flex-1 py-3 rounded-xl border-2 font-black text-[10px] uppercase tracking-widest transition-all", newSector.orientation === 'vertical' ? 'border-blue-500 bg-blue-500 text-white shadow-lg' : 'border-slate-100 bg-white text-slate-400')}>Vertical</button>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-[10px] font-black text-slate-500 uppercase mb-1.5 ml-1">Tipo de Expositor</label>
                                        <div className="flex gap-2">
                                            {["Showcase", "Wall", "Rack"].map(t => (
                                                <button
                                                    key={t}
                                                    onClick={() => setNewSector({ ...newSector, type: t as any })}
                                                    className={cn(
                                                        "flex-1 py-3 rounded-xl border-2 font-black text-[9px] uppercase tracking-tighter transition-all",
                                                        newSector.type === t ? 'border-blue-500 bg-blue-500 text-white shadow-lg' : 'border-slate-100 bg-white text-slate-400'
                                                    )}
                                                >
                                                    {t === "Showcase" ? "Expositor" : t === "Wall" ? "Parede" : "Rack"}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-[10px] font-black text-slate-500 uppercase mb-1.5 ml-1">Modo de Exibição</label>
                                        <div className="flex gap-2">
                                            <button onClick={() => setNewSector({ ...newSector, layoutMode: 'boxed' })} className={cn("flex-1 py-3 rounded-xl border-2 font-black text-[10px] uppercase tracking-widest transition-all", newSector.layoutMode === 'boxed' ? 'border-blue-500 bg-blue-500 text-white shadow-lg' : 'border-slate-100 bg-white text-slate-400')}>Boxed</button>
                                            <button onClick={() => setNewSector({ ...newSector, layoutMode: 'full' })} className={cn("flex-1 py-3 rounded-xl border-2 font-black text-[10px] uppercase tracking-widest transition-all", newSector.layoutMode === 'full' ? 'border-blue-500 bg-blue-500 text-white shadow-lg' : 'border-slate-100 bg-white text-slate-400')}>Full Width</button>
                                        </div>
                                    </div>

                                    <button
                                        onClick={() => {
                                            if (!newSector.name.trim()) return;
                                            if (editingSectorId) {
                                                setSections(prev => prev.map(s => s.id === editingSectorId ? {
                                                    ...s,
                                                    rows: Number(newSector.rows),
                                                    cols: Number(newSector.cols),
                                                    orientation: newSector.orientation as "horizontal" | "vertical",
                                                    type: newSector.type as any,
                                                    layoutMode: newSector.layoutMode as any
                                                } : s));
                                                setEditingSectorId(null);
                                            } else {
                                                const id = newSector.name.trim().toUpperCase();
                                                const spots: Spot[] = [];
                                                for (let r = 1; r <= Number(newSector.rows); r++) {
                                                    for (let c = 1; c <= Number(newSector.cols); c++) {
                                                        spots.push({ id: `${id}-${r}-${c}`, code: `${id}-${r}-${c}`, row: r, col: c, status: "available", products: [], updatedAt: new Date().toISOString() });
                                                    }
                                                }
                                                setSections([...sections, {
                                                    id,
                                                    label: `Setor ${id}`,
                                                    rows: Number(newSector.rows),
                                                    cols: Number(newSector.cols),
                                                    orientation: newSector.orientation as "horizontal" | "vertical",
                                                    type: newSector.type as any,
                                                    layoutMode: newSector.layoutMode as any,
                                                    spots
                                                }]);
                                                setActiveSectionId(id);
                                            }
                                            setNewSector({ name: '', rows: 4, cols: 6, orientation: 'horizontal', type: 'Showcase', layoutMode: 'boxed' });
                                            setIsAssistantOpen(false);
                                        }}
                                        disabled={!newSector.name.trim()}
                                        className="w-full bg-slate-800 hover:bg-slate-900 disabled:bg-slate-200 text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl transition-all flex items-center justify-center gap-2"
                                    >
                                        {editingSectorId ? <Save size={18} /> : <Plus size={18} />}
                                        {editingSectorId ? 'Salvar Setor' : 'Criar Setor'}
                                    </button>
                                </div>

                                {/* Active Sectors List */}
                                <div className="space-y-3">
                                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Setores Atuais ({sections.length})</h4>
                                    {sections.map(sec => (
                                        <div key={sec.id} className="bg-white border border-slate-200 p-4 rounded-2xl flex justify-between items-center group hover:border-blue-300 transition-all">
                                            <div>
                                                <span className="font-black text-slate-800 block">Setor {sec.label || sec.id}</span>
                                                <span className="text-[10px] font-bold text-slate-400 uppercase">{sec.rows}x{sec.cols} • {sec.orientation}</span>
                                            </div>
                                            <div className="flex gap-1">
                                                <button onClick={() => { 
                                                    setEditingSectorId(sec.id); 
                                                    setNewSector({ 
                                                        name: sec.id, 
                                                        rows: sec.rows, 
                                                        cols: sec.cols, 
                                                        orientation: sec.orientation || 'horizontal',
                                                        type: sec.type || 'Showcase',
                                                        layoutMode: sec.layoutMode || 'boxed'
                                                    }); 
                                                }} className="p-2 text-slate-400 hover:text-blue-600 transition-all"><Edit size={16} /></button>
                                                <button onClick={() => {
                                                    const next = sections.filter(s => s.id !== sec.id);
                                                    setSections(next);
                                                    if (activeSectionId === sec.id) setActiveSectionId(next[0]?.id || null);
                                                }} className="p-2 text-slate-400 hover:text-rose-600 transition-all"><Trash2 size={16} /></button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* MODAL VINCULAR PRODUTO (CATÁLOGO) */}
            <AnimatePresence>
                {isListOpen && (
                    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[160] flex items-center justify-center p-4 animate-fade-in">
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
                            className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[85vh]"
                        >
                            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                                <div>
                                    <h3 className="font-black text-slate-800 text-xl">Vincular Produto</h3>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Slot Ativo: {selectedSpot?.code}</p>
                                </div>
                                <button onClick={() => setIsListOpen(false)} className="p-2 bg-slate-200 text-slate-600 rounded-full hover:bg-slate-300 transition-all"><X size={18} /></button>
                            </div>

                            {/* Search */}
                            <div className="p-6 bg-white border-b border-slate-100">
                                <div className="relative group">
                                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" size={20} />
                                    <input
                                        type="text"
                                        placeholder="Buscar no catálogo..."
                                        className="w-full bg-slate-50 border border-slate-200 py-3.5 pl-12 pr-4 rounded-2xl outline-none focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all font-medium"
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                    />
                                </div>
                            </div>

                            {/* Catalog List */}
                            <div className="flex-1 overflow-y-auto p-4 custom-scrollbar space-y-2">
                                {(searchQuery ? activeCatalogProducts.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase())) : activeCatalogProducts).map(product => (
                                    <button
                                        key={product.id}
                                        onClick={() => {
                                            if (!selectedSpot) return;
                                            const updated = sections.map(s => ({
                                                ...s,
                                                spots: s.spots.map(sp => {
                                                    if (sp.id === selectedSpot.id) {
                                                        const existing = sp.products || [];
                                                        return { ...sp, products: [...existing, { id: product.id, name: product.name, quantity: 1 }], status: "occupied" as const };
                                                    }
                                                    return sp;
                                                })
                                            }));
                                            setSections(updated);
                                            setSelectedSpot(updated.flatMap(s => s.spots).find(sp => sp.id === selectedSpot.id) || null);
                                            setIsListOpen(false);
                                            push({ title: "Produto Vinculado", description: `${product.name} agora está no slot ${selectedSpot.code}.`, variant: "success" });
                                        }}
                                        className="w-full flex items-center gap-4 p-4 hover:bg-blue-50 rounded-2xl border border-transparent hover:border-blue-200 transition-all group text-left"
                                    >
                                        <div className="bg-slate-100 text-slate-500 p-3 rounded-xl group-hover:bg-white group-hover:text-blue-600 transition-all"><Box size={20} /></div>
                                        <div className="flex-1">
                                            <span className="font-bold text-slate-800 block text-sm">{product.name}</span>
                                            <span className="text-[10px] font-mono text-slate-400">SKU: {product.sku || product.id.slice(0, 8)}</span>
                                        </div>
                                        <Plus size={20} className="text-slate-300 group-hover:text-blue-500 transition-all" />
                                    </button>
                                ))}
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Assistant UI Component Integration */}
            <AnimatePresence>
                {isAssistantOpen && assistantMode !== null && (
                    <div className="fixed inset-0 z-[200]">
                        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md" onClick={() => { setIsAssistantOpen(false); setAssistantMode(null); }} />
                        <motion.div
                            initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
                            className="fixed bottom-0 left-0 right-0 bg-white rounded-t-[3rem] p-8 shadow-2xl flex flex-col items-center gap-6"
                        >
                            <div className="w-16 h-1.5 bg-slate-200 rounded-full mb-2" />
                            <div className="bg-blue-600 p-6 rounded-full shadow-2xl animate-pulse ring-8 ring-blue-500/20">
                                {assistantMode === 'voice' ? <Mic size={48} className="text-white" /> : <Camera size={48} className="text-white" />}
                            </div>
                            <div className="text-center w-full max-w-lg">
                                <h3 className="text-2xl font-black text-slate-800">Assistente AI Nexus</h3>
                                <p className="text-slate-500 mt-2 font-medium">
                                    {assistantMode === 'voice' ? "Ouvindo seu comando..." : "Aponte a câmera para o produto"}
                                </p>

                                {assistantMode === 'voice' && (
                                    <div className="mt-6 flex flex-col gap-4">
                                        <textarea
                                            value={assistantInput}
                                            onChange={(e) => setAssistantInput(e.target.value)}
                                            placeholder="Ex: Crie um novo setor A1 com 4 colunas..."
                                            className="w-full bg-slate-50 border-2 border-slate-100 rounded-3xl p-6 text-sm font-medium focus:border-blue-600 focus:ring-0 transition-all resize-none h-32"
                                        />
                                        <button
                                            onClick={async () => {
                                                if (!assistantInput.trim()) return;
                                                const res = await callGeminiAI(assistantInput);
                                                setAssistantReply(res.reply);
                                                setAssistantInput("");
                                            }}
                                            disabled={isProcessingAI}
                                            className="w-full bg-blue-600 text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-blue-200 hover:bg-blue-700 disabled:opacity-50 transition-all"
                                        >
                                            Enviar Comando
                                        </button>
                                    </div>
                                )}
                            </div>

                            {assistantReply && (
                                <div className="w-full max-w-lg bg-blue-50 border border-blue-100 p-6 rounded-3xl mt-4">
                                    <p className="text-sm font-medium text-slate-700 leading-relaxed italic">
                                        "{assistantReply}"
                                    </p>
                                </div>
                            )}

                            {/* Simulated detection display */}
                            {isProcessingAI && (
                                <div className="flex items-center gap-3 bg-slate-100 px-6 py-3 rounded-2xl">
                                    <Loader2 className="animate-spin text-blue-600" size={18} />
                                    <span className="text-sm font-black text-slate-600 uppercase tracking-widest">Processando...</span>
                                </div>
                            )}

                            {detectedItems.length > 0 && (
                                <div className="w-full space-y-3 mt-4">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Itens Detectados</label>
                                    {detectedItems.map(item => (
                                        <div key={item.id} className="bg-slate-50 border-2 border-blue-100 p-4 rounded-3xl flex justify-between items-center">
                                            <div className="flex items-center gap-4">
                                                <img src={item.imageUrl} className="w-16 h-16 rounded-2xl object-cover shadow-md" alt={item.name} />
                                                <div>
                                                    <span className="font-black text-slate-800 block">{item.name}</span>
                                                    <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded uppercase">{item.category}</span>
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => confirmAIDetection(item)}
                                                className="bg-blue-600 text-white p-4 rounded-2xl hover:bg-blue-700 shadow-lg shadow-blue-200 transition-all"
                                            >
                                                <CheckCircle2 size={24} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}

                            <button
                                onClick={() => { setIsAssistantOpen(false); setAssistantMode(null); }}
                                className="w-full mt-4 bg-slate-100 text-slate-500 py-4 rounded-2xl font-black text-xs uppercase tracking-widest"
                            >
                                Fechar Assistente
                            </button>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            <style jsx>{`
                .hide-scrollbar::-webkit-scrollbar {
                    display: none;
                }
                .hide-scrollbar {
                    -ms-overflow-style: none;
                    scrollbar-width: none;
                }
                .custom-scrollbar::-webkit-scrollbar {
                    width: 6px;
                    height: 6px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: #e2e8f0;
                    border-radius: 10px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: #cbd5e1;
                }
            `}</style>
        </div>
    );
}
