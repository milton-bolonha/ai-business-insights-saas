import fs from "fs";
import path from "path";

const srcPath = path.resolve("src/components/admin/ade/SmartSurveyBoard.tsx");
const outDir = path.resolve("src/components/admin/ade/smart-survey");
const containerDir = path.resolve("src/containers/admin/smart-survey");

const content = fs.readFileSync(srcPath, "utf8");
const lines = content.split(/\r?\n/);

// Find export function SmartSurveyBoard
const exportIdx = lines.findIndex((l) => l.startsWith("export function SmartSurveyBoard"));
if (exportIdx === -1) throw new Error("export function SmartSurveyBoard not found");

// Find return ( at component level - first "  return (" after export
let returnIdx = -1;
for (let i = exportIdx; i < lines.length; i++) {
  if (lines[i] === "  return (") {
    returnIdx = i;
    break;
  }
}
if (returnIdx === -1) throw new Error("return ( not found");

// Logic: from line after props closing `}) {` through line before return
let bodyStart = exportIdx;
while (bodyStart < lines.length && !lines[bodyStart].includes("}) {")) bodyStart++;
bodyStart++; // first line inside function

const logicLines = lines.slice(bodyStart, returnIdx);
const jsxLines = lines.slice(returnIdx + 1, lines.length - 2); // exclude closing ); and }

const hookImports = `"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useAuthStore } from "@/lib/stores";
import { useToast } from "@/lib/state/toast-context";
import { NR1_TOPICS } from "@/components/admin/ade/smart-survey/nr1-topics";
import {
  getRiskLevel,
  calculateConfidenceLevel,
  calculateCollaboratorTopicRisk,
  calculateCollaboratorGlobalRisk,
  calculateCompanyGlobalRisk,
} from "@/components/admin/ade/smart-survey/risk-engine";
import { buildDefaultCompaniesWithSurveys } from "@/components/admin/ade/smart-survey/default-companies";
import type {
  Company,
  Collaborator,
  ClerkInvite,
  ContinuousLog,
} from "@/components/admin/ade/smart-survey/types";

export function useSmartSurveyBoard(workspaceId: string) {
`;

// Replace default companies init block
let logicBody = logicLines.join("\n");
logicBody = logicBody.replace(
  /\/\/ Initialize Default Pre-populated Companies[\s\S]*?setCompanies\(defaultCompaniesWithSurveys\);\s*saveState\(defaultCompaniesWithSurveys, \[\]\);/,
  `const defaultCompaniesWithSurveys = buildDefaultCompaniesWithSurveys();
        setCompanies(defaultCompaniesWithSurveys);
        saveState(defaultCompaniesWithSurveys, []);`
);

// Remove unused auth if present - keep for now

const hookFooter = `
  return {
    workspaceId,
    companies,
    setCompanies,
    selectedCompanyId,
    setSelectedCompanyId,
    selectedSurveyId,
    setSelectedSurveyId,
    isCreateModalOpen,
    setIsCreateModalOpen,
    isMethodologyModalOpen,
    setIsMethodologyModalOpen,
    selectedCollabIdForDetails,
    setSelectedCollabIdForDetails,
    activeCompany,
    activeSurvey,
    sessionRole,
    setSessionRole,
    clerkInvites,
    setClerkInvites,
    subTab,
    setSubTab,
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
    companySearchQuery,
    setCompanySearchQuery,
    companyTemplateFilter,
    setCompanyTemplateFilter,
    newSectorName,
    setNewSectorName,
    showAddCollab,
    setShowAddCollab,
    newCollabName,
    setNewCollabName,
    newCollabSector,
    setNewCollabSector,
    newCollabRole,
    setNewCollabRole,
    inviteEmail,
    setInviteEmail,
    inviteRole,
    setInviteRole,
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
    guestAuditorId,
    setGuestAuditorId,
    guestRespondentId,
    setGuestRespondentId,
    reportScope,
    setReportScope,
    continuousViewTab,
    setContinuousViewTab,
    activeFormOverlay,
    setActiveFormOverlay,
    overlayAnswers,
    setOverlayAnswers,
    isGeneratingAI,
    activeSurveyResponses,
    completedSamplesCount,
    companyGlobalRiskAverage,
    companyConfidenceLevel,
    aggregatedLogs,
    sectorBreakdowns,
    polarizedSectorsCount,
    getCollaboratorTopicRisk,
    getCollaboratorGlobalRisk,
    handleCreateCompany,
    handleDeleteCompany,
    handleAddCollabSubmit,
    handleDeleteCollab,
    handleUpdateCompanySettings,
    handleAddSector,
    handleDeleteSector,
    handleSendMockInvite,
    handleDeleteInvite,
    handleAddContinuousLog,
    handleDeleteContinuousLog,
    handleSimulateSurveyResponses,
    handleGenerateAIReport,
    handlePrintPremiumPDF,
    handleStartSurveySequential,
    handleStartSurveySingleModule,
    handleSelectAnswerValue,
    handleNextSequentialStep,
    handleBackSequentialStep,
    updateCompanyInState,
    push,
    getRiskLevel,
    calculateConfidenceLevel,
    calculateCompanyGlobalRisk,
    NR1_TOPICS,
  };
}
`;

