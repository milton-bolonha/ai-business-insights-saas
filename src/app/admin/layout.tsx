import { Metadata } from 'next';
import { cookies } from 'next/headers';
import { connect } from '@/lib/db/mongodb';
import { ObjectId } from 'mongodb';

export async function generateMetadata(): Promise<Metadata> {
  const cookieStore = await cookies();
  const workspaceId = cookieStore.get('insightsWorkspaceSession')?.value;
  
  let workspaceName = "Admin";
  
  if (workspaceId) {
    try {
      const client = await connect();
      const db = client.db('ai_business_insights');
      let query: any = { id: workspaceId };
      let objId = null;
      try {
          if (ObjectId.isValid(workspaceId)) {
             objId = new ObjectId(workspaceId);
          }
      } catch (err) {}

      if (objId) {
          query = { $or: [{ _id: objId }, { id: workspaceId }, { sessionId: workspaceId }] };
      } else {
          query = { $or: [{ id: workspaceId }, { sessionId: workspaceId }] };
      }
      const workspace = await db.collection('workspaces').findOne(query);
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
