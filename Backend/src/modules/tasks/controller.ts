import type { Context } from "hono";
import { TaskService } from "./service";
import { createTaskSchema, updateTaskSchema, createCommentSchema, createSubTaskSchema } from "./schema";

import { jsonEncrypted } from "../../middleware/encryption";

const taskService = new TaskService();

export const createTask = async (c: Context) => {
    try {
        const body = c.get("decryptedBody") || await c.req.json();
        const user = c.get("user");

        if (!user) return c.json({ error: "Unauthorized" }, 401);

        const result = createTaskSchema.safeParse(body);
        if (!result.success) {
            return c.json({ error: result.error }, 400);
        }

        try {
            const task = await taskService.createTask(user.id, result.data);
            return jsonEncrypted(c, { task }, 201);
        } catch (error: any) {
            return c.json({ error: error.message }, 400);
        }
    } catch (e) {
        console.error("createTask error:", e);
        return c.json({ error: "Internal Server Error" }, 500);
    }
};

export const getMyTasks = async (c: Context) => {
    const user = c.get("user");
    if (!user) return c.json({ error: "Unauthorized" }, 401);

    try {
        const tasks = await taskService.getMyTasks(user.id);
        return jsonEncrypted(c, { tasks });
    } catch (error: any) {
        return c.json({ error: error.message }, 400);
    }
};

export const updateTask = async (c: Context) => {
    const taskId = c.req.param("id");
    const body = c.get("decryptedBody") || await c.req.json();
    const user = c.get("user");
    if (!user) return c.json({ error: "Unauthorized" }, 401);

    const result = updateTaskSchema.safeParse(body);
    if (!result.success) {
        return c.json({ error: result.error }, 400);
    }

    try {
        const task = await taskService.updateTask(taskId, user.id, result.data);
        return jsonEncrypted(c, { task });
    } catch (error: any) {
        return c.json({ error: error.message }, 400);
    }
};

export const getTask = async (c: Context) => {
    const taskId = c.req.param("id");
    const user = c.get("user");
    if (!user) return c.json({ error: "Unauthorized" }, 401);

    try {
        const task = await taskService.getTaskById(taskId, user.id);
        if (!task) return c.json({ error: "Task not found" }, 404);
        return jsonEncrypted(c, { task });
    } catch (error: any) {
        return c.json({ error: error.message }, 400);
    }
};

export const deleteTask = async (c: Context) => {
    const taskId = c.req.param("id");
    const user = c.get("user");
    if (!user) return c.json({ error: "Unauthorized" }, 401);

    try {
        await taskService.deleteTask(taskId, user.id);
        return c.json({ message: "Task deleted" });
    } catch (error: any) {
        return c.json({ error: error.message }, 400);
    }
};

export const addComment = async (c: Context) => {
    const taskId = c.req.param("id");
    const body = c.get("decryptedBody") || await c.req.json();
    const user = c.get("user");

    if (!user) return c.json({ error: "Unauthorized" }, 401);

    const result = createCommentSchema.safeParse(body);
    if (!result.success) {
        return c.json({ error: result.error }, 400);
    }

    try {
        const comment = await taskService.addComment(user.id, taskId, result.data.content, result.data.parentId);
        return jsonEncrypted(c, { comment }, 201);
    } catch (error: any) {
        return c.json({ error: error.message }, 400);
    }
};

export const updateComment = async (c: Context) => {
    const commentId = c.req.param("commentId");
    const body = c.get("decryptedBody") || await c.req.json();
    const user = c.get("user");
    if (!user) return c.json({ error: "Unauthorized" }, 401);

    // Reusing createCommentSchema as it has content. 
    // Ideally separate schema but this works for now.
    const result = createCommentSchema.safeParse(body);
    if (!result.success) {
        return c.json({ error: result.error }, 400);
    }

    try {
        const comment = await taskService.updateComment(user.id, commentId, result.data.content);
        return jsonEncrypted(c, { comment });
    } catch (error: any) {
        return c.json({ error: error.message }, 400);
    }
};

export const deleteComment = async (c: Context) => {
    const commentId = c.req.param("commentId");
    const user = c.get("user");
    if (!user) return c.json({ error: "Unauthorized" }, 401);

    try {
        await taskService.deleteComment(user.id, commentId);
        return c.json({ message: "Comment deleted" });
    } catch (error: any) {
        return c.json({ error: error.message }, 400);
    }
};

export const addSubTask = async (c: Context) => {
    const taskId = c.req.param("id");
    const body = c.get("decryptedBody") || await c.req.json();

    const result = createSubTaskSchema.safeParse(body);
    if (!result.success) {
        return c.json({ error: result.error }, 400);
    }

    try {
        const subTask = await taskService.addSubTask(taskId, result.data.title);
        return jsonEncrypted(c, { subTask }, 201);
    } catch (error: any) {
        return c.json({ error: error.message }, 400);
    }
};

const { UploadService } = await import("../upload/service");
const uploadService = new UploadService();

export const uploadAttachment = async (c: Context) => {
    const taskId = c.req.param("id");
    const user = c.get("user");
    if (!user) return c.json({ error: "Unauthorized" }, 401);

    const body = await c.req.parseBody();
    const file = body["file"];

    if (!file || !(file instanceof File)) {
        return c.json({ error: "File required" }, 400);
    }

    try {
        const { url, filename } = await uploadService.uploadFile(file, "task-attachments");
        const attachment = await taskService.addAttachment(user.id, taskId, url, filename);
        return jsonEncrypted(c, { attachment }, 201);
    } catch (error: any) {
        return c.json({ error: error.message }, 500);
    }
};

export const deleteAttachment = async (c: Context) => {
    const taskId = c.req.param("id");
    const attachmentId = c.req.param("attachmentId");
    const user = c.get("user");
    if (!user) return c.json({ error: "Unauthorized" }, 401);

    try {
        await taskService.removeAttachment(user.id, taskId, attachmentId);
        return c.json({ message: "Attachment deleted" });
    } catch (error: any) {
        return c.json({ error: error.message }, 400);
    }
};

export const getAttachments = async (c: Context) => {
    const taskId = c.req.param("id");
    const user = c.get("user");
    if (!user) return c.json({ error: "Unauthorized" }, 401);

    try {
        const task = await taskService.getTaskById(taskId, user.id);
        if (!task) return c.json({ error: "Task not found" }, 404);
        return jsonEncrypted(c, { attachments: task.attachments });
    } catch (error: any) {
        return c.json({ error: error.message }, 400);
    }
};

export const searchTasks = async (c: Context) => {
    const user = c.get("user");
    if (!user) return c.json({ error: "Unauthorized" }, 401);

    const query = c.req.query("q");
    const projectId = c.req.query("projectId");
    const status = c.req.query("status");
    const assigneeId = c.req.query("assigneeId");
    const creatorId = c.req.query("creatorId");
    const startDate = c.req.query("startDate");
    const endDate = c.req.query("endDate");
    const page = c.req.query("page");
    const limit = c.req.query("limit");

    try {
        const result = await taskService.searchTasks({
            query,
            projectId,
            status,
            assigneeId,
            creatorId,
            startDate,
            endDate,
            page: page ? parseInt(page) : 1,
            limit: limit ? parseInt(limit) : 12,
        });
        return jsonEncrypted(c, result);
    } catch (error: any) {
        return c.json({ error: error.message }, 400);
    }
};
