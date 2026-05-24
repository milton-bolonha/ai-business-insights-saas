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
import { useTranslation } from "@/lib/hooks/useTranslation";

interface ProductReference {
    id: string;
    name: string;
    quantity: number;
    sku?: string;
    price?: string;
    condition?: string;
    description?: string;
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
    label: string;
    spots: Spot[];
    rows: number;
    cols: number;
    orientation: "horizontal" | "vertical";
}

const STATUS_MAP = {
    available: { bg: 'bg-slate-50', border: 'border-slate-200', text: 'text-slate-400', key: 'available' },
    occupied: { bg: 'bg-emerald-50', border: 'border-emerald-300', text: 'text-emerald-600', key: 'occupied' },
    reserved: { bg: 'bg-amber-50', border: 'border-amber-300', text: 'text-amber-600', key: 'reserved' },
    blocked: { bg: 'bg-rose-50', border: 'border-rose-300', text: 'text-rose-600', key: 'blocked' },
};

interface StoreLayoutGridProps {
    tiles: Tile[];
    onSaveLayout?: (sections: MapSection[]) => Promise<any>;
    appearance?: any;
    onExport?: (category: string, format: "json" | "csv") => void;
}

export function StoreLayoutGrid({ tiles, onSaveLayout, appearance, onExport }: StoreLayoutGridProps) {
    const { t, locale } = useTranslation();
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
    const [selectedProduct, setSelectedProduct] = useState<{item: any; index: number} | null>(null);
    const [touchStartX, setTouchStartX] = useState<number | null>(null);
    const [newSector, setNewSector] = useState<{
        name: string;
        rows: number | string;
        cols: number | string;
        orientation: "horizontal" | "vertical";
        type: "Wall" | "Showcase" | "Rack";
    }>({ 
        name: '', 
        rows: 4, 
        cols: 6, 
        orientation: 'horizontal', 
        type: 'Showcase'
    });

    const [showAddSku, setShowAddSku] = useState(false);
    const [newProduct, setNewProduct] = useState({
        name: '',
        sku: '',
        price: '',
        condition: '',
        description: '',
        targetCell: ''
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
            push({ title: t("admin.storeLayout.toast.layoutSaved"), description: t("admin.storeLayout.toast.layoutSavedDesc"), variant: "success" });
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
            title: t("admin.storeLayout.toast.itemAdded"),
            description: t("admin.storeLayout.toast.itemAddedDesc", { name: item.name, spot: item.suggestedSpot || selectedSpot?.code || "" }),
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
                        <h2 className="font-black text-slate-800 text-base leading-none">{t("admin.storeLayout.header.title")}</h2>
                        <div className="flex items-center gap-2 mt-1">
                            <div className="flex items-center gap-1.5 bg-emerald-50 rounded-full px-2 py-0.5 border border-emerald-100">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                <span className="text-[9px] font-black text-emerald-700 uppercase tracking-widest">{t("admin.storeLayout.header.liveAi")}</span>
                            </div>
                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                                {t("admin.storeLayout.header.stats", { inCount: spotsWithProducts.length, outCount: allSpots.length - spotsWithProducts.length })}
                            </span>
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => { setIsAssistantOpen(true); setAssistantMode(null); }}
                        className="p-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-500 hover:text-blue-600 hover:border-blue-200 hover:bg-blue-50 transition-all"
                        title={t("admin.storeLayout.header.configureLayout")}
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
                            "px-4 py-1.5 rounded-xl font-bold text-xs transition-all flex items-center gap-1.5 border shrink-0",
                            activeSectionId === sec.id
                                ? 'bg-slate-800 text-white border-slate-800 shadow-md scale-105'
                                : 'bg-slate-50 text-slate-500 hover:bg-slate-100 border-slate-200'
                        )}
                    >
                        {sec.orientation === 'vertical' ? <GripVertical size={12} /> : <GripHorizontal size={12} />}
                        {sec.id}
                    </button>
                ))}
                <button
                    onClick={() => { setIsAssistantOpen(true); setAssistantMode(null); setEditingSectorId(null); setNewSector({ name: '', rows: 4, cols: 6, orientation: 'horizontal', type: 'Showcase' }); }}
                    className="px-3 py-1.5 rounded-xl font-bold text-xs bg-blue-50 text-blue-600 border border-blue-200 hover:bg-blue-100 transition-all flex items-center gap-1.5 shrink-0"
                >
                    <Plus size={12} /> {t("admin.storeLayout.header.newSector")}
                </button>
            </div>
        </div>
    );

    const renderMapGrid = () => {
        if (!activeSection) return (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-400 gap-4 bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200 p-12">
                <Warehouse size={48} className="opacity-20" />
                <p className="italic text-sm">{t("admin.storeLayout.empty.noSector")}</p>
                <button onClick={() => setIsEditorMode(true)} className="bg-blue-600 text-white px-6 py-2 rounded-xl font-bold shadow-lg">{t("admin.storeLayout.empty.configureFloorplan")}</button>
            </div>
        );

        return (
            <div className="w-full flex justify-center flex-1 min-h-0 relative animate-fade-in">
                <div
                    className="relative flex items-stretch group transition-all duration-300 w-full"
                    onTouchStart={(e) => setTouchStartX(e.touches[0].clientX)}
                    onTouchEnd={(e) => {
                        if (touchStartX === null) return;
                        const delta = touchStartX - e.changedTouches[0].clientX;
                        if (delta > 50) handleNext();
                        else if (delta < -50) handlePrev();
                        setTouchStartX(null);
                    }}
                >
                    {/* Carousel Navigation */}
                    {sections.length > 1 && (
                        <>
                            <button
                                onClick={handlePrev}
                                disabled={!hasPrev}
                                className="absolute top-1/2 -translate-y-1/2 left-2 z-40 p-2 bg-white shadow-xl rounded-full text-slate-600 hover:text-blue-600 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 disabled:hidden transition-all"
                            >
                                <ChevronLeft size={24} />
                            </button>
                            <button
                                onClick={handleNext}
                                disabled={!hasNext}
                                className="absolute top-1/2 -translate-y-1/2 right-2 z-40 p-2 bg-white shadow-xl rounded-full text-slate-600 hover:text-blue-600 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 disabled:hidden transition-all"
                            >
                                <ChevronRight size={24} />
                            </button>
                        </>
                    )}

                    {/* Grid Canvas */}
                    <div className={cn(
                        "bg-white border border-slate-200 rounded-2xl shadow-sm flex flex-col transition-all duration-300 w-full",
                        isCompactView
                            ? 'overflow-hidden flex-1 min-h-0 p-2'
                            : 'overflow-auto custom-scrollbar p-4'
                    )}>
                        <div
                            className={cn(
                                "grid",
                                isCompactView ? 'gap-1 flex-1 min-h-0 w-full h-full' : 'gap-3',
                                activeSection.orientation === 'vertical' ? 'grid-flow-col' : 'grid-flow-row'
                            )}
                            style={{
                                gridTemplateColumns: isCompactView
                                    ? `repeat(${activeSection.cols}, minmax(0, 1fr))`
                                    : `repeat(${activeSection.cols}, minmax(80px, 1fr))`,
                                gridTemplateRows: isCompactView
                                    ? `repeat(${activeSection.rows}, minmax(0, 1fr))`
                                    : `repeat(${activeSection.rows}, minmax(80px, auto))`
                            }}
                        >
                            {activeSection.spots.map(spot => {
                                const isSelected = selectedSpot?.id === spot.id;
                                const status = (spot.products && spot.products.length > 0) ? "occupied" : spot.status;
                                const styles = STATUS_MAP[status as keyof typeof STATUS_MAP] || STATUS_MAP.available;                                return (
                                    <button
                                        key={spot.id}
                                        onClick={() => setSelectedSpot(spot)}
                                        className={cn(
                                            "relative flex flex-col items-center justify-center transition-all duration-200 w-full h-full",
                                            isCompactView ? 'rounded-md border gap-0.5' : 'rounded-xl border-2 gap-1 p-2',
                                            styles.bg, styles.border, styles.text,
                                            isSelected ? 'ring-4 ring-blue-500/30 z-10 !border-blue-500 scale-105' : 'hover:brightness-95'
                                        )}
                                    >
                                        <span className={cn(
                                            "font-bold opacity-70",
                                            isCompactView ? 'text-[9px] sm:text-[10px] leading-none' : 'text-xs sm:text-sm'
                                        )}>
                                            {spot.code || `${spot.row}-${spot.col}`}
                                        </span>
                                        {status === 'occupied' && <Box size={isCompactView ? 16 : 24} strokeWidth={isCompactView ? 2 : 2.5} />}
                                        {status === 'blocked' && <AlertTriangle size={isCompactView ? 16 : 24} strokeWidth={isCompactView ? 2 : 2.5} />}

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
                        <div className="mt-4 flex flex-wrap gap-4 justify-center text-[10px] font-semibold shrink-0 border-t border-slate-50 pt-3">
                            {Object.entries(STATUS_MAP).map(([key, val]) => (
                                <div key={key} className="flex items-center gap-1.5">
                                    <span className={cn("w-2.5 h-2.5 rounded-full border shadow-sm", val.bg, val.border)} />
                                    <span className="text-slate-500 uppercase tracking-tight">{t("admin.storeLayout.status." + val.key)}</span>
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

            {/* GAVETA LATERAL (Detalhes do Slot) */}
            <AnimatePresence>
                {selectedSpot && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            onClick={() => { setSelectedSpot(null); setSelectedProduct(null); }}
                            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[90]"
                        />
                        <motion.div
                            initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
                            transition={{ type: "spring", damping: 25, stiffness: 200 }}
                            className="fixed top-0 right-0 bottom-0 w-full sm:w-[480px] bg-slate-50 border-l border-slate-200 z-[91] flex flex-col sm:rounded-l-3xl shadow-2xl overflow-hidden"
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
                                        <p className="text-slate-500 text-sm font-bold uppercase tracking-wider">{t("admin.storeLayout.drawer.sector", { sector: activeSection?.label || activeSection?.id || "" })}</p>
                                    </div>
                                </div>
                                <button onClick={() => setSelectedSpot(null)} className="bg-slate-100 p-2 rounded-full hover:bg-slate-200 transition-colors text-slate-500"><X size={20} /></button>
                            </div>

                            {/* Drawer Content */}
                            <div className="flex-1 overflow-y-auto p-6 custom-scrollbar space-y-6">
                                {/* Product List */}
                                <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
                                    <div className="flex justify-between mb-4 items-center border-b border-slate-50 pb-2">
                                        <h4 className="text-xs font-black text-slate-500 uppercase tracking-widest">{t("admin.storeLayout.drawer.slotContent", { count: selectedSpot.products?.length || 0 })}</h4>
                                        <button
                                            onClick={() => setShowAddSku(true)}
                                            className="text-blue-600 text-[10px] font-black uppercase tracking-widest flex items-center gap-1 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg transition-colors"
                                        >
                                            <Plus size={14} /> {t("admin.storeLayout.drawer.newProduct")}
                                        </button>
                                        <button
                                            onClick={() => setIsListOpen(true)}
                                            className="text-slate-600 text-[10px] font-black uppercase tracking-widest flex items-center gap-1 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-lg transition-colors ml-2"
                                        >
                                            <Plus size={14} /> {t("admin.storeLayout.drawer.linkCatalog")}
                                        </button>
                                    </div>
                                    <div className="space-y-3">
                                        {selectedSpot.products && selectedSpot.products.length > 0 ? (
                                            selectedSpot.products.map((item, index) => (
                                                <div
                                                    key={index}
                                                    className="flex justify-between items-center bg-slate-50 p-4 rounded-xl border border-slate-100 group hover:border-blue-300 transition-all cursor-pointer"
                                                    onClick={() => setSelectedProduct({ item, index })}
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <div className="bg-white text-blue-600 p-2 rounded-lg shadow-sm border border-slate-100"><Box size={20} /></div>
                                                        <div>
                                                            <span className="font-bold text-slate-800 block text-sm line-clamp-1">{item.name}</span>
                                                            <span className="text-[10px] font-mono text-slate-400">SKU: {item.id?.slice(0, 8) ?? item.sku ?? '—'}</span>
                                                        </div>
                                                    </div>
                                                    <ChevronRight size={16} className="text-slate-300 group-hover:text-blue-400 transition-all" />
                                                </div>
                                            ))
                                        ) : (
                                            <div className="text-center text-slate-400 text-xs py-12 border-2 border-dashed border-slate-100 rounded-2xl flex flex-col items-center gap-3 bg-slate-50/50">
                                                <Box size={32} className="opacity-10" />
                                                {t("admin.storeLayout.drawer.slotEmpty")}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* AI Smart Assist Info */}
                                <div className="bg-blue-600 p-6 rounded-3xl text-white shadow-xl shadow-blue-200 relative overflow-hidden group">
                                    <div className="absolute -right-4 -top-4 w-24 h-24 bg-white/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700" />
                                    <h5 className="font-black text-lg mb-2 flex items-center gap-2">
                                        <Bot size={22} /> {t("admin.storeLayout.drawer.aiAssistant")}
                                    </h5>
                                    <p className="text-blue-100 text-xs leading-relaxed font-medium mb-4">
                                        {t("admin.storeLayout.drawer.aiAssistantDesc")}
                                    </p>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => { setAssistantMode("voice"); setIsAssistantOpen(true); }}
                                            className="flex-1 bg-white/20 hover:bg-white/30 backdrop-blur-md py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
                                        >
                                            {t("admin.storeLayout.drawer.voice")}
                                        </button>
                                        <button
                                            onClick={() => { setAssistantMode("camera"); setIsAssistantOpen(true); }}
                                            className="flex-1 bg-white text-blue-600 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg"
                                        >
                                            {t("admin.storeLayout.drawer.camera")}
                                        </button>
                                    </div>
                                </div>

                                {/* Status Toggle (Quick Control) */}
                                <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-sm">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 block">{t("admin.storeLayout.drawer.manualStatus")}</label>
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
                                                {t("admin.storeLayout.status." + val.key)}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </motion.div>

                        {/* SEGUNDA GAVETA: Detalhe do Produto ("Folha") */}
                        <AnimatePresence>
                            {selectedProduct && (
                                <motion.div
                                    initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
                                    transition={{ type: "spring", damping: 28, stiffness: 220 }}
                                    className="fixed top-0 right-0 bottom-0 w-full sm:w-[400px] bg-white z-[101] flex flex-col shadow-[-30px_0_60px_rgba(0,0,0,0.18)] sm:rounded-l-3xl overflow-hidden"
                                >
                                    <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50 shrink-0">
                                        <div>
                                            <h3 className="font-black text-slate-800 text-lg">{selectedProduct.item.name}</h3>
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">SKU: {selectedProduct.item.id?.slice(0,8) ?? selectedProduct.item.sku ?? '—'}</p>
                                        </div>
                                        <button onClick={() => setSelectedProduct(null)} className="p-2 bg-slate-100 rounded-full text-slate-500 hover:bg-slate-200 transition-all"><X size={18} /></button>
                                    </div>
                                    <div className="flex-1 overflow-y-auto p-6 custom-scrollbar space-y-4">
                                        <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 space-y-3">
                                            {selectedProduct.item.price && <div className="flex justify-between text-sm"><span className="text-slate-400 font-bold">{t("admin.storeLayout.productDrawer.price")}</span><span className="font-black text-slate-800">{selectedProduct.item.price}</span></div>}
                                            {selectedProduct.item.condition && <div className="flex justify-between text-sm"><span className="text-slate-400 font-bold">{t("admin.storeLayout.productDrawer.condition")}</span><span className="font-black text-slate-800">{selectedProduct.item.condition}</span></div>}
                                            <div className="flex justify-between text-sm"><span className="text-slate-400 font-bold">{t("admin.storeLayout.productDrawer.slot")}</span><span className="font-black text-slate-800">{selectedSpot?.code}</span></div>
                                            <div className="flex justify-between text-sm"><span className="text-slate-400 font-bold">{t("admin.storeLayout.productDrawer.qty")}</span><span className="font-black text-slate-800">{selectedProduct.item.quantity ?? 1}</span></div>
                                        </div>
                                        {selectedProduct.item.description && (
                                            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
                                                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">{t("admin.storeLayout.productDrawer.details")}</p>
                                                <p className="text-sm text-slate-700 leading-relaxed">{selectedProduct.item.description}</p>
                                            </div>
                                        )}
                                    </div>
                                    <div className="p-4 border-t border-slate-100 shrink-0">
                                        <button
                                            onClick={() => {
                                                const idx = selectedProduct.index;
                                                const updated = sections.map(s => ({ ...s, spots: s.spots.map(sp => { if (sp.id === selectedSpot!.id) { const np = sp.products.filter((_,i) => i !== idx); return { ...sp, products: np, status: np.length === 0 ? 'available' as const : sp.status }; } return sp; }) }));
                                                setSections(updated);
                                                setSelectedSpot(updated.flatMap(s=>s.spots).find(sp=>sp.id===selectedSpot!.id)||null);
                                                setSelectedProduct(null);
                                            }}
                                            className="w-full py-3 bg-rose-50 border border-rose-200 text-rose-600 font-bold rounded-xl hover:bg-rose-100 transition-all flex items-center justify-center gap-2 text-sm"
                                        >
                                            <Trash2 size={16} /> {t("admin.storeLayout.productDrawer.removeFromSlot")}
                                        </button>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </>
                )}
            </AnimatePresence>

            {/* MODAL CONFIGURAÇÃO (LAYOUT EDITOR) */}
            <AnimatePresence>
                {isAssistantOpen && assistantMode === null && (
                    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[70] flex items-center justify-center p-4 animate-fade-in">
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
                            className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-md overflow-hidden flex flex-col max-h-[90vh]"
                        >
                            <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50 shrink-0">
                                <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2"><Settings size={20} className="text-slate-500" /> {t("admin.storeLayout.header.configureLayout")}</h3>
                                <button onClick={() => { setIsAssistantOpen(false); setEditingSectorId(null); }} className="p-1.5 bg-slate-200 rounded-full text-slate-500 hover:bg-slate-300 transition-all"><X size={18} /></button>
                            </div>

                            <div className="p-6 flex-1 overflow-y-auto custom-scrollbar space-y-6">
                                {/* New Section Form */}
                                <div className="bg-blue-50/50 border border-blue-100 p-5 rounded-2xl mb-6 space-y-4">
                                    <h4 className="text-xs font-black text-blue-800 uppercase tracking-wider flex items-center gap-1">
                                        <Plus size={14} /> {editingSectorId ? t("admin.storeLayout.modal.editSector") : t("admin.storeLayout.modal.newSector")}
                                    </h4>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-600 mb-1.5">{t("admin.storeLayout.modal.identifierLabel")}</label>
                                        <input
                                            type="text"
                                            value={newSector.name}
                                            disabled={!!editingSectorId}
                                            onChange={(e) => setNewSector({ ...newSector, name: e.target.value.toUpperCase() })}
                                            className="w-full bg-white border border-slate-300 rounded-xl px-4 py-2.5 text-slate-800 font-bold uppercase outline-none focus:border-blue-500 transition-all"
                                            maxLength={6}
                                        />
                                    </div>
                                    <div className="flex gap-3">
                                        <div className="flex-1">
                                            <label className="block text-xs font-bold text-slate-600 mb-1.5">{t("admin.storeLayout.modal.rows")}</label>
                                            <input type="number" min="1" max="20" value={newSector.rows ?? 4} onChange={(e) => setNewSector({ ...newSector, rows: e.target.value })} className="w-full bg-white border border-slate-300 rounded-xl px-4 py-2.5 text-slate-800 font-bold outline-none focus:border-blue-500" />
                                        </div>
                                        <div className="flex-1">
                                            <label className="block text-xs font-bold text-slate-600 mb-1.5">{t("admin.storeLayout.modal.cols")}</label>
                                            <input type="number" min="1" max="20" value={newSector.cols ?? 6} onChange={(e) => setNewSector({ ...newSector, cols: e.target.value })} className="w-full bg-white border border-slate-300 rounded-xl px-4 py-2.5 text-slate-800 font-bold outline-none focus:border-blue-500" />
                                        </div>
                                    </div>

                                    <label className="block text-xs font-bold text-slate-600 mb-1 mt-2">{t("admin.storeLayout.modal.orientation")}</label>
                                    <div className="flex gap-2">
                                        <button onClick={() => setNewSector({ ...newSector, orientation: 'horizontal' })} className={cn("flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border-2 font-bold text-sm transition-colors", newSector.orientation === 'horizontal' ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-slate-200 bg-white text-slate-500')}><GripHorizontal size={16} /> {t("admin.storeLayout.modal.horizontal")}</button>
                                        <button onClick={() => setNewSector({ ...newSector, orientation: 'vertical' })} className={cn("flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border-2 font-bold text-sm transition-colors", newSector.orientation === 'vertical' ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-slate-200 bg-white text-slate-500')}><GripVertical size={16} /> {t("admin.storeLayout.modal.vertical")}</button>
                                    </div>

                                    <div className="flex gap-2 mt-2">
                                        {["Showcase", "Wall", "Rack"].map(typeKey => (
                                            <button
                                                key={typeKey}
                                                onClick={() => setNewSector({ ...newSector, type: typeKey as any })}
                                                className={cn(
                                                    "flex-1 py-2.5 rounded-xl border-2 font-bold text-xs transition-all",
                                                    newSector.type === typeKey ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-slate-200 bg-white text-slate-500'
                                                )}
                                            >
                                                {typeKey === "Showcase" ? t("admin.storeLayout.modal.showcase") : typeKey === "Wall" ? t("admin.storeLayout.modal.wall") : t("admin.storeLayout.modal.rack")}
                                            </button>
                                        ))}
                                    </div>

                                    <div className="flex gap-2 mt-2 pt-2">
                                        {editingSectorId && <button onClick={() => setEditingSectorId(null)} className="flex-1 bg-white border border-slate-300 text-slate-700 py-3 rounded-xl font-bold hover:bg-slate-50 transition-colors">{t("admin.storeLayout.modal.cancel")}</button>}
                                        <button
                                            onClick={() => {
                                                if (!newSector.name.trim()) return;
                                                if (editingSectorId) {
                                                    // Smart resize: preserve existing spots, only add/remove
                                                    setSections(prev => prev.map(s => {
                                                        if (s.id !== editingSectorId) return s;
                                                        const newRows = Number(newSector.rows);
                                                        const newCols = Number(newSector.cols);
                                                        const existingSpotMap = new Map(s.spots.map(sp => [sp.id, sp]));
                                                        const nextSpots: Spot[] = [];
                                                        for (let r = 1; r <= newRows; r++) {
                                                            for (let c = 1; c <= newCols; c++) {
                                                                const sid = `${s.id}-${r}-${c}`;
                                                                nextSpots.push(existingSpotMap.get(sid) || { id: sid, code: sid, row: r, col: c, status: 'available', products: [], updatedAt: new Date().toISOString() });
                                                            }
                                                        }
                                                        return { ...s, rows: newRows, cols: newCols, orientation: newSector.orientation as any, type: newSector.type as any, spots: nextSpots };
                                                    }));
                                                    setEditingSectorId(null);
                                                } else {
                                                    const id = newSector.name.trim().toUpperCase();
                                                    const spots: Spot[] = [];
                                                    for (let r = 1; r <= Number(newSector.rows); r++) {
                                                        for (let c = 1; c <= Number(newSector.cols); c++) {
                                                            spots.push({ id: `${id}-${r}-${c}`, code: `${id}-${r}-${c}`, row: r, col: c, status: "available", products: [], updatedAt: new Date().toISOString() });
                                                        }
                                                    }
                                                    setSections([...sections, { id, label: t("admin.storeLayout.modal.sectorTitle", { id }), rows: Number(newSector.rows), cols: Number(newSector.cols), orientation: newSector.orientation as any, type: newSector.type as any, spots }]);
                                                    setActiveSectionId(id);
                                                }
                                                setNewSector({ name: '', rows: 4, cols: 6, orientation: 'horizontal', type: 'Showcase' });
                                            }}
                                            disabled={!newSector.name.trim()}
                                            className="flex-1 bg-slate-800 hover:bg-slate-900 disabled:bg-slate-300 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-md"
                                        >
                                            {editingSectorId ? <Save size={16} /> : <Plus size={16} />}
                                            {editingSectorId ? t("admin.storeLayout.modal.save") : t("admin.storeLayout.modal.add")}
                                        </button>
                                    </div>
                                </div>

                                {/* Active Sectors List */}
                                <div className="space-y-3">
                                <h4 className="text-xs font-black text-slate-400 uppercase tracking-wider mb-3">{t("admin.storeLayout.modal.activeSectors", { count: sections.length })}</h4>
                                <div className="space-y-2">
                                    {sections.map(sec => (
                                        <div key={sec.id} className={cn(
                                            "flex justify-between items-center bg-white border p-3 rounded-2xl shadow-sm transition-all",
                                            editingSectorId === sec.id ? 'border-blue-500 ring-2 ring-blue-500/20 shadow-md' : 'border-slate-200'
                                        )}>
                                            <div>
                                                <span className="font-black text-slate-800 block text-lg">{t("admin.storeLayout.modal.sectorTitle", { id: sec.id })}</span>
                                                <span className="text-xs text-slate-500 font-bold bg-slate-100 px-2 py-0.5 rounded uppercase mt-1 inline-block">{sec.rows}x{sec.cols} • {sec.orientation}</span>
                                            </div>
                                            <div className="flex gap-1 bg-slate-50 p-1 rounded-xl border border-slate-100">
                                                <button onClick={() => { 
                                                    setEditingSectorId(sec.id); 
                                                    setNewSector({ 
                                                        name: sec.id, 
                                                        rows: sec.rows ?? 4, 
                                                        cols: sec.cols ?? 6, 
                                                        orientation: (sec.orientation as any) || 'horizontal',
                                                        type: (sec.type as any) || 'Showcase'
                                                    }); 
                                                }} className="text-slate-400 hover:text-blue-600 bg-white p-2 rounded-lg shadow-sm transition-all"><Edit size={16} /></button>
                                                <button onClick={() => {
                                                    const next = sections.filter(s => s.id !== sec.id);
                                                    setSections(next);
                                                    if (activeSectionId === sec.id) setActiveSectionId(next[0]?.id || null);
                                                }} className="text-slate-400 hover:text-rose-600 bg-white p-2 rounded-lg shadow-sm transition-all"><Trash2 size={16} /></button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                {/* Export Buttons */}
                                {onExport && (
                                    <div className="pt-4 border-t border-slate-100 space-y-2">
                                        <h4 className="text-xs font-black text-slate-400 uppercase tracking-wider mb-3">{t("admin.storeLayout.modal.exportData")}</h4>
                                        <div className="flex gap-2">
                                            <button onClick={() => onExport('store_layout', 'json')} className="flex-1 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-600 font-bold text-xs hover:border-blue-400 hover:text-blue-600 transition-all flex items-center justify-center gap-2">
                                                <Box size={14} /> JSON
                                            </button>
                                            <button onClick={() => onExport('store_layout', 'csv')} className="flex-1 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-600 font-bold text-xs hover:border-emerald-400 hover:text-emerald-600 transition-all flex items-center justify-center gap-2">
                                                <Grid size={14} /> CSV
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>{/* end space-y-3 */}
                            {/* Save Layout Button */}
                            <div className="p-4 border-t border-slate-100 shrink-0">
                                <button
                                    onClick={() => { handleSave(); setIsAssistantOpen(false); }}
                                    className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl flex items-center justify-center gap-2 shadow-md transition-all text-sm"
                                >
                                    <Save size={16} /> {t("admin.storeLayout.modal.saveLayout")}
                                </button>
                            </div>
                            </div>{/* end scrollable */}
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
                                    <h3 className="font-black text-slate-800 text-xl">{t("admin.storeLayout.linkModal.title")}</h3>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">{t("admin.storeLayout.linkModal.activeSlot", { code: selectedSpot?.code || "" })}</p>
                                </div>
                                <button onClick={() => setIsListOpen(false)} className="p-2 bg-slate-200 text-slate-600 rounded-full hover:bg-slate-300 transition-all"><X size={18} /></button>
                            </div>

                            {/* Search */}
                            <div className="p-6 bg-white border-b border-slate-100">
                                <div className="relative group">
                                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" size={20} />
                                    <input
                                        type="text"
                                        placeholder={t("admin.storeLayout.linkModal.searchPlaceholder")}
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
                                            push({ title: t("admin.storeLayout.toast.productLinked"), description: t("admin.storeLayout.toast.productLinkedDesc", { name: product.name, spot: selectedSpot.code }), variant: "success" });
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
                {/* MODAL ADICIONAR ITEM MANUALMENTE */}
                {showAddSku && (
                    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[180] flex items-center justify-center p-4 animate-fade-in">
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
                            className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-sm overflow-hidden p-8"
                        >
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="font-black text-slate-800 text-xl">{t("admin.storeLayout.addProductModal.title")}</h3>
                                <button onClick={() => setShowAddSku(false)} className="text-slate-400 bg-slate-100 p-2 rounded-full hover:bg-slate-200 transition-all"><X size={18} /></button>
                            </div>
                            
                            <div className="space-y-4">
                                <input type="text" value={newProduct.name} onChange={e => setNewProduct({...newProduct, name: e.target.value})} placeholder={t("admin.storeLayout.addProductModal.namePlaceholder")} className="w-full border border-slate-200 p-3.5 rounded-xl bg-slate-50 focus:bg-white focus:border-blue-500 outline-none font-bold transition-all" />
                                <div className="flex gap-3">
                                    <input type="text" value={newProduct.sku} onChange={e => setNewProduct({...newProduct, sku: e.target.value})} placeholder={t("admin.storeLayout.addProductModal.skuPlaceholder")} className="w-full border border-slate-200 p-3.5 rounded-xl bg-slate-50 focus:bg-white focus:border-blue-500 outline-none font-bold transition-all" />
                                    <input type="text" value={newProduct.price} onChange={e => setNewProduct({...newProduct, price: e.target.value})} placeholder={t("admin.storeLayout.addProductModal.pricePlaceholder")} className="w-full border border-slate-200 p-3.5 rounded-xl bg-slate-50 focus:bg-white focus:border-blue-500 outline-none font-bold transition-all" />
                                </div>
                                <input type="text" value={newProduct.condition} onChange={e => setNewProduct({...newProduct, condition: e.target.value})} placeholder={t("admin.storeLayout.addProductModal.conditionPlaceholder")} className="w-full border border-slate-200 p-3.5 rounded-xl bg-slate-50 focus:bg-white focus:border-blue-500 outline-none font-bold transition-all" />
                                <textarea value={newProduct.description} onChange={e => setNewProduct({...newProduct, description: e.target.value})} placeholder={t("admin.storeLayout.addProductModal.detailsPlaceholder")} className="w-full border border-slate-200 p-3.5 rounded-xl h-24 bg-slate-50 focus:bg-white focus:border-blue-500 outline-none resize-none font-medium transition-all"></textarea>

                                <button
                                    onClick={() => {
                                        if (!newProduct.name.trim()) return;
                                        const targetSpot = selectedSpot || sections.flatMap(s => s.spots).find(sp => sp.id === newProduct.targetCell);
                                        if (!targetSpot) {
                                            push({ title: t("admin.storeLayout.toast.error"), description: t("admin.storeLayout.toast.selectSlotError"), variant: "destructive" });
                                            return;
                                        }

                                        const updated = sections.map(s => ({
                                            ...s,
                                            spots: s.spots.map(sp => {
                                                if (sp.id === targetSpot.id) {
                                                    const existing = sp.products || [];
                                                    return { 
                                                        ...sp, 
                                                        products: [...existing, { 
                                                            id: `prod_${Date.now()}`, 
                                                            name: newProduct.name, 
                                                            sku: newProduct.sku,
                                                            price: newProduct.price,
                                                            quantity: 1 
                                                        }], 
                                                        status: "occupied" as const 
                                                    };
                                                }
                                                return sp;
                                            })
                                        }));
                                        setSections(updated);
                                        if (selectedSpot) setSelectedSpot(updated.flatMap(s => s.spots).find(sp => sp.id === selectedSpot.id) || null);
                                        setShowAddSku(false);
                                        setNewProduct({ name: '', sku: '', price: '', condition: '', description: '', targetCell: '' });
                                        push({ title: t("admin.storeLayout.toast.productCreated"), description: t("admin.storeLayout.toast.productCreatedDesc", { name: newProduct.name, spot: targetSpot.code }), variant: "success" });
                                    }}
                                    className="w-full bg-slate-800 hover:bg-slate-900 text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl transition-all flex items-center justify-center gap-2"
                                >
                                    <Plus size={18} /> {t("admin.storeLayout.addProductModal.submitButton")}
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
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
                                <h3 className="text-2xl font-black text-slate-800">{t("admin.storeLayout.assistant.title")}</h3>
                                <p className="text-slate-500 mt-2 font-medium">
                                    {assistantMode === 'voice' ? t("admin.storeLayout.assistant.listening") : t("admin.storeLayout.assistant.pointingCamera")}
                                </p>

                                {assistantMode === 'voice' && (
                                    <div className="mt-6 flex flex-col gap-4">
                                        <textarea
                                            value={assistantInput}
                                            onChange={(e) => setAssistantInput(e.target.value)}
                                            placeholder={t("admin.storeLayout.assistant.inputPlaceholder")}
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
                                            {t("admin.storeLayout.assistant.sendCommand")}
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
                                    <span className="text-sm font-black text-slate-600 uppercase tracking-widest">{t("admin.storeLayout.assistant.processing")}</span>
                                </div>
                            )}

                            {detectedItems.length > 0 && (
                                <div className="w-full space-y-3 mt-4">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">{t("admin.storeLayout.assistant.detectedItems")}</label>
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
                                {t("admin.storeLayout.assistant.close")}
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
