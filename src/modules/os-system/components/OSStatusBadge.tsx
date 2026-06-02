import React from 'react';
import { OSStatus } from '../types/OSEntity';

interface OSStatusBadgeProps {
  status: OSStatus;
  className?: string;
}

const statusConfig: Record<OSStatus, { label: string; colorClass: string }> = {
  orcamento: { label: 'Orçamento', colorClass: 'bg-gray-100 text-gray-800 border-gray-200' },
  aguardando_aprovacao: { label: 'Aguardando Aprovação', colorClass: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
  aprovado: { label: 'Aprovado', colorClass: 'bg-emerald-100 text-emerald-800 border-emerald-200' },
  entrada_recebida: { label: 'Entrada Recebida', colorClass: 'bg-green-100 text-green-800 border-green-200' },
  em_arte: { label: 'Em Arte / Design', colorClass: 'bg-pink-100 text-pink-800 border-pink-200' },
  arte_aprovada: { label: 'Arte Aprovada', colorClass: 'bg-fuchsia-100 text-fuchsia-800 border-fuchsia-200' },
  em_impressao: { label: 'Em Impressão', colorClass: 'bg-violet-100 text-violet-800 border-violet-200' },
  em_producao: { label: 'Em Produção', colorClass: 'bg-blue-100 text-blue-800 border-blue-200' },
  em_conferencia: { label: 'Em Conferência', colorClass: 'bg-orange-100 text-orange-800 border-orange-200' },
  empacotado: { label: 'Empacotado', colorClass: 'bg-amber-100 text-amber-800 border-amber-200' },
  pronto_para_entrega: { label: 'Pronto p/ Entrega', colorClass: 'bg-teal-100 text-teal-800 border-teal-200' },
  entregue: { label: 'Entregue', colorClass: 'bg-gray-800 text-white border-gray-700' },
  cancelado: { label: 'Cancelado', colorClass: 'bg-red-100 text-red-800 border-red-200' },
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
