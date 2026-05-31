import { db } from "@/lib/db/mongodb";

export async function resolveWorkspaceId(tenantId: string): Promise<string> {
  if (!tenantId) return "";
  
  // 1. Try to find the workspace by its custom blog slug
  const settings = await db.findOne("blog_settings", { 
    customBlogSlug: tenantId.trim().toLowerCase() 
  });
  
  if (settings && settings.workspaceId) {
    return settings.workspaceId;
  }
  
  // 2. Otherwise, treat it as the raw workspace ID
  return tenantId;
}
