import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { encryptPayload, decryptPayload } from "@/utils/encryption";

export interface Notification {
    id: string;
    userId: string;
    type: string;
    title: string;
    message: string;
    actionUrl?: string | null;
    entityType?: string | null;
    entityId?: string | null;
    read: boolean;
    createdAt: string;
}

export function useNotifications(limit: number = 20, offset: number = 0, unreadOnly: boolean = false) {
    return useQuery({
        queryKey: ["notifications", { limit, offset, unreadOnly }],
        queryFn: async () => {
            const response = await api.get(`/notifications?limit=${limit}&offset=${offset}&unreadOnly=${unreadOnly}`);
            const decryptedData = decryptPayload(response.data.data);
            return decryptedData.notifications as Notification[];
        },
    });
}

export function useUnreadCount() {
    return useQuery({
        queryKey: ["notifications", "unread-count"],
        queryFn: async () => {
            const response = await api.get("/notifications/unread-count");
            const decryptedData = decryptPayload(response.data.data);
            return decryptedData.count as number;
        },
        refetchInterval: 30000, // Poll every 30 seconds
    });
}

export function useMarkAsRead() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (notificationId: string) => {
            const response = await api.patch(`/notifications/${notificationId}/read`);
            const decryptedData = decryptPayload(response.data.data);
            return decryptedData.notification;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["notifications"] });
        },
    });
}

export function useMarkAllAsRead() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async () => {
            const response = await api.patch("/notifications/mark-all-read");
            const decryptedData = decryptPayload(response.data.data);
            return decryptedData.result;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["notifications"] });
        },
    });
}

export function useDeleteNotification() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (notificationId: string) => {
            await api.delete(`/notifications/${notificationId}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["notifications"] });
        },
    });
}
