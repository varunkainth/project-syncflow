import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { encryptPayload, decryptPayload } from "@/utils/encryption";

export interface Label {
    id: string;
    projectId: string;
    name: string;
    color: string;
    createdAt: string;
}

export function useProjectLabels(projectId: string) {
    return useQuery({
        queryKey: ["labels", "project", projectId],
        queryFn: async () => {
            const response = await api.get(`/labels/project/${projectId}`);
            const decryptedData = decryptPayload(response.data.data);
            return decryptedData.labels as Label[];
        },
        enabled: !!projectId,
    });
}

export function useTaskLabels(taskId: string) {
    return useQuery({
        queryKey: ["labels", "task", taskId],
        queryFn: async () => {
            const response = await api.get(`/labels/tasks/${taskId}`);
            const decryptedData = decryptPayload(response.data.data);
            return decryptedData.labels as Label[];
        },
        enabled: !!taskId,
    });
}

export function useCreateLabel(projectId: string) {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (data: { name: string; color: string }) => {
            const encryptedData = encryptPayload({ projectId, ...data });
            const response = await api.post("/labels", { data: encryptedData });
            const decryptedData = decryptPayload(response.data.data);
            return decryptedData.label as Label;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["labels", "project", projectId] });
        },
    });
}

export function useUpdateLabel(projectId: string) {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ labelId, data }: { labelId: string; data: { name?: string; color?: string } }) => {
            const encryptedData = encryptPayload(data);
            const response = await api.patch(`/labels/${labelId}`, { data: encryptedData });
            const decryptedData = decryptPayload(response.data.data);
            return decryptedData.label as Label;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["labels", "project", projectId] });
        },
    });
}

export function useDeleteLabel(projectId: string) {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (labelId: string) => {
            await api.delete(`/labels/${labelId}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["labels", "project", projectId] });
        },
    });
}

export function useSetTaskLabels(taskId: string) {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (labelIds: string[]) => {
            const encryptedData = encryptPayload({ labelIds });
            await api.put(`/labels/tasks/${taskId}`, { data: encryptedData });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["labels", "task", taskId] });
            queryClient.invalidateQueries({ queryKey: ["task", taskId] });
        },
    });
}

// Predefined colors for labels
export const LABEL_COLORS = [
    { name: "Red", value: "#ef4444" },
    { name: "Orange", value: "#f97316" },
    { name: "Yellow", value: "#eab308" },
    { name: "Green", value: "#22c55e" },
    { name: "Teal", value: "#14b8a6" },
    { name: "Blue", value: "#3b82f6" },
    { name: "Indigo", value: "#6366f1" },
    { name: "Purple", value: "#a855f7" },
    { name: "Pink", value: "#ec4899" },
    { name: "Gray", value: "#6b7280" },
];
