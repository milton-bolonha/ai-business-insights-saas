import React, { useRef } from 'react';
import { 
  Type, BoxSelect, ImagePlus, Wand2, X, Settings, Trash2, 
  AlignLeft, AlignCenter, AlignRight, Italic, Underline, Strikethrough,
  CaseUpper, CaseLower, Baseline, Loader2
} from 'lucide-react';
import { FONTS_BY_CATEGORY, FONT_WEIGHTS } from '../libs/editor-utils';

interface Props {
  elements: any[];
  selectedId: string | null;
  setSelectedId: (id: string | null) => void;
  setEditingId: (id: string | null) => void;
  activeRightPanel: string;
  setActiveRightPanel: (v: string) => void;
  addText: () => void;
  addShape: (shape: string) => void;
  handleImage: (e: any) => void;
  removeEl: (id: string) => void;
  updateEl: (id: string, changes: any, saveHist?: boolean) => void;
  pushHistory: () => void;
  canvasFormat: string;
  changeFormat: (f: string) => void;
  canvasW: number;
  setCanvasW: (v: number) => void;
  canvasH: number;
  setCanvasH: (v: number) => void;
  pageBgColor: string;
  setPageBgColor: (v: string) => void;
  exportPageBg: boolean;
  setExportPageBg: (v: boolean) => void;
  alignGrid: (col: number, row: number) => void;
  alignCenterAbs: () => void;
  // AI Props
  aiImagePrompt: string;
  setAiImagePrompt: (v: string) => void;
  aiPrompt: string;
  setAiPrompt: (v: string) => void;
  runAiImage: () => void;
  runAiMockup: () => void;
  aiLoading: boolean;
}

