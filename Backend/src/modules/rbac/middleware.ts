import type { Context, Next } from "hono";
import { db } from "../../db/index";
import { projectMembers, roles, permissions, rolePermissions } from "../../db/schema";
import { eq, and } from "drizzle-orm";

export const checkPermission = (requiredPermission: string) => {
    return async (c: Context, next: Next) => {
        // 1. Get User ID from Context (set by Auth Middleware)
        const user = c.get("user");
        if (!user) {
            return c.json({ error: "Unauthorized" }, 401);
        }

        // 2. Get Project ID from Params or Body
        let projectId = c.req.param("projectId") || c.req.param("id");

        if (!projectId) {
            console.log("checkPermission c.req.json is:", c.req.json.toString());
            let body = c.get("decryptedBody");
            if (!body) {
                try {
                    body = await c.req.json();
                } catch (e) {
                    console.error("checkPermission failed to parse json:", e);
                }
            }
            console.log("checkPermission body keys:", Object.keys(body || {}));
            if (body) {
                projectId = body.projectId || body.project_id;
            }
            console.log("Extracted projectId:", projectId);
        }

        if (!projectId) {
            return c.json({ error: "Project ID required for permission check" }, 400);
        }

        // 3. Check User's Role in Project
        const member = await db.query.projectMembers.findFirst({
            where: and(
                eq(projectMembers.projectId, projectId),
                eq(projectMembers.userId, user.id)
            )
        });

        if (!member) {
            return c.json({ error: "Not a member of this project" }, 403);
        }

        // 4. Check if Role has Permission
        const rolePerms = await db
            .select({ name: permissions.name })
            .from(rolePermissions)
            .innerJoin(permissions, eq(rolePermissions.permissionId, permissions.id))
            .where(eq(rolePermissions.roleId, member.roleId));

        const hasPermission = rolePerms.some((p) => p.name === requiredPermission);

        if (!hasPermission) {
            return c.json({ error: "Forbidden: Insufficient permissions" }, 403);
        }

        await next();
    };
};
