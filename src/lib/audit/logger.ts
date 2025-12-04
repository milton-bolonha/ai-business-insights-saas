/**
 * Audit Logging System
 * 
 * Immutable audit logs for compliance and security investigation.
 * Tracks all critical user actions and system events.
 * 
 * Security: Audit logs are immutable and cannot be deleted by users.
 * 
 * Note: MongoDB is imported lazily to avoid Edge Runtime issues.
 */

import { getAuth } from "@/lib/auth/get-auth";

export type AuditEventType =
  | "login"
  | "logout"
  | "create_workspace"
  | "delete_workspace"
  | "create_dashboard"
  | "delete_dashboard"
  | "create_tile"
  | "delete_tile"
  | "update_tile"
  | "create_contact"
  | "delete_contact"
  | "update_contact"
  | "create_note"
  | "delete_note"
  | "update_note"
  | "reorder_tiles"
  | "regenerate_tile"
  | "chat_with_tile"
  | "change_permissions"
  | "payment_checkout"
  | "payment_success"
  | "payment_failed"
  | "api_error"
  | "security_violation"
  | "rate_limit_exceeded"
  | "data_migration";

export interface AuditLogEntry {
  id: string;
  eventType: AuditEventType;
  userId: string | null;
  userRole: "guest" | "member" | null;
  timestamp: Date;
  ipAddress?: string;
  userAgent?: string;
  resourceType?: "workspace" | "dashboard" | "tile" | "contact" | "note";
  resourceId?: string;
  action: string;
  details?: Record<string, unknown>;
  success: boolean;
  errorMessage?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Create audit log entry
 * 
 * Security: This function should never throw - audit logging failures
 * should not break the application.
 */
export async function auditLog(
  eventType: AuditEventType,
  action: string,
  options: {
    userId?: string | null;
    userRole?: "guest" | "member" | null;
    resourceType?: "workspace" | "dashboard" | "tile" | "contact" | "note";
    resourceId?: string;
    details?: Record<string, unknown>;
    success?: boolean;
    errorMessage?: string;
    metadata?: Record<string, unknown>;
    request?: Request;
  } = {}
): Promise<void> {
  try {
    // Get auth info if not provided
    let userId = options.userId;
    let userRole = options.userRole;

    if (userId === undefined) {
      try {
        const auth = await getAuth();
        userId = auth.userId;
        userRole = userId ? "member" : "guest";
      } catch (error) {
        // If auth fails, log as guest
        userId = null;
        userRole = "guest";
      }
    }

    // Extract request metadata if available
    let ipAddress: string | undefined;
    let userAgent: string | undefined;

    if (options.request) {
      const forwarded = options.request.headers.get("x-forwarded-for");
      ipAddress = forwarded?.split(",")[0]?.trim() || 
                  options.request.headers.get("x-real-ip") || 
                  undefined;
      userAgent = options.request.headers.get("user-agent") || undefined;
    }

    const logEntry: AuditLogEntry = {
      id: `audit_${Date.now()}_${Math.random().toString(36).substring(7)}`,
      eventType,
      userId: userId || null,
      userRole: userRole || null,
      timestamp: new Date(),
      ipAddress,
      userAgent,
      resourceType: options.resourceType,
      resourceId: options.resourceId,
      action,
      details: options.details,
      success: options.success !== false, // Default to true
      errorMessage: options.errorMessage,
      metadata: options.metadata,
    };

    // Save to MongoDB (immutable) - lazy import to avoid Edge Runtime issues
    try {
      const { db } = await import("@/lib/db/mongodb");
      await db.insertOne("audit_logs", {
        ...logEntry,
        createdAt: new Date(),
        // Add index fields for efficient querying
        _userId: userId || "guest",
        _eventType: eventType,
        _timestamp: logEntry.timestamp,
      });
    } catch (dbError) {
      // If MongoDB is not available (Edge Runtime), just log to console
      console.warn("[Audit] MongoDB not available (Edge Runtime?), logging to console only:", logEntry);
    }

    // Log to console in development
    if (process.env.NODE_ENV === "development") {
      console.log("[Audit]", JSON.stringify(logEntry, null, 2));
    }
  } catch (error) {
    // Never throw - audit logging failures should not break the app
    console.error("[Audit] Failed to log audit entry:", error);
  }
}

/**
 * Query audit logs
 * 
 * Security: Only admins should be able to query audit logs.
 * This function should be protected by authorization.
 */
export async function queryAuditLogs(
  filters: {
    userId?: string;
    eventType?: AuditEventType;
    resourceType?: string;
    resourceId?: string;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
  } = {}
): Promise<AuditLogEntry[]> {
  try {
    // Lazy import MongoDB to avoid Edge Runtime issues
    const { db } = await import("@/lib/db/mongodb");
    const query: Record<string, unknown> = {};

    if (filters.userId) {
      query._userId = filters.userId;
    }

    if (filters.eventType) {
      query._eventType = filters.eventType;
    }

    if (filters.resourceType) {
      query.resourceType = filters.resourceType;
    }

    if (filters.resourceId) {
      query.resourceId = filters.resourceId;
    }

    if (filters.startDate || filters.endDate) {
      const timestampQuery: { $gte?: Date; $lte?: Date } = {};
      if (filters.startDate) {
        timestampQuery.$gte = filters.startDate;
      }
      if (filters.endDate) {
        timestampQuery.$lte = filters.endDate;
      }
      query._timestamp = timestampQuery;
    }

    const limit = filters.limit || 100;

    const logs = await db.find("audit_logs", query, {
      sort: { _timestamp: -1 },
      limit,
    });

    return logs.map((log) => {
      // Remove internal index fields and cast to AuditLogEntry
      const { _userId, _eventType, _timestamp, ...entry } = log as Record<string, unknown> & {
        _userId?: string;
        _eventType?: string;
        _timestamp?: Date;
      };
      return entry as unknown as AuditLogEntry;
    });
  } catch (error) {
    console.error("[Audit] Failed to query audit logs:", error);
    return [];
  }
}

/**
 * Convenience functions for common audit events
 */
export const audit = {
  login: async (userId: string, request?: Request) => {
    await auditLog("login", "User logged in", {
      userId,
      userRole: "member",
      success: true,
      request,
    });
  },

  logout: async (userId: string, request?: Request) => {
    await auditLog("logout", "User logged out", {
      userId,
      userRole: "member",
      success: true,
      request,
    });
  },

  createWorkspace: async (
    workspaceId: string,
    userId: string | null,
    request?: Request
  ) => {
    await auditLog("create_workspace", "Workspace created", {
      userId,
      userRole: userId ? "member" : "guest",
      resourceType: "workspace",
      resourceId: workspaceId,
      success: true,
      request,
    });
  },

  deleteWorkspace: async (
    workspaceId: string,
    userId: string | null,
    request?: Request
  ) => {
    await auditLog("delete_workspace", "Workspace deleted", {
      userId,
      userRole: userId ? "member" : "guest",
      resourceType: "workspace",
      resourceId: workspaceId,
      success: true,
      request,
    });
  },

  createTile: async (
    tileId: string,
    dashboardId: string,
    userId: string | null,
    request?: Request
  ) => {
    await auditLog("create_tile", "Tile created", {
      userId,
      userRole: userId ? "member" : "guest",
      resourceType: "tile",
      resourceId: tileId,
      details: { dashboardId },
      success: true,
      request,
    });
  },

  deleteTile: async (
    tileId: string,
    dashboardId: string,
    userId: string | null,
    request?: Request
  ) => {
    await auditLog("delete_tile", "Tile deleted", {
      userId,
      userRole: userId ? "member" : "guest",
      resourceType: "tile",
      resourceId: tileId,
      details: { dashboardId },
      success: true,
      request,
    });
  },

  createContact: async (
    contactId: string,
    dashboardId: string,
    userId: string | null,
    request?: Request
  ) => {
    await auditLog("create_contact", "Contact created", {
      userId,
      userRole: userId ? "member" : "guest",
      resourceType: "contact",
      resourceId: contactId,
      details: { dashboardId },
      success: true,
      request,
    });
  },

  deleteContact: async (
    contactId: string,
    dashboardId: string,
    userId: string | null,
    request?: Request
  ) => {
    await auditLog("delete_contact", "Contact deleted", {
      userId,
      userRole: userId ? "member" : "guest",
      resourceType: "contact",
      resourceId: contactId,
      details: { dashboardId },
      success: true,
      request,
    });
  },

  createNote: async (
    noteId: string,
    dashboardId: string,
    userId: string | null,
    request?: Request
  ) => {
    await auditLog("create_note", "Note created", {
      userId,
      userRole: userId ? "member" : "guest",
      resourceType: "note",
      resourceId: noteId,
      details: { dashboardId },
      success: true,
      request,
    });
  },

  deleteNote: async (
    noteId: string,
    dashboardId: string,
    userId: string | null,
    request?: Request
  ) => {
    await auditLog("delete_note", "Note deleted", {
      userId,
      userRole: userId ? "member" : "guest",
      resourceType: "note",
      resourceId: noteId,
      details: { dashboardId },
      success: true,
      request,
    });
  },

  rateLimitExceeded: async (
    endpoint: string,
    clientId: string,
    request?: Request
  ) => {
    await auditLog("rate_limit_exceeded", "Rate limit exceeded", {
      userId: null,
      userRole: null,
      details: { endpoint, clientId },
      success: false,
      request,
    });
  },

  securityViolation: async (
    violation: string,
    details: Record<string, unknown>,
    request?: Request
  ) => {
    await auditLog("security_violation", `Security violation: ${violation}`, {
      userId: null,
      userRole: null,
      details,
      success: false,
      request,
    });
  },

  apiError: async (
    endpoint: string,
    error: Error,
    userId: string | null,
    request?: Request
  ) => {
    await auditLog("api_error", `API error: ${endpoint}`, {
      userId,
      userRole: userId ? "member" : "guest",
      details: {
        endpoint,
        errorMessage: error.message,
        errorName: error.name,
      },
      success: false,
      errorMessage: error.message,
      request,
    });
  },
};

