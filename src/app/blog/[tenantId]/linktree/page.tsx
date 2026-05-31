import { notFound } from "next/navigation";
import { db } from "@/lib/db/mongodb";
import { resolveWorkspaceId } from "../../utils/resolveWorkspace";

export const revalidate = 60; // ISR cache 60s

export default async function LinkTreePage({
  params,
}: {
  params: Promise<{ tenantId: string }>;
}) {
  const { tenantId } = await params;
  const resolvedWorkspaceId = await resolveWorkspaceId(tenantId);
  const settings = await db.findOne("blog_settings", { workspaceId: resolvedWorkspaceId });

  // If no link tree items exist, we can show a placeholder or 404
  const links = settings?.navigation?.linkTree || [];

  const brandColor = settings?.theme?.colors?.mainBrandColor || "#b82632";
  const bgColor = settings?.theme?.colors?.backgroundColor || "#f9fafb";
  const brandName = settings?.business?.brandName || "Our Links";
  const brandDesc = settings?.business?.brandDescription || "Connect with us across all platforms.";

  return (
    <div 
      className="min-h-screen flex flex-col items-center py-16 px-4"
      style={{ backgroundColor: bgColor }}
    >
      <div className="w-full max-w-lg flex flex-col items-center">
        
        {/* Profile Image / Logo */}
        {settings?.logos?.mainLogo ? (
          <img 
            src={settings?.logos?.mainLogo} 
            alt={brandName} 
            className="w-24 h-24 rounded-full object-cover shadow-lg border-4 border-white mb-6"
          />
        ) : (
          <div 
            className="w-24 h-24 rounded-full shadow-lg border-4 border-white mb-6 flex items-center justify-center text-3xl font-bold text-white"
            style={{ backgroundColor: brandColor }}
          >
            {brandName.charAt(0)}
          </div>
        )}

        {/* Brand Info */}
        <h1 className="text-2xl font-bold text-gray-900 mb-2 text-center">{brandName}</h1>
        <p className="text-gray-600 text-center mb-8 max-w-sm">{brandDesc}</p>

        {/* Links */}
        <div className="w-full flex flex-col gap-4">
          {links.length > 0 ? (
            links.map((link: any, i: number) => (
              <a
                key={i}
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full bg-white text-gray-900 font-semibold text-center py-4 px-6 rounded-xl shadow-sm hover:shadow-md transition-all border border-gray-100 hover:scale-[1.02]"
              >
                {link.label}
              </a>
            ))
          ) : (
            <div className="text-center text-gray-500 bg-white p-6 rounded-xl border border-dashed border-gray-200">
              No links configured yet.
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="mt-12 text-sm text-gray-400 font-medium tracking-wide">
          Powered by I/O Platform
        </div>
      </div>
    </div>
  );
}
