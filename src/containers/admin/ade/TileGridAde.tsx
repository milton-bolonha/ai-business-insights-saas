"use client";

import { useState, useMemo, useEffect } from "react";
import { Plus, Sparkles } from "lucide-react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
} from "@dnd-kit/sortable";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

import type { Tile } from "@/lib/types";
import type { AdeAppearanceTokens } from "@/lib/ade-theme";
import { TileCard } from "@/components/ui/TileCard";

interface TileGridAdeProps {
  tiles: Tile[];
  onDeleteTile?: (tileId: string) => void;
  onRegenerateTile?: (tileId: string) => void;
  onReorderTiles?: (order: string[]) => void;
  onOpenTile?: (tile: Tile) => void;
  isReordering?: boolean;
  regeneratingTileIds?: Set<string>;
  appearance?: AdeAppearanceTokens;
  onAddPrompt?: () => void;
  onBulkUploadPrompts?: () => void;
  animateEntrance?: boolean;
  workspaceName?: string;
}

// Sortable Tile Card Component
function SortableTileCard({
  tile,
  onDelete,
  onRegenerate,
  onOpen,
  isRegenerating,
  appearance,
  animateEntrance,
  index,
}: {
  tile: Tile;
  onDelete?: (tileId: string) => void;
  onRegenerate?: (tileId: string) => void;
  onOpen?: (tile: Tile) => void;
  isRegenerating?: boolean;
  appearance?: AdeAppearanceTokens;
  animateEntrance?: boolean;
  index: number;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: tile.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={{ ...style, animationDelay: animateEntrance ? `${index * 50}ms` : undefined }}
      className={`${animateEntrance ? "animate-in fade-in slide-in-from-bottom-4" : ""} h-full`}
    >
      <div
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing h-full"
      >
        <TileCard
          tile={tile}
          onDelete={onDelete}
          onRegenerate={onRegenerate}
          onOpen={onOpen}
          isRegenerating={isRegenerating}
          appearance={appearance}
        />
      </div>
    </div>
  );
}

export function TileGridAde({
  tiles,
  onDeleteTile,
  onRegenerateTile,
  onReorderTiles,
  onOpenTile,
  regeneratingTileIds = new Set(),
  appearance,
  onAddPrompt,
  animateEntrance = true,
}: TileGridAdeProps) {
  const [sortOrder, setSortOrder] = useState<"newest" | "oldest" | "category" | "manual">("manual");
  const [localTiles, setLocalTiles] = useState<Tile[]>(tiles);

  // Update local tiles when prop changes
  useEffect(() => {
    setLocalTiles(tiles);
  }, [tiles]);

  // Sort tiles based on sortOrder (except manual which uses orderIndex)
  const sortedTiles = useMemo(() => {
    if (sortOrder === "manual") {
      // Sort by orderIndex for manual ordering
      return [...localTiles].sort((a, b) => (a.orderIndex || 0) - (b.orderIndex || 0));
    }
    return [...localTiles].sort((a, b) => {
      switch (sortOrder) {
        case "newest":
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case "oldest":
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        case "category":
          return (a.category || "").localeCompare(b.category || "");
        default:
          return 0;
      }
    });
  }, [localTiles, sortOrder]);

  // DnD sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Handle drag end
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || active.id === over.id) {
      return;
    }

    const oldIndex = sortedTiles.findIndex((tile) => tile.id === active.id);
    const newIndex = sortedTiles.findIndex((tile) => tile.id === over.id);

    if (oldIndex !== -1 && newIndex !== -1) {
      const newTiles = arrayMove(sortedTiles, oldIndex, newIndex);
      
      // Update orderIndex for each tile
      const reorderedTiles = newTiles.map((tile, index) => ({
        ...tile,
        orderIndex: index,
      }));

      setLocalTiles(reorderedTiles);

      // Call onReorderTiles with new order
      if (onReorderTiles) {
        onReorderTiles(reorderedTiles.map((t) => t.id));
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2
            className="text-2xl font-bold"
            style={{ color: appearance?.textColor || "#111827" }}
          >
            Insights
          </h2>
          <p
            className="mt-1 text-sm"
            style={{ color: appearance?.mutedTextColor || "#6b7280" }}
          >
            {tiles.length} insight{tiles.length !== 1 ? "s" : ""} generated
          </p>
        </div>

        {/* Sort controls */}
        <div className="flex items-center space-x-2">
          <select
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value as typeof sortOrder)}
            className="rounded border px-3 py-1 text-sm cursor-pointer"
            style={{
              borderColor: appearance?.cardBorderColor || "#e5e7eb",
              backgroundColor: appearance?.surfaceColor || "#ffffff",
              color: appearance?.textColor || "#111827",
            }}
          >
            <option value="manual">Manual (drag to reorder)</option>
            <option value="newest">Newest first</option>
            <option value="oldest">Oldest first</option>
            <option value="category">By category</option>
          </select>
        </div>
      </div>

      {/* Tiles grid */}
      {sortedTiles.length > 0 ? (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={sortedTiles.map((t) => t.id)}
            strategy={rectSortingStrategy}
          >
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {sortedTiles.map((tile, index) => (
                <SortableTileCard
                  key={tile.id}
                  tile={tile}
                  onDelete={onDeleteTile}
                  onRegenerate={onRegenerateTile}
                  onOpen={(t) => {
                    console.log("[DEBUG] TileGridAde onOpen wrapper called for:", t.id);
                    if (onOpenTile) {
                      onOpenTile(t);
                    } else {
                      console.error("[DEBUG] TileGridAde onOpenTile prop is missing");
                    }
                  }}
                  isRegenerating={regeneratingTileIds.has(tile.id)}
                  appearance={appearance}
                  animateEntrance={animateEntrance}
                  index={index}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      ) : (
        /* Empty state */
        <div
          className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed py-12 text-center"
          style={{
            borderColor: appearance?.cardBorderColor || "#e5e7eb",
            backgroundColor: appearance?.overlayColor || "#f9fafb",
          }}
        >
          <div className="mb-4">
            <Sparkles
              className="mx-auto h-12 w-12"
              style={{ color: appearance?.mutedTextColor || "#9ca3af" }}
            />
          </div>
          <h3
            className="mb-2 text-lg font-medium"
            style={{ color: appearance?.textColor || "#111827" }}
          >
            No insights yet
          </h3>
          <p
            className="mb-6 text-sm"
            style={{ color: appearance?.mutedTextColor || "#6b7280" }}
          >
            Generate your first insight to get started.
          </p>
          {onAddPrompt && (
            <button
              onClick={() => {
                console.log('[DEBUG] TileGridAde Add Prompt button clicked');
                onAddPrompt?.();
              }}
              className="inline-flex items-center space-x-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700"
            >
              <Plus className="h-4 w-4" />
              <span>Add Prompt</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
}

