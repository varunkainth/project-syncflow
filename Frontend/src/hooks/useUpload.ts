import { useMutation } from "@tanstack/react-query";
import { api } from "@/lib/api";

export function useUpload() {
    return useMutation({
        mutationFn: async (file: File) => {
            const formData = new FormData();
            formData.append("file", file);

            // Upload endpoint (not encrypted as it handles file)
            const response = await api.post("/upload", formData, {
                headers: {
                    "Content-Type": "multipart/form-data",
                },
            });

            return response.data.url as string;
        },
    });
}
