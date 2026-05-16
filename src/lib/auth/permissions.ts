import { UserDocument } from "../db/models/User";
import { AccessLevel } from "../db/models/WorkspaceMembership";

// Global Role Checks
export function isAdmin(user: UserDocument | { role?: string } | null): boolean {
  if (!user) return false;
  return user.role === 'admin';
}

export function isSpecial(user: UserDocument | { role?: string } | null): boolean {
  if (!user) return false;
  return user.role === 'special' || user.role === 'admin';
}

export function isUser(user: UserDocument | { role?: string } | null): boolean {
  if (!user) return false;
  return user.role === 'user' || isSpecial(user);
}

// Membership Access Levels Hierarchy
const ACCESS_LEVEL_HIERARCHY: Record<AccessLevel, number> = {
  viewer: 1,
  member: 2,
  manager: 3,
  owner: 4,
};

export function hasWorkspaceAccess(
  userAccessLevel: AccessLevel | null | undefined,
  requiredLevel: AccessLevel
): boolean {
  if (!userAccessLevel) return false;
  
  const userLevelValue = ACCESS_LEVEL_HIERARCHY[userAccessLevel];
  const requiredLevelValue = ACCESS_LEVEL_HIERARCHY[requiredLevel];
  
  return userLevelValue >= requiredLevelValue;
}

// Specific Permission Checks (Matrix)

// Admin level permissions
export const canManagePlatform = isAdmin;
export const canManageUsers = isAdmin;

// Workspace specific permissions based on access level
export function canManageTasks(accessLevel?: AccessLevel): boolean {
  if (!accessLevel) return false;
  return hasWorkspaceAccess(accessLevel, 'manager');
}

export function canManageSchedule(accessLevel?: AccessLevel): boolean {
  if (!accessLevel) return false;
  return hasWorkspaceAccess(accessLevel, 'manager');
}

export function canManageContent(accessLevel?: AccessLevel): boolean {
  if (!accessLevel) return false;
  return hasWorkspaceAccess(accessLevel, 'manager');
}

export function canEditSection(accessLevel?: AccessLevel): boolean {
  if (!accessLevel) return false;
  return hasWorkspaceAccess(accessLevel, 'owner');
}

export function canManageMemberships(accessLevel?: AccessLevel): boolean {
  if (!accessLevel) return false;
  return hasWorkspaceAccess(accessLevel, 'owner');
}

export function canParticipate(accessLevel?: AccessLevel): boolean {
  if (!accessLevel) return false;
  return hasWorkspaceAccess(accessLevel, 'member');
}

export function canViewContent(accessLevel?: AccessLevel): boolean {
  if (!accessLevel) return false;
  return hasWorkspaceAccess(accessLevel, 'viewer');
}
