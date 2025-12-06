import { Hono } from "hono";
import * as taskController from "./controller";
import { checkPermission } from "../rbac/middleware";

const tasks = new Hono();

// User's assigned tasks across all projects
tasks.get("/my", taskController.getMyTasks);

// Use regular Hono routes for encrypted endpoints
tasks.get("/search", taskController.searchTasks);

// Apply permission middleware directly to routes
tasks.post("/", checkPermission("task:create"), taskController.createTask);
tasks.get("/:id", taskController.getTask);
tasks.patch("/:id", taskController.updateTask);
tasks.delete("/:id", taskController.deleteTask);
tasks.post("/:id/comments", taskController.addComment);
tasks.patch("/comments/:commentId", taskController.updateComment);
tasks.delete("/comments/:commentId", taskController.deleteComment);
tasks.post("/:id/subtasks", taskController.addSubTask);
tasks.post("/:id/attachments", taskController.uploadAttachment);
tasks.get("/:id/attachments", taskController.getAttachments);
tasks.delete("/:id/attachments/:attachmentId", taskController.deleteAttachment);

export default tasks;
