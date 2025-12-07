import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { getAuth } from "@/lib/auth/get-auth";
import { authorizeResourceAccess } from "@/lib/auth/authorize";
import { loadWorkspacesWithDashboards } from "@/lib/storage/dashboards-store";
import { checkLimit, incrementUsage } from "@/lib/saas/usage-service";
import type { Contact } from "@/lib/types";
import { checkRateLimitMiddleware } from "@/lib/middleware/rate-limit";

// Runtime: Node.js (required for DB/local access)
export const runtime = "nodejs";

const chatSchema = z.object({
  message: z.string().min(1, "Message is required"),
});

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ contactId: string }> }
) {
  const rate = await checkRateLimitMiddleware(request);
  if (!rate.allowed && rate.response) return rate.response;

  const { contactId } = await params;
  const rawBody = await request.json().catch(() => null);
  const parsed = chatSchema.safeParse(rawBody);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid payload", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { userId } = await getAuth();

  try {
    if (userId) {
      // 🟢 MEMBER: buscar contato no Mongo e validar acesso
      const { db } = await import("@/lib/db/mongodb");
      const { contactDocumentToContact } = await import("@/lib/db/models/Contact");
      // eslint-disable-next-line @typescript-eslint/consistent-type-imports
      type ContactDocument = import("@/lib/db/models/Contact").ContactDocument;

      const contactDoc = await db.findOne<ContactDocument>("contacts", {
        $or: [{ _id: contactId }, { id: contactId }],
        userId,
      });

      if (!contactDoc) {
        return NextResponse.json({ error: "Contact not found" }, { status: 404 });
      }

      const contact = contactDocumentToContact(contactDoc);
      const workspaceId = contactDoc.workspaceId;
      const dashboardId = contactDoc.dashboardId;

      if (workspaceId && dashboardId) {
        const auth = await authorizeResourceAccess(
          workspaceId,
          dashboardId,
          contactId,
          "contacts",
          userId
        );
        if (!auth.authorized) {
          return NextResponse.json(
            { error: auth.error ?? "Unauthorized" },
            { status: 403 }
          );
        }
      }

      const limit = await checkLimit(userId, "contactChatsCount");
      if (!limit.allowed) {
        return NextResponse.json(
          {
            error:
              limit.reason ?? "Contact chat limit reached. Upgrade your plan to continue.",
          },
          { status: 429 }
        );
      }

      await incrementUsage(userId, "contactChatsCount", 1);

      // Não alteramos dados do contato; apenas retornamos o contato atual
      return NextResponse.json({
        success: true,
        contact,
      });
    }

    // 🟡 GUEST: procurar contato no storage local
    const workspaces = loadWorkspacesWithDashboards();
    let foundContact: Contact | null = null;

    for (const workspace of workspaces) {
      for (const dashboard of workspace.dashboards) {
        const candidate = dashboard.contacts?.find((c) => c.id === contactId);
        if (candidate) {
          foundContact = candidate;
          break;
        }
      }
      if (foundContact) break;
    }

    if (!foundContact) {
      return NextResponse.json({ error: "Contact not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      contact: foundContact,
    });
  } catch (error) {
    console.error("[API] /api/workspace/contacts/[contactId]/chat - Error:", error);
    return NextResponse.json(
      {
        error: "Failed to chat with contact",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}


