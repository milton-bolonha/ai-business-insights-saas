import { notFound } from "next/navigation";
import { db } from "@/lib/db/mongodb";
import { resolveWorkspaceId } from "../../../utils/resolveWorkspace";
import { BlogHeader } from "../../../components/BlogHeader";
import { BlogFooter } from "../../../components/BlogFooter";

export const revalidate = 60; // ISR cache 60s

export default async function StaticPage({
  params,
}: {
  params: Promise<{ tenantId: string; slug: string }>;
}) {
  const { tenantId, slug } = await params;
  const resolvedWorkspaceId = await resolveWorkspaceId(tenantId);
  
  const [page, settings] = await Promise.all([
    db.findOne("blog_pages", { workspaceId: resolvedWorkspaceId, slug: slug, status: "published" }),
    db.findOne("blog_settings", { workspaceId: resolvedWorkspaceId })
  ]);

  if (!page) {
    notFound();
  }

  // Serialize complex MongoDB types to plain serializable JSON structures
  const serializedSettings = settings ? JSON.parse(JSON.stringify(settings)) : null;
  const serializedPage = JSON.parse(JSON.stringify(page));

  // Use Theme settings
  const brandColor = serializedSettings?.theme?.colors?.mainBrandColor || "#8b5cf6";
  const bgColor = serializedSettings?.theme?.colors?.backgroundColor || "#ffffff";
  const maxWidth = serializedSettings?.theme?.page?.maxWidth || "1100px";
  const headerPadding = serializedSettings?.theme?.page?.headerPadding || "20px";

  return (
    <div style={{ backgroundColor: bgColor }} className="min-h-screen text-gray-900 font-sans flex flex-col">
      <BlogHeader settings={serializedSettings} tenantId={tenantId} />

      {/* Main Content */}
      <main 
        className="mx-auto bg-white rounded-3xl border border-gray-100 my-12 flex-1 w-full max-w-4xl shadow-sm"
        style={{ paddingTop: headerPadding, paddingBottom: serializedSettings?.theme?.page?.bottomPadding || "40px" }}
      >
        <article className="px-6 sm:px-12 lg:px-20 py-12">
          <header className="mb-12 border-b border-gray-50 pb-8">
            <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight mb-4 text-gray-900 leading-tight">
              {serializedPage.title}
            </h1>
            {serializedPage.description && (
              <p className="text-lg sm:text-xl text-gray-400 leading-relaxed">
                {serializedPage.description}
              </p>
            )}
          </header>

          <div 
            className="prose prose-lg prose-violet max-w-none prose-headings:font-bold prose-a:text-violet-650"
            dangerouslySetInnerHTML={{ __html: serializedPage.content }}
          />
        </article>
      </main>

      <BlogFooter settings={serializedSettings} tenantId={tenantId} />
    </div>
  );
}
