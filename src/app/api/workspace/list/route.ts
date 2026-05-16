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
import { type WorkspaceMembershipDocument } from "@/lib/db/models/WorkspaceMembership";

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
      // Return empty array for guests (who manage their workspaces in localStorage)
      return NextResponse.json({ workspaces: [] });
    }

    // 1. Find workspaces the user owns
    const ownedWorkspaces = await db.find<WorkspaceDocument>("workspaces", { userId });
    
    // 2. Find workspaces the user is a member of
    const memberships = await db.find<WorkspaceMembershipDocument>("workspaces_memberships", { userId }); // Note: wait, is it 'workspacememberships' or 'workspaces_memberships'? The membership route used 'workspacememberships'.
    
    // Let me check what I named it. Ah, in route.ts I used "workspacememberships".
    const memberWorkspaces = await db.find<WorkspaceMembershipDocument>("workspacememberships", { userId });
    
    const memberWorkspaceIds = memberWorkspaces.map(m => m.workspaceId);
    
    let sharedWorkspaces: WorkspaceDocument[] = [];
    if (memberWorkspaceIds.length > 0) {
        sharedWorkspaces = await db.find<WorkspaceDocument>("workspaces", { 
            $or: [
                { sessionId: { $in: memberWorkspaceIds } },
                { _id: { $in: memberWorkspaceIds as any } }
            ]
        });
    }

    // Combine and deduplicate
    const allWorkspaceDocs = [...ownedWorkspaces];
    for (const sw of sharedWorkspaces) {
        if (!allWorkspaceDocs.some(w => w.sessionId === sw.sessionId || w._id?.toString() === sw._id?.toString())) {
            allWorkspaceDocs.push(sw);
        }
    }

    const allWorkspaceSessionIds = allWorkspaceDocs.map(w => w.sessionId);
    // Also include _id strings for safety
    const allWorkspaceObjectIds = allWorkspaceDocs.map(w => w._id?.toString() || "");

    const dashboardDocs = await db.find<DashboardDocument>("dashboards", { 
        $or: [
            { workspaceId: { $in: allWorkspaceSessionIds } },
            { workspaceId: { $in: allWorkspaceObjectIds } }
        ]
    });
    
    // Extract dashboard IDs to fetch tiles, contacts, notes
    const dashboardIds = dashboardDocs.map(d => (d as any).id || d._id?.toString());

    const tileDocs = dashboardIds.length > 0 ? await db.find<TileDocument>("tiles", { dashboardId: { $in: dashboardIds } }) : [];
    const contactDocs = dashboardIds.length > 0 ? await db.find<ContactDocument>("contacts", { dashboardId: { $in: dashboardIds } }) : [];
    const noteDocs = dashboardIds.length > 0 ? await db.find<NoteDocument>("notes", { dashboardId: { $in: dashboardIds } }) : [];

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

    const workspaces: WorkspaceWithDashboards[] = allWorkspaceDocs.map((doc) => {
      const snapshot = workspaceDocumentToSnapshot(doc);
      const dashboards =
        dashboardsByWorkspace.get(doc.sessionId) ??
        dashboardsByWorkspace.get(snapshot.sessionId) ??
        [];

      if (dashboards.length > 0 && !dashboards.some((d) => d.isActive)) {
        dashboards[0].isActive = true;
      }

      // Determine user access level
      let accessLevel = "viewer";
      if (doc.userId === userId) {
          accessLevel = "owner";
      } else {
          const membership = memberWorkspaces.find(m => m.workspaceId === doc.sessionId || m.workspaceId === doc._id?.toString());
          if (membership) {
              accessLevel = membership.accessLevel;
          }
      }

      return {
        id: snapshot.sessionId,
        name: snapshot.name,
        website: snapshot.website,
        salesRepCompany: snapshot.salesRepCompany,
        salesRepWebsite: snapshot.salesRepWebsite,
        promptSettings: snapshot.promptSettings,
        dashboards,
        createdAt: toIso(doc.createdAt ?? snapshot.generatedAt ?? new Date()),
        updatedAt: toIso(doc.updatedAt ?? snapshot.generatedAt ?? new Date()),
        userId: doc.userId,
        userAccessLevel: accessLevel,
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

