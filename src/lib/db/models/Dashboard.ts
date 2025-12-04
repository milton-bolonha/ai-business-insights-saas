import type { Document } from "mongodb";
import type { Dashboard } from "@/lib/types/dashboard";

/**
 * Dashboard model for MongoDB
 * Maps to Dashboard but with MongoDB-specific fields
 */
export interface DashboardDocument extends Document {
  _id?: string;
  id?: string;
  userId: string;
  workspaceId: string;
  name: string;
  bgColor?: string;
  templateId?: string;
  isActive?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Convert Dashboard to DashboardDocument
 */
export function dashboardToDocument(
  dashboard: Dashboard,
  userId: string,
  workspaceId: string
): Omit<DashboardDocument, "_id" | "createdAt" | "updatedAt"> {
  return {
    userId,
    workspaceId,
    name: dashboard.name,
    bgColor: dashboard.bgColor,
    templateId: dashboard.templateId,
  };
}

/**
 * Convert DashboardDocument to Dashboard
 */
export function dashboardDocumentToDashboard(
  doc: DashboardDocument
): Pick<Dashboard, "id" | "workspaceId" | "name" | "bgColor" | "templateId" | "createdAt" | "updatedAt"> {
  return {
    id: doc.id || doc._id?.toString() || `dashboard_${Date.now()}`,
    workspaceId: doc.workspaceId,
    name: doc.name,
    bgColor: doc.bgColor,
    templateId: doc.templateId,
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
