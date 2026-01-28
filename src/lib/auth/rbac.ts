import { UserRole } from '@prisma/client';

/**
 * Role hierarchy for permission checking
 * Higher number = more permissions
 */
const ROLE_HIERARCHY: Record<UserRole, number> = {
    GUEST: 0,
    INDIVIDUAL: 1,
    COMPANY_USER: 2,
    ADMIN: 10,
};

/**
 * Permission definitions for different actions
 */
export type Permission =
    | 'permit:create'
    | 'permit:read'
    | 'permit:read:own'
    | 'permit:update'
    | 'permit:update:own'
    | 'permit:delete'
    | 'permit:approve'
    | 'permit:reject'
    | 'project:create'
    | 'project:read'
    | 'project:read:own'
    | 'project:update'
    | 'project:delete'
    | 'company:create'
    | 'company:read'
    | 'company:update'
    | 'company:delete'
    | 'plant:create'
    | 'plant:read'
    | 'plant:update'
    | 'plant:delete'
    | 'weighment:create'
    | 'weighment:read'
    | 'weighment:update'
    | 'weighment:approve'
    | 'user:create'
    | 'user:read'
    | 'user:update'
    | 'user:delete'
    | 'audit:read';

/**
 * Role-permission mapping
 */
const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
    GUEST: [
        'permit:create',
        'permit:read:own',
    ],
    INDIVIDUAL: [
        'permit:create',
        'permit:read:own',
        'permit:update:own',
    ],
    COMPANY_USER: [
        'permit:create',
        'permit:read:own',
        'permit:update:own',
        'project:create',
        'project:read:own',
    ],
    ADMIN: [
        'permit:create',
        'permit:read',
        'permit:read:own',
        'permit:update',
        'permit:update:own',
        'permit:delete',
        'permit:approve',
        'permit:reject',
        'project:create',
        'project:read',
        'project:read:own',
        'project:update',
        'project:delete',
        'company:create',
        'company:read',
        'company:update',
        'company:delete',
        'plant:create',
        'plant:read',
        'plant:update',
        'plant:delete',
        'weighment:create',
        'weighment:read',
        'weighment:update',
        'weighment:approve',
        'user:create',
        'user:read',
        'user:update',
        'user:delete',
        'audit:read',
    ],
};

/**
 * Check if a role has a specific permission
 */
export function hasPermission(role: UserRole, permission: Permission): boolean {
    const permissions = ROLE_PERMISSIONS[role];
    return permissions.includes(permission);
}

/**
 * Check if a role has any of the specified permissions
 */
export function hasAnyPermission(role: UserRole, permissions: Permission[]): boolean {
    return permissions.some((permission) => hasPermission(role, permission));
}

/**
 * Check if a role has all of the specified permissions
 */
export function hasAllPermissions(role: UserRole, permissions: Permission[]): boolean {
    return permissions.every((permission) => hasPermission(role, permission));
}

/**
 * Check if roleA has higher or equal hierarchy than roleB
 */
export function isRoleAtLeast(roleA: UserRole, roleB: UserRole): boolean {
    return ROLE_HIERARCHY[roleA] >= ROLE_HIERARCHY[roleB];
}

/**
 * Check if a user is an admin
 */
export function isAdmin(role: UserRole): boolean {
    return role === 'ADMIN';
}

/**
 * Get all permissions for a role
 */
export function getRolePermissions(role: UserRole): Permission[] {
    return [...ROLE_PERMISSIONS[role]];
}

/**
 * Resource ownership check helper
 */
export interface ResourceOwnership {
    userId?: string;
    companyId?: string;
}

export interface UserContext {
    userId: string;
    role: UserRole;
    companyId?: string | null;
}

/**
 * Check if user can access a resource based on ownership
 */
export function canAccessResource(
    user: UserContext,
    resource: ResourceOwnership,
    requireOwnership: boolean = false
): boolean {
    // Admins can access everything
    if (isAdmin(user.role)) {
        return true;
    }

    // If ownership is required, check user/company match
    if (requireOwnership) {
        // Direct user ownership
        if (resource.userId && resource.userId === user.userId) {
            return true;
        }

        // Company-level ownership
        if (resource.companyId && user.companyId && resource.companyId === user.companyId) {
            return true;
        }

        return false;
    }

    return true;
}
