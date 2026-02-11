"use client";

import { useState } from "react";
import { Copy, Trash2 } from "lucide-react";

import type { Tile } from "@/lib/types";
import type { AdeAppearanceTokens } from "@/lib/ade-theme";

interface TileCardProps {
  tile: Tile;
  onDelete?: (tileId: string) => void;
  onOpen?: (tile: Tile) => void;
  appearance?: AdeAppearanceTokens;
  className?: string;
}

export function TileCard({
  tile,
  onDelete,
  onOpen,
  appearance,
  className = "",
}: TileCardProps) {
  const [showActions, setShowActions] = useState(false);

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(tile.content);
    } catch (error) {
      console.error("Failed to copy:", error);
    }
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete?.(tile.id);
  };

  const truncateText = (text: string, maxLength: number = 320) => {
    return text.length > maxLength
      ? `${text.substring(0, maxLength)}...`
      : text;
  };

  return (
    <div
      className={`group relative rounded-lg border bg-white p-4 shadow-sm transition hover:shadow-md h-56 flex flex-col cursor-pointer ${className}`}
      style={{
        borderColor: appearance?.cardBorderColor || "#e5e7eb",
        // Force white background as requested, ignoring appearance.surfaceColor for the card bg
      }}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
      onClick={(e) => {
        console.log("[DEBUG] TileCard clicked:", tile.id);
        if (onOpen) {
          console.log("[DEBUG] TileCard calling onOpen");
          onOpen(tile);
        } else {
          console.error("[DEBUG] TileCard onOpen prop is missing");
        }
      }}
    >
      {/* Actions overlay */}
      <div
        className={`absolute right-2 top-2 flex items-center space-x-1 rounded-md border bg-white p-1 shadow-sm transition-opacity z-10 ${showActions ? "opacity-100" : "opacity-0"
          }`}
        style={{
          borderColor: appearance?.cardBorderColor || "#e5e7eb",
        }}
      >
        <button
          onClick={handleCopy}
          className="flex h-6 w-6 items-center justify-center rounded transition hover:bg-gray-100"
          title="Copy content"
        >
          <Copy className="h-3 w-3" />
        </button>

        {onDelete && (
          <button
            onClick={handleDelete}
            className="flex h-6 w-6 items-center justify-center rounded transition hover:bg-red-50 hover:text-red-600"
            title="Delete"
          >
            <Trash2 className="h-3 w-3" />
          </button>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden relative">
        <h3
          className="mb-2 text-lg font-semibold"
          style={{ color: appearance?.textColor || "#111827" }}
        >
          {tile.title}
        </h3>
        <p
          className="text-sm leading-relaxed"
          style={{ color: appearance?.mutedTextColor || "#6b7280" }}
        >
          {(() => {
            const separator = "[EXCERPT]";
            const parts = tile.content?.split(separator);
            const excerpt = parts && parts.length > 1 ? parts[1].trim() : null;
            const mainContent = parts ? parts[0].trim() : "";

            // If we have an explicit excerpt, show it
            if (excerpt) {
              return excerpt;
            }

            // Fallback to truncation if no excerpt found
            return truncateText(mainContent || tile.content || "");
          })()}
        </p>

        {/* Fade out effect at bottom */}
        <div className="absolute bottom-0 left-0 right-0 h-12 bg-linear-to-t from-white to-transparent pointer-events-none"></div>
      </div>

      {/* Metadata */}
      <div className="mt-3 flex items-center justify-between text-xs pt-2">
        {/* categoria removida */}
        {tile.totalTokens && (
          <span
            className="text-gray-400"
            style={{ color: appearance?.mutedTextColor || "#6b7280" }}
          >
            {tile.totalTokens} tokens
          </span>
        )}
      </div>
    </div>
  );
}
