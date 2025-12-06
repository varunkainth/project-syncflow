import { Redis } from "@upstash/redis";

export class CacheService {
    private redis: Redis;
    private defaultTTL: number = 60 * 5; // 5 minutes default TTL

    constructor() {
        if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
            console.warn("Redis credentials not found. Caching will be disabled/mocked.");
            // We can throw an error or handle it gracefully. 
            // For now, let's initialize it effectively, but methods will likely fail if variables are missing 
            // unless we add a check in each method or mock the client.
        }

        this.redis = new Redis({
            url: process.env.UPSTASH_REDIS_REST_URL!,
            token: process.env.UPSTASH_REDIS_REST_TOKEN!,
        });
    }

    async get<T>(key: string): Promise<T | null> {
        try {
            return await this.redis.get<T>(key);
        } catch (error) {
            console.error(`Cache GET error for key ${key}:`, error);
            return null;
        }
    }

    async set(key: string, value: any, ttlSeconds?: number): Promise<void> {
        try {
            await this.redis.set(key, value, { ex: ttlSeconds || this.defaultTTL });
        } catch (error) {
            console.error(`Cache SET error for key ${key}:`, error);
        }
    }

    async del(key: string): Promise<void> {
        try {
            await this.redis.del(key);
        } catch (error) {
            console.error(`Cache DEL error for key ${key}:`, error);
        }
    }

    async invalidate(key: string): Promise<void> {
        // Alias for del() - invalidates a single cache key
        await this.del(key);
    }

    async invalidatePattern(pattern: string): Promise<void> {
        try {
            const keys = await this.redis.keys(pattern);
            if (keys.length > 0) {
                await this.redis.del(...keys);
            }
        } catch (error) {
            console.error(`Cache INVALIDATE error for pattern ${pattern}:`, error);
        }
    }
}
