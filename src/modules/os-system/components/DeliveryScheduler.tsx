import React, { useState } from 'react';
import { OSEntity } from '@/modules/os-system/types/OSEntity';

interface DeliverySchedulerProps {
  os: OSEntity;
  onSchedule: (date: string) => void;
}

export const DeliveryScheduler: React.FC<DeliverySchedulerProps> = ({ os, onSchedule }) => {
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');

  const handleSchedule = () => {
    if (date && time) {
      // Combines local date and time into ISO
      const datetime = new Date(`${date}T${time}`).toISOString();
      onSchedule(datetime);
    }
  };

  return (
    <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
      <h4 className="text-md font-medium text-gray-800 mb-2">Agendar Retirada/Entrega</h4>
      <p className="text-xs text-gray-500 mb-4">Defina o dia e horário combinado com o cliente.</p>

      <div className="grid grid-cols-2 gap-3 mb-4">
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Data</label>
          <input
            type="date"
            className="w-full rounded-md border-gray-300 shadow-sm sm:text-sm p-2 border focus:ring-teal-500 focus:border-teal-500"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Horário</label>
          <input
            type="time"
            className="w-full rounded-md border-gray-300 shadow-sm sm:text-sm p-2 border focus:ring-teal-500 focus:border-teal-500"
            value={time}
            onChange={(e) => setTime(e.target.value)}
          />
        </div>
      </div>

      <button
        onClick={handleSchedule}
        disabled={!date || !time}
        className="w-full py-2 bg-teal-600 text-white rounded hover:bg-teal-700 font-medium text-sm disabled:bg-gray-300 disabled:cursor-not-allowed"
      >
        Confirmar Agendamento
      </button>

      {os.scheduledDeliveryDate && (
        <div className="mt-4 p-3 bg-teal-50 border border-teal-100 rounded text-xs text-teal-800">
          <strong>Agendado para:</strong> {new Date(os.scheduledDeliveryDate).toLocaleString('pt-BR')}
        </div>
      )}
    </div>
  );
};
