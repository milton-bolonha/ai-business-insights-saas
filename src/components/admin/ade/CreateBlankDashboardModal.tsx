"use client";

import { useState } from "react";
import { X, Plus } from "lucide-react";

interface CreateBlankDashboardModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: { dashboardName: string }) => void;
}

export function CreateBlankDashboardModal({
  open,
  onClose,
  onSubmit,
}: CreateBlankDashboardModalProps) {
  const [dashboardName, setDashboardName] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (dashboardName.trim()) {
      onSubmit({ dashboardName: dashboardName.trim() });
      handleClose();
    }
  };

  const handleClose = () => {
    setDashboardName("");
    onClose();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={handleClose} />
      <div className="relative max-w-md w-full rounded-lg bg-white p-6 shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <Plus className="h-5 w-5 text-blue-600" />
            <h2 className="text-lg font-semibold">Create New Dashboard</h2>
          </div>
          <button
            onClick={handleClose}
            className="rounded-full p-1 hover:bg-gray-100"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Dashboard Name
            </label>
            <input
              type="text"
              value={dashboardName}
              onChange={(e) => setDashboardName(e.target.value)}
              placeholder="e.g., Sales Pipeline"
              className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              required
            />
          </div>

          <div className="text-sm text-gray-600">
            Create a blank dashboard to start building your workspace from scratch.
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={handleClose}
              className="rounded-md px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!dashboardName.trim()}
              className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Create Dashboard
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

