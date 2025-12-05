import { db } from "../../db/index";
import { tasks, subTasks, comments, attachments, users, projectMembers } from "../../db/schema";
import { eq, and, sql } from "drizzle-orm";
import { sendEmail } from "../notifications/email.service";
import { taskAssignedTemplate } from "../notifications/templates";
import { AnalyticsService } from "../analytics/service";

const analyticsService = new AnalyticsService();

export class TaskService {
    async createTask(creatorId: string, data: { projectId: string; title: string; description?: string; assigneeId?: string; dueDate?: string; priority?: string }) {
        const [task] = await db.insert(tasks).values({
            creatorId,
            projectId: data.projectId,
            title: data.title,
            description: data.description,
            assigneeId: data.assigneeId,
            dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
            priority: data.priority,
        }).returning();

        if (!task) {
            throw new Error("Failed to create task");
        }

        // Send notification to assignee
        if (data.assigneeId && data.assigneeId !== creatorId) {
            const assignee = await db.query.users.findFirst({
                where: eq(users.id, data.assigneeId),
                columns: { email: true, name: true }
            });

            const creator = await db.query.users.findFirst({
                where: eq(users.id, creatorId),
                columns: { name: true }
            });

            if (assignee) {
                const taskLink = `/projects/${data.projectId}/tasks`;

                // Send email notification
                await sendEmail(assignee.email, "New Task Assigned", taskAssignedTemplate(creator?.name || "A team member", task.title, taskLink));

                // Send in-app notification
                const { NotificationService } = await import("../notifications/service");
                const notificationService = new NotificationService();
                await notificationService.createNotification(
                    data.assigneeId,
                    "task_assigned",
                    `New task assigned: ${task.title}`,
                    `${creator?.name || "Someone"} assigned you to "${task.title}"`,
                    taskLink,
                    "task",
                    task.id
                );
            }
        }

        await analyticsService.logActivity(creatorId, "create_task", task.id, "task", { title: task.title, projectId: data.projectId });

        return task;
    }


    // updateTask replaced below

    async addComment(userId: string, taskId: string, content: string, parentId?: string) {
        const task = await this.getTaskById(taskId, userId);
        if (!task) throw new Error("Task not found or access denied");

        const [comment] = await db.insert(comments).values({
            userId,
            taskId,
            content,
            parentId,
        }).returning();

        await analyticsService.logActivity(userId, "comment_task", taskId, "task", { contentSnippet: content.substring(0, 20) });

        if (!comment) {
            throw new Error("Failed to add comment");
        }

        // Get commenter details
        const commenter = await db.query.users.findFirst({
            where: eq(users.id, userId),
            columns: { name: true }
        });

        // Send notifications to task creator and assignee (but not to the commenter themselves)
        const { NotificationService } = await import("../notifications/service");
        const notificationService = new NotificationService();
        const taskLink = `/projects/${task.projectId}/tasks`;
        const notificationRecipients = new Set<string>();

        // Add creator if not the commenter
        if (task.creatorId && task.creatorId !== userId) {
            notificationRecipients.add(task.creatorId);
        }

        // Add assignee if not the commenter
        if (task.assigneeId && task.assigneeId !== userId) {
            notificationRecipients.add(task.assigneeId);
        }

        // Send notifications
        for (const recipientId of notificationRecipients) {
            await notificationService.createNotification(
                recipientId,
                "task_comment",
                `New comment on: ${task.title}`,
                `${commenter?.name || "Someone"} commented: "${content.substring(0, 50)}${content.length > 50 ? '...' : ''}"`,
                taskLink,
                "task",
                task.id
            );
        }

        // Fetch user details for the comment to return complete object
        const commentWithUser = await db.query.comments.findFirst({
            where: eq(comments.id, comment.id),
            with: {
                user: {
                    columns: { id: true, name: true, avatarUrl: true }
                }
            }
        });

        return commentWithUser;
    }

    async updateComment(userId: string, commentId: string, content: string) {
        const comment = await db.query.comments.findFirst({
            where: eq(comments.id, commentId),
        });

        if (!comment) throw new Error("Comment not found");
        if (comment.userId !== userId) throw new Error("Unauthorized");

        const now = new Date();
        const diff = now.getTime() - new Date(comment.createdAt!).getTime();
        if (diff > 2 * 60 * 1000) {
            throw new Error("Comment cannot be edited after 2 minutes");
        }

        const [updated] = await db.update(comments)
            .set({ content })
            .where(eq(comments.id, commentId))
            .returning();

        // Return with user for consistency if needed, or just updated fields
        return updated;
    }

