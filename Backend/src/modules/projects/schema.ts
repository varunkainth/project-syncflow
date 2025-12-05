import { z } from "zod";

export const createProjectSchema = z.object({
    name: z.string().min(1),
    description: z.string().optional(),
});

export const inviteMemberSchema = z.object({
    email: z.string().email(),
    roleId: z.number(),
});

export const projectSchema = z.object({
    id: z.string(),
    name: z.string(),
    description: z.string().optional().nullable(),
    status: z.string(),
    ownerId: z.string(),
    createdAt: z.string(),
});
