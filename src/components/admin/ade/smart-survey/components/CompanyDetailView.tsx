"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ShieldAlert, Activity, Building2, Users, User2, PlayCircle, CheckCircle2, AlertTriangle, TrendingUp, Plus, Trash2, HelpCircle, Briefcase, Calculator, SplitSquareHorizontal, BrainCircuit, RefreshCw, ShieldCheck, Check, Settings, UserCheck, ClipboardList, Send, Calendar, DollarSign, LineChart, BarChart2, List, X } from "lucide-react";
import type { SmartSurveyBoardViewProps } from "../SmartSurveyBoardView";
import { CollaboratorDetailPanel } from "./CollaboratorDetailPanel";
import { IntervieweePortal } from "./IntervieweePortal";
import { SurveyBuilder } from "./SurveyBuilder";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useTranslation } from "@/lib/hooks/useTranslation";

export function CompanyDetailView(props: SmartSurveyBoardViewProps) {
  const { t, locale } = useTranslation();
  const [makerSurvey, setMakerSurvey] = useState<any | null>(null);

  const {

    selectedCompanyId,
    setSelectedCompanyId,
    activeCompany,
    sessionRole,
    setSessionRole,
    subTab,
    setSubTab,
    companySearchQuery,
    setCompanySearchQuery,
    companyTemplateFilter,
    setCompanyTemplateFilter,
    setIsCreateModalOpen,
    companies,
    completedSamplesCount,
    companyGlobalRiskAverage,
    companyConfidenceLevel,
    aggregatedLogs,
    sectorBreakdowns,
    polarizedSectorsCount,
    getCollaboratorGlobalRisk,
    getCollaboratorTopicRisk,
    handlePrintPremiumPDF,
    handleDeleteCompany,
    clerkInvites,
    selectedCollabIdForDetails,
    setSelectedCollabIdForDetails,
    showAddCollab,
    setShowAddCollab,
    newCollabName,
    setNewCollabName,
    newCollabSector,
    setNewCollabSector,
    newCollabRole,
    setNewCollabRole,
    handleAddCollabSubmit,
    handleDeleteCollab,
    handleUpdateCompanySettings,
    newSectorName,
    setNewSectorName,
    handleAddSector,
    handleDeleteSector,
    inviteEmail,
    setInviteEmail,
    inviteRole,
    setInviteRole,
    handleSendMockInvite,
    handleDeleteInvite,
    logDate,
    setLogDate,
    logCollabId,
    setLogCollabId,
    logQtdVendas,
    setLogQtdVendas,
    logApresentacoes,
    setLogApresentacoes,
    logFaturamento,
    setLogFaturamento,
    handleAddContinuousLog,
    handleDeleteContinuousLog,
    reportScope,
    setReportScope,
    continuousViewTab,
    setContinuousViewTab,
    handleSimulateSurveyResponses,
    handleGenerateAIReport,
    isGeneratingAI,
    guestAuditorId,
    setGuestAuditorId,
    guestRespondentId,
    setGuestRespondentId,
    handleStartSurveySequential,
    handleStartSurveySingleModule,
    activeFormOverlay,
    setActiveFormOverlay,
    overlayAnswers,
    handleSelectAnswerValue,
    handleBackSequentialStep,
    handleNextSequentialStep,
    updateCompanyInState,
    push,
    getRiskLevel,
    calculateCompanyGlobalRisk,
    NR1_TOPICS,
    activeSurvey,
    selectedSurveyId,
    setSelectedSurveyId,
    samplingStats,
    setIsMethodologyModalOpen,
    newSurveyTitle,
    setNewSurveyTitle,
    handleAddSurvey,
    handleDeleteSurvey,
    handleUpdateSurveyMeta,
    editingSurveyId,
    setEditingSurveyId,
    organizationAnalytics,
    iroTrend,
  } = props;

  const participantLabel = activeCompany?.respondentLabel || "Entrevistados";

  return (
<>
      {/* ==========================================
          🏢 2. Dashboard Scoped Tabs View
         ========================================== */}
      {selectedCompanyId && activeCompany && sessionRole === "respondent" && (
        <IntervieweePortal {...props} />
      )}

      {selectedCompanyId && activeCompany && sessionRole !== "respondent" && (
        <div className="space-y-8 animate-in fade-in duration-300">
          {/* Horizontal Navigation Menu & Survey Selector */}
          <div className="bg-white rounded-2xl border border-neutral-100 p-2 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex overflow-x-auto scrollbar-none gap-2 px-2">
              {sessionRole === "admin" && (
                <>
                  <button
                    onClick={() => setSubTab("dashboard")}
                    className={`px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all cursor-pointer flex items-center gap-2 ${
                      subTab === "dashboard"
                        ? "bg-emerald-50 text-emerald-700"
                        : "bg-transparent text-neutral-500 hover:bg-neutral-50"
                    }`}
                  >
                    <Activity size={14} />
                    {t("admin.smartSurvey.detailView.tabs.dashboard")}
                  </button>
                  <button
                    onClick={() => setSubTab("collaborators")}
                    className={`px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all cursor-pointer flex items-center gap-2 ${
                      subTab === "collaborators"
                        ? "bg-emerald-50 text-emerald-700"
                        : "bg-transparent text-neutral-500 hover:bg-neutral-50"
                    }`}
                  >
                    <Users size={14} />
                    {participantLabel}
                  </button>
                  <button
                    onClick={() => setSubTab("surveys")}
                    className={`px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all cursor-pointer flex items-center gap-2 ${
                      subTab === "surveys"
                        ? "bg-emerald-50 text-emerald-700"
                        : "bg-transparent text-neutral-500 hover:bg-neutral-50"
                    }`}
                  >
                    <ClipboardList size={14} />
                    {t("admin.smartSurvey.detailView.tabs.surveys")}
                  </button>
                  <button
                    onClick={() => setSubTab("settings")}
                    className={`px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all cursor-pointer flex items-center gap-2 ${
                      subTab === "settings"
                        ? "bg-emerald-50 text-emerald-700"
                        : "bg-transparent text-neutral-500 hover:bg-neutral-50"
                    }`}
                  >
                    <Settings size={14} />
                    {t("admin.smartSurvey.detailView.tabs.settings")}
                  </button>
                </>
              )}
              {(sessionRole === "admin" || sessionRole === "auditor") && activeSurvey?.template === "nr1_compliance" && (
                <button
                  onClick={() => setSubTab("auditor_panel")}
                  className={`px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all cursor-pointer flex items-center gap-2 ${
                    subTab === "auditor_panel"
                      ? "bg-emerald-50 text-emerald-700"
                      : "bg-transparent text-neutral-500 hover:bg-neutral-50"
                  }`}
                >
                  <ClipboardList size={14} />
                  {t("admin.smartSurvey.detailView.tabs.auditorPanel")}
                </button>
              )}
              {sessionRole === "admin" && (
                <button
                  onClick={() => setSubTab("interviewee_panel")}
                  className={`px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all cursor-pointer flex items-center gap-2 ${
                    subTab === "interviewee_panel"
                      ? "bg-emerald-50 text-emerald-700"
                      : "bg-transparent text-neutral-500 hover:bg-neutral-50"
                  }`}
                >
                  <User2 size={14} />
                  {t("admin.smartSurvey.detailView.tabs.portalOf", { label: activeCompany.respondentLabel })}
                </button>
              )}
            </div>

            {(activeCompany.surveys?.length || 0) > 0 && (
              <div className="flex items-center gap-2 px-2 pb-2 md:pb-0 shrink-0 border-t md:border-t-0 md:border-l border-neutral-100 pt-2 md:pt-0 md:pl-4">
                <span className="text-[9px] font-black uppercase tracking-widest text-neutral-400">{t("admin.smartSurvey.detailView.active")}</span>
                <select
                  value={selectedSurveyId || activeCompany.surveys![0].id}
                  onChange={e => setSelectedSurveyId(e.target.value)}
                  className="bg-neutral-50 hover:bg-neutral-100 border border-neutral-200 rounded-lg px-3 py-1.5 text-[10px] font-black uppercase tracking-widest transition-colors cursor-pointer outline-none w-40 truncate"
                >
                  {activeCompany.surveys!.map(s => (
                    <option key={s.id} value={s.id}>{s.title}</option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => setIsMethodologyModalOpen(true)}
                  className="p-1.5 text-neutral-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
                  title={t("admin.smartSurvey.detailView.methodology")}
                >
                  <HelpCircle size={14} />
                </button>
              </div>
            )}
          </div>

          {/* ==========================================
              SUBTAB: Dashboard / Diagnóstico
             ========================================== */}
          {subTab === "dashboard" && sessionRole === "admin" && (
            <div className="space-y-8 animate-in fade-in duration-300">
              
              {/* Highlight AI Summary Card */}
              {activeSurvey?.aiReport && (
                <div className="bg-white border-l-4 border-l-indigo-500 rounded-2xl p-6 shadow-sm border border-neutral-100 flex gap-4">
                  <div className="p-3 bg-indigo-50 rounded-xl shrink-0 h-fit">
                    <BrainCircuit size={24} className="text-indigo-600" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-xs font-black uppercase tracking-widest text-indigo-900">{t("admin.smartSurvey.detailView.aiSummary")}</h3>
                    <div className="prose prose-sm prose-neutral max-w-none text-neutral-600 bg-white border border-neutral-100 rounded-[2rem] p-8 shadow-sm">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {activeSurvey.aiReport}
                      </ReactMarkdown>
                    </div>
                  </div>
                </div>
              )}

              {/* Stat card summaries */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                
                {/* 1. Global score */}
                {activeSurvey?.template === "nr1_compliance" ? (
                  <div className="bg-white rounded-[2rem] border border-neutral-100 p-6 shadow-sm flex flex-col justify-between">
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-[10px] font-black uppercase tracking-widest text-neutral-400">{t("admin.smartSurvey.detailView.iroSp")}</span>
                      <div className="p-2 bg-emerald-50 rounded-xl">
                        <Activity size={16} className="text-emerald-600" />
                      </div>
                    </div>
                    <div>
                      <div className="text-5xl font-black tracking-tight text-neutral-900 font-mono">
                        {companyGlobalRiskAverage !== null ? companyGlobalRiskAverage.toFixed(1) : "0.0"}
                      </div>
                      <div className="flex items-center gap-2 mt-2">
                        <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded ${getRiskLevel(companyGlobalRiskAverage).bg} ${getRiskLevel(companyGlobalRiskAverage).color} border border-current`}>
                          {getRiskLevel(companyGlobalRiskAverage).label}
                        </span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="bg-white rounded-[2rem] border border-neutral-100 p-6 shadow-sm flex flex-col justify-between">
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-[10px] font-black uppercase tracking-widest text-neutral-400">{t("admin.smartSurvey.detailView.totalRevenue")}</span>
                      <div className="p-2 bg-emerald-50 rounded-xl">
                        <DollarSign size={16} className="text-emerald-600" />
                      </div>
                    </div>
                    <div>
                      <div className="text-3xl font-black tracking-tight text-neutral-900 font-mono">
                        {locale === 'pt' ? 'R$ ' : '$ '}{(activeSurvey?.continuousLogs || []).reduce((acc, cur) => acc + cur.faturamento, 0).toLocaleString(locale === 'en' ? "en-US" : "pt-BR")}
                      </div>
                      <div className="text-[9px] font-bold text-neutral-400 uppercase tracking-widest mt-1">
                        {t("admin.smartSurvey.detailView.sumCorporateRevenue")}
                      </div>
                    </div>
                  </div>
                )}

                {/* 2. Confidence Level / Total Sales */}
                {activeSurvey?.template === "nr1_compliance" ? (
                  <div className="bg-white rounded-[2rem] border border-neutral-100 p-6 shadow-sm flex flex-col justify-between">
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-[10px] font-black uppercase tracking-widest text-neutral-400">{t("admin.smartSurvey.detailView.sampleCoverage")}</span>
                      <div className="p-2 bg-neutral-50 rounded-xl">
                        <Calculator size={16} className="text-neutral-500" />
                      </div>
                    </div>
                    <div>
                      <div className="text-5xl font-black tracking-tight text-neutral-900 font-mono">
                        {samplingStats?.coveragePercent ?? 0}%
                      </div>
                      <div className="text-[9px] font-bold text-neutral-400 mt-2 leading-relaxed">
                        {t("admin.smartSurvey.detailView.completedUniverse", { completed: completedSamplesCount, population: activeCompany.populationSize })}
                        {samplingStats && !samplingStats.isCensus && samplingStats.marginOfErrorPercent !== null && (
                          <span className="block mt-1">{t("admin.smartSurvey.detailView.marginOfError", { margin: samplingStats.marginOfErrorPercent })}</span>
                        )}
                        {samplingStats?.isCensus && (
                          <span className="block mt-1 text-emerald-600">{t("admin.smartSurvey.detailView.censusDeclared")}</span>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="bg-white rounded-[2rem] border border-neutral-100 p-6 shadow-sm flex flex-col justify-between">
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-[10px] font-black uppercase tracking-widest text-neutral-400">{t("admin.smartSurvey.detailView.salesQty")}</span>
                      <div className="p-2 bg-neutral-50 rounded-xl">
                        <TrendingUp size={16} className="text-neutral-500" />
                      </div>
                    </div>
                    <div>
                      <div className="text-5xl font-black tracking-tight text-neutral-900 font-mono">
                        {(activeSurvey?.continuousLogs || []).reduce((acc, cur) => acc + cur.qtdVendas, 0)}
                      </div>
                      <div className="text-[9px] font-bold text-neutral-400 uppercase tracking-widest mt-2">
                        {t("admin.smartSurvey.detailView.totalClosings")}
                      </div>
                    </div>
                  </div>
                )}

                {/* 3. Divergence sectors / Presentations */}
                {activeSurvey?.template === "nr1_compliance" ? (
                  <div className="bg-white rounded-[2rem] border border-neutral-100 p-6 shadow-sm flex flex-col justify-between">
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-[10px] font-black uppercase tracking-widest text-neutral-400">{t("admin.smartSurvey.detailView.sectorPolarization")}</span>
                      <div className="p-2 bg-indigo-50 rounded-xl">
                        <SplitSquareHorizontal size={16} className="text-indigo-600" />
                      </div>
                    </div>
                    <div>
                      <div className="text-5xl font-black tracking-tight text-neutral-900 font-mono">
                        {polarizedSectorsCount}
                      </div>
                      <div className="flex items-center gap-2 mt-2">
                        <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded ${polarizedSectorsCount > 0 ? 'bg-indigo-50 text-indigo-700 border border-indigo-200 animate-pulse' : 'bg-neutral-50 text-neutral-500'}`}>
                          {polarizedSectorsCount > 0 ? t("admin.smartSurvey.detailView.severeDivergence") : t("admin.smartSurvey.detailView.generalConsensus")}
                        </span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="bg-white rounded-[2rem] border border-neutral-100 p-6 shadow-sm flex flex-col justify-between">
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-[10px] font-black uppercase tracking-widest text-neutral-400">{t("admin.smartSurvey.detailView.presentations")}</span>
                      <div className="p-2 bg-indigo-50 rounded-xl">
                        <Briefcase size={16} className="text-indigo-600" />
                      </div>
                    </div>
                    <div>
                      <div className="text-5xl font-black tracking-tight text-neutral-900 font-mono">
                        {(activeSurvey?.continuousLogs || []).reduce((acc, cur) => acc + cur.apresentacoes, 0)}
                      </div>
                      <div className="text-[9px] font-bold text-neutral-400 uppercase tracking-widest mt-2">
                        {t("admin.smartSurvey.detailView.commercialDemos")}
                      </div>
                    </div>
                  </div>
                )}

                {/* 4. AI report state */}
                <div className="bg-white rounded-[2rem] border border-neutral-100 p-6 shadow-sm flex flex-col justify-between">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-[10px] font-black uppercase tracking-widest text-neutral-400">{t("admin.smartSurvey.detailView.controlsDev")}</span>
                    <div className="p-2 bg-neutral-50 rounded-xl">
                      <BrainCircuit size={16} className="text-neutral-500" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    {activeSurvey?.template === "nr1_compliance" ? (
                      <button
                        onClick={handleSimulateSurveyResponses}
                        className="w-full bg-neutral-900 hover:bg-black text-white py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
                      >
                        <RefreshCw size={11} />
                        {t("admin.smartSurvey.detailView.simulateResponses")}
                      </button>
                    ) : (
                      <div className="text-xs font-bold text-neutral-800 leading-snug">
                        {t("admin.smartSurvey.detailView.continuousLogOf", { label: activeCompany.respondentLabel })}
                      </div>
                    )}

                    {activeSurvey?.template === "nr1_compliance" && (
                      <button
                        onClick={handleGenerateAIReport}
                        disabled={completedSamplesCount === 0 || isGeneratingAI}
                        className="w-full border border-neutral-200 bg-white hover:bg-neutral-50 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest text-neutral-700 transition-colors cursor-pointer"
                      >
                        {isGeneratingAI ? t("admin.smartSurvey.detailView.pleaseWait") : activeSurvey?.aiReport ? t("admin.smartSurvey.detailView.regenerateReport") : t("admin.smartSurvey.detailView.generateSstReport")}
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {activeSurvey?.template === "nr1_compliance" && organizationAnalytics && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div className="bg-white rounded-[2rem] border border-neutral-100 p-6 shadow-sm">
                    <span className="text-[10px] font-black uppercase tracking-widest text-neutral-400">{t("admin.smartSurvey.detailView.globalDispersion")}</span>
                    <div className="text-4xl font-black font-mono mt-3 text-neutral-900">
                      {organizationAnalytics.dispersion !== null ? organizationAnalytics.dispersion.toFixed(2) : "—"}
                    </div>
                    <span className={`text-[9px] font-black uppercase mt-2 inline-block px-2 py-0.5 rounded border ${organizationAnalytics.dispersionLevel.bg} ${organizationAnalytics.dispersionLevel.color}`}>
                      {organizationAnalytics.dispersionLevel.label}
                    </span>
                    <p className="text-[9px] text-neutral-400 mt-2">{t("admin.smartSurvey.detailView.dispersionDesc")}</p>
                  </div>
                  <div className="bg-white rounded-[2rem] border border-neutral-100 p-6 shadow-sm">
                    <span className="text-[10px] font-black uppercase tracking-widest text-neutral-400">{t("admin.smartSurvey.detailView.iroVariation")}</span>
                    <div className="text-4xl font-black font-mono mt-3 text-neutral-900">
                      {iroTrend.delta !== null ? `${iroTrend.delta > 0 ? "+" : ""}${iroTrend.delta.toFixed(2)}` : "—"}
                    </div>
                    <span className="text-[9px] font-black uppercase text-neutral-600 mt-2 block">{iroTrend.label}</span>
                    <p className="text-[9px] text-neutral-400 mt-1">{t("admin.smartSurvey.detailView.comparedToPrevious")}</p>
                    {iroTrend.acceleration !== null && (
                      <p className="text-[9px] text-neutral-400">{t("admin.smartSurvey.detailView.changeRate", { val: (iroTrend.acceleration > 0 ? "+" : "") + iroTrend.acceleration.toFixed(2) })}</p>
                    )}
                  </div>
                  <div className="bg-white rounded-[2rem] border border-neutral-100 p-6 shadow-sm">
                    <span className="text-[10px] font-black uppercase tracking-widest text-neutral-400">{t("admin.smartSurvey.detailView.sampleBias")}</span>
                    <div className="text-4xl font-black font-mono mt-3 text-neutral-900">
                      {organizationAnalytics.bias ? `${organizationAnalytics.bias.biasIndex}%` : "—"}
                    </div>
                    <span className="text-[9px] font-black uppercase text-neutral-600 mt-2 block">
                      {organizationAnalytics.bias?.label ?? t("admin.smartSurvey.detailView.noSample")}
                    </span>
                  </div>
                  <div className="bg-white rounded-[2rem] border border-neutral-100 p-6 shadow-sm">
                    <span className="text-[10px] font-black uppercase tracking-widest text-neutral-400">{t("admin.smartSurvey.detailView.scoreDiversity")}</span>
                    <div className="text-4xl font-black font-mono mt-3 text-neutral-900">
                      {organizationAnalytics.entropy ? `${organizationAnalytics.entropy.normalized}%` : "—"}
                    </div>
                    <span className="text-[9px] font-black uppercase text-neutral-600 mt-2 block">
                      {organizationAnalytics.entropy?.label ?? "—"}
                    </span>
                  </div>
                </div>
              )}

              {/* MAIN CONTENT: NR-1 vs. Continuous Metrics Rendering */}
              {activeSurvey?.template === "nr1_compliance" ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Left: Sectors breakdown stats */}
                  <div className="bg-white rounded-[2.5rem] border border-neutral-100 p-8 shadow-sm space-y-6">
                    <div>
                      <h2 className="text-sm font-black uppercase tracking-wider text-neutral-800">
                        {t("admin.smartSurvey.detailView.avgRiskPerSector")}
                      </h2>
                      <p className="text-xs text-neutral-400 mt-1">{t("admin.smartSurvey.detailView.aggBySector")}</p>
                    </div>

                    <div className="flex items-end gap-3 overflow-x-auto pb-2 pt-8 h-[240px] hide-scrollbar w-full">
                      {completedSamplesCount === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 text-neutral-400 space-y-2 bg-neutral-50 rounded-2xl border border-dashed border-neutral-200 w-full h-full">
                          <span className="text-xs font-bold uppercase tracking-widest">{t("admin.smartSurvey.detailView.noInterviews")}</span>
                          <span className="text-[10px] max-w-xs text-center">{t("admin.smartSurvey.detailView.startInterviewsPanel")}</span>
                        </div>
                      ) : (
                        Object.entries(sectorBreakdowns).map(([name, data]) => {
                          const secRisk = getRiskLevel(data.avg || 0);
                          const heightPercent = data.avg !== null ? (data.avg * 10) : 0;

                          return (
                            <div key={name} className="flex flex-col items-center justify-end h-full min-w-[80px] group flex-1">
                              {/* Polarized warning badge floating above bar */}
                              {data.isPolarized && (
                                <div className="mb-2 text-red-500 animate-pulse drop-shadow-sm" title={t("admin.smartSurvey.detailView.severePolarizationDetected")}>
                                  <AlertTriangle size={14} />
                                </div>
                              )}
                              
                              {/* Vertical Bar */}
                              <div className="relative w-12 h-full bg-neutral-50 rounded-t-xl overflow-hidden flex items-end border-b-2 border-neutral-200">
                                <motion.div
                                  initial={{ height: 0 }}
                                  animate={{ height: `${heightPercent}%` }}
                                  transition={{ duration: 1, ease: "easeOut" }}
                                  className="w-full rounded-t-xl relative group-hover:brightness-110 transition-all"
                                  style={{
                                    backgroundColor: secRisk.hex,
                                    boxShadow: `0 -4px 12px ${secRisk.hex}30`
                                  }}
                                />
                                <div className="absolute top-0 left-0 right-0 bottom-0 flex flex-col justify-end pb-3 items-center pointer-events-none">
                                   <span className="text-[10px] font-black text-white drop-shadow-md z-10 transition-opacity">
                                      {data.avg !== null ? data.avg.toFixed(1) : "0.0"}
                                   </span>
                                </div>
                              </div>
                              
                              {/* Labels */}
                              <div className="text-center mt-3 space-y-0.5 w-full">
                                <h4 className="text-[9px] font-black text-neutral-800 uppercase tracking-widest truncate px-1" title={name}>{name}</h4>
                                <p className="text-[8px] font-bold text-neutral-400 uppercase tracking-wider">{t("admin.smartSurvey.detailView.resCount", { count: data.count })}</p>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>

                  {/* Right: AI Technical report panel */}
                  {(activeSurvey?.aiReport || isGeneratingAI) && (
                    <div className="bg-white rounded-[2.5rem] border border-neutral-100 p-8 shadow-sm space-y-6">
                      <div className="flex items-center justify-between border-b border-neutral-100 pb-4">
                        <div>
                          <h2 className="text-sm font-black uppercase tracking-wider text-neutral-800 font-sans">
                            Parecer técnico SST (IA)
                          </h2>
                          <p className="text-xs text-neutral-400 mt-1 font-sans">Sumário Analítico — pesquisa ativa</p>
                        </div>
                      </div>

                      <div className="min-h-[220px] bg-neutral-50/50 border border-neutral-200/50 rounded-2xl p-6 overflow-y-auto max-h-[360px]">
                        {isGeneratingAI ? (
                          <div className="flex flex-col items-center justify-center h-full py-16 gap-3">
                            <RefreshCw size={24} className="animate-spin text-emerald-600" />
                            <span className="text-xs font-bold text-neutral-500 uppercase tracking-widest">Compilando laudo SST preliminar...</span>
                          </div>
                        ) : activeSurvey?.aiReport && (
                          <div className="prose prose-sm prose-neutral max-w-none text-neutral-600">
                            <ReactMarkdown remarkPlugins={[remarkGfm]}>
                              {activeSurvey.aiReport}
                            </ReactMarkdown>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                /* ==========================================
                    📈 Continuous Reporting Logging Dashboard
                   ========================================== */
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  {/* Left: Quick logging logger form */}
                  <div className="bg-white rounded-[2.5rem] border border-neutral-100 p-8 shadow-sm space-y-6">
                    <div>
                      <h2 className="text-sm font-black uppercase tracking-wider text-neutral-800">
                        {t("admin.smartSurvey.detailView.logRecordOf", { label: activeCompany.respondentLabel })}
                      </h2>
                      <p className="text-xs text-neutral-400 mt-1">{t("admin.smartSurvey.detailView.postDailyMetrics")}</p>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <label className="text-[10px] font-black uppercase tracking-widest text-neutral-500 block mb-1">
                          {t("admin.smartSurvey.detailView.logDate")}
                        </label>
                        <input
                          type="date"
                          value={logDate}
                          onChange={e => setLogDate(e.target.value)}
                          className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-4 py-3 text-xs font-semibold outline-none focus:border-indigo-500"
                        />
                      </div>

                      <div>
                        <label className="text-[10px] font-black uppercase tracking-widest text-neutral-500 block mb-1">
                          {t("admin.smartSurvey.detailView.nameOf", { label: activeCompany.respondentLabel })}
                        </label>
                        <select
                          value={logCollabId}
                          onChange={e => setLogCollabId(e.target.value)}
                          className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-4 py-3 text-xs font-semibold outline-none focus:border-indigo-500"
                        >
                          {activeCompany.collaborators.map(c => (
                            <option key={c.id} value={c.id}>{c.name} ({c.sector})</option>
                          ))}
                        </select>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-[10px] font-black uppercase tracking-widest text-neutral-500 block mb-1">
                            {t("admin.smartSurvey.detailView.presentations")}
                          </label>
                          <input
                            type="number"
                            min="0"
                            value={logApresentacoes}
                            onChange={e => setLogApresentacoes(e.target.value)}
                            className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-4 py-3 text-xs font-semibold outline-none focus:border-indigo-500"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-black uppercase tracking-widest text-neutral-500 block mb-1">
                            {t("admin.smartSurvey.detailView.qtySales")}
                          </label>
                          <input
                            type="number"
                            min="0"
                            value={logQtdVendas}
                            onChange={e => setLogQtdVendas(e.target.value)}
                            className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-4 py-3 text-xs font-semibold outline-none focus:border-indigo-500"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="text-[10px] font-black uppercase tracking-widest text-neutral-500 block mb-1">
                          {t("admin.smartSurvey.detailView.revenueGenerated", { currency: locale === 'pt' ? 'R$' : '$' })}
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={logFaturamento}
                          onChange={e => setLogFaturamento(e.target.value)}
                          className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-4 py-3 text-xs font-semibold outline-none focus:border-indigo-500"
                        />
                      </div>

                      <button
                        type="button"
                        onClick={handleAddContinuousLog}
                        className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-black text-[10px] uppercase tracking-widest py-3.5 rounded-xl transition-all active:scale-[0.98] cursor-pointer"
                      >
                        {t("admin.smartSurvey.detailView.saveOpLog")}
                      </button>
                    </div>
                  </div>

                  {/* Right: Logging History Table */}
                  <div className="bg-white rounded-[2.5rem] border border-neutral-100 p-8 shadow-sm space-y-6 lg:col-span-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <h2 className="text-sm font-black uppercase tracking-wider text-neutral-800">
                          {t("admin.smartSurvey.detailView.continuousCommIntel")}
                        </h2>
                        <p className="text-xs text-neutral-400 mt-1">{t("admin.smartSurvey.detailView.metricsTimeline")}</p>
                      </div>
                      <div className="flex bg-neutral-100 rounded-xl p-1">
                        <button
                          onClick={() => setContinuousViewTab("consolidated")}
                          className={`px-4 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-colors cursor-pointer ${continuousViewTab === 'consolidated' ? 'bg-white shadow-sm text-neutral-800' : 'text-neutral-500 hover:text-neutral-700'}`}
                        >
                          {t("admin.smartSurvey.detailView.timeline")}
                        </button>
                        <button
                          onClick={() => setContinuousViewTab("history")}
                          className={`px-4 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-colors cursor-pointer ${continuousViewTab === 'history' ? 'bg-white shadow-sm text-neutral-800' : 'text-neutral-500 hover:text-neutral-700'}`}
                        >
                          {t("admin.smartSurvey.detailView.entries")}
                        </button>
                      </div>
                    </div>

                    {/* Scope toggle (Daily, Weekly, Monthly) displayed only in Consolidated Mode */}
                    {continuousViewTab === "consolidated" && (
                      <div className="flex items-center justify-between bg-neutral-50 p-3 rounded-2xl border border-neutral-100">
                        <span className="text-[10px] font-black uppercase tracking-widest text-neutral-400 ml-2">
                          {t("admin.smartSurvey.detailView.groupByPeriod")}
                        </span>
                        <div className="flex gap-1">
                          {["daily", "weekly", "monthly"].map(p => (
                            <button
                              key={p}
                              onClick={() => setReportScope(p as any)}
                              className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all cursor-pointer ${reportScope === p ? 'bg-indigo-600 text-white shadow-sm' : 'text-neutral-500 hover:bg-neutral-200/50'}`}
                            >
                              {p === "daily" ? t("admin.smartSurvey.detailView.daily") : p === "weekly" ? t("admin.smartSurvey.detailView.weekly") : t("admin.smartSurvey.detailView.monthly")}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {continuousViewTab === "consolidated" ? (
                      aggregatedLogs.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 text-neutral-400 space-y-2 border border-dashed border-neutral-200 rounded-2xl bg-neutral-50/50">
                          <BarChart2 size={24} className="text-neutral-300" />
                          <span className="text-[10px] font-bold tracking-wide">{t("admin.smartSurvey.detailView.noContinuousLogsGen")}</span>
                        </div>
                      ) : (
                        <div className="overflow-x-auto">
                          <table className="w-full border-collapse">
                            <thead>
                              <tr className="border-b border-neutral-100 bg-neutral-50/50">
                                <th className="p-4 text-[9px] font-black uppercase tracking-widest text-neutral-400 text-left">{t("admin.smartSurvey.detailView.thPeriod")}</th>
                                <th className="p-4 text-[9px] font-black uppercase tracking-widest text-neutral-400 text-right">{t("admin.smartSurvey.detailView.thSales")}</th>
                                <th className="p-4 text-[9px] font-black uppercase tracking-widest text-neutral-400 text-right">{t("admin.smartSurvey.detailView.thApres")}</th>
                                <th className="p-4 text-[9px] font-black uppercase tracking-widest text-neutral-400 text-right">{t("admin.smartSurvey.detailView.thConversion")}</th>
                                <th className="p-4 text-[9px] font-black uppercase tracking-widest text-neutral-400 text-right">{t("admin.smartSurvey.detailView.thTotalRev")}</th>
                                <th className="p-4 text-[9px] font-black uppercase tracking-widest text-neutral-400 text-right">{t("admin.smartSurvey.detailView.thAvgTicket")}</th>
                                <th className="p-4 text-[9px] font-black uppercase tracking-widest text-neutral-400 text-left pl-6">{t("admin.smartSurvey.detailView.thTopOf", { label: activeCompany.respondentLabel })}</th>
                              </tr>
                            </thead>
                            <tbody>
                              {aggregatedLogs.map((g, idx) => {
                                const conversionRate = g.apresentacoes > 0 ? (g.qtdVendas / g.apresentacoes) * 100 : 0;
                                const avgTicket = g.qtdVendas > 0 ? g.faturamento / g.qtdVendas : 0;
                                return (
                                  <tr key={idx} className="border-b border-neutral-50 text-xs">
                                    <td className="p-4 font-bold text-neutral-800">{g.label}</td>
                                    <td className="p-4 text-right font-mono text-xs font-semibold text-neutral-700">{g.qtdVendas}</td>
                                    <td className="p-4 text-right font-mono text-xs font-semibold text-neutral-700">{g.apresentacoes}</td>
                                    <td className="p-4 text-right">
                                      <span className={`px-2 py-0.5 rounded text-[10px] font-black ${conversionRate >= 30 ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}>
                                        {conversionRate.toFixed(0)}%
                                      </span>
                                    </td>
                                    <td className="p-4 text-right font-mono text-xs font-semibold text-neutral-700">
                                      {locale === 'pt' ? 'R$ ' : '$ '}{g.faturamento.toLocaleString(locale === 'en' ? "en-US" : "pt-BR")}
                                    </td>
                                    <td className="p-4 text-right font-mono text-xs font-bold text-indigo-700 bg-indigo-50/30">
                                      {locale === 'pt' ? 'R$ ' : '$ '}{avgTicket.toLocaleString(locale === 'en' ? "en-US" : "pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </td>
                                    <td className="p-4 text-left pl-6 font-bold text-neutral-800">{g.topSellerName}</td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      )
                    ) : (
                      (activeSurvey?.continuousLogs?.length || 0) === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 text-neutral-400 space-y-2 border border-dashed border-neutral-200 rounded-2xl bg-neutral-50/50">
                          <List size={24} className="text-neutral-300" />
                          <span className="text-[10px] font-bold tracking-wide">{t("admin.smartSurvey.detailView.noContinuousLogsForm")}</span>
                        </div>
                      ) : (
                        <div className="overflow-x-auto">
                          <table className="w-full border-collapse">
                            <thead>
                              <tr className="border-b border-neutral-100 bg-neutral-50/50">
                                <th className="p-4 text-[9px] font-black uppercase tracking-widest text-neutral-400 text-left">{t("admin.smartSurvey.detailView.thDate")}</th>
                                <th className="p-4 text-[9px] font-black uppercase tracking-widest text-neutral-400 text-left">{activeCompany.respondentLabel}</th>
                                <th className="p-4 text-[9px] font-black uppercase tracking-widest text-neutral-400 text-center">{t("admin.smartSurvey.detailView.thSales")}</th>
                                <th className="p-4 text-[9px] font-black uppercase tracking-widest text-neutral-400 text-center">{t("admin.smartSurvey.detailView.thApres")}</th>
                                <th className="p-4 text-[9px] font-black uppercase tracking-widest text-neutral-400 text-right">{t("admin.smartSurvey.detailView.thRevenue")}</th>
                                <th className="p-4 text-[9px] font-black uppercase tracking-widest text-neutral-400 text-center">{t("admin.smartSurvey.detailView.thAction")}</th>
                              </tr>
                            </thead>
                              <tbody>
                                {(activeSurvey?.continuousLogs || []).map(log => {
                                  const collabName = activeCompany.collaborators.find(c => c.id === log.collaboratorId)?.name || "Excluído";
                                  return (
                                    <tr key={log.id} className="border-b border-neutral-50 hover:bg-neutral-50/50 text-xs">
                                      <td className="p-4 font-semibold text-neutral-500">
                                        {new Date(log.date + "T00:00:00").toLocaleDateString(locale === 'en' ? "en-US" : "pt-BR")}
                                      </td>
                                      <td className="p-4 font-bold text-neutral-800">
                                        {collabName}
                                        {log.deletedAt && (
                                          <span className="ml-2 px-2 py-0.5 bg-red-100 text-red-700 rounded text-[8px] font-black uppercase tracking-widest">
                                            {t("admin.smartSurvey.detailView.excluded")}
                                          </span>
                                        )}
                                      </td>
                                      <td className="p-4 text-center font-mono text-xs font-semibold text-neutral-700">{log.qtdVendas}</td>
                                      <td className="p-4 text-center font-mono text-xs font-semibold text-neutral-700">{log.apresentacoes}</td>
                                      <td className="p-4 text-right font-mono text-xs font-black text-indigo-700">
                                        {locale === 'pt' ? 'R$ ' : '$ '}{log.faturamento.toLocaleString(locale === 'en' ? "en-US" : "pt-BR")}
                                      </td>
                                      <td className="p-4 text-center">
                                        {!log.deletedAt && (
                                          <button
                                            type="button"
                                            onClick={() => handleDeleteContinuousLog(log.id)}
                                            className="text-neutral-400 hover:text-red-600 p-1 rounded transition-colors cursor-pointer"
                                            title={t("admin.smartSurvey.detailView.excludeLog")}
                                          >
                                            <Trash2 size={13} />
                                          </button>
                                        )}
                                      </td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>
                        )
                      )}
                    </div>
                  </div>
              )}
            </div>
          )}

          {/* ==========================================
              SUBTAB: Collaborators / Vendedores Roster
             ========================================== */}
          {subTab === "collaborators" && sessionRole === "admin" && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-in fade-in duration-300">
              
              {/* Roster sidebar list */}
              <div className="lg:col-span-1 bg-white rounded-[2.5rem] border border-neutral-100 p-8 shadow-sm space-y-6">
                <div className="flex justify-between items-center border-b border-neutral-100 pb-4">
                  <div>
                    <h2 className="text-sm font-black uppercase tracking-wider text-neutral-800">
                      Roster de {activeCompany.respondentLabel}
                    </h2>
                    <p className="text-xs text-neutral-400 mt-0.5">Gestão de cadastros autorizados</p>
                  </div>

                  <button
                    onClick={() => setShowAddCollab(!showAddCollab)}
                    className="p-2 bg-neutral-50 hover:bg-neutral-100 border border-neutral-200 rounded-xl transition-all cursor-pointer text-neutral-700"
                  >
                    {showAddCollab ? <X size={15} /> : <Plus size={15} />}
                  </button>
                </div>

                {/* Add new respondent form */}
                <AnimatePresence>
                  {showAddCollab && (
                    <motion.form
                      onSubmit={handleAddCollabSubmit}
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="bg-neutral-50/50 border border-neutral-200/50 rounded-2xl p-5 space-y-4 overflow-hidden"
                    >
                      <div>
                        <label className="text-[9px] font-black uppercase tracking-widest text-neutral-400 block mb-1">Nome Completo *</label>
                        <input
                          type="text"
                          required
                          value={newCollabName}
                          onChange={e => setNewCollabName(e.target.value)}
                          placeholder="Ex: Carlos Almeida"
                          className="w-full bg-white border border-neutral-200 rounded-xl p-3 text-xs font-semibold focus:outline-none focus:border-emerald-500 transition-colors"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-3.5">
                        <div>
                          <label className="text-[9px] font-black uppercase tracking-widest text-neutral-400 block mb-1">Setor *</label>
                          <select
                            value={newCollabSector}
                            onChange={e => setNewCollabSector(e.target.value)}
                            className="w-full bg-white border border-neutral-200 rounded-xl p-3 text-xs font-semibold focus:outline-none focus:border-emerald-500 transition-colors"
                          >
                            {activeCompany.sectors.map(s => (
                              <option key={s} value={s}>{s}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="text-[9px] font-black uppercase tracking-widest text-neutral-400 block mb-1">Cargo</label>
                          <input
                            type="text"
                            value={newCollabRole}
                            onChange={e => setNewCollabRole(e.target.value)}
                            placeholder="Ex: Consultor"
                            className="w-full bg-white border border-neutral-200 rounded-xl p-3 text-xs font-semibold focus:outline-none focus:border-emerald-500 transition-colors"
                          />
                        </div>
                      </div>

                      <button
                        type="submit"
                        className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all cursor-pointer"
                      >
                        Confirmar Cadastro
                      </button>
                    </motion.form>
                  )}
                </AnimatePresence>

                {/* Respondents List */}
                <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1">
                  {activeCompany.collaborators.length === 0 ? (
                    <div className="text-center py-8 text-neutral-400 text-xs font-semibold bg-neutral-50/50 rounded-2xl border border-dashed border-neutral-200">
                      Nenhum registro. Cadastre acima.
                    </div>
                  ) : (
                    activeCompany.collaborators.map(c => {
                      const respObj = activeSurvey?.responses?.[c.id];
                      const progress = respObj
                        ? Math.round(
                            (Object.keys(respObj.answers).filter(k => respObj.answers[k] !== undefined && respObj.answers[k] !== "").length /
                              NR1_TOPICS.reduce((sum, t) => sum + t.questions.length, 0)) *
                              100
                          )
                        : 0;

                      const score = getCollaboratorGlobalRisk(c.id);

                      return (
                        <div
                          key={c.id}
                          role="button"
                          tabIndex={0}
                          onClick={() => setSelectedCollabIdForDetails(c.id)}
                          onKeyDown={e => e.key === "Enter" && setSelectedCollabIdForDetails(c.id)}
                          className={`p-4 border rounded-2xl flex items-center justify-between group transition-all cursor-pointer ${
                            selectedCollabIdForDetails === c.id
                              ? "bg-emerald-50/50 border-emerald-400"
                              : "bg-white border-neutral-200/70 hover:border-neutral-300"
                          }`}
                        >
                          <div className="space-y-0.5 truncate pr-3">
                            <h4 className="text-xs font-bold text-neutral-800 truncate">{c.name}</h4>
                            <p className="text-[10px] text-neutral-400 font-semibold truncate">
                              {c.sector} • {c.role}
                            </p>
                          </div>

                          <div className="flex items-center gap-3 shrink-0">
                            {activeSurvey?.template === "nr1_compliance" && (
                              <>
                                {progress > 0 && progress < 100 && (
                                  <span className="text-[9px] font-black font-mono bg-amber-50 text-amber-600 px-1.5 py-0.5 rounded border border-amber-200">
                                    {progress}%
                                  </span>
                                )}
                                {score !== null ? (
                                  <span className={`text-xs font-black font-mono ${getRiskLevel(score).color}`}>
                                    {score.toFixed(1)}
                                  </span>
                                ) : (
                                  <span className="text-[9px] font-black text-neutral-400 uppercase tracking-wider bg-neutral-50 px-1.5 py-0.5 rounded border border-neutral-200">
                                    Pendente
                                  </span>
                                )}
                              </>
                            )}

                            <button
                              type="button"
                              onClick={e => {
                                e.stopPropagation();
                                handleDeleteCollab(c.id, c.name);
                              }}
                              className="text-neutral-300 hover:text-red-600 p-1 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Right: detail panel or module grid */}
              <div className="lg:col-span-2 space-y-6">
                {selectedCollabIdForDetails ? (
                  <CollaboratorDetailPanel
                    {...props}
                    collaboratorId={selectedCollabIdForDetails}
                    onClose={() => setSelectedCollabIdForDetails(null)}
                  />
                ) : (
                <>
                <div>
                  <h2 className="text-sm font-black uppercase tracking-wider text-neutral-800">
                    Questionários da Pesquisa
                  </h2>
                  <p className="text-xs text-neutral-400 mt-0.5">Selecione um {participantLabel.toLowerCase()} para iniciar a avaliação</p>
                </div>

                {activeSurvey?.questions && activeSurvey.questions.length > 0 ? (
                  <div className="bg-emerald-50/50 border border-emerald-100 rounded-[2rem] p-12 text-center space-y-4">
                    <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto shadow-sm text-emerald-500">
                      <ClipboardList size={32} />
                    </div>
                    <div>
                      <h3 className="text-sm font-black uppercase tracking-wider text-neutral-800">Inquérito Ativo</h3>
                      <p className="text-xs text-neutral-500 max-w-sm mx-auto mt-2">
                        Esta pesquisa possui {activeSurvey.questions.length} perguntas prontas para aplicação.
                      </p>
                    </div>
                    <div className="pt-4">
                      <select
                        onChange={e => {
                          if (e.target.value) {
                            handleStartSurveySequential(e.target.value);
                            e.target.value = "";
                          }
                        }}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl px-5 py-3 text-[10px] font-black uppercase tracking-widest transition-colors cursor-pointer outline-none shadow-sm"
                      >
                        <option value="">Iniciar Entrevista Agora...</option>
                        {activeCompany.collaborators.map(c => (
                          <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                ) : activeSurvey?.template === "continuous_reporting" ? (
                  <div className="bg-white border border-dashed border-neutral-300 rounded-[2rem] p-12 text-center text-neutral-400 space-y-3">
                    <TrendingUp size={48} className="mx-auto text-neutral-300" />
                    <h3 className="text-sm font-black uppercase tracking-wider text-neutral-800">Modelo Log Contínuo Ativo</h3>
                    <p className="text-xs max-w-sm mx-auto leading-relaxed">
                      Esta empresa está configurada com a metodologia de relatórios contínuos diários/semanais ( logs de vendas ). As métricas são registradas diretamente na aba Diagnóstico.
                    </p>
                  </div>
                ) : (
                  <div className="bg-white border border-dashed border-neutral-300 rounded-[2rem] p-12 text-center text-neutral-400 space-y-3">
                    <TrendingUp size={48} className="mx-auto text-neutral-300" />
                    <h3 className="text-sm font-black uppercase tracking-wider text-neutral-800">Algoritmo To-do</h3>
                    <p className="text-xs max-w-sm mx-auto leading-relaxed">
                      Esta organização utiliza o algoritmo personalizado de To-do para gestão e triagem de tarefas inteligentes com IA.
                    </p>
                  </div>
                )}
                </>
                )}
              </div>
            </div>
          )}

          {subTab === "surveys" && sessionRole === "admin" && (
            <div className="bg-white rounded-[2.5rem] border border-neutral-100 p-8 shadow-sm space-y-6">
              <div className="flex flex-wrap justify-between gap-4 border-b border-neutral-100 pb-4">
                <div>
                  <h2 className="text-sm font-black uppercase tracking-wider text-neutral-800">Pesquisas desta organização</h2>
                  <p className="text-xs text-neutral-400 mt-0.5">Cada pesquisa tem formulários e respostas independentes</p>
                </div>
                <div className="flex gap-2">
                  <input
                    value={newSurveyTitle}
                    onChange={e => setNewSurveyTitle(e.target.value)}
                    placeholder="Título da nova pesquisa"
                    className="bg-neutral-50 border border-neutral-200 rounded-xl px-4 py-2 text-xs font-semibold w-48"
                  />
                  <button
                    type="button"
                    onClick={handleAddSurvey}
                    className="bg-emerald-600 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest cursor-pointer"
                  >
                    Adicionar
                  </button>
                </div>
              </div>
              <div className="space-y-3">
                {(activeCompany.surveys || []).map(s => (
                  <div key={s.id} className={`p-5 border rounded-2xl flex flex-wrap justify-between gap-4 ${selectedSurveyId === s.id ? "border-emerald-400 bg-emerald-50/30" : "border-neutral-200"}`}>
                    <div className="space-y-1">
                      {editingSurveyId === s.id ? (
                        <input
                          autoFocus
                          defaultValue={s.title}
                          onBlur={e => {
                            handleUpdateSurveyMeta(s.id, { title: e.target.value });
                            setEditingSurveyId(null);
                          }}
                          onKeyDown={e => {
                            if (e.key === 'Enter') {
                              handleUpdateSurveyMeta(s.id, { title: e.currentTarget.value });
                              setEditingSurveyId(null);
                            }
                          }}
                          className="text-xs font-bold border rounded-lg px-2 py-1 w-full"
                        />
                      ) : (
                        <h3 className="text-xs font-black text-neutral-800">{s.title}</h3>
                      )}
                      <p className="text-[10px] text-neutral-500">{s.desc}</p>
                      <p className="text-[9px] text-neutral-400">
                        {(s.forms || []).length} formulários · fluxo {s.flowMode === "sequential" ? "contínuo" : "um por vez"}
                      </p>
                    </div>
                    <div className="flex gap-2 items-center">
                      <button type="button" onClick={() => setSelectedSurveyId(s.id)} className="text-[10px] font-black uppercase text-emerald-700 cursor-pointer">Ativar</button>
                      <button type="button" onClick={() => setMakerSurvey(s)} className="text-[10px] font-black uppercase text-indigo-600 flex items-center gap-1 cursor-pointer"><Settings size={12}/> Abrir Maker</button>
                      <button type="button" onClick={() => setEditingSurveyId(s.id)} className="text-[10px] font-black uppercase text-neutral-500 cursor-pointer">Renomear</button>
                      <button type="button" onClick={() => handleDeleteSurvey(s.id)} className="text-[10px] font-black uppercase text-red-600 cursor-pointer">Excluir</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ==========================================
              SURVEY MAKER OVERLAY
             ========================================== */}
          {makerSurvey && (
            <SurveyBuilder 
              initialSurvey={makerSurvey}
              onSave={(updated) => {
                // Find all keys to update, but typically questions, accent, iconId, title, desc
                handleUpdateSurveyMeta(updated.id, { 
                  title: updated.title, 
                  desc: updated.desc,
                  questions: updated.questions,
                  accent: updated.accent,
                  iconId: updated.iconId
                });
                setMakerSurvey(null);
              }}
              onCancel={() => setMakerSurvey(null)}
            />
          )}

          {/* ==========================================
              SUBTAB: Settings & convites
             ========================================== */}
          {subTab === "settings" && sessionRole === "admin" && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-in fade-in duration-300">
              
              {/* Organization and SST controls */}
              <div className="space-y-8">
                <div className="bg-white rounded-[2.5rem] border border-neutral-100 p-8 shadow-sm space-y-6">
                  <div>
                    <h2 className="text-sm font-black uppercase tracking-wider text-neutral-800">
                      Parâmetros da Organização
                    </h2>
                    <p className="text-xs text-neutral-400 mt-0.5">Configuração legal e universos de amostra</p>
                  </div>

                  <form onSubmit={handleUpdateCompanySettings} className="space-y-4">
                    <div>
                      <label className="text-[9px] font-black uppercase tracking-widest text-neutral-400 block mb-1">Razão Social / Nome da Entidade</label>
                      <input
                        type="text"
                        required
                        value={activeCompany.name}
                        onChange={e => {
                          const updated = { ...activeCompany, name: e.target.value };
                          updateCompanyInState(updated);
                        }}
                        className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-3 text-xs font-semibold focus:outline-none focus:border-emerald-500 transition-colors"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3.5">
                      <div>
                        <label className="text-[9px] font-black uppercase tracking-widest text-neutral-400 block mb-1">População Total (N)</label>
                        <input
                          type="number"
                          min="2"
                          value={activeCompany.populationSize}
                          onChange={e => {
                            const updated = { ...activeCompany, populationSize: Math.max(2, Number(e.target.value) || 100) };
                            updateCompanyInState(updated);
                          }}
                          className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-3 text-xs font-semibold focus:outline-none focus:border-emerald-500 transition-colors"
                        />
                      </div>
                      <div>
                        <label className="text-[9px] font-black uppercase tracking-widest text-neutral-400 block mb-1">Rótulo dos participantes (ex: Entrevistados)</label>
                        <input
                          type="text"
                          required
                          value={activeCompany.respondentLabel}
                          onChange={e => {
                            const updated = { ...activeCompany, respondentLabel: e.target.value };
                            updateCompanyInState(updated);
                          }}
                          className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-3 text-xs font-semibold focus:outline-none focus:border-emerald-500 transition-colors"
                        />
                      </div>
                      
                    </div>
                  </form>
                </div>

                {/* Sectors Dynamic Management */}
                <div className="bg-white rounded-[2.5rem] border border-neutral-100 p-8 shadow-sm space-y-6">
                  <div>
                    <h2 className="text-sm font-black uppercase tracking-wider text-neutral-800">
                      Setores Operacionais Homologados
                    </h2>
                    <p className="text-xs text-neutral-400 mt-0.5">Cadastrar e gerenciar setores ativos da organização</p>
                  </div>

                  <form onSubmit={handleAddSector} className="flex gap-3">
                    <input
                      type="text"
                      required
                      value={newSectorName}
                      onChange={e => setNewSectorName(e.target.value)}
                      placeholder="Ex: Comercial Externo"
                      className="flex-1 bg-neutral-50 border border-neutral-200 rounded-xl p-3 text-xs font-semibold focus:outline-none focus:border-emerald-500 transition-colors"
                    />
                    <button
                      type="submit"
                      className="bg-neutral-900 hover:bg-black text-white px-5 rounded-xl text-xs font-black uppercase tracking-widest transition-all cursor-pointer"
                    >
                      Adicionar
                    </button>
                  </form>

                  <div className="space-y-2">
                    {activeCompany.sectors.map(s => (
                      <div key={s} className="flex justify-between items-center p-3 bg-neutral-50 border border-neutral-200/50 rounded-xl">
                        <span className="text-xs font-bold text-neutral-700">{s}</span>
                        <button
                          onClick={() => handleDeleteSector(s)}
                          className="text-neutral-400 hover:text-red-600 p-1 transition-colors cursor-pointer"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="space-y-8 flex flex-col h-full items-start w-full">
                <div className="w-full bg-neutral-50/80 rounded-2xl border border-neutral-200/60 p-5 space-y-3">
                <p className="text-[10px] font-black uppercase tracking-widest text-neutral-400">Simular visão (dev)</p>
                <select
                  value={sessionRole}
                  onChange={e => setSessionRole(e.target.value as "admin" | "auditor" | "respondent")}
                  className="w-full bg-white border border-neutral-200 rounded-xl px-3 py-2 text-xs font-bold cursor-pointer"
                >
                  <option value="admin">Administrador</option>
                  <option value="auditor">Entrevistador externo</option>
                  <option value="respondent">Portal do entrevistado</option>
                </select>
              </div>

                <div className="w-full bg-white rounded-[2.5rem] border border-neutral-100 p-8 shadow-sm space-y-6">
                <div>
                  <h2 className="text-sm font-black uppercase tracking-wider text-neutral-800">
                    Convites de acesso
                  </h2>
                  <p className="text-xs text-neutral-400 mt-0.5">Links para entrevistador ou entrevistado</p>
                </div>

                <form onSubmit={handleSendMockInvite} className="space-y-4 bg-neutral-50/50 border border-neutral-200/40 p-5 rounded-2xl">
                  <div>
                    <label className="text-[9px] font-black uppercase tracking-widest text-neutral-400 block mb-1">E-mail do Convidado</label>
                    <input
                      type="email"
                      required
                      value={inviteEmail}
                      onChange={e => setInviteEmail(e.target.value)}
                      placeholder="auditor.mte@empresa.com"
                      className="w-full bg-white border border-neutral-200 rounded-xl p-3 text-xs font-semibold focus:outline-none focus:border-emerald-500 transition-colors"
                    />
                  </div>

                  <div>
                    <label className="text-[9px] font-black uppercase tracking-widest text-neutral-400 block mb-1">Função Restrita de Acesso</label>
                    <div className="grid grid-cols-2 gap-3 pt-1">
                      <button
                        type="button"
                        onClick={() => setInviteRole("auditor")}
                        className={`py-3 rounded-xl border text-xs font-black uppercase tracking-widest transition-all ${inviteRole === "auditor" ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white text-neutral-500 hover:bg-neutral-50'}`}
                      >
                        Auditor Externo
                      </button>
                      <button
                        type="button"
                        onClick={() => setInviteRole("respondent")}
                        className={`py-3 rounded-xl border text-xs font-black uppercase tracking-widest transition-all ${inviteRole === "respondent" ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white text-neutral-500 hover:bg-neutral-50'}`}
                      >
                        Respondente
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-neutral-900 hover:bg-black text-white py-3.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all cursor-pointer"
                  >
                    Enviar convite
                  </button>
                </form>

                {/* Sent Mock Invites Table */}
                <div className="space-y-3">
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-neutral-400">Convites Enviados</h4>
                  <div className="space-y-2.5">
                    {clerkInvites.filter(inv => inv.companyId === selectedCompanyId).length === 0 ? (
                      <div className="text-center py-6 text-neutral-400 text-xs font-semibold bg-neutral-50/50 rounded-xl border border-dashed">
                        Nenhum link ativo enviado.
                      </div>
                    ) : (
                      clerkInvites
                        .filter(inv => inv.companyId === selectedCompanyId)
                        .map(inv => (
                          <div key={inv.id} className="p-3.5 bg-white border rounded-xl shadow-sm flex items-center justify-between">
                            <div className="space-y-0.5 truncate pr-2">
                              <span className="text-xs font-bold text-neutral-800 block truncate">{inv.email}</span>
                              <span className="text-[9px] text-neutral-400 font-bold uppercase tracking-wider">
                                {inv.role === "auditor" ? "Auditor" : "Respondente"} • {inv.sentAt}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              <span className="text-[9px] font-black uppercase tracking-widest bg-amber-50 text-amber-500 border border-amber-200 px-2 py-0.5 rounded animate-pulse">
                                Pendente
                              </span>
                              <button
                                onClick={() => handleDeleteInvite(inv.id)}
                                className="text-neutral-400 hover:text-red-600 p-1"
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>
                          </div>
                        ))
                    )}
                  </div>
                </div>
                </div>
              </div>
            </div>
          )}

          {/* ==========================================
              SUBTAB: Auditor restricted screen
             ========================================== */}
          {subTab === "auditor_panel" && (
            <div className="bg-white rounded-[2.5rem] border border-neutral-100 p-8 shadow-sm space-y-6 animate-in fade-in duration-300">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-neutral-100 pb-4 gap-4">
                <div>
                  <h2 className="text-sm font-black uppercase tracking-wider text-neutral-800">
                    Painel do entrevistador SST
                  </h2>
                  <p className="text-xs text-neutral-400 mt-0.5">Conduzir entrevistas assistidas por módulo</p>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-black uppercase tracking-widest text-neutral-400">Auditor Ativo:</span>
                  <select
                    value={guestAuditorId}
                    onChange={e => setGuestAuditorId(e.target.value)}
                    className="bg-neutral-50 border border-neutral-200 rounded-xl px-4 py-2.5 text-xs font-semibold focus:outline-none focus:border-emerald-500 outline-none"
                  >
                    <option value="">Selecione...</option>
                    <option value="a_1">Milton Bolonha (Auditor Sênior)</option>
                    <option value="a_2">José Santos (Ergonomista)</option>
                  </select>
                </div>
              </div>

              {/* Roster assignments to audit */}
              <div className="space-y-4">
                {!guestAuditorId ? (
                  <div className="text-center py-16 text-neutral-400 text-xs font-bold bg-neutral-50/50 rounded-2xl border border-dashed">
                    Selecione um auditor ativo no cabeçalho para ver as vistorias.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-neutral-200 text-[10px] font-black uppercase tracking-widest text-neutral-400">
                          <th className="pb-3">Entrevistado ({activeCompany.respondentLabel})</th>
                          <th className="pb-3">Setor • Cargo</th>
                          <th className="pb-3 text-center">Status</th>
                          <th className="pb-3 text-center">Score Global</th>
                          <th className="pb-3 text-right">Ação</th>
                        </tr>
                      </thead>
                      <tbody>
                        {activeCompany.collaborators.map(c => {
                          const respObj = activeSurvey?.responses?.[c.id];
                          const progress = respObj
                            ? Math.round(
                                (Object.keys(respObj.answers).filter(k => respObj.answers[k] !== undefined && respObj.answers[k] !== "").length /
                                  NR1_TOPICS.reduce((sum, t) => sum + t.questions.length, 0)) *
                                  100
                              )
                            : 0;

                          const score = getCollaboratorGlobalRisk(c.id);

                          return (
                            <tr key={c.id} className="border-b border-neutral-100 hover:bg-neutral-50/50 text-xs">
                              <td className="py-4 font-bold text-neutral-800">{c.name}</td>
                              <td className="py-4 font-semibold text-neutral-500">{c.sector} • {c.role}</td>
                              <td className="py-4 text-center">
                                {progress === 100 ? (
                                  <span className="inline-block text-[9px] font-black uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-0.5 rounded">
                                    Finalizado
                                  </span>
                                ) : progress > 0 ? (
                                  <span className="inline-block text-[9px] font-black uppercase tracking-wider bg-amber-50 text-amber-700 border border-amber-200 px-2.5 py-0.5 rounded animate-pulse">
                                    Iniciado ({progress}%)
                                  </span>
                                ) : (
                                  <span className="inline-block text-[9px] font-black uppercase tracking-wider bg-neutral-50 text-neutral-400 border border-neutral-200 px-2.5 py-0.5 rounded">
                                    Pendente
                                  </span>
                                )}
                              </td>
                              <td className="py-4 text-center font-mono font-black text-neutral-700">
                                {score !== null ? score.toFixed(1) : "---"}
                              </td>
                              <td className="py-4 text-right">
                                <button
                                  onClick={() => handleStartSurveySequential(c.id)}
                                  className="bg-neutral-900 hover:bg-black text-white text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded-xl transition-all shadow-sm cursor-pointer"
                                >
                                  {progress > 0 ? "Retomar entrevista" : "Entrevistar agora"}
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ==========================================
              SUBTAB: Interviewee restricted Portal
             ========================================== */}
          {subTab === "interviewee_panel" && <IntervieweePortal {...props} />}

        </div>
      )}
</>
  );
}
