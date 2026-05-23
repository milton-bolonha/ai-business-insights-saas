"use client";

import React from "react";
import { ShieldCheck, Building2, Users, ClipboardList, ArrowLeft, Printer, BookOpen } from "lucide-react";
import type { SmartSurveyBoardViewProps } from "../SmartSurveyBoardView";

export function SmartSurveyHeader(props: SmartSurveyBoardViewProps) {
  const {
    selectedCompanyId,
    setSelectedCompanyId,
    activeCompany,
    activeSurvey,
    setSubTab,
    completedSamplesCount,
    handlePrintPremiumPDF,
    setIsMethodologyModalOpen,
  } = props;

  return (
    <div className="ssb-card p-8 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
      <div className="space-y-4 w-full">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-black tracking-tight text-neutral-900 font-sans">
              {activeCompany ? activeCompany.name : "I/O - Smart Survey"}
            </h1>
          </div>
          <p className="text-neutral-500 text-sm font-sans max-w-3xl">
            {activeCompany ? (
              "Hub Central de Pesquisa e Diagnóstico"
            ) : (
              "Selecione uma empresa para visualizar o painel central."
            )}
          </p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row lg:flex-col gap-2.5 shrink-0 justify-end">
        {selectedCompanyId && (
          <button
            type="button"
            onClick={() => {
              setSelectedCompanyId(null);
              setSubTab("dashboard");
            }}
            className="flex items-center justify-center gap-2 border border-neutral-200 hover:border-neutral-300 bg-white hover:bg-neutral-50 text-neutral-800 px-5 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all cursor-pointer"
          >
            <ArrowLeft size={14} />
            Voltar ao diretório
          </button>
        )}

        {activeSurvey && activeSurvey.template === "nr1_compliance" && (
          <button
            type="button"
            onClick={handlePrintPremiumPDF}
            disabled={completedSamplesCount === 0}
            className="flex items-center justify-center gap-2 bg-neutral-900 hover:bg-black text-white px-5 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all cursor-pointer disabled:opacity-50"
          >
            <Printer size={14} />
            Imprimir laudo PDF
          </button>
        )}
      </div>
    </div>
  );
}
