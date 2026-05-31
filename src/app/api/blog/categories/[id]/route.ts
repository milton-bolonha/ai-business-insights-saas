import { NextRequest, NextResponse } from "next/server";
import { getAuthWorkspace } from "@/lib/auth/get-auth";
import { db } from "@/lib/db/mongodb";
import { ObjectId } from "mongodb";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { workspaceId, error, status } = await getAuthWorkspace(req);
    if (error || !workspaceId) return NextResponse.json({ error }, { status: status || 401 });

    const { id } = await params;
    const category = await db.findOne("blog_categories", { _id: new ObjectId(id), workspaceId });

    if (!category) {
      return NextResponse.json({ error: "Category not found" }, { status: 404 });
    }

    return NextResponse.json(category);
  } catch (error: any) {
    console.error("[BlogCategory_GET]", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { workspaceId, error, status } = await getAuthWorkspace(req);
    if (error || !workspaceId) return NextResponse.json({ error }, { status: status || 401 });

    const body = await req.json();
    const { name, slug, description, parentId, isPillar, translations } = body;

    const { id } = await params;
    const existing = await db.findOne("blog_categories", { _id: new ObjectId(id), workspaceId });
    if (!existing) {
      return NextResponse.json({ error: "Category not found" }, { status: 404 });
    }

    if (slug && slug !== existing.slug) {
      const slugExists = await db.findOne("blog_categories", { workspaceId, slug });
      if (slugExists) {
        return NextResponse.json({ error: "A category with this slug already exists" }, { status: 400 });
      }
    }

    const updateData: any = { updatedAt: new Date() };
    if (name !== undefined) updateData.name = name;
    if (slug !== undefined) updateData.slug = slug;
    if (description !== undefined) updateData.description = description;
    if (parentId !== undefined) updateData.parentId = parentId;
    if (isPillar !== undefined) updateData.isPillar = isPillar;
    if (translations !== undefined) updateData.translations = translations;

    await db.updateOne("blog_categories", { _id: new ObjectId(id), workspaceId }, { $set: updateData });

    const updated = await db.findOne("blog_categories", { _id: new ObjectId(id), workspaceId });
    return NextResponse.json({ category: updated });
  } catch (error: any) {
    console.error("[BlogCategory_PUT]", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { workspaceId, error, status } = await getAuthWorkspace(req);
    if (error || !workspaceId) return NextResponse.json({ error }, { status: status || 401 });

    const { id } = await params;
    const deleted = await db.deleteOne("blog_categories", { _id: new ObjectId(id), workspaceId });

    if (!deleted) {
      return NextResponse.json({ error: "Category not found" }, { status: 404 });
    }

    return new NextResponse(null, { status: 204 });
  } catch (error: any) {
    console.error("[BlogCategory_DELETE]", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
