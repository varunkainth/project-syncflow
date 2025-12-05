import { db } from "../db";
import { roles, permissions, rolePermissions } from "../db/schema";
import { eq } from "drizzle-orm";

// Define all roles
const ROLES = [
    { name: 'owner', description: 'Full control over project including deletion and member management' },
    { name: 'admin', description: 'Can manage project settings and members (except owner)' },
    { name: 'project_manager', description: 'Can assign tasks and manage project workflows' },
    { name: 'member', description: 'Can create and manage own tasks' },
    { name: 'contributor', description: 'Can edit existing tasks but not create new ones' },
    { name: 'viewer', description: 'Read-only access to project (cannot be assigned tasks)' },
    { name: 'guest', description: 'Temporary read-only access with expiration' },
];

// Define all permissions
const PERMISSIONS = [
    // Project permissions
    { name: 'project:delete', description: 'Delete project' },
    { name: 'project:edit', description: 'Edit project settings' },
    { name: 'project:view', description: 'View project' },

    // Member permissions
    { name: 'member:invite', description: 'Invite members to project' },
    { name: 'member:remove', description: 'Remove members from project' },
    { name: 'member:role:edit', description: 'Change member roles' },
    { name: 'member:view', description: 'View project members' },

    // Task permissions
    { name: 'task:create', description: 'Create new tasks' },
    { name: 'task:edit:any', description: 'Edit any task' },
    { name: 'task:edit:own', description: 'Edit own tasks' },
    { name: 'task:delete:any', description: 'Delete any task' },
    { name: 'task:delete:own', description: 'Delete own tasks' },
    { name: 'task:assign', description: 'Assign tasks to members' },
    { name: 'task:view', description: 'View tasks' },
    { name: 'task:be_assigned', description: 'Can be assigned to tasks' },

    // Comment permissions
    { name: 'comment:create', description: 'Create comments' },
    { name: 'comment:edit:own', description: 'Edit own comments' },
    { name: 'comment:delete:own', description: 'Delete own comments' },
    { name: 'comment:view', description: 'View comments' },
];

// Define role-permission mappings
const ROLE_PERMISSION_MAP: Record<string, string[]> = {
    owner: [
        'project:delete', 'project:edit', 'project:view',
        'member:invite', 'member:remove', 'member:role:edit', 'member:view',
        'task:create', 'task:edit:any', 'task:edit:own', 'task:delete:any', 'task:delete:own', 'task:assign', 'task:view', 'task:be_assigned',
        'comment:create', 'comment:edit:own', 'comment:delete:own', 'comment:view',
    ],
    admin: [
        'project:edit', 'project:view',
        'member:invite', 'member:remove', 'member:role:edit', 'member:view',
        'task:create', 'task:edit:any', 'task:edit:own', 'task:delete:any', 'task:delete:own', 'task:assign', 'task:view', 'task:be_assigned',
        'comment:create', 'comment:edit:own', 'comment:delete:own', 'comment:view',
    ],
    project_manager: [
        'project:view',
        'member:invite', 'member:remove', 'member:role:edit', 'member:view',
        'task:create', 'task:edit:any', 'task:edit:own', 'task:delete:any', 'task:delete:own', 'task:assign', 'task:view', 'task:be_assigned',
        'comment:create', 'comment:edit:own', 'comment:delete:own', 'comment:view',
    ],
    member: [
        'project:view',
        'member:invite', 'member:view',
        'task:create', 'task:edit:own', 'task:delete:own', 'task:view', 'task:be_assigned',
        'comment:create', 'comment:edit:own', 'comment:delete:own', 'comment:view',
    ],
    contributor: [
        'project:view',
        'member:view',
        'task:edit:own', 'task:view', 'task:be_assigned',
        'comment:create', 'comment:edit:own', 'comment:delete:own', 'comment:view',
    ],
    viewer: [
        'project:view',
        'member:view',
        'task:view',
        'comment:view',
    ],
    guest: [
        'project:view',
        'member:view',
        'task:view',
        'comment:view',
    ],
};

export async function seedRolesAndPermissions() {
    console.log('🌱 Seeding roles and permissions...');

    try {
        // Insert roles
        console.log('Creating roles...');
        const insertedRoles: Record<string, number> = {};

        for (const role of ROLES) {
            const existing = await db.query.roles.findFirst({
                where: eq(roles.name, role.name),
            });

            if (existing) {
                insertedRoles[role.name] = existing.id;
                console.log(`  ✓ Role '${role.name}' already exists`);
            } else {
                const [newRole] = await db.insert(roles).values(role).returning();
                insertedRoles[role.name] = newRole.id;
                console.log(`  ✓ Created role '${role.name}'`);
            }
        }

        // Insert permissions
        console.log('Creating permissions...');
        const insertedPermissions: Record<string, number> = {};

        for (const permission of PERMISSIONS) {
            const existing = await db.query.permissions.findFirst({
                where: eq(permissions.name, permission.name),
            });

            if (existing) {
                insertedPermissions[permission.name] = existing.id;
                console.log(`  ✓ Permission '${permission.name}' already exists`);
            } else {
                const [newPermission] = await db.insert(permissions).values(permission).returning();
                insertedPermissions[permission.name] = newPermission.id;
                console.log(`  ✓ Created permission '${permission.name}'`);
            }
        }

        // Insert role-permission mappings
        console.log('Mapping roles to permissions...');
        for (const [roleName, permissionNames] of Object.entries(ROLE_PERMISSION_MAP)) {
            const roleId = insertedRoles[roleName];
            if (!roleId) continue;

            for (const permissionName of permissionNames) {
                const permissionId = insertedPermissions[permissionName];
                if (!permissionId) continue;

                // Check if mapping already exists
                const existing = await db.query.rolePermissions.findFirst({
                    where: (rp, { and, eq }) => and(
                        eq(rp.roleId, roleId),
                        eq(rp.permissionId, permissionId)
                    ),
                });

                if (!existing) {
                    await db.insert(rolePermissions).values({
                        roleId,
                        permissionId,
                    });
                }
            }
            console.log(`  ✓ Mapped permissions for '${roleName}'`);
        }

        console.log('✅ Roles and permissions seeded successfully!');
    } catch (error) {
        console.error('❌ Error seeding roles and permissions:', error);
        throw error;
    }
}

// Run seed if this file is executed directly
if (import.meta.main) {
    seedRolesAndPermissions()
        .then(() => process.exit(0))
        .catch(() => process.exit(1));
}
