"use client";

import React from "react";
import { Plus, Trash2 } from "lucide-react";
import { calculateSamplingStats } from "../risk-engine";
import type { SmartSurveyBoardViewProps } from "../SmartSurveyBoardView";
import { useTranslation } from "@/lib/hooks/useTranslation";

export function CompanyDirectoryView(props: SmartSurveyBoardViewProps) {
  const {
    selectedCompanyId,
    setSelectedCompanyId,
    setSubTab,
    companySearchQuery,
    setCompanySearchQuery,
    companyTemplateFilter,
    setCompanyTemplateFilter,
    setIsCreateModalOpen,
    companies,
    handleDeleteCompany,
    getRiskLevel,
    calculateCompanyGlobalRisk,
  } = props;
  const { t } = useTranslation();

  return (
<>
      {/* ==========================================
          💼 1. Companies Directory View
         ========================================== */}
      {!selectedCompanyId && (
        <div className="space-y-6 animate-in fade-in duration-300">
          
          {/* Header & Controls bar */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white rounded-[2rem] border border-neutral-100 p-6 shadow-sm">
            <div>
              <h2 className="text-lg font-black uppercase tracking-wider text-neutral-800 font-sans">
                {t("admin.smartSurvey.directory.title")}
              </h2>
              <p className="text-xs text-neutral-400 mt-0.5">{t("admin.smartSurvey.directory.subtitle")}</p>
            </div>

            {/* Premium Search, Filter & Trigger */}
            <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
              <input
                type="text"
                value={companySearchQuery}
                onChange={e => setCompanySearchQuery(e.target.value)}
                placeholder={t("admin.smartSurvey.directory.searchPlaceholder")}
                className="bg-neutral-50 hover:bg-neutral-100 border border-neutral-200/80 rounded-xl px-4 py-2.5 text-xs font-semibold focus:outline-none focus:border-emerald-500 focus:bg-white transition-all w-full sm:w-48 placeholder:text-neutral-400"
              />
              
              <select
                value={companyTemplateFilter}
                onChange={e => setCompanyTemplateFilter(e.target.value as any)}
                className="bg-neutral-50 hover:bg-neutral-100 border border-neutral-200/80 rounded-xl px-3 py-2.5 text-xs font-black uppercase tracking-widest transition-colors cursor-pointer outline-none w-full sm:w-auto"
              >
                <option value="all">{t("admin.smartSurvey.directory.filterAll")}</option>
                <option value="nr1_compliance">{t("admin.smartSurvey.directory.filterNR1")}</option>
                <option value="continuous_reporting">{t("admin.smartSurvey.directory.filterLogs")}</option>
                <option value="todo_algorithm">{t("admin.smartSurvey.directory.filterTodo")}</option>
              </select>

              <button
                onClick={() => setIsCreateModalOpen(true)}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs uppercase tracking-widest px-5 py-3 rounded-xl shadow-md transition-all active:scale-[0.98] cursor-pointer flex items-center gap-1.5 w-full sm:w-auto justify-center"
              >
                <Plus size={14} strokeWidth={2.5} />
                {t("admin.smartSurvey.directory.newOrg")}
              </button>
            </div>
          </div>

          {/* Premium Tabular Directory View */}
          <div className="bg-white rounded-[2rem] border border-neutral-100 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left">
                <thead>
                  <tr className="bg-neutral-50/70 border-b border-neutral-100">
                    <th className="p-5 text-[10px] font-black uppercase tracking-widest text-neutral-400">{t("admin.smartSurvey.directory.thOrg")}</th>
                    <th className="p-5 text-[10px] font-black uppercase tracking-widest text-neutral-400">{t("admin.smartSurvey.directory.thTemplate")}</th>
                    <th className="p-5 text-[10px] font-black uppercase tracking-widest text-neutral-400 text-center">{t("admin.smartSurvey.directory.thSampling")}</th>
                    <th className="p-5 text-[10px] font-black uppercase tracking-widest text-neutral-400 text-center">{t("admin.smartSurvey.directory.thCoverage")}</th>
                    <th className="p-5 text-[10px] font-black uppercase tracking-widest text-neutral-400 text-right">{t("admin.smartSurvey.directory.thMetric")}</th>
                    <th className="p-5 text-[10px] font-black uppercase tracking-widest text-neutral-400 text-right">{t("admin.smartSurvey.directory.thActions")}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-50">
                  {companies
                    .filter(company => {
                      const matchesSearch = company.name.toLowerCase().includes(companySearchQuery.toLowerCase());
                      const matchesFilter = companyTemplateFilter === "all" || (company.surveys || []).some(s => s.template === companyTemplateFilter);
                      return matchesSearch && matchesFilter;
                    })
                    .map(company => {
                      // Calculate stats for table
                      const activeResponses = company.surveys?.[0]?.responses || {};
                      const n = Object.values(activeResponses).filter(r => r.completed).length;
                      const N = company.populationSize;
                      const conf = calculateSamplingStats(n, N).coveragePercent;

                      let globalScore = calculateCompanyGlobalRisk(company, activeResponses);
                      const risk = getRiskLevel(globalScore);

                      return (
                        <tr
                          key={company.id}
                          className="hover:bg-neutral-50/40 transition-colors group cursor-pointer"
                          onClick={() => {
                            setSelectedCompanyId(company.id);
                            setSubTab("dashboard");
                          }}
                        >
                          {/* Col 1: Name and avatar */}
                          <td className="p-5">
                            <div className="flex items-center gap-3.5">
                              <div className={`w-9 h-9 rounded-full bg-gradient-to-r ${company.coverImage} flex items-center justify-center text-white shrink-0 font-black text-xs shadow-sm`}>
                                {company.name.charAt(0)}
                              </div>
                              <div className="truncate">
                                <h3 className="text-xs font-black text-neutral-800 uppercase tracking-wide group-hover:text-emerald-700 transition-colors">
                                  {company.name}
                                </h3>
                                <p className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider mt-0.5">
                                  {t("admin.smartSurvey.directory.sectors", { count: company.sectors.length })}
                                </p>
                              </div>
                            </div>
                          </td>

                          {/* Col 2: Template */}
                          <td className="p-5">
                            {(company.surveys?.[0]?.template === "nr1_compliance") ? (
                              <span className="text-[9px] font-black uppercase tracking-widest bg-emerald-50 text-emerald-700 border border-emerald-100/80 px-2.5 py-1 rounded-full">
                                {t("admin.smartSurvey.directory.badgeNR1")}
                              </span>
                            ) : company.surveys?.[0]?.template === "continuous_reporting" ? (
                              <span className="text-[9px] font-black uppercase tracking-widest bg-indigo-50 text-indigo-700 border border-indigo-100/80 px-2.5 py-1 rounded-full">
                                {t("admin.smartSurvey.directory.badgeMetrics", { label: company.respondentLabel })}
                              </span>
                            ) : (
                              <span className="text-[9px] font-black uppercase tracking-widest bg-purple-50 text-purple-700 border border-purple-100/80 px-2.5 py-1 rounded-full">
                                {t("admin.smartSurvey.directory.badgeTodo")}
                              </span>
                            )}
                          </td>

                          {/* Col 3: Sample n/N */}
                          <td className="p-5 text-center font-mono text-xs font-bold text-neutral-500">
                            {n} <span className="text-neutral-300">/</span> {N}
                          </td>

                          {/* Col 4: Confidence */}
                          <td className="p-5 text-center">
                            {(company.surveys?.[0]?.template === "nr1_compliance") ? (
                              <span className={`text-xs font-black font-mono px-2 py-0.5 rounded ${
                                conf >= 95 ? "text-emerald-600 bg-emerald-50/50" : 
                                conf >= 70 ? "text-amber-600 bg-amber-50/50" : 
                                "text-red-600 bg-red-50/50"
                              }`}>
                                {conf}%
                              </span>
                            ) : (
                              <span className="text-xs font-black font-mono text-neutral-400">—</span>
                            )}
                          </td>

                          {/* Col 5: Global Metric */}
                          <td className="p-5 text-right font-mono">
                            {company.surveys?.[0]?.template === "nr1_compliance" ? (
                              <div className="space-y-0.5">
                                <span className={`text-xs font-black ${risk.color}`}>
                                  {globalScore !== null ? `${globalScore.toFixed(1)}` : t("admin.smartSurvey.directory.pending")}
                                </span>
                                {globalScore !== null && (
                                  <span className="text-[8px] font-black uppercase tracking-widest text-neutral-400 block">
                                    {risk.label}
                                  </span>
                                )}
                              </div>
                            ) : (
                              <div className="space-y-0.5">
                                <span className="text-xs font-black text-neutral-800">
                                  {t("admin.smartSurvey.directory.logs", { count: company.surveys?.[0]?.continuousLogs?.length || 0 })}
                                </span>
                                <span className="text-[8px] font-black uppercase tracking-widest text-neutral-400 block">
                                  {t("admin.smartSurvey.directory.invoiced", { value: `R$ ${(company.surveys?.[0]?.continuousLogs?.reduce((sum: number, log: any) => sum + log.faturamento, 0) || 0).toLocaleString(t("common.locale") === 'en' ? "en-US" : "pt-BR")}` })}
                                </span>
                              </div>
                            )}
                          </td>

                          {/* Col 6: Actions */}
                          <td className="p-5 text-right" onClick={e => e.stopPropagation()}>
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => {
                                  setSelectedCompanyId(company.id);
                                  setSubTab("dashboard");
                                }}
                                className="bg-neutral-50 hover:bg-neutral-900 hover:text-white text-neutral-700 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all cursor-pointer border border-neutral-200/50"
                              >
                                {t("admin.smartSurvey.directory.actionPanel")}
                              </button>
                              <button
                                onClick={() => handleDeleteCompany(company.id, company.name)}
                                className="text-neutral-400 hover:text-red-600 hover:bg-red-50 border border-transparent hover:border-red-100 p-2 rounded-lg transition-all cursor-pointer"
                                title={t("admin.smartSurvey.directory.actionRemove")}
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  {companies.filter(company => {
                    const matchesSearch = company.name.toLowerCase().includes(companySearchQuery.toLowerCase());
                    const matchesFilter = companyTemplateFilter === "all" || (company.surveys || []).some(s => s.template === companyTemplateFilter);
                    return matchesSearch && matchesFilter;
                  }).length === 0 && (
                    <tr>
                      <td colSpan={6} className="p-12 text-center text-neutral-400 text-xs font-semibold bg-neutral-50/20">
                        {t("admin.smartSurvey.directory.noOrganizations")}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
</>
  );
}
