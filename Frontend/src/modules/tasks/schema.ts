import { z } from "zod";

export const createTaskSchema = z.object({
    title: z.string().min(1, "Title is required"),
    description: z.string().optional(),
    status: z.enum(["todo", "in-progress", "done"]).optional(),
    assigneeId: z.string().optional(),
    priority: z.enum(["low", "medium", "high"]).optional(),
    dueDate: z.string().min(1, "Due date is required"),
});

export type CreateTaskFormValues = z.infer<typeof createTaskSchema>;

export interface Task {
    id: string;
    projectId: string;
    title: string;
    description?: string;
    status: "todo" | "in-progress" | "done";
    assigneeId?: string;
    creatorId: string;
    dueDate?: string;
    startedAt?: string;
    completedAt?: string;
    createdAt: string;
    updatedAt: string;
    assignee?: {
        id: string;
        name: string;
        email: string;
        avatarUrl?: string;
    };
    creator?: {
        id: string;
        name: string;
        email: string;
        avatarUrl?: string;
    };
    project?: {
        id: string;
        name: string;
    };
    comments?: Comment[];
    subTasks?: SubTask[];
    attachments?: Attachment[];
}

export interface Comment {
    id: string;
    taskId: string;
    userId: string;
    parentId?: string;
    content: string;
    createdAt: string;
    user: {
        id: string;
        name: string;
        avatarUrl?: string;
    };
}

export interface SubTask {
    id: string;
    taskId: string;
    title: string;
    isCompleted: boolean;
}

export interface Attachment {
    id: string;
    taskId: string;
    url: string;
    filename: string;
    createdAt: string;
}