export function SidebarRight({
  elements, selectedId, setSelectedId, setEditingId,
  activeRightPanel, setActiveRightPanel,
  addText, addShape, handleImage, removeEl, updateEl, pushHistory,
  canvasFormat, changeFormat, canvasW, setCanvasW, canvasH, setCanvasH,
  pageBgColor, setPageBgColor, exportPageBg, setExportPageBg,
  alignGrid, alignCenterAbs,
  aiImagePrompt, setAiImagePrompt, aiPrompt, setAiPrompt, runAiImage, runAiMockup, aiLoading
}: Props) {
  const fileRef = useRef<HTMLInputElement>(null);

  const selectedEl = elements.find(e => e.id === selectedId);

  return (
    <aside className="w-80 bg-white border border-slate-200 flex flex-col overflow-y-auto z-20 shadow-xl shrink-0 absolute right-4 top-16 rounded-2xl max-h-[calc(100vh-8rem)]">
      
      {/* ADD TOOLS */}
      <div className="p-3 border-b border-slate-100 bg-slate-50/50">
        <h3 className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-2">Inserir Elementos</h3>
        <div className="grid grid-cols-4 gap-1.5">
          <button onClick={addText} className="flex flex-col items-center gap-1.5 py-2 border border-slate-200 bg-white rounded-lg hover:border-indigo-500 hover:text-indigo-600 transition-colors text-slate-600 shadow-sm"><Type size={14}/><span className="text-[8px] font-bold uppercase">Texto</span></button>
          <button onClick={() => addShape('star')} className="flex flex-col items-center gap-1.5 py-2 border border-slate-200 bg-white rounded-lg hover:border-indigo-500 hover:text-indigo-600 transition-colors text-slate-600 shadow-sm"><BoxSelect size={14}/><span className="text-[8px] font-bold uppercase">Forma</span></button>
          <button onClick={() => fileRef.current?.click()} className="flex flex-col items-center gap-1.5 py-2 border border-slate-200 bg-white rounded-lg hover:border-indigo-500 hover:text-indigo-600 transition-colors text-slate-600 shadow-sm"><ImagePlus size={14}/><span className="text-[8px] font-bold uppercase">Upload</span></button>
          <button onClick={() => { setActiveRightPanel('ai'); setSelectedId(null); setEditingId(null); }} className="flex flex-col items-center gap-1.5 py-2 border border-violet-200 bg-violet-50 rounded-lg hover:border-violet-500 hover:text-violet-700 transition-colors text-violet-600 shadow-sm"><Wand2 size={14}/><span className="text-[8px] font-bold uppercase">IA Tools</span></button>
          <input type="file" ref={fileRef} accept="image/*" className="hidden" onChange={handleImage} />
        </div>
      </div>

      {/* PAINEL DINÂMICO: PROPRIEDADES, IA TOOLS, OU SETUP DA PÁGINA */}
      {activeRightPanel === 'ai' && !selectedId ? (
         <div className="p-4 flex-1 space-y-4">
           <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-bold text-slate-800">Ferramentas de IA</h3>
              <button onClick={() => setActiveRightPanel('properties')} className="p-1 hover:bg-slate-100 rounded text-slate-400"><X size={14}/></button>
           </div>
           <div className="border border-indigo-100 bg-indigo-50/40 rounded-xl p-3 shadow-sm">
              <h4 className="text-[10px] font-bold text-indigo-700 mb-1 flex items-center gap-1.5"><ImagePlus size={14}/> Gerar Ilustração</h4>
              <p className="text-[9px] text-indigo-900/60 font-medium mb-2">Cria desenhos com fundo transparente diretos pro canvas.</p>
              <textarea value={aiImagePrompt} onChange={e=>setAiImagePrompt(e.target.value)} placeholder="Ex: Um tigre em traços neon..." className="w-full bg-white border border-indigo-100 rounded-lg p-2 text-[10px] mb-2 outline-none focus:border-indigo-400 resize-none h-16" />
              <button onClick={runAiImage} disabled={aiLoading} className="w-full py-2 bg-indigo-600 text-white rounded-lg font-bold text-[10px] flex items-center justify-center gap-1.5 hover:bg-indigo-700 transition-colors disabled:opacity-50">
                {aiLoading ? <Loader2 size={12} className="animate-spin"/> : 'Criar e Adicionar'}
              </button>
           </div>
           {/* Mockup Generator here is a shortcut to open the full screen dialog */}
         </div>
      ) : !selectedId ? (
         /* SETUP DA PÁGINA (Quando nada está selecionado) */
         <div className="p-4 flex-1 space-y-4">
           <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-bold text-slate-800 flex items-center gap-1.5"><Settings size={14} className="text-slate-400"/> Propriedades</h3>
           </div>

           <div>
             <h3 className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Tamanho do Documento</h3>
             <select value={canvasFormat} onChange={(e) => changeFormat(e.target.value)} className="w-full px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-md text-xs outline-none focus:border-indigo-500 font-medium mb-1.5">
                <option value="A4">A4 (297x420 px)</option>
                <option value="A3">A3 (420x594 px)</option>
                <option value="custom">Personalizado</option>
             </select>
             {canvasFormat === 'custom' && (
               <div className="flex gap-2">
                <div className="flex-1">
                  <label className="text-[9px] text-slate-500 font-medium block mb-0.5">Largura (px)</label>
                  <input type="number" value={canvasW} onChange={e=>setCanvasW(Number(e.target.value))} className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded-md text-xs" />
                </div>
                <div className="flex-1">
                  <label className="text-[9px] text-slate-500 font-medium block mb-0.5">Altura (px)</label>
                  <input type="number" value={canvasH} onChange={e=>setCanvasH(Number(e.target.value))} className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded-md text-xs" />
                </div>
             </div>
             )}
           </div>

           <div>
             <h3 className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Fundo do Canvas</h3>
             <div className="flex items-center gap-2 mb-2">
                <input type="color" value={pageBgColor} onChange={e=>setPageBgColor(e.target.value)} className="w-8 h-8 rounded cursor-pointer border border-slate-200 p-0.5" />
                <span className="text-xs text-slate-600 font-medium">{pageBgColor.toUpperCase()}</span>
             </div>
             <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-600">
               <input type="checkbox" checked={exportPageBg} onChange={e=>setExportPageBg(e.target.checked)} className="rounded text-indigo-600 focus:ring-indigo-500" />
               <span>Exportar cor de fundo no PDF final</span>
             </label>
           </div>
         </div>
      ) : (
        <div className="p-4 flex-1 space-y-4">
           <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-800">Propriedades</h3>
              <button onClick={() => removeEl(selectedId)} className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors"><Trash2 size={14}/></button>
           </div>

           {/* Dimensões Manuais */}
           <div>
             <div className="flex items-center justify-between mb-3">
               <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Coordenadas e Tamanho</h3>
               <span className="text-[10px] font-mono bg-slate-100 px-1.5 py-0.5 rounded text-slate-500">px</span>
             </div>
             <div className="grid grid-cols-2 gap-3">
               <div className="flex border border-slate-200 rounded-lg overflow-hidden bg-slate-50 focus-within:border-indigo-500 focus-within:ring-1 focus-within:ring-indigo-500">
                 <span className="bg-slate-100 px-3 py-2 text-xs font-bold border-r border-slate-200 text-slate-500">X</span>
                 <input type="number" value={Math.round(selectedEl?.x || 0)} onChange={e => updateEl(selectedId, { x: parseInt(e.target.value) })} className="w-full px-2 text-sm outline-none font-mono bg-transparent" />
               </div>
               <div className="flex border border-slate-200 rounded-lg overflow-hidden bg-slate-50 focus-within:border-indigo-500 focus-within:ring-1 focus-within:ring-indigo-500">
                 <span className="bg-slate-100 px-3 py-2 text-xs font-bold border-r border-slate-200 text-slate-500">Y</span>
                 <input type="number" value={Math.round(selectedEl?.y || 0)} onChange={e => updateEl(selectedId, { y: parseInt(e.target.value) })} className="w-full px-2 text-sm outline-none font-mono bg-transparent" />
               </div>
               <div className="flex border border-slate-200 rounded-lg overflow-hidden bg-slate-50 focus-within:border-indigo-500 focus-within:ring-1 focus-within:ring-indigo-500">
                 <span className="bg-slate-100 px-3 py-2 text-xs font-bold border-r border-slate-200 text-slate-500">W</span>
                 <input type="number" value={Math.round(selectedEl?.w || 0)} onChange={e => updateEl(selectedId, { w: parseInt(e.target.value) })} className="w-full px-2 text-sm outline-none font-mono bg-transparent" />
               </div>
               <div className="flex border border-slate-200 rounded-lg overflow-hidden bg-slate-50 focus-within:border-indigo-500 focus-within:ring-1 focus-within:ring-indigo-500">
                 <span className="bg-slate-100 px-3 py-2 text-xs font-bold border-r border-slate-200 text-slate-500">H</span>
                 <input type="number" value={Math.round(selectedEl?.h || 0)} onChange={e => updateEl(selectedId, { h: parseInt(e.target.value) })} className="w-full px-2 text-sm outline-none font-mono bg-transparent" />
               </div>
             </div>
           </div>

           {/* Snap Zonas */}
           <div className="pt-4 border-t border-slate-100">
             <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Posicionamento Rápido</h3>
             <div className="grid grid-cols-3 gap-1 bg-slate-50 p-1.5 rounded-xl border border-slate-100">
               <button onClick={()=>alignGrid(0,0)} className="py-2 bg-white border border-slate-200 rounded-lg text-slate-600 hover:bg-indigo-600 hover:text-white text-[9px] uppercase font-bold transition-colors shadow-sm">Nuca Esq</button>
               <button onClick={()=>alignGrid(1,0)} className="py-2 bg-white border border-slate-200 rounded-lg text-slate-600 hover:bg-indigo-600 hover:text-white text-[9px] uppercase font-bold transition-colors shadow-sm">Nuca Cen</button>
               <button onClick={()=>alignGrid(2,0)} className="py-2 bg-white border border-slate-200 rounded-lg text-slate-600 hover:bg-indigo-600 hover:text-white text-[9px] uppercase font-bold transition-colors shadow-sm">Nuca Dir</button>
               <button onClick={()=>alignGrid(0,1)} className="py-2 bg-white border border-slate-200 rounded-lg text-slate-600 hover:bg-indigo-600 hover:text-white text-[9px] uppercase font-bold transition-colors shadow-sm">Peit Esq</button>
               <button onClick={()=>alignGrid(1,1)} className="py-2 bg-white border border-slate-200 rounded-lg text-slate-600 hover:bg-indigo-600 hover:text-white text-[9px] uppercase font-bold transition-colors shadow-sm">Peit Cen</button>
               <button onClick={()=>alignGrid(2,1)} className="py-2 bg-white border border-slate-200 rounded-lg text-slate-600 hover:bg-indigo-600 hover:text-white text-[9px] uppercase font-bold transition-colors shadow-sm">Peit Dir</button>
               <button onClick={()=>alignGrid(0,2)} className="py-2 bg-white border border-slate-200 rounded-lg text-slate-600 hover:bg-indigo-600 hover:text-white text-[9px] uppercase font-bold transition-colors shadow-sm">Barr Esq</button>
               <button onClick={()=>alignGrid(1,2)} className="py-2 bg-white border border-slate-200 rounded-lg text-slate-600 hover:bg-indigo-600 hover:text-white text-[9px] uppercase font-bold transition-colors shadow-sm">Barr Cen</button>
               <button onClick={()=>alignGrid(2,2)} className="py-2 bg-white border border-slate-200 rounded-lg text-slate-600 hover:bg-indigo-600 hover:text-white text-[9px] uppercase font-bold transition-colors shadow-sm">Barr Dir</button>
               <button onClick={()=>alignGrid(0,3)} className="py-2 bg-white border border-slate-200 rounded-lg text-slate-600 hover:bg-indigo-600 hover:text-white text-[9px] uppercase font-bold transition-colors shadow-sm">Barra Esq</button>
               <button onClick={()=>alignGrid(1,3)} className="py-2 bg-white border border-slate-200 rounded-lg text-slate-600 hover:bg-indigo-600 hover:text-white text-[9px] uppercase font-bold transition-colors shadow-sm">Barra Cen</button>
               <button onClick={()=>alignGrid(2,3)} className="py-2 bg-white border border-slate-200 rounded-lg text-slate-600 hover:bg-indigo-600 hover:text-white text-[9px] uppercase font-bold transition-colors shadow-sm">Barra Dir</button>
             </div>
             <button onClick={alignCenterAbs} className="w-full mt-2 py-2 bg-slate-900 text-white rounded-lg text-[10px] uppercase tracking-wider font-bold shadow-md hover:bg-slate-800 transition-colors">Centro Absoluto</button>
           </div>

           {/* Typografia Avançada */}
           {selectedEl?.type === 'text' && (
             <div className="space-y-4 pt-4 border-t border-slate-100">
               <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Edição de Texto</h3>
               
               <div className="text-[10px] text-slate-400 italic mb-2">Dê dois cliques no texto no canvas para digitar.</div>
               
               <div className="grid grid-cols-2 gap-3">
                 <div className="col-span-2">
                   <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Família da Fonte</label>
                   <select value={selectedEl.fontFamily} onChange={e => updateEl(selectedId, { fontFamily: e.target.value })} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none font-medium">
                     {Object.entries(FONTS_BY_CATEGORY).map(([category, fonts]) => (
                       <optgroup key={category} label={category}>
                         {fonts.map(font => <option key={font} value={font} style={{ fontFamily: font }}>{font}</option>)}
                       </optgroup>
                     ))}
                   </select>
                 </div>
                 
                 <div className="col-span-1">
                   <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Estilo (Weight)</label>
                   <select value={selectedEl.fontWeight || '800'} onChange={e => updateEl(selectedId, { fontWeight: e.target.value })} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none font-medium">
                      {FONT_WEIGHTS.map(fw => <option key={fw.value} value={fw.value}>{fw.label}</option>)}
                   </select>
                 </div>

                 <div className="col-span-1">
                   <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Tamanho (Size)</label>
                   <input type="number" value={selectedEl.fontSize || 40} onChange={e => updateEl(selectedId, { fontSize: parseInt(e.target.value) })} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none font-medium" />
                 </div>

                 <div className="col-span-1">
                   <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Altura da Linha</label>
                   <input type="number" step="0.1" value={selectedEl.lineHeight || 1.2} onChange={e => updateEl(selectedId, { lineHeight: parseFloat(e.target.value) })} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none font-medium" />
                 </div>
                 <div className="col-span-1">
                   <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Espaçamento Letras</label>
                   <div className="flex items-center bg-slate-50 border border-slate-200 rounded-lg pr-2 focus-within:border-indigo-500">
                      <input type="number" value={selectedEl.letterSpacing || 0} onChange={e => updateEl(selectedId, { letterSpacing: parseInt(e.target.value) })} className="w-full px-3 py-2 bg-transparent text-sm outline-none font-medium" />
                      <span className="text-[10px] text-slate-400 font-bold">px</span>
                   </div>
                 </div>

                 <div className="col-span-2">
                   <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Formatação</label>
                   <div className="flex gap-1 bg-slate-50 p-1 border border-slate-200 rounded-lg">
                     <button onClick={() => updateEl(selectedId, { fontStyle: selectedEl.fontStyle === 'italic' ? 'normal' : 'italic' })} className={`flex-1 rounded py-1.5 flex items-center justify-center transition-colors ${selectedEl.fontStyle === 'italic' ? 'bg-white shadow text-indigo-600' : 'text-slate-500 hover:bg-slate-200'}`}><Italic size={14}/></button>
                     <button onClick={() => updateEl(selectedId, { textDecoration: selectedEl.textDecoration === 'underline' ? 'none' : 'underline' })} className={`flex-1 rounded py-1.5 flex items-center justify-center transition-colors ${selectedEl.textDecoration === 'underline' ? 'bg-white shadow text-indigo-600' : 'text-slate-500 hover:bg-slate-200'}`}><Underline size={14}/></button>
                     <button onClick={() => updateEl(selectedId, { textDecoration: selectedEl.textDecoration === 'line-through' ? 'none' : 'line-through' })} className={`flex-1 rounded py-1.5 flex items-center justify-center transition-colors ${selectedEl.textDecoration === 'line-through' ? 'bg-white shadow text-indigo-600' : 'text-slate-500 hover:bg-slate-200'}`}><Strikethrough size={14}/></button>
                     <div className="w-px bg-slate-200 mx-1 my-1" />
                     <button onClick={() => updateEl(selectedId, { textTransform: 'uppercase' })} className={`flex-1 rounded py-1.5 flex items-center justify-center transition-colors ${selectedEl.textTransform === 'uppercase' ? 'bg-white shadow text-indigo-600' : 'text-slate-500 hover:bg-slate-200'}`}><CaseUpper size={14}/></button>
                     <button onClick={() => updateEl(selectedId, { textTransform: 'lowercase' })} className={`flex-1 rounded py-1.5 flex items-center justify-center transition-colors ${selectedEl.textTransform === 'lowercase' ? 'bg-white shadow text-indigo-600' : 'text-slate-500 hover:bg-slate-200'}`}><CaseLower size={14}/></button>
                   </div>
                 </div>

                 {selectedEl.textDecoration === 'underline' && (
                   <div className="col-span-2">
                     <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Distância do Sublinhado</label>
                     <div className="flex items-center bg-slate-50 border border-slate-200 rounded-lg pr-2 focus-within:border-indigo-500">
                        <input type="number" value={selectedEl.underlineOffset || 0} onChange={e => updateEl(selectedId, { underlineOffset: parseInt(e.target.value) })} className="w-full px-3 py-2 bg-transparent text-sm outline-none font-medium" />
                        <span className="text-[10px] text-slate-400 font-bold">px</span>
                     </div>
                   </div>
                 )}

                 <div className="col-span-2">
                   <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Alinhamento do Texto</label>
                   <div className="flex gap-1 bg-slate-50 p-1 border border-slate-200 rounded-lg">
                     <button onClick={() => updateEl(selectedId, { textAlign: 'left' })} className={`flex-1 rounded py-1.5 flex items-center justify-center transition-colors ${selectedEl.textAlign === 'left' ? 'bg-white shadow text-indigo-600' : 'text-slate-500 hover:bg-slate-200'}`}><AlignLeft size={14}/></button>
                     <button onClick={() => updateEl(selectedId, { textAlign: 'center' })} className={`flex-1 rounded py-1.5 flex items-center justify-center transition-colors ${selectedEl.textAlign === 'center' || !selectedEl.textAlign ? 'bg-white shadow text-indigo-600' : 'text-slate-500 hover:bg-slate-200'}`}><AlignCenter size={14}/></button>
                     <button onClick={() => updateEl(selectedId, { textAlign: 'right' })} className={`flex-1 rounded py-1.5 flex items-center justify-center transition-colors ${selectedEl.textAlign === 'right' ? 'bg-white shadow text-indigo-600' : 'text-slate-500 hover:bg-slate-200'}`}><AlignRight size={14}/></button>
                   </div>
                 </div>
               </div>

               <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-3">
                 <label className="text-[10px] font-bold text-indigo-700 uppercase flex justify-between mb-2">
                    <span className="flex items-center gap-1.5"><Baseline size={12}/> Curvatura (Arco Redondo)</span>
                    <span>{selectedEl.curve || 0}°</span>
                 </label>
                 <div className="flex items-center gap-3">
                   <span className="text-xs font-black text-indigo-300">∩</span>
                   <input type="range" min="-100" max="100" value={selectedEl.curve || 0} onChange={e => updateEl(selectedId, { curve: parseInt(e.target.value) }, false)} onMouseUp={()=>pushHistory()} className="flex-1 accent-indigo-600" />
                   <span className="text-xs font-black text-indigo-300">∪</span>
                 </div>
               </div>
             </div>
           )}

           {selectedEl?.type !== 'image' && (
             <div className="pt-4 border-t border-slate-100 space-y-4">
               <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Cores e Contorno</h3>
               
               <div>
                 <label className="text-[10px] font-bold text-slate-500 block mb-1">Preenchimento (Fill)</label>
                 <div className="flex items-center gap-3 bg-slate-50 p-1.5 rounded-xl border border-slate-100">
                   <div className="relative w-8 h-8 rounded-lg border border-slate-200 overflow-hidden shadow-sm">
                     <input type="color" value={selectedEl.color || '#000000'} onChange={e => updateEl(selectedId, { color: e.target.value })} className="absolute -top-2 -left-2 w-16 h-16 cursor-pointer" />
                   </div>
                   <input type="text" value={selectedEl.color || '#000000'} onChange={e => updateEl(selectedId, { color: e.target.value })} className="flex-1 px-2 py-1.5 bg-transparent text-sm font-mono outline-none uppercase font-bold text-slate-700" />
                 </div>
               </div>

               <div>
                 <label className="text-[10px] font-bold text-slate-500 block mb-1">Contorno (Stroke)</label>
                 <div className="flex items-center gap-2 bg-slate-50 p-1.5 rounded-xl border border-slate-100 mb-2">
                   <div className="relative w-8 h-8 rounded-lg border border-slate-200 overflow-hidden shadow-sm bg-[url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAQAAAAECAYAAACp8Z5+AAAAIklEQVQIW2NkQAKrVq36zwjjgzhhYWGMYAEYB8RmROaABADeOQ8CXl/xfgAAAABJRU5ErkJggg==')]">
                     <input type="color" value={selectedEl.strokeColor || '#000000'} onChange={e => updateEl(selectedId, { strokeColor: e.target.value })} className="absolute -top-2 -left-2 w-16 h-16 cursor-pointer" />
                   </div>
                   <div className="flex items-center bg-white border border-slate-200 rounded-lg pr-2 flex-1">
                     <input type="number" min="0" max="50" value={selectedEl.strokeWidth || 0} onChange={e => updateEl(selectedId, { strokeWidth: parseInt(e.target.value) })} className="w-full px-2 py-1.5 bg-transparent text-sm font-bold outline-none text-slate-700" />
                     <span className="text-[10px] text-slate-400 font-bold">px</span>
                   </div>
                 </div>
                 
                 <label className="text-[10px] font-bold text-slate-500 block mb-1">Estilo do Contorno</label>
                 <select value={selectedEl.strokeDasharray || 'none'} onChange={e => updateEl(selectedId, { strokeDasharray: e.target.value })} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none font-medium text-slate-700">
                   <option value="none">Sólido</option>
                   <option value="8 4">Tracejado (Largo)</option>
                   <option value="4 2">Tracejado (Curto)</option>
                   <option value="2 4">Pontilhado</option>
                 </select>
               </div>
             </div>
           )}

        </div>
      )}
    </aside>
  );
}
