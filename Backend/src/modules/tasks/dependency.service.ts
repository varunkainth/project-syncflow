import { db } from "../../db/index";
import { taskDependencies, tasks } from "../../db/schema";
import { eq, and, or, inArray } from "drizzle-orm";

export type DependencyType = "blocks" | "related";

export interface TaskDependency {
    dependentTaskId: string;
    dependsOnTaskId: string;
    dependencyType: DependencyType;
    createdAt: Date;
    dependentTask?: any;
    dependsOnTask?: any;
}

export class DependencyService {
    // Add a dependency between tasks
    async addDependency(
        dependentTaskId: string,
        dependsOnTaskId: string,
        type: DependencyType = "blocks"
    ) {
        // Prevent self-dependency
        if (dependentTaskId === dependsOnTaskId) {
            throw new Error("A task cannot depend on itself");
        }

        // Check if dependency already exists
        const existing = await db.query.taskDependencies.findFirst({
            where: and(
                eq(taskDependencies.dependentTaskId, dependentTaskId),
                eq(taskDependencies.dependsOnTaskId, dependsOnTaskId)
            ),
        });

        if (existing) {
            throw new Error("Dependency already exists");
        }

        // Check for circular dependency
        const hasCircular = await this.checkCircularDependency(dependentTaskId, dependsOnTaskId);
        if (hasCircular) {
            throw new Error("This would create a circular dependency");
        }

        // Check that both tasks exist and belong to the same project
        const [task1, task2] = await Promise.all([
            db.query.tasks.findFirst({ where: eq(tasks.id, dependentTaskId) }),
            db.query.tasks.findFirst({ where: eq(tasks.id, dependsOnTaskId) }),
        ]);

        if (!task1 || !task2) {
            throw new Error("One or both tasks not found");
        }

        if (task1.projectId !== task2.projectId) {
            throw new Error("Tasks must belong to the same project");
        }

        await db.insert(taskDependencies).values({
            dependentTaskId,
            dependsOnTaskId,
            dependencyType: type,
        });

        return { success: true };
    }

    // Remove a dependency
    async removeDependency(dependentTaskId: string, dependsOnTaskId: string) {
        await db
            .delete(taskDependencies)
            .where(
                and(
                    eq(taskDependencies.dependentTaskId, dependentTaskId),
                    eq(taskDependencies.dependsOnTaskId, dependsOnTaskId)
                )
            );

        return { success: true };
    }

    // Get dependencies for a task (what this task depends on)
    async getTaskDependencies(taskId: string) {
        return await db.query.taskDependencies.findMany({
            where: eq(taskDependencies.dependentTaskId, taskId),
            with: {
                dependsOnTask: {
                    columns: { id: true, title: true, status: true },
                },
            },
        });
    }

    // Get dependents for a task (what tasks depend on this task)
    async getTaskDependents(taskId: string) {
        return await db.query.taskDependencies.findMany({
            where: eq(taskDependencies.dependsOnTaskId, taskId),
            with: {
                dependentTask: {
                    columns: { id: true, title: true, status: true },
                },
            },
        });
    }

    // Check if a task is blocked (has unfinished dependencies)
    async isTaskBlocked(taskId: string): Promise<boolean> {
        const dependencies = await this.getTaskDependencies(taskId);

        for (const dep of dependencies) {
            if (dep.dependencyType === "blocks" && dep.dependsOnTask?.status !== "done") {
                return true;
            }
        }

        return false;
    }

    // Get blocking tasks for a task
    async getBlockingTasks(taskId: string) {
        const dependencies = await this.getTaskDependencies(taskId);

        return dependencies
            .filter((dep) => dep.dependencyType === "blocks" && dep.dependsOnTask?.status !== "done")
            .map((dep) => dep.dependsOnTask);
    }

    // Check for circular dependency using DFS
    private async checkCircularDependency(
        startTaskId: string,
        targetTaskId: string
    ): Promise<boolean> {
        const visited = new Set<string>();
        const stack = [targetTaskId];

        while (stack.length > 0) {
            const currentId = stack.pop()!;

            if (currentId === startTaskId) {
                return true; // Found circular dependency
            }

            if (visited.has(currentId)) {
                continue;
            }
            visited.add(currentId);

            // Get what this task depends on
            const deps = await db.query.taskDependencies.findMany({
                where: eq(taskDependencies.dependentTaskId, currentId),
            });

            for (const dep of deps) {
                stack.push(dep.dependsOnTaskId);
            }
        }

        return false;
    }

    // Get all dependencies for a project (for visualization)
    async getProjectDependencies(projectId: string) {
        const projectTasks = await db.query.tasks.findMany({
            where: eq(tasks.projectId, projectId),
            columns: { id: true },
        });

        const taskIds = projectTasks.map((t) => t.id);

        if (taskIds.length === 0) return [];

        return await db.query.taskDependencies.findMany({
            where: or(
                inArray(taskDependencies.dependentTaskId, taskIds),
                inArray(taskDependencies.dependsOnTaskId, taskIds)
            ),
            with: {
                dependentTask: { columns: { id: true, title: true, status: true } },
                dependsOnTask: { columns: { id: true, title: true, status: true } },
            },
        });
    }
}
