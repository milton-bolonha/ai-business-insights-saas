import fs from "fs";
import path from "path";

const viewPath = path.resolve("src/components/admin/ade/smart-survey/SmartSurveyBoardView.tsx");
const outDir = path.resolve("src/components/admin/ade/smart-survey/components");
fs.mkdirSync(outDir, { recursive: true });

const lines = fs.readFileSync(viewPath, "utf8").split(/\r?\n/);

// 0-indexed line numbers from grep comments (1-indexed in file)
const sections = {
  SmartSurveyHeader: [137, 217],
  CompanyDirectoryView: [219, 419],
  CompanyDetailView: [421, 1643],
  SurveyFormOverlay: [1645, 1857],
};

const typeImport = `import type { SmartSurveyBoardViewProps } from "../SmartSurveyBoardView";\n\n`;

for (const [name, [start, end]] of Object.entries(sections)) {
  const body = lines.slice(start - 1, end).join("\n");
  const content = `"use client";

import React from "react";
${name === "SurveyFormOverlay" ? 'import { motion, AnimatePresence } from "framer-motion";\n' : ""}${name === "SurveyFormOverlay" || name === "SmartSurveyHeader" || name === "CompanyDirectoryView" || name === "CompanyDetailView" ? getIconsFor(name) : ""}
${typeImport}type Props = SmartSurveyBoardViewProps;

export function ${name}(props: Props) {
  const p = props;
${bodyToDestructured(body, name)}
  return (
${indentBody(extractReturnBody(body), 4)}
  );
}
`;
  fs.writeFileSync(path.join(outDir, `${name}.tsx`), content);
}

function getIconsFor(name) {
  const map = {
    SmartSurveyHeader: ["ShieldCheck", "Building2", "Users", "ClipboardList", "ArrowLeft", "Printer"],
    CompanyDirectoryView: ["Plus", "Trash2"],
    CompanyDetailView: [
      "Activity", "Users", "Settings", "UserCheck", "ClipboardList", "ShieldAlert", "TrendingUp",
      "Plus", "Trash2", "BrainCircuit", "RefreshCw", "Calculator", "SplitSquareHorizontal",
      "HelpCircle", "Briefcase", "Download", "PlayCircle", "CheckCircle2", "AlertTriangle",
      "Send", "Calendar", "DollarSign", "LineChart", "User2", "Check",
    ],
    SurveyFormOverlay: ["X", "ChevronLeft", "ChevronRight", "Check"],
  };
  const icons = map[name] || [];
  return `import { ${icons.join(", ")} } from "lucide-react";\n`;
}

function extractReturnBody(sectionLines) {
  // section is JSX fragment inside parent return - not wrapped in return
  return sectionLines;
}

function indentBody(body, spaces) {
  const pad = " ".repeat(spaces);
  return body
    .split("\n")
    .map((l) => (l ? pad + l : l))
    .join("\n");
}

function bodyToDestructured(body, name) {
  // Replace direct identifier refs with p. prefix for props - too risky automated
  // Instead pass all via destructure at top
  return `  // props passed from parent\n`;
}

// Simpler: don't auto-prefix, keep body as-is but components receive full props and destructure in parent view only

console.log("Created component stubs - manual fix needed");
