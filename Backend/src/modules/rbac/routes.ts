import { OpenAPIHono, createRoute, z } from "@hono/zod-openapi";
import * as rbacController from "./controller";

const rbac = new OpenAPIHono();

const roleSchema = z.object({
    name: z.string().min(1),
    description: z.string().optional(),
});

const permissionSchema = z.object({
    name: z.string().min(1),
    description: z.string().optional(),
});

const assignPermissionSchema = z.object({
    roleId: z.number(),
    permissionId: z.number(),
});

rbac.openapi(
    createRoute({
        method: "post",
        path: "/roles",
        tags: ["RBAC"],
        request: {
            body: {
                content: {
                    "application/json": {
                        schema: roleSchema,
                    },
                },
            },
        },
        responses: {
            201: {
                description: "Role created",
            },
        },
    }),
    rbacController.createRole
);

rbac.openapi(
    createRoute({
        method: "get",
        path: "/roles",
        tags: ["RBAC"],
        responses: {
            200: {
                content: {
                    "application/json": {
                        schema: z.object({
                            roles: z.array(z.object({ id: z.number(), name: z.string(), description: z.string().nullable() })),
                        }),
                    },
                },
                description: "List of roles",
            },
        },
    }),
    rbacController.getRoles
);

rbac.openapi(
    createRoute({
        method: "post",
        path: "/permissions",
        tags: ["RBAC"],
        request: {
            body: {
                content: {
                    "application/json": {
                        schema: permissionSchema,
                    },
                },
            },
        },
        responses: {
            201: {
                description: "Permission created",
            },
        },
    }),
    rbacController.createPermission
);

rbac.openapi(
    createRoute({
        method: "post",
        path: "/assign",
        tags: ["RBAC"],
        request: {
            body: {
                content: {
                    "application/json": {
                        schema: assignPermissionSchema,
                    },
                },
            },
        },
        responses: {
            200: {
                description: "Permission assigned",
            },
        },
    }),
    rbacController.assignPermission
);

export default rbac;
