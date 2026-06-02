import React, { useState } from 'react';
import { CheckCircle2, ChevronRight, ChevronLeft, User, Package, DollarSign } from 'lucide-react';

interface OSIntakeFormProps {
  onSubmit: (data: any) => void;
  onCancel: () => void;
}

export const OSIntakeForm: React.FC<OSIntakeFormProps> = ({ onSubmit, onCancel }) => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    customerName: '',
    customerPhone: '',
    itemDescription: '',
    modelo: '',
    malha: '',
    cor: '',
    personalizacao: '',
    quantidadeTotal: '',
    totalRevenue: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleNext = () => setStep(prev => Math.min(prev + 1, 3));
  const handlePrev = () => setStep(prev => Math.max(prev - 1, 1));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (step < 3) {
      handleNext();
      return;
    }
    
    onSubmit({
      ...formData,
      quantidadeTotal: parseInt(formData.quantidadeTotal) || 0,
      totalRevenue: parseFloat(formData.totalRevenue) || 0,
    });
  };

  const steps = [
    { num: 1, label: 'Cliente', icon: User },
    { num: 2, label: 'Produto', icon: Package },
    { num: 3, label: 'Financeiro', icon: DollarSign },
  ];

  return (
    <div className="w-full bg-white flex flex-col md:flex-row h-full md:min-h-[500px]">
      
      {/* Sidebar de Etapas */}
      <div className="md:w-64 bg-gray-50 p-8 border-b md:border-b-0 md:border-r border-gray-100 flex-shrink-0">
        <nav className="space-y-6 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-gray-200 before:to-transparent hidden md:block">
          {steps.map((s, i) => {
            const isActive = step === s.num;
            const isPast = step > s.num;
            return (
              <div key={s.num} className={`relative flex items-center gap-4 ${isActive ? 'text-violet-700' : isPast ? 'text-emerald-600' : 'text-gray-400'}`}>
                <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 border-2 relative z-10 bg-white ${isActive ? 'border-violet-600 bg-violet-50' : isPast ? 'border-emerald-500 bg-emerald-50' : 'border-gray-200'}`}>
                  {isPast ? <CheckCircle2 className="w-5 h-5 text-emerald-500" /> : <s.icon className="w-4 h-4" />}
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider mb-0.5 opacity-80">Passo {s.num}</p>
                  <p className="font-bold text-sm">{s.label}</p>
                </div>
              </div>
            );
          })}
        </nav>
        
        {/* Mobile progress */}
        <div className="md:hidden flex items-center justify-between">
          <p className="text-sm font-bold text-violet-700">Passo {step} de 3</p>
          <p className="text-sm font-medium text-gray-500">{steps[step-1].label}</p>
        </div>
      </div>

      {/* Formulário Principal */}
      <form onSubmit={handleSubmit} className="flex-1 flex flex-col p-8">
        <div className="flex-1">
          
          {step === 1 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-1">Dados do Cliente</h3>
                <p className="text-sm text-gray-500 mb-6">Para quem estamos fazendo este projeto?</p>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Nome Completo / Empresa</label>
                  <input
                    type="text" name="customerName" value={formData.customerName} onChange={handleChange} required
                    className="w-full text-base rounded-lg border-gray-300 p-3 border focus:ring-2 focus:ring-violet-500 outline-none transition-shadow"
                    placeholder="Ex: João da Silva"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Telefone / WhatsApp</label>
                  <input
                    type="text" name="customerPhone" value={formData.customerPhone} onChange={handleChange} required
                    className="w-full text-base rounded-lg border-gray-300 p-3 border focus:ring-2 focus:ring-violet-500 outline-none transition-shadow"
                    placeholder="(11) 99999-9999"
                  />
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-1">Detalhes do Projeto</h3>
                <p className="text-sm text-gray-500 mb-6">Especificações técnicas da confecção ou estamparia.</p>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Título do Projeto</label>
                  <input
                    type="text" name="itemDescription" value={formData.itemDescription} onChange={handleChange} required
                    className="w-full text-base rounded-lg border-gray-300 p-3 border focus:ring-2 focus:ring-violet-500 outline-none transition-shadow bg-gray-50"
                    placeholder="Ex: Camisetas de Formatura 3ºão"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">Modelo da Peça</label>
                    <input
                      type="text" name="modelo" value={formData.modelo} onChange={handleChange} required
                      className="w-full text-base rounded-lg border-gray-300 p-3 border focus:ring-2 focus:ring-violet-500 outline-none transition-shadow"
                      placeholder="Ex: T-Shirt, Moletom"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">Malha</label>
                    <input
                      type="text" name="malha" value={formData.malha} onChange={handleChange} required
                      className="w-full text-base rounded-lg border-gray-300 p-3 border focus:ring-2 focus:ring-violet-500 outline-none transition-shadow"
                      placeholder="Ex: 100% Algodão"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="col-span-1">
                    <label className="block text-sm font-bold text-gray-700 mb-1">Cor</label>
                    <input
                      type="text" name="cor" value={formData.cor} onChange={handleChange} required
                      className="w-full text-base rounded-lg border-gray-300 p-3 border focus:ring-2 focus:ring-violet-500 outline-none transition-shadow"
                      placeholder="Ex: Preta"
                    />
                  </div>
                  <div className="col-span-1">
                    <label className="block text-sm font-bold text-gray-700 mb-1">Tipo de Estampa</label>
                    <input
                      type="text" name="personalizacao" value={formData.personalizacao} onChange={handleChange} required
                      className="w-full text-base rounded-lg border-gray-300 p-3 border focus:ring-2 focus:ring-violet-500 outline-none transition-shadow"
                      placeholder="Ex: Silk, DTF"
                    />
                  </div>
                  <div className="col-span-1">
                    <label className="block text-sm font-bold text-gray-700 mb-1">Qtd. Total</label>
                    <input
                      type="number" name="quantidadeTotal" value={formData.quantidadeTotal} onChange={handleChange} required min={1}
                      className="w-full text-base rounded-lg border-gray-300 p-3 border focus:ring-2 focus:ring-violet-500 outline-none transition-shadow font-mono"
                      placeholder="100"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-1">Financeiro</h3>
                <p className="text-sm text-gray-500 mb-6">Valores combinados para este pedido.</p>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Valor Total (R$)</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-bold">R$</span>
                    <input
                      type="number" name="totalRevenue" value={formData.totalRevenue} onChange={handleChange} required min={0} step="0.01"
                      className="w-full text-2xl font-bold text-emerald-700 rounded-lg border-emerald-300 p-4 pl-12 border-2 focus:ring-4 focus:ring-emerald-100 outline-none transition-shadow bg-emerald-50"
                      placeholder="0.00"
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-2">Você poderá adicionar sinal ou desconto posteriormente no Dossiê.</p>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Rodapé de Ações */}
        <div className="pt-6 mt-6 border-t border-gray-100 flex items-center justify-between">
          <button
            type="button"
            onClick={step === 1 ? onCancel : handlePrev}
            className="text-gray-600 hover:text-gray-900 font-medium px-4 py-2 hover:bg-gray-100 rounded-lg transition-colors flex items-center gap-2"
          >
            {step === 1 ? 'Cancelar' : <><ChevronLeft className="w-4 h-4" /> Voltar</>}
          </button>
          
          <button
            type="submit"
            className="bg-violet-600 hover:bg-violet-700 text-white px-8 py-3 rounded-xl font-bold transition-all shadow-md hover:shadow-lg flex items-center gap-2"
          >
            {step === 3 ? 'Finalizar e Criar OS' : <>Avançar <ChevronRight className="w-4 h-4" /></>}
          </button>
        </div>
      </form>
    </div>
  );
};
