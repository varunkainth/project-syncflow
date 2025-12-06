import { z } from "zod";

export const createProjectSchema = z.object({
    name: z.string().min(1, "Project name is required"),
    description: z.string().optional(),
    status: z.enum(["active", "archived", "completed", "on_hold"]).optional(),
});

export type CreateProjectFormValues = z.infer<typeof createProjectSchema>;

export interface Project {
    id: string;
    name: string;
    description?: string;
    status: string;
    ownerId: string;
    createdAt: string;
    attachments?: Attachment[];
}

export interface Attachment {
    id: string;
    projectId?: string;
    taskId?: string;
    url: string;
    filename: string;
    uploaderId: string;
    createdAt: string;
}
