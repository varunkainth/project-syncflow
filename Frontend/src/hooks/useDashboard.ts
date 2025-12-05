import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { decryptPayload } from "@/utils/encryption";

export interface DashboardStats {
    totalProjects: number;
    activeTasks: number;
    completedTasks: number;
    teamMembers: number;
    overdueTasks: number;
}

export interface ActivityLog {
    id: string;
    action: string;
    entityType: string;
    entityId: string;
    metadata: string | null;
    createdAt: string;
    user: {
        id: string;
        name: string;
        avatarUrl: string | null;
    };
}

export interface UpcomingTask {
    id: string;
    title: string;
    status: string;
    dueDate: string;
    project: {
        id: string;
        name: string;
    };
}

export interface DashboardData {
    stats: DashboardStats;
    recentActivity: ActivityLog[];
    upcomingTasks: UpcomingTask[];
    myTasks: UpcomingTask[];
}

export function useDashboard() {
    return useQuery({
        queryKey: ["dashboard"],
        queryFn: async () => {
            const response = await api.get("/analytics/dashboard");
            const decryptedData = decryptPayload(response.data.data);
            return decryptedData as DashboardData;
        },
        refetchInterval: 30000, // Refetch every 30 seconds for near-realtime updates
    });
}
