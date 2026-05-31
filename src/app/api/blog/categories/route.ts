import { NextRequest, NextResponse } from "next/server";
import { getAuthWorkspace } from "@/lib/auth/get-auth";
import { db } from "@/lib/db/mongodb";
import { z } from "zod";

const createCategorySchema = z.object({
  name: z.string().min(1),
  slug: z.string().min(1),
  description: z.string().optional(),
  parentId: z.string().optional(),
  isPillar: z.boolean().optional(),
});

export async function GET(req: NextRequest) {
  try {
    let workspaceId = req.nextUrl.searchParams.get("workspaceId");

    if (!workspaceId) {
      const { workspaceId: authWorkspaceId } = await getAuthWorkspace(req).catch(() => ({ workspaceId: null }));
      if (authWorkspaceId) {
        workspaceId = authWorkspaceId;
      }
    }

    if (!workspaceId) {
      return NextResponse.json({ error: "Workspace ID is required" }, { status: 400 });
    }

    const categories = await db.find("blog_categories", { workspaceId });
    return NextResponse.json({ categories });
  } catch (error: any) {
    console.error("[GET_BLOG_CATEGORIES]", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { workspaceId, error, status } = await getAuthWorkspace(req);
    if (error) return NextResponse.json({ error }, { status });

    const body = await req.json();
    const parsed = createCategorySchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid data", details: parsed.error }, { status: 400 });
    }

    const existing = await db.findOne("blog_categories", { workspaceId, slug: parsed.data.slug });
    if (existing) {
      return NextResponse.json({ error: "Slug must be unique within this workspace" }, { status: 409 });
    }

    const newCategoryData = {
      workspaceId,
      ...parsed.data,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const newCategoryId = await db.insertOne("blog_categories", newCategoryData);

    return NextResponse.json({ category: { ...newCategoryData, _id: newCategoryId } }, { status: 201 });
  } catch (error: any) {
    console.error("[POST_BLOG_CATEGORY]", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

