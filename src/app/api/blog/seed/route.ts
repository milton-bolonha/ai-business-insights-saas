import { NextRequest, NextResponse } from "next/server";
import { getAuthWorkspace } from "@/lib/auth/get-auth";
import { db } from "@/lib/db/mongodb";

export async function POST(req: NextRequest) {
  try {
    if (process.env.NODE_ENV !== "development") {
      return NextResponse.json({ error: "Only available in development mode" }, { status: 403 });
    }

    const { workspaceId, error, status } = await getAuthWorkspace(req);
    if (error || !workspaceId) return NextResponse.json({ error }, { status: status || 401 });

    // Seed Data
    const mockPosts = [
      {
        workspaceId,
        title: "The Future of AI in SaaS Platforms",
        slug: "future-of-ai-in-saas",
        excerpt: "Exploring how artificial intelligence is reshaping software as a service business models.",
        content: "<h2>Introduction to AI in SaaS</h2><p>Artificial intelligence is no longer just a buzzword. It is the foundational layer of modern software platforms, enabling predictive analytics, autonomous workflows, and hyper-personalized user experiences.</p><h3>Why it Matters</h3><ul><li>Efficiency gains</li><li>Cost reduction</li><li>Enhanced user satisfaction</li></ul>",
        status: "published",
        publishedAt: new Date(Date.now() - 86400000 * 2), // 2 days ago
        createdAt: new Date(),
        updatedAt: new Date(),
        seo: {
          score: 92,
          metaTitle: "AI in SaaS: The Ultimate Guide",
          metaDescription: "Learn how AI transforms SaaS platforms in this comprehensive guide."
        },
        isFeatured: true
      },
      {
        workspaceId,
        title: "5 Strategies for Sustainable Growth",
        slug: "5-strategies-sustainable-growth",
        excerpt: "Learn the core principles of building a business that lasts through economic cycles.",
        content: "<h2>Building for the Long Term</h2><p>Growth hacking is great for early traction, but sustainable growth requires a different mindset. Focus on retention, customer success, and scalable infrastructure.</p>",
        status: "published",
        publishedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
        seo: {
          score: 85
        }
      }
    ];

    const mockPages = [
      {
        workspaceId,
        title: "About Us",
        slug: "about",
        description: "Learn more about our mission and team.",
        content: "<h2>Our Mission</h2><p>We are dedicated to building the best AI-powered tools for modern businesses.</p>",
        status: "published",
        publishedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        workspaceId,
        title: "Contact",
        slug: "contact",
        description: "Get in touch with our team.",
        content: "<h2>Contact Us</h2><p>Email us at support@example.com or visit our headquarters.</p>",
        status: "published",
        publishedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      }
    ];

    await db.deleteMany("blog_posts", { workspaceId });
    await db.deleteMany("blog_pages", { workspaceId });

    for (const post of mockPosts) await db.insertOne("blog_posts", post);
    for (const page of mockPages) await db.insertOne("blog_pages", page);

    return NextResponse.json({ success: true, message: "Mock data seeded successfully" });
  } catch (error: any) {
    console.error("[BlogSeed_POST]", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
