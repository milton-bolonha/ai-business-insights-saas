import type { Document, ObjectId } from "mongodb";

export type AccessLevel = 'owner' | 'manager' | 'member' | 'viewer';

export interface WorkspaceMembershipDocument extends Document {
  _id?: ObjectId | string;
  userId: string;
  workspaceId: string;
  accessLevel: AccessLevel;
  createdAt: Date;
  updatedAt: Date;
}

export interface WorkspaceMembershipSnapshot {
  id: string;
  userId: string;
  workspaceId: string;
  accessLevel: AccessLevel;
  createdAt: string;
  updatedAt: string;
}

export function membershipToDocument(
  membership: Omit<WorkspaceMembershipSnapshot, "id" | "createdAt" | "updatedAt">
): Omit<WorkspaceMembershipDocument, "_id" | "createdAt" | "updatedAt"> {
  return {
    userId: membership.userId,
    workspaceId: membership.workspaceId,
    accessLevel: membership.accessLevel,
  };
}

export function membershipDocumentToSnapshot(
  doc: WorkspaceMembershipDocument
): WorkspaceMembershipSnapshot {
  return {
    id: doc._id?.toString() || "",
    userId: doc.userId,
    workspaceId: doc.workspaceId,
    accessLevel: doc.accessLevel,
    createdAt: doc.createdAt instanceof Date 
      ? doc.createdAt.toISOString() 
      : typeof doc.createdAt === 'string' 
        ? doc.createdAt 
        : new Date().toISOString(),
    updatedAt: doc.updatedAt instanceof Date 
      ? doc.updatedAt.toISOString() 
      : typeof doc.updatedAt === 'string' 
        ? doc.updatedAt 
        : new Date().toISOString(),
  };
}
