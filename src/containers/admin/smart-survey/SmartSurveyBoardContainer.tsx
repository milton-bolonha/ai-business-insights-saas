"use client";

import { useSmartSurveyBoard } from "./useSmartSurveyBoard";
import { SmartSurveyBoardView } from "@/components/admin/ade/smart-survey/SmartSurveyBoardView";
import { useUpdateTile } from "@/lib/state/query/tile.queries";

export function SmartSurveyBoardContainer({
  workspaceId,
  dashboardId,
  tiles,
}: {
  workspaceId: string;
  dashboardId?: string;
  tiles?: any[];
}) {
  const updateTileMutation = useUpdateTile();
  
  const board = useSmartSurveyBoard(
    workspaceId,
    dashboardId,
    tiles,
    updateTileMutation
  );

  return <SmartSurveyBoardView {...board} />;
}
