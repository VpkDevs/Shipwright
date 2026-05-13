import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

const limits = {
  "/api/repos": { requests: 30, window: "1 m" },
  "/api/analyze": { requests: 10, window: "1 m" },
  "/api/generate": { requests: 5, window: "1 m" },
  "/api/create-pr": { requests: 3, window: "1 m" },
};

const ratelimits: Record<string, Ratelimit> = {};
const localRateLimits = new Map<string, { count: number; resetAt: number }>();
let redis: Redis | null = null;
let warnedAboutLocalFallback = false;

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

function getWindowMs(window: string): number {
  const [amountText, unit] = window.split(" ");
  const amount = Number.parseInt(amountText, 10);

  if (unit === "s") return amount * 1000;
  if (unit === "m") return amount * 60 * 1000;
  if (unit === "h") return amount * 60 * 60 * 1000;
  if (unit === "d") return amount * 24 * 60 * 60 * 1000;

  return 60 * 1000;
}

function checkLocalRateLimit(userId: string, route: string): RateLimitResult {
  const config = getLimitConfig(route);
  const key = `${userId}:${route}`;
  const now = Date.now();
  const windowMs = getWindowMs(config.window);

  for (const [storedKey, value] of localRateLimits) {
    if (value.resetAt <= now) {
      localRateLimits.delete(storedKey);
    }
  }

  const existing = localRateLimits.get(key);
  const bucket =
    existing && existing.resetAt > now ? existing : { count: 0, resetAt: now + windowMs };

  bucket.count += 1;
  localRateLimits.set(key, bucket);

  const reset = Math.ceil((bucket.resetAt - now) / 1000);
  const remaining = Math.max(config.requests - bucket.count, 0);
  const success = bucket.count <= config.requests;

  return {
    success,
    limit: config.requests,
    remaining,
    reset,
    retryAfter: success ? undefined : reset,
  };
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

  if (!ratelimit) {
    if (process.env.NODE_ENV === "production" && !warnedAboutLocalFallback) {
      console.warn(
        "Upstash Redis is not configured; using in-memory rate limiting for this process."
      );
      warnedAboutLocalFallback = true;
    }
    return checkLocalRateLimit(userId, route);
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
