"use client";

import type { AdeAppearanceTokens } from "@/lib/ade-theme";

interface EmptyStateAdeProps {
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  appearance?: AdeAppearanceTokens;
}

export function EmptyStateAde({
  title,
  description,
  action,
  appearance,
}: EmptyStateAdeProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="mb-4">
        <div className="mx-auto h-12 w-12 rounded-full bg-gray-100 flex items-center justify-center">
          <svg
            className="h-6 w-6 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
        </div>
      </div>
      <h3
        className="mb-2 text-lg font-medium"
        style={{ color: appearance?.textColor || "#111827" }}
      >
        {title}
      </h3>
      <p
        className="mb-6 max-w-sm text-sm"
        style={{ color: appearance?.mutedTextColor || "#6b7280" }}
      >
        {description}
      </p>
      {action && (
        <button
          onClick={action.onClick}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700"
        >
          {action.label}
        </button>
      )}
    </div>
  );
}
