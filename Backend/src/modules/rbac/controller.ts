import type{ Context } from "hono";
import { RbacService } from "./service";
import { createRoleSchema, createPermissionSchema, assignPermissionSchema } from "./schema";

const rbacService = new RbacService();

export const createRole = async (c: Context) => {
    const body = c.get("decryptedBody") || await c.req.json();
    const result = createRoleSchema.safeParse(body);
    if (!result.success) {
        return c.json({ error: result.error }, 400);
    }
    const role = await rbacService.createRole(result.data.name, result.data.description);
    return c.json({ role }, 201);
};

export const createPermission = async (c: Context) => {
    const body = c.get("decryptedBody") || await c.req.json();
    const result = createPermissionSchema.safeParse(body);
    if (!result.success) {
        return c.json({ error: result.error }, 400);
    }
    const permission = await rbacService.createPermission(result.data.name, result.data.description);
    return c.json({ permission }, 201);
};

export const assignPermission = async (c: Context) => {
    const body = c.get("decryptedBody") || await c.req.json();
    const result = assignPermissionSchema.safeParse(body);
    if (!result.success) {
        return c.json({ error: result.error }, 400);
    }
    await rbacService.assignPermissionToRole(result.data.roleId, result.data.permissionId);
    return c.json({ success: true });
};

export const getRoles = async (c: Context) => {
    const roles = await rbacService.getRoles();
    return c.json({ roles });
};
