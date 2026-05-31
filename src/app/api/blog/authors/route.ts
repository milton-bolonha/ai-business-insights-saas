import { NextRequest, NextResponse } from "next/server";
import { getAuthWorkspace } from "@/lib/auth/get-auth";
import { db } from "@/lib/db/mongodb";

export async function GET(req: NextRequest) {
  try {
    const { workspaceId, error, status } = await getAuthWorkspace(req);
    if (error || !workspaceId) return NextResponse.json({ error }, { status: status || 401 });

    const authors = await db.find("blog_authors", { workspaceId });
    return NextResponse.json({ authors });
  } catch (error: any) {
    console.error("[BlogAuthors_GET]", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { workspaceId, error, status } = await getAuthWorkspace(req);
    if (error || !workspaceId) return NextResponse.json({ error }, { status: status || 401 });

    const body = await req.json();
    if (!body.name) return NextResponse.json({ error: "Name is required" }, { status: 400 });

    const newAuthorId = await db.insertOne("blog_authors", {
      workspaceId,
      name: body.name,
      email: body.email,
      role: body.role || "writer",
      createdAt: new Date(),
    });

    const newAuthor = await db.findOne("blog_authors", { _id: newAuthorId });
    return NextResponse.json({ author: newAuthor });
  } catch (error: any) {
    console.error("[BlogAuthors_POST]", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
