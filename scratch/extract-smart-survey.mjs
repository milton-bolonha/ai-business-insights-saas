import fs from "fs";
import path from "path";

const root = path.resolve("src/components/admin/ade");
const srcPath = path.join(root, "SmartSurveyBoard.tsx");
const outDir = path.join(root, "smart-survey");
const containerDir = path.resolve("src/containers/admin/smart-survey");

fs.mkdirSync(outDir, { recursive: true });
fs.mkdirSync(containerDir, { recursive: true });

const lines = fs.readFileSync(srcPath, "utf8").split(/\r?\n/);
const slice = (from, to) => lines.slice(from - 1, to).join("\n");

// types.ts
const qTypes = slice(46, 62).replace(/^interface /gm, "export interface ");
const dbTypes = slice(779, 835).replace(/^interface /gm, "export interface ");
fs.writeFileSync(
  path.join(outDir, "types.ts"),
  `// Database & domain types\n\n${qTypes}\n\n${dbTypes}\n`
);

// nr1-topics.ts
const nr1Data = slice(64, 773);
fs.writeFileSync(
  path.join(outDir, "nr1-topics.ts"),
  `import type { Question, SurveyTopic } from "./types";\n\nexport const NR1_TOPICS: SurveyTopic[] = [\n${nr1Data.replace(/^const NR1_TOPICS: SurveyTopic\[\] = \[\n/, "")}\n`
);

// risk-engine.ts
const riskFns = slice(838, 944).replace(/^function /gm, "export function ");
fs.writeFileSync(
  path.join(outDir, "risk-engine.ts"),
  `import { NR1_TOPICS } from "./nr1-topics";\nimport type { Company, CollaboratorAnswers } from "./types";\n\n${riskFns}\n`
);

// constants.ts
fs.writeFileSync(path.join(outDir, "constants.ts"), `${slice(947, 953)}\n`);

// default-companies.ts - extract company array body (lines 1105-1204)
const companyArrayBody = lines.slice(1104, 1204).join("\n");
fs.writeFileSync(
  path.join(outDir, "default-companies.ts"),
  `import type { Company } from "./types";

const DEFAULT_COMPANIES: Company[] = [
${companyArrayBody}
];

export function buildDefaultCompaniesWithSurveys(): Company[] {
  return DEFAULT_COMPANIES.map((company) => {
    company.surveys = [
      {
        id: \`survey_default_\${company.id}\`,
        title:
          company.template === "nr1_compliance"
            ? "Diagnóstico Inicial NR-1"
            : "Métricas de Vendas",
        desc:
          company.template === "nr1_compliance"
            ? "Campanha inicial de mapeamento ergonômico psicossocial."
            : "Acompanhamento comercial contínuo por vendedor.",
        template: company.template || "nr1_compliance",
        respondentLabel: company.respondentLabel || "Colaboradores",
        responses: company.responses || {},
        continuousLogs: company.continuousLogs || [],
        aiReport: company.aiReport || null,
        createdAt: new Date().toISOString(),
      },
    ];
    return company;
  });
}
`
);

console.log("Done. Source lines:", lines.length);
