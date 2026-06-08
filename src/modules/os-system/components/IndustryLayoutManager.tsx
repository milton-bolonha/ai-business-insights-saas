"use client";

import React, { useState } from "react";
import {
    Map as MapIcon, MapPin, Settings, Maximize2, Minimize2,
    GripHorizontal, GripVertical, Plus, ChevronLeft, ChevronRight,
    X, Edit2, BookOpen, AlertTriangle, CheckCircle2, Box, PenTool, Save, Trash2
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { Equipment } from "../types/Equipment";

interface Spot {
    id: string;
    code: string;
    row: number;
    col: number;
    status: "available" | "occupied" | "maintenance" | "blocked";
    equipment: Equipment | null;
}

interface Sector {
    id: string;
    name: string;
    type: "Mesa" | "Impressoras" | "Corte" | "Geral";
    rows: number;
    cols: number;
    orientation: "horizontal" | "vertical";
    spots: Spot[];
}

const STATUS_MAP = {
    available: { bg: 'bg-slate-50', border: 'border-slate-200', text: 'text-slate-400', label: 'Vazio' },
    occupied: { bg: 'bg-emerald-50', border: 'border-emerald-300', text: 'text-emerald-600', label: 'Operacional' },
    maintenance: { bg: 'bg-amber-50', border: 'border-amber-400', text: 'text-amber-700', label: 'Em Manutenção' },
    blocked: { bg: 'bg-rose-50', border: 'border-rose-300', text: 'text-rose-600', label: 'Bloqueado' },
};

interface IndustryLayoutManagerProps {
    isOpen: boolean;
    onClose: () => void;
}

export const IndustryLayoutManager: React.FC<IndustryLayoutManagerProps> = ({ isOpen, onClose }) => {
    const [isCompactView, setIsCompactView] = useState(false);
    const [selectedSpot, setSelectedSpot] = useState<Spot | null>(null);
    const [activeSectorId, setActiveSectionId] = useState<string>("Corte & Costura");
    
    // Mock Data para o Grid de Indústria
    const [sectors, setSectors] = useState<Sector[]>([
        {
            id: "Corte & Costura",
            name: "Corte & Costura",
            type: "Corte",
            rows: 3,
            cols: 4,
            orientation: "horizontal",
            spots: Array.from({ length: 12 }).map((_, i) => {
                const r = Math.floor(i / 4) + 1;
                const c = (i % 4) + 1;
                const eq: Equipment | null = i === 1 ? {
                    id: "EQ003", name: "Plotter E-cut EK-2100", type: "Plotter de Recorte", status: "online",
                    wikiContent: "<h2>Manual de Operação da Plotter</h2><p>Lembre-se de sempre alinhar a lâmina no eixo zero antes de começar.</p>"
                } : null;
                return {
                    id: `Corte-${r}-${c}`,
                    code: `C-${r}-${c}`,
                    row: r, col: c,
                    status: eq ? 'occupied' : 'available',
                    equipment: eq
                };
            })
        },
        {
            id: "Estamparia",
            name: "Estamparia DTF",
            type: "Impressoras",
            rows: 2,
            cols: 5,
            orientation: "horizontal",
            spots: Array.from({ length: 10 }).map((_, i) => {
                const r = Math.floor(i / 5) + 1;
                const c = (i % 5) + 1;
                const eq: Equipment | null = i === 0 ? {
                    id: "EQ001", name: "MyPrinter DTF A3", type: "Impressora DTF", status: "online",
                    wikiContent: "<h2>Limpeza da Cabeça</h2><p>Faça a limpeza ao final do expediente para não ressecar a tinta branca.</p>"
                } : i === 4 ? {
                    id: "EQ002", name: "Epson F6370", type: "Sublimação", status: "maintenance",
                    wikiContent: "Aguardando troca do damper."
                } : null;
                
                return {
                    id: `Estamp-${r}-${c}`,
                    code: `E-${r}-${c}`,
                    row: r, col: c,
                    status: eq ? (eq.status === 'maintenance' ? 'maintenance' : 'occupied') : 'available',
                    equipment: eq
                };
            })
        }
    ]);

    // Wiki State
    const [isWikiOpen, setIsWikiOpen] = useState(false);
    const [editingWiki, setEditingWiki] = useState(false);
    const [wikiText, setWikiText] = useState("");

    // Layout Editor State
    const [isEditorOpen, setIsEditorOpen] = useState(false);
    const [editingSectorId, setEditingSectorId] = useState<string | null>(null);
    const [newSector, setNewSector] = useState<{
        name: string;
        rows: number | string;
        cols: number | string;
        orientation: "horizontal" | "vertical";
        type: "Mesa" | "Impressoras" | "Corte" | "Geral";
    }>({ 
        name: '', 
        rows: 3, 
        cols: 4, 
        orientation: 'horizontal', 
        type: 'Geral'
    });

    if (!isOpen) return null;

    const activeSector = sectors.find(s => s.id === activeSectorId) || sectors[0];

    const handleOpenWiki = (eq: Equipment) => {
        setWikiText(eq.wikiContent || "");
        setIsWikiOpen(true);
        setEditingWiki(false);
    };

    const handleSaveWiki = () => {
        if (!selectedSpot || !selectedSpot.equipment) return;
        
        const updatedSectors = sectors.map(sec => ({
            ...sec,
            spots: sec.spots.map(spot => {
                if (spot.id === selectedSpot.id && spot.equipment) {
                    return {
                        ...spot,
                        equipment: { ...spot.equipment, wikiContent: wikiText }
                    };
                }
                return spot;
            })
        }));
        setSectors(updatedSectors);
        setEditingWiki(false);
    };

    return (
        <div className="fixed inset-0 bg-slate-100 z-[100] flex flex-col animate-fade-in">
            {/* Header da Planta Baixa */}
            <div className="bg-white border-b border-slate-200 px-6 py-4 flex justify-between items-center shadow-sm z-10 shrink-0">
                <div className="flex items-center gap-4">
                    <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
                        <MapIcon size={24} />
                    </div>
                    <div>
                        <h2 className="text-xl font-black text-slate-800 leading-tight">Digital Twin: Chão de Fábrica</h2>
                        <p className="text-sm font-bold text-slate-500 tracking-wide">Layout, Equipamentos e Wiki Integrada</p>
                    </div>
                </div>
                <button onClick={onClose} className="p-2 bg-slate-100 rounded-full hover:bg-slate-200 text-slate-500 transition-colors">
                    <X size={24} />
                </button>
            </div>

            <div className="flex-1 flex flex-col p-4 sm:p-6 overflow-hidden relative">
                {/* Sector Navigation */}
                <div className="flex justify-between items-end mb-4 shrink-0">
                    <div className="flex gap-2 overflow-x-auto pb-1 hide-scrollbar">
                        {sectors.map((sec) => (
                            <button
                                key={sec.id}
                                onClick={() => { setActiveSectionId(sec.id); setSelectedSpot(null); setIsWikiOpen(false); }}
                                className={cn(
                                    "px-5 py-2 rounded-xl font-bold text-sm transition-all flex items-center gap-2 border shrink-0",
                                    activeSectorId === sec.id
                                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-md scale-105'
                                        : 'bg-white text-slate-500 hover:bg-slate-50 border-slate-200 shadow-sm'
                                )}
                            >
                                {sec.orientation === 'vertical' ? <GripVertical size={14} /> : <GripHorizontal size={14} />}
                                {sec.name}
                            </button>
                        ))}
                        <button
                            onClick={() => {
                                setIsEditorOpen(true);
                                setEditingSectorId(null);
                                setNewSector({ name: '', rows: 3, cols: 4, orientation: 'horizontal', type: 'Geral' });
                            }}
                            className="px-4 py-2 rounded-xl font-bold text-sm bg-indigo-50 text-indigo-600 border border-indigo-200 hover:bg-indigo-100 transition-all flex items-center gap-1.5 shrink-0"
                        >
                            <Plus size={16} /> Novo Setor
                        </button>
                    </div>
                    
                    <div className="flex gap-2">
                        <button
                            onClick={() => {
                                if (activeSector) {
                                    setEditingSectorId(activeSector.id);
                                    setNewSector({ name: activeSector.id, rows: activeSector.rows, cols: activeSector.cols, orientation: activeSector.orientation, type: activeSector.type });
                                } else {
                                    setEditingSectorId(null);
                                }
                                setIsEditorOpen(true);
                            }}
                            className="p-2 rounded-xl border border-slate-200 bg-white text-slate-500 hover:text-indigo-600 shadow-sm transition-all"
                        >
                            <Settings size={18} />
                        </button>
                        <button onClick={() => setIsCompactView(!isCompactView)} className="p-2 bg-white border border-slate-200 text-slate-500 hover:text-indigo-600 rounded-xl shadow-sm transition-all">
                            {isCompactView ? <Maximize2 size={18} /> : <Minimize2 size={18} />}
                        </button>
                    </div>
                </div>

                {/* The Canvas Grid */}
                <div className="flex-1 min-h-0 bg-white border border-slate-200 rounded-2xl shadow-sm flex flex-col transition-all duration-300 w-full overflow-hidden relative">
                    <div className={cn("overflow-auto custom-scrollbar p-6 h-full flex items-center justify-center bg-slate-50/50 relative")}>
                        {/* Grade */}
                        <div
                            className="grid gap-4"
                            style={{
                                gridTemplateColumns: `repeat(${activeSector.cols}, minmax(100px, 1fr))`,
                                gridTemplateRows: `repeat(${activeSector.rows}, minmax(100px, auto))`
                            }}
                        >
                            {activeSector.spots.map(spot => {
                                const isSelected = selectedSpot?.id === spot.id;
                                const styles = STATUS_MAP[spot.status] || STATUS_MAP.available;
                                
                                return (
                                    <button
                                        key={spot.id}
                                        onClick={() => { setSelectedSpot(spot); setIsWikiOpen(false); }}
                                        className={cn(
                                            "relative flex flex-col items-center justify-center transition-all duration-200 rounded-2xl border-2 gap-2 p-3 min-h-[100px] shadow-sm",
                                            styles.bg, styles.border, styles.text,
                                            isSelected ? 'ring-4 ring-indigo-500/30 z-10 !border-indigo-500 scale-105' : 'hover:brightness-95'
                                        )}
                                    >
                                        <span className="font-black opacity-40 text-sm absolute top-2 left-3">
                                            {spot.code}
                                        </span>
                                        
                                        {spot.equipment ? (
                                            <>
                                                {spot.status === 'maintenance' ? <AlertTriangle size={32} strokeWidth={2} /> : <PenTool size={32} strokeWidth={2} />}
                                                <span className="font-bold text-xs text-center leading-tight mt-1 px-1 line-clamp-2">
                                                    {spot.equipment.name}
                                                </span>
                                                {spot.equipment.wikiContent && (
                                                    <span className="absolute -top-2 -right-2 bg-indigo-500 text-white rounded-full p-1.5 shadow-md">
                                                        <BookOpen size={12} />
                                                    </span>
                                                )}
                                            </>
                                        ) : (
                                            <span className="text-xs font-bold opacity-30 tracking-widest uppercase">Espaço</span>
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                    
                    {/* Legend */}
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-white/90 backdrop-blur border border-slate-200 px-6 py-2.5 rounded-full flex gap-6 text-[10px] font-bold shadow-sm">
                        {Object.entries(STATUS_MAP).map(([key, val]) => (
                            <div key={key} className="flex items-center gap-2">
                                <span className={cn("w-3 h-3 rounded-full border shadow-sm", val.bg, val.border)} />
                                <span className="text-slate-600 uppercase tracking-wider">{val.label}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* SIDE DRAWER: Detalhes do Spot/Equipamento */}
            <AnimatePresence>
                {selectedSpot && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            onClick={() => { setSelectedSpot(null); setIsWikiOpen(false); }}
                            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[110]"
                        />
                        <motion.div
                            initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
                            transition={{ type: "spring", damping: 25, stiffness: 200 }}
                            className="fixed top-0 right-0 bottom-0 w-full sm:w-[500px] bg-slate-50 border-l border-slate-200 z-[111] flex flex-col shadow-2xl overflow-hidden"
                        >
                            {/* Drawer Header */}
                            <div className="p-6 bg-white border-b border-slate-200 flex justify-between items-start shadow-sm shrink-0">
                                <div className="flex gap-4 items-center">
                                    <div className={cn(
                                        "w-16 h-16 rounded-2xl border-2 flex items-center justify-center shadow-inner",
                                        STATUS_MAP[selectedSpot.status]?.bg,
                                        STATUS_MAP[selectedSpot.status]?.border,
                                        STATUS_MAP[selectedSpot.status]?.text
                                    )}>
                                        <MapPin size={28} />
                                    </div>
                                    <div>
                                        <h3 className="text-2xl font-black text-slate-800">{selectedSpot.code}</h3>
                                        <p className="text-slate-500 text-xs font-bold uppercase tracking-wider mt-1">{activeSector.name}</p>
                                    </div>
                                </div>
                                <button onClick={() => setSelectedSpot(null)} className="p-2 bg-slate-100 rounded-full hover:bg-slate-200 transition-colors text-slate-500"><X size={20} /></button>
                            </div>

                            <div className="flex-1 overflow-y-auto p-6 space-y-6">
                                {selectedSpot.equipment ? (
                                    <>
                                        {/* Detalhes do Equipamento */}
                                        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm relative overflow-hidden">
                                            <div className="absolute top-0 left-0 w-1 h-full bg-indigo-500" />
                                            <div className="flex justify-between items-start mb-4">
                                                <div>
                                                    <h4 className="font-black text-lg text-slate-800">{selectedSpot.equipment.name}</h4>
                                                    <p className="text-sm font-bold text-slate-400">{selectedSpot.equipment.type}</p>
                                                </div>
                                                <span className={cn(
                                                    "px-3 py-1 text-[10px] font-black uppercase tracking-wider rounded-lg border",
                                                    selectedSpot.equipment.status === 'online' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 
                                                    selectedSpot.equipment.status === 'maintenance' ? 'bg-amber-50 text-amber-700 border-amber-200' : 
                                                    'bg-slate-100 text-slate-500 border-slate-200'
                                                )}>
                                                    {selectedSpot.equipment.status}
                                                </span>
                                            </div>
                                            
                                            {/* Responsável pelo Equipamento */}
                                            <div className="mt-4 flex items-center justify-between bg-slate-50 p-3 rounded-xl border border-slate-100">
                                                <div>
                                                    <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Responsável</span>
                                                    {selectedSpot.equipment.assigneeName ? (
                                                        <span className="font-bold text-sm text-slate-700">{selectedSpot.equipment.assigneeName}</span>
                                                    ) : (
                                                        <span className="font-bold text-sm text-slate-400 italic">Nenhum operador atribuído</span>
                                                    )}
                                                </div>
                                                <button 
                                                    className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold text-indigo-600 hover:bg-indigo-50 transition-colors"
                                                    onClick={() => {
                                                        const newName = prompt("Digite o nome do operador responsável:");
                                                        if (newName !== null) {
                                                            const updatedSectors = sectors.map(sec => ({
                                                                ...sec,
                                                                spots: sec.spots.map(spot => {
                                                                    if (spot.id === selectedSpot.id && spot.equipment) {
                                                                        return {
                                                                            ...spot,
                                                                            equipment: { ...spot.equipment, assigneeName: newName || undefined }
                                                                        };
                                                                    }
                                                                    return spot;
                                                                })
                                                            }));
                                                            setSectors(updatedSectors);
                                                            setSelectedSpot({
                                                                ...selectedSpot, 
                                                                equipment: { ...selectedSpot.equipment, assigneeName: newName || undefined }
                                                            });
                                                        }
                                                    }}
                                                >
                                                    {selectedSpot.equipment.assigneeName ? 'Alterar' : 'Atribuir'}
                                                </button>
                                            </div>
                                            
                                            {/* Integração WIKI */}
                                            <div className="mt-6 pt-4 border-t border-slate-100">
                                                <button
                                                    onClick={() => handleOpenWiki(selectedSpot.equipment!)}
                                                    className="w-full bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-700 py-4 rounded-xl flex items-center justify-center gap-3 transition-colors shadow-sm group"
                                                >
                                                    <BookOpen size={20} className="group-hover:scale-110 transition-transform" />
                                                    <div className="text-left">
                                                        <span className="block font-black text-sm uppercase tracking-wide">Acessar Wiki da Máquina</span>
                                                        <span className="block text-[10px] font-bold opacity-70">Procedimentos, Manuais e Debug</span>
                                                    </div>
                                                </button>
                                            </div>
                                        </div>
                                        
                                        {/* Controles de Manutenção Rápidos */}
                                        <div className="grid grid-cols-2 gap-3">
                                            <button className="bg-white border border-slate-200 p-4 rounded-2xl text-center hover:border-amber-400 transition-colors shadow-sm group">
                                                <AlertTriangle size={24} className="mx-auto mb-2 text-slate-400 group-hover:text-amber-500" />
                                                <span className="font-bold text-xs text-slate-600">Abrir Chamado Manutenção</span>
                                            </button>
                                            <button className="bg-white border border-slate-200 p-4 rounded-2xl text-center hover:border-emerald-400 transition-colors shadow-sm group">
                                                <CheckCircle2 size={24} className="mx-auto mb-2 text-slate-400 group-hover:text-emerald-500" />
                                                <span className="font-bold text-xs text-slate-600">Registrar Limpeza/Revisão</span>
                                            </button>
                                        </div>
                                    </>
                                ) : (
                                    <div className="bg-white rounded-2xl p-10 border border-dashed border-slate-300 text-center flex flex-col items-center">
                                        <div className="w-16 h-16 bg-slate-50 text-slate-300 rounded-full flex items-center justify-center mb-4">
                                            <Box size={32} />
                                        </div>
                                        <h4 className="font-black text-slate-600 mb-2">Espaço Disponível</h4>
                                        <p className="text-sm text-slate-400 mb-6">Este espaço no layout da fábrica está livre para alocação de novos equipamentos.</p>
                                        <button className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 px-6 rounded-xl shadow-lg transition-colors flex items-center gap-2 text-sm">
                                            <Plus size={16} /> Instalar Equipamento Aqui
                                        </button>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                        
                        {/* THIRD LAYER WIKI PANEL (Slide over the drawer) */}
                        <AnimatePresence>
                            {isWikiOpen && selectedSpot.equipment && (
                                <motion.div
                                    initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
                                    transition={{ type: "spring", damping: 25, stiffness: 220 }}
                                    className="fixed top-0 right-0 bottom-0 w-full sm:w-[600px] bg-white z-[120] flex flex-col shadow-[-20px_0_40px_rgba(0,0,0,0.1)] border-l border-slate-200"
                                >
                                    <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center bg-indigo-50">
                                        <div className="flex items-center gap-3">
                                            <div className="bg-indigo-600 text-white p-2 rounded-lg"><BookOpen size={20} /></div>
                                            <div>
                                                <h3 className="font-black text-lg text-indigo-900">Wiki Corporativa</h3>
                                                <p className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest">{selectedSpot.equipment.name}</p>
                                            </div>
                                        </div>
                                        <button onClick={() => setIsWikiOpen(false)} className="p-2 bg-indigo-100 rounded-full text-indigo-600 hover:bg-indigo-200"><ChevronRight size={20} /></button>
                                    </div>
                                    
                                    <div className="flex-1 p-8 overflow-y-auto custom-scrollbar">
                                        {editingWiki ? (
                                            <div className="h-full flex flex-col">
                                                <p className="text-sm text-slate-500 mb-2 font-medium">Use Markdown ou HTML para formatar os procedimentos. (No futuro, Rich Text TipTap)</p>
                                                <textarea 
                                                    value={wikiText}
                                                    onChange={e => setWikiText(e.target.value)}
                                                    className="flex-1 w-full border border-slate-200 rounded-xl p-4 font-mono text-sm bg-slate-50 focus:border-indigo-500 outline-none resize-none"
                                                />
                                            </div>
                                        ) : (
                                            <div className="prose prose-slate max-w-none">
                                                {wikiText ? (
                                                    <div dangerouslySetInnerHTML={{ __html: wikiText }} />
                                                ) : (
                                                    <div className="text-center py-20 text-slate-400 italic">
                                                        <BookOpen size={48} className="mx-auto mb-4 opacity-20" />
                                                        Nenhuma documentação registrada para este equipamento ainda.
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                    
                                    <div className="p-4 border-t border-slate-200 flex justify-end gap-3 bg-slate-50">
                                        {editingWiki ? (
                                            <>
                                                <button onClick={() => setEditingWiki(false)} className="px-4 py-2 text-sm font-bold text-slate-600 hover:bg-slate-200 rounded-lg">Cancelar</button>
                                                <button onClick={handleSaveWiki} className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold rounded-lg shadow-md flex items-center gap-2">
                                                    <Save size={16} /> Salvar Wiki
                                                </button>
                                            </>
                                        ) : (
                                            <button onClick={() => setEditingWiki(true)} className="px-6 py-2 bg-white border border-slate-200 text-slate-700 hover:border-indigo-400 text-sm font-bold rounded-lg shadow-sm flex items-center gap-2">
                                                <Edit2 size={16} /> Editar Documentação
                                            </button>
                                        )}
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </>
                )}
            </AnimatePresence>

            {/* MODAL CONFIGURAÇÃO DE SETOR */}
            <AnimatePresence>
                {isEditorOpen && (
                    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[130] flex items-center justify-center p-4 animate-fade-in">
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
                            className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-md overflow-hidden flex flex-col max-h-[90vh]"
                        >
                            <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50 shrink-0">
                                <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2">
                                    <Settings size={20} className="text-slate-500" /> Configurar Setor
                                </h3>
                                <button onClick={() => setIsEditorOpen(false)} className="p-1.5 bg-slate-200 rounded-full text-slate-500 hover:bg-slate-300 transition-all">
                                    <X size={18} />
                                </button>
                            </div>

                            <div className="p-6 flex-1 overflow-y-auto custom-scrollbar space-y-6">
                                <div className="bg-indigo-50/50 border border-indigo-100 p-5 rounded-2xl mb-6 space-y-4">
                                    <h4 className="text-xs font-black text-indigo-800 uppercase tracking-wider flex items-center gap-1">
                                        <Plus size={14} /> {editingSectorId ? "Editar Setor" : "Novo Setor"}
                                    </h4>
                                    
                                    <div>
                                        <label className="block text-xs font-bold text-slate-600 mb-1.5">Identificador / Nome</label>
                                        <input
                                            type="text"
                                            value={newSector.name}
                                            disabled={!!editingSectorId}
                                            onChange={(e) => setNewSector({ ...newSector, name: e.target.value })}
                                            className="w-full bg-white border border-slate-300 rounded-xl px-4 py-2.5 text-slate-800 font-bold outline-none focus:border-indigo-500 transition-all"
                                            placeholder="Ex: Usinagem"
                                        />
                                    </div>

                                    <div className="flex gap-3">
                                        <div className="flex-1">
                                            <label className="block text-xs font-bold text-slate-600 mb-1.5">Linhas (Grid)</label>
                                            <input type="number" min="1" max="20" value={newSector.rows} onChange={(e) => setNewSector({ ...newSector, rows: e.target.value })} className="w-full bg-white border border-slate-300 rounded-xl px-4 py-2.5 text-slate-800 font-bold outline-none focus:border-indigo-500" />
                                        </div>
                                        <div className="flex-1">
                                            <label className="block text-xs font-bold text-slate-600 mb-1.5">Colunas (Grid)</label>
                                            <input type="number" min="1" max="20" value={newSector.cols} onChange={(e) => setNewSector({ ...newSector, cols: e.target.value })} className="w-full bg-white border border-slate-300 rounded-xl px-4 py-2.5 text-slate-800 font-bold outline-none focus:border-indigo-500" />
                                        </div>
                                    </div>

                                    <label className="block text-xs font-bold text-slate-600 mb-1 mt-2">Disposição Visão Geral</label>
                                    <div className="flex gap-2">
                                        <button onClick={() => setNewSector({ ...newSector, orientation: 'horizontal' })} className={cn("flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border-2 font-bold text-sm transition-colors", newSector.orientation === 'horizontal' ? 'border-indigo-500 bg-indigo-50 text-indigo-700' : 'border-slate-200 bg-white text-slate-500')}><GripHorizontal size={16} /> Horizontal</button>
                                        <button onClick={() => setNewSector({ ...newSector, orientation: 'vertical' })} className={cn("flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border-2 font-bold text-sm transition-colors", newSector.orientation === 'vertical' ? 'border-indigo-500 bg-indigo-50 text-indigo-700' : 'border-slate-200 bg-white text-slate-500')}><GripVertical size={16} /> Vertical</button>
                                    </div>

                                    <div className="flex gap-2 mt-2">
                                        {["Mesa", "Impressoras", "Corte", "Geral"].map(typeKey => (
                                            <button
                                                key={typeKey}
                                                onClick={() => setNewSector({ ...newSector, type: typeKey as any })}
                                                className={cn(
                                                    "flex-1 py-2.5 rounded-xl border-2 font-bold text-[10px] transition-all",
                                                    newSector.type === typeKey ? 'border-indigo-500 bg-indigo-50 text-indigo-700' : 'border-slate-200 bg-white text-slate-500'
                                                )}
                                            >
                                                {typeKey}
                                            </button>
                                        ))}
                                    </div>

                                    <div className="flex gap-2 mt-2 pt-2">
                                        {editingSectorId && (
                                            <>
                                                <button onClick={() => {
                                                    // Removes the sector and implicitly unallocates the items since they only existed in these spots
                                                    const nextSections = sectors.filter(s => s.id !== editingSectorId);
                                                    setSectors(nextSections);
                                                    if (activeSectorId === editingSectorId) {
                                                        setActiveSectionId(nextSections.length > 0 ? nextSections[0].id : "");
                                                    }
                                                    setEditingSectorId(null);
                                                    setIsEditorOpen(false);
                                                    setSelectedSpot(null);
                                                }} className="flex-1 bg-white border border-rose-300 text-rose-600 py-3 rounded-xl font-bold hover:bg-rose-50 transition-colors flex items-center justify-center gap-2">
                                                    <Trash2 size={16} /> Remover
                                                </button>
                                                <button onClick={() => setIsEditorOpen(false)} className="flex-1 bg-white border border-slate-300 text-slate-700 py-3 rounded-xl font-bold hover:bg-slate-50 transition-colors">Cancelar</button>
                                            </>
                                        )}
                                        <button
                                            onClick={() => {
                                                if (!newSector.name.trim()) return;
                                                if (editingSectorId) {
                                                    // Edit existing
                                                    setSectors(prev => prev.map(s => {
                                                        if (s.id !== editingSectorId) return s;
                                                        const newRows = Number(newSector.rows);
                                                        const newCols = Number(newSector.cols);
                                                        const existingSpotMap = new Map(s.spots.map(sp => [sp.id, sp]));
                                                        const nextSpots: Spot[] = [];
                                                        for (let r = 1; r <= newRows; r++) {
                                                            for (let c = 1; c <= newCols; c++) {
                                                                const sid = `${s.id}-${r}-${c}`;
                                                                nextSpots.push(existingSpotMap.get(sid) || { id: sid, code: `${s.name.substring(0,3).toUpperCase()}-${r}-${c}`, row: r, col: c, status: 'available', equipment: null });
                                                            }
                                                        }
                                                        return { ...s, rows: newRows, cols: newCols, orientation: newSector.orientation as any, type: newSector.type as any, spots: nextSpots };
                                                    }));
                                                } else {
                                                    // Create new
                                                    const id = newSector.name.trim();
                                                    const spots: Spot[] = [];
                                                    for (let r = 1; r <= Number(newSector.rows); r++) {
                                                        for (let c = 1; c <= Number(newSector.cols); c++) {
                                                            spots.push({ id: `${id}-${r}-${c}`, code: `${id.substring(0,3).toUpperCase()}-${r}-${c}`, row: r, col: c, status: "available", equipment: null });
                                                        }
                                                    }
                                                    setSectors([...sectors, { id, name: id, rows: Number(newSector.rows), cols: Number(newSector.cols), orientation: newSector.orientation as any, type: newSector.type as any, spots }]);
                                                    setActiveSectionId(id);
                                                }
                                                setIsEditorOpen(false);
                                            }}
                                            disabled={!newSector.name.trim()}
                                            className="flex-1 py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                                        >
                                            Salvar Layout
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};
