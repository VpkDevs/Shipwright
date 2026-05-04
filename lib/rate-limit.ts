import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

const limits = {
  "/api/repos": { requests: 30, window: "1 m" },
  "/api/analyze": { requests: 10, window: "1 m" },
  "/api/generate": { requests: 5, window: "1 m" },
  "/api/create-pr": { requests: 3, window: "1 m" },
};

const ratelimits: Record<string, Ratelimit> = {};
let redis: Redis | null = null;

function getLimitConfig(route: string) {
  return (
    limits[route as keyof typeof limits] || {
      requests: 10,
      window: "1 m",
    }
  );
}

function getRedisClient(): Redis | null {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!url || !token) {
    return null;
  }

  if (!redis) {
    redis = new Redis({ url, token });
  }

  return redis;
}

function getRateLimit(route: string) {
  const redisClient = getRedisClient();
  if (!redisClient) {
    return null;
  }

  if (!ratelimits[route]) {
    const config = getLimitConfig(route);
    ratelimits[route] = new Ratelimit({
      redis: redisClient,
      limiter: Ratelimit.slidingWindow(
        config.requests,
        config.window as "1 s" | "1 m" | "1 h" | "1 d"
      ),
    });
  }
  return ratelimits[route];
}

export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number;
  retryAfter?: number;
}

export async function checkRateLimit(userId: string, route: string): Promise<RateLimitResult> {
  const ratelimit = getRateLimit(route);
  const config = getLimitConfig(route);

  if (!ratelimit) {
    return {
      success: true,
      limit: config.requests,
      remaining: config.requests,
      reset: 0,
    };
  }

  const key = `${userId}:${route}`;

  const result = await ratelimit.limit(key);

  const resetMs = (result as any).resetAfterMs || (result as any).reset || 0;
  const resetSeconds = resetMs ? Math.ceil(resetMs / 1000) : 0;

  return {
    success: result.success,
    limit: result.limit,
    remaining: result.remaining,
    reset: resetSeconds,
    retryAfter: resetSeconds > 0 ? resetSeconds : undefined,
  };
}
