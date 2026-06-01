import React from 'react';
import { OSEntity } from '@/modules/os-system/types/OSEntity';

interface QuoteApprovalFlowProps {
  os: OSEntity;
  onApprove: () => void;
  onReject: (reason: string) => void;
}

export const QuoteApprovalFlow: React.FC<QuoteApprovalFlowProps> = ({ os, onApprove, onReject }) => {
  const handleReject = () => {
    const reason = window.prompt("Por favor, informe o motivo da rejeição:");
    if (reason) {
      onReject(reason);
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-medium text-gray-900">Aprovação de Orçamento</h3>
          <p className="text-sm text-gray-500">Envie o link para o cliente ou registre a resposta dele aqui.</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-gray-500 uppercase font-semibold tracking-wider">Valor do Orçamento</p>
          <p className="text-2xl font-bold text-gray-900">
            R$ {(os.totalRevenue || 0).toFixed(2)}
          </p>
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-100 p-4 rounded-md mb-6 flex items-start">
        <span className="text-xl mr-3">📱</span>
        <div>
          <h4 className="text-sm font-medium text-blue-900">Compartilhar com Cliente</h4>
          <p className="text-xs text-blue-700 mt-1 mb-2">Copie a mensagem abaixo para enviar pelo WhatsApp.</p>
          <div className="bg-white p-3 border border-blue-100 rounded text-xs text-gray-700 font-mono">
            Olá {os.customer?.name || 'Cliente'}! O orçamento para o equipamento {os.description} já está pronto.
            O valor total ficou em R$ {(os.totalRevenue || 0).toFixed(2)}. 
            Para aprovar, acesse o link: https://sua-loja.com/os/{os.id}/approve
          </div>
          <button className="mt-2 text-blue-600 hover:text-blue-800 text-xs font-medium">Copiar Mensagem</button>
        </div>
      </div>

      <div className="flex space-x-3 pt-4 border-t border-gray-100">
        <button
          onClick={handleReject}
          className="flex-1 py-2 bg-white text-red-600 border border-red-200 rounded-md shadow-sm hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 font-medium"
        >
          Cliente Rejeitou
        </button>
        <button
          onClick={onApprove}
          className="flex-1 py-2 bg-green-600 text-white border border-transparent rounded-md shadow-sm hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 font-medium"
        >
          Cliente Aprovou (Mover para Produção)
        </button>
      </div>
    </div>
  );
};
