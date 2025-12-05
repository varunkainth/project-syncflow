export const ROLE_HIERARCHY = {
    owner: {
        level: 4,
        name: 'Owner',
        canManage: ['admin', 'project_manager', 'member', 'contributor', 'viewer', 'guest'],
        canBeAssigned: true,
    },
    admin: {
        level: 3,
        name: 'Admin',
        canManage: ['project_manager', 'member', 'contributor', 'viewer', 'guest'],
        canBeAssigned: true,
    },
    project_manager: {
        level: 2,
        name: 'Project Manager',
        canManage: ['member', 'contributor', 'viewer', 'guest'],
        canBeAssigned: true,
    },
    member: {
        level: 1,
        name: 'Member',
        canManage: ['contributor', 'viewer', 'guest'],
        canBeAssigned: true,
    },
    contributor: {
        level: 0.5,
        name: 'Contributor',
        canManage: [],
        canBeAssigned: true,
    },
    viewer: {
        level: 0,
        name: 'Viewer',
        canManage: [],
        canBeAssigned: false, // Viewers cannot be assigned to tasks
    },
    guest: {
        level: -1,
        name: 'Guest',
        canManage: [],
        canBeAssigned: false, // Guests cannot be assigned to tasks
    },
} as const;

export type RoleName = keyof typeof ROLE_HIERARCHY;

/**
 * Check if a role can manage another role
 */
export function canManageRole(managerRole: string, targetRole: string): boolean {
    const manager = ROLE_HIERARCHY[managerRole as RoleName];
    if (!manager) return false;
    return manager.canManage.includes(targetRole);
}

/**
 * Check if a role has higher level than another
 */
export function hasHigherRole(role1: string, role2: string): boolean {
    const r1 = ROLE_HIERARCHY[role1 as RoleName];
    const r2 = ROLE_HIERARCHY[role2 as RoleName];
    if (!r1 || !r2) return false;
    return r1.level > r2.level;
}

/**
 * Check if a role can be assigned to tasks
 */
export function canBeAssignedToTasks(role: string): boolean {
    const r = ROLE_HIERARCHY[role as RoleName];
    return r?.canBeAssigned ?? false;
}

/**
 * Get roles that can be invited by a specific role
 */
export function getInvitableRoles(role: string): string[] {
    const r = ROLE_HIERARCHY[role as RoleName];
    if (!r) return [];
    return r.canManage;
}
