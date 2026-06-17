import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Store, ArrowRight, Paintbrush2, Shirt } from 'lucide-react';

interface Props {
  onStart: (storeName: string) => void;
}

export function HomeStorePicker({ onStart }: Props) {
  const [storeName, setStoreName] = useState('');

  const handleStart = (e: React.FormEvent) => {
    e.preventDefault();
    if (storeName.trim().length > 0) {
      onStart(storeName);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-indigo-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob"></div>
      <div className="absolute top-[20%] right-[-10%] w-96 h-96 bg-violet-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000"></div>
      <div className="absolute bottom-[-20%] left-[20%] w-96 h-96 bg-fuchsia-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-4000"></div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden relative z-10 border border-slate-100"
      >
        <div className="p-8 text-center">
          <div className="mx-auto w-16 h-16 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mb-6 shadow-inner">
            <Shirt size={32} />
          </div>
          <h1 className="text-2xl font-black text-slate-800 mb-2">Bem-vindo ao Io-Estampas</h1>
          <p className="text-slate-500 text-sm mb-8">
            Crie artes vetoriais incríveis, separe cores para Silk e gere mockups realistas com Inteligência Artificial.
          </p>

          <form onSubmit={handleStart} className="space-y-4">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Store className="h-5 w-5 text-slate-400" />
              </div>
              <input
                type="text"
                value={storeName}
                onChange={(e) => setStoreName(e.target.value)}
                className="block w-full pl-11 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all font-medium"
                placeholder="Nome da sua Marca/Loja..."
                required
              />
            </div>
            
            <button
              type="submit"
              disabled={storeName.trim().length === 0}
              className="w-full py-4 px-4 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white rounded-2xl font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-md hover:shadow-xl"
            >
              Entrar no Editor <ArrowRight size={18} />
            </button>
          </form>
        </div>
        
        <div className="bg-slate-50 border-t border-slate-100 p-6">
          <div className="flex items-start gap-4">
            <div className="bg-white p-2 rounded-xl shadow-sm"><Paintbrush2 className="text-violet-500" size={20}/></div>
            <div>
              <h4 className="text-sm font-bold text-slate-800">Criação Instantânea</h4>
              <p className="text-xs text-slate-500 mt-1">Use nossos prompts de IA para criar designs exclusivos em segundos. Tudo gerenciado com o seu saldo de créditos unificado.</p>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
