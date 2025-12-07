import { NextResponse } from "next/server";

import { getAuth } from "@/lib/auth/get-auth";
import { db } from "@/lib/db/mongodb";
import {
  workspaceDocumentToSnapshot,
  type WorkspaceDocument,
} from "@/lib/db/models/Workspace";
import {
  dashboardDocumentToDashboard,
  type DashboardDocument,
} from "@/lib/db/models/Dashboard";
import {
  tileDocumentToTile,
  type TileDocument,
} from "@/lib/db/models/Tile";
import {
  contactDocumentToContact,
  type ContactDocument,
} from "@/lib/db/models/Contact";
import {
  noteDocumentToNote,
  type NoteDocument,
} from "@/lib/db/models/Note";
import type { Dashboard, WorkspaceWithDashboards } from "@/lib/types/dashboard";

export const runtime = "nodejs";

function toIso(value: Date | string | undefined): string {
  if (!value) return new Date().toISOString();
  if (value instanceof Date) return value.toISOString();
  return value;
}

export async function GET() {
  try {
    const { userId } = await getAuth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const [workspaceDocs, dashboardDocs, tileDocs, contactDocs, noteDocs] =
      await Promise.all([
        db.find<WorkspaceDocument>("workspaces", { userId }),
        db.find<DashboardDocument>("dashboards", { userId }),
        db.find<TileDocument>("tiles", { userId }),
        db.find<ContactDocument>("contacts", { userId }),
        db.find<NoteDocument>("notes", { userId }),
      ]);

    const dashboardsByWorkspace = new Map<string, Dashboard[]>();
    const dashboardsById = new Map<string, Dashboard>();

    for (const doc of dashboardDocs) {
      const baseDashboard = dashboardDocumentToDashboard(doc);
      const dashboardWithData: Dashboard = {
        ...baseDashboard,
        tiles: [],
        notes: [],
        contacts: [],
        isActive: doc.isActive ?? false,
      };

      const dashboardKey =
        (doc as DashboardDocument & { id?: string }).id ??
        doc._id?.toString() ??
        baseDashboard.id;

      dashboardsById.set(dashboardKey, dashboardWithData);

      if (!dashboardsByWorkspace.has(doc.workspaceId)) {
        dashboardsByWorkspace.set(doc.workspaceId, []);
      }
      dashboardsByWorkspace.get(doc.workspaceId)!.push(dashboardWithData);
    }

    for (const tileDoc of tileDocs) {
      const tile = tileDocumentToTile(tileDoc);
      const target = dashboardsById.get(tileDoc.dashboardId);
      if (target) {
        target.tiles.push(tile);
      }
    }

    for (const contactDoc of contactDocs) {
      const contact = contactDocumentToContact(contactDoc);
      const target = dashboardsById.get(contactDoc.dashboardId);
      if (target) {
        target.contacts.push(contact);
      }
    }

    for (const noteDoc of noteDocs) {
      const note = noteDocumentToNote(noteDoc);
      const target = dashboardsById.get(noteDoc.dashboardId);
      if (target) {
        target.notes.push(note);
      }
    }

    dashboardsById.forEach((dashboard) => {
      dashboard.tiles.sort((a, b) => a.orderIndex - b.orderIndex);
      dashboard.notes.sort((a, b) =>
        (a.updatedAt || "").localeCompare(b.updatedAt || "")
      );
      dashboard.contacts.sort((a, b) =>
        (a.createdAt || "").localeCompare(b.createdAt || "")
      );
    });

    const workspaces: WorkspaceWithDashboards[] = workspaceDocs.map((doc) => {
      const snapshot = workspaceDocumentToSnapshot(doc);
      const dashboards =
        dashboardsByWorkspace.get(doc.sessionId) ??
        dashboardsByWorkspace.get(snapshot.sessionId) ??
        [];

      if (dashboards.length > 0 && !dashboards.some((d) => d.isActive)) {
        dashboards[0].isActive = true;
      }

      return {
        id: snapshot.sessionId,
        name: snapshot.name,
        website: snapshot.website,
        salesRepCompany: snapshot.salesRepCompany,
        salesRepWebsite: snapshot.salesRepWebsite,
        dashboards,
        createdAt: toIso(doc.createdAt ?? snapshot.generatedAt ?? new Date()),
        updatedAt: toIso(doc.updatedAt ?? snapshot.generatedAt ?? new Date()),
      };
    });

    return NextResponse.json({ workspaces });
  } catch (error) {
    console.error("[api/workspace/list] Error listing workspaces", error);
    return NextResponse.json(
      { error: "Failed to load workspaces" },
      { status: 500 }
    );
  }
}

