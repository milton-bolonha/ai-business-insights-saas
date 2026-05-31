import { Metadata } from "next";
import { db } from "@/lib/db/mongodb";
import { resolveWorkspaceId } from "../utils/resolveWorkspace";
import { BlogHeader } from "../components/BlogHeader";
import { BlogFooter } from "../components/BlogFooter";
import { BlogSEO } from "../components/BlogSEO";
import { BlogSearchAutocomplete } from "../components/BlogSearchAutocomplete";
import { Calendar, User, ArrowRight, MessageSquare } from "lucide-react";

// Revalidate every 60 seconds (ISR)
export const revalidate = 60;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ tenantId: string }>;
}): Promise<Metadata> {
  const { tenantId } = await params;
  const resolvedWorkspaceId = await resolveWorkspaceId(tenantId);
  const settings = await db.findOne("blog_settings", {
    workspaceId: resolvedWorkspaceId,
  });

  return {
    title: settings?.business?.brandName || "I/O - AI Powered Blog",
    description:
      settings?.business?.brandDescription ||
      "Enterprise grade AI SEO Publishing Platform",
  };
}

export default async function BlogIndexPage({
  params,
  searchParams,
}: {
  params: Promise<{ tenantId: string }>;
  searchParams: Promise<{ category?: string }>;
}) {
  const { tenantId } = await params;
  const { category } = await searchParams;
  const resolvedWorkspaceId = await resolveWorkspaceId(tenantId);

  const postsQuery: any = {
    workspaceId: resolvedWorkspaceId,
    status: "published",
  };
  if (category) {
    postsQuery.categories = category;
  }

  const [posts, settings] = await Promise.all([
    db.find("blog_posts", postsQuery, {
      sort: { publishedAt: -1 },
      limit: 20,
    }),
    db.findOne("blog_settings", { workspaceId: resolvedWorkspaceId }),
  ]);

  // Serialize complex MongoDB types to plain serializable JSON structures
  const serializedSettings = settings
    ? JSON.parse(JSON.stringify(settings))
    : null;
  const serializedPosts = JSON.parse(JSON.stringify(posts));

  const brandName =
    serializedSettings?.business?.brandName || "The AI Publisher";
  const brandDesc =
    serializedSettings?.business?.brandDescription ||
    "Intelligent insights powered by Next-Gen SEO Engines.";
  const brandColor =
    serializedSettings?.theme?.colors?.mainBrandColor || "#8b5cf6";
  const bgColor =
    serializedSettings?.theme?.colors?.backgroundColor || "#ffffff";

  // Hero custom configurations
  const showHero = serializedSettings?.site?.showHero !== false;
  const heroTitle = serializedSettings?.site?.heroTitle || brandName;
  const heroDescription =
    serializedSettings?.site?.heroDescription || brandDesc;

  // Filter featured vs standard posts
  const featuredPost =
    serializedPosts.find((p: any) => p.isFeatured) || serializedPosts[0];
  const standardPosts = featuredPost
    ? serializedPosts.filter(
        (p: any) => p._id.toString() !== featuredPost._id.toString(),
      )
    : serializedPosts;

  if (!posts || posts.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            No posts found
          </h1>
          <p className="text-gray-600">
            This blog hasn't published any content yet.
          </p>
          {category && (
            <a
              href={`/blog/${tenantId}`}
              className="mt-4 inline-block text-sm font-semibold text-violet-650 hover:underline"
            >
              Limpar Filtro de Categorias
            </a>
          )}
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        backgroundColor: bgColor,
        // Define dynamic brand color CSS variable for Tailwind consumption
        ["--brand-color" as any]: brandColor,
      }}
      className="min-h-screen text-gray-900 font-sans flex flex-col"
    >
      <BlogSEO
        data={{
          title: serializedSettings?.business?.brandName || "Meu Blog AI",
          description:
            serializedSettings?.business?.brandDescription ||
            "Intelligent insights powered by Next-Gen SEO Engines.",
          featuredImage:
            serializedSettings?.logos?.cardLogo ||
            serializedSettings?.logos?.mainLogo,
          siteUrl: `https://${process.env.NEXT_PUBLIC_APP_URL || "localhost:3000"}/blog/${tenantId}`,
          themeColor: brandColor,
          isArticle: false,
          adsAccount:
            serializedSettings?.integrations?.googleIntegration?.adsClientID,
          brandName: brandName,
          favicon: serializedSettings?.logos?.favicon,
          markLogo: serializedSettings?.logos?.markLogo,
          customCSS: serializedSettings?.site?.customCSS,
          customHeaderScripts: serializedSettings?.site?.customHeaderScripts,
          googleAnalyticsID:
            serializedSettings?.integrations?.googleAnalyticsID,
          metaPixelID: serializedSettings?.integrations?.metaPixelID,
          sameAsSocials: [
            serializedSettings?.socials?.facebook,
            serializedSettings?.socials?.instagram,
            serializedSettings?.socials?.linkedin,
            serializedSettings?.socials?.twitter,
          ].filter(Boolean),
        }}
      />

      <BlogHeader settings={serializedSettings} tenantId={tenantId} />

      {/* Hero Header */}
      {showHero && (
        <section
          className="text-gray-900 py-20 px-4 relative border-b border-gray-150 bg-white"
          style={{
            background: `linear-gradient(135deg, ${brandColor}0d 0%, ${brandColor}18 50%, #ffffff 100%)`,
          }}
        >
          <div
            className="absolute inset-0 opacity-20"
            style={{
              backgroundImage: `radial-gradient(circle, ${brandColor} 1.2px, transparent 1.2px)`,
              backgroundSize: "20px 20px",
            }}
          ></div>
          <div className="max-w-6xl mx-auto text-center relative z-10 flex flex-col items-center">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight max-w-3xl leading-tight">
              {heroTitle}
            </h1>
            <p className="text-lg sm:text-xl text-gray-500 max-w-2xl mt-4 leading-relaxed font-medium">
              {heroDescription}
            </p>

            {/* Dynamic Interactive Autocomplete Search */}
            <BlogSearchAutocomplete
              posts={serializedPosts}
              tenantId={tenantId}
              brandColor={brandColor}
            />
          </div>
        </section>
      )}

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 flex-1 w-full">
        {/* Featured Post Card */}
        {featuredPost && (
          <div className="mb-16">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-6">
              Artigo em Destaque
            </h3>
            <article className="grid grid-cols-1 lg:grid-cols-12 gap-8 bg-white border border-gray-100 rounded-3xl overflow-hidden shadow-sm hover:shadow-xl transition-all group duration-300">
              <div className="lg:col-span-7 aspect-16/10 lg:aspect-auto overflow-hidden relative">
                {featuredPost.featuredImage ? (
                  <img
                    src={featuredPost.featuredImage}
                    alt={featuredPost.title}
                    className="w-full h-full object-cover group-hover:scale-103 transition-transform duration-500"
                  />
                ) : (
                  <div className="w-full h-full bg-gray-100 flex items-center justify-center text-gray-400">
                    No image available
                  </div>
                )}
                <div className="absolute inset-0 bg-linear-to-t from-black/60 to-transparent lg:hidden"></div>
              </div>
              <div className="lg:col-span-5 p-8 sm:p-10 flex flex-col justify-center">
                {featuredPost.categories?.[0] && (
                  <a
                    href={`/blog/${tenantId}?category=${encodeURIComponent(featuredPost.categories[0])}`}
                    className="text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full w-fit hover:opacity-85 transition-opacity"
                    style={{
                      color: brandColor,
                      backgroundColor: `${brandColor}15`,
                    }}
                  >
                    {featuredPost.categories[0]}
                  </a>
                )}
                <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 mt-4 leading-tight group-hover:text-[var(--brand-color)] transition-colors">
                  <a href={`/blog/${tenantId}/${featuredPost.slug}`}>
                    {featuredPost.title}
                  </a>
                </h2>
                <p className="text-sm sm:text-base text-gray-500 mt-4 leading-relaxed">
                  {featuredPost.excerpt}
                </p>
                <div className="flex items-center gap-6 text-xs font-medium text-gray-400 mt-6 pt-6 border-t border-gray-50">
                  <span className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5" />
                    {new Date(
                      featuredPost.publishedAt || featuredPost.createdAt,
                    ).toLocaleDateString()}
                  </span>
                  <a
                    href={`/blog/${tenantId}/${featuredPost.slug}`}
                    className="flex items-center gap-1 font-bold hover:translate-x-1 transition-transform ml-auto text-xs"
                    style={{ color: brandColor }}
                  >
                    Ler Artigo
                    <ArrowRight className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            </article>
          </div>
        )}

        {/* Standard Posts Grid */}
        {standardPosts.length > 0 && (
          <div>
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-6">
              Artigos Recentes
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {standardPosts.map((post: any) => (
                <article
                  key={post._id.toString()}
                  className="flex flex-col bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all group duration-300 h-full"
                >
                  <div className="aspect-video w-full overflow-hidden bg-gray-50">
                    {post.featuredImage ? (
                      <img
                        src={post.featuredImage}
                        alt={post.title}
                        className="w-full h-full object-cover group-hover:scale-103 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-300">
                        <User className="w-10 h-10" />
                      </div>
                    )}
                  </div>
                  <div className="p-6 flex flex-col flex-1">
                    {post.categories?.[0] && (
                      <a
                        href={`/blog/${tenantId}?category=${encodeURIComponent(post.categories[0])}`}
                        className="text-[10px] font-bold px-2 py-0.5 rounded border w-fit uppercase tracking-wider mb-3 hover:opacity-85 transition-opacity inline-block"
                        style={{
                          color: brandColor,
                          backgroundColor: `${brandColor}10`,
                          borderColor: `${brandColor}22`,
                        }}
                      >
                        {post.categories[0]}
                      </a>
                    )}
                    <h4 className="text-lg font-bold text-gray-900 leading-snug group-hover:text-[var(--brand-color)] transition-colors flex-1 mt-1">
                      <a href={`/blog/${tenantId}/${post.slug}`}>
                        {post.title}
                      </a>
                    </h4>
                    <p className="text-xs text-gray-400 mt-2 font-medium flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {new Date(
                        post.publishedAt || post.createdAt,
                      ).toLocaleDateString()}
                    </p>
                  </div>
                </article>
              ))}
            </div>
          </div>
        )}
      </main>

      <BlogFooter settings={serializedSettings} tenantId={tenantId} />
    </div>
  );
}
