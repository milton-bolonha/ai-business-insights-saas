"use client";

import React, { useState, useMemo, useEffect } from "react";
import {
    Map as MapIcon,
    MapPin,
    Box,
    Layout,
    Maximize2,
    ChevronRight,
    Warehouse,
    Plus,
    Settings,
    Grid,
    Zap,
    Search,
    Mic,
    Camera,
    MessageSquare,
    Sparkles,
    Loader2
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
    span: "short" | "long";
    products: ProductReference[];
}

interface MapSection {
    id: string;
    type: "Wall" | "Showcase";
    label: string;
    spots: Spot[];
    rows?: number;
    cols?: number;
    orientation?: "horizontal" | "vertical";
}

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
    const [activeSectionIndex, setActiveSectionIndex] = useState(0);
    const [isCompactView, setIsCompactView] = useState(false);

    const { 
        isProcessingAI, 
        setIsProcessingAI,
        actionLogs, 
        detectedItems,
        setDetectedItems,
        executeCommands, 
        callGeminiAI,
        logActivity
    } = useWMSOrchestrator(sections, setSections);

    // Sync from Tiles into Local State (on Load)
    useEffect(() => {
        const layoutTile = tiles.find(t => t.category === "store_layout");
        let loadedSections = layoutTile?.metadata?.sections;
        if (!loadedSections && layoutTile?.metadata && Array.isArray(layoutTile.metadata)) {
            // Fallback for array format
            loadedSections = layoutTile.metadata;
        }
        if (loadedSections && Array.isArray(loadedSections) && loadedSections.length > 0) {
            // Filter out corridors from existing data
            const filteredSections = loadedSections.filter((s: any) => s.type !== "Corridor");
            setSections(filteredSections as MapSection[]);
        }
    }, [tiles]);

    // Wizard Configuration State
    const [wizardConfig, setWizardConfig] = useState({
        showcaseCount: 4,
        hasWallShowcases: true,
        spotType: "multiple" as "single" | "multiple",
        isMirrored: false
    });

    const allSpots = sections.flatMap(s => s.spots);
    const spotsWithProducts = allSpots.filter(s => s.products.length > 0);

    let productTile = tiles.find(t => t.category === "products");
    if (!productTile) {
        productTile = tiles.find(t => t.metadata && (Array.isArray(t.metadata.products) || (Array.isArray(t.metadata) && t.metadata.length > 0 && (t.metadata[0] as any).price !== undefined)));
    }
    const catalogMetadata = productTile?.metadata || {};
    const catalogProducts: any[] = Array.isArray(catalogMetadata)
        ? catalogMetadata
        : (catalogMetadata.products || []);
    const activeCatalogProducts = catalogProducts.filter(p => !p.archived);

    const searchResults = searchQuery ? activeCatalogProducts.filter((p: any) =>
        p.name.toLowerCase().includes(searchQuery.toLowerCase())
    ).map((p: any) => {
        const mappedSpot = sections.flatMap(s => s.spots.map(sp => ({ ...sp, sectionLabel: s.label }))).find(sp =>
            (sp.products || []).some((spP: any) => spP.name.toLowerCase() === p.name.toLowerCase() || spP.id === p.id)
        );

        return {
            ...p,
            spotCode: mappedSpot ? mappedSpot.code : "Vitrine / Sem Local",
            sectionLabel: mappedSpot ? mappedSpot.sectionLabel : "Depósito",
            spotId: mappedSpot ? mappedSpot.id : null
        };
    }) : [];

    // --- Generator Logic (The "Smart" way) ---
    const generateLayout = () => {
        const newSections: MapSection[] = [];

        // Generate Showcases
        for (let i = 0; i < wizardConfig.showcaseCount; i++) {
            const char = String.fromCharCode(65 + i); // A, B, C...
            newSections.push({
                id: `show-${char}`,
                type: "Showcase",
                label: `Expositor ${char}`,
                spots: [
                    { id: `${char}1`, code: `${char}1`, span: "short", products: [] },
                    { id: `${char}2`, code: `${char}2`, span: "long", products: [] },
                    { id: `${char}3`, code: `${char}3`, span: "short", products: [] },
                ]
            });
        }

        const finalSections = wizardConfig.isMirrored ? [...newSections].reverse() : newSections;
        setSections(finalSections);
        if (onSaveLayout) {
            onSaveLayout(finalSections);
        }
        push({ title: "Planta Gerada & Salva", description: "Mapeamento reconfigurado e persistido no banco.", variant: "success" });
    };

    // --- AI Smart Inventory Assistant ---
    const processMultiModalInput = async (type: string) => {
        setIsProcessingAI(true);
        // Simulating AI Processing (Gemini Vision/Whisper)
        setTimeout(() => {
            setIsProcessingAI(false);
            setDetectedItems([
                {
                    id: "det-1",
                    name: "Poltrona Bolonha Velvet",
                    confidence: 0.98,
                    category: "Poltronas",
                    imageUrl: "https://images.unsplash.com/photo-1540518614846-7eded433c457?w=400",
                    suggestedSpot: selectedSpot?.code || "A1"
                },
                {
                    id: "det-2",
                    name: "Mesa de Apoio Bolonha",
                    confidence: 0.85,
                    category: "Mesas",
                    imageUrl: "https://images.unsplash.com/photo-1581428982868-e410dd047a90?w=400",
                    suggestedSpot: selectedSpot?.code || "A1"
                }
            ]);
        }, 2500);
    };

    const confirmAIDetection = (item: any) => {
        const updatedSections = sections.map(sec => ({
            ...sec,
            spots: sec.spots.map(spot => {
                if (spot.code === item.suggestedSpot || spot.id === selectedSpot?.id) {
                    const existing = spot.products || [];
                    return {
                        ...spot,
                        products: [...existing, { id: item.id, name: item.name, quantity: 1, category: item.category }]
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

    // --- Editor Actions ---
    const addSection = (index: number) => {
        const newSection: MapSection = {
            id: `new-${Date.now()}`,
            type: "Showcase",
            label: "Novo",
            spots: [{ id: `s-${Date.now()}`, code: "?", span: "short", products: [] }]
        };
        const updated = [...sections];
        updated.splice(index, 0, newSection);
        setSections(updated);
    };

    const removeSection = (id: string) => {
        setSections(sections.filter(s => s.id !== id));
    };

    const moveSection = (index: number, direction: "left" | "right") => {
        const updated = [...sections];
        const target = direction === "left" ? index - 1 : index + 1;
        if (target < 0 || target >= sections.length) return;
        [updated[index], updated[target]] = [updated[target], updated[index]];
        setSections(updated);
    };

    const addSpot = (sectionId: string) => {
        setSections(sections.map(s => {
            if (s.id !== sectionId) return s;
            return {
                ...s,
                spots: [...s.spots, { id: `spot-${Date.now()}`, code: `${s.label}${s.spots.length + 1}`, span: "short", products: [] }]
            };
        }));
    };

    return (
        <div className="relative flex flex-col gap-0 min-h-screen overflow-hidden">

            {/* Principal: Floor Navigator (Now Full Width) */}
            <div className="flex-1 space-y-4">

                {/* Superior: Actions & Stats */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 px-4 pt-4">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-gray-900 rounded-2xl flex items-center justify-center shadow-lg">
                            <Layout className="h-6 w-6 text-white" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-black text-gray-900 uppercase tracking-tighter leading-none mb-1">Mapeamento</h2>
                            <div className="flex items-center gap-2">
                                <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                                <span className="text-[11px] font-black text-gray-400 uppercase tracking-[0.2em]">Showroom Interactive View</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="relative group">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-300 group-focus-within:text-indigo-600 transition-colors" />
                            <input
                                type="text"
                                placeholder="Buscar item..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-12 pr-6 py-4 bg-gray-50 border-2 border-transparent rounded-2xl text-xs font-bold w-64 shadow-inner focus:bg-white focus:border-indigo-100 transition-all outline-none"
                            />
                        </div>
                        <button
                            onClick={() => setIsListOpen(true)}
                            className="bg-gray-50 p-3 rounded-xl text-gray-400 hover:text-indigo-600 transition-all relative border-2 border-transparent hover:border-indigo-50"
                            title="Inventory List"
                        >
                            <Box className="h-5 w-5" />
                            {spotsWithProducts.length > 0 && (
                                <span className="absolute -top-1 -right-1 bg-indigo-600 text-white text-[8px] font-black w-4 h-4 rounded-full flex items-center justify-center border-2 border-white">{spotsWithProducts.length}</span>
                            )}
                        </button>
                        
                        <div className="relative group">
                            <button
                                className="bg-gray-50 p-3 rounded-xl text-gray-400 hover:text-indigo-600 transition-all border-2 border-transparent hover:border-indigo-50"
                                title="Export Data"
                            >
                                <ChevronRight className="h-5 w-5 rotate-90" />
                            </button>
                            <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-2xl shadow-2xl border border-gray-100 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-[60] overflow-hidden">
                                <button 
                                    onClick={() => onExport?.("store_layout", "json")}
                                    className="w-full px-4 py-3 text-left text-[10px] font-black uppercase tracking-widest text-gray-600 hover:bg-indigo-50 hover:text-indigo-600 transition-colors border-b border-gray-50"
                                >
                                    Exportar JSON
                                </button>
                                <button 
                                    onClick={() => onExport?.("store_layout", "csv")}
                                    className="w-full px-4 py-3 text-left text-[10px] font-black uppercase tracking-widest text-gray-600 hover:bg-indigo-50 hover:text-indigo-600 transition-colors"
                                >
                                    Exportar CSV
                                </button>
                            </div>
                        </div>
                        <button
                            onClick={() => setIsEditorMode(!isEditorMode)}
                            className={cn(
                                "p-3 rounded-xl border-2 transition-all",
                                isEditorMode ? "bg-sky-600 border-sky-600 text-white shadow-lg" : "bg-gray-50 border-transparent text-gray-400 shadow-inner"
                            )}
                            title="Toggle Editor"
                        >
                            <Settings className="h-5 w-5" />
                        </button>

                        {isEditorMode && (
                            <button
                                onClick={() => onSaveLayout?.(sections)}
                                className="p-3 bg-emerald-600 text-white rounded-xl shadow-lg hover:bg-emerald-700 transition-all flex items-center gap-2 px-6"
                            >
                                <Zap className="h-4 w-4" />
                                <span className="text-[10px] font-black uppercase tracking-widest leading-none">Salvar</span>
                            </button>
                        )}

                        <button
                            onClick={() => setIsCompactView(!isCompactView)}
                            className={cn(
                                "p-3 rounded-xl border-2 transition-all",
                                isCompactView ? "bg-indigo-600 border-indigo-600 text-white shadow-lg" : "bg-gray-50 border-transparent text-gray-400 shadow-inner"
                            )}
                            title="Toggle Compact View"
                        >
                            <Maximize2 className="h-5 w-5" />
                        </button>

                        <div className="h-10 w-[1px] bg-gray-100 mx-2" />

                        <button
                            onClick={() => { setAssistantMode("voice"); setIsAssistantOpen(true); }}
                            className="p-3 bg-indigo-50 text-indigo-600 rounded-xl hover:bg-indigo-100 transition-all flex items-center gap-2 shadow-sm"
                            title="Inventário por Voz"
                        >
                            <Mic className="h-5 w-5" />
                            <Sparkles className="h-3 w-3 animate-pulse" />
                        </button>
                        <button
                            onClick={() => { setAssistantMode("camera"); setIsAssistantOpen(true); }}
                            className="p-3 bg-gray-900 text-white rounded-xl hover:bg-black transition-all flex items-center gap-2 shadow-lg"
                            title="Inventário por Foto (IA Vision)"
                        >
                            <Camera className="h-5 w-5" />
                        </button>
                    </div>
                </div>

                {/* Advanced Layout Wizard (Form-based) */}
                <AnimatePresence>
                    {isEditorMode && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden bg-gray-50/50 border-b border-gray-100"
                        >
                            <div className="p-8 max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-5 gap-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Expositores</label>
                                    <input
                                        type="number"
                                        value={wizardConfig.showcaseCount}
                                        onChange={e => setWizardConfig({ ...wizardConfig, showcaseCount: parseInt(e.target.value) })}
                                        className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2 text-xs font-bold focus:border-indigo-500 outline-none"
                                    />
                                </div>

                                <div className="flex items-center gap-6 md:col-span-2">
                                    <div className="flex flex-col gap-2">
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none">Expositores Parede</label>
                                        <button
                                            onClick={() => setWizardConfig({ ...wizardConfig, hasWallShowcases: !wizardConfig.hasWallShowcases })}
                                            className={cn("w-12 h-6 rounded-full transition-all relative p-1", wizardConfig.hasWallShowcases ? "bg-indigo-600" : "bg-gray-200")}
                                        >
                                            <div className={cn("w-4 h-4 bg-white rounded-full transition-all shadow-sm", wizardConfig.hasWallShowcases ? "translate-x-6" : "translate-x-0")} />
                                        </button>
                                    </div>
                                    <div className="flex flex-col gap-2">
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none">Layout Espelhado</label>
                                        <button
                                            onClick={() => setWizardConfig({ ...wizardConfig, isMirrored: !wizardConfig.isMirrored })}
                                            className={cn("w-12 h-6 rounded-full transition-all relative p-1", wizardConfig.isMirrored ? "bg-indigo-600" : "bg-gray-200")}
                                        >
                                            <div className={cn("w-4 h-4 bg-white rounded-full transition-all shadow-sm", wizardConfig.isMirrored ? "translate-x-6" : "translate-x-0")} />
                                        </button>
                                    </div>
                                    <div className="flex flex-col gap-2">
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none">Modo Compacto</label>
                                        <button
                                            onClick={() => setIsCompactView(!isCompactView)}
                                            className={cn("w-12 h-6 rounded-full transition-all relative p-1", isCompactView ? "bg-indigo-600" : "bg-gray-200")}
                                        >
                                            <div className={cn("w-4 h-4 bg-white rounded-full transition-all shadow-sm", isCompactView ? "translate-x-6" : "translate-x-0")} />
                                        </button>
                                    </div>
                                </div>
                                <div className="space-y-4 md:col-span-1">
                                    <button
                                        onClick={generateLayout}
                                        className="w-full bg-gray-900 text-white rounded-xl py-3 text-[10px] font-black uppercase tracking-widest hover:bg-black transition-all shadow-lg flex items-center justify-center gap-2"
                                    >
                                        <Grid className="h-4 w-4" />
                                        Regerar Planta
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Search Results List BEFORE the Map */}
                {searchQuery && (
                    <div className="px-4 mb-4 animate-fade-in">
                        <div className="bg-amber-50 border-2 border-amber-100 rounded-[2.5rem] p-6 shadow-sm">
                            <div className="text-[10px] font-black text-amber-800 uppercase tracking-widest mb-3 flex items-center gap-2">
                                <Box className="h-3 w-3" />
                                Resultados da Busca ({searchResults.length})
                            </div>
                            {searchResults.length > 0 ? (
                                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                                    {searchResults.map((res: any, i: number) => (
                                        <div
                                            key={i}
                                            onClick={() => {
                                                const targetSpot = sections.flatMap(s => s.spots).find(sp => sp.id === res.spotId);
                                                if (targetSpot) setSelectedSpot(targetSpot);
                                            }}
                                            className="flex items-center justify-between bg-white p-4 rounded-2xl border border-amber-100 hover:border-amber-300 hover:shadow-md transition-all cursor-pointer group"
                                        >
                                            <div>
                                                <div className="text-xs font-bold text-gray-900 group-hover:text-amber-600">{res.name}</div>
                                                <div className="text-[9px] font-black text-gray-400 uppercase tracking-tight">Seção: {res.sectionLabel}</div>
                                            </div>
                                            <div className="bg-amber-500 text-white text-[10px] font-black px-2.5 py-1 rounded-lg uppercase tracking-tight shadow-sm">
                                                {res.spotCode}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-xs font-bold text-amber-700">Nenhum produto encontrado com "{searchQuery}"</div>
                            )}
                        </div>
                    </div>
                )}

                {/* The Map Canvas */}
                <div className="relative overflow-hidden min-h-[550px]">

                    {/* Simple Dot Pattern Background */}
                    <div className="absolute inset-0 opacity-[0.02] pointer-events-none"
                        style={{ backgroundImage: 'radial-gradient(#000 1px, transparent 1px)', backgroundSize: '24px 24px' }}
                    />
                    {/* Dynamic Section Grid */}
                    <div className="relative h-full w-full p-4 md:p-6 overflow-x-auto scrollbar-hide">
                        <div className="flex items-stretch gap-1 min-w-max">
                            {sections.map((section, idx) => {
                                const nextSection = sections[idx + 1];
                                const isLastOfGroup = !nextSection;

                                return (
                                    <React.Fragment key={section.id}>
                                        {/* Add Section Before (Editor Mode) */}
                                        {isEditorMode && (
                                            <div className="flex flex-col items-center justify-center gap-2 group/add px-2 bg-gray-50/20">
                                                <button onClick={() => addSection(idx)} title="Add Showcase" className="p-2 opacity-0 group-hover/add:opacity-100 bg-indigo-600 text-white rounded-full transition-all shadow-lg hover:scale-110 z-20"><Box className="h-4 w-4" /></button>
                                            </div>
                                        )}
                                        
                                        {/* Carousel Logic: Only show active section if not in editor mode or if explicitly in carousel mode */}
                                        {(!isEditorMode && idx !== activeSectionIndex) ? null : (
                                        <div
                                            className={cn(
                                                "flex flex-col gap-3 items-center shrink-0 group/section relative self-stretch flex-1 min-w-[200px]",
                                                isLastOfGroup ? "mr-4 lg:mr-6" : "mr-0.5",
                                                !isEditorMode && "w-full animate-fade-in"
                                            )}
                                        >
                                            {/* Carousel Controls (Mobile/Visual) */}
                                            {!isEditorMode && sections.length > 1 && (
                                                <div className="absolute top-1/2 -translate-y-1/2 -left-4 -right-4 flex justify-between pointer-events-none z-40">
                                                    <button 
                                                        onClick={() => setActiveSectionIndex(prev => Math.max(0, prev - 1))}
                                                        disabled={activeSectionIndex === 0}
                                                        className="p-2 bg-white shadow-xl rounded-full text-gray-400 hover:text-indigo-600 pointer-events-auto disabled:opacity-0 transition-all"
                                                    >
                                                        <ChevronRight className="h-6 w-6 rotate-180" />
                                                    </button>
                                                    <button 
                                                        onClick={() => setActiveSectionIndex(prev => Math.min(sections.length - 1, prev + 1))}
                                                        disabled={activeSectionIndex === sections.length - 1}
                                                        className="p-2 bg-white shadow-xl rounded-full text-gray-400 hover:text-indigo-600 pointer-events-auto disabled:opacity-0 transition-all"
                                                    >
                                                        <ChevronRight className="h-6 w-6" />
                                                    </button>
                                                </div>
                                            )}
                                            {/* Section Context Menu (Editor) */}
                                            {isEditorMode && (
                                                <div className="absolute -top-12 flex gap-2 opacity-0 group-hover/section:opacity-100 transition-all z-20 bg-white shadow-2xl p-2 rounded-xl border border-gray-100 items-center">
                                                    <div className="flex flex-col gap-1 pr-2 border-r border-gray-100">
                                                        <span className="text-[7px] font-black text-gray-400 uppercase">Grid</span>
                                                        <div className="flex gap-1">
                                                            <input 
                                                                type="number" 
                                                                value={section.rows || 1} 
                                                                onChange={e => setSections(prev => prev.map(s => s.id === section.id ? { ...s, rows: parseInt(e.target.value) } : s))}
                                                                className="w-8 h-6 bg-gray-50 border border-gray-200 rounded text-[10px] text-center"
                                                            />
                                                            <input 
                                                                type="number" 
                                                                value={section.cols || 1} 
                                                                onChange={e => setSections(prev => prev.map(s => s.id === section.id ? { ...s, cols: parseInt(e.target.value) } : s))}
                                                                className="w-8 h-6 bg-gray-50 border border-gray-200 rounded text-[10px] text-center"
                                                            />
                                                        </div>
                                                    </div>
                                                    <button 
                                                        onClick={() => setSections(prev => prev.map(s => s.id === section.id ? { ...s, orientation: s.orientation === "vertical" ? "horizontal" : "vertical" } : s))}
                                                        className="p-1.5 hover:bg-indigo-50 text-indigo-600 rounded-lg transition-colors"
                                                        title="Toggle Orientation"
                                                    >
                                                        <Layout className={cn("h-4 w-4", section.orientation === "vertical" && "rotate-90")} />
                                                    </button>
                                                    <div className="h-6 w-[1px] bg-gray-100" />
                                                    <button onClick={() => moveSection(idx, "left")} className="p-1.5 hover:bg-gray-100 text-gray-400 font-black text-[9px] rounded-md transition-colors">←</button>
                                                    <button onClick={() => removeSection(section.id)} className="p-1.5 hover:bg-rose-50 text-rose-500 font-black text-[9px] rounded-md transition-colors">DEL</button>
                                                    <button onClick={() => moveSection(idx, "right")} className="p-1.5 hover:bg-gray-100 text-gray-400 font-black text-[9px] rounded-md transition-colors">→</button>
                                                </div>
                                            )}

                                            {/* Section Label */}
                                            <div className="text-[10px] font-black uppercase tracking-widest min-h-[16px] flex items-center justify-center transition-all text-gray-500 mb-2">
                                                <span
                                                    contentEditable={isEditorMode}
                                                    suppressContentEditableWarning
                                                    onBlur={(e) => {
                                                        const val = e.currentTarget.innerText;
                                                        setSections(prev => prev.map(s => s.id === section.id ? { ...s, label: val } : s));
                                                    }}
                                                    className={cn(isEditorMode && "cursor-text hover:text-indigo-600 px-1")}
                                                >
                                                    {section.label}
                                                </span>
                                            </div>

                                            <div className={cn(
                                                "flex p-4 rounded-2xl transition-all relative min-h-[350px] w-full items-center bg-white border border-gray-100 shadow-md",
                                                section.orientation === "vertical" ? "flex-col overflow-y-auto" : "flex-row overflow-x-auto",
                                                isCompactView ? "gap-1" : "gap-4"
                                            )}
                                            style={{
                                                display: section.rows && section.cols ? "grid" : "flex",
                                                gridTemplateColumns: section.orientation === "vertical" 
                                                    ? `repeat(${section.cols || 1}, 1fr)` 
                                                    : `repeat(${section.cols || section.spots.length}, 1fr)`,
                                                gridTemplateRows: section.orientation === "vertical"
                                                    ? `repeat(${section.rows || section.spots.length}, 1fr)`
                                                    : `repeat(${section.rows || 1}, 1fr)`
                                            }}
                                            >
                                                {section.spots.map((spot) => (
                                                    <div key={spot.id} className="relative group/spot">
                                                        <motion.button
                                                            whileHover={{ scale: 1.02, y: -2 }}
                                                            whileTap={{ scale: 0.98 }}
                                                            onClick={() => setSelectedSpot(spot)}
                                                            className={cn(
                                                                "relative rounded-xl border-2 transition-all flex flex-col items-center justify-center gap-1.5",
                                                                isCompactView ? "h-16 w-16" : (spot.span === "long" ? "h-56 w-28 lg:w-36" : "h-20 w-28 lg:w-36"),
                                                                (searchQuery && spot.products && spot.products.some((p: any) => p.name.toLowerCase().includes(searchQuery.toLowerCase()))) || (searchQuery && spot.code.toLowerCase().includes(searchQuery.toLowerCase()))
                                                                    ? "bg-amber-500 border-amber-500 text-white shadow-xl z-10 animate-pulse"
                                                                    : selectedSpot?.id === spot.id
                                                                        ? "bg-indigo-600 border-indigo-600 text-white shadow-xl z-10"
                                                                        : spot.products && spot.products.length > 0
                                                                            ? "bg-indigo-50 border-indigo-200 text-indigo-700"
                                                                            : "bg-white border-gray-100 text-gray-300 hover:border-indigo-100"
                                                            )}
                                                        >
                                                            <div
                                                                className={cn("font-black uppercase tracking-tighter", isCompactView ? "text-[8px]" : "text-[10px]")}
                                                                contentEditable={isEditorMode}
                                                                suppressContentEditableWarning
                                                                onBlur={(e) => {
                                                                    const val = e.currentTarget.innerText;
                                                                    setSections(prev => prev.map(s => {
                                                                        if (s.id !== section.id) return s;
                                                                        return { ...s, spots: s.spots.map(sp => sp.id === spot.id ? { ...sp, code: val } : sp) };
                                                                    }));
                                                                }}
                                                            >
                                                                {spot.code}
                                                            </div>
                                                            {spot.products.length > 0 && <Box className={cn(isCompactView ? "h-3 w-3" : "h-4 w-4", selectedSpot?.id === spot.id ? "text-white" : "text-indigo-600")} />}
                                                            {spot.products.length > 1 && (
                                                                <span className="absolute -top-1 -right-1 bg-indigo-600 text-white text-[8px] font-black w-4 h-4 rounded-full flex items-center justify-center border border-white shadow-sm">
                                                                    {spot.products.length}
                                                                </span>
                                                            )}
                                                        </motion.button>

                                                        {/* Micro-Interaction: Smart AI Add on Slot */}
                                                        <div className="absolute top-0 -right-2 flex flex-col gap-1 opacity-0 group-hover/spot:opacity-100 transition-all z-20">
                                                            <button
                                                                onClick={(e) => { e.stopPropagation(); setSelectedSpot(spot); setAssistantMode("voice"); setIsAssistantOpen(true); }}
                                                                className="p-1.5 bg-white border border-indigo-100 text-indigo-600 rounded-lg shadow-xl hover:scale-110 active:scale-95"
                                                            >
                                                                <Mic className="h-3 w-3" />
                                                            </button>
                                                            <button
                                                                onClick={(e) => { e.stopPropagation(); setSelectedSpot(spot); setAssistantMode("camera"); setIsAssistantOpen(true); }}
                                                                className="p-1.5 bg-gray-900 border border-gray-800 text-white rounded-lg shadow-xl hover:scale-110 active:scale-95"
                                                            >
                                                                <Camera className="h-3 w-3" />
                                                            </button>
                                                        </div>
                                                    </div>
                                                ))}

                                                {isEditorMode && section.type === "Showcase" && (
                                                    <button
                                                        onClick={() => addSpot(section.id)}
                                                        className="w-full py-3 border-2 border-dashed border-gray-100 rounded-lg flex items-center justify-center text-gray-300 hover:text-indigo-600 hover:border-indigo-100 hover:bg-indigo-50/10 transition-all group"
                                                    >
                                                        <Plus className="h-4 w-4 group-hover:scale-125 transition-transform" />
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                        )}
                                    </React.Fragment>
                                );
                            })}

                            {/* Final Add Section (Editor Mode) */}
                            {isEditorMode && (
                                <div className="flex flex-col items-center justify-center gap-2 group/add px-6 py-8">
                                    <button onClick={() => addSection(sections.length)} title="Add Showcase at end" className="p-3 bg-indigo-600 text-white rounded-full shadow-lg hover:scale-110 transition-all"><Box className="h-5 w-5" /></button>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Floor Legend - Centered & High Contrast */}
                    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-10 bg-white/90 backdrop-blur rounded-2xl px-8 py-4 shadow-xl border border-gray-100 z-30">
                        <div className="flex items-center gap-3">
                            <div className="w-3.5 h-3.5 rounded-full bg-indigo-600 shadow-lg shadow-indigo-100" />
                            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Expositor / Ocupado</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="w-3.5 h-3.5 rounded-full bg-white border-2 border-gray-100" />
                            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Disponível</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Slide-over Overlays for Details and List */}
            <AnimatePresence>
                {/* 1. Inventory Summary List Slide-over */}
                {isListOpen && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            onClick={() => setIsListOpen(false)}
                            className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm z-[100]"
                        />
                        <motion.div
                            initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
                            className="fixed top-0 right-0 h-full w-full max-w-md bg-white z-[101] shadow-2xl p-10 flex flex-col"
                        >
                            <div className="flex items-center justify-between mb-8">
                                <h3 className="text-xl font-black text-gray-900 uppercase tracking-tighter">Ocupação do Showroom</h3>
                                <button onClick={() => setIsListOpen(false)} className="p-2 text-gray-400 hover:text-gray-900"><Plus className="h-6 w-6 rotate-45" /></button>
                            </div>

                            <div className="flex-1 overflow-y-auto pr-2 space-y-4">
                                {spotsWithProducts.map(spot => (
                                    <button
                                        key={spot.id}
                                        onClick={() => { setSelectedSpot(spot); setIsListOpen(false); }}
                                        className="w-full flex items-center gap-4 p-5 bg-gray-50 border-2 border-transparent rounded-[2rem] hover:border-indigo-100 hover:bg-white transition-all text-left group"
                                    >
                                        <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-xs font-black text-indigo-600 shadow-sm group-hover:scale-110 transition-transform">
                                            {spot.code}
                                        </div>
                                        <div className="flex-1 overflow-hidden">
                                            <div className="text-sm font-black text-gray-900 truncate">{spot.products[0]?.name}</div>
                                            <div className="text-[10px] font-bold text-indigo-400 uppercase">Localizado no Showroom</div>
                                        </div>
                                        <ChevronRight className="h-5 w-5 text-gray-300" />
                                    </button>
                                ))}
                            </div>
                        </motion.div>
                    </>
                )}

                {/* 2. Spot Detail slide-over */}
                {selectedSpot && !isAssistantOpen && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            onClick={() => setSelectedSpot(null)}
                            className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm z-[100]"
                        />
                        <motion.div
                            initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
                            className="fixed top-0 right-0 h-full w-full max-w-md bg-white z-[101] shadow-2xl p-10 flex flex-col"
                        >
                            <div className="flex items-center justify-between mb-10">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-100">
                                        <Warehouse className="h-6 w-6 text-white" />
                                    </div>
                                    <div>
                                        <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">Localização no Mapa</div>
                                        <div className="text-3xl font-black text-gray-900 uppercase">{selectedSpot.code}</div>
                                    </div>
                                </div>
                                <button onClick={() => setSelectedSpot(null)} className="p-2 text-gray-400 hover:text-gray-900 transition-transform hover:rotate-90"><Plus className="h-8 w-8 rotate-45" /></button>
                            </div>

                            <div className="flex-1 space-y-8 overflow-y-auto pr-2">
                                <div className="bg-gray-50 rounded-[2.5rem] p-8 border-2 border-gray-100 relative overflow-hidden">
                                    <div className="absolute top-0 right-0 p-4 opacity-5">
                                        <Sparkles className="h-24 w-24 text-indigo-600" />
                                    </div>
                                    <div className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
                                        <Box className="h-3 w-3" />
                                        Estoque no Slot
                                    </div>
                                    <div className="space-y-4">
                                        {selectedSpot.products.map(p => (
                                            <div key={p.id} className="flex items-center gap-4 p-4 bg-white rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-all group">
                                                <div className="w-14 h-14 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600 font-black text-xs shrink-0">
                                                    {(p as any).imageUrl ? <img src={(p as any).imageUrl} className="w-full h-full object-cover rounded-xl" /> : <Box className="h-6 w-6" />}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="text-xs font-black text-gray-900 truncate">{p.name}</div>
                                                    <div className="text-[9px] font-bold text-gray-400 uppercase">Qtd: {p.quantity}</div>
                                                </div>
                                                <button className="p-2 text-gray-300 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all opacity-0 group-hover:opacity-100">
                                                    <Plus className="h-4 w-4 rotate-45" />
                                                </button>
                                            </div>
                                        ))}
                                        {selectedSpot.products.length === 0 && (
                                            <button className="w-full py-16 border-2 border-dashed border-gray-200 rounded-[2rem] flex flex-col items-center justify-center gap-3 group hover:border-indigo-300 hover:bg-indigo-50/10 transition-all">
                                                <div className="p-4 bg-gray-50 rounded-2xl group-hover:bg-indigo-100 transition-colors">
                                                    <Plus className="h-6 w-6 text-gray-300 group-hover:text-indigo-600" />
                                                </div>
                                                <div className="text-center">
                                                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">Slot Vazio</span>
                                                    <span className="text-[8px] font-bold text-gray-300 uppercase">Clique para Adicionar</span>
                                                </div>
                                            </button>
                                        )}
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <button 
                                        onClick={() => { setAssistantMode("voice"); setIsAssistantOpen(true); }}
                                        className="p-6 bg-gray-900 text-white rounded-[2rem] text-[10px] font-black uppercase tracking-widest shadow-xl hover:bg-black transition-all flex flex-col items-center gap-3"
                                    >
                                        <Mic className="h-5 w-5 text-indigo-400" />
                                        Comando de Voz
                                    </button>
                                    <button 
                                        onClick={() => { setAssistantMode("camera"); setIsAssistantOpen(true); }}
                                        className="p-6 bg-white border-2 border-gray-100 text-gray-900 rounded-[2rem] text-[10px] font-black uppercase tracking-widest hover:border-indigo-100 transition-all flex flex-col items-center gap-3"
                                    >
                                        <Camera className="h-5 w-5 text-indigo-600" />
                                        Capturar Foto
                                    </button>
                                </div>
                                
                                <div className="p-8 bg-indigo-50 rounded-[2.5rem] border-2 border-indigo-100">
                                    <h4 className="text-[10px] font-black text-indigo-700 uppercase tracking-widest mb-4">Adicionar do Catálogo</h4>
                                    <div className="space-y-3">
                                        <div className="relative">
                                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
                                            <input 
                                                type="text" 
                                                placeholder="Buscar produto..."
                                                value={spotSearchQuery}
                                                onChange={e => setSpotSearchQuery(e.target.value)}
                                                className="w-full pl-10 pr-4 py-3 bg-white border border-gray-100 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-indigo-200 transition-all"
                                            />
                                        </div>
                                        {spotSearchQuery && (
                                            <div className="max-h-48 overflow-y-auto space-y-2 pr-2 scrollbar-hide">
                                                {activeCatalogProducts.filter(p => p.name.toLowerCase().includes(spotSearchQuery.toLowerCase())).map(p => (
                                                    <button 
                                                        key={p.id}
                                                        onClick={() => {
                                                            confirmAIDetection({
                                                                id: p.id,
                                                                name: p.name,
                                                                category: p.category,
                                                                suggestedSpot: selectedSpot.code
                                                            });
                                                            setSpotSearchQuery("");
                                                        }}
                                                        className="w-full flex items-center gap-3 p-3 bg-white rounded-xl hover:bg-indigo-600 group transition-all text-left"
                                                    >
                                                        <div className="w-8 h-8 bg-gray-50 rounded-lg flex items-center justify-center shrink-0 group-hover:bg-indigo-500">
                                                            <Box className="h-4 w-4 text-gray-400 group-hover:text-white" />
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <div className="text-[10px] font-black text-gray-900 group-hover:text-white truncate">{p.name}</div>
                                                            <div className="text-[8px] font-bold text-gray-400 group-hover:text-indigo-200 uppercase">{p.category}</div>
                                                        </div>
                                                        <Plus className="h-4 w-4 text-gray-300 group-hover:text-white" />
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                    
                                    <div className="h-[1px] bg-indigo-100 my-6" />
                                    
                                    <h4 className="text-[10px] font-black text-indigo-700 uppercase tracking-widest mb-4">Ações de Posição</h4>
                                    <div className="grid grid-cols-1 gap-2">
                                        <button className="flex items-center justify-between p-4 bg-white rounded-xl text-xs font-bold text-gray-700 hover:text-indigo-600 transition-all">
                                            Transferir para outro setor
                                            <ChevronRight className="h-4 w-4" />
                                        </button>
                                        <button className="flex items-center justify-between p-4 bg-white rounded-xl text-xs font-bold text-gray-700 hover:text-indigo-600 transition-all">
                                            Imprimir etiqueta de posição
                                            <ChevronRight className="h-4 w-4" />
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-auto pt-6 flex flex-col items-center gap-2">
                                <div className="h-1 w-20 bg-gray-100 rounded-full mb-2" />
                                <p className="text-[9px] font-black text-gray-300 uppercase tracking-[0.3em]">Nexus WMS Engine v2.5</p>
                            </div>
                        </motion.div>
                    </>
                )}

                {/* 3. AI Inventory Assistant Slide-over */}
                {isAssistantOpen && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            onClick={() => { setIsAssistantOpen(false); setAssistantMode(null); }}
                            className="fixed inset-0 bg-indigo-950/20 backdrop-blur-md z-[200]"
                        />
                        <motion.div
                            initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
                            className="fixed bottom-0 inset-x-0 h-[70vh] bg-white z-[201] rounded-t-[3rem] shadow-2xl p-10 flex flex-col border-t border-indigo-50 max-w-4xl mx-auto overflow-hidden"
                        >
                            <div className="flex items-center justify-between mb-8">
                                <div className="flex items-center gap-4">
                                    <div className="p-3 bg-indigo-600 rounded-2xl">
                                        <Sparkles className="h-6 w-6 text-white" />
                                    </div>
                                    <div>
                                        <h3 className="text-2xl font-black text-gray-900 uppercase tracking-tighter">Assistente de Balanço IA</h3>
                                        <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Multi-Modal Stock Update</p>
                                    </div>
                                </div>
                                <button onClick={() => { setIsAssistantOpen(false); setAssistantMode(null); }} className="p-2 text-gray-400 hover:text-gray-900"><Plus className="h-8 w-8 rotate-45" /></button>
                            </div>

                            <div className="flex-1 flex flex-col items-center justify-center gap-10 overflow-hidden">
                                {detectedItems.length > 0 ? (
                                    <div className="w-full h-full flex flex-col">
                                        <div className="text-center mb-8">
                                            <h4 className="text-xl font-black text-gray-900 uppercase tracking-tighter">Resultados da IA</h4>
                                            <p className="text-xs text-gray-400 font-bold">Confirme os itens detectados pelo {assistantMode === 'voice' ? 'áudio' : 'vison'}</p>
                                        </div>
                                        <div className="flex-1 overflow-y-auto px-4 space-y-4 pb-10">
                                            {detectedItems.map((item) => (
                                                <motion.div
                                                    key={item.id}
                                                    initial={{ x: 20, opacity: 0 }}
                                                    animate={{ x: 0, opacity: 1 }}
                                                    className="bg-white border-2 border-gray-50 rounded-[2rem] p-6 flex items-center gap-6 shadow-sm hover:shadow-xl hover:border-indigo-100 transition-all group"
                                                >
                                                    <div className="w-24 h-24 rounded-2xl bg-gray-100 overflow-hidden shrink-0 shadow-inner">
                                                        <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover group-hover:scale-110 transition-all duration-500" />
                                                    </div>
                                                    <div className="flex-1">
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <span className="text-[10px] font-black text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-lg uppercase tracking-widest leading-none">{(item.confidence * 100).toFixed(0)}% Match</span>
                                                            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{item.category}</span>
                                                        </div>
                                                        <h5 className="text-sm font-black text-gray-900 mb-1">{item.name}</h5>
                                                        <div className="text-[10px] font-bold text-gray-400 uppercase">Sugestão: <span className="text-indigo-600">{item.suggestedSpot}</span></div>
                                                    </div>
                                                    <div className="flex flex-col gap-2">
                                                        <button
                                                            onClick={() => confirmAIDetection(item)}
                                                            className="p-3 bg-indigo-600 text-white rounded-xl shadow-lg hover:bg-indigo-700 transition-all active:scale-95"
                                                        >
                                                            <Zap className="h-4 w-4" />
                                                        </button>
                                                        <button
                                                            onClick={() => setDetectedItems(prev => prev.filter(i => i.id !== item.id))}
                                                            className="p-3 bg-gray-50 text-gray-400 rounded-xl hover:bg-rose-50 hover:text-rose-500 transition-all active:scale-95"
                                                        >
                                                            <Plus className="h-4 w-4 rotate-45" />
                                                        </button>
                                                    </div>
                                                </motion.div>
                                            ))}
                                        </div>
                                    </div>
                                ) : assistantMode === "voice" ? (
                                    <div className="flex flex-col items-center gap-6">
                                        <div className={cn(
                                            "w-32 h-32 rounded-full flex items-center justify-center transition-all duration-500",
                                            isProcessingAI ? "bg-indigo-100 scale-125" : "bg-indigo-600 shadow-2xl shadow-indigo-200"
                                        )}>
                                            {isProcessingAI ? <Loader2 className="h-10 w-10 text-indigo-600 animate-spin" /> : <Mic className="h-12 w-12 text-white" />}
                                        </div>
                                        <div className="text-center">
                                            <h4 className="text-lg font-black text-gray-900 uppercase">{isProcessingAI ? "Processando Áudio..." : "Estou ouvindo..."}</h4>
                                            <p className="text-xs text-gray-400 font-bold max-w-xs mt-2 italic">"{isProcessingAI ? '...' : 'Adicione duas Poltronas Bolonha no mostruário ' + (selectedSpot?.code || 'A1') + '"'}</p>
                                        </div>
                                        {!isProcessingAI && (
                                            <button onClick={() => processMultiModalInput("audio")} className="px-10 py-5 bg-gray-900 text-white rounded-[2rem] font-black uppercase tracking-widest text-[10px] hover:scale-105 transition-all">Parar e Processar</button>
                                        )}
                                    </div>
                                ) : assistantMode === "camera" && (
                                    <div className="flex flex-col items-center gap-6 w-full max-w-sm">
                                        <div className="w-full aspect-[4/3] bg-gray-100 rounded-[2rem] border-2 border-dashed border-gray-200 flex flex-col items-center justify-center gap-4 relative overflow-hidden group">
                                            {isProcessingAI ? (
                                                <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex flex-col items-center justify-center z-10">
                                                    <Loader2 className="h-10 w-10 text-indigo-600 animate-spin mb-4" />
                                                    <span className="text-[10px] font-black uppercase tracking-widest text-indigo-600">Vision AI Analisando...</span>
                                                </div>
                                            ) : (
                                                <>
                                                    <Camera className="h-12 w-12 text-gray-300 group-hover:text-indigo-400 transition-colors" />
                                                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Toque para capturar fotos do {(selectedSpot?.code || 'local')}</span>
                                                </>
                                            )}
                                        </div>
                                        <button onClick={() => processMultiModalInput("vision")} className="w-full py-5 bg-indigo-600 text-white rounded-[2rem] font-black uppercase tracking-widest text-[10px] shadow-xl hover:bg-indigo-700 transition-all">Analisar Foto</button>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            <style jsx>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .writing-vertical {
          writing-mode: vertical-rl;
          text-orientation: mixed;
          transform: rotate(180deg);
        }
      `}</style>
        </div>
    );
}
