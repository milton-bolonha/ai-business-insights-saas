import React from 'react';
import { Sparkles, X, Download, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Props {
  aiMockupResult: string | null;
  setAiMockupResult: (v: string | null) => void;
  // This will receive the base64 or url of the current canvas export, but for now we'll just mock
}

export function AiMockupGenerator({ aiMockupResult, setAiMockupResult }: Props) {
  return (
    <AnimatePresence>
      {aiMockupResult && (
        <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="absolute inset-0 z-[100] bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-8">
          <div className="bg-white rounded-3xl shadow-2xl p-6 max-w-2xl w-full flex flex-col">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-bold text-xl flex items-center gap-2 text-slate-800"><Sparkles className="text-violet-500"/> Mockup Realista</h3>
              <button onClick={() => setAiMockupResult(null)} className="p-2 hover:bg-slate-100 text-slate-500 rounded-xl transition-colors"><X size={20}/></button>
            </div>
            <div className="flex-1 bg-slate-100 rounded-2xl overflow-hidden flex items-center justify-center border border-slate-200 min-h-[40vh]">
              <img src={aiMockupResult} className="max-h-[50vh] object-contain rounded-xl drop-shadow-lg" alt="Mockup Gerado" />
            </div>
            <div className="mt-6 flex justify-between items-center">
              <div className="text-sm text-slate-500 font-medium">✨ -1 Crédito de IA debitado.</div>
              <div className="flex gap-3">
                <button onClick={() => setAiMockupResult(null)} className="px-6 py-3 font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors">Fechar</button>
                <a href={aiMockupResult} download="mockup_ia.png" className="px-6 py-3 font-bold bg-violet-600 text-white rounded-xl shadow-md hover:bg-violet-700 transition-colors flex items-center gap-2">
                   <Download size={18}/> Salvar Mockup
                </a>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
