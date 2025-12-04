import type { Document } from "mongodb";
import type { Contact } from "@/lib/types";

/**
 * Contact model for MongoDB
 * Maps to Contact but with MongoDB-specific fields
 */
export interface ContactDocument extends Document {
  _id?: string;
  userId: string; // Clerk user ID (required for security)
  workspaceId: string;
  dashboardId: string;
  name: string;
  jobTitle?: string;
  linkedinUrl?: string;
  email?: string;
  phone?: string;
  company?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Convert Contact to ContactDocument
 */
export function contactToDocument(
  contact: Contact,
  userId: string,
  workspaceId: string,
  dashboardId: string
): Omit<ContactDocument, "_id" | "createdAt" | "updatedAt"> {
  return {
    userId,
    workspaceId,
    dashboardId,
    name: contact.name,
    jobTitle: contact.jobTitle,
    linkedinUrl: contact.linkedinUrl,
    email: contact.email,
    phone: contact.phone,
    company: contact.company,
    notes: contact.notes,
  };
}

/**
 * Convert ContactDocument to Contact
 */
export function contactDocumentToContact(
  doc: ContactDocument
): Contact {
  return {
    id: doc._id?.toString() || doc.id || `contact_${Date.now()}`,
    name: doc.name,
    jobTitle: doc.jobTitle,
    linkedinUrl: doc.linkedinUrl,
    email: doc.email,
    phone: doc.phone,
    company: doc.company,
    notes: doc.notes,
    createdAt: doc.createdAt instanceof Date 
      ? doc.createdAt.toISOString() 
      : typeof doc.createdAt === 'string' 
        ? doc.createdAt 
        : new Date().toISOString(),
  };
}

