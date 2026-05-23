"use client";

import "./smart-survey.css";

import React from "react";
import type { useSmartSurveyBoard } from "@/containers/admin/smart-survey/useSmartSurveyBoard";
import { SmartSurveyHeader } from "./components/SmartSurveyHeader";
import { CompanyDirectoryView } from "./components/CompanyDirectoryView";
import { CompanyDetailView } from "./components/CompanyDetailView";
import { SurveyFormOverlay } from "./components/SurveyFormOverlay";
import { CreateCompanyModal } from "./components/CreateCompanyModal";
import { MethodologyModal } from "./components/MethodologyModal";

export type SmartSurveyBoardViewProps = ReturnType<typeof useSmartSurveyBoard>;

export function SmartSurveyBoardView(props: SmartSurveyBoardViewProps) {
  return (
    <div className="ssb-shell space-y-8 animate-in fade-in duration-300">
      <SmartSurveyHeader {...props} />
      <CompanyDirectoryView {...props} />
      <CompanyDetailView {...props} />
      <SurveyFormOverlay {...props} />
      <CreateCompanyModal {...props} />
      <MethodologyModal {...props} />
    </div>
  );
}
