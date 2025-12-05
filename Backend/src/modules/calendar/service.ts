import { db } from "../../db/index";
import { tasks } from "../../db/schema";
import { eq } from "drizzle-orm";
import ical from "ical-generator";
import { google } from "googleapis";

export class CalendarService {
    async generateICal(userId: string) {
        const userTasks = await db.query.tasks.findMany({
            where: eq(tasks.assigneeId, userId),
        });

        const calendar = ical({ name: "AntiGravity Tasks" });

        for (const task of userTasks) {
            calendar.createEvent({
                start: task.createdAt || new Date(),
                end: task.createdAt || new Date(), // TODO: Add dueDate to tasks schema for better calendar support
                summary: task.title,
                description: task.description || "",
                url: `http://localhost:3000/tasks/${task.id}`,
            });
        }

        return calendar.toString();
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

        // Fetch tasks
        const userTasks = await db.query.tasks.findMany({
            where: eq(tasks.assigneeId, userId),
        });

        const calendar = google.calendar({ version: "v3", auth: oauth2Client });

        // Create a dedicated calendar for AntiGravity
        // Check if exists first? For simplicity, let's just add to primary or create new one.
        // Let's add to primary for now.

        for (const task of userTasks) {
            await calendar.events.insert({
                calendarId: "primary",
                requestBody: {
                    summary: `[AntiGravity] ${task.title}`,
                    description: task.description,
                    start: { dateTime: (task.createdAt || new Date()).toISOString() },
                    end: { dateTime: (task.createdAt || new Date()).toISOString() }, // TODO: Use due date
                },
            });
        }

        return { success: true, count: userTasks.length };
    }
}
