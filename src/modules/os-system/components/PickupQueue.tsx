import React, { useState } from "react";
import { OSEntity } from "../types/OSEntity";
import { DeliveryScheduler } from "./DeliveryScheduler";
import { CheckCircle, Truck, PackageCheck } from "lucide-react";

interface PickupQueueProps {
  queue: OSEntity[];
  onSelectForDelivery: (os: OSEntity) => void;
  onUpdateOS: (osId: string, updates: Partial<OSEntity>) => void;
}

export const PickupQueue: React.FC<PickupQueueProps> = ({ queue, onSelectForDelivery, onUpdateOS }) => {
  const readyForPickup = queue.filter(os => os.status === 'ready_for_pickup');
  const delivered = queue.filter(os => os.status === 'delivered');
  const [schedulingOS, setSchedulingOS] = useState<string | null>(null);

  const markAsDelivered = (os: OSEntity) => {
    onUpdateOS(os.id, {
      status: 'delivered',
      activityLog: [
        { id: crypto.randomUUID(), action: 'Entrega Realizada', description: 'Equipamento/Projeto entregue ao cliente.', timestamp: new Date().toISOString() },
        ...(os.activityLog || [])
      ]
    });
  };

  return (
    <div className="flex flex-col gap-8 h-full">
      {/* Ready for Pickup Section */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6">
        <div className="flex items-center justify-between mb-6 border-b border-gray-100 pb-4">
          <div>
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <Truck className="w-6 h-6 text-orange-500" />
              Fila de Retirada / Entrega
            </h2>
            <p className="text-sm text-gray-500 mt-1">Equipamentos e projetos prontos aguardando o cliente.</p>
          </div>
          <span className="bg-orange-100 text-orange-800 text-sm font-bold px-4 py-1.5 rounded-full">
            {readyForPickup.length} Pendentes
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {readyForPickup.map((os) => (
            <div key={os.id} className="border border-gray-200 rounded-xl p-5 flex flex-col hover:border-orange-300 hover:shadow-md transition-all bg-gray-50">
              <div className="flex justify-between items-start mb-3">
                <span className="text-xs font-mono text-gray-500">{os.osNumber}</span>
                <span className="text-[10px] uppercase font-bold text-orange-700 bg-orange-100 px-2 py-0.5 rounded">Aguardando</span>
              </div>
              
              <h3 className="text-base font-bold text-gray-900 truncate mb-1" title={os.title}>
                {os.title}
              </h3>
              <p className="text-sm text-gray-600 mb-4">{os.customer?.name}</p>

              <div className="text-sm text-gray-700 mb-5 bg-white p-3 rounded-lg border border-gray-200">
                <div className="flex justify-between mb-1">
                  <span className="text-gray-500">Valor a Receber:</span>
                  <span className="font-semibold">R$ {(os.totalRevenue || 0).toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Status Pgto:</span>
                  <span>{os.isPaid ? <span className="text-emerald-600 font-medium">Pago</span> : <span className="text-red-500 font-medium">Pendente</span>}</span>
                </div>
              </div>

              <div className="mt-auto space-y-3">
                {schedulingOS === os.id ? (
                  <div className="bg-white p-3 border border-gray-200 rounded-lg">
                    <DeliveryScheduler 
                      os={os} 
                      onSchedule={(date) => {
                        onUpdateOS(os.id, { scheduledDeliveryDate: date });
                        setSchedulingOS(null);
                      }} 
                    />
                    <button 
                      onClick={() => setSchedulingOS(null)}
                      className="w-full mt-3 text-xs text-gray-500 hover:text-gray-700 font-medium"
                    >
                      Cancelar Agendamento
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setSchedulingOS(os.id)}
                    className="w-full py-2 bg-white border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 text-sm transition-colors"
                  >
                    {os.scheduledDeliveryDate ? 'Reagendar Entrega' : 'Agendar Entrega'}
                  </button>
                )}
                
                <button
                  onClick={() => markAsDelivered(os)}
                  className="w-full py-2.5 bg-orange-600 text-white font-bold rounded-lg hover:bg-orange-700 text-sm shadow-sm transition-colors flex items-center justify-center gap-2"
                >
                  <PackageCheck className="w-4 h-4" /> Finalizar & Entregue
                </button>
              </div>
            </div>
          ))}

          {readyForPickup.length === 0 && (
            <div className="col-span-full py-16 text-center text-gray-500 border-2 border-dashed border-gray-200 rounded-xl bg-gray-50/50">
              <PackageCheck className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="font-medium">Nenhum equipamento aguardando retirada.</p>
            </div>
          )}
        </div>
      </div>

      {/* Recently Delivered Section (Optional, nice for UX) */}
      {delivered.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6 opacity-75">
          <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-emerald-500" /> Entregues Recentemente
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {delivered.slice(0, 4).map(os => (
              <div key={os.id} className="p-3 border border-gray-200 rounded-lg bg-gray-50 flex items-center justify-between">
                <div>
                  <p className="text-sm font-bold text-gray-900 truncate w-32">{os.title}</p>
                  <p className="text-xs text-gray-500">{os.customer?.name}</p>
                </div>
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">OK</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};