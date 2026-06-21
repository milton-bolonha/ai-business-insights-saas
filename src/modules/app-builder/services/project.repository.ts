import { auth } from '@clerk/nextjs/server';
import { ObjectId } from 'mongodb';
import { db } from '@/lib/db/mongodb';
import { AppBuilderProject } from '../types';

export const PROJECTS_COLLECTION = 'appBuilderProjects';
export const MESSAGES_COLLECTION = 'appBuilderMessages';

export async function requireOwnedProject(projectId: string) {
  const { userId } = await auth();
  if (!userId) {
    throw new Error('Unauthorized');
  }

  const project = await db.findOne<AppBuilderProject>(PROJECTS_COLLECTION, {
    _id: new ObjectId(projectId),
    userId,
  });

  if (!project) {
    throw new Error('Not found');
  }

  return project;
}

export async function createProject(
  userId: string, 
  workspaceId: string, 
  name: string, 
  description?: string, 
  businessRules?: string, 
  designGuidelines?: string
) {
  const projectId = new ObjectId();
  const sandboxName = `app-${projectId.toString()}`;

  const newProject: Omit<AppBuilderProject, '_id'> = {
    userId,
    workspaceId,
    name,
    description,
    businessRules,
    designGuidelines,
    sandboxName,
    status: 'creating',
    framework: 'next',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  await db.insertOne(PROJECTS_COLLECTION, { _id: projectId, ...newProject });

  // Auto-create indexes (idempotent, won't duplicate)
  try {
    const { getDb } = await import('@/lib/db/mongodb');
    const dbInstance = await getDb();
    await dbInstance.collection(PROJECTS_COLLECTION).createIndex({ userId: 1, workspaceId: 1, updatedAt: -1 });
    await dbInstance.collection(MESSAGES_COLLECTION).createIndex({ projectId: 1, createdAt: 1 });
  } catch(e) {
    console.error("Failed to ensure indexes", e);
  }

  return { _id: projectId.toString(), ...newProject };
}

export async function updateProjectStatus(projectId: string | ObjectId, status: AppBuilderProject['status']) {
  await db.updateOne(PROJECTS_COLLECTION, 
    { _id: new ObjectId(projectId) },
    { $set: { status, updatedAt: new Date() } }
  );
}

export async function updateProjectSettings(
  projectId: string, 
  settings: { description?: string, businessRules?: string, designGuidelines?: string, name?: string }
) {
  await db.updateOne(PROJECTS_COLLECTION,
    { _id: new ObjectId(projectId) },
    { $set: { ...settings, updatedAt: new Date() } }
  );
}

export async function getProjectsByWorkspace(userId: string, workspaceId: string) {
  return await db.find<AppBuilderProject>(PROJECTS_COLLECTION, { userId, workspaceId }, { sort: { updatedAt: -1 } });
}

export async function deleteProject(projectId: string, userId: string) {
  await db.deleteOne(PROJECTS_COLLECTION, { _id: new ObjectId(projectId), userId });
}
