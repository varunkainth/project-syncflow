import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { api } from "@/lib/api";

export function useLogout() {
    const navigate = useNavigate();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async () => {
            await api.post("/auth/logout");
        },
        onSuccess: () => {
            queryClient.setQueryData(["user"], null);
            navigate("/auth/login");
        },
        onError: (error) => {
            console.error("Logout failed:", error);
            // Force logout on error anyway
            queryClient.setQueryData(["user"], null);
            navigate("/auth/login");
        }
    });
}
