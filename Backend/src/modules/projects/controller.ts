import type { Context } from "hono";
import { ProjectService } from "./service";
import { createProjectSchema, inviteMemberSchema } from "./schema";
import { jsonEncrypted } from "../../middleware/encryption";

const projectService = new ProjectService();

export const createProject = async (c: Context) => {
    try {
        const body = c.get("decryptedBody");
        const user = c.get("user"); // Set by Auth Middleware

        if (!body) {
            return c.json({ error: "Invalid encrypted payload" }, 400);
        }

        if (!user) {
            return c.json({ error: "Unauthorized" }, 401);
        }

        const result = createProjectSchema.safeParse(body);
        if (!result.success) {
            return c.json({ error: result.error.issues }, 400);
        }

        const project = await projectService.createProject(user.id, result.data.name, result.data.description);
        return jsonEncrypted(c, { project }, 201);
    } catch (error: any) {
        console.error("createProject error:", error);
        return c.json({ error: error.message }, 400);
    }
};

export const getProjects = async (c: Context) => {
    const user = c.get("user");
    // Temporary fallback
    const userId = user?.id || c.req.query("userId");

    if (!userId) {
        return c.json({ error: "Unauthorized" }, 401);
    }

    const projects = await projectService.getProjects(userId);
    return jsonEncrypted(c, { projects });
};

export const getProject = async (c: Context) => {
    const user = c.get("user");
    const projectId = c.req.param("id");
    const userId = user?.id;

    if (!userId) {
        return c.json({ error: "Unauthorized" }, 401);
    }

    const project = await projectService.getProjectById(projectId, userId);

    if (!project) {
        return c.json({ error: "Project not found or access denied" }, 404);
    }

    return jsonEncrypted(c, { project });
};


export const updateProject = async (c: Context) => {
    const projectId = c.req.param("id");
    const body = c.get("decryptedBody") || await c.req.json();
    const user = c.get("user");

    if (!user) return c.json({ error: "Unauthorized" }, 401);

    try {
        const project = await projectService.updateProject(projectId, user.id, body);
        return jsonEncrypted(c, { project });
    } catch (error: any) {
        return c.json({ error: error.message }, 400);
    }
};

export const deleteProject = async (c: Context) => {
    const projectId = c.req.param("id");
    const user = c.get("user");

    if (!user) return c.json({ error: "Unauthorized" }, 401);

    try {
        await projectService.deleteProject(projectId, user.id);
        return c.json({ message: "Project deleted" });
    } catch (error: any) {
        return c.json({ error: error.message }, 400);
    }
};

export const getProjectMembers = async (c: Context) => {
    const projectId = c.req.param("id");

    try {
        const members = await projectService.getProjectMembers(projectId);
        return jsonEncrypted(c, { members });
    } catch (error: any) {
        return c.json({ error: error.message }, 400);
    }
};

export const inviteMember = async (c: Context) => {
    const user = c.get("user");
    const projectId = c.req.param("id");
    const body = c.get("decryptedBody");

    if (!user) return c.json({ error: "Unauthorized" }, 401);
    if (!body) return c.json({ error: "Invalid payload" }, 400);

    const result = inviteMemberSchema.safeParse(body);
    if (!result.success) {
        return c.json({ error: result.error.issues }, 400);
    }

    try {
        const invitation = await projectService.inviteMember(
            projectId,
            user.id,
            result.data.email,
            result.data.roleId
        );
        return jsonEncrypted(c, { invitation }, 201);
    } catch (error: any) {
        return c.json({ error: error.message }, 400);
    }
};

export const removeMember = async (c: Context) => {
    const user = c.get("user");
    const projectId = c.req.param("id");
    const memberUserId = c.req.param("userId");

    if (!user) return c.json({ error: "Unauthorized" }, 401);

    try {
        await projectService.removeMember(projectId, user.id, memberUserId);
        return c.json({ message: "Member removed" });
    } catch (error: any) {
        return c.json({ error: error.message }, 400);
    }
};

