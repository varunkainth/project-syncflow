import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { encryptPayload, decryptPayload } from "@/utils/encryption";

export interface TimeEntry {
    id: string;
    taskId: string;
    userId: string;
    description?: string;
    startTime: string;
    endTime?: string;
    duration?: number;
    isManual: boolean;
    createdAt: string;
    user?: {
        id: string;
        name: string;
        avatarUrl?: string;
    };
    task?: {
        id: string;
        title: string;
        projectId: string;
    };
}

export function useRunningTimer() {
    return useQuery({
        queryKey: ["timeTracking", "running"],
        queryFn: async () => {
            const response = await api.get("/time-tracking/timer/running");
            const decryptedData = decryptPayload(response.data.data);
            return decryptedData.entry as TimeEntry | null;
        },
        refetchInterval: 30000, // Refetch every 30 seconds to update duration display
    });
}

export function useTaskTimeEntries(taskId: string) {
    return useQuery({
        queryKey: ["timeTracking", "task", taskId],
        queryFn: async () => {
            const response = await api.get(`/time-tracking/tasks/${taskId}`);
            const decryptedData = decryptPayload(response.data.data);
            return {
                entries: decryptedData.entries as TimeEntry[],
                totalTime: decryptedData.totalTime as number,
            };
        },
        enabled: !!taskId,
    });
}

export function useTodayTimeEntries() {
    return useQuery({
        queryKey: ["timeTracking", "today"],
        queryFn: async () => {
            const response = await api.get("/time-tracking/today");
            const decryptedData = decryptPayload(response.data.data);
            return decryptedData.entries as TimeEntry[];
        },
    });
}

export function useStartTimer(taskId: string) {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (description?: string) => {
            const encryptedData = encryptPayload({ taskId, description });
            const response = await api.post("/time-tracking/timer/start", { data: encryptedData });
            const decryptedData = decryptPayload(response.data.data);
            return decryptedData.entry as TimeEntry;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["timeTracking"] });
        },
    });
}

export function useStopTimer() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (entryId: string) => {
            const response = await api.post(`/time-tracking/timer/${entryId}/stop`);
            const decryptedData = decryptPayload(response.data.data);
            return decryptedData.entry as TimeEntry;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["timeTracking"] });
        },
    });
}

export function useAddManualTimeEntry(taskId: string) {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (data: { startTime: Date; endTime: Date; description?: string }) => {
            const encryptedData = encryptPayload({
                taskId,
                startTime: data.startTime.toISOString(),
                endTime: data.endTime.toISOString(),
                description: data.description,
            });
            const response = await api.post("/time-tracking/entries", { data: encryptedData });
            const decryptedData = decryptPayload(response.data.data);
            return decryptedData.entry as TimeEntry;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["timeTracking", "task", taskId] });
            queryClient.invalidateQueries({ queryKey: ["timeTracking", "today"] });
        },
    });
}

export function useDeleteTimeEntry(taskId: string) {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (entryId: string) => {
            await api.delete(`/time-tracking/entries/${entryId}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["timeTracking", "task", taskId] });
            queryClient.invalidateQueries({ queryKey: ["timeTracking", "today"] });
        },
    });
}

// Helper function to format duration
export function formatDuration(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
        return `${hours}h ${minutes}m`;
    }
    if (minutes > 0) {
        return `${minutes}m ${secs}s`;
    }
    return `${secs}s`;
}
