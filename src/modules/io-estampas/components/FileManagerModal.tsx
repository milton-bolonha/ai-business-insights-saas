import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Folder, Image as ImageIcon, FileText, Upload, Loader2, Calendar, Trash2, AlertTriangle } from 'lucide-react';
import { useWorkspaceStore } from '@/lib/stores/workspaceStore';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  setTitle: (t: string) => void;
  onLoadArtwork: (data: any) => void;
  onCreateNew?: () => void;
}

export function FileManagerModal({ isOpen, onClose, title, setTitle, onLoadArtwork, onCreateNew }: Props) {
  const currentWorkspace = useWorkspaceStore(state => state.currentWorkspace);
  const currentDashboard = useWorkspaceStore(state => state.currentDashboard);
  const [loading, setLoading] = useState(false);
  const [selectedYear, setSelectedYear] = useState<string>(new Date().getFullYear().toString());
  const [selectedMonth, setSelectedMonth] = useState<string>((new Date().getMonth() + 1).toString().padStart(2, '0'));
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const removeTileFromDashboard = useWorkspaceStore(state => state.removeTileFromDashboard);

  const handleDelete = (e: React.MouseEvent, fileId: string) => {
    e.stopPropagation();
    if (!currentWorkspace || !currentDashboard) return;
    removeTileFromDashboard(currentWorkspace.id, currentDashboard.id, fileId);
    setDeletingId(null);
  };

  // Get real files from dashboard
  const estampas = currentDashboard?.tiles?.filter(t => t.id.startsWith("io_estampas_")) || [];
  
  const mockFiles = estampas.map(t => {
     let dateStr = "2026-06-16";
     if (t.createdAt) {
        const d = new Date(t.createdAt);
        dateStr = d.toISOString().split('T')[0];
     }
     return {
       id: t.id,
       name: t.title || 'Estampa Sem Título',
       type: 'json',
       date: dateStr,
       data: t.metadata
     };
  });

  const currentMonth = (new Date().getMonth() + 1).toString().padStart(2, '0');
  
  const monthsWithFiles = new Set<string>();
  mockFiles.forEach(f => {
    const [, m] = f.date.split('-');
    if (m) monthsWithFiles.add(m);
  });
  monthsWithFiles.add(currentMonth);
  const availableMonths = Array.from(monthsWithFiles).sort();

  const displayedFiles = mockFiles.filter(f => {
    const [, m] = f.date.split('-');
    return m === selectedMonth;
  });

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div 
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4"
        onClick={onClose}
      >
        <motion.div 
          initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
          className="bg-white rounded-2xl shadow-xl w-full max-w-4xl h-[80vh] flex flex-col overflow-hidden"
          onClick={e => e.stopPropagation()}
        >
          <div className="flex items-center justify-between p-5 border-b border-slate-100 bg-slate-50/50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-indigo-100 text-indigo-600 rounded-xl flex items-center justify-center">
                <Folder size={20} />
              </div>
              <div>
                <h2 className="font-bold text-slate-800">Gerenciador de Arquivos</h2>
                <p className="text-xs text-slate-500">Workspace: {currentWorkspace?.name}</p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-lg text-slate-400 transition-colors">
              <X size={20} />
            </button>
          </div>

          <div className="flex flex-1 overflow-hidden">
            <div className="w-64 bg-slate-50 border-r border-slate-100 p-4 flex flex-col gap-4 overflow-y-auto shrink-0">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Navegação</h3>
              
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-sm font-bold text-slate-700 bg-white border border-slate-200 rounded-lg p-2 shadow-sm">
                  <Calendar size={16} className="text-indigo-500"/>
                  2026
                </div>
                <div className="pl-6 space-y-1 mt-1">
                  {availableMonths.map(m => (
                    <button 
                      key={m}
                      onClick={() => setSelectedMonth(m)}
                      className={`w-full text-left px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${selectedMonth === m ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-200'}`}
                    >
                      Mês {m}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex-1 p-6 bg-white overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-slate-800">Arquivos - {selectedMonth}/2026</h3>
                <div className="flex items-center gap-2">
                  <button onClick={() => onCreateNew && onCreateNew()} className="px-4 py-2 bg-indigo-50 text-indigo-700 text-sm font-bold rounded-lg hover:bg-indigo-100 transition-colors flex items-center gap-2">
                    Nova Estampa
                  </button>
                  <button className="px-4 py-2 bg-indigo-600 text-white text-sm font-bold rounded-lg shadow-sm hover:bg-indigo-700 transition-colors flex items-center gap-2">
                    <Upload size={16} /> Fazer Upload
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-4 gap-4">
                {displayedFiles.length === 0 && <p className="text-sm text-slate-400 col-span-4 p-4">Nenhuma estampa encontrada neste mês.</p>}
                {displayedFiles.map(file => (
                  <div key={file.id} 
                    onClick={() => { if (!deletingId) onLoadArtwork(file); }}
                    className="border border-slate-200 rounded-xl p-4 flex flex-col gap-3 hover:border-indigo-300 hover:shadow-md transition-all cursor-pointer group bg-slate-50/50 relative overflow-hidden"
                  >
                    {deletingId === file.id ? (
                      <div className="absolute inset-0 bg-red-50/95 backdrop-blur-sm z-10 flex flex-col items-center justify-center p-3 text-center animate-in fade-in zoom-in-95">
                         <AlertTriangle size={24} className="text-red-500 mb-2" />
                         <p className="text-xs font-bold text-red-900 mb-3">Excluir estampa?</p>
                         <div className="flex items-center gap-2 w-full">
                           <button onClick={(e) => { e.stopPropagation(); setDeletingId(null); }} className="flex-1 py-1.5 bg-white border border-slate-200 rounded text-xs font-bold text-slate-600 hover:bg-slate-50">Cancelar</button>
                           <button onClick={(e) => handleDelete(e, file.id)} className="flex-1 py-1.5 bg-red-500 rounded text-xs font-bold text-white hover:bg-red-600">Excluir</button>
                         </div>
                      </div>
                    ) : null}
                    
                    <div className="flex justify-between items-start">
                      <div className="w-12 h-12 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-slate-400 group-hover:text-indigo-500 group-hover:border-indigo-200 transition-colors">
                        {file.type === 'json' ? <FileText size={24}/> : file.type === 'pdf' ? <FileText size={24}/> : <ImageIcon size={24}/>}
                      </div>
                      <button 
                        onClick={(e) => { e.stopPropagation(); setDeletingId(file.id); }}
                        className="opacity-0 group-hover:opacity-100 p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                        title="Excluir Estampa"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-700 truncate" title={file.name}>{file.name}</h4>
                      <p className="text-[10px] text-slate-400 mt-0.5">{file.date}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
