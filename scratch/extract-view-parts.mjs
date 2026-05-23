import fs from "fs";
import path from "path";

const viewPath = path.resolve("src/components/admin/ade/smart-survey/SmartSurveyBoardView.tsx");
const outDir = path.resolve("src/components/admin/ade/smart-survey/components");
fs.mkdirSync(outDir, { recursive: true });

const content = fs.readFileSync(viewPath, "utf8");
const lines = content.split(/\r?\n/);

const destructureMatch = content.match(/export function SmartSurveyBoardView[\s\S]*?const \{([\s\S]*?)\} = props;/);
if (!destructureMatch) throw new Error("destructure not found");
const fullDestructure = destructureMatch[1];

const picks = {
  SmartSurveyHeader: [
    "sessionRole", "setSessionRole", "activeCompany", "selectedCompanyId",
    "setSelectedCompanyId", "setSubTab", "handlePrintPremiumPDF", "completedSamplesCount",
  ],
  CompanyDirectoryView: [
    "selectedCompanyId", "companySearchQuery", "setCompanySearchQuery",
    "companyTemplateFilter", "setCompanyTemplateFilter", "setIsCreateModalOpen",
    "companies", "setSelectedCompanyId", "setSubTab", "handleDeleteCompany",
    "calculateConfidenceLevel", "calculateCompanyGlobalRisk", "getRiskLevel",
  ],
  CompanyDetailView: null, // all except overlay-specific - use full minus overlay
  SurveyFormOverlay: [
    "activeFormOverlay", "setActiveFormOverlay", "activeCompany", "overlayAnswers",
    "handleSelectAnswerValue", "handleBackSequentialStep", "handleNextSequentialStep", "NR1_TOPICS",
  ],
};

function pickDestructure(keys) {
  const keySet = new Set(keys);
  return fullDestructure
    .split("\n")
    .filter((line) => {
      const m = line.match(/^\s*(\w+)/);
      return m && keySet.has(m[1]);
    })
    .join("\n");
}

const iconSets = {
  SmartSurveyHeader: "ShieldCheck, Building2, Users, ClipboardList, ArrowLeft, Printer",
  CompanyDirectoryView: "Plus, Trash2",
  CompanyDetailView: `ShieldAlert, Activity, Building2, Users, User2, PlayCircle, CheckCircle2, AlertTriangle, TrendingUp, Plus, Trash2, HelpCircle, Briefcase, Calculator, SplitSquareHorizontal, BrainCircuit, RefreshCw, ShieldCheck, Check, Settings, UserCheck, ClipboardList, Send, Calendar, DollarSign, LineChart`,
  SurveyFormOverlay: "ShieldAlert, X, ChevronLeft, ChevronRight, Check",
};

const ranges = {
  SmartSurveyHeader: [137, 217],
  CompanyDirectoryView: [219, 419],
  CompanyDetailView: [421, 1643],
  SurveyFormOverlay: [1645, 1856],
};

for (const [name, [start, end]] of Object.entries(ranges)) {
  const jsx = lines.slice(start - 1, end).join("\n");
  const keys = picks[name];
  const destructure = keys ? pickDestructure(keys) : fullDestructure;
  const motionImport = name === "SurveyFormOverlay" ? '\nimport { motion, AnimatePresence } from "framer-motion";' : "";

  const file = `"use client";

import React from "react";
import { ${iconSets[name]} } from "lucide-react";${motionImport}
import type { SmartSurveyBoardViewProps } from "../SmartSurveyBoardView";

export function ${name}(props: SmartSurveyBoardViewProps) {
  const {
${destructure}
  } = props;

  return (
<>
${jsx}
</>
  );
}
`;
  fs.writeFileSync(path.join(outDir, `${name}.tsx`), file);
}

// Rewrite main view as orchestrator
const orchestrator = `"use client";

import React from "react";
import type { useSmartSurveyBoard } from "@/containers/admin/smart-survey/useSmartSurveyBoard";
import { SmartSurveyHeader } from "./components/SmartSurveyHeader";
import { CompanyDirectoryView } from "./components/CompanyDirectoryView";
import { CompanyDetailView } from "./components/CompanyDetailView";
import { SurveyFormOverlay } from "./components/SurveyFormOverlay";

export type SmartSurveyBoardViewProps = ReturnType<typeof useSmartSurveyBoard>;

export function SmartSurveyBoardView(props: SmartSurveyBoardViewProps) {
  return (
    <div className="w-full max-w-7xl mx-auto space-y-8 animate-in fade-in duration-300">
      <SmartSurveyHeader {...props} />
      <CompanyDirectoryView {...props} />
      <CompanyDetailView {...props} />
      <SurveyFormOverlay {...props} />
    </div>
  );
}
`;

fs.writeFileSync(viewPath, orchestrator);
console.log("View split into components");
