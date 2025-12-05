import type { Context, Next } from "hono";
import { Redis } from "@upstash/redis";

// Initialize Redis client
const redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL!,
    token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

const WINDOW_SIZE_IN_SECONDS = 60;
const MAX_REQUESTS_PER_WINDOW = 100;
const BLOCK_DURATION_SECONDS = 300; // 5 minutes

export const rateLimitMiddleware = async (c: Context, next: Next) => {
    const ip = c.req.header("x-forwarded-for") || "unknown-ip";

    // 1. Check if IP is blocked
    const isBlocked = await redis.get(`blocked:${ip}`);
    if (isBlocked) {
        return c.json({ error: "Too many requests. You are temporarily blocked." }, 429);
    }

    // 2. Increment request count for current window
    const key = `ratelimit:${ip}`;
    const requests = await redis.incr(key);

    // 3. Set expiry for the key if it's the first request
    if (requests === 1) {
        await redis.expire(key, WINDOW_SIZE_IN_SECONDS);
    }

    // 4. Check limit
    if (requests > MAX_REQUESTS_PER_WINDOW) {
        // Block IP
        await redis.set(`blocked:${ip}`, "true", { ex: BLOCK_DURATION_SECONDS });
        return c.json({ error: "Too many requests. You are temporarily blocked." }, 429);
    }

    // 5. Add headers
    c.header("X-RateLimit-Limit", MAX_REQUESTS_PER_WINDOW.toString());
    c.header("X-RateLimit-Remaining", Math.max(0, MAX_REQUESTS_PER_WINDOW - requests).toString());
    c.header("X-RateLimit-Reset", WINDOW_SIZE_IN_SECONDS.toString());

    await next();
};
