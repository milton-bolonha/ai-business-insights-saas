// @ts-nocheck
import React from "react";
import { OSEntity } from "../types/OSEntity";
import { Clock, CheckCircle, Circle, AlertCircle, Archive } from "lucide-react";
import { useUser } from "@/lib/stores/authStore";

interface OSTasksGlobalBoardProps {
  osList: OSEntity[];
  onUpdateTask: (osId: string, taskId: string, updates: any) => void;
}

export function OSTasksGlobalBoard({ osList, onUpdateTask }: OSTasksGlobalBoardProps) {
  const user = useUser();
  const isAdmin = user?.role === 'admin' || user?.globalRole === 'admin';

  // Aggregate all tasks and filter out archived ones
  const allTasks = osList.flatMap(os => 
    (os.tasks || []).map(task => ({ ...task, osId: os.id, osTitle: os.title, osNumber: os.osNumber }))
  ).filter(t => !t.isArchived);

  // Filter visibility based on role
  const visibleTasks = allTasks.filter(t => {
    if (isAdmin) return true;
    if (!t.assigneeName) return true; // Unassigned are visible
    if (user?.name && t.assigneeName.toLowerCase().includes(user.name.toLowerCase())) return true;
    if (user?.sector && t.assigneeName.toLowerCase().includes(user.sector.toLowerCase())) return true;
    return false;
  });

  const columns = [
    { id: "todo", title: "A Fazer", status: "todo", color: "bg-gray-100 border-gray-200 text-gray-800" },
    { id: "in_progress", title: "Em Andamento", status: "in_progress", color: "bg-blue-50 border-blue-200 text-blue-800" },
    { id: "done", title: "Concluídas", status: "done", color: "bg-emerald-50 border-emerald-200 text-emerald-800" }
  ];

  return (
    <div className="flex h-full p-8 gap-6 overflow-x-auto items-start">
      {columns.map(col => {
        const colTasks = visibleTasks.filter(t => t.status === col.status);
        
        return (
          <div key={col.id} className={`w-80 shrink-0 flex flex-col rounded-2xl border ${col.color} h-full max-h-full`}>
            <div className="p-4 border-b border-black/5 flex justify-between items-center">
              <h3 className="font-bold uppercase tracking-wider text-xs">{col.title}</h3>
              <span className="bg-white/50 px-2 py-0.5 rounded-full text-[10px] font-black">{colTasks.length}</span>
            </div>
            <div className="p-3 flex-1 overflow-y-auto flex flex-col gap-3">
              {colTasks.length === 0 ? (
                <div className="text-center p-6 text-xs font-semibold opacity-50 uppercase tracking-widest">
                  Vazio
                </div>
              ) : (
                colTasks.map(task => (
                  <div key={task.id} className="bg-white p-4 rounded-xl shadow-sm border border-black/5 hover:shadow-md transition-all flex flex-col gap-2">
                    <div className="flex justify-between items-start">
                      <span className="text-[10px] font-black uppercase text-violet-600 bg-violet-50 px-2 py-0.5 rounded-md">
                        {task.osNumber}
                      </span>
                      <div className="flex gap-1">
                        <button 
                          onClick={() => onUpdateTask(task.osId, task.id, { status: "todo" })}
                          className={`w-5 h-5 rounded-full flex items-center justify-center transition-colors ${task.status === 'todo' ? 'bg-gray-200 text-gray-700' : 'text-gray-300 hover:bg-gray-100 hover:text-gray-600'}`}
                        >
                          <Circle className="w-3 h-3" />
                        </button>
                        <button 
                          onClick={() => onUpdateTask(task.osId, task.id, { status: "in_progress" })}
                          className={`w-5 h-5 rounded-full flex items-center justify-center transition-colors ${task.status === 'in_progress' ? 'bg-blue-200 text-blue-700' : 'text-gray-300 hover:bg-blue-50 hover:text-blue-600'}`}
                        >
                          <Clock className="w-3 h-3" />
                        </button>
                        <button 
                          onClick={() => onUpdateTask(task.osId, task.id, { status: "done" })}
                          className={`w-5 h-5 rounded-full flex items-center justify-center transition-colors ${task.status === 'done' ? 'bg-emerald-200 text-emerald-700' : 'text-gray-300 hover:bg-emerald-50 hover:text-emerald-600'}`}
                        >
                          <CheckCircle className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                    
                    <h4 className="text-sm font-bold text-gray-900 leading-tight">{task.title}</h4>
                    
                    {task.description && (
                      <p className="text-xs text-gray-500 line-clamp-2">{task.description}</p>
                    )}
                    
                    <div className="flex justify-between items-center mt-2 pt-2 border-t border-gray-50">
                      {task.assigneeName ? (
                        <span className="text-[10px] font-bold text-slate-500 flex items-center gap-1 truncate max-w-[120px]" title={task.assigneeName}>
                          👤 {task.assigneeName}
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold text-slate-400 italic">Não atribuído</span>
                      )}
                      
                      {task.priority && (
                        <span className={`text-[9px] uppercase font-bold px-1.5 py-0.5 rounded border ${task.priority === 'urgent' ? 'bg-red-50 text-red-700 border-red-200' : task.priority === 'high' ? 'bg-orange-50 text-orange-700 border-orange-200' : 'bg-gray-50 text-gray-600 border-gray-200'}`}>
                          {task.priority}
                        </span>
                      )}
                      
                      {task.status === 'done' && isAdmin && (
                        <button
                          onClick={() => onUpdateTask(task.osId, task.id, { isArchived: true })}
                          className="flex items-center gap-1 text-[10px] font-bold text-gray-500 hover:text-emerald-600 transition-colors bg-gray-100 hover:bg-emerald-50 px-2 py-1 rounded"
                          title="Arquivar tarefa"
                        >
                          <Archive className="w-3 h-3" /> Arquivar
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
