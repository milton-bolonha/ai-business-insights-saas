"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Plus } from "lucide-react";
import { GRADIENTS } from "../constants";
import type { SmartSurveyBoardViewProps } from "../SmartSurveyBoardView";

export function CreateCompanyModal(props: SmartSurveyBoardViewProps) {
  const {
    isCreateModalOpen,
    setIsCreateModalOpen,
    newCompanyName,
    setNewCompanyName,
    newCompanyN,
    setNewCompanyN,
    newCompanyLabel,
    setNewCompanyLabel,
    newCompanyTemplate,
    setNewCompanyTemplate,
    newCompanyCover,
    setNewCompanyCover,
    handleCreateCompany,
  } = props;

  return (
    <AnimatePresence>
      {isCreateModalOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[90] bg-neutral-950/50 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setIsCreateModalOpen(false)}
        >
          <motion.form
            initial={{ scale: 0.96, y: 12 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.96, y: 12 }}
            onClick={e => e.stopPropagation()}
            onSubmit={e => {
              handleCreateCompany(e);
              setIsCreateModalOpen(false);
            }}
            className="bg-white rounded-[2rem] border border-neutral-100 shadow-2xl max-w-md w-full p-8 space-y-5"
          >
            <div className="flex justify-between items-center border-b border-neutral-100 pb-4">
              <h2 className="text-sm font-black uppercase tracking-wider text-neutral-800">Nova Organização</h2>
              <button type="button" onClick={() => setIsCreateModalOpen(false)} className="p-2 rounded-xl hover:bg-neutral-100 cursor-pointer">
                <X size={16} />
              </button>
            </div>

            <div>
              <label className="text-[9px] font-black uppercase tracking-widest text-neutral-400 block mb-1">Nome da entidade *</label>
              <input
                required
                value={newCompanyName}
                onChange={e => setNewCompanyName(e.target.value)}
                className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-3 text-xs font-semibold focus:outline-none focus:border-emerald-500"
                placeholder="Ex: Milhas Aéreas Logística S.A."
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[9px] font-black uppercase tracking-widest text-neutral-400 block mb-1">População (N)</label>
                <input
                  type="number"
                  min={2}
                  value={newCompanyN}
                  onChange={e => setNewCompanyN(e.target.value)}
                  className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-3 text-xs font-semibold focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="text-[9px] font-black uppercase tracking-widest text-neutral-400 block mb-1">Rótulo dos participantes</label>
                <input
                  value={newCompanyLabel}
                  onChange={e => setNewCompanyLabel(e.target.value)}
                  placeholder="Entrevistados"
                  className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-3 text-xs font-semibold focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <div>
              <label className="text-[9px] font-black uppercase tracking-widest text-neutral-400 block mb-1">Template</label>
              <select
                value={newCompanyTemplate}
                onChange={e => setNewCompanyTemplate(e.target.value as any)}
                className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-3 text-xs font-semibold cursor-pointer outline-none"
              >
                <option value="nr1_compliance">NR-1 — Riscos psicossociais</option>
                <option value="continuous_reporting">Métricas contínuas (vendas)</option>
                <option value="todo_algorithm">Algoritmo To-do (Personalizado)</option>
              </select>
            </div>

            <div>
              <label className="text-[9px] font-black uppercase tracking-widest text-neutral-400 block mb-2">Cor da marca</label>
              <div className="flex flex-wrap gap-2">
                {GRADIENTS.map(g => (
                  <button
                    key={g}
                    type="button"
                    onClick={() => setNewCompanyCover(g)}
                    className={`w-10 h-10 rounded-full bg-gradient-to-r ${g} border-2 ${newCompanyCover === g ? "border-neutral-900 scale-110" : "border-transparent"}`}
                  />
                ))}
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-3.5 rounded-xl text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2 cursor-pointer"
            >
              <Plus size={14} />
              Criar organização
            </button>
          </motion.form>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
