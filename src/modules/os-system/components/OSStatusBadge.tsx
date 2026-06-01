import React from 'react';
import { OSStatus } from '../types/OSEntity';

interface OSStatusBadgeProps {
  status: OSStatus;
  className?: string;
}

const statusConfig: Record<OSStatus, { label: string; colorClass: string }> = {
  intake: { label: 'Triagem', colorClass: 'bg-gray-100 text-gray-800 border-gray-200' },
  quote_pending: { label: 'Orçamento Pendente', colorClass: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
  quote_approved: { label: 'Orçamento Aprovado', colorClass: 'bg-green-100 text-green-800 border-green-200' },
  production_pending: { label: 'Fila de Produção', colorClass: 'bg-blue-100 text-blue-800 border-blue-200' },
  in_production: { label: 'Em Produção', colorClass: 'bg-purple-100 text-purple-800 border-purple-200' },
  production_completed: { label: 'Produção Concluída', colorClass: 'bg-indigo-100 text-indigo-800 border-indigo-200' },
  ready_for_pickup: { label: 'Pronto p/ Retirada', colorClass: 'bg-orange-100 text-orange-800 border-orange-200' },
  delivered: { label: 'Entregue', colorClass: 'bg-teal-100 text-teal-800 border-teal-200' },
  archived: { label: 'Arquivado', colorClass: 'bg-gray-200 text-gray-500 border-gray-300' },
};

export const OSStatusBadge: React.FC<OSStatusBadgeProps> = ({ status, className = '' }) => {
  const config = statusConfig[status] || { label: status, colorClass: 'bg-gray-100 text-gray-800' };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${config.colorClass} ${className}`}
    >
      {config.label}
    </span>
  );
};
