"use client";

import { useState, useEffect } from "react";
import { X, Loader2, Save, BookOpen } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from "@/lib/hooks/useTranslation";

interface ProjectSettingsModalProps {
  projectId: string;
  isOpen: boolean;
  onClose: () => void;
  initialData?: {
    name?: string;
    description?: string;
    businessRules?: string;
    designGuidelines?: string;
  };
  onSave: (data: any) => void;
}

export function ProjectSettingsModal({ projectId, isOpen, onClose, initialData, onSave }: ProjectSettingsModalProps) {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: initialData?.name || "",
    description: initialData?.description || "",
    businessRules: initialData?.businessRules || "",
    designGuidelines: initialData?.designGuidelines || "",
  });

  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name || "",
        description: initialData.description || "",
        businessRules: initialData.businessRules || "",
        designGuidelines: initialData.designGuidelines || "",
      });
    }
  }, [initialData]);

  const handleChange = (field: keyof typeof formData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/app-builder/projects/${projectId}/settings`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!res.ok) throw new Error("Erro ao salvar configurações");
      onSave(formData);
      onClose();
    } catch (err) {
      console.error(err);
      alert("Falha ao salvar as configurações.");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
        <motion.div 
          initial={{ opacity: 0 }} 
          animate={{ opacity: 1 }} 
          exit={{ opacity: 0 }} 
          className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm" 
          onClick={onClose} 
        />
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50/50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center">
                <BookOpen className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900">{t('admin.appBuilder.settings.title') || "Base de Conhecimento do App"}</h2>
                <p className="text-sm text-gray-500">{t('admin.appBuilder.settings.subtitle') || "Defina o contexto para a IA criar o código com precisão."}</p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700">{t('admin.appBuilder.settings.nameLabel') || "Nome do Aplicativo"}</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => handleChange("name", e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 text-gray-800 text-sm rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                placeholder="Ex: SaaS de Gestão de Clínicas..."
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700">{t('admin.appBuilder.settings.descriptionLabel') || "Objetivo Principal (Briefing)"}</label>
              <textarea
                value={formData.description}
                onChange={(e) => handleChange("description", e.target.value)}
                rows={3}
                className="w-full bg-gray-50 border border-gray-200 text-gray-800 text-sm rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all resize-none"
                placeholder="Ex: O aplicativo é um CRM para médicos gerenciarem consultas e pacientes. Ele deve ter uma dashboard de relatórios..."
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700">{t('admin.appBuilder.settings.businessRulesLabel') || "Regras de Negócio & Features"}</label>
              <textarea
                value={formData.businessRules}
                onChange={(e) => handleChange("businessRules", e.target.value)}
                rows={4}
                className="w-full bg-gray-50 border border-gray-200 text-gray-800 text-sm rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all resize-none"
                placeholder="- Médicos só podem ver seus próprios pacientes.&#10;- Consultas precisam ter status: Pendente, Confirmada, Cancelada.&#10;- A tela inicial deve mostrar a agenda do dia."
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700">{t('admin.appBuilder.settings.designLabel') || "Identidade Visual & UI"}</label>
              <textarea
                value={formData.designGuidelines}
                onChange={(e) => handleChange("designGuidelines", e.target.value)}
                rows={3}
                className="w-full bg-gray-50 border border-gray-200 text-gray-800 text-sm rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all resize-none"
                placeholder="Use tema clean/hospitalar. Cores primárias: Azul Claro (#0ea5e9) e Branco. Cantos arredondados, visual moderno minimalista, estilo Apple."
              />
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex items-center justify-end gap-3">
            <button
              onClick={onClose}
              className="px-5 py-2.5 text-sm font-semibold text-gray-600 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
            >
              {t('common.cancel') || "Cancelar"}
            </button>
            <button
              onClick={handleSave}
              disabled={loading}
              className="flex items-center gap-2 px-5 py-2.5 text-sm font-bold text-white bg-blue-600 rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              <Save className="w-4 h-4" />
              {t('common.save') || "Salvar Base"}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
