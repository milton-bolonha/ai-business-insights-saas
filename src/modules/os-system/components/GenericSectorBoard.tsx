import React from 'react';
import { OSEntity, OSStatus } from '../types/OSEntity';
import { LayoutGrid, List as ListIcon, Check, Clock } from 'lucide-react';
import { OSStatusBadge } from './OSStatusBadge';

export interface SectorColumnDef {
  id: string;
  title: string;
  statuses: OSStatus[];
  color: string;
}

interface GenericSectorBoardProps {
  queue: OSEntity[];
  columns: SectorColumnDef[];
  viewMode: 'kanban' | 'list';
  onViewModeChange: (mode: 'kanban' | 'list') => void;
  onSelectOS: (os: OSEntity) => void;
}

export const GenericSectorBoard: React.FC<GenericSectorBoardProps> = ({ queue, columns, viewMode, onViewModeChange, onSelectOS }) => {
  const acceptedStatuses = columns.flatMap(c => c.statuses);
  const listQueue = queue.filter(os => acceptedStatuses.includes(os.status));
  
  if (viewMode === 'list') {
    return (
      <div className="flex flex-col h-full bg-white">
        <div className="flex justify-end p-4 border-b border-gray-100">
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button onClick={() => onViewModeChange('kanban')} className="p-1.5 rounded-md transition-colors text-gray-500 hover:text-gray-700"><LayoutGrid className="w-4 h-4" /></button>
            <button onClick={() => onViewModeChange('list')} className="p-1.5 rounded-md transition-colors bg-white shadow-sm text-gray-800"><ListIcon className="w-4 h-4" /></button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200 text-xs uppercase tracking-wider text-gray-500">
                <th className="p-4 font-medium">OS Number</th>
                <th className="p-4 font-medium">Título</th>
                <th className="p-4 font-medium">Cliente</th>
                <th className="p-4 font-medium">Status</th>
                <th className="p-4 font-medium">Progresso</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {columns.map(col => {
                const items = queue.filter(os => col.statuses.includes(os.status));
                return (
                  <React.Fragment key={col.id}>
                    {/* Cabeçalho do Grupo */}
                    <tr className="bg-gray-50/50">
                      <td colSpan={5} className="px-6 py-3 border-y border-gray-200">
                        <div className="flex items-center gap-2">
                          <span className={`w-2 h-2 rounded-full bg-${col.color}-400 inline-block`} style={{ backgroundColor: col.color === 'emerald' ? '#34d399' : col.color === 'blue' ? '#60a5fa' : col.color === 'orange' ? '#fb923c' : col.color === 'violet' ? '#a78bfa' : col.color === 'amber' ? '#fbbf24' : '#9ca3af' }}></span>
                          <span className="text-xs font-bold text-gray-700 uppercase tracking-wider">{col.title}</span>
                          <span className="bg-white px-2 py-0.5 rounded border border-gray-200 text-gray-500 text-[10px] font-bold shadow-sm">{items.length}</span>
                        </div>
                      </td>
                    </tr>
                    
                    {/* Linhas da Tabela */}
                    {items.map(os => (
                      <tr key={os.id} onClick={() => onSelectOS(os)} className="hover:bg-violet-50/50 cursor-pointer transition-colors bg-white group">
                        <td className="px-6 py-4 text-sm font-mono text-gray-500 group-hover:text-violet-600 transition-colors">{os.osNumber}</td>
                        <td className="px-6 py-4 text-sm font-semibold text-gray-900">{os.title}</td>
                        <td className="px-6 py-4 text-sm text-gray-600">{os.customer?.name}</td>
                        <td className="px-6 py-4 text-sm"><OSStatusBadge status={os.status} /></td>
                        <td className="px-6 py-4 text-sm text-gray-500">
                          {os.tasks && os.tasks.length > 0 ? (
                            <div className="flex items-center gap-1.5 bg-gray-50 px-2 py-1 rounded-md border border-gray-100 w-fit">
                              <Check className="w-3 h-3 text-emerald-500" /> 
                              <span className="font-medium text-xs">{os.tasks.filter(t => t.status === 'done').length}/{os.tasks.length}</span>
                            </div>
                          ) : <span className="text-gray-300">-</span>}
                        </td>
                      </tr>
                    ))}

                    {/* Estado Vazio Alinhado */}
                    {items.length === 0 && (
                      <tr className="bg-white">
                        <td colSpan={5} className="px-6 py-4 text-sm text-gray-400 italic">
                          Nenhum projeto nesta etapa no momento.
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex justify-end p-4">
        <div className="flex bg-gray-100 rounded-lg p-1">
          <button onClick={() => onViewModeChange('kanban')} className="p-1.5 rounded-md transition-colors bg-white shadow-sm text-gray-800"><LayoutGrid className="w-4 h-4" /></button>
          <button onClick={() => onViewModeChange('list')} className="p-1.5 rounded-md transition-colors text-gray-500 hover:text-gray-700"><ListIcon className="w-4 h-4" /></button>
        </div>
      </div>

      <div className="flex gap-6 overflow-x-auto pb-4 h-full px-6">
        {columns.map(col => {
          const items = queue.filter(os => col.statuses.includes(os.status));
          return (
            <div key={col.id} className="flex-1 bg-gray-50/50 rounded-xl border border-gray-200 p-4 min-w-[300px] flex flex-col h-full">
              <div className="flex justify-between items-center mb-4 shrink-0">
                <h3 className="font-bold text-gray-800">{col.title}</h3>
                <span className={`bg-${col.color}-100 text-${col.color}-800 text-xs font-bold px-2 py-0.5 rounded-full`}>{items.length}</span>
              </div>
              <div className="space-y-3 overflow-y-auto flex-1 pr-2">
                {items.map(os => (
                  <div key={os.id} className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm hover:border-violet-300 transition-colors cursor-pointer group" onClick={() => onSelectOS(os)}>
                    <div className="flex justify-between items-start mb-2">
                      <span className="font-mono text-xs text-gray-500">{os.osNumber}</span>
                    </div>
                    <h4 className="font-medium text-gray-900 text-sm mb-1">{os.title}</h4>
                    <p className="text-xs text-gray-500 line-clamp-2">{os.productDetails?.modelo || os.description || 'Sem detalhes'}</p>
                    <div className="mt-3 flex items-center justify-between">
                      <span className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-gray-100 text-gray-600">{os.customer?.name}</span>
                      {os.tasks && os.tasks.length > 0 && (
                        <span className="text-[10px] font-medium text-gray-500 flex items-center gap-1">
                          <Check className="w-3 h-3" /> {os.tasks.filter(t => t.status === 'done').length}/{os.tasks.length}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
                {items.length === 0 && (
                  <div className="p-4 border-2 border-dashed border-gray-200 rounded-lg text-center">
                    <p className="text-xs text-gray-400 font-medium">Vazio</p>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
