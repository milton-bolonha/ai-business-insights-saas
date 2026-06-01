import React, { useState } from 'react';
import { OSStatus } from '@/modules/os-system/types/OSEntity';

interface OSIntakeFormProps {
  onSubmit: (data: any) => void;
  onCancel: () => void;
}

export const OSIntakeForm: React.FC<OSIntakeFormProps> = ({ onSubmit, onCancel }) => {
  const [formData, setFormData] = useState({
    customerName: '',
    customerPhone: '',
    itemDescription: '',
    reportedDetails: '',
    additionalItems: '',
    itemCondition: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Convert comma separated items to array if needed
    const additionalItemsArray = formData.additionalItems
      .split(',')
      .map(item => item.trim())
      .filter(item => item.length > 0);

    const payload = {
      ...formData,
      additionalItems: additionalItemsArray,
      status: 'intake' as OSStatus,
      intakeDate: new Date().toISOString(),
    };
    
    onSubmit(payload);
  };

  return (
    <div className="w-full">
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Customer Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nome do Cliente</label>
            <input
              type="text"
              name="customerName"
              value={formData.customerName}
              onChange={handleChange}
              required
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500 sm:text-sm p-2 border"
              placeholder="Ex: João Silva"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Telefone / WhatsApp</label>
            <input
              type="text"
              name="customerPhone"
              value={formData.customerPhone}
              onChange={handleChange}
              required
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500 sm:text-sm p-2 border"
              placeholder="(11) 99999-9999"
            />
          </div>
        </div>

        {/* Item Info */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Item / Produto / Serviço</label>
          <input
            type="text"
            name="itemDescription"
            value={formData.itemDescription}
            onChange={handleChange}
            required
            className="w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500 sm:text-sm p-2 border"
            placeholder="Ex: Lote de 50 Camisetas, ou Notebook Dell Inspiron..."
          />
        </div>

        {/* Details */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Detalhes do Pedido ou Defeito Relatado</label>
          <textarea
            name="reportedDetails"
            value={formData.reportedDetails}
            onChange={handleChange}
            required
            rows={3}
            className="w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500 sm:text-sm p-2 border"
            placeholder="O cliente deseja que a estampa seja azul / O aparelho não liga..."
          />
        </div>

        {/* Condition & Accessories */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Estado / Condição Atual</label>
            <input
              type="text"
              name="itemCondition"
              value={formData.itemCondition}
              onChange={handleChange}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500 sm:text-sm p-2 border"
              placeholder="Ex: Peças virgens / Aparelho com riscos na tampa"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Itens Adicionais / Acessórios</label>
            <input
              type="text"
              name="additionalItems"
              value={formData.additionalItems}
              onChange={handleChange}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500 sm:text-sm p-2 border"
              placeholder="Ex: Arte no pendrive / Fonte e Cabo"
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end space-x-3 pt-4 border-t mt-6">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
          >
            Cancelar
          </button>
          <button
            type="submit"
            className="px-4 py-2 text-sm font-medium text-white bg-orange-600 border border-transparent rounded-md shadow-sm hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
          >
            Salvar e Iniciar Triagem
          </button>
        </div>
      </form>
    </div>
  );
};
