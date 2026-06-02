import React, { useState } from 'react';
import { OSEntity } from '@/modules/os-system/types/OSEntity';

interface DiagnosisPanelProps {
  os: OSEntity;
  onSaveDiagnosis: (diagnosisText: string) => void;
}

export const DiagnosisPanel: React.FC<DiagnosisPanelProps> = ({ os, onSaveDiagnosis }) => {
  const [diagnosis, setDiagnosis] = useState(os.reportedDetails || '');

  const handleSave = () => {
    onSaveDiagnosis(diagnosis);
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
      <h3 className="text-lg font-medium text-gray-900 mb-4">Painel de Diagnóstico Técnico</h3>
      
      <div className="mb-4 bg-gray-50 p-4 rounded-md text-sm text-gray-700">
        <strong>Detalhes do Pedido (Cliente):</strong>
        <p className="mt-1">{os.reportedDetails || 'Não informado.'}</p>
      </div>

      <div className="mb-4">
        <label htmlFor="diagnosis" className="block text-sm font-medium text-gray-700 mb-2">
          Laudo / Diagnóstico Técnico
        </label>
        <textarea
          id="diagnosis"
          rows={5}
          className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-3 border"
          placeholder="Descreva a causa raiz do problema e o que precisa ser feito..."
          value={diagnosis}
          onChange={(e) => setDiagnosis(e.target.value)}
        />
      </div>

      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={!diagnosis.trim()}
          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-gray-300 disabled:cursor-not-allowed"
        >
          Salvar Diagnóstico
        </button>
      </div>
    </div>
  );
};
