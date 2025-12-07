import type { Context, Next } from "hono";
import { verify } from "hono/jwt";
import { getCookie } from "hono/cookie";

const JWT_SECRET = process.env.JWT_SECRET || "supersecretjwtsecret";

export const authMiddleware = async (c: Context, next: Next) => {
    let token: string | undefined;
    const authHeader = c.req.header("Authorization");

    if (authHeader && authHeader.startsWith("Bearer ")) {
        token = authHeader.split(" ")[1];
    } else {
        token = getCookie(c, "accessToken");
    }

    if (!token) {
        return c.json({ error: "Unauthorized: No token provided" }, 401);
    }
    try {
        const payload = await verify(token, JWT_SECRET!);
        c.set("user", payload); // Payload contains { id, email }
        await next();
    } catch (error) {
        console.error("Token verification failed:", error);
        return c.json({ error: "Unauthorized: Invalid token" }, 401);
    }
};
