"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, BookOpen } from "lucide-react";
import {
  METHODOLOGY_SECTIONS,
  buildMethodologySnapshot,
  type MethodologyContext,
} from "../methodology-content";
import type { SmartSurveyBoardViewProps } from "../SmartSurveyBoardView";
import { getRiskLevel } from "../risk-engine";

export function MethodologyModal(props: SmartSurveyBoardViewProps) {
  const {
    isMethodologyModalOpen,
    setIsMethodologyModalOpen,
    activeCompany,
    activeSurvey,
    samplingStats,
    organizationAnalytics,
    iroTrend,
    companyGlobalRiskAverage,
  } = props;

  if (!activeCompany) return null;

  const ctx: MethodologyContext = {
    companyName: activeCompany.name,
    surveyTitle: activeSurvey?.title || "Pesquisa ativa",
    samplingStats,
    organizationAnalytics,
    iroTrend,
    iro: companyGlobalRiskAverage,
    iroLabel: getRiskLevel(companyGlobalRiskAverage).label,
  };

  const snapshot = buildMethodologySnapshot(ctx);

  return (
    <AnimatePresence>
      {isMethodologyModalOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[90] bg-neutral-950/50 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setIsMethodologyModalOpen(false)}
        >
          <motion.div
            initial={{ scale: 0.96, y: 12 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.96, y: 12 }}
            onClick={e => e.stopPropagation()}
            className="bg-white rounded-[2rem] border border-neutral-100 shadow-2xl max-w-2xl w-full max-h-[85vh] overflow-y-auto p-8 space-y-6"
          >
            <div className="flex justify-between items-start gap-4 border-b border-neutral-100 pb-4">
              <div>
                <h2 className="text-lg font-black text-neutral-900 tracking-tight flex items-center gap-2">
                  <BookOpen size={18} className="text-emerald-600" />
                  Metodologia da pesquisa
                </h2>
                <p className="text-xs text-neutral-500 mt-1 font-medium">
                  {ctx.surveyTitle} · {ctx.companyName}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsMethodologyModalOpen(false)}
                className="p-2 rounded-xl hover:bg-neutral-100 text-neutral-500 cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            {METHODOLOGY_SECTIONS.map(sec => (
              <section key={sec.title} className="space-y-2 text-sm text-neutral-700 leading-relaxed">
                <h3 className="text-xs font-black uppercase tracking-widest text-neutral-400">{sec.title}</h3>
                {sec.paragraphs.map((p, i) => (
                  <p key={i} className="text-xs">{p}</p>
                ))}
              </section>
            ))}

            {snapshot.length > 0 && (
              <div className="p-4 bg-emerald-50/60 border border-emerald-100 rounded-xl space-y-1">
                <p className="text-[10px] font-black uppercase tracking-widest text-emerald-800">
                  Valores calculados nesta pesquisa
                </p>
                {snapshot.map((line, i) => (
                  <p key={i} className="text-xs font-semibold text-emerald-900">
                    • {line}
                  </p>
                ))}
              </div>
            )}

            <p className="text-[10px] text-neutral-400 border-t border-neutral-100 pt-4">
              Especificação matemática: <code className="bg-neutral-100 px-1 rounded">algoritmo.md</code>
            </p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
