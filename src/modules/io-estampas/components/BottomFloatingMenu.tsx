import React from 'react';
import { Undo, Redo, ZoomOut, ZoomIn, Grid3X3, Download, Printer, Layers, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { PRINT_TYPES } from '../libs/editor-utils';

interface Props {
  undo: () => void;
  redo: () => void;
  showGabarito: boolean;
  setShowGabarito: (v: boolean) => void;
  zoom: number;
  setZoom: (v: number) => void;
  fitZoom: () => void;
  printType: string;
  setPrintType: (v: string) => void;
  showPrintMenu: boolean;
  setShowPrintMenu: (v: boolean) => void;
  isExportMenuOpen: boolean;
  setIsExportMenuOpen: (v: boolean) => void;
  handleExportPDF: (mode: string) => void;
  openAiMockup: () => void;
}

export function BottomFloatingMenu({
  undo, redo, showGabarito, setShowGabarito, zoom, setZoom, fitZoom,
  printType, setPrintType, showPrintMenu, setShowPrintMenu,
  isExportMenuOpen, setIsExportMenuOpen, handleExportPDF, openAiMockup
}: Props) {
  
  const pt = PRINT_TYPES.find(t=>t.id===printType);

  return (
    <div className="absolute bottom-8 left-1/2 -translate-x-1/2 bg-white/90 backdrop-blur border border-slate-200 rounded-2xl shadow-lg flex items-center p-1.5 z-50">
      <button onClick={undo} className="w-9 h-9 flex items-center justify-center hover:bg-slate-100 rounded-xl text-slate-600 transition-colors" title="Desfazer"><Undo size={16}/></button>
      <button onClick={redo} className="w-9 h-9 flex items-center justify-center hover:bg-slate-100 rounded-xl text-slate-600 transition-colors" title="Refazer"><Redo size={16}/></button>
      
      <div className="w-px h-6 bg-slate-200 mx-1" />
      <button onClick={()=>setShowGabarito(!showGabarito)} className={`w-9 h-9 flex items-center justify-center rounded-xl transition-colors ${showGabarito ? 'bg-indigo-100 text-indigo-600' : 'hover:bg-slate-100 text-slate-600'}`} title="Alternar Gabarito"><Grid3X3 size={16}/></button>
      
      <div className="w-px h-6 bg-slate-200 mx-1" />
      <button onClick={()=>setZoom(Math.max(0.2, zoom-0.1))} className="w-9 h-9 flex items-center justify-center hover:bg-slate-100 rounded-xl text-slate-600 transition-colors"><ZoomOut size={16}/></button>
      <span className="text-[11px] font-bold text-slate-500 w-12 text-center">{Math.round(zoom*100)}%</span>
      <button onClick={()=>setZoom(Math.min(3, zoom+0.1))} className="w-9 h-9 flex items-center justify-center hover:bg-slate-100 rounded-xl text-slate-600 transition-colors"><ZoomIn size={16}/></button>
      <button onClick={fitZoom} className="px-3 h-9 flex items-center justify-center hover:bg-slate-100 rounded-xl text-[10px] font-bold text-slate-600 uppercase ml-1 transition-colors">Fit</button>
      
      <div className="w-px h-6 bg-slate-200 mx-2" />
      
      <div className="relative">
        <button onClick={() => setShowPrintMenu(!showPrintMenu)} className="px-4 h-9 flex items-center gap-2 rounded-xl text-xs font-bold bg-slate-100 text-slate-800 hover:bg-slate-200 transition-colors">
          <span className={`flex items-center gap-2 ${pt?.color}`}>
             {/* We could dynamically import icons if needed, but for now we'll just display the name */}
             {pt?.name}
          </span>
        </button>
        <AnimatePresence>
          {showPrintMenu && (
            <motion.div initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, y:10 }} className="absolute bottom-full right-0 mb-2 w-48 bg-white rounded-xl shadow-xl border border-slate-200 overflow-hidden flex flex-col p-1.5 z-50">
              <div className="px-3 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Técnica de Impressão</div>
              {PRINT_TYPES.map(type => (
                <button key={type.id} onClick={() => { setPrintType(type.id); setShowPrintMenu(false); }} className={`flex items-center gap-3 px-3 py-2.5 text-xs font-bold rounded-lg transition-colors ${printType === type.id ? 'bg-slate-100 text-slate-900' : 'text-slate-600 hover:bg-slate-50'}`}>
                  <span className={`${type.color}`}>•</span> {type.name}
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="w-px h-6 bg-slate-200 mx-2" />
      
      <div className="relative">
         <button onClick={() => setIsExportMenuOpen(!isExportMenuOpen)} className="flex items-center justify-center w-9 h-9 bg-slate-900 hover:bg-slate-800 text-white rounded-xl transition-all shadow-md">
            <Download size={16} />
         </button>
         <AnimatePresence>
          {isExportMenuOpen && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} className="absolute bottom-full mb-2 right-0 w-64 bg-white border border-slate-200 rounded-2xl shadow-xl py-2 z-50">
              <div className="px-4 py-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Exportar Final</div>
              <button onClick={() => handleExportPDF('pdf')} className="w-full text-left px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-3"><Download size={16} className="text-slate-400"/> Arte PDF (Cores)</button>
              <button onClick={() => handleExportPDF('fotolito')} className="w-full text-left px-4 py-2.5 text-sm font-semibold text-slate-900 bg-slate-50 hover:bg-slate-100 flex items-center gap-3"><Printer size={16} className="text-slate-900"/> Fotolito (Preto Absoluto)</button>
              {printType === 'silk' && (
                <button onClick={() => handleExportPDF('silk-colors')} className="w-full text-left px-4 py-2.5 text-sm font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 flex items-center gap-3"><Layers size={16} className="text-blue-500"/> Separação Silk (Cores)</button>
              )}
              <div className="h-px bg-slate-100 my-2" />
              <div className="px-4 py-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Apresentação</div>
              <button onClick={openAiMockup} className="w-full text-left px-4 py-2.5 text-sm font-semibold text-violet-700 hover:bg-violet-50 flex items-center gap-3"><Sparkles size={16} className="text-violet-500"/> Gerar Mockup IA</button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

    </div>
  );
}