export const updateMemberRole = async (c: Context) => {
    const user = c.get("user");
    const projectId = c.req.param("id");
    const memberUserId = c.req.param("userId");
    const body = c.get("decryptedBody");

    if (!user) return c.json({ error: "Unauthorized" }, 401);
    if (!body || !body.roleId) return c.json({ error: "Invalid payload" }, 400);

    try {
        const result = await projectService.updateMemberRole(
            projectId,
            user.id,
            memberUserId,
            body.roleId
        );
        return jsonEncrypted(c, { result });
    } catch (error: any) {
        return c.json({ error: error.message }, 400);
    }
};

export const createInviteLink = async (c: Context) => {
    const user = c.get("user");
    const projectId = c.req.param("id");
    const body = c.get("decryptedBody");

    if (!user) return c.json({ error: "Unauthorized" }, 401);
    if (!body) return c.json({ error: "Invalid payload" }, 400);

    try {
        const inviteLink = await projectService.createInviteLink(
            projectId,
            user.id,
            body.roleId,
            body.maxUses,
            body.expiresInDays
        );
        return jsonEncrypted(c, { inviteLink }, 201);
    } catch (error: any) {
        return c.json({ error: error.message }, 400);
    }
};

export const joinViaInviteLink = async (c: Context) => {
    const user = c.get("user");
    const token = c.req.param("token");

    if (!user) return c.json({ error: "Unauthorized" }, 401);

    try {
        const result = await projectService.joinViaInviteLink(token, user.id);
        return jsonEncrypted(c, { result });
    } catch (error: any) {
        return c.json({ error: error.message }, 400);
    }
};

export const acceptInvitation = async (c: Context) => {
    const user = c.get("user");
    const projectId = c.req.param("id");

    if (!user) return c.json({ error: "Unauthorized" }, 401);

    try {
        const result = await projectService.acceptInvitation(projectId, user.id);
        return jsonEncrypted(c, { result });
    } catch (error: any) {
        return c.json({ error: error.message }, 400);
    }
};

export const declineInvitation = async (c: Context) => {
    const user = c.get("user");
    const projectId = c.req.param("id");

    if (!user) return c.json({ error: "Unauthorized" }, 401);

    try {
        const result = await projectService.declineInvitation(projectId, user.id);
        return c.json({ result });
    } catch (error: any) {
        return c.json({ error: error.message }, 400);
    }
};

export const getInvitationDetails = async (c: Context) => {
    const user = c.get("user");
    const projectId = c.req.param("id");

    if (!user) return c.json({ error: "Unauthorized" }, 401);

    try {
        const invitation = await projectService.getInvitationDetails(projectId, user.id);
        return jsonEncrypted(c, { invitation });
    } catch (error: any) {
        return c.json({ error: error.message }, 400);
    }
};

const { UploadService } = await import("../upload/service");
const uploadService = new UploadService();

export const uploadAttachment = async (c: Context) => {
    const user = c.get("user");
    const projectId = c.req.param("id");

    const body = await c.req.parseBody();
    const file = body['file'];

    if (!user) return c.json({ error: "Unauthorized" }, 401);

    if (!file || !(file instanceof File)) {
        return c.json({ error: "No file provided" }, 400);
    }

    try {
        const { url, filename } = await uploadService.uploadFile(file, "project-attachments");
        const attachment = await projectService.addAttachment(projectId, user.id, url, filename);
        return jsonEncrypted(c, { attachment });
    } catch (error: any) {
        return c.json({ error: error.message }, 400);
    }
};

export const deleteAttachment = async (c: Context) => {
    const user = c.get("user");
    const projectId = c.req.param("id");
    const attachmentId = c.req.param("attachmentId");

    if (!user) return c.json({ error: "Unauthorized" }, 401);

    try {
        await projectService.removeAttachment(projectId, user.id, attachmentId);
        return c.json({ message: "Attachment deleted" });
    } catch (error: any) {
        return c.json({ error: error.message }, 400);
    }
};

export const getAttachments = async (c: Context) => {
    const user = c.get("user");
    const projectId = c.req.param("id");

    if (!user) return c.json({ error: "Unauthorized" }, 401);

    try {
        const attachments = await projectService.getAttachments(projectId, user.id);
        return jsonEncrypted(c, { attachments });
    } catch (error: any) {
        return c.json({ error: error.message }, 400);
    }
};
