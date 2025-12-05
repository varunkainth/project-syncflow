import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { decryptPayload, encryptPayload } from "@/utils/encryption";

export interface User {
	id: string;
	email: string;
	name?: string;
	bio?: string;
	phoneNumber?: string;
	avatarUrl?: string;
	isTwoFactorEnabled?: boolean;
	createdAt?: string;
}

export interface UpdateProfileData {
	name?: string;
	bio?: string;
	phoneNumber?: string;
	avatarUrl?: string;
}

export interface ChangePasswordData {
	currentPassword: string;
	newPassword: string;
}

export function useUser() {
	return useQuery({
		queryKey: ["user"],
		queryFn: async () => {
			const response = await api.get("/auth/me", {
				headers: {
					"Content-Type": "application/json",
				},
			});
			const decryptedData = decryptPayload(response.data.data);
			return decryptedData.user as User;
		},
		retry: false,
	});
}

export function useUpdateProfile() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async (data: UpdateProfileData) => {
			const encryptedData = encryptPayload(data);
			const response = await api.put("/auth/profile", { data: encryptedData });
			const decryptedData = decryptPayload(response.data.data);
			return decryptedData.user as User;
		},
		onSuccess: (updatedUser) => {
			queryClient.setQueryData(["user"], updatedUser);
		},
	});
}

export function useChangePassword() {
	return useMutation({
		mutationFn: async (data: ChangePasswordData) => {
			const encryptedData = encryptPayload(data);
			const response = await api.put("/auth/password", { data: encryptedData });
			return decryptPayload(response.data.data);
		},
	});
}


export function useInvalidateUser() {
	const queryClient = useQueryClient();
	return () => queryClient.invalidateQueries({ queryKey: ["user"] });
}
