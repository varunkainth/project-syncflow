import { db } from "../../db/index";
import { activityLogs, tasks, projects, projectMembers, users } from "../../db/schema";
import { eq, and, count, sql, desc, or, inArray } from "drizzle-orm";

export class AnalyticsService {
    async logActivity(userId: string, action: string, entityId: string, entityType: string, metadata?: any) {
        await db.insert(activityLogs).values({
            userId,
            action,
            entityId,
            entityType,
            metadata: metadata ? JSON.stringify(metadata) : null,
        });
    }

    async getUserActivity(userId: string) {
        return await db.query.activityLogs.findMany({
            where: eq(activityLogs.userId, userId),
            orderBy: (logs, { desc }) => [desc(logs.createdAt)],
            limit: 50,
        });
    }

    async getProductivityStats(userId: string) {
        // Tasks completed vs total
        const totalTasks = await db.select({ count: count() }).from(tasks).where(eq(tasks.assigneeId, userId));
        const completedTasks = await db.select({ count: count() }).from(tasks).where(and(eq(tasks.assigneeId, userId), eq(tasks.status, "done")));

        return {
            totalTasks: totalTasks[0].count,
            completedTasks: completedTasks[0].count,
            completionRate: totalTasks[0].count > 0 ? (completedTasks[0].count / totalTasks[0].count) * 100 : 0,
        };
    }

    async getProjectProgress(projectId: string) {
        const totalTasks = await db.select({ count: count() }).from(tasks).where(eq(tasks.projectId, projectId));
        const completedTasks = await db.select({ count: count() }).from(tasks).where(and(eq(tasks.projectId, projectId), eq(tasks.status, "done")));

        return {
            projectId,
            progress: totalTasks[0].count > 0 ? (completedTasks[0].count / totalTasks[0].count) * 100 : 0,
        };
    }

    async getDashboardStats(userId: string) {
        // Get all projects where user is a member
        const userProjects = await db.select({ projectId: projectMembers.projectId })
            .from(projectMembers)
            .where(eq(projectMembers.userId, userId));

        const projectIds = userProjects.map(p => p.projectId);

        // Total projects count
        const totalProjects = projectIds.length;

        // Get task stats across all user's projects
        let totalTasks = 0;
        let activeTasks = 0;
        let completedTasks = 0;
        let overdueTasks = 0;

        if (projectIds.length > 0) {
            const taskStats = await db.select({
                status: tasks.status,
                count: count(),
            })
                .from(tasks)
                .where(inArray(tasks.projectId, projectIds))
                .groupBy(tasks.status);

            for (const stat of taskStats) {
                totalTasks += Number(stat.count);
                if (stat.status === "done") {
                    completedTasks = Number(stat.count);
                } else {
                    activeTasks += Number(stat.count);
                }
            }

            // Overdue tasks (not done and due date is past)
            const overdueResult = await db.select({ count: count() })
                .from(tasks)
                .where(and(
                    inArray(tasks.projectId, projectIds),
                    sql`${tasks.status} != 'done'`,
                    sql`${tasks.dueDate} < NOW()`
                ));
            overdueTasks = Number(overdueResult[0]?.count || 0);
        }

        // Get unique team members across all projects
        let teamMembersCount = 0;
        if (projectIds.length > 0) {
            const membersResult = await db.selectDistinct({ userId: projectMembers.userId })
                .from(projectMembers)
                .where(and(
                    inArray(projectMembers.projectId, projectIds),
                    eq(projectMembers.status, "active")
                ));
            teamMembersCount = membersResult.length;
        }

        // Get recent activity (last 10 activities across user's projects)
        const recentActivity = await db.query.activityLogs.findMany({
            where: eq(activityLogs.userId, userId),
            orderBy: [desc(activityLogs.createdAt)],
            limit: 10,
        });

        // Get activity with user details
        const activityWithUsers = await Promise.all(
            recentActivity.map(async (log) => {
                const user = await db.query.users.findFirst({
                    where: eq(users.id, log.userId),
                    columns: { id: true, name: true, avatarUrl: true }
                });
                return {
                    ...log,
                    user: user || { id: log.userId, name: "Unknown", avatarUrl: null }
                };
            })
        );

        // Get upcoming tasks (due in next 7 days, not completed)
        const upcomingTasks = await db.query.tasks.findMany({
            where: and(
                or(
                    eq(tasks.assigneeId, userId),
                    eq(tasks.creatorId, userId)
                ),
                sql`${tasks.status} != 'done'`,
                sql`${tasks.dueDate} IS NOT NULL`,
                sql`${tasks.dueDate} >= NOW()`,
                sql`${tasks.dueDate} <= NOW() + INTERVAL '7 days'`
            ),
            with: {
                project: { columns: { id: true, name: true } }
            },
            orderBy: [sql`${tasks.dueDate} ASC`],
            limit: 5,
        });

        // Get my assigned tasks (top 5, not completed)
        const myTasks = await db.query.tasks.findMany({
            where: and(
                eq(tasks.assigneeId, userId),
                sql`${tasks.status} != 'done'`
            ),
            with: {
                project: { columns: { id: true, name: true } }
            },
            orderBy: [sql`COALESCE(${tasks.dueDate}, '9999-12-31') ASC`],
            limit: 5,
        });

        return {
            stats: {
                totalProjects,
                activeTasks,
                completedTasks,
                teamMembers: teamMembersCount,
                overdueTasks,
            },
            recentActivity: activityWithUsers,
            upcomingTasks,
            myTasks,
        };
    }
}