fs.writeFileSync(path.join(containerDir, "useSmartSurveyBoard.ts"), hookImports + logicBody + hookFooter);

const viewImports = `"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ShieldAlert,
  Activity,
  Building2,
  Users,
  User2,
  Download,
  PlayCircle,
  ArrowLeft,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  X,
  AlertTriangle,
  TrendingUp,
  Plus,
  Trash2,
  HelpCircle,
  Briefcase,
  Calculator,
  SplitSquareHorizontal,
  BrainCircuit,
  RefreshCw,
  Printer,
  ShieldCheck,
  Check,
  Settings,
  UserCheck,
  ClipboardList,
  Send,
  Calendar,
  DollarSign,
  LineChart,
} from "lucide-react";
import type { useSmartSurveyBoard } from "@/containers/admin/smart-survey/useSmartSurveyBoard";

export type SmartSurveyBoardViewProps = ReturnType<typeof useSmartSurveyBoard>;

export function SmartSurveyBoardView(props: SmartSurveyBoardViewProps) {
`;

// Destructure all props at start of view
const destructure = `  const {
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
    overlayAnswers,
    handleSelectAnswerValue,
    handleBackSequentialStep,
    handleNextSequentialStep,
    updateCompanyInState,
    push,
    getRiskLevel,
    calculateConfidenceLevel,
    calculateCompanyGlobalRisk,
    NR1_TOPICS,
  } = props;

`;

// jsxLines currently starts with content inside return's div - need to wrap
const viewBody = jsxLines.join("\n");
// Fix closing - jsx should end with );  and }
const viewContent =
  viewImports +
  destructure +
  "  return (\n" +
  viewBody +
  "\n  );\n}\n";

fs.writeFileSync(path.join(outDir, "SmartSurveyBoardView.tsx"), viewContent);

const containerContent = `"use client";

import { useSmartSurveyBoard } from "./useSmartSurveyBoard";
import { SmartSurveyBoardView } from "@/components/admin/ade/smart-survey/SmartSurveyBoardView";

export function SmartSurveyBoardContainer({
  workspaceId,
  dashboardId,
  tiles,
}: {
  workspaceId: string;
  dashboardId?: string;
  tiles?: unknown[];
}) {
  const board = useSmartSurveyBoard(workspaceId);
  void dashboardId;
  void tiles;
  return <SmartSurveyBoardView {...board} />;
}
`;

fs.writeFileSync(path.join(containerDir, "SmartSurveyBoardContainer.tsx"), containerContent);

const thinBoard = `"use client";

export { SmartSurveyBoardContainer as SmartSurveyBoard } from "@/containers/admin/smart-survey/SmartSurveyBoardContainer";
`;

fs.writeFileSync(srcPath, thinBoard);

console.log("Split complete. return at line", returnIdx + 1);
