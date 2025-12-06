import { db } from "../../db/index";
import { taskLabels, taskLabelAssignments, tasks } from "../../db/schema";
import { eq, and, inArray } from "drizzle-orm";

export interface Label {
    id: string;
    projectId: string;
    name: string;
    color: string;
    createdAt: Date;
}

export class LabelService {
    // Create a new label for a project
    async createLabel(projectId: string, name: string, color: string) {
        // Check if label with same name exists in project
        const existing = await db.query.taskLabels.findFirst({
            where: and(
                eq(taskLabels.projectId, projectId),
                eq(taskLabels.name, name)
            ),
        });

        if (existing) {
            throw new Error("Label with this name already exists in the project");
        }

        const [label] = await db
            .insert(taskLabels)
            .values({
                projectId,
                name,
                color,
            })
            .returning();

        return label;
    }

    // Get all labels for a project
    async getProjectLabels(projectId: string) {
        return await db.query.taskLabels.findMany({
            where: eq(taskLabels.projectId, projectId),
            orderBy: (labels, { asc }) => [asc(labels.name)],
        });
    }

    // Update a label
    async updateLabel(labelId: string, data: { name?: string; color?: string }) {
        const [label] = await db
            .update(taskLabels)
            .set(data)
            .where(eq(taskLabels.id, labelId))
            .returning();

        return label;
    }

    // Delete a label (cascade deletes assignments)
    async deleteLabel(labelId: string) {
        await db.delete(taskLabels).where(eq(taskLabels.id, labelId));
        return { success: true };
    }

    // Assign a label to a task
    async assignLabelToTask(taskId: string, labelId: string) {
        // Check if already assigned
        const existing = await db.query.taskLabelAssignments.findFirst({
            where: and(
                eq(taskLabelAssignments.taskId, taskId),
                eq(taskLabelAssignments.labelId, labelId)
            ),
        });

        if (existing) {
            return existing; // Already assigned
        }

        await db.insert(taskLabelAssignments).values({
            taskId,
            labelId,
        });

        return { success: true };
    }

    // Remove a label from a task
    async removeLabelFromTask(taskId: string, labelId: string) {
        await db
            .delete(taskLabelAssignments)
            .where(
                and(
                    eq(taskLabelAssignments.taskId, taskId),
                    eq(taskLabelAssignments.labelId, labelId)
                )
            );

        return { success: true };
    }

    // Get all labels for a task
    async getTaskLabels(taskId: string) {
        const assignments = await db.query.taskLabelAssignments.findMany({
            where: eq(taskLabelAssignments.taskId, taskId),
            with: {
                label: true,
            },
        });

        return assignments.map((a) => a.label);
    }

    // Set labels for a task (replace all existing)
    async setTaskLabels(taskId: string, labelIds: string[]) {
        // Remove all existing assignments
        await db
            .delete(taskLabelAssignments)
            .where(eq(taskLabelAssignments.taskId, taskId));

        // Add new assignments
        if (labelIds.length > 0) {
            await db.insert(taskLabelAssignments).values(
                labelIds.map((labelId) => ({
                    taskId,
                    labelId,
                }))
            );
        }

        return { success: true };
    }

    // Get tasks by label
    async getTasksByLabel(labelId: string) {
        const assignments = await db.query.taskLabelAssignments.findMany({
            where: eq(taskLabelAssignments.labelId, labelId),
            with: {
                task: true,
            },
        });

        return assignments.map((a) => a.task);
    }

    // Get label usage count
    async getLabelUsageCount(labelId: string): Promise<number> {
        const assignments = await db.query.taskLabelAssignments.findMany({
            where: eq(taskLabelAssignments.labelId, labelId),
        });

        return assignments.length;
    }
}
