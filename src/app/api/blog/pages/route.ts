import { NextRequest, NextResponse } from "next/server";
import { getAuth } from "@/lib/auth/get-auth";
import { db } from "@/lib/db/mongodb";
import { cookies } from "next/headers";

export async function GET(req: NextRequest) {
  try {
    const { userId } = await getAuth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const cookieStore = await cookies();
    const workspaceId = req.nextUrl.searchParams.get("workspaceId") || cookieStore.get("insightsWorkspaceSession")?.value;

    if (!workspaceId) {
      return NextResponse.json({ error: "No workspace session found" }, { status: 400 });
    }

    const pages = await db.find("blog_pages", { workspaceId }, { sort: { createdAt: -1 } });

    return NextResponse.json(pages);
  } catch (error: any) {
    console.error("[BlogPages_GET]", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { userId } = await getAuth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const cookieStore = await cookies();
    const workspaceId = req.nextUrl.searchParams.get("workspaceId") || cookieStore.get("insightsWorkspaceSession")?.value;

    if (!workspaceId) {
      return NextResponse.json({ error: "No workspace session found" }, { status: 400 });
    }

    const body = await req.json();
    const { title, slug, content, description, status, publishedAt } = body;

    if (!title || !slug || !content) {
      return NextResponse.json(
        { error: "Title, slug and content are required" },
        { status: 400 }
      );
    }

    // Ensure slug is unique per workspace
    const existing = await db.findOne("blog_pages", { workspaceId, slug });
    if (existing) {
      return NextResponse.json(
        { error: "A page with this slug already exists" },
        { status: 400 }
      );
    }

    const newPageData = {
      workspaceId,
      title,
      slug,
      content,
      description,
      status: status || "draft",
      publishedAt: status === "published" && !publishedAt ? new Date() : publishedAt,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const newPageId = await db.insertOne("blog_pages", newPageData);

    return NextResponse.json({ page: { ...newPageData, _id: newPageId } }, { status: 201 });
  } catch (error: any) {
    console.error("[BlogPages_POST]", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

