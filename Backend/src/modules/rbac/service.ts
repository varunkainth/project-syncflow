import { db } from "../../db/index";
import { roles, permissions, rolePermissions } from "../../db/schema";
import { eq } from "drizzle-orm";

export class RbacService {
    async createRole(name: string, description?: string) {
        const [role] = await db.insert(roles).values({ name, description }).returning();
        return role;
    }

    async createPermission(name: string, description?: string) {
        const [permission] = await db.insert(permissions).values({ name, description }).returning();
        return permission;
    }

    async assignPermissionToRole(roleId: number, permissionId: number) {
        await db.insert(rolePermissions).values({ roleId, permissionId });
    }

    async getRoles() {
        return await db.select().from(roles);
    }

    async getPermissions() {
        return await db.select().from(permissions);
    }
}