    async deleteComment(userId: string, commentId: string) {
        const comment = await db.query.comments.findFirst({
            where: eq(comments.id, commentId),
        });

        if (!comment) throw new Error("Comment not found");
        if (comment.userId !== userId) throw new Error("Unauthorized");

        await db.delete(comments).where(eq(comments.id, commentId));
        return true;
    }

    async addSubTask(taskId: string, title: string) {
        const [subTask] = await db.insert(subTasks).values({
            taskId,
            title,
        }).returning();
        return subTask;
    }

    async addAttachment(userId: string, taskId: string, url: string, filename: string) {
        const [attachment] = await db.insert(attachments).values({
            uploaderId: userId,
            taskId,
            url,
            filename,
        }).returning();

        await analyticsService.logActivity(userId, "upload_attachment", taskId, "task", { filename });

        return attachment;
    }

    async getTaskById(taskId: string, userId?: string) {
        const task = await db.query.tasks.findFirst({
            where: eq(tasks.id, taskId),
            with: {
                assignee: {
                    columns: { id: true, name: true, email: true, avatarUrl: true }
                },
                creator: {
                    columns: { id: true, name: true, email: true, avatarUrl: true }
                },
                comments: {
                    with: {
                        user: {
                            columns: { id: true, name: true, avatarUrl: true }
                        }
                    },
                    orderBy: (comments, { desc }) => [desc(comments.createdAt)]
                },
                subTasks: true,
                attachments: true,
            }
        });

        if (!task) return null;

        if (userId) {
            // Check membership
            const member = await db.query.projectMembers.findFirst({
                where: and(
                    eq(projectMembers.projectId, task.projectId),
                    eq(projectMembers.userId, userId)
                )
            });
            if (!member) {
                throw new Error("Not a member of this project");
            }
        }

        return task;
    }

    async updateTask(taskId: string, userId: string, data: Partial<typeof tasks.$inferInsert>) {
        const { hasHigherRole, ROLE_HIERARCHY } = await import("../rbac/roleHierarchy");

        const task = await this.getTaskById(taskId, userId);
        if (!task) throw new Error("Task not found or access denied");

        // Get user's role in the project
        const member = await db.query.projectMembers.findFirst({
            where: and(
                eq(projectMembers.projectId, task.projectId),
                eq(projectMembers.userId, userId)
            ),
            with: { role: true }
        });

        if (!member) throw new Error("Not a member of this project");

        const isCreator = task.creatorId === userId;
        const isAssignee = task.assigneeId === userId;
        const roleName = member.role.name.toLowerCase();
        const isElevatedRole = ['owner', 'admin', 'project_manager'].includes(roleName);

        // Check edit permissions
        if (!isCreator && !isElevatedRole) {
            // Assignee can only update status
            if (isAssignee) {
                const allowedFields = ['status'];
                const attemptedFields = Object.keys(data);
                const disallowedFields = attemptedFields.filter(f => !allowedFields.includes(f));
                if (disallowedFields.length > 0) {
                    throw new Error("Assignees can only update task status");
                }
            } else {
                throw new Error("You do not have permission to edit this task");
            }
        }

        // Check if assignee is being changed
        const oldAssigneeId = task.assigneeId;
        const newAssigneeId = data.assigneeId;
        const assigneeChanged = newAssigneeId !== undefined && newAssigneeId !== oldAssigneeId;

        // Handle time tracking for status changes
        const updateData = { ...data };
        if (data.status === 'in-progress' && task.status !== 'in-progress' && !task.startedAt) {
            updateData.startedAt = new Date();
        }
        if (data.status === 'done' && task.status !== 'done') {
            updateData.completedAt = new Date();
        }

        const [updatedTask] = await db.update(tasks).set(updateData).where(eq(tasks.id, taskId)).returning();

        // Send notification if assignee changed
        if (assigneeChanged && newAssigneeId && newAssigneeId !== userId) {
            const newAssignee = await db.query.users.findFirst({
                where: eq(users.id, newAssigneeId),
                columns: { email: true, name: true }
            });

            const assigner = await db.query.users.findFirst({
                where: eq(users.id, userId),
                columns: { name: true }
            });

            if (newAssignee) {
                const taskLink = `/projects/${task.projectId}/tasks`;

                // Send email notification
                await sendEmail(newAssignee.email, "Task Assigned", taskAssignedTemplate(assigner?.name || "A team member", task.title, taskLink));

                // Send in-app notification
                const { NotificationService } = await import("../notifications/service");
                const notificationService = new NotificationService();
                await notificationService.createNotification(
                    newAssigneeId,
                    "task_assigned",
                    `Task assigned: ${task.title}`,
                    `${assigner?.name || "Someone"} assigned you to "${task.title}"`,
                    taskLink,
                    "task",
                    task.id
                );
            }
        }

        // Log completion if status changed to done
        if (data.status === "done") {
            await analyticsService.logActivity(userId, "complete_task", taskId, "task", { title: task.title });
        }

        return updatedTask;
    }

