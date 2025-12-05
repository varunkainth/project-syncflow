import { z } from "zod";

export const createTaskSchema = z.object({
    projectId: z.string().uuid(),
    title: z.string().min(1),
    description: z.string().optional(),
    assigneeId: z.string().uuid().optional(),
    dueDate: z.string().optional(),
    priority: z.enum(["low", "medium", "high"]).optional(),
    status: z.enum(["todo", "in-progress", "done"]).optional(),
});

export const updateTaskSchema = z.object({
    title: z.string().optional(),
    description: z.string().optional(),
    status: z.enum(["todo", "in-progress", "done"]).optional(),
    assigneeId: z.string().uuid().optional().nullable(),
    dueDate: z.string().optional(),
    priority: z.enum(["low", "medium", "high"]).optional(),
});

export const createCommentSchema = z.object({
    content: z.string().min(1),
    parentId: z.string().uuid().optional(),
});

export const createSubTaskSchema = z.object({
    title: z.string().min(1),
});

export const taskSchema = z.object({
    id: z.string(),
    title: z.string(),
    description: z.string().optional().nullable(),
    status: z.string(),
    projectId: z.string(),
    assigneeId: z.string().optional().nullable(),
    creatorId: z.string(),
    createdAt: z.string(),
});

export const taskResponseSchema = z.object({
    task: taskSchema,
});

export const searchTasksQuerySchema = z.object({
    q: z.string().optional(),
    projectId: z.string().optional(),
    status: z.string().optional(),
    assigneeId: z.string().optional(),
    startDate: z.string().optional(),
    endDate: z.string().optional(),
});
