"use client";

import { useState } from "react";
import { X, Sparkles } from "lucide-react";

interface AddPromptModalProps {
  open: boolean;
  onClose: () => void;
  onAddPrompt: (data: {
    title: string;
    description: string;
    useMaxPrompt: boolean;
    requestSize: "small" | "medium" | "large";
  }) => void;
}

export function AddPromptModal({ open, onClose, onAddPrompt }: AddPromptModalProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [useMaxPrompt, setUseMaxPrompt] = useState(false);
  const [requestSize, setRequestSize] = useState<"small" | "medium" | "large">("medium");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (title.trim() && description.trim()) {
      onAddPrompt({
        title: title.trim(),
        description: description.trim(),
        useMaxPrompt,
        requestSize,
      });
      handleClose();
    }
  };

  const handleClose = () => {
    setTitle("");
    setDescription("");
    setUseMaxPrompt(false);
    setRequestSize("medium");
    onClose();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={handleClose} />
      <div className="relative max-w-md w-full rounded-lg bg-white p-6 shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <Sparkles className="h-5 w-5 text-blue-600" />
            <h2 className="text-lg font-semibold">Add New Insight</h2>
          </div>
          <button
            onClick={handleClose}
            className="cursor-pointer rounded-full p-1 hover:bg-gray-100"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Competitive Analysis"
              className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Prompt
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe what you want to generate..."
              rows={4}
              className="w-full resize-none rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Response Length
            </label>
            <div className="flex space-x-2">
              {[
                { value: "small", label: "Short" },
                { value: "medium", label: "Medium" },
                { value: "large", label: "Long" },
              ].map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setRequestSize(option.value as typeof requestSize)}
                  className={`flex-1 rounded-md px-3 py-2 text-sm font-medium transition ${
                    requestSize === option.value
                      ? "bg-blue-600 text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="useMaxPrompt"
              checked={useMaxPrompt}
              onChange={(e) => setUseMaxPrompt(e.target.checked)}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <label htmlFor="useMaxPrompt" className="text-sm text-gray-700">
              Use advanced AI model (slower but more detailed)
            </label>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={handleClose}
              className="cursor-pointer rounded-md px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!title.trim() || !description.trim()}
              className="cursor-pointer rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Generate Insight
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

