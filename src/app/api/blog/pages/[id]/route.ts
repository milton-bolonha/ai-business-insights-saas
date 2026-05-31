import { NextRequest, NextResponse } from "next/server";
import { getAuthWorkspace } from "@/lib/auth/get-auth";
import { db } from "@/lib/db/mongodb";
import { ObjectId } from "mongodb";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { workspaceId, error, status } = await getAuthWorkspace(req);
    if (error || !workspaceId) return NextResponse.json({ error }, { status: status || 401 });

    const { id } = await params;
    const page = await db.findOne("blog_pages", { _id: new ObjectId(id), workspaceId });

    if (!page) {
      return NextResponse.json({ error: "Page not found" }, { status: 404 });
    }

    return NextResponse.json(page);
  } catch (error: any) {
    console.error("[BlogPage_GET]", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { workspaceId, error, status } = await getAuthWorkspace(req);
    if (error || !workspaceId) return NextResponse.json({ error }, { status: status || 401 });

    const body = await req.json();
    const { title, slug, content, description, status: pageStatus, publishedAt } = body;

    const { id } = await params;
    const existingPage = await db.findOne("blog_pages", { _id: new ObjectId(id), workspaceId });

    if (!existingPage) {
      return NextResponse.json({ error: "Page not found" }, { status: 404 });
    }

    if (slug && slug !== existingPage.slug) {
      const slugExists = await db.findOne("blog_pages", { workspaceId, slug });
      if (slugExists) {
        return NextResponse.json({ error: "A page with this slug already exists" }, { status: 400 });
      }
    }

    const updateData: any = { updatedAt: new Date() };
    if (title !== undefined) updateData.title = title;
    if (slug !== undefined) updateData.slug = slug;
    if (content !== undefined) updateData.content = content;
    if (description !== undefined) updateData.description = description;
    if (pageStatus !== undefined) {
      updateData.status = pageStatus;
      if (pageStatus === "published" && existingPage.status !== "published" && !existingPage.publishedAt) {
        updateData.publishedAt = publishedAt || new Date();
      }
    }

    await db.updateOne("blog_pages", { _id: new ObjectId(id), workspaceId }, { $set: updateData });

    const updatedPage = await db.findOne("blog_pages", { _id: new ObjectId(id), workspaceId });
    return NextResponse.json(updatedPage);
  } catch (error: any) {
    console.error("[BlogPage_PUT]", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { workspaceId, error, status } = await getAuthWorkspace(req);
    if (error || !workspaceId) return NextResponse.json({ error }, { status: status || 401 });

    const { id } = await params;
    const deleted = await db.deleteOne("blog_pages", { _id: new ObjectId(id), workspaceId });

    if (!deleted) {
      return NextResponse.json({ error: "Page not found" }, { status: 404 });
    }

    return new NextResponse(null, { status: 204 });
  } catch (error: any) {
    console.error("[BlogPage_DELETE]", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

