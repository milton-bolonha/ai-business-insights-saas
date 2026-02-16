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
  const [projectType, setProjectType] = useState<"business" | "book">("business");

  // Business Fields
  const [company, setCompany] = useState("");
  const [companyWebsite, setCompanyWebsite] = useState("");
  const [solution, setSolution] = useState("");
  const [researchTarget, setResearchTarget] = useState("");
  const [researchWebsite, setResearchWebsite] = useState("");

  // Book Fields (mapped to business fields for API compatibility)
  // company -> Author Name
  // companyWebsite -> Portfolio/Social (optional)
  // solution -> Genre/Theme
  // researchTarget -> Book Title
  // researchWebsite -> Inspiration URL (optional)

  const [templateId, setTemplateId] = useState("template_1");
  const [model, setModel] = useState("gpt-4o-mini");
  const [promptAgent, setPromptAgent] = useState("ade_research_analyst");
  const [responseLength, setResponseLength] = useState("medium");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (projectType === "business") {
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
    } else {
      // Book Project
      // We reuse the same API fields but map them logicallly
      // company = Author
      // researchTarget = Book Title
      // solution = Genre
      if (!company.trim() || !researchTarget.trim() || !solution.trim()) {
        return;
      }

      onSubmit({
        company: company.trim(), // Author
        companyWebsite: companyWebsite.trim() || "https://lovewriters.com", // Default if empty
        solution: solution.trim(), // Genre
        researchTarget: researchTarget.trim(), // Book Title
        researchWebsite: researchWebsite.trim() || "https://lovewriters.com", // Default
        templateId: "template_love_writers", // Force template
        model,
        promptAgent: "publisher", // Force agent
        responseLength: "long",
        promptVariables: [],
        bulkPrompts: [],
      });
    }

    handleClose();
  };

  const handleClose = () => {
    setCompany("");
    setCompanyWebsite("");
    setSolution("");
    setResearchTarget("");
    setResearchWebsite("");
    setTemplateId("template_1");
    setProjectType("business");
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
            <button onClick={handleClose} className="cursor-pointer rounded-full p-1 hover:bg-gray-100">
              <X className="h-5 w-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Project Type Switch */}
            <div className="bg-gray-100 p-1 rounded-lg flex">
              <button
                type="button"
                onClick={() => setProjectType("business")}
                className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${projectType === "business" ? "bg-white shadow text-blue-600" : "text-gray-500 hover:text-gray-700"}`}
              >
                Business Insights
              </button>
              <button
                type="button"
                onClick={() => setProjectType("book")}
                className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${projectType === "book" ? "bg-white shadow text-rose-600" : "text-gray-500 hover:text-gray-700"}`}
              >
                Love Writers (Book)
              </button>
            </div>

            {projectType === "business" ? (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Your Company Name *</label>
                    <input type="text" value={company} onChange={(e) => setCompany(e.target.value)} placeholder="e.g., Acme Corp" className="w-full rounded-md border border-gray-300 px-3 py-2 focus:ring-blue-500" required />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Your Company Website *</label>
                    <input type="url" value={companyWebsite} onChange={(e) => setCompanyWebsite(e.target.value)} placeholder="https://yourcompany.com" className="w-full rounded-md border border-gray-300 px-3 py-2 focus:ring-blue-500" required />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Solution You Sell *</label>
                  <input type="text" value={solution} onChange={(e) => setSolution(e.target.value)} placeholder="e.g., AI-powered analytics platform" className="w-full rounded-md border border-gray-300 px-3 py-2 focus:ring-blue-500" required />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Target Company Name *</label>
                    <input type="text" value={researchTarget} onChange={(e) => setResearchTarget(e.target.value)} placeholder="e.g., Target Inc" className="w-full rounded-md border border-gray-300 px-3 py-2 focus:ring-blue-500" required />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Target Company Website *</label>
                    <input type="url" value={researchWebsite} onChange={(e) => setResearchWebsite(e.target.value)} placeholder="https://targetcompany.com" className="w-full rounded-md border border-gray-300 px-3 py-2 focus:ring-blue-500" required />
                  </div>
                </div>

                {/* Template Selection for Business */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Template</label>
                  <select value={templateId} onChange={(e) => setTemplateId(e.target.value)} className="w-full rounded-md border border-gray-300 px-3 py-2">
                    <option value="template_1">Essential Research (8 tiles)</option>
                    <option value="template_2">Deep Dive Research (9 tiles)</option>
                  </select>
                </div>
              </>
            ) : (
              <>
                {/* Book Project Fields */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Author Name *</label>
                    <input type="text" value={company} onChange={(e) => setCompany(e.target.value)} placeholder="e.g., Jane Doe" className="w-full rounded-md border border-gray-300 px-3 py-2 focus:ring-rose-500" required />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Book Title *</label>
                    <input type="text" value={researchTarget} onChange={(e) => setResearchTarget(e.target.value)} placeholder="e.g., The Secret Garden" className="w-full rounded-md border border-gray-300 px-3 py-2 focus:ring-rose-500" required />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Genre & Theme *</label>
                  <input type="text" value={solution} onChange={(e) => setSolution(e.target.value)} placeholder="e.g., Romance, Enemies to Lovers" className="w-full rounded-md border border-gray-300 px-3 py-2 focus:ring-rose-500" required />
                </div>
              </>
            )}

            {/* Common Model Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">AI Model</label>
              <select value={model} onChange={(e) => setModel(e.target.value)} className="w-full rounded-md border border-gray-300 px-3 py-2">
                <option value="gpt-4">GPT-4</option>
                <option value="gpt-4o-mini">GPT-4o Mini</option>
              </select>
            </div>

            <div className="flex justify-end space-x-3 pt-4 border-t">
              <button type="button" onClick={handleClose} className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-md">Cancel</button>
              <button
                type="submit"
                disabled={isSubmitting}
                className={`px-4 py-2 text-sm font-medium text-white rounded-md ${projectType === 'business' ? 'bg-blue-600 hover:bg-blue-700' : 'bg-rose-600 hover:bg-rose-700'} disabled:opacity-50`}
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
