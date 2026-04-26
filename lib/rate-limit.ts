import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { log } from "./logger";

const redisUrl = process.env.UPSTASH_REDIS_REST_URL;
const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN;
const hasRedisConfig = Boolean(redisUrl && redisToken);

function createRedisClient() {
  if (!redisUrl || !redisToken) {
    return null;
  }

  return new Redis({ url: redisUrl, token: redisToken });
}

const redis = hasRedisConfig ? createRedisClient() : null;

const limits = {
  "/api/repos": { requests: 30, window: "1 m" },
  "/api/analyze": { requests: 10, window: "1 m" },
  "/api/generate": { requests: 5, window: "1 m" },
  "/api/create-pr": { requests: 3, window: "1 m" },
};

const ratelimits: Record<string, Ratelimit> = {};

function getConfig(route: string) {
  return (
    limits[route as keyof typeof limits] || {
      requests: 10,
      window: "1 m",
    }
  );
}

function getRateLimit(route: string) {
  if (!redis) {
    return null;
  }

  if (!ratelimits[route]) {
    const config = getConfig(route);

    ratelimits[route] = new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(
        config.requests,
        config.window as "1 s" | "1 m" | "1 h" | "1 d"
      ),
    });
  }
  return ratelimits[route];
}

function createFallbackResult(route: string): RateLimitResult {
  const config = getConfig(route);

  return {
    success: true,
    limit: config.requests,
    remaining: config.requests,
    reset: 0,
  };
}

export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number;
  retryAfter?: number;
}

interface UpstashLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  reset?: number;
  resetAfterMs?: number;
}

export async function checkRateLimit(userId: string, route: string): Promise<RateLimitResult> {
  const ratelimit = getRateLimit(route);

  if (!ratelimit) {
    return createFallbackResult(route);
  }

  const key = `${userId}:${route}`;

  try {
    const result = (await ratelimit.limit(key)) as UpstashLimitResult;

    const resetMs = result.resetAfterMs || result.reset || 0;
    const resetSeconds = resetMs ? Math.ceil(resetMs / 1000) : 0;

    return {
      success: result.success,
      limit: result.limit,
      remaining: result.remaining,
      reset: resetSeconds,
      retryAfter: resetSeconds > 0 ? resetSeconds : undefined,
    };
  } catch (error) {
    log.warn({ error, route }, "Rate limiting unavailable, allowing request");
    return createFallbackResult(route);
  }
}