    async deleteTask(taskId: string, userId: string) {
        const task = await this.getTaskById(taskId, userId);
        if (!task) throw new Error("Task not found or access denied");

        // Cascade delete
        await db.delete(comments).where(eq(comments.taskId, taskId));
        await db.delete(subTasks).where(eq(subTasks.taskId, taskId));
        await db.delete(attachments).where(eq(attachments.taskId, taskId));
        await db.delete(tasks).where(eq(tasks.id, taskId));

        await analyticsService.logActivity(userId, "delete_task", taskId, "task", "Task deleted");
        return true;
    }

    async searchTasks(filters: {
        query?: string;
        projectId?: string;
        status?: string;
        assigneeId?: string;
        creatorId?: string;
        priority?: string;
        startDate?: string;
        endDate?: string;
        page?: number;
        limit?: number;
    }) {
        const page = filters.page || 1;
        const limit = filters.limit || 12;
        const offset = (page - 1) * limit;

        const conditions = [];

        if (filters.projectId) {
            conditions.push(eq(tasks.projectId, filters.projectId));
        }

        if (filters.status) {
            conditions.push(eq(tasks.status, filters.status));
        }

        if (filters.assigneeId) {
            if (filters.assigneeId === "unassigned") {
                conditions.push(sql`${tasks.assigneeId} IS NULL`);
            } else {
                conditions.push(eq(tasks.assigneeId, filters.assigneeId));
            }
        }

        if (filters.creatorId) {
            conditions.push(eq(tasks.creatorId, filters.creatorId));
        }

        if (filters.startDate && filters.endDate) {
            conditions.push(and(
                sql`${tasks.createdAt} >= ${filters.startDate}`,
                sql`${tasks.createdAt} <= ${filters.endDate}`
            ));
        }

        if (filters.query) {
            // Full-text search using to_tsvector and plainto_tsquery
            // We search in title and description
            conditions.push(sql`
                to_tsvector('english', ${tasks.title} || ' ' || coalesce(${tasks.description}, '')) @@ plainto_tsquery('english', ${filters.query})
            `);
        }

        const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

        // Get total count
        const countResult = await db.select({ count: sql<number>`count(*)` })
            .from(tasks)
            .where(whereClause);
        const total = Number(countResult[0]?.count || 0);

        // Get paginated tasks with relations
        const paginatedTasks = await db.query.tasks.findMany({
            where: whereClause,
            with: {
                assignee: {
                    columns: { id: true, name: true, email: true, avatarUrl: true }
                },
                creator: {
                    columns: { id: true, name: true, email: true, avatarUrl: true }
                },
                project: {
                    columns: { id: true, name: true }
                },
            },
            orderBy: (tasks, { desc }) => [desc(tasks.createdAt)],
            limit: limit,
            offset: offset,
        });

        return {
            tasks: paginatedTasks,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
                hasNext: page * limit < total,
                hasPrev: page > 1,
            }
        };
    }

    async getMyTasks(userId: string) {
        // Get all tasks assigned to user across all projects
        const myTasks = await db.query.tasks.findMany({
            where: eq(tasks.assigneeId, userId),
            with: {
                assignee: {
                    columns: { id: true, name: true, email: true, avatarUrl: true }
                },
                project: {
                    columns: { id: true, name: true }
                },
            },
            orderBy: (tasks, { asc, desc }) => [
                asc(tasks.dueDate), // Due soonest first (nulls last)
                desc(tasks.createdAt),
            ],
        });

        return myTasks;
    }
}
