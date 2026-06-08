import React from 'react';
import { OSEntity, OSStatus } from '../types/OSEntity';
import { LayoutGrid, List as ListIcon, Check, Clock, Circle, AlertCircle, Archive, Star, Filter } from 'lucide-react';
import { OSStatusBadge } from './OSStatusBadge';
import { useUser } from "@/lib/stores/authStore";

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
  onUpdateTask?: (osId: string, taskId: string, updates: any) => void;
}

export const GenericSectorBoard: React.FC<GenericSectorBoardProps> = ({ queue, columns, viewMode, onViewModeChange, onSelectOS, onUpdateTask }) => {
  const user = useUser();
  const isAdmin = user?.role === 'admin' || user?.globalRole === 'admin';

  const acceptedStatuses = columns.flatMap(c => c.statuses);
  const listQueue = queue.filter(os => acceptedStatuses.includes(os.status));
  
  // Extrair e filtrar as tarefas das OSs deste setor
  const allSectorTasks = listQueue.flatMap(os => 
    (os.tasks || []).map(t => ({ ...t, osId: os.id, osTitle: os.title, osNumber: os.osNumber }))
  ).filter(t => !t.isArchived);

  // Filtragem de acesso as tarefas
  const visibleTasks = allSectorTasks.filter(t => {
    if (isAdmin) return true;
    if (!t.assigneeName) return true;
    if (user?.name && t.assigneeName.toLowerCase().includes(user.name.toLowerCase())) return true;
    if (user?.sector && t.assigneeName.toLowerCase().includes(user.sector.toLowerCase())) return true;
    return false;
  });

  const [taskFilter, setTaskFilter] = React.useState<string>('all');

  const priorityWeight: Record<string, number> = { urgent: 4, high: 3, medium: 2, low: 1 };

  const processedTasks = visibleTasks
    .filter(t => taskFilter === 'all' || t.status === taskFilter)
    .sort((a, b) => {
      if (a.isFeatured && !b.isFeatured) return -1;
      if (!a.isFeatured && b.isFeatured) return 1;
      
      const pA = priorityWeight[a.priority || 'medium'] || 2;
      const pB = priorityWeight[b.priority || 'medium'] || 2;
      if (pA !== pB) return pB - pA;
      
      return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
    });
  
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
                          <span className={`w-2 h-2 rounded-full bg-${col.color}-400 inline-block`} style={{ backgroundColor: col.color === 'emerald' ? '#34d399' : col.color === 'blue' ? '#60a5fa' : col.color === 'orange' ? '#fb923c' : col.color === 'violet' ? '#a78bfa' : col.color === 'amber' ? '#fbbf24' : col.color === 'gray' ? '#9ca3af' : col.color === 'yellow' ? '#facc15' : col.color === 'pink' ? '#f472b6' : col.color === 'fuchsia' ? '#e879f9' : col.color === 'teal' ? '#2dd4bf' : '#9ca3af' }}></span>
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
        
        {/* COLUNA ÚNICA DE TAREFAS */}
        <div className="flex gap-4 border-r-2 border-dashed border-gray-200 pr-6 mr-2 shrink-0">
          <div className="w-[340px] shrink-0 flex flex-col rounded-xl border border-violet-200 bg-violet-50/30 h-full">
            <div className="p-3 border-b border-violet-100 flex flex-col gap-2 bg-white/50 rounded-t-xl">
              <div className="flex justify-between items-center">
                <h3 className="font-bold text-xs uppercase tracking-wider text-violet-800">Tarefas do Setor</h3>
                <span className="bg-white px-2 py-0.5 rounded-full text-[10px] font-black shadow-sm text-violet-700">{processedTasks.length}</span>
              </div>
              <div className="flex items-center gap-2">
                <Filter className="w-3 h-3 text-gray-400" />
                <select 
                  className="text-[10px] bg-white border border-gray-200 rounded px-1 py-0.5 outline-none text-gray-600 cursor-pointer"
                  value={taskFilter}
                  onChange={(e) => setTaskFilter(e.target.value)}
                >
                  <option value="all">Todas</option>
                  <option value="todo">Para Iniciar</option>
                  <option value="in_progress">Em Andamento</option>
                  <option value="done">Concluídas</option>
                </select>
              </div>
            </div>
            <div className="p-3 flex-1 overflow-y-auto space-y-3">
              {processedTasks.length === 0 ? (
                <div className="text-center p-4 text-xs font-semibold opacity-50 uppercase tracking-widest border-2 border-dashed border-violet-200 rounded-lg">Vazio</div>
              ) : (
                processedTasks.map(task => (
                  <div key={task.id} className={`bg-white p-3 rounded-lg shadow-sm border transition-all flex flex-col gap-2 ${task.isFeatured ? 'border-yellow-400 shadow-[0_0_10px_rgba(250,204,21,0.2)]' : 'border-black/5 hover:border-violet-300'}`}>
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-2">
                        {task.isFeatured && <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />}
                        <span className="text-[10px] font-black uppercase text-violet-600 bg-violet-50 px-1.5 py-0.5 rounded">
                          {task.osNumber}
                        </span>
                        {task.priority === 'urgent' && <span className="text-[9px] uppercase font-bold px-1.5 py-0.5 rounded bg-red-50 text-red-700 border border-red-200">Urgente</span>}
                        {task.priority === 'high' && <span className="text-[9px] uppercase font-bold px-1.5 py-0.5 rounded bg-orange-50 text-orange-700 border border-orange-200">Alta</span>}
                      </div>
                      
                      {/* Controles de Status Diretos */}
                      <div className="flex gap-1">
                        <button onClick={() => onUpdateTask?.(task.osId, task.id, { status: "todo" })} title="Para Iniciar" className={`w-5 h-5 rounded-full flex items-center justify-center transition-colors ${task.status === 'todo' ? 'bg-gray-200 text-gray-700' : 'text-gray-300 hover:bg-gray-100'}`}><Circle className="w-3 h-3" /></button>
                        <button onClick={() => onUpdateTask?.(task.osId, task.id, { status: "in_progress" })} title="Em Andamento" className={`w-5 h-5 rounded-full flex items-center justify-center transition-colors ${task.status === 'in_progress' ? 'bg-blue-200 text-blue-700' : 'text-gray-300 hover:bg-blue-50'}`}><Clock className="w-3 h-3" /></button>
                        <button onClick={() => onUpdateTask?.(task.osId, task.id, { status: "done" })} title="Concluída" className={`w-5 h-5 rounded-full flex items-center justify-center transition-colors ${task.status === 'done' ? 'bg-emerald-200 text-emerald-700' : 'text-gray-300 hover:bg-emerald-50'}`}><Check className="w-3 h-3" /></button>
                        
                        {/* Toggle Destaque */}
                        <button onClick={() => onUpdateTask?.(task.osId, task.id, { isFeatured: !task.isFeatured })} title="Destaque" className={`w-5 h-5 ml-1 rounded-full flex items-center justify-center transition-colors ${task.isFeatured ? 'bg-yellow-100 text-yellow-600' : 'text-gray-300 hover:bg-yellow-50 hover:text-yellow-500'}`}><Star className="w-3 h-3" /></button>
                      </div>
                    </div>
                    
                    <h4 className={`text-xs font-bold leading-tight ${task.status === 'done' ? 'text-gray-400 line-through' : 'text-gray-900'}`}>{task.title}</h4>
                    
                    <div className="flex justify-between items-center mt-1 pt-2 border-t border-gray-50">
                      <span className="text-[10px] font-bold text-slate-500 truncate" title={task.assigneeName || 'Não atribuído'}>👤 {task.assigneeName || 'Livre'}</span>
                      {task.status === 'done' && (isAdmin || (user?.name && task.assigneeName?.includes(user.name))) && (
                        <button onClick={() => onUpdateTask?.(task.osId, task.id, { isArchived: true })} className="flex items-center gap-1 text-[9px] font-bold text-gray-500 hover:text-emerald-600 bg-gray-100 hover:bg-emerald-50 px-1.5 py-0.5 rounded" title="Arquivar tarefa"><Archive className="w-3 h-3" /> Arquivar</button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* COLUNAS DE OS */}
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
