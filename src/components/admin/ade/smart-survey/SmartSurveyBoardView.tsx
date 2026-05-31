"use client";

import "./smart-survey.css";

import React from "react";
import type { useSmartSurveyBoard } from "@/containers/admin/smart-survey/useSmartSurveyBoard";
import { SmartSurveyHeader } from "./components/SmartSurveyHeader";
import { CompanyDirectoryView } from "./components/CompanyDirectoryView";
import dynamic from "next/dynamic";

const CompanyDetailView = dynamic(
  () => import("./components/CompanyDetailView").then((m) => m.CompanyDetailView),
  { ssr: false }
);

const SurveyFormOverlay = dynamic(
  () => import("./components/SurveyFormOverlay").then((m) => m.SurveyFormOverlay),
  { ssr: false }
);

const CreateCompanyModal = dynamic(
  () => import("./components/CreateCompanyModal").then((m) => m.CreateCompanyModal),
  { ssr: false }
);

const MethodologyModal = dynamic(
  () => import("./components/MethodologyModal").then((m) => m.MethodologyModal),
  { ssr: false }
);

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
