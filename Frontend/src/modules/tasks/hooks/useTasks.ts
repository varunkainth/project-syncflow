import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { encryptPayload, decryptPayload } from "@/utils/encryption";
import type { Task, CreateTaskFormValues, Attachment } from "../schema";

export interface TaskFilters {
    query?: string;
    status?: string;
    assigneeId?: string;
    creatorId?: string;
    page?: number;
    limit?: number;
}

export interface PaginatedTasks {
    tasks: Task[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
        hasNext: boolean;
        hasPrev: boolean;
    };
}

export function useTasks(projectId: string, filters: TaskFilters = {}) {
    const { page = 1, limit = 12, status, assigneeId, creatorId, query } = filters;

    const queryParams = new URLSearchParams();
    queryParams.set("projectId", projectId);
    queryParams.set("page", String(page));
    queryParams.set("limit", String(limit));
    if (query && query.trim()) queryParams.set("q", query.trim());
    if (status && status !== "all") queryParams.set("status", status);
    if (assigneeId && assigneeId !== "all") queryParams.set("assigneeId", assigneeId);
    if (creatorId && creatorId !== "all") queryParams.set("creatorId", creatorId);

    return useQuery({
        queryKey: ["tasks", projectId, { page, limit, status, assigneeId, creatorId, query }],
        queryFn: async () => {
            const response = await api.get(`/tasks/search?${queryParams.toString()}`);
            const decryptedData = decryptPayload(response.data.data);
            return decryptedData as PaginatedTasks;
        },
        enabled: !!projectId,
    });
}

export function useMyTasks() {
    return useQuery({
        queryKey: ["myTasks"],
        queryFn: async () => {
            const response = await api.get("/tasks/my");
            const decryptedData = decryptPayload(response.data.data);
            return decryptedData.tasks as Task[];
        },
    });
}

export function useTask(taskId: string) {
    return useQuery({
        queryKey: ["task", taskId],
        queryFn: async () => {
            const response = await api.get(`/tasks/${taskId}`);
            const decryptedData = decryptPayload(response.data.data);
            return decryptedData.task as Task;
        },
        enabled: !!taskId,
    });
}

export function useCreateTask(projectId: string) {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (data: CreateTaskFormValues) => {
            const payload = { ...data, projectId };
            const encryptedData = encryptPayload(payload);
            const response = await api.post("/tasks", { data: encryptedData });
            const decryptedData = decryptPayload(response.data.data);
            return decryptedData.task as Task;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["tasks", projectId] });
        },
    });
}

export function useUpdateTask(projectId: string) {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ id, data }: { id: string; data: Partial<CreateTaskFormValues> }) => {
            const encryptedData = encryptPayload(data);
            const response = await api.patch(`/tasks/${id}`, { data: encryptedData });
            const decryptedData = decryptPayload(response.data.data);
            return decryptedData.task as Task;
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ["tasks", projectId] });
            queryClient.invalidateQueries({ queryKey: ["task", data.id] });
        },
    });
}

export function useDeleteTask(projectId: string) {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (id: string) => {
            await api.delete(`/tasks/${id}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["tasks", projectId] });
        },
    });
}

export function useAddComment(_projectId: string) {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ taskId, content, parentId }: { taskId: string; content: string; parentId?: string }) => {
            const encryptedData = encryptPayload({ content, parentId });
            const response = await api.post(`/tasks/${taskId}/comments`, { data: encryptedData });
            const decryptedData = decryptPayload(response.data.data);
            return decryptedData.comment;
        },
        onSuccess: (_data, variables) => {
            queryClient.invalidateQueries({ queryKey: ["task", variables.taskId] });
        },
    });
}

export function useUpdateComment(_projectId: string) {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ commentId, content }: { commentId: string; content: string }) => {
            const encryptedData = encryptPayload({ content });
            const response = await api.patch(`/tasks/comments/${commentId}`, { data: encryptedData });
            const decryptedData = decryptPayload(response.data.data);
            return decryptedData.comment;
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ["task", data.taskId] });
        },
    });
}



export function useDeleteComment(_projectId: string) {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ commentId, taskId }: { commentId: string; taskId: string }) => {
            await api.delete(`/tasks/comments/${commentId}`);
            return { taskId };
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ["task", data.taskId] });
        },
    });
}

export function useUploadTaskAttachment(_projectId: string) {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ taskId, file }: { taskId: string; file: File }) => {
            const formData = new FormData();
            formData.append("file", file);

            const response = await api.post(`/tasks/${taskId}/attachments`, formData, {
                headers: {
                    "Content-Type": "multipart/form-data",
                },
            });
            const decryptedData = decryptPayload(response.data.data);
            return decryptedData.attachment as Attachment;
        },
        onSuccess: (_data, variables) => {
            queryClient.invalidateQueries({ queryKey: ["task", variables.taskId] });
        },
    });
}

export function useDeleteTaskAttachment(_projectId: string) {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ taskId, attachmentId }: { taskId: string; attachmentId: string }) => {
            await api.delete(`/tasks/${taskId}/attachments/${attachmentId}`);
            return { taskId };
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ["task", data.taskId] });
        },
    });
}
