"use client";

import { File, Upload } from "lucide-react";

import type { AdeAppearanceTokens } from "@/lib/ade-theme";

interface FilesPlaceholderAdeProps {
  appearance?: AdeAppearanceTokens;
}

export function FilesPlaceholderAde({ appearance }: FilesPlaceholderAdeProps) {
  return (
    <div className="space-y-4">
      {/* Header */}
      <div>
        <h3
          className="text-lg font-semibold"
          style={{ color: appearance?.textColor || "#111827" }}
        >
          Files
        </h3>
        <p
          className="mt-1 text-sm"
          style={{ color: appearance?.mutedTextColor || "#6b7280" }}
        >
          Document and file management (coming soon)
        </p>
      </div>

      {/* Placeholder */}
      <div
        className="rounded-lg border-2 border-dashed p-8 text-center"
        style={{
          borderColor: appearance?.cardBorderColor || "#e5e7eb",
          backgroundColor: appearance?.overlayColor || "#f9fafb",
        }}
      >
        <div className="mb-4">
          <File className="mx-auto h-12 w-12 text-gray-400" />
        </div>
        <h4
          className="mb-2 text-lg font-medium"
          style={{ color: appearance?.textColor || "#111827" }}
        >
          File Management
        </h4>
        <p
          className="mb-4 text-sm"
          style={{ color: appearance?.mutedTextColor || "#6b7280" }}
        >
          Upload and organize documents, images, and other files. This feature is currently in development.
        </p>
        <button
          disabled
          className="inline-flex items-center space-x-2 rounded-lg bg-gray-300 px-4 py-2 text-sm font-medium text-gray-500 cursor-not-allowed"
        >
          <Upload className="h-4 w-4" />
          <span>Upload Files (Soon)</span>
        </button>
      </div>
    </div>
  );
}

