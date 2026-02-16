"use client";

import { useState, useMemo, useEffect } from "react";
import { Plus, Sparkles, ChevronDown } from "lucide-react";
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
import { motion, AnimatePresence } from "framer-motion";

import type { Tile } from "@/lib/types";
import type { AdeAppearanceTokens } from "@/lib/ade-theme";
import { TileCard } from "@/components/ui/TileCard";
import { useCurrentWorkspace } from "@/lib/stores";

interface TileGridAdeProps {
  tiles: Tile[];
  onDeleteTile?: (tileId: string) => void;
  onReorderTiles?: (order: string[]) => void;
  onOpenTile?: (tile: Tile) => void;
  isReordering?: boolean;
  appearance?: AdeAppearanceTokens;
  onAddPrompt?: () => void;
  onBulkUploadPrompts?: () => void;
  animateEntrance?: boolean;
  workspaceName?: string;
  isGenerating?: boolean;
  // Dashboard Props
  dashboards?: Array<{ id: string; name: string; isActive?: boolean }>;
  onSelectDashboard?: (dashboardId: string) => void;
  onCreateBlankDashboard?: () => void;
}

// Sortable Tile Card Component
function SortableTileCard({
  tile,
  onDelete,
  onOpen,
  appearance,
  animateEntrance,
  index,
}: {
  tile: Tile;
  onDelete?: (tileId: string) => void;
  onOpen?: (tile: Tile) => void;
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
      style={{
        ...style,
        animationDelay: animateEntrance ? `${index * 50}ms` : undefined,
      }}
      className={`${animateEntrance ? "animate-in fade-in slide-in-from-bottom-4" : ""
        } h-full`}
    >
      <div
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing h-full"
      >
        <TileCard
          tile={tile}
          onDelete={onDelete}
          onOpen={onOpen}
          appearance={appearance}
        />
      </div>
    </div>
  );
}

export function TileGridAde({
  tiles,
  onDeleteTile,
  onReorderTiles,
  onOpenTile,
  appearance,
  onAddPrompt,
  animateEntrance = true,
  isGenerating = false,
  dashboards = [],
  onSelectDashboard,
  onCreateBlankDashboard,
}: TileGridAdeProps) {
  const [sortOrder, setSortOrder] = useState<
    "newest" | "oldest" | "category" | "manual"
  >("manual");
  const [localTiles, setLocalTiles] = useState<Tile[]>(tiles);
  const [isDashboardOpen, setIsDashboardOpen] = useState(false);

  const currentWorkspace = useCurrentWorkspace();
  const isLoveWriters = currentWorkspace?.promptSettings?.templateId === "template_love_writers";
  const gridTitle = isLoveWriters ? "Book Arcs" : "Insight Cards";

  // Dashboard Data
  const currentDashboard = dashboards.find(d => d.isActive);
  const otherDashboards = dashboards.filter(d => !d.isActive);

  // Update local tiles when prop changes
  useEffect(() => {
    setLocalTiles(tiles);
  }, [tiles]);

  // Sort tiles based on sortOrder (except manual which uses orderIndex)
  const sortedTiles = useMemo(() => {
    if (sortOrder === "manual") {
      // Sort by orderIndex for manual ordering
      return [...localTiles].sort(
        (a, b) => (a.orderIndex || 0) - (b.orderIndex || 0)
      );
    }
    return [...localTiles].sort((a, b) => {
      switch (sortOrder) {
        case "newest":
          return (
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
        case "oldest":
          return (
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
          );
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
            {gridTitle}
          </h2>
          <p
            className="mt-1 text-sm"
            style={{ color: appearance?.mutedTextColor || "#6b7280" }}
          >
            {tiles.length} {isLoveWriters ? "arc" : "insight"}{tiles.length !== 1 ? "s" : ""} generated
          </p>
        </div>

        {/* Dashboard Switcher (Right aligned) */}
        {dashboards.length > 0 && (
          <div className="relative z-20">
            <button
              onClick={() => setIsDashboardOpen(!isDashboardOpen)}
              className="flex items-center gap-2 rounded-lg bg-white border border-gray-200 px-3 py-1.5 text-sm font-medium hover:bg-gray-50 transition-colors text-gray-700 shadow-sm"
            >
              <span className="hidden md:block">{currentDashboard?.name || "Dashboard"}</span>
              <ChevronDown className="h-3 w-3 text-gray-400" />
            </button>
            <AnimatePresence>
              {isDashboardOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setIsDashboardOpen(false)} />
                  <motion.div
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 5 }}
                    className="absolute right-0 top-full z-50 mt-2 w-56 rounded-xl border border-gray-200 bg-white shadow-lg p-1"
                  >
                    {otherDashboards.map(d => (
                      <button
                        key={d.id}
                        onClick={() => {
                          onSelectDashboard?.(d.id);
                          setIsDashboardOpen(false);
                        }}
                        className="flex w-full items-center px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg text-left"
                      >
                        {d.name}
                      </button>
                    ))}
                    <button
                      onClick={() => {
                        onCreateBlankDashboard?.();
                        setIsDashboardOpen(false);
                      }}
                      className="flex w-full items-center gap-2 px-3 py-2 text-sm text-blue-600 hover:bg-blue-50 rounded-lg text-left mt-1"
                    >
                      <Plus className="h-3 w-3" />
                      <span>New Dashboard</span>
                    </button>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Tiles grid */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={sortedTiles.map((t) => t.id)}
          strategy={rectSortingStrategy}
        >
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">


            {onAddPrompt && (
              <button
                onClick={() => onAddPrompt()}
                type="button"
                className="flex h-full min-h-[220px] w-full flex-col items-center justify-center rounded-2xl border-2 border-dashed transition hover:bg-white hover:cursor-pointer"
                style={{
                  borderColor: appearance?.cardBorderColor || "#d1d5db",
                  color: appearance?.mutedTextColor || "#6b7280",
                  backgroundColor: appearance?.overlayColor || "#f8fafc",
                }}
              >
                <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 text-blue-600">
                  <Plus className="h-6 w-6" />
                </div>
                <span className="text-sm font-medium">Add Manual Arc</span>
              </button>
            )}

            {sortedTiles.map((tile, index) => (
              <SortableTileCard
                key={tile.id}
                tile={tile}
                onDelete={onDeleteTile}
                onOpen={(t) => {
                  console.log(
                    "[DEBUG] TileGridAde onOpen wrapper called for:",
                    t.id
                  );
                  if (onOpenTile) {
                    onOpenTile(t);
                  } else {
                    console.error(
                      "[DEBUG] TileGridAde onOpenTile prop is missing"
                    );
                  }
                }}
                appearance={appearance}
                animateEntrance={animateEntrance}
                index={index}
              />
            ))}

            {isGenerating && (
              <div className="flex flex-col h-full min-h-[200px] border border-gray-100 rounded-xl bg-white shadow-sm overflow-hidden animate-pulse">
                <div className="flex items-center justify-between p-4 border-b border-gray-50">
                  <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                  <div className="h-4 w-4 bg-gray-200 rounded-full"></div>
                </div>
                <div className="flex-1 p-4 space-y-3">
                  <div className="h-4 bg-gray-200 rounded w-full"></div>
                  <div className="h-4 bg-gray-200 rounded w-5/6"></div>
                  <div className="h-4 bg-gray-200 rounded w-4/6"></div>
                </div>
                <div className="p-4 bg-gray-50 border-t border-gray-100 flex items-center justify-center">
                  <span className="text-xs font-medium text-gray-400 animate-pulse">Writing next arc...</span>
                </div>
              </div>
            )}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  );
}
