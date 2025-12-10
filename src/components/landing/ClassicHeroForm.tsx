"use client";

import { useState, type ChangeEvent } from "react";
import { ArrowRight } from "lucide-react";

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
    <div className="min-h-screen bg-[#fcfcf9] px-4 py-2">
      <div className="mx-auto flex max-w-5xl flex-col items-center text-center">
        <h1 className="text-2xl font-bold tracking-tight text-black sm:text-3xl lg:text-4xl">
          Smarter Research. Faster Outreach. More Selling
        </h1>
        <p className="mt-3 max-w-3xl text-xl text-gray-600">
          WebApp é seu assistente pessoal de pesquisa que trabalha enquanto você
          dorme
        </p>
      </div>

      <div className="mx-auto mt-10 max-w-3xl space-y-4">
        {FIELD_CONFIG.map((field, idx) => {
          const isValidField =
            isFieldValid[field.name as keyof typeof isFieldValid];
          const isLast = idx === FIELD_CONFIG.length - 1;
          const circleBase =
            "flex h-9 w-9 items-center justify-center rounded-full border transition";
          const circleValid = "border-green-500 bg-green-500 text-white";
          const circleInvalid =
            field.name === "company"
              ? "border-gray-300 bg-gray-300"
              : "border-gray-200 bg-gray-200";

          const dotValid = isLast ? (
            <ArrowRight className="h-4 w-4" />
          ) : (
            <div className="h-2 w-2 rounded-full bg-white" />
          );

          return (
            <div key={field.name} className="max-w-2xl mx-auto relative">
              <div className="relative">
                <input
                  placeholder=""
                  id={field.name}
                  type={field.type}
                  value={values[field.name]}
                  onChange={(e: ChangeEvent<HTMLInputElement>) =>
                    setValues({ ...values, [field.name]: e.target.value })
                  }
                  disabled={false}
                  className={`w-full px-6 pt-4 pb-8 pr-16 text-lg rounded-xl shadow-sm outline-none transition ${
                    field.name === "company"
                      ? "bg-white border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      : "bg-white border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  }`}
                  required
                />
                <div className="pointer-events-none absolute bottom-2 left-6 text-xs text-gray-400 z-10">
                  {field.label}
                </div>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 transform">
                  <div
                    className={`${circleBase} ${
                      isValidField ? circleValid : circleInvalid
                    }`}
                  >
                    {isValidField ? (
                      dotValid
                    ) : (
                      <div className="h-2 w-2 rounded-full bg-white" />
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
        {/* 
        <p className="text-lg text-black text-center">
          Peça para a WebApp pesquisar todo o seu território por você.
        </p> */}

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button
            type="submit"
            disabled={!allValid || isSubmitting}
            className="bg-blue-600 hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed text-white px-8 py-4 rounded-xl text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 flex items-center justify-center space-x-2"
            onClick={(e) => {
              e.preventDefault();
              handleSubmit(e as any);
            }}
          >
            <span>{isSubmitting ? "isSubmitting..." : "Submit"}</span>
            <ArrowRight className="w-5 h-5" />
          </button>
          <button
            type="button"
            className="bg-blue-600 hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed text-white px-8 py-4 rounded-xl text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 flex items-center justify-center space-x-2"
            disabled
          >
            <span>Upload CSV</span>
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
        {onReset && (
          <div className="mt-4 flex justify-center">
            <button
              className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
              type="button"
              onClick={() => onReset()}
            >
              🗑️ Reset Guest Session (DEBUG)
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
