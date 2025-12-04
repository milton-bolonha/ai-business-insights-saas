import type { Tile, TileChatAttachment } from "@/lib/types";

export interface TileChatPayload {
  message: string;
  attachments?: TileChatAttachment[];
}

export async function deleteTile(tileId: string): Promise<void> {
  const response = await fetch(`/api/workspace/tiles/${tileId}`, {
    method: "DELETE",
  });

  if (!response.ok) {
    throw new Error("Failed to remove tile");
  }
}

export async function regenerateTile(tileId: string): Promise<Tile> {
  const response = await fetch(`/api/workspace/tiles/${tileId}/regenerate`, {
    method: "POST",
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    throw new Error(
      (payload.error as string) ?? "We couldn't regenerate this insight right now."
    );
  }

  const data = await response.json();
  return data.tile as Tile;
}

export async function chatWithTile(
  tileId: string,
  payload: TileChatPayload
): Promise<Tile> {
  const response = await fetch(`/api/workspace/tiles/${tileId}/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      message: payload.message,
      attachments: payload.attachments ?? [],
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      errorData.error ?? "Failed to generate follow-up insight"
    );
  }

  const responseData = await response.json();
  return responseData.tile as Tile;
}

export async function reorderTiles(order: string[]): Promise<void> {
  const response = await fetch("/api/workspace/reorder", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ order }),
  });

  if (!response.ok) {
    throw new Error("Failed to persist tile order");
  }
}

