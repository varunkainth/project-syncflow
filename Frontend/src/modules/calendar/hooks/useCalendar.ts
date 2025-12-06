import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { decryptPayload } from "@/utils/encryption";
import type { Task } from "@/modules/tasks/schema";

export function useCalendarTasks(startDate: Date, endDate: Date, projectId?: string) {
    return useQuery({
        queryKey: ["calendar", "tasks", startDate.toISOString(), endDate.toISOString(), projectId],
        queryFn: async () => {
            const params = new URLSearchParams({
                startDate: startDate.toISOString(),
                endDate: endDate.toISOString(),
            });
            if (projectId) {
                params.append("projectId", projectId);
            }

            const response = await api.get(`/calendar/tasks?${params.toString()}`);
            const decryptedData = decryptPayload(response.data.data);
            return decryptedData.tasks as Task[];
        },
        enabled: !!startDate && !!endDate,
    });
}

export function useExportICal(projectId?: string) {
    const downloadICal = async () => {
        try {
            const params = projectId ? `?projectId=${projectId}` : "";
            const response = await api.get(`/calendar/ical${params}`, {
                responseType: "blob",
            });

            // Create download link
            const blob = new Blob([response.data], { type: "text/calendar" });
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = url;
            link.download = "tasks.ics";
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);
        } catch (error) {
            console.error("Failed to download iCal:", error);
            throw error;
        }
    };

    return { downloadICal };
}
