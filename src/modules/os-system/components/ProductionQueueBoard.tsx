import React, { useState } from 'react';
import { OSEntity } from '../types/OSEntity';
import { Check, Clock, Play, ArrowRight, X } from 'lucide-react';

interface ProductionQueueBoardProps {
  queue: OSEntity[];
  onUpdateOS: (osId: string, updates: Partial<OSEntity>) => void;
}

export const ProductionQueueBoard: React.FC<ProductionQueueBoardProps> = ({ queue, onUpdateOS }) => {
  const [selectedOS, setSelectedOS] = useState<OSEntity | null>(null);

  const pending = queue.filter(os => os.status === 'production_pending');
  const inProgress = queue.filter(os => os.status === 'in_production');
  const completed = queue.filter(os => os.status === 'production_completed');

  const moveOS = (os: OSEntity, newStatus: OSEntity['status']) => {
    onUpdateOS(os.id, { 
      status: newStatus,
      activityLog: [
        { id: crypto.randomUUID(), action: 'Atualização de Produção', description: `Movido para ${newStatus.replace('_', ' ')}`, timestamp: new Date().toISOString() },
        ...(os.activityLog || [])
      ]
    });
  };

  const finishAndSendToDelivery = (os: OSEntity) => {
    onUpdateOS(os.id, { 
      status: 'ready_for_pickup',
      completionDate: new Date().toISOString(),
      activityLog: [
        { id: crypto.randomUUID(), action: 'Produção Concluída', description: 'Enviado para Retirada/Entrega.', timestamp: new Date().toISOString() },
        ...(os.activityLog || [])
      ]
    });
    setSelectedOS(null);
  };

  const Column = ({ title, items, color, nextAction }: { title: string, items: OSEntity[], color: string, nextAction?: (os: OSEntity) => void }) => (
    <div className="flex-1 bg-gray-50/50 rounded-xl border border-gray-200 p-4 min-w-[300px]">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-bold text-gray-800">{title}</h3>
        <span className={`bg-${color}-100 text-${color}-800 text-xs font-bold px-2 py-0.5 rounded-full`}>{items.length}</span>
      </div>
      <div className="space-y-3">
        {items.map(os => (
          <div key={os.id} className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm hover:border-violet-300 transition-colors cursor-pointer group" onClick={() => setSelectedOS(os)}>
            <div className="flex justify-between items-start mb-2">
              <span className="font-mono text-xs text-gray-500">{os.osNumber}</span>
              {nextAction && (
                <button 
                  onClick={(e) => { e.stopPropagation(); nextAction(os); }}
                  className="text-gray-400 hover:text-violet-600 p-1 rounded-md hover:bg-violet-50 transition-colors"
                  title="Mover para próxima etapa"
                >
                  <ArrowRight className="w-4 h-4" />
                </button>
              )}
            </div>
            <h4 className="font-medium text-gray-900 text-sm mb-1">{os.title}</h4>
            <p className="text-xs text-gray-500 line-clamp-2">{os.description}</p>
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

  return (
    <div className="flex flex-col h-full">
      <div className="flex gap-6 overflow-x-auto pb-4 h-full">
        <Column 
          title="Fila (Aguardando)" 
          items={pending} 
          color="gray"
          nextAction={(os) => moveOS(os, 'in_production')}
        />
        <Column 
          title="Em Produção" 
          items={inProgress} 
          color="blue"
          nextAction={(os) => moveOS(os, 'production_completed')}
        />
        <Column 
          title="Concluído (Validar)" 
          items={completed} 
          color="emerald"
        />
      </div>

      {/* Selected OS Details Panel */}
      {selectedOS && (
        <div className="fixed inset-y-0 right-0 w-96 bg-white shadow-2xl border-l border-gray-200 p-6 overflow-y-auto z-50 animate-in slide-in-from-right-full duration-300">
          <div className="flex justify-between items-start mb-6">
            <div>
              <span className="text-xs font-mono text-gray-500">{selectedOS.osNumber}</span>
              <h2 className="text-xl font-bold text-gray-900 mt-1">{selectedOS.title}</h2>
            </div>
            <button onClick={() => setSelectedOS(null)} className="p-2 text-gray-400 hover:bg-gray-100 rounded-full transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="space-y-6">
            <div className="p-4 bg-gray-50 rounded-xl text-sm text-gray-700 whitespace-pre-wrap">
              {selectedOS.description}
            </div>

            <div>
              <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wider mb-3">Progresso das Tarefas</h3>
              <div className="space-y-2">
                {selectedOS.tasks?.map(task => (
                  <div key={task.id} className="flex items-center gap-3">
                     <div className={`w-4 h-4 rounded border flex items-center justify-center ${task.status === 'done' ? 'bg-emerald-500 border-emerald-500 text-white' : 'bg-white border-gray-300'}`}>
                       {task.status === 'done' && <Check className="w-3 h-3" />}
                     </div>
                     <span className={`text-sm ${task.status === 'done' ? 'text-gray-400 line-through' : 'text-gray-700'}`}>{task.title}</span>
                  </div>
                ))}
                {(!selectedOS.tasks || selectedOS.tasks.length === 0) && (
                  <p className="text-sm text-gray-400 italic">Nenhuma sub-tarefa.</p>
                )}
              </div>
            </div>

            <div className="pt-6 border-t border-gray-100">
              {selectedOS.status === 'production_pending' && (
                <button onClick={() => moveOS(selectedOS, 'in_production')} className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium shadow-sm transition-colors flex items-center justify-center gap-2">
                  <Play className="w-4 h-4" /> Iniciar Produção
                </button>
              )}
              {selectedOS.status === 'in_production' && (
                <button onClick={() => moveOS(selectedOS, 'production_completed')} className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-medium shadow-sm transition-colors flex items-center justify-center gap-2">
                  <Check className="w-4 h-4" /> Finalizar Produção
                </button>
              )}
              {selectedOS.status === 'production_completed' && (
                <button onClick={() => finishAndSendToDelivery(selectedOS)} className="w-full py-3 bg-violet-600 hover:bg-violet-700 text-white rounded-xl font-medium shadow-sm transition-colors flex items-center justify-center gap-2">
                  <ArrowRight className="w-4 h-4" /> Enviar para Retirada/Entrega
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};