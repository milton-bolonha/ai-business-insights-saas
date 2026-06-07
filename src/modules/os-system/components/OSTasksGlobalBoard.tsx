import React from "react";
import { OSEntity } from "../types/OSEntity";
import { Clock, CheckCircle, Circle, AlertCircle } from "lucide-react";

interface OSTasksGlobalBoardProps {
  osList: OSEntity[];
  onUpdateTask: (osId: string, taskId: string, updates: any) => void;
}

export function OSTasksGlobalBoard({ osList, onUpdateTask }: OSTasksGlobalBoardProps) {
  // Aggregate all tasks
  const allTasks = osList.flatMap(os => 
    (os.tasks || []).map(task => ({ ...task, osId: os.id, osTitle: os.title, osNumber: os.osNumber }))
  );

  const columns = [
    { id: "pending", title: "Pendentes", status: "pending", color: "bg-gray-100 border-gray-200 text-gray-800" },
    { id: "in_progress", title: "Em Andamento", status: "in_progress", color: "bg-blue-50 border-blue-200 text-blue-800" },
    { id: "completed", title: "Concluídas", status: "completed", color: "bg-emerald-50 border-emerald-200 text-emerald-800" }
  ];

  return (
    <div className="flex h-full p-8 gap-6 overflow-x-auto items-start">
      {columns.map(col => {
        const colTasks = allTasks.filter(t => t.status === col.status);
        
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
                          onClick={() => onUpdateTask(task.osId, task.id, { status: "pending" })}
                          className={`w-5 h-5 rounded-full flex items-center justify-center transition-colors ${task.status === 'pending' ? 'bg-gray-200 text-gray-700' : 'text-gray-300 hover:bg-gray-100 hover:text-gray-600'}`}
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
                          onClick={() => onUpdateTask(task.osId, task.id, { status: "completed" })}
                          className={`w-5 h-5 rounded-full flex items-center justify-center transition-colors ${task.status === 'completed' ? 'bg-emerald-200 text-emerald-700' : 'text-gray-300 hover:bg-emerald-50 hover:text-emerald-600'}`}
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
                      {task.assignee ? (
                        <span className="text-[10px] font-bold text-slate-500 flex items-center gap-1">
                          👤 {task.assignee}
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold text-slate-400 italic">Não atribuído</span>
                      )}
                      
                      {task.dueDate && (
                        <span className={`text-[10px] font-bold flex items-center gap-1 ${new Date(task.dueDate) < new Date() && task.status !== 'completed' ? 'text-rose-500' : 'text-gray-400'}`}>
                          📅 {new Date(task.dueDate).toLocaleDateString()}
                        </span>
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
