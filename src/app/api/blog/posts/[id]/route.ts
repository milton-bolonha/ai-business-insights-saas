import { NextRequest, NextResponse } from "next/server";
import { getAuthWorkspace } from "@/lib/auth/get-auth";
import { db } from "@/lib/db/mongodb";
import { ObjectId } from "mongodb";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { workspaceId, error, status } = await getAuthWorkspace(req);
    if (error || !workspaceId) return NextResponse.json({ error }, { status: status || 401 });

    const { id } = await params;
    const post = await db.findOne("blog_posts", { _id: new ObjectId(id), workspaceId });

    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    return NextResponse.json(post);
  } catch (error: any) {
    console.error("[BlogPost_GET]", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { workspaceId, error, status } = await getAuthWorkspace(req);
    if (error || !workspaceId) return NextResponse.json({ error }, { status: status || 401 });

    const body = await req.json();
    const { title, slug, content, excerpt, status: postStatus, categoryId, tags, seo } = body;

    const { id } = await params;
    const existingPost = await db.findOne("blog_posts", { _id: new ObjectId(id), workspaceId });
    if (!existingPost) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    if (slug && slug !== existingPost.slug) {
      const slugExists = await db.findOne("blog_posts", { workspaceId, slug });
      if (slugExists) {
        return NextResponse.json({ error: "A post with this slug already exists" }, { status: 400 });
      }
    }

    const updateData: any = { updatedAt: new Date() };
    if (title !== undefined) updateData.title = title;
    if (slug !== undefined) updateData.slug = slug;
    if (content !== undefined) updateData.content = content;
    if (excerpt !== undefined) updateData.excerpt = excerpt;
    if (categoryId !== undefined) updateData.categoryId = categoryId;
    if (tags !== undefined) updateData.tags = tags;
    if (seo !== undefined) updateData.seo = seo;
    if (postStatus !== undefined) {
      updateData.status = postStatus;
      if (postStatus === "published" && existingPost.status !== "published" && !existingPost.publishedAt) {
        updateData.publishedAt = new Date();
      }
    }

    await db.updateOne("blog_posts", { _id: new ObjectId(id), workspaceId }, { $set: updateData });

    const updatedPost = await db.findOne("blog_posts", { _id: new ObjectId(id), workspaceId });
    return NextResponse.json({ post: updatedPost });
  } catch (error: any) {
    console.error("[BlogPost_PUT]", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { workspaceId, error, status } = await getAuthWorkspace(req);
    if (error || !workspaceId) return NextResponse.json({ error }, { status: status || 401 });

    const { id } = await params;
    const deleted = await db.deleteOne("blog_posts", { _id: new ObjectId(id), workspaceId });

    if (!deleted) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    return new NextResponse(null, { status: 204 });
  } catch (error: any) {
    console.error("[BlogPost_DELETE]", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

