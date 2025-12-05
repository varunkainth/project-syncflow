import type { Context } from "hono";
import { CalendarService } from "./service";
import { jsonEncrypted } from "../../middleware/encryption";

const calendarService = new CalendarService();

export const getICal = async (c: Context) => {
    const user = c.get("user");
    if (!user) return c.json({ error: "Unauthorized" }, 401);

    try {
        const icalString = await calendarService.generateICal(user.id);
        c.header("Content-Type", "text/calendar; charset=utf-8");
        c.header("Content-Disposition", 'attachment; filename="tasks.ics"');
        return c.body(icalString);
    } catch (error: any) {
        return c.json({ error: error.message }, 400);
    }
};

export const connectGoogle = (c: Context) => {
    return c.redirect(calendarService.getGoogleAuthURL());
};

export const googleCallback = async (c: Context) => {
    const code = c.req.query("code");
    const user = c.get("user"); // This might be tricky if callback comes from browser without auth header
    // Usually, we'd store state in cookie to link back to user, or user is already logged in via session cookie.
    // Since we use JWT header, this callback endpoint needs to be called from Frontend with the code, OR
    // we handle it as a pure backend exchange where Frontend sends the code to a POST endpoint.

    // Better approach:
    // 1. Frontend calls GET /calendar/google/connect -> gets URL -> redirects user.
    // 2. User approves -> Google redirects to Frontend Route (e.g. /settings/calendar/callback?code=...)
    // 3. Frontend takes code and calls POST /calendar/google/sync { code } with Authorization header.

    // So let's change this to a sync endpoint that accepts code in body.
    return c.json({ error: "Use POST /calendar/google/sync with code" }, 400);
};

export const syncGoogle = async (c: Context) => {
    const user = c.get("user");
    if (!user) return c.json({ error: "Unauthorized" }, 401);

    const body = c.get("decryptedBody") || await c.req.json();
    const { code } = body;

    if (!code) return c.json({ error: "Code required" }, 400);

    try {
        const result = await calendarService.syncToGoogle(user.id, code);
        return jsonEncrypted(c, result);
    } catch (error: any) {
        return c.json({ error: error.message }, 400);
    }
};
