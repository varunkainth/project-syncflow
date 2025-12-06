import { db } from "../../db/index";
import { tasks } from "../../db/schema";
import { eq, and, isNotNull, sql } from "drizzle-orm";
import ical, { ICalEventStatus, ICalAlarmType } from "ical-generator";
import { google } from "googleapis";

export class CalendarService {
    async generateICal(userId: string, projectId?: string) {
        // Build query conditions
        const conditions = [eq(tasks.assigneeId, userId)];

        if (projectId) {
            conditions.push(eq(tasks.projectId, projectId));
        }

        const userTasks = await db.query.tasks.findMany({
            where: and(...conditions),
            with: {
                project: { columns: { id: true, name: true } }
            }
        });

        const calendar = ical({
            name: "AntiGravity Tasks",
            timezone: "UTC",
            prodId: { company: "AntiGravity", product: "Task Management" }
        });

        for (const task of userTasks) {
            // Determine event dates
            const startDate = task.startedAt || task.createdAt || new Date();
            const endDate = task.dueDate || startDate;

            // Map task status to iCal status
            let icalStatus: ICalEventStatus | undefined;
            if (task.status === "done") {
                icalStatus = ICalEventStatus.CONFIRMED;
            } else if (task.status === "in-progress") {
                icalStatus = ICalEventStatus.TENTATIVE;
            }

            // Priority mapping (iCal uses 1-9, where 1 = high, 9 = low)
            let priority: number | undefined;
            if (task.priority === "high") priority = 1;
            else if (task.priority === "medium") priority = 5;
            else if (task.priority === "low") priority = 9;

            // Build description with metadata
            const descriptionParts = [];
            if (task.description) descriptionParts.push(task.description);
            if (task.priority) descriptionParts.push(`Priority: ${task.priority}`);
            if (task.status) descriptionParts.push(`Status: ${task.status}`);
            if (task.project) descriptionParts.push(`Project: ${task.project.name}`);

            const event = calendar.createEvent({
                start: startDate,
                end: endDate,
                allDay: !task.dueDate, // If no due date, mark as all-day
                summary: task.title,
                description: descriptionParts.join("\n"),
                url: `${process.env.FRONTEND_URL || "http://localhost:5173"}/projects/${task.projectId}/tasks`,
                status: icalStatus,
                priority: priority,
                categories: task.project ? [{ name: task.project.name }] : undefined,
            });

            // Add reminder alarm for tasks with due dates
            if (task.dueDate && task.status !== "done") {
                event.createAlarm({
                    type: ICalAlarmType.display,
                    trigger: 3600, // 1 hour before
                    description: `Task due: ${task.title}`,
                });
            }
        }

        return calendar.toString();
    }

    async generateSingleTaskICal(taskId: string) {
        const task = await db.query.tasks.findFirst({
            where: eq(tasks.id, taskId),
            with: {
                project: { columns: { id: true, name: true } },
                assignee: { columns: { id: true, name: true } }
            }
        });

        if (!task) {
            throw new Error("Task not found");
        }

        const calendar = ical({
            name: `Task: ${task.title}`,
            timezone: "UTC",
            prodId: { company: "AntiGravity", product: "Task Management" }
        });

        // Determine event dates
        const startDate = task.startedAt || task.createdAt || new Date();
        const endDate = task.dueDate || startDate;

        // Map task status to iCal status
        let icalStatus: ICalEventStatus | undefined;
        if (task.status === "done") {
            icalStatus = ICalEventStatus.CONFIRMED;
        } else if (task.status === "in-progress") {
            icalStatus = ICalEventStatus.TENTATIVE;
        }

        // Priority mapping
        let priority: number | undefined;
        if (task.priority === "high") priority = 1;
        else if (task.priority === "medium") priority = 5;
        else if (task.priority === "low") priority = 9;

        // Build description
        const descriptionParts = [];
        if (task.description) descriptionParts.push(task.description);
        if (task.priority) descriptionParts.push(`Priority: ${task.priority}`);
        if (task.status) descriptionParts.push(`Status: ${task.status}`);
        if (task.project) descriptionParts.push(`Project: ${task.project.name}`);
        if (task.assignee) descriptionParts.push(`Assigned to: ${task.assignee.name}`);

        const event = calendar.createEvent({
            start: startDate,
            end: endDate,
            allDay: !task.dueDate,
            summary: task.title,
            description: descriptionParts.join("\n"),
            url: `${process.env.FRONTEND_URL || "http://localhost:5173"}/projects/${task.projectId}/tasks`,
            status: icalStatus,
            priority: priority,
            categories: task.project ? [{ name: task.project.name }] : undefined,
        });

        // Add reminder alarm for tasks with due dates
        if (task.dueDate && task.status !== "done") {
            event.createAlarm({
                type: ICalAlarmType.display,
                trigger: 3600, // 1 hour before
                description: `Task due: ${task.title}`,
            });
        }

        return {
            icalString: calendar.toString(),
            filename: `task-${task.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.ics`
        };
    }

