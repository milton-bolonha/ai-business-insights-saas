import { NextRequest, NextResponse } from "next/server";
import { getAuthWorkspace } from "@/lib/auth/get-auth";
import { db } from "@/lib/db/mongodb";

export async function GET(req: NextRequest) {
  try {
    const { workspaceId, error, status } = await getAuthWorkspace(req);
    if (error || !workspaceId) return NextResponse.json({ error }, { status: status || 401 });

    const settings = await db.findOne("blog_settings", { workspaceId });

    if (!settings) {
      return NextResponse.json({
        workspaceId,
        title: "Meu Blog AI",
        description: "",
        language: "pt-BR",
      });
    }

    return NextResponse.json(settings);
  } catch (error: any) {
    console.error("[BlogSettings_GET]", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const { workspaceId, error, status } = await getAuthWorkspace(req);
    if (error || !workspaceId) return NextResponse.json({ error }, { status: status || 401 });

    const body = await req.json();
    
    // Remove _id from body if present to avoid updating immutable field in Mongo
    if (body._id) {
      delete body._id;
    }

    // Validate custom slug format and check uniqueness
    if (body.customBlogSlug) {
      const cleanSlug = body.customBlogSlug.trim().toLowerCase();
      
      if (!/^[a-z0-9-]+$/.test(cleanSlug)) {
        return NextResponse.json(
          { error: "O slug do blog deve conter apenas letras minúsculas, números e hifens." },
          { status: 400 }
        );
      }

      const duplicate = await db.findOne("blog_settings", {
        customBlogSlug: cleanSlug,
        workspaceId: { $ne: workspaceId }
      });

      if (duplicate) {
        return NextResponse.json(
          { error: "Este slug de blog já está em uso por outro usuário." },
          { status: 400 }
        );
      }

      body.customBlogSlug = cleanSlug;
    } else {
      body.customBlogSlug = "";
    }

    const existing = await db.findOne("blog_settings", { workspaceId });
    if (existing) {
      await db.updateOne("blog_settings", { workspaceId }, { $set: { ...body, updatedAt: new Date() } });
    } else {
      await db.insertOne("blog_settings", { workspaceId, ...body, createdAt: new Date(), updatedAt: new Date() });
      
      // Auto-seed default pages if they don't exist
      const hasPages = await db.findOne("blog_pages", { workspaceId });
      if (!hasPages) {
        await db.insertOne("blog_pages", {
          workspaceId,
          title: "Sobre Nós",
          slug: "about-us",
          description: "Conheça a nossa história.",
          content: "<h2>Nossa Missão</h2><p>Texto padrão gerado pelo sistema.</p>",
          status: "published",
          createdAt: new Date(),
          updatedAt: new Date()
        });
        await db.insertOne("blog_pages", {
          workspaceId,
          title: "Contato",
          slug: "contact",
          description: "Entre em contato conosco.",
          content: "<h2>Contato</h2><p>Email: contato@exemplo.com</p>",
          status: "published",
          createdAt: new Date(),
          updatedAt: new Date()
        });
      }
    }

    const updated = await db.findOne("blog_settings", { workspaceId });
    return NextResponse.json(updated);
  } catch (error: any) {
    console.error("[BlogSettings_PUT]", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

