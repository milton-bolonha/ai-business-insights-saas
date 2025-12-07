import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";

import type { Contact } from "@/lib/types";
import { getAuth } from "@/lib/auth/get-auth";
import {
  addContactToDashboard,
  loadWorkspacesWithDashboards,
} from "@/lib/storage/dashboards-store";
import { audit } from "@/lib/audit/logger";
import { checkRateLimitMiddleware } from "@/lib/middleware/rate-limit";

// Runtime: Node.js (required for MongoDB)
export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const rate = await checkRateLimitMiddleware(
    request,
    "/api/workspace/contacts"
  );
  if (!rate.allowed && rate.response) return rate.response;

  const body = await request.json().catch(() => null);
  const { userId } = await getAuth();

  const name = typeof body?.name === "string" ? body.name.trim() : "";
  const jobTitle =
    typeof body?.jobTitle === "string" ? body.jobTitle.trim() : "";
  const linkedinUrl =
    typeof body?.linkedinUrl === "string" ? body.linkedinUrl.trim() : "";
  const email = typeof body?.email === "string" ? body.email.trim() : "";
  const phone = typeof body?.phone === "string" ? body.phone.trim() : "";
  const company = typeof body?.company === "string" ? body.company.trim() : "";
  const notes = typeof body?.notes === "string" ? body.notes.trim() : "";
  const dashboardId =
    typeof body?.dashboardId === "string" ? body.dashboardId.trim() : "";
  const workspaceId =
    typeof body?.workspaceId === "string" ? body.workspaceId.trim() : "";

  if (!name) {
    return NextResponse.json({ error: "Name is required" }, { status: 400 });
  }

  if (!dashboardId) {
    return NextResponse.json(
      { error: "dashboardId is required" },
      { status: 400 }
    );
  }

  let usageService: typeof import("@/lib/saas/usage-service") | null = null;

  try {
    if (userId) {
      usageService = await import("@/lib/saas/usage-service");
      const limit = await usageService.checkLimit(userId, "contactsCount");
      if (!limit.allowed) {
        return NextResponse.json(
          {
            error:
              limit.reason ??
              "Contact limit reached. Upgrade your plan to add more contacts.",
          },
          { status: 429 }
        );
      }
    }

    const now = new Date().toISOString();
    const contactId = `contact_${randomUUID()}`;

    const contactData: Contact = {
      id: contactId,
      name,
      jobTitle,
      linkedinUrl,
      email,
      phone,
      company,
      notes,
      createdAt: now,
    };

    if (userId) {
      // 🟢 MEMBER: Salvar no MongoDB
      if (!workspaceId) {
        return NextResponse.json(
          { error: "workspaceId is required for members" },
          { status: 400 }
        );
      }

      const { db } = await import("@/lib/db/mongodb");
      const { contactToDocument } = await import("@/lib/db/models/Contact");
      const { invalidateResourceCache } = await import(
        "@/lib/cache/invalidation"
      );

      const contactDoc = contactToDocument(
        contactData,
        userId,
        workspaceId,
        dashboardId
      );
      const insertedId = await db.insertOne("contacts", {
        ...contactDoc,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      // Invalidate cache
      await invalidateResourceCache("contacts", dashboardId, workspaceId);

      // Audit log
      await audit.createContact(insertedId, dashboardId, userId, request);

      if (usageService) {
        await usageService.incrementUsage(userId, "contactsCount", 1);
      }

      console.log("[API] /api/workspace/contacts - Contact saved to MongoDB", {
        contactId: insertedId,
        userId,
        workspaceId,
        dashboardId,
      });

      return NextResponse.json({
        success: true,
        contact: { ...contactData, id: insertedId },
      });
    } else {
      // 🟡 GUEST: Salvar no localStorage
      const workspaces = loadWorkspacesWithDashboards();
      const workspace = workspaces.find((w) => w.id === workspaceId);

      if (workspace) {
        addContactToDashboard(workspace.id, dashboardId, contactData);

        // Audit log
        await audit.createContact(contactId, dashboardId, null, request);

        console.log(
          "[API] /api/workspace/contacts - Contact saved to localStorage",
          {
            contactId,
            workspaceId: workspace.id,
            dashboardId,
          }
        );
      } else {
        return NextResponse.json(
          { error: "Workspace not found" },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        contact: contactData,
      });
    }
  } catch (error) {
    console.error("[API] /api/workspace/contacts - Error:", error);
    return NextResponse.json(
      {
        error: "Failed to create contact",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const dashboardId = searchParams.get("dashboardId");
  const workspaceId = searchParams.get("workspaceId");
  const { userId } = await getAuth();

  if (!dashboardId) {
    return NextResponse.json(
      { error: "dashboardId is required" },
      { status: 400 }
    );
  }

  try {
    if (userId) {
      // 🟢 MEMBER: Buscar do MongoDB
      if (!workspaceId) {
        return NextResponse.json(
          { error: "workspaceId is required for members" },
          { status: 400 }
        );
      }

      // Try cache first
      const { cache, cacheKeys, CACHE_TTL } = await import("@/lib/cache/redis");
      const cacheKey = cacheKeys.contacts.dashboard(dashboardId);
      const cached = await cache.get<Contact[]>(cacheKey);
      if (cached) {
        console.log("[API] /api/workspace/contacts - Serving from cache");
        return NextResponse.json(cached, {
          headers: {
            "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120",
          },
        });
      }

      // Fetch from MongoDB
      const { db } = await import("@/lib/db/mongodb");
      const { contactDocumentToContact } = await import(
        "@/lib/db/models/Contact"
      );
      // eslint-disable-next-line @typescript-eslint/consistent-type-imports
      type ContactDocument = import("@/lib/db/models/Contact").ContactDocument;

      const contacts = await db.find<ContactDocument>("contacts", {
        userId,
        workspaceId,
        dashboardId,
      });

      const mappedContacts = contacts.map(contactDocumentToContact);

      // Cache for configured TTL
      await cache.set(cacheKey, mappedContacts, CACHE_TTL.contacts);

      return NextResponse.json(mappedContacts, {
        headers: {
          "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120",
        },
      });
    } else {
      // 🟡 GUEST: Buscar do localStorage
      const workspaces = loadWorkspacesWithDashboards();
      const workspace = workspaces.find((w) => w.id === workspaceId);

      if (!workspace) {
        return NextResponse.json([]);
      }

      const dashboard = workspace.dashboards.find((d) => d.id === dashboardId);
      const contacts = dashboard?.contacts || [];

      return NextResponse.json(contacts, {
        headers: {
          "Cache-Control": "private, no-store",
        },
      });
    }
  } catch (error) {
    console.error("[API] /api/workspace/contacts - Error:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch contacts",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