    async getTasksForDateRange(userId: string, startDate: Date, endDate: Date, projectId?: string) {
        // Build query conditions
        const conditions = [
            eq(tasks.assigneeId, userId),
            isNotNull(tasks.dueDate),
            sql`${tasks.dueDate} >= ${startDate.toISOString()}`,
            sql`${tasks.dueDate} <= ${endDate.toISOString()}`
        ];

        if (projectId) {
            conditions.push(eq(tasks.projectId, projectId));
        }

        return await db.query.tasks.findMany({
            where: and(...conditions),
            with: {
                project: { columns: { id: true, name: true } },
                assignee: { columns: { id: true, name: true, avatarUrl: true } }
            },
            orderBy: (tasks, { asc }) => [asc(tasks.dueDate)]
        });
    }

    getGoogleAuthURL() {
        const oauth2Client = new google.auth.OAuth2(
            process.env.GOOGLE_CLIENT_ID,
            process.env.GOOGLE_CLIENT_SECRET,
            process.env.GOOGLE_REDIRECT_URI || "http://localhost:3000/calendar/google/callback"
        );

        const scopes = ["https://www.googleapis.com/auth/calendar"];

        return oauth2Client.generateAuthUrl({
            access_type: "offline",
            scope: scopes,
        });
    }

    async syncToGoogle(userId: string, code: string) {
        const oauth2Client = new google.auth.OAuth2(
            process.env.GOOGLE_CLIENT_ID,
            process.env.GOOGLE_CLIENT_SECRET,
            process.env.GOOGLE_REDIRECT_URI || "http://localhost:3000/calendar/google/callback"
        );

        const { tokens } = await oauth2Client.getToken(code);
        oauth2Client.setCredentials(tokens);

        // Fetch tasks with due dates
        const userTasks = await db.query.tasks.findMany({
            where: and(
                eq(tasks.assigneeId, userId),
                sql`${tasks.status} != 'done'`
            ),
            with: {
                project: { columns: { id: true, name: true } }
            }
        });

        const calendar = google.calendar({ version: "v3", auth: oauth2Client });

        let syncedCount = 0;
        for (const task of userTasks) {
            const startDate = task.dueDate || task.createdAt || new Date();

            // For tasks with due dates, create timed events
            // For tasks without, create all-day events
            const eventBody: any = {
                summary: `[AntiGravity] ${task.title}`,
                description: [
                    task.description,
                    task.priority ? `Priority: ${task.priority}` : null,
                    task.project ? `Project: ${task.project.name}` : null
                ].filter(Boolean).join("\n"),
                status: task.status === "in-progress" ? "tentative" : "confirmed",
            };

            if (task.dueDate) {
                // Timed event
                eventBody.start = { dateTime: startDate.toISOString() };
                eventBody.end = { dateTime: startDate.toISOString() };

                // Add reminder
                eventBody.reminders = {
                    useDefault: false,
                    overrides: [
                        { method: "popup", minutes: 60 },
                        { method: "email", minutes: 1440 } // 24 hours
                    ]
                };
            } else {
                // All-day event
                const dateStr = startDate.toISOString().split("T")[0];
                eventBody.start = { date: dateStr };
                eventBody.end = { date: dateStr };
            }

            await calendar.events.insert({
                calendarId: "primary",
                requestBody: eventBody,
            });
            syncedCount++;
        }

        return { success: true, count: syncedCount };
    }
}
