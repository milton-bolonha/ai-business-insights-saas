"use client";

import { useState } from "react";
import { X, Building2 } from "lucide-react";

interface AddWorkspaceModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: {
    company: string;
    companyWebsite: string;
    solution: string;
    researchTarget: string;
    researchWebsite: string;
    templateId?: string;
    model?: string;
    promptAgent?: string;
    responseLength?: string;
    promptVariables?: string[];
    bulkPrompts?: string[];
  }) => void;
  isSubmitting?: boolean;
}

export function AddWorkspaceModal({
  open,
  onClose,
  onSubmit,
  isSubmitting = false
}: AddWorkspaceModalProps) {
  const [company, setCompany] = useState("");
  const [companyWebsite, setCompanyWebsite] = useState("");
  const [solution, setSolution] = useState("");
  const [researchTarget, setResearchTarget] = useState("");
  const [researchWebsite, setResearchWebsite] = useState("");
  const [templateId, setTemplateId] = useState("template_1");
  const [model, setModel] = useState("gpt-4");
  const [promptAgent, setPromptAgent] = useState("ade_research_analyst");
  const [responseLength, setResponseLength] = useState("medium");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Basic validation
    if (!company.trim() || !companyWebsite.trim() || !solution.trim() ||
        !researchTarget.trim() || !researchWebsite.trim()) {
      return;
    }

    onSubmit({
      company: company.trim(),
      companyWebsite: companyWebsite.trim(),
      solution: solution.trim(),
      researchTarget: researchTarget.trim(),
      researchWebsite: researchWebsite.trim(),
      templateId,
      model,
      promptAgent,
      responseLength,
      promptVariables: [],
      bulkPrompts: [],
    });

    handleClose();
  };

  const handleClose = () => {
    setCompany("");
    setCompanyWebsite("");
    setSolution("");
    setResearchTarget("");
    setResearchWebsite("");
    setTemplateId("template_1");
    setModel("gpt-4");
    setPromptAgent("ade_research_analyst");
    setResponseLength("medium");
    onClose();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={handleClose} />
      <div className="relative max-w-2xl w-full max-h-[80vh] overflow-y-auto rounded-lg bg-white shadow-xl">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-2">
              <Building2 className="h-5 w-5 text-blue-600" />
              <h2 className="text-xl font-semibold">Create New Workspace</h2>
            </div>
            <button
              onClick={handleClose}
              className="cursor-pointer rounded-full p-1 hover:bg-gray-100"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Company Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Your Company Name *
                </label>
                <input
                  type="text"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  placeholder="e.g., Acme Corp"
                  className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Your Company Website *
                </label>
                <input
                  type="url"
                  value={companyWebsite}
                  onChange={(e) => setCompanyWebsite(e.target.value)}
                  placeholder="https://yourcompany.com"
                  className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  required
                />
              </div>
            </div>

            {/* Solution */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Solution You Sell *
              </label>
              <input
                type="text"
                value={solution}
                onChange={(e) => setSolution(e.target.value)}
                placeholder="e.g., AI-powered analytics platform"
                className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                required
              />
            </div>

            {/* Target Company */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Target Company Name *
                </label>
                <input
                  type="text"
                  value={researchTarget}
                  onChange={(e) => setResearchTarget(e.target.value)}
                  placeholder="e.g., Target Inc"
                  className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Target Company Website *
                </label>
                <input
                  type="url"
                  value={researchWebsite}
                  onChange={(e) => setResearchWebsite(e.target.value)}
                  placeholder="https://targetcompany.com"
                  className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                  required
                />
              </div>
            </div>

            {/* Template Selection */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Template
                </label>
                <select
                  value={templateId}
                  onChange={(e) => setTemplateId(e.target.value)}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="template_1">Essential Research (8 tiles)</option>
                  <option value="template_2">Deep Dive Research (9 tiles)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  AI Model
                </label>
                <select
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="gpt-4">GPT-4</option>
                  <option value="gpt-4o-mini">GPT-4o Mini</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Response Length
                </label>
                <select
                  value={responseLength}
                  onChange={(e) => setResponseLength(e.target.value)}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="short">Short</option>
                  <option value="medium">Medium</option>
                  <option value="long">Long</option>
                </select>
              </div>
            </div>

            {/* Submit Buttons */}
            <div className="flex justify-end space-x-3 pt-4 border-t">
              <button
                type="button"
                onClick={handleClose}
                className="cursor-pointer rounded-md px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting || !company.trim() || !companyWebsite.trim() ||
                         !solution.trim() || !researchTarget.trim() || !researchWebsite.trim()}
                className="cursor-pointer rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? "Creating..." : "Create Workspace"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
