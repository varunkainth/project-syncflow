import { z } from "zod";

export const createRoleSchema = z.object({
    name: z.string().min(1),
    description: z.string().optional(),
});

export const createPermissionSchema = z.object({
    name: z.string().min(1),
    description: z.string().optional(),
});

export const assignPermissionSchema = z.object({
    roleId: z.number(),
    permissionId: z.number(),
});
