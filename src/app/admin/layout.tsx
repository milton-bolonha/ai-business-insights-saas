import { Metadata } from 'next';
import { cookies } from 'next/headers';
import { clientPromise } from '@/lib/db/mongodb';
import { ObjectId } from 'mongodb';

export async function generateMetadata(): Promise<Metadata> {
  const cookieStore = await cookies();
  const workspaceId = cookieStore.get('insightsWorkspaceSession')?.value;
  
  let workspaceName = "Admin";
  
  if (workspaceId) {
    try {
      const client = await clientPromise;
      const db = client.db('ai_business_insights');
      const workspace = await db.collection('workspaces').findOne({ _id: new ObjectId(workspaceId) });
      if (workspace && workspace.name) {
        workspaceName = workspace.name;
      }
    } catch (e) {
      console.error("Failed to fetch workspace name for metadata:", e);
    }
  }

  return {
    title: `${workspaceName} - I/O App`,
    icons: {
      icon: "/images/favicon-16x16-admin.png",
      shortcut: "/images/favicon-16x16-admin.png",
    }
  };
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
