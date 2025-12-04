"use client";

import { useState, type ChangeEvent } from "react";

export interface ClassicHeroFormSubmission {
  company: string;
  companyWebsite: string;
  solution: string;
  researchTarget: string;
  researchWebsite: string;
  templateId: string;
  model: string;
  promptAgent: string;
  responseLength: string;
  promptVariables: string[];
  bulkPrompts: string[];
}

interface ClassicHeroFormProps {
  isSubmitting: boolean;
  onSubmit: (payload: ClassicHeroFormSubmission) => Promise<void>;
  onReset?: () => Promise<void>;
}

const FIELD_CONFIG = [
  {
    name: "company",
    label: "I am a sales rep at",
    type: "text",
  },
  {
    name: "companyWebsite",
    label: "My company website (e.g., www.microsoft.com)",
    type: "url",
  },
  {
    name: "solution",
    label: "I am selling solutions for",
    type: "text",
  },
  {
    name: "researchTarget",
    label: "I want to research this company",
    type: "text",
  },
  {
    name: "researchWebsite",
    label: "Company website to research (e.g., www.tesla.com)",
    type: "url",
  },
] as const;

type InputState = Record<(typeof FIELD_CONFIG)[number]["name"], string>;

export function ClassicHeroForm({
  isSubmitting,
  onSubmit,
  onReset,
}: ClassicHeroFormProps) {
  const [values, setValues] = useState<InputState>({
    company: "",
    companyWebsite: "",
    solution: "",
    researchTarget: "",
    researchWebsite: "",
  });

  const isUrlValid = (value: string) => {
    if (!value.trim()) return false;
    try {
      new URL(value.startsWith("http") ? value : `https://${value}`);
      return true;
    } catch {
      return false;
    }
  };

  const isFieldValid = {
    company: values.company.trim().length > 1,
    companyWebsite: isUrlValid(values.companyWebsite),
    solution: values.solution.trim().length > 1,
    researchTarget: values.researchTarget.trim().length > 1,
    researchWebsite: isUrlValid(values.researchWebsite),
  };

  const allValid = Object.values(isFieldValid).every(Boolean);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!allValid || isSubmitting) return;

    onSubmit({
      company: values.company,
      companyWebsite: values.companyWebsite,
      solution: values.solution,
      researchTarget: values.researchTarget,
      researchWebsite: values.researchWebsite,
      templateId: "template_1",
      model: "gpt-4o-mini",
      promptAgent: "ade_research_analyst",
      responseLength: "medium",
      promptVariables: [],
      bulkPrompts: [],
    });
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-8">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-2xl space-y-6 rounded-lg border border-slate-200 bg-white p-8 shadow-lg"
      >
        <h1 className="text-3xl font-bold text-slate-900">
          Generate AI Insights
        </h1>
        <p className="text-slate-600">
          Fill in the form below to generate insights about your target company.
        </p>

        {FIELD_CONFIG.map((field) => (
          <div key={field.name}>
            <label
              htmlFor={field.name}
              className="block text-sm font-medium text-slate-700"
            >
              {field.label}
            </label>
            <input
              id={field.name}
              type={field.type}
              value={values[field.name]}
              onChange={(e: ChangeEvent<HTMLInputElement>) =>
                setValues({ ...values, [field.name]: e.target.value })
              }
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              required
            />
          </div>
        ))}

        <div className="flex gap-4">
          <button
            type="submit"
            disabled={!allValid || isSubmitting}
            className="flex-1 rounded-md bg-blue-600 px-4 py-2 text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSubmitting ? "Generating..." : "Generate Insights"}
          </button>
          {onReset && (
            <button
              type="button"
              onClick={onReset}
              className="rounded-md cursor-pointer border border-slate-300 px-4 py-2 text-slate-700 transition hover:bg-slate-50"
            >
              Reset
            </button>
          )}
        </div>
      </form>
    </div>
  );
}

