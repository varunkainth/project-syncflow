import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { decryptPayload, encryptPayload } from "@/utils/encryption";

export interface Session {
	id: string;
	userAgent: string | null;
	ipAddress: string | null;
	createdAt: string;
	expiresAt: string;
}

export interface AuditLog {
	id: string;
	action: string;
	ipAddress: string | null;
	userAgent: string | null;
	metadata: string | null;
	createdAt: string;
}

export interface LinkedAccount {
	id: string;
	provider: string;
	createdAt: string;
}

// Sessions
export function useSessions() {
	return useQuery({
		queryKey: ["sessions"],
		queryFn: async () => {
			const response = await api.get("/auth/sessions");
			const data = decryptPayload(response.data.data);
			return data.sessions as Session[];
		},
	});
}

export function useRevokeSession() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async (sessionId: string) => {
			await api.delete(`/auth/sessions/${sessionId}`);
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["sessions"] });
		},
	});
}

export function useRevokeAllSessions() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async () => {
			await api.delete("/auth/sessions");
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["sessions"] });
			queryClient.invalidateQueries({ queryKey: ["user"] });
		},
	});
}

// Audit Logs
export function useAuditLogs() {
	return useQuery({
		queryKey: ["auditLogs"],
		queryFn: async () => {
			const response = await api.get("/auth/audit-logs");
			const data = decryptPayload(response.data.data);
			return data.logs as AuditLog[];
		},
	});
}

// Linked Accounts
export function useLinkedAccounts() {
	return useQuery({
		queryKey: ["linkedAccounts"],
		queryFn: async () => {
			const response = await api.get("/auth/linked-accounts");
			const data = decryptPayload(response.data.data);
			return data.accounts as LinkedAccount[];
		},
	});
}

export function useUnlinkAccount() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async (provider: string) => {
			await api.delete(`/auth/linked-accounts/${provider}`);
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["linkedAccounts"] });
		},
	});
}

// Set Password (for OAuth users)
export function useSetPassword() {
	return useMutation({
		mutationFn: async (newPassword: string) => {
			const encryptedData = encryptPayload({ newPassword });
			await api.post("/auth/set-password", { data: encryptedData });
		},
	});
}

// Resend Verification Email
export function useResendVerification() {
	return useMutation({
		mutationFn: async (email: string) => {
			await api.post("/auth/resend-verification", { email });
		},
	});
}
