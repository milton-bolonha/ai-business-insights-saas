import { Metadata } from "next";
import { notFound } from "next/navigation";
import { db } from "@/lib/db/mongodb";
import { SEOEngine } from "@/modules/ai-blog/engines/seo-engine";
import { BlogSEO } from "../../components/BlogSEO";
import { SinglePostWrapper } from "../../components/SinglePostWrapper";
import { BlogHeader } from "../../components/BlogHeader";
import { BlogFooter } from "../../components/BlogFooter";
import { resolveWorkspaceId } from "../../utils/resolveWorkspace";

// ISR - revalidate every 60 seconds
export const revalidate = 60;

export async function generateMetadata({ params }: { params: Promise<{ tenantId: string, slug: string }> }): Promise<Metadata> {
  const { tenantId, slug } = await params;
  const resolvedWorkspaceId = await resolveWorkspaceId(tenantId);
  const post = await db.findOne("blog_posts", { workspaceId: resolvedWorkspaceId, slug });
  
  if (!post) return {};

  return {
    title: post.seo?.metaTitle || post.title,
    description: post.seo?.metaDescription || post.excerpt,
    openGraph: {
      title: post.seo?.ogTitle || post.title,
      description: post.seo?.ogDescription || post.excerpt,
      images: post.seo?.ogImage ? [post.seo.ogImage] : [],
    },
    alternates: {
      canonical: post.seo?.canonicalUrl,
    }
  };
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ tenantId: string; slug: string }>;
}) {
  const { tenantId, slug } = await params;
  const resolvedWorkspaceId = await resolveWorkspaceId(tenantId);
  
  const [post, settings] = await Promise.all([
    db.findOne("blog_posts", { workspaceId: resolvedWorkspaceId, slug: slug, status: "published" }),
    db.findOne("blog_settings", { workspaceId: resolvedWorkspaceId })
  ]);

  if (!post) {
    notFound();
  }

  // Fetch author
  let author = null;
  if (post.authorId) {
    author = await db.findOne("blog_authors", { _id: post.authorId });
  }

  // Fetch related posts (same tags/categories, excluding current post)
  const relatedPosts = await db.find("blog_posts", {
    workspaceId: resolvedWorkspaceId,
    _id: { $ne: post._id },
    status: "published",
    $or: [
      { categories: { $in: post.categories || [] } },
      { tags: { $in: post.tags || [] } }
    ]
  }, { limit: 4, sort: { publishedAt: -1 } }) || [];

  // Serialize complex MongoDB types to plain serializable JSON structures
  const serializedPost = JSON.parse(JSON.stringify(post));
  const serializedSettings = settings ? JSON.parse(JSON.stringify(settings)) : null;
  const serializedAuthor = author ? JSON.parse(JSON.stringify(author)) : null;
  const serializedRelatedPosts = JSON.parse(JSON.stringify(relatedPosts));

  return (
    <div className="min-h-screen flex flex-col bg-white text-gray-900 font-sans">
      <BlogHeader settings={serializedSettings} tenantId={tenantId} />

      <main className="flex-1 w-full bg-white">
        <BlogSEO 
          data={{
            title: serializedPost.seo?.metaTitle || serializedPost.title,
            description: serializedPost.seo?.metaDescription || serializedPost.excerpt || "",
            featuredImage: serializedPost.seo?.ogImage || serializedPost.featuredImage,
            authorName: serializedAuthor?.name,
            siteUrl: `https://${process.env.NEXT_PUBLIC_APP_URL || "localhost:3000"}/blog/${tenantId}`,
            articleUrl: `https://${process.env.NEXT_PUBLIC_APP_URL || "localhost:3000"}/blog/${tenantId}/${slug}`,
            datePublished: serializedPost.publishedAt,
            keywords: serializedPost.tags,
            themeColor: serializedSettings?.theme?.colors?.mainBrandColor,
            isArticle: true,
            adsAccount: serializedSettings?.integrations?.googleIntegration?.adsClientID,
            brandName: serializedSettings?.business?.brandName,
            favicon: serializedSettings?.logos?.favicon,
            markLogo: serializedSettings?.logos?.markLogo,
            customCSS: serializedSettings?.site?.customCSS,
            customHeaderScripts: serializedSettings?.site?.customHeaderScripts,
            googleAnalyticsID: serializedSettings?.integrations?.googleAnalyticsID,
            metaPixelID: serializedSettings?.integrations?.metaPixelID,
            categoryName: serializedPost.categories?.[0]
          }}
        />
        
        <SinglePostWrapper 
          post={serializedPost}
          author={serializedAuthor}
          settings={serializedSettings}
          relatedPosts={serializedRelatedPosts}
          tenantId={tenantId}
        />
      </main>

      <BlogFooter settings={serializedSettings} tenantId={tenantId} />
    </div>
  );
}
