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
  const [isDeleting, setIsDeleting] = useState(false);

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(tile.content);
    } catch (error) {
      console.error("Failed to copy:", error);
    }
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
      onMouseLeave={() => {
        setShowActions(false);
        setIsDeleting(false);
      }}
      onClick={(e) => {
        if (isDeleting) return;
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
        className={`absolute right-2 top-2 flex items-center space-x-1 rounded-md border bg-white p-1 shadow-sm transition-all z-20 ${showActions ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-1 pointer-events-none"
          }`}
        style={{
          borderColor: appearance?.cardBorderColor || "#e5e7eb",
        }}
      >
        {!isDeleting ? (
          <>
            <button
              onClick={handleCopy}
              className="flex h-7 w-7 items-center justify-center rounded-md transition hover:bg-gray-100 text-gray-400 hover:text-gray-600"
              title="Copy content"
            >
              <Copy className="h-3.5 w-3.5" />
            </button>

            {onDelete && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsDeleting(true);
                }}
                className="flex h-7 w-7 items-center justify-center rounded-md transition hover:bg-red-50 text-gray-400 hover:text-red-500"
                title="Delete"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            )}
          </>
        ) : (
          <div className="flex items-center gap-1 animate-in fade-in slide-in-from-right-2 duration-200">
            <span className="text-[10px] font-bold text-red-500 px-1">Delete?</span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete?.(tile.id);
                setIsDeleting(false);
              }}
              className="flex h-7 px-2 items-center justify-center rounded-md bg-red-500 text-white text-[10px] font-bold hover:bg-red-600 transition-colors"
            >
              Yes
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsDeleting(false);
              }}
              className="flex h-7 px-2 items-center justify-center rounded-md bg-gray-100 text-gray-600 text-[10px] font-bold hover:bg-gray-200 transition-colors"
            >
              No
            </button>
          </div>
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
