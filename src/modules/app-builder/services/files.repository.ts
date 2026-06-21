import { ObjectId } from 'mongodb';
import { db } from '@/lib/db/mongodb';

export const FILES_COLLECTION = 'appBuilderFiles';

export interface ProjectFile {
  _id?: ObjectId;
  projectId: ObjectId;
  path: string;
  content: string;
  updatedAt: Date;
}

export async function saveProjectFile(projectId: string, path: string, content: string) {
  const pId = new ObjectId(projectId);
  
  await db.updateOne(
    FILES_COLLECTION,
    { projectId: pId, path },
    {
      $set: {
        projectId: pId,
        path,
        content,
        updatedAt: new Date()
      }
    },
    { upsert: true }
  );

  // Auto-create index
  try {
    const { getDb } = await import('@/lib/db/mongodb');
    const dbInstance = await getDb();
    await dbInstance.collection(FILES_COLLECTION).createIndex({ projectId: 1, path: 1 }, { unique: true });
  } catch(e) {}
}

export async function getProjectFiles(projectId: string): Promise<ProjectFile[]> {
  const pId = new ObjectId(projectId);
  return db.find<ProjectFile>(FILES_COLLECTION, { projectId: pId });
}
