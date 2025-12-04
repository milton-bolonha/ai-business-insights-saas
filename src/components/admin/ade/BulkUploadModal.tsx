"use client";

import { useState } from "react";
import { X, Upload, FileText } from "lucide-react";

interface BulkUploadModalProps {
  open: boolean;
  onClose: () => void;
  // onSubmit?: (prompts: string[]) => void;
}

export function BulkUploadModal({ open, onClose }: BulkUploadModalProps) {
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file before setting
      const { validateFile } = await import("@/lib/security/file-validator");
      const validation = await validateFile(file, {
        maxSizeBytes: 5 * 1024 * 1024, // 5MB max for CSV
        allowedTypes: ["text/csv", "application/csv", "text/plain"],
        allowedExtensions: [".csv", ".txt"],
      });

      if (!validation.valid) {
        console.error("File validation failed:", validation.error);
        // TODO: Show error toast to user
        return;
      }

      setUploadedFile(file);
    }
  };

  const handleSubmit = async () => {
    if (!uploadedFile) return;

    setIsProcessing(true);
    try {
      // Validate file again before processing
      const { validateFile } = await import("@/lib/security/file-validator");
      const validation = await validateFile(uploadedFile, {
        maxSizeBytes: 5 * 1024 * 1024,
        allowedTypes: ["text/csv", "application/csv", "text/plain"],
        allowedExtensions: [".csv", ".txt"],
      });

      if (!validation.valid) {
        console.error("File validation failed:", validation.error);
        // TODO: Show error toast to user
        setIsProcessing(false);
        return;
      }

      // Simulate processing
      await new Promise(resolve => setTimeout(resolve, 2000));
      console.log("Processing file:", uploadedFile.name);
      // Here you would process the CSV file and create prompts
      onClose();
    } catch (error) {
      console.error("Error processing file:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleClose = () => {
    setUploadedFile(null);
    setIsProcessing(false);
    onClose();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={handleClose} />
      <div className="relative max-w-md w-full rounded-lg bg-white p-6 shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <Upload className="h-5 w-5 text-blue-600" />
            <h2 className="text-lg font-semibold">Bulk Upload Prompts</h2>
          </div>
          <button
            onClick={handleClose}
            className="rounded-full p-1 hover:bg-gray-100"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <p className="text-sm text-gray-600 mb-4">
              Upload a CSV file with prompts to generate multiple insights at once.
            </p>

            {/* File upload area */}
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
              <input
                type="file"
                accept=".csv"
                onChange={handleFileUpload}
                className="hidden"
                id="csv-upload"
              />
              <label
                htmlFor="csv-upload"
                className="cursor-pointer flex flex-col items-center space-y-2"
              >
                {uploadedFile ? (
                  <>
                    <FileText className="h-8 w-8 text-green-600" />
                    <span className="text-sm font-medium text-gray-900">
                      {uploadedFile.name}
                    </span>
                    <span className="text-xs text-gray-500">
                      {(uploadedFile.size / 1024).toFixed(1)} KB
                    </span>
                  </>
                ) : (
                  <>
                    <Upload className="h-8 w-8 text-gray-400" />
                    <span className="text-sm font-medium text-gray-900">
                      Choose CSV file
                    </span>
                    <span className="text-xs text-gray-500">
                      or drag and drop here
                    </span>
                  </>
                )}
              </label>
            </div>
          </div>

          <div className="text-xs text-gray-500">
            Expected format: CSV with a &quot;prompt&quot; column. One prompt per row.
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              onClick={handleClose}
              className="rounded-md px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
              disabled={isProcessing}
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={!uploadedFile || isProcessing}
              className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isProcessing ? "Processing..." : "Upload & Generate"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

