import React from 'react';
import { OSEntity } from '@/modules/os-system/types/OSEntity';
import { TechnicianAssign } from './TechnicianAssign';
import { OSStatusBadge } from './OSStatusBadge';

interface ProductionCardProps {
  os: OSEntity;
  onClick: (os: OSEntity) => void;
  onAssignTechnician: (osId: string, technicianId: string, technicianName: string) => void;
}

export const ProductionCard: React.FC<ProductionCardProps> = ({ os, onClick, onAssignTechnician }) => {
  // Calculate progress
  const totalTasks = os.checklist?.length || 0;
  const completedTasks = os.checklist?.filter(t => t.isCompleted).length || 0;
  const progressPercent = totalTasks === 0 ? 0 : Math.round((completedTasks / totalTasks) * 100);

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow cursor-pointer p-4 relative group">
      {/* Header */}
      <div className="flex justify-between items-start mb-2" onClick={() => onClick(os)}>
        <div className="flex flex-col">
          <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">{os.osNumber}</span>
          <span className="text-sm font-semibold text-gray-900 truncate max-w-[180px]" title={os.customer?.name}>
            {os.customer?.name || 'Cliente Desconhecido'}
          </span>
        </div>
        <OSStatusBadge status={os.status} />
      </div>

      {/* Equipment info */}
      <div className="mb-4 text-xs text-gray-600 line-clamp-2" onClick={() => onClick(os)}>
        <strong>Equipamento:</strong> {os.description}
      </div>

      {/* Progress Bar */}
      <div className="mb-4" onClick={() => onClick(os)}>
        <div className="flex justify-between items-center mb-1 text-xs text-gray-500">
          <span>Checklist</span>
          <span>{completedTasks}/{totalTasks} ({progressPercent}%)</span>
        </div>
        <div className="w-full bg-gray-100 rounded-full h-1.5">
          <div 
            className={`h-1.5 rounded-full transition-all duration-300 ${progressPercent === 100 ? 'bg-green-500' : 'bg-indigo-500'}`}
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Footer: Tech Assign & Actions */}
      <div className="border-t border-gray-100 pt-3 mt-auto">
        <TechnicianAssign 
          os={os} 
          onAssign={(tId, tName) => onAssignTechnician(os.id, tId, tName)} 
        />
      </div>
    </div>
  );
};
