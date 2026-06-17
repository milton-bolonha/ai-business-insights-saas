import React, { useState } from 'react';
import { GripVertical, Trash2, ChevronLeft, ChevronRight, Layers as LayersIcon, Eye, EyeOff, Plus } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Props {
  elements: any[];
  selectedId: string | null;
  setSelectedId: (id: string | null) => void;
  setEditingId: (id: string | null) => void;
  removeEl: (id: string) => void;
  updateEl: (id: string, changes: any, saveHist?: boolean) => void;
  setActiveEstampaId: (id: string | null) => void;
  handleDropLayer: () => void;
  draggedLayerId: string | null;
  setDraggedLayerId: (id: string | null) => void;
  dragOverLayerId: string | null;
  setDragOverLayerId: (id: string | null) => void;
  dropSide: 'top' | 'bottom' | null;
  setDropSide: (side: 'top' | 'bottom' | null) => void;
  title: string;
  setTitle: (title: string) => void;
  openFileManager: () => void;
}

export function SidebarLeft({
  elements, selectedId, setSelectedId, setEditingId, removeEl, updateEl, setActiveEstampaId,
  handleDropLayer, draggedLayerId, setDraggedLayerId, dragOverLayerId, setDragOverLayerId, dropSide, setDropSide,
  title, setTitle, openFileManager
}: Props) {
  const [collapsed, setCollapsed] = useState(false);

  const uniqueColorsCount = new Set(elements.filter(e => e.type !== 'image' && e.color).map(e => e.color)).size;

  return (
    <motion.aside 
      initial={false}
      animate={{ 
         width: collapsed ? 'auto' : 256,
         height: collapsed ? 56 : 'auto'
      }}
      className={`bg-white border border-slate-200 flex z-20 shadow-xl shrink-0 absolute left-4 top-16 rounded-2xl ${collapsed ? 'flex-row items-center px-4' : 'flex-col max-h-[calc(100vh-8rem)]'} transition-all duration-300`}
    >
      {/* Toggle Button */}
      <button 
        onClick={() => setCollapsed(!collapsed)}
        className={`absolute ${collapsed ? '-right-3 top-1/2 -translate-y-1/2' : '-right-3 top-6'} w-6 h-6 bg-white border border-slate-200 rounded-full flex items-center justify-center text-slate-500 hover:text-indigo-600 shadow-sm z-30`}
      >
        {collapsed ? <ChevronRight size={14}/> : <ChevronLeft size={14}/>}
      </button>

      <div className={`flex-1 flex flex-col ${collapsed ? 'overflow-visible' : 'overflow-hidden'}`}>

      {collapsed ? (
        <div className="flex flex-row items-center space-x-3 mr-2">
           <button onClick={openFileManager} className="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-600">
             <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.93a2 2 0 0 1-1.66-.9l-.82-1.2A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13c0 1.1.9 2 2 2Z"/></svg>
           </button>
           <LayersIcon size={20} className="text-slate-400" />
           <div className="text-[10px] font-bold text-slate-400 bg-slate-100 rounded px-1">{elements.length}</div>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto flex flex-col" onClick={(e) => { if(e.target===e.currentTarget) setSelectedId(null); }}>
          
          {/* File Manager & Title Header */}
          <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex flex-col gap-3 shrink-0">
             <div className="flex items-center gap-2">
                <button onClick={openFileManager} title="Arquivos" className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-100 flex flex-shrink-0 items-center justify-center text-indigo-600 hover:bg-indigo-100 transition-colors">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.93a2 2 0 0 1-1.66-.9l-.82-1.2A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13c0 1.1.9 2 2 2Z"/></svg>
                </button>
                <input 
                  value={title} 
                  onChange={e => setTitle(e.target.value)} 
                  placeholder="Sem título" 
                  className="w-full bg-transparent border-b border-transparent hover:border-slate-300 focus:border-indigo-500 outline-none text-sm font-bold text-slate-700 px-1 py-1 transition-colors"
                />
                <button onClick={() => setActiveEstampaId(null)} title="Nova Estampa" className="w-8 h-8 rounded-lg hover:bg-slate-200 flex flex-shrink-0 items-center justify-center text-slate-400 hover:text-indigo-600 transition-colors">
                  <Plus size={16}/>
                </button>
             </div>
          </div>

          <div className="px-4 py-3 flex items-center justify-between bg-slate-50 border-b border-slate-100 mb-2 pointer-events-none shrink-0">
             <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Camadas ({elements.length})</div>
             <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Cores ({uniqueColorsCount})</div>
          </div>
          
          <div className="px-2 space-y-1 overflow-y-auto flex-1 pb-4">
          {[...elements].reverse().map((el) => (
            <div 
              key={el.id} 
              draggable
              onDragStart={() => setDraggedLayerId(el.id)}
              onDragOver={(e) => {
                e.preventDefault();
                const rect = e.currentTarget.getBoundingClientRect();
                const y = e.clientY - rect.top;
                setDropSide(y < rect.height / 2 ? 'top' : 'bottom');
                setDragOverLayerId(el.id);
              }}
              onDragLeave={() => setDragOverLayerId(null)}
              onDrop={handleDropLayer}
              onClick={() => {
                if (selectedId === el.id) { setSelectedId(null); setEditingId(null); } 
                else { setSelectedId(el.id); } // setActiveRightPanel will be handled in parent
              }}
              className={`relative group flex items-center justify-between p-2 rounded-lg cursor-pointer text-xs transition-colors border
                ${selectedId === el.id ? 'bg-indigo-50 border-indigo-200 text-indigo-700 font-bold shadow-sm' : 'bg-transparent border-transparent text-slate-600 hover:bg-slate-50'}`}
            >
              {/* Visual Snap Indicator */}
              {dragOverLayerId === el.id && (
                <div className={`absolute left-0 right-0 h-0.5 bg-indigo-500 rounded z-10 ${dropSide === 'top' ? '-top-0.5' : '-bottom-0.5'}`} />
              )}

              <div className="flex items-center gap-2 truncate flex-1">
                <GripVertical size={12} className="text-slate-300 opacity-0 group-hover:opacity-100 cursor-grab active:cursor-grabbing" />
                {el.type !== 'image' && <div className="w-2.5 h-2.5 rounded-full shadow-sm shrink-0 border border-slate-200" style={{backgroundColor: el.color}} />}
                <span className={`truncate select-none ${el.hidden ? 'text-slate-400 line-through' : ''}`}>{el.layerName || (el.type === 'text' ? el.content?.substring(0,15) : el.type)}</span>
              </div>

              <div className="flex items-center gap-1">
                <button 
                  onClick={(e) => { e.stopPropagation(); updateEl(el.id, { hidden: !el.hidden }, false); }} 
                  className={`p-1.5 hover:bg-slate-200 rounded text-slate-400 transition-opacity ${selectedId === el.id || el.hidden ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}
                  title={el.hidden ? "Mostrar Camada" : "Ocultar Camada"}
                >
                  {el.hidden ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>

                <button 
                  onClick={(e) => { e.stopPropagation(); removeEl(el.id); }} 
                  className={`p-1.5 hover:bg-red-100 rounded text-red-500 transition-opacity ${selectedId === el.id ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}
                  title="Excluir Camada"
                >
                  <Trash2 size={14}/>
                </button>
              </div>
            </div>
          ))}
          {elements.length === 0 && <p className="text-xs text-slate-400 text-center p-4">Nenhuma camada</p>}
          </div>
        </div>
      )}
      </div>
    </motion.aside>
  );
}
