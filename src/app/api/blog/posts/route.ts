import { NextRequest, NextResponse } from "next/server";
import { getAuth } from "@/lib/auth/get-auth";
import { db } from "@/lib/db/mongodb";
import { cookies } from "next/headers";
import { z } from "zod";

const createPostSchema = z.object({
  title: z.string().min(1),
  slug: z.string().min(1),
  content: z.string(),
  excerpt: z.string().optional(),
  status: z.enum(["draft", "scheduled", "published", "archived"]).default("draft"),
  categoryId: z.string().optional(),
  tags: z.array(z.string()).optional(),
  seo: z.object({
    metaTitle: z.string().optional(),
    metaDescription: z.string().optional(),
    focusKeywords: z.array(z.string()).optional(),
  }).optional(),
});

export async function GET(req: NextRequest) {
  try {
    const { userId } = await getAuth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const cookieStore = await cookies();
    const workspaceId = req.nextUrl.searchParams.get("workspaceId") || cookieStore.get("insightsWorkspaceSession")?.value;
    
    if (!workspaceId) {
      return NextResponse.json({ error: "No workspace session found" }, { status: 400 });
    }

    const searchParams = req.nextUrl.searchParams;
    const publishedOnly = searchParams.get("published") === "true";
    const categoryId = searchParams.get("categoryId");

    const query: any = { workspaceId };
    if (publishedOnly) query.status = "published";
    if (categoryId) query.categoryId = categoryId;

    const posts = await db.find("blog_posts", query, { sort: { createdAt: -1 }, projection: { embedding: 0 } });

    return NextResponse.json({ posts });
  } catch (error: any) {
    console.error("[GET_BLOG_POSTS]", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { userId } = await getAuth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const cookieStore = await cookies();
    const workspaceId = req.nextUrl.searchParams.get("workspaceId") || cookieStore.get("insightsWorkspaceSession")?.value;

    if (!workspaceId) {
      return NextResponse.json({ error: "No workspace session found" }, { status: 400 });
    }

    const body = await req.json();
    const parsed = createPostSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid data", details: parsed.error }, { status: 400 });
    }

    const existingPost = await db.findOne("blog_posts", { workspaceId, slug: parsed.data.slug });
    if (existingPost) {
      return NextResponse.json({ error: "Slug must be unique within this workspace" }, { status: 409 });
    }

    const newPostData = {
      workspaceId,
      ...parsed.data,
      publishedAt: parsed.data.status === "published" ? new Date() : undefined,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const newPostId = await db.insertOne("blog_posts", newPostData);

    return NextResponse.json({ post: { ...newPostData, _id: newPostId } }, { status: 201 });
  } catch (error: any) {
    console.error("[POST_BLOG_POST]", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

