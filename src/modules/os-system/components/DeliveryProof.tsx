import React, { useState } from 'react';
import { OSEntity } from '@/modules/os-system/types/OSEntity';
import { SignatureCapture } from './SignatureCapture';

interface DeliveryProofProps {
  os: OSEntity;
  onCompleteDelivery: (osId: string, updates: Partial<OSEntity>) => void;
  onCancel: () => void;
}

export const DeliveryProof: React.FC<DeliveryProofProps> = ({ os, onCompleteDelivery, onCancel }) => {
  const [signature, setSignature] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState(os.paymentMethod || '');
  const [isPaid, setIsPaid] = useState(os.isPaid || false);

  const handleComplete = () => {
    // Em um app real faria o upload da imagem (signature base64) para o Cloudinary aqui
    // const signatureUrl = await uploadToCloudinary(signature);
    const mockSignatureUrl = 'https://res.cloudinary.com/demo/image/upload/v1/mock_signature.png';

    onCompleteDelivery(os.id, {
      status: 'entregue',
      signatureUrl: signature ? mockSignatureUrl : undefined,
      isPaid,
      paymentMethod,
    });
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-lg max-w-2xl mx-auto overflow-hidden">
      <div className="bg-orange-600 px-6 py-4 flex justify-between items-center text-white">
        <div>
          <h2 className="text-xl font-semibold">Entrega de Equipamento</h2>
          <p className="text-orange-100 text-sm">OS {os.osNumber} — {os.customer?.name}</p>
        </div>
        <button onClick={onCancel} className="text-white hover:text-orange-200 font-medium">✕ Fechar</button>
      </div>

      <div className="p-6">
        <div className="bg-gray-50 border border-gray-100 rounded-lg p-4 mb-6 text-sm text-gray-700">
          <p className="mb-2"><strong>Item / Serviço:</strong> {os.description}</p>
          <p className="mb-2"><strong>Laudo / Detalhes reportados:</strong> {os.reportedDetails || 'N/A'}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div className="border p-4 rounded-lg">
            <h3 className="font-semibold text-gray-800 mb-3 border-b pb-2">Acerto Financeiro</h3>
            <div className="text-2xl font-bold text-gray-900 mb-4">
              R$ {(os.totalRevenue || 0).toFixed(2)}
            </div>
            
            <div className="space-y-3">
              <label className="flex items-center space-x-2">
                <input 
                  type="checkbox" 
                  checked={isPaid} 
                  onChange={(e) => setIsPaid(e.target.checked)}
                  className="rounded text-orange-600 focus:ring-orange-500"
                />
                <span className="text-sm font-medium text-gray-700">Pagamento Confirmado</span>
              </label>

              {isPaid && (
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Método de Pagamento</label>
                  <select 
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="w-full text-sm border-gray-300 rounded-md shadow-sm focus:ring-orange-500 focus:border-orange-500"
                  >
                    <option value="">-- Selecione --</option>
                    <option value="pix">PIX</option>
                    <option value="credit">Cartão de Crédito</option>
                    <option value="debit">Cartão de Débito</option>
                    <option value="cash">Dinheiro</option>
                  </select>
                </div>
              )}
            </div>
          </div>

          <div>
            <SignatureCapture onCapture={setSignature} />
            {signature && (
              <div className="mt-2 text-xs text-green-600 font-medium flex items-center">
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                Assinatura salva localmente
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
          <button
            onClick={onCancel}
            className="px-4 py-2 bg-white border border-gray-300 text-gray-700 font-medium rounded hover:bg-gray-50 shadow-sm transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleComplete}
            disabled={!signature || (os.totalRevenue! > 0 && !isPaid)}
            className="px-6 py-2 bg-orange-600 text-white font-medium rounded hover:bg-orange-700 shadow-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Finalizar Entrega & Fechar OS
          </button>
        </div>
      </div>
    </div>
  );
};
