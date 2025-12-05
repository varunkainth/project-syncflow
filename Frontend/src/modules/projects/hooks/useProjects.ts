import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { encryptPayload, decryptPayload } from "@/utils/encryption";
import type { CreateProjectFormValues, Project } from "../schema";

export function useProjects() {
    return useQuery({
        queryKey: ["projects"],
        queryFn: async () => {
            const response = await api.get("/projects");
            const decryptedData = decryptPayload(response.data.data);
            return decryptedData.projects as Project[];
        },
    });
}

export function useProject(id: string) {
    return useQuery({
        queryKey: ["projects", id],
        queryFn: async () => {
            const response = await api.get(`/projects/${id}`);
            const decryptedData = decryptPayload(response.data.data);
            return decryptedData.project as Project;
        },
        enabled: !!id,
    });
}

export function useProjectTasks(projectId: string) {
    return useQuery({
        queryKey: ["tasks", { projectId }],
        queryFn: async () => {
            const response = await api.get(`/tasks/search?projectId=${projectId}`);
            const decryptedData = decryptPayload(response.data.data);
            return decryptedData.tasks; // Assuming backend returns { tasks: [] }
        },
        enabled: !!projectId,
    });
}

export function useCreateProject() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (data: CreateProjectFormValues) => {
            const encryptedData = encryptPayload(data);
            const response = await api.post("/projects", { data: encryptedData });
            const decryptedData = decryptPayload(response.data.data);
            return decryptedData.project as Project;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["projects"] });
        },
    });
}

export function useUpdateProject() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ id, data }: { id: string; data: Partial<CreateProjectFormValues> }) => {
            const encryptedData = encryptPayload(data);
            const response = await api.patch(`/projects/${id}`, { data: encryptedData });
            const decryptedData = decryptPayload(response.data.data);
            return decryptedData.project as Project;
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ["projects"] });
            queryClient.invalidateQueries({ queryKey: ["projects", data.id] });
        },
    });
}

export function useDeleteProject() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (id: string) => {
            await api.delete(`/projects/${id}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["projects"] });
        },
    });
}

export interface ProjectMember {
    userId: string;
    name: string;
    email: string;
    avatarUrl?: string;
    roleId: number;
    roleName: string;
    roleDescription?: string;
    status: string; // 'pending', 'active', 'declined'
    joinedAt: string;
}

export function useProjectMembers(projectId: string) {
    return useQuery({
        queryKey: ["projects", projectId, "members"],
        queryFn: async () => {
            const response = await api.get(`/projects/${projectId}/members`);
            const decryptedData = decryptPayload(response.data.data);
            return decryptedData.members as ProjectMember[];
        },
        enabled: !!projectId,
    });
}

export function useCurrentUserRole(projectId: string, userId?: string) {
    const { data: members = [] } = useProjectMembers(projectId);

    const currentMember = members.find(m => m.userId === userId);

    return {
        role: currentMember?.roleName?.toLowerCase() || null,
        isOwner: currentMember?.roleName?.toLowerCase() === 'owner',
        isAdmin: currentMember?.roleName?.toLowerCase() === 'admin',
        isProjectManager: currentMember?.roleName?.toLowerCase() === 'project_manager',
        isMember: !!currentMember,
        canEditTasks: ['owner', 'admin', 'project_manager'].includes(currentMember?.roleName?.toLowerCase() || ''),
    };
}

export interface InviteMemberData {
    email: string;
    roleId: number;
}

export function useInviteMember(projectId: string) {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (data: InviteMemberData) => {
            const encryptedData = encryptPayload(data);
            const response = await api.post(`/projects/${projectId}/members/invite`, { data: encryptedData });
            const decryptedData = decryptPayload(response.data.data);
            return decryptedData.invitation;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["projects", projectId, "members"] });
            queryClient.invalidateQueries({ queryKey: ["projects", projectId] });
        },
    });
}

export function useRemoveMember(projectId: string) {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (userId: string) => {
            await api.delete(`/projects/${projectId}/members/${userId}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["projects", projectId, "members"] });
            queryClient.invalidateQueries({ queryKey: ["projects", projectId] });
        },
    });
}

export function useUpdateMemberRole(projectId: string) {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ userId, roleId }: { userId: string; roleId: number }) => {
            const encryptedData = encryptPayload({ roleId });
            const response = await api.patch(`/projects/${projectId}/members/${userId}/role`, { data: encryptedData });
            const decryptedData = decryptPayload(response.data.data);
            return decryptedData.result;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["projects", projectId, "members"] });
            queryClient.invalidateQueries({ queryKey: ["projects", projectId] });
        },
    });
}

export interface CreateInviteLinkData {
    roleId: number;
    maxUses?: number;
    expiresInDays?: number;
}

export function useCreateInviteLink(projectId: string) {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (data: CreateInviteLinkData) => {
            const encryptedData = encryptPayload(data);
            const response = await api.post(`/projects/${projectId}/invite-link`, { data: encryptedData });
            const decryptedData = decryptPayload(response.data.data);
            return decryptedData.inviteLink;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["projects", projectId] });
        },
    });
}

export function useJoinViaInviteLink() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (token: string) => {
            const response = await api.post(`/projects/join/${token}`);
            const decryptedData = decryptPayload(response.data.data);
            return decryptedData.result;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["projects"] });
        },
    });
}

export interface InvitationDetails {
    project: {
        id: string;
        name: string;
        description: string | null;
        status: string | null;
    };
    inviter: {
        id: string;
        name: string | null;
        email: string;
        avatarUrl: string | null;
    };
    role: {
        id: number;
        name: string;
        description: string | null;
    };
    invitationStatus: string;
    invitedAt: string;
}

export function useInvitationDetails(projectId: string) {
    return useQuery({
        queryKey: ["invitations", projectId],
        queryFn: async () => {
            const response = await api.get(`/projects/${projectId}/invitation`);
            const decryptedData = decryptPayload(response.data.data);
            return decryptedData.invitation as InvitationDetails;
        },
        enabled: !!projectId,
        retry: false,
    });
}

export function useAcceptInvitation() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (projectId: string) => {
            const response = await api.post(`/projects/${projectId}/invitation/accept`);
            const decryptedData = decryptPayload(response.data.data);
            return decryptedData.result;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["projects"] });
            queryClient.invalidateQueries({ queryKey: ["invitations"] });
            queryClient.invalidateQueries({ queryKey: ["notifications"] });
        },
    });
}

export function useDeclineInvitation() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (projectId: string) => {
            await api.post(`/projects/${projectId}/invitation/decline`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["invitations"] });
            queryClient.invalidateQueries({ queryKey: ["notifications"] });
        },
    });
}
